#!/usr/bin/env perl
# $Id: fmtutil.pl 38582 2015-10-07 22:32:58Z karl $
# fmtutil - utility to maintain format files.
# (Maintained in TeX Live:Master/texmf-dist/scripts/texlive.)
# 
# Copyright 2014-2015 Norbert Preining
# This file is licensed under the GNU General Public License version 2
# or any later version.
#
# History:
# Original shell script (C) 2001 Thomas Esser, public domain

my $TEXMFROOT;

BEGIN {
  $^W = 1;
  $TEXMFROOT = `kpsewhich -var-value=TEXMFROOT`;
  if ($?) {
    die "$0: kpsewhich -var-value=TEXMFROOT failed, aborting early.\n";
  }
  chomp($TEXMFROOT);
  unshift(@INC, "$TEXMFROOT/tlpkg", "$TEXMFROOT/texmf-dist/scripts/texlive");
  require "mktexlsr.pl";
  TeX::Update->import();
}


my $svnid = '$Id: fmtutil.pl 38582 2015-10-07 22:32:58Z karl $';
my $lastchdate = '$Date: 2015-10-08 00:32:58 +0200 (Thu, 08 Oct 2015) $';
$lastchdate =~ s/^\$Date:\s*//;
$lastchdate =~ s/ \(.*$//;
my $svnrev = '$Revision: 38582 $';
$svnrev =~ s/^\$Revision:\s*//;
$svnrev =~ s/\s*\$$//;
my $version = "r$svnrev ($lastchdate)";

use strict;
use Getopt::Long qw(:config no_autoabbrev ignore_case_always);
use File::Basename;
use File::Copy;
use Cwd;


#
# don't import anything automatically, this requires us to explicitly
# call functions with TeXLive::TLUtils prefix, and makes it easier to
# find and if necessary remove references to TLUtils
use TeXLive::TLUtils qw();

#use Data::Dumper;
#$Data::Dumper::Indent = 1;


#
# numerical constants
my $FMT_NOTSELECTED = 0;
my $FMT_DISABLED    = 1;
my $FMT_FAILURE     = 2;
my $FMT_SUCCESS     = 3;
my $FMT_NOTAVAIL    = 4;

my $nul = (win32() ? 'nul' : '/dev/null');
my $sep = (win32() ? ';' : ':');

my @deferred_stderr;
my @deferred_stdout;

(our $prg = basename($0)) =~ s/\.pl$//;

# sudo sometimes does not reset the home dir of root, check on that
# see more comments at the definition of the function itself
# this function checks by itself whether it is running on windows or not
reset_root_home();

chomp(our $TEXMFDIST = `kpsewhich --var-value=TEXMFDIST`);
chomp(our $TEXMFVAR = `kpsewhich -var-value=TEXMFVAR`);
chomp(our $TEXMFSYSVAR = `kpsewhich -var-value=TEXMFSYSVAR`);
chomp(our $TEXMFCONFIG = `kpsewhich -var-value=TEXMFCONFIG`);
chomp(our $TEXMFSYSCONFIG = `kpsewhich -var-value=TEXMFSYSCONFIG`);
chomp(our $TEXMFHOME = `kpsewhich -var-value=TEXMFHOME`);

# make sure that on windows *everything* is in lower case for comparison
if (win32()) {
  $TEXMFDIST = lc($TEXMFDIST);
  $TEXMFVAR = lc($TEXMFVAR);
  $TEXMFSYSVAR = lc($TEXMFSYSVAR);
  $TEXMFCONFIG = lc($TEXMFCONFIG);
  $TEXMFSYSCONFIG = lc($TEXMFSYSCONFIG);
  $TEXMFROOT = lc($TEXMFROOT);
  $TEXMFHOME = lc($TEXMFHOME);
}

#
# these need to be our since they are used from the 
# functions in TLUtils.pm
our $texmfconfig = $TEXMFCONFIG;
our $texmfvar    = $TEXMFVAR;
our $alldata;
our %opts = ( quiet => 0 );
our @cmdline_options = (
  "sys",
  "cnffile=s@", 
  "fmtdir=s",
  "no-engine-subdir",
  "no-error-if-no-engine=s",
  "no-error-if-no-format",
  "quiet|silent|q",
  "test",
  "dolinks",
  "force",
  "all",
  "missing",
  "nohash",
  "refresh",
  "byengine=s",
  "byfmt=s",
  "byhyphen=s",
  "enablefmt=s",
  "disablefmt=s",
  "listcfg",
  "catcfg",
  "showhyphen=s",
  "edit",
  "version",
  "help|h",
  "strict",
  "_dumpdata",
  );

my $updLSR;
my $mktexfmtMode = 0;
# make sure we only echo out *one* line in mktexfmt mode
my $mktexfmtFirst = 1;

&main();

###############

sub main {
  if ($prg eq "mktexfmt") {
    # mktexfmtMode: if called as mktexfmt, set to true. Will echo the
    # first generated filename after successful generation to stdout then
    # (and nothing else), since kpathsea can only deal with one.
    $mktexfmtMode = 1;
    GetOptions ( "help" => \$opts{'help'}, "version" => \$opts{'version'} )
        or die "Unknown option in command line arguments\n";
    if ($ARGV[0]) {
      if ($ARGV[0] =~ m/^(.*)\.(fmt|mem|base)$/) {
        $opts{'byfmt'} = $1;
      } elsif ($ARGV[0] =~ m/\./) {
        die "unknown format type: $ARGV[0]";
      } else {
        $opts{'byfmt'} = $ARGV[0];
      }
    } else {
      die "missing argument to mktexmft";
    }
  } else {
    GetOptions(\%opts, @cmdline_options) or 
        die "Try \"$prg --help\" for more information.\n";
  }
  
  help() if $opts{'help'};

  if ($opts{'version'}) {
    print version();
    exit (0);
  }


  # these two functions should go to TLUtils!
  check_hidden_sysmode();
  determine_config_files("fmtutil.cnf");
  my $changes_config_file = $alldata->{'changes_config'};

  read_fmtutil_files(@{$opts{'cnffile'}});

  # we do changes always in the used config file with the highest
  # priority
  my $bakFile = $changes_config_file;
  $bakFile =~ s/\.cfg$/.bak/;
  my $changed = 0;

  # should be replaces by new mktexlsr perl version
  $updLSR = new TeX::Update;
  $updLSR->mustexist(0);

  my $cmd;
  if ($opts{'edit'}) {
    if ($opts{"dry-run"}) {
      printf STDERR "No, are you joking, you want to edit with --dry-run?\n";
      exit 1;
    }
    # it's not a good idea to edit fmtutil.cnf manually these days,
    # but for compatibility we'll silently keep the option.
    $cmd = 'edit';
    my $editor = $ENV{'VISUAL'} || $ENV{'EDITOR'};
    $editor ||= (&win32 ? "notepad" : "vi");
    if (-r $changes_config_file) {
      &copyFile($changes_config_file, $bakFile);
    } else {
      touch($bakFile);
      touch($changes_config_file);
    }
    system($editor, $changes_config_file);
    $changed = files_are_different($bakFile, $changes_config_file);
  } elsif ($opts{'showhyphen'}) {
    my $f = $opts{'showhyphen'};
    if ($alldata->{'merged'}{$f}) {
      my @all_engines = keys %{$alldata->{'merged'}{$f}};
      for my $e (sort @all_engines) {
        my $hf = $alldata->{'merged'}{$f}{$e}{'hyphen'};
        next if ($hf eq '-');
        my $ff = `kpsewhich -progname=$f -format=tex $hf`;
        chomp($ff);
        if ($ff ne "") {
          if ($#all_engines > 0) {
            printf "$f/$e: ";
          }
          printf "$ff\n";
        } else {
          print_warning("hyphenfile $hf (for $f/$e) not found!\n");
          abort();
        }
      }
    }
  } elsif ($opts{'catcfg'}) {
    print_warning("--catcfg command not supported anymore!\n");
    exit(1);
  } elsif ($opts{'listcfg'}) {
    return callback_list_cfg();
    exit(1);
  } elsif ($opts{'disablefmt'}) {
    return callback_enable_disable_format($changes_config_file, 
                                          $opts{'disablefmt'}, 'disabled');
  } elsif ($opts{'enablefmt'}) {
    return callback_enable_disable_format($changes_config_file, 
                                          $opts{'enablefmt'}, 'enabled');
  } elsif ($opts{'byfmt'}) {
    return callback_build_formats('byfmt', $opts{'byfmt'});
  } elsif ($opts{'byengine'}) {
    return callback_build_formats('byengine', $opts{'byengine'});
  } elsif ($opts{'byhyphen'}) {
    return callback_build_formats('byhyphen', $opts{'byhyphen'});
  } elsif ($opts{'refresh'}) {
    return callback_build_formats('refresh');
  } elsif ($opts{'missing'}) {
    return callback_build_formats('missing');
  } elsif ($opts{'all'}) {
    return callback_build_formats('all');
  } elsif ($opts{'_dumpdata'}) {
    dump_data();
    exit(0);
  } else {
    print_error("missing command; try fmtutil --help if you need it.\n");
    exit(1);
  }

  if (!$opts{'nohash'}) {
    print "$prg: Updating ls-R files.\n" if !$opts{'quiet'};
    $updLSR->exec() unless $opts{"dry-run"};
  }

  return 0;
}

sub dump_data {
  require Data::Dumper;
  $Data::Dumper::Indent = 1;
  $Data::Dumper::Indent = 1;
  print Data::Dumper::Dumper($alldata);
}


# build_formats
# (re)builds the formats as selected

sub callback_build_formats {
  my ($what, $whatarg) = @_;
  my $suc = 0;
  my $err = 0;
  my $disabled = 0;
  my $nobuild = 0;
  my $notavail = 0;
  #
  # set up a tmp dir
  # On W32 it seems that File::Temp creates restrictive permissions (ok)
  # that are copied over with the files created inside it (not ok).
  # So make our own temp dir.
  my $tmpdir;
  if (win32()) {
    my $foo;
    for my $i (1..5) {
      $foo = "$texmfvar/temp.$$." . int(rand(1000000));
      if (! -d $foo) {
        if (mkdir($foo)) {
          $tmpdir = $foo;
          last;
        }
      }
    }
    if (! $tmpdir) {
      die "Cannot get a temporary directory after five iterations ... sorry!";
    }
  } else {
    $tmpdir = File::Temp::tempdir(CLEANUP => 1);
  }
  # set up destination directory
  $opts{'fmtdir'} || ( $opts{'fmtdir'} = "$texmfvar/web2c" ) ;
  TeXLive::TLUtils::mkdirhier($opts{'fmtdir'}) if (! -d $opts{'fmtdir'});
  if (! -w $opts{'fmtdir'}) {
    print_error("format directory \`" . $opts{'fmtdir'} ."' is not writable\n");
    exit (1);
  }
  # since the directory does not exist, we can make it absolute with abs_path
  # without any trickery around non-existing dirs
  $opts{'fmtdir'} = Cwd::abs_path($opts{'fmtdir'});
  # for safety, check again
  die ("abs_path didn't succeed, that is strange: $?") if !$opts{'fmtdir'};
   
  # code taken over from the original shell script for KPSE_DOT etc
  my $thisdir = cwd();
  $ENV{'KPSE_DOT'} = $thisdir;

  # due to KPSE_DOT, we don't search the current directory, so include
  # it explicitly for formats that \write and later on \read
  $ENV{'TEXINPUTS'} = "$tmpdir$sep" . ($ENV{'TEXINPUTS'} ? $ENV{'TEXINPUTS'} : "");
  # for formats that load other formats (e.g., jadetex loads latex.fmt),
  # add the current directory to TEXFORMATS, too.  Currently unnecessary
  # for MFBASES and MPMEMS.
  $ENV{'TEXFORMATS'} = "$tmpdir$sep" . ($ENV{'TEXFORMATS'} ? $ENV{'TEXFORMATS'} : "");

  #
  # switch to temporary directory for format generation
  chdir($tmpdir) || die("Cannot change to directory $tmpdir: $?");
  
  # we rebuild formats in two rounds:
  # round 1: only formats with the same name as engine (pdftex/pdftex)
  # round 2: all other formats
  # reason: later formats might need earlier formats to be already
  # initialized (xmltex is one of these examples AFAIR)
  my $val;
  for my $fmt (keys %{$alldata->{'merged'}}) {
    for my $eng (keys %{$alldata->{'merged'}{$fmt}}) {
      next if ($fmt ne $eng);
      $val = select_and_rebuild_format($fmt, $eng, $what, $whatarg);
      if ($val == $FMT_DISABLED) { $disabled++; }
      elsif ($val == $FMT_NOTSELECTED) { $nobuild++; }
      elsif ($val == $FMT_FAILURE) { $err++; }
      elsif ($val == $FMT_SUCCESS)  { $suc++; }
      elsif ($val == $FMT_NOTAVAIL) { $notavail++; }
      else { print_error("callback_build_format: unknown return from select_and_rebuild.\n"); }
    }
  }
  for my $fmt (keys %{$alldata->{'merged'}}) {
    for my $eng (keys %{$alldata->{'merged'}{$fmt}}) {
      next if ($fmt eq $eng);
      $val = select_and_rebuild_format($fmt, $eng, $what, $whatarg);
      if ($val == $FMT_DISABLED) { $disabled++; }
      elsif ($val == $FMT_NOTSELECTED) { $nobuild++; }
      elsif ($val == $FMT_FAILURE) { $err++; }
      elsif ($val == $FMT_SUCCESS)  { $suc++; }
      elsif ($val == $FMT_NOTAVAIL) { $notavail++; }
      else { print_error("callback_build_format: unknown return from select_and_rebuild.\n"); }
    }
  }
  my $stdo = ($mktexfmtMode ? \*STDERR : \*STDOUT);
  for (@deferred_stdout) { print $stdo $_; }
  for (@deferred_stderr) { print STDERR $_; }
  print_info("Disabled formats: $disabled\n") if ($disabled);
  print_info("Successfully rebuild formats: $suc\n") if ($suc);
  print_info("Not selected formats: $nobuild\n") if ($nobuild);
  print_info("Not available formats: $notavail\n") if ($notavail);
  print_info("Failure during builds: $err\n") if ($err);
  chdir($thisdir) || warn("chdir($thisdir) failed: $!");
  if (win32()) {
    # try to remove the tmpdir with all files
    TeXLive::TLUtils::rmtree($tmpdir);
  }
  return 0;
}

# select_and_rebuild_format
# check condition and rebuild the format if selected
# return values: $FMT_*
sub select_and_rebuild_format {
  my ($fmt, $eng, $what, $whatarg) = @_;
  return($FMT_DISABLED) 
      if ($alldata->{'merged'}{$fmt}{$eng}{'status'} eq 'disabled');
  my $doit = 0;
  # we just identify 'all', 'refresh', 'missing'
  # I don't see much point in keeping all of them
  $doit = 1 if ($what eq 'all');
  $doit = 1 if ($what eq 'refresh');
  $doit = 1 if ($what eq 'missing');
  $doit = 1 if ($what eq 'byengine' && $eng eq $whatarg);
  $doit = 1 if ($what eq 'byfmt' && $fmt eq $whatarg);
  # TODO
  # original fmtutil.sh was more strict about existence of the hyphen file
  # not sure how we proceed here
  $doit = 1 if ($what eq 'byhyphen' &&
                $whatarg eq 
                (split(/,/ , $alldata->{'merged'}{$fmt}{$eng}{'hyphen'}))[0]);
  if ($doit) {
    return rebuild_one_format($fmt,$eng);
  } else {
    return $FMT_NOTSELECTED;
  }
}

# rebuild_one_format
# takes fmt/eng and rebuilds it, irrelevant of any setting
# return value FMT_
sub rebuild_one_format {
  my ($fmt, $eng) = @_;

  # get variables
  my $hyphen  = $alldata->{'merged'}{$fmt}{$eng}{'hyphen'};
  my $addargs = $alldata->{'merged'}{$fmt}{$eng}{'args'};

  # running parameters
  my $texengine;
  my $jobswitch = "-jobname=$fmt";
  my $prgswitch = "-progname=" ;
  my $fmtfile = $fmt;
  my $kpsefmt;
  my $pool;
  my $tcx = "";
  my $tcxflag = "";
  my $localpool=0;
  my $texargs;

  unlink glob "*.pool";


  # addargs processing:
  # can contain:
  # nls stuff (pool/tcx) see below
  # ini file (last argument)
  my $inifile = $addargs;
  $inifile = (split(' ', $addargs))[-1];
  # get rid of leading * in inifiles
  $inifile =~ s/^\*//;

  if ($fmt eq "metafun")       { $prgswitch .= "mpost"; }
  elsif ($fmt eq "mptopdf")    { $prgswitch .= "context"; }
  elsif ($fmt =~ m/^cont-..$/) { $prgswitch .= "context"; }
  else                         { $prgswitch .= $fmt; }

  if ($eng eq "mpost") { 
    $fmtfile .= ".mem" ; 
    $kpsefmt = "mp" ; 
    $texengine = "metapost";
  } elsif ($eng =~ m/^mf(w|-nowin)?$/) {
    $fmtfile .= ".base" ; 
    $kpsefmt = "mf" ; 
    $texengine = "metafont";
  } else {
    $fmtfile .= ".fmt" ; 
    $kpsefmt = "tex" ; 
    $texengine = $eng;
  }
  
  # check for existence of ini file before doing anything else
  if (system("kpsewhich -progname=$fmt -format=$kpsefmt $inifile >$nul 2>&1") != 0) {
    # we didn't find the ini file, skip
    print_deferred_warning("inifile $inifile for $fmt/$eng not found.\n");
    # The original script just skipped it but in TeX Live we expect that
    # all activated formats are also buildable, thus return failure.
    return $FMT_FAILURE;
  }
  
  # NLS support
  #   Example (for fmtutil.cnf):
  #     mex-pl tex mexconf.tex nls=tex-pl,il2-pl mex.ini
  # The nls parameter (pool,tcx) can only be specified as the first argument
  # inside the 4th field in fmtutil.cnf.
  if ($addargs =~ m/^nls=([^\s]+)\s+(.*)$/) {
    $texargs = $2;
    ($pool, $tcx) = split(',', $1);
    $tcx || ($tcx = '');
  } else {
    $texargs = $addargs;
  }
  if ($pool) {
    chomp ( my $poolfile = `kpsewhich -progname=$eng $pool.poo 2>$nul` );
    if ($poolfile && -f $poolfile) {
      print_verbose ("attempting to create localized format using pool=$pool and tcx=$tcx.\n");
      File::Copy($poolfile, "$eng.pool");
      $tcxflag = "-translate-file=$tcx" if ($tcx);
      $localpool = 1;
    }
  }

  # Check for infinite recursion before running the iniTeX:
  # We do this check only if we are running in mktexfmt mode
  # otherwise double format definitions will create an infinite loop, too
  if ($mktexfmtMode) {
    if ($ENV{'mktexfmt_loop'}) {
      if ($ENV{'mktexfmt_loop'} =~ m!:$fmt/$eng:!) {
        die "$prg: infinite recursion detected in $fmt/$eng, giving up!";
      }
    } else {
      $ENV{'mktexfmt_loop'} = '';
    }
    $ENV{'mktexfmt_loop'} .= ":$fmt/$eng:";
  }

  #
  # check for existence of $engine
  # we do *NOT* use the return value but rely on execution of the shell
  if (!TeXLive::TLUtils::which($eng)) {
    if ($opts{'no-error-if-no-engine'} &&
        ",$opts{'no-error-if-no-engine'}," =~ m/,$eng,/) {
      return $FMT_NOTAVAIL;
    } else {
      print_deferred_error("not building $fmt due to missing engine $eng.\n");
      return $FMT_FAILURE;
    }
  }

  print_verbose("running \`$eng -ini $tcxflag $jobswitch $prgswitch $texargs' ...\n");

  {
    my $texpool = $ENV{'TEXPOOL'};
    if ($localpool) {
      $ENV{'TEXPOOL'} = cwd() . $sep . ($texpool ? $texpool : "");
    }

    # in mktexfmtMode we need to redirect *all* output to stderr
    my $cmdline = "$eng  -ini $tcxflag $jobswitch $prgswitch $texargs";
    $cmdline .= " >&2" if $mktexfmtMode;
    $cmdline .= " <$nul";
    my $retval = system($cmdline);
    if ($retval != 0) {
      $retval /= 256 if ($retval > 0);
      print_deferred_error("call to \`$eng -ini $tcxflag $jobswitch $prgswitch $texargs' returned error code $retval\n");
      #
      # original shell script did *not* check the return value
      # we keep this behaviour, but add an option --strict that
      # errors out on all failures.
      if ($opts{'strict'}) {
        print_deferred_error("return error due to options --strict\n");
        return $FMT_FAILURE;
      }
    }

    if ($localpool) {
      if ($texpool) {
        $ENV{'TEXPOOL'} = $texpool;
      } else {
        delete $ENV{'TEXPOOL'};
      }
    }

  }

  #
  # check and install of fmt and log files
  if (! -f $fmtfile) {
    print_deferred_error("\`$eng -ini $tcxflag $jobswitch $prgswitch $texargs' failed\n");
    return $FMT_FAILURE;
  }

  if (! -f "$fmt.log") {
    print_deferred_error("no log file generated for $fmt/$eng, strange\n");
    return $FMT_FAILURE;
  }

  open LOGFILE, "<$fmt.log" || print_deferred_warning("cannot open $fmt.log?\n");
  my @logfile = <LOGFILE>;
  close LOGFILE;
  if (grep(/^!/, @logfile) > 0) {
    print_deferred_error("\`$eng -ini $tcxflag $jobswitch $prgswitch $texargs' had errors.\n");
  }

  my $fulldestdir;
  if ($opts{'no-engine-subdir'}) {
    $fulldestdir = $opts{'fmtdir'};
  } else {
    $fulldestdir = "$opts{'fmtdir'}/$texengine";
  }
  TeXLive::TLUtils::mkdirhier($fulldestdir);
  
  if (!File::Copy::move( "$fmt.log", "$fulldestdir/$fmt.log")) {
    print_deferred_error("Cannot move $fmt.log to $fulldestdir.\n");
  }

  my $destfile = "$fulldestdir/$fmtfile";
  if (File::Copy::move( $fmtfile, $destfile )) {
    print_info("$destfile installed.\n");
    #
    # original fmtutil.sh did some magic trick for mplib-luatex.mem
    #
    # nowadays no mplib mem is created and all files loaded
    # so we comment and do not convert this
    #
    # As a special special case, we create mplib-luatex.mem for use by
    # the mplib embedded in luatex if it doesn't already exist.  (We
    # never update it if it does exist.)
    #
    # This is used by the luamplib package.  This way, an expert user
    # who wants to try a new version of luatex (hence with a new
    # version of mplib) can manually update mplib-luatex.mem without
    # having to tamper with mpost itself.
    #
    #  if test "x$format" = xmpost && test "x$engine" = xmpost; then
    #    mplib_mem_name=mplib-luatex.mem
    #    mplib_mem_file=$fulldestdir/$mplib_mem_name
    #    if test \! -f $mplib_mem_file; then
    #      verboseMsg "$progname: copying $destfile to $mplib_mem_file"
    #      if cp "$destfile" "$mplib_mem_file" </dev/null; then
    #        mktexupd "$fulldestdir" "$mplib_mem_name"
    #      else
	  #  # failure to copy merits failure handling: e.g., full file system.
    #        log_failure "cp $destfile $mplib_mem_file failed."
    #      fi
    #    else
    #      verboseMsg "$progname: $mplib_mem_file already exists, not updating."
    #    fi
    #  fi

    if ($mktexfmtMode && $mktexfmtFirst) {
      print "$destfile\n";
      $mktexfmtFirst = 0;
    }

    $updLSR->add($destfile);
    $updLSR->exec();
    $updLSR->reset();

    return $FMT_SUCCESS;
  } else {
    print_deferred_error("Cannot move $fmtfile to $destfile.\n");
    if (-f $destfile) {
      # remove the empty file possibly left over if a near-full file system.
      print_verbose("Removing partial file $destfile after move failure ...\n");
      unlink($destfile) || print_deferred_error("Removing $destfile failed.\n");
    }
    return $FMT_FAILURE;
  }

  print_deferred_error("we should not be here $fmt/$eng\n");
  return $FMT_FAILURE;
}


#
# enable_disable_format_engine
# assumes that format/engine is already defined somewhere,
# i.e., it $alldata->{'merged'}{$fmt}{$eng} is defined
#
# Return values:
# 1 - success with changes
# 0 - no changes done
# -1 - error appeared
sub enable_disable_format_engine {
  my ($tc, $fmt, $eng, $mode) = @_;
  if ($mode eq 'enabled' || $mode eq 'disabled') {
    if ($alldata->{'merged'}{$fmt}{$eng}{'status'} eq $mode) {
      print_info("Format/engine combination $fmt/$eng already $mode.\n");
      print_info("No changes done.\n");
      return 0;
    } else {
      my $origin = $alldata->{'merged'}{$fmt}{$eng}{'origin'};
      if ($origin ne $tc) {
        $alldata->{'fmtutil'}{$tc}{'formats'}{$fmt}{$eng} =
          {%{$alldata->{'fmtutil'}{$origin}{'formats'}{$fmt}{$eng}}};
        $alldata->{'fmtutil'}{$tc}{'formats'}{$fmt}{$eng}{'line'} = -1;
      }
      $alldata->{'fmtutil'}{$tc}{'formats'}{$fmt}{$eng}{'status'} = $mode;
      $alldata->{'fmtutil'}{$tc}{'changed'} = 1;
      $alldata->{'merged'}{$fmt}{$eng}{'status'} = $mode;
      $alldata->{'merged'}{$fmt}{$eng}{'origin'} = $tc;
      # dump_data();
      return save_fmtutil($tc);
    }
  } else {
    print_error("enable_disable_format_engine: unknown mode $mode\n");
    exit(1);
  }
}  

#
# enable a format named
#   format[/engine]
# where the engine part is optional
# Case 1: no "engine" given:
# - if format is defined and has only one engine instance -> activate
# - if format is defined and has more than one engine -> error
# Case 2: engine given:
# - if format/engine is defined -> activate
# - if format/engine is not defined -> error
#
# Return values:
# 1 - success with changes
# 0 - no changes done
# -1 - error appeared
sub callback_enable_disable_format {
  my ($tc, $fmtname, $mode) = @_;
  my ($fmt, $eng) = split('/', $fmtname, 2);
  if ($mode ne 'enabled' && $mode ne 'disabled') {
    print_error("callback_enable_disable_format: unknown mode $mode.\n");
    exit 1;
  }
  if ($eng) {
    if ($alldata->{'merged'}{$fmt}{$eng}) {
      return enable_disable_format_engine($tc, $fmt, $eng, $mode);
    } else {
      print_warning("Format/engine combination: $fmt/$eng is not defined.\n");
      print_warning("Cannot (de)activate it.\n");
      return -1;
    }
  } else {
    # no engine given, check the number of entries
    if ($alldata->{'merged'}{$fmt}) {
      my @engs = keys %{$alldata->{'merged'}{$fmt}};
      if (($#engs > 0) || ($#engs == -1)) {
        print_warning("Selected format $fmt not uniquely defined;\n");
        print_warning("possible format/engine combinations:\n");
        for my $e (@engs) {
          print_warning("  $fmt/$e (currently "
                        . $alldata->{'merged'}{$fmt}{$e}{'status'} . ")\n");
        }
        print_warning("Please select one by fully specifying $fmt/ENGINE\n");
        print_warning("No changes done.\n");
        return 0;
      } else {
        # only one engine, enable it if necessary!
        return enable_disable_format_engine($tc, $fmt, $engs[0], $mode);
      }
    } else {
      print_warning("Format $fmt is not defined;\n");
      print_warning("cannot (de)activate it.\n");
      return -1;
    }
  }
}

sub callback_list_cfg {
  my @lines;
  for my $f (keys %{$alldata->{'merged'}}) {
    for my $e (keys %{$alldata->{'merged'}{$f}}) {
      my $orig = $alldata->{'merged'}{$f}{$e}{'origin'};
      my $hyph = $alldata->{'merged'}{$f}{$e}{'hyphen'};
      my $stat = $alldata->{'merged'}{$f}{$e}{'status'};
      my $args = $alldata->{'merged'}{$f}{$e}{'args'};
      push @lines,
        [ "$f/$e/$hyph",
          "$f (engine=$e) $stat\n  hyphen=$hyph, args=$args\n  origin=$orig\n" ];
    }
  }
  # sort lines
  @lines = map { $_->[1] } sort { $a->[0] cmp $b->[0] } @lines;
  print "List of all formats:\n";
  print @lines;
}

sub read_fmtutil_files {
  my (@l) = @_;
  for my $l (@l) { read_fmtutil_file($l); }
  # in case the changes_config is a new one read it in and initialize it here
  # the file might be already readable but not in ls-R so not found by
  # kpsewhich. That means we need to check that it is readable and whether
  # the lines entry is already defined
  my $cc = $alldata->{'changes_config'};
  if ((! -r $cc) || (!$alldata->{'fmtutil'}{$cc}{'lines'}) ) {
    $alldata->{'fmtutil'}{$cc}{'lines'} = [ ];
  }
  #
  $alldata->{'order'} = \@l;
  #
  # determine the origin of all formats
  for my $fn (reverse @l) {
    my @format_names = keys %{$alldata->{'fmtutil'}{$fn}{'formats'}};
    for my $f (@format_names) {
      for my $e (keys %{$alldata->{'fmtutil'}{$fn}{'formats'}{$f}}) {
        $alldata->{'merged'}{$f}{$e}{'origin'} = $fn;
        $alldata->{'merged'}{$f}{$e}{'hyphen'} = 
            $alldata->{'fmtutil'}{$fn}{'formats'}{$f}{$e}{'hyphen'} ;
        $alldata->{'merged'}{$f}{$e}{'status'} = 
            $alldata->{'fmtutil'}{$fn}{'formats'}{$f}{$e}{'status'} ;
        $alldata->{'merged'}{$f}{$e}{'args'} = 
            $alldata->{'fmtutil'}{$fn}{'formats'}{$f}{$e}{'args'} ;
      }
    }
  }
}

sub read_fmtutil_file {
  my $fn = shift;
  if (!open(FN,"<$fn")) {
    die ("Cannot read $fn: $!");
  }
  # we count lines from 0 ..!!!!
  my $i = -1;
  my @lines = <FN>;
  chomp(@lines);
  $alldata->{'fmtutil'}{$fn}{'lines'} = [ @lines ];
  close(FN) || warn("$prg: Cannot close $fn: $!");
  for (@lines) {
    $i++;
    chomp;
    next if /^\s*#?\s*$/; # ignore empty and all-blank and just-# lines
    next if /^\s*#[^!]/;  # ignore whole-line comment that is not a disable
    s/#[^!].*//;          # remove within-line comment that is not a disable
    s/#$//;               # remove # at end of line
    my ($a,$b,$c,@rest) = split (' '); # special split rule, leading ws ign
    my $disabled = 0;
    if ($a eq "#!") {
      # we cannot determine whether a line is a proper fmtline or
      # not, so we have to assume that it is
      my $d = shift @rest;
      if (!defined($d)) {
        print_warning("apparently not a real disable line, ignored: $_\n");
        next;
      } else {
        $disabled = 1;
        $a = $b; $b = $c; $c = $d;
      }
    }
    if (defined($alldata->{'fmtutil'}{$fn}{'formats'}{$a}{$b})) {
      print_warning("double mention of $a/$b in $fn\n");
    } else {
      $alldata->{'fmtutil'}{$fn}{'formats'}{$a}{$b}{'hyphen'} = $c;
      $alldata->{'fmtutil'}{$fn}{'formats'}{$a}{$b}{'args'} = "@rest";
      $alldata->{'fmtutil'}{$fn}{'formats'}{$a}{$b}{'status'} = ($disabled ? 'disabled' : 'enabled');
      $alldata->{'fmtutil'}{$fn}{'formats'}{$a}{$b}{'line'} = $i;
    }
  }
}



#
# FUNCTIONS THAT SHOULD GO INTO TLUTILS.PM
# and also be reused in updmap.pl!!!
#


sub check_hidden_sysmode {
  #
  # check if we are in *hidden* sys mode, in which case we switch
  # to sys mode
  # Nowdays we use -sys switch instead of simply overriding TEXMFVAR
  # and TEXMFCONFIG
  # This is used to warn users when they run updmap in usermode the first time.
  # But it might happen that this script is called via another wrapper that
  # sets TEXMFCONFIG and TEXMFVAR, and does not pass on the -sys option.
  # for this case we check whether the SYS and non-SYS variants agree,
  # and if, then switch to sys mode (with a warning)
  if (($TEXMFSYSCONFIG eq $TEXMFCONFIG) && ($TEXMFSYSVAR eq $TEXMFVAR)) {
    if (!$opts{'sys'}) {
      print_warning("hidden sys mode found, switching to sys mode.\n");
      $opts{'sys'} = 1;
    }
  }



  if ($opts{'sys'}) {
    # we are running as updmap-sys, make sure that the right tree is used
    $texmfconfig = $TEXMFSYSCONFIG;
    $texmfvar    = $TEXMFSYSVAR;
  }
}


sub determine_config_files {
  my $fn = shift;

  # config file for changes
  my $changes_config_file;

  # determine which config files should be used
  # we also determine here where changes will be saved to
  if ($opts{'cnffile'}) {
    my @tmp;
    for my $f (@{$opts{'cnffile'}}) {
      if (! -f $f) {
        die "$prg: Config file \"$f\" not found.";
      }
      push @tmp, (win32() ? lc($f) : $f);
    }
    @{$opts{'cnffile'}} = @tmp;
    # in case that config files are given on the command line, the first
    # in the list is the one where changes will be written to.
    ($changes_config_file) = @{$opts{'cnffile'}};
  } else {
    my @all_files = `kpsewhich -all $fn`;
    chomp(@all_files);
    my @used_files;
    for my $f (@all_files) {
      push @used_files, (win32() ? lc($f) : $f);
    }
    #
    my $TEXMFLOCALVAR;
    my @TEXMFLOCAL;
    if (win32()) {
      chomp($TEXMFLOCALVAR =`kpsewhich --expand-path=\$TEXMFLOCAL`);
      @TEXMFLOCAL = map { lc } split(/;/ , $TEXMFLOCALVAR);
    } else {
      chomp($TEXMFLOCALVAR =`kpsewhich --expand-path='\$TEXMFLOCAL'`);
      @TEXMFLOCAL = split /:/ , $TEXMFLOCALVAR;
    }
    #
    # search for TEXMFLOCAL/web2c/$fn
    my @tmlused;
    for my $tml (@TEXMFLOCAL) {
      my $TMLabs = Cwd::abs_path($tml);
      next if (!$TMLabs);
      if (-r "$TMLabs/web2c/$fn") {
        push @tmlused, "$TMLabs/web2c/$fn";
      }
    }
    #
    # user mode (no -sys):
    # ====================
    # TEXMFCONFIG    $HOME/.texliveYYYY/texmf-config/web2c/$fn
    # TEXMFVAR       $HOME/.texliveYYYY/texmf-var/web2c/$fn
    # TEXMFHOME      $HOME/texmf/web2c/$fn
    # TEXMFSYSCONFIG $TEXLIVE/YYYY/texmf-config/web2c/$fn
    # TEXMFSYSVAR    $TEXLIVE/YYYY/texmf-var/web2c/$fn
    # TEXMFLOCAL     $TEXLIVE/texmf-local/web2c/$fn
    # TEXMFDIST      $TEXLIVE/YYYY/texmf-dist/web2c/$fn
    # 
    # root mode (--sys):
    # ==================
    # TEXMFSYSCONFIG $TEXLIVE/YYYY/texmf-config/web2c/$fn
    # TEXMFSYSVAR    $TEXLIVE/YYYY/texmf-var/web2c/$fn
    # TEXMFLOCAL     $TEXLIVE/texmf-local/web2c/$fn
    # TEXMFDIST      $TEXLIVE/YYYY/texmf-dist/web2c/$fn
    #
    @{$opts{'cnffile'}}  = @used_files;
    #
    # determine the config file that we will use for changes
    # if in the list of used files contains either one from
    # TEXMFHOME or TEXMFCONFIG (which is TEXMFSYSCONFIG in the -sys case)
    # then use the *top* file (which will be either one of the two),
    # if none of the two exists, create a file in TEXMFCONFIG and use it
    my $use_top = 0;
    for my $f (@used_files) {
      if ($f =~ m!(\Q$TEXMFHOME\E|\Q$texmfconfig\E)/web2c/$fn!) {
        $use_top = 1;
        last;
      }
    }
    if ($use_top) {
      ($changes_config_file) = @used_files;
    } else {
      # add the empty config file
      my $dn = "$texmfconfig/web2c";
      $changes_config_file = "$dn/$fn";
    }
  }
  if (!$opts{'quiet'}) {
    print_verbose("$prg is using the following $fn files"
                  . " (in precedence order):\n");
    for my $f (@{$opts{'cnffile'}}) {
      print_verbose("  $f\n");
    }
    print_verbose("$prg is using the following $fn file"
                  . " for writing changes:\n");
    print_verbose("  $changes_config_file\n");
  }
  if ($opts{'listfiles'}) {
    # we listed it above, so be done
    exit 0;
  }

  $alldata->{'changes_config'} = $changes_config_file;
}



# returns 1 if actually saved due to changes
sub save_fmtutil {
  my $fn = shift;
  return if $opts{'dry-run'};
  my %fmtf = %{$alldata->{'fmtutil'}{$fn}};
  if ($fmtf{'changed'}) {
    TeXLive::TLUtils::mkdirhier(dirname($fn));
    open (FN, ">$fn") || die "$prg: can't write to $fn: $!";
    my @lines = @{$fmtf{'lines'}};
    if (!@lines) {
      print "Creating new config file $fn\n";
      # update lsR database
      $updLSR->add($fn);
      $updLSR->exec();
      $updLSR->reset();
    }
    # collect the lines with data
    my %line_to_fmt;
    my @add_fmt;
    if (defined($fmtf{'formats'})) {
      for my $f (keys %{$fmtf{'formats'}}) {
        for my $e (keys %{$fmtf{'formats'}{$f}}) {
          if ($fmtf{'formats'}{$f}{$e}{'line'} == -1) {
            push @add_fmt, [ $f, $e ];
          } else {
            $line_to_fmt{$fmtf{'formats'}{$f}{$e}{'line'}} = [ $f, $e ];
          }
        }
      }
    }
    for my $i (0..$#lines) {
      if (defined($line_to_fmt{$i})) {
        my $f = $line_to_fmt{$i}->[0];
        my $e = $line_to_fmt{$i}->[1];
        my $mode = $fmtf{'formats'}{$f}{$e}{'status'};
        my $args = $fmtf{'formats'}{$f}{$e}{'args'};
        my $hyph = $fmtf{'formats'}{$f}{$e}{'hyphen'};
        my $p = ($mode eq 'disabled' ? "#! " : "");
        print FN "$p$f $e $hyph $args\n";
      } else {
        print FN "$lines[$i]\n";
      }
    }
    # add the new settings and maps
    for my $m (@add_fmt) {
      my $f = $m->[0];
      my $e = $m->[1];
      my $mode = $fmtf{'formats'}{$f}{$e}{'status'};
      my $args = $fmtf{'formats'}{$f}{$e}{'args'};
      my $hyph = $fmtf{'formats'}{$f}{$e}{'hyphen'};
      my $p = ($mode eq 'disabled' ? "#! " : "");
      print FN "$p$f $e $hyph $args\n";
    }
    close(FN) || warn("$prg: Cannot close file handle for $fn: $!");
    delete $alldata->{'fmtutil'}{$fn}{'changed'};
    return 1;
  }
  return 0;
}


#
# $HOME and sudo and updmap-sys horror
#   some instances of sudo do not reset $HOME to the home of root
#   as an effect of "sudo updmap" creates root owned files in the home 
#   of a normal user, and "sudo updmap-sys" uses map files and updmap.cfg
#   files from the directory of a normal user, but creating files
#   in TEXMFSYSCONFIG. This is *all* wrong.
#   we check: if we are running as UID 0 (root) on Unix and the
#   ENV{HOME} is NOT the same as the one of root, then give a warning
#   and reset it to the real home dir of root.

sub reset_root_home {
  if (!win32() && ($> == 0)) {  # $> is effective uid
    my $envhome = $ENV{'HOME'};
    # if $HOME isn't an existing directory, we don't care.
    if (defined($envhome) && (-d $envhome)) {
      # we want to avoid calling getpwuid as far as possible, so if
      # $envhome is one of some usual values we accept it without worrying.
      if ($envhome =~ m,^(/|/root|/var/root)/*$,) {
        return;
      }
      # $HOME is defined, check what is the home of root in reality
      my (undef,undef,undef,undef,undef,undef,undef,$roothome) = getpwuid(0);
      if (defined($roothome)) {
        if ($envhome ne $roothome) {
          print_warning("resetting \$HOME value (was $envhome) to root's "
            . "actual home ($roothome).\n");
          $ENV{'HOME'} = $roothome;
        } else {
          # envhome and roothome do agree, nothing to do, that is the good case
        }
      } else { 
        print_warning("home of root not defined, strange!\n");
      }
    }
  }
}

#
# printing to stdout (in mktexfmtMode also going to stderr!)
#   print_info    can be supressed with --quiet
#   print_verbose cannot be suppressed
# printing to stderr
#   print_warning can be supressed with --quiet
#   print_error   cannot be suppressed
#
sub print_info {
  if ($mktexfmtMode) {
    print STDERR "$prg [INFO]: ", @_ if (!$opts{'quiet'});
  } else {
    print STDOUT "$prg [INFO]: ", @_ if (!$opts{'quiet'});
  }
}
sub print_verbose {
  if ($mktexfmtMode) {
    print STDERR "$prg: ", @_;
  } else {
    print STDOUT "$prg: ", @_;
  }
}
sub print_warning {
  print STDERR "$prg [WARNING]: ", @_ if (!$opts{'quiet'}) 
}
sub print_error {
  print STDERR "$prg [ERROR]: ", @_;
}
#
# same with deferred
sub print_deferred_info {
  push @deferred_stdout, "$prg [INFO]: @_" if (!$opts{'quiet'});
}
sub print_deferred_verbose {
  push @deferred_stdout, "$prg: @_";
}
sub print_deferred_warning {
  push @deferred_stderr, "$prg [WARNING]: @_" if (!$opts{'quiet'}) 
}
sub print_deferred_error {
  push @deferred_stderr, "$prg [ERROR]: @_";
}


# copied from TeXLive::TLUtils to reduce dependencies
sub win32 {
  if ($^O =~ /^MSWin/i) {
    return 1;
  } else {
    return 0;
  }
}



# help, version.

sub version {
  my $ret = sprintf "%s version %s\n", $prg, $version;
  return $ret;
}

sub help {
  my $usage = <<"EOF";
Usage: $prg     [OPTION] ... [COMMAND]
   or: $prg-sys [OPTION] ... [COMMAND]
   or: mktexfmt FORMAT.fmt|BASE.base|MEM.mem|FMTNAME.EXT

Rebuild and manage TeX formats, Metafont bases and MetaPost mems.

If the command name ends in mktexfmt, only one format can be created.
The only options supported are --help and --version, and the command
line must consist of either a format name, with its extension, or a
plain name that is passed as the argument to --byfmt (see below).  The
full name of the generated file (if any) is written to stdout, and
nothing else.

If not operating in mktexfmt mode, the command line can be more general,
and multiple formats can be generated, as follows.

Options:
  --cnffile FILE             read FILE instead of fmtutil.cnf
                             (can be given multiple times, in which case
                             all the files are used)
  --fmtdir DIRECTORY
  --no-engine-subdir         don't use engine-specific subdir of the fmtdir
  --no-error-if-no-format    exit successfully if no format is selected
  --no-error-if-no-engine=ENGINE1,ENGINE2,...
                             exit successfully even if the required engine
                               is missing, if it is included in the list.
  --quiet                    be silent
  --test                     (not implemented, just for compatibility)
  --dolinks                  (not implemented, just for compatibility)
  --force                    (not implemented, just for compatibility)

Commands:
  --all                      recreate all format files
  --missing                  create all missing format files
  --refresh                  recreate only existing format files
  --byengine ENGINENAME      (re)create formats using ENGINENAME
  --byfmt FORMATNAME         (re)create format for FORMATNAME
  --byhyphen HYPHENFILE      (re)create formats that depend on HYPHENFILE
  --enablefmt FORMATNAME[/ENGINE] enable formatname in config file
  --disablefmt FORMATNAME[/ENGINE] disable formatname in config file
                             If multiple formats have the same name but
                             different engines, the /ENGINE specifier is
                             required.
  --listcfg                  list (enabled and disabled) configurations,
                             filtered to available formats
  --catcfg                   output the content of the config file
  --showhyphen FORMATNAME    print name of hyphenfile for format FORMATNAME
  --version                  show version information and exit
  --help                     show this message and exit

Explanation of trees and files normally used:

  If --cnffile is specified on the command line (possibly multiple
  times), its value(s) are used.  Otherwise, fmtutil reads all the
  fmtutil.cnf files found by running \`kpsewhich -all fmtutil.cnf', in the
  order returned by kpsewhich.

  In any case, if multiple fmtutil.cnf files are found, all the format
  definitions found in all the fmtutil.cnf files are merged.

  Thus, if fmtutil.cnf files are present in all trees, and the default
  layout is used as shipped with TeX Live, the following files are
  read, in the given order.
  
  For fmtutil-sys:
  TEXMFSYSCONFIG \$TEXLIVE/YYYY/texmf-config/web2c/fmtutil.cnf
  TEXMFSYSVAR    \$TEXLIVE/YYYY/texmf-var/web2c/fmtutil.cnf
  TEXMFLOCAL     \$TEXLIVE/texmf-local/web2c/fmtutil.cnf
  TEXMFDIST      \$TEXLIVE/YYYY/texmf-dist/web2c/fmtutil.cnf

  For fmtutil:
  TEXMFCONFIG    \$HOME/.texliveYYYY/texmf-config/web2c/fmtutil.cnf
  TEXMFVAR       \$HOME/.texliveYYYY/texmf-var/web2c/fmtutil.cnf
  TEXMFHOME      \$HOME/texmf/web2c/fmtutil.cnf
  TEXMFSYSCONFIG \$TEXLIVE/YYYY/texmf-config/web2c/fmtutil.cnf
  TEXMFSYSVAR    \$TEXLIVE/YYYY/texmf-var/web2c/fmtutil.cnf
  TEXMFLOCAL     \$TEXLIVE/texmf-local/web2c/fmtutil.cnf
  TEXMFDIST      \$TEXLIVE/YYYY/texmf-dist/web2c/fmtutil.cnf
  
  (where YYYY is the TeX Live release version).
  
  According to the actions, fmtutil might write to one of the given files
  or create a new fmtutil.cnf, described further below.

Where changes are saved: 

  If config files are given on the command line, then the first one 
  given will be used to save any changes from --enable or --disable.  
  If the config files are taken from kpsewhich output, then the 
  algorithm is more complex:

    1) If \$TEXMFCONFIG/web2c/fmtutil.cnf or \$TEXMFHOME/web2c/fmtutil.cnf
    appears in the list of used files, then the one listed first by
    kpsewhich --all (equivalently, the one returned by kpsewhich
    fmtutil.cnf), is used.
      
    2) If neither of the above two are present and changes are made, a
    new config file is created in \$TEXMFCONFIG/web2c/fmtutil.cnf.
  
  In general, the idea is that if a given config file is not writable, a
  higher-level one can be used.  That way, the distribution's settings
  can be overridden for system-wide using TEXMFLOCAL, and then system
  settings can be overridden again in a particular user's TEXMFHOME.

Resolving multiple definitions of a format:

  If a format is defined in more than one config file, then the definition
  coming from the first-listed fmtutil.cnf is used.

Disabling formats:

  fmtutil.cnf files with higher priority (listed earlier) can disable
  formats mentioned in lower priority (listed later) fmtutil.cnf files by
  writing, e.g.,
    \#! <fmtname> <enginename> <hyphen> <args>
  in the higher-priority fmtutil.cnf file.   (The \#! must be at the
  beginning of the line, with at least one space or tab afterward, and
  whitespace between each word on the list.)

  As an example, suppose you have want to disable the luajitlatex format.
  You can create the file \$TEXMFCONFIG/web2c/fmtutil.cnf with the content
    #! luajitlatex luajittex language.dat,language.dat.lua lualatex.ini
  and call $prg.
  
  (As it happens, the luajittex-related formats are precisely why the
  --no-error-if-no-engine option exists, since luajittex cannot be
  compiled on all platforms.)

fmtutil vs. fmtutil-sys (fmtutil --sys):

  When fmtutil-sys is run or the command line option --sys is used, 
  TEXMFSYSCONFIG and TEXMFSYSVAR are used instead of TEXMFCONFIG and 
  TEXMFVAR, respectively.  This is the primary difference between 
  fmtutil-sys and fmtutil.

  Other locations may be used if you give them on the command line, or
  these trees don't exist, or you are not using the original TeX Live.

Report bugs to: tex-live\@tug.org
TeX Live home page: <http://tug.org/texlive/>
EOF
;
  print &version();
  print $usage;
  exit 0;
}



### Local Variables:
### perl-indent-level: 2
### tab-width: 2
### indent-tabs-mode: nil
### End:
# vim:set tabstop=2 expandtab: #
