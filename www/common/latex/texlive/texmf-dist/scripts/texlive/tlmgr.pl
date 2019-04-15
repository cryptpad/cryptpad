#!/usr/bin/env perl
# $Id: tlmgr.pl 38618 2015-10-12 02:51:38Z preining $
#
# Copyright 2008-2015 Norbert Preining
# This file is licensed under the GNU General Public License version 2
# or any later version.
#

my $svnrev = '$Revision: 38618 $';
my $datrev = '$Date: 2015-10-12 04:51:38 +0200 (Mon, 12 Oct 2015) $';
my $tlmgrrevision;
my $prg;
if ($svnrev =~ m/: ([0-9]+) /) {
  $tlmgrrevision = $1;
} else {
  $tlmgrrevision = "unknown";
}
$datrev =~ s/^.*Date: //;
$datrev =~ s/ \(.*$//;
$tlmgrrevision .= " ($datrev)";

our $Master;
our $ismain;
our $loadmediasrcerror;
our $packagelogfile;
our $packagelogged;
our $tlmgr_config_file;
our $pinfile;
our $action; # for the pod2usage -sections call
our %opts;

END {
  if ($opts{"pause"}) {
    print "Press Enter to exit the program.\n";
    <STDIN>;
  }
}

BEGIN {
  $^W = 1;
  $ismain = (__FILE__ eq $0);
  # WARNING
  # The only use anticipated for tlmgr.pl as library for the 2009 release
  # is the Windows w32client prototype script.
  # Unix-specific problems with use as library will probably go undetected.

  # make subprograms (including kpsewhich) have the right path:
  my ($bindir, $kpsewhichname);
  if ($^O =~ /^MSWin/i) {
    # on w32 $0 and __FILE__ point directly to tlmgr.pl; they can be relative
    $Master = __FILE__;
    $Master =~ s!\\!/!g;
    $Master =~ s![^/]*$!../../..!
      unless ($Master =~ s!/texmf-dist/scripts/texlive/tlmgr\.pl$!!i);
    $bindir = "$Master/bin/win32";
    $kpsewhichname = "kpsewhich.exe";
    # path already set by wrapper batchfile
  } else {
    $Master = __FILE__;
    $Master =~ s,/*[^/]*$,,;
    if ($ismain) {
      $bindir = $Master;
      $Master = "$Master/../..";
    } else {
      # for the time being, this code will not be used or tested
      $Master = "$Master/../../..";
      # no code yet for $bindir; would have to detect platform
    }
    # make subprograms (including kpsewhich) have the right path:
    $ENV{"PATH"} = "$bindir:$ENV{PATH}";
    $kpsewhichname = "kpsewhich";
  }
  if (-r "$bindir/$kpsewhichname") {
    # if not in bootstrapping mode => kpsewhich exists, so use it to get $Master
    chomp($Master = `kpsewhich -var-value=SELFAUTOPARENT`);
  }
  $::installerdir = $Master;

  #
  # make Perl find our packages first:
  unshift (@INC, "$Master/tlpkg");
  unshift (@INC, "$Master/texmf-dist/scripts/texlive");
}

use Cwd qw/abs_path/;
use File::Spec;
use Digest::MD5;
use Pod::Usage;
use Getopt::Long qw(:config no_autoabbrev permute);
use strict;

use TeXLive::TLConfig;
use TeXLive::TLPDB;
use TeXLive::TLPOBJ;
use TeXLive::TLUtils;
use TeXLive::TLWinGoo;
use TeXLive::TLDownload;
use TeXLive::TLConfFile;
TeXLive::TLUtils->import(qw(member info give_ctan_mirror win32 dirname
                            mkdirhier copy log debug tlcmp));
use TeXLive::TLPaper;

#
# set up $prg for warning messages
$prg = TeXLive::TLUtils::basename($0);

binmode(STDOUT, ":utf8");
binmode(STDERR, ":utf8");

our %config;       # hash of config settings from config file
our $remotetlpdb;
our $location;     # location from which the new packages come
our $localtlpdb;   # local installation which we are munging

# flags for machine-readable form
our $FLAG_REMOVE = "d";
our $FLAG_FORCIBLE_REMOVED = "f";
our $FLAG_UPDATE = "u";
our $FLAG_REVERSED_UPDATE = "r";
our $FLAG_AUTOINSTALL = "a";
our $FLAG_INSTALL = "i";
our $FLAG_REINSTALL = "I";

# keep in sync with install-tl.
our $common_fmtutil_args = 
  "--no-error-if-no-engine=$TeXLive::TLConfig::PartialEngineSupport";

# option variables
$::gui_mode = 0;
$::machinereadable = 0;

my %globaloptions = (
  "gui" => 1,
  "gui-lang" => "=s",
  "debug-translation" => 1,
  "location|repository|repo" => "=s",
  "machine-readable" => 1,
  "package-logfile" => "=s",
  "persistent-downloads" => "!",
  "no-execute-actions" => 1,
  "pin-file" => "=s",
  "pause" => 1,
  "print-platform|print-arch" => 1,
  "version" => 1,
  "help" => 1,
  "h|?" => 1);

my %action_specification = (
  '_include_tlpobj' => {
    "run-post" => 0,
    "function" => \&action_include_tlpobj
  },
  "backup" => { 
    "options" => {
      "backupdir" => "=s",
      "clean" => ":-99",
      "all" => 1,
      "dry-run|n" => 1
    },
    "run-post" => 1,
    "function" => \&action_backup
  },
  "candidates" => {
    "run-post" => 0,
    "function" => \&action_candidates
  },
  "check" => { 
    "options"  => { "use-svn" => 1 },
    "run-post" => 1,
    "function" => \&action_check
  },
  "conf" => {
    "options"  => { 
      "conffile" => "=s",
      "delete" => 1,
    },
    "run-post" => 0,
    "function" => \&action_conf
  },
  "dump-tlpdb" => { 
    "options"  => { "local" => 1, remote => 1 },
    "run-post" => 0,
    "function" => \&action_dumptlpdb
  },
  "generate" => { 
    "options"  => {
      "localcfg" => "=s",
      "dest" => "=s",
      "rebuild-sys" => 1
    },
    "run-post" => 1,
    "function" => \&action_generate
  },
  "get-mirror" => {
    "run-post" => 0,
    "function" => \&action_get_mirror
  },
  "gui" => { 
    "options"  => { "load" => 1 },
    "run-post" => 1,
    "function" => \&action_gui
  },
  "info" => { 
    "options"  => { "list" => 1, "only-installed" => 1 },
    "run-post" => 0,
    "function" => \&action_info
  },
  "init-usertree" => {
    "run-post" => 0,
    "function" => \&action_init_usertree
  },
  "install" => {
    "options"  => {
      "no-depends"        => 1,
      "no-depends-at-all" => 1,
      "file" => 1,
      "reinstall" => 1,
      "force" => 1,
      "dry-run|n" => 1,
      "with-doc" => 1,
      "with-src" => 1,
    },
    "run-post" => 1,
    "function" => \&action_install
  },
  "option" => { 
    "run-post" => 1,
    "function" => \&action_option
  },
  "paper" => { 
    "options"  => { "list" => 1 },
    "run-post" => 1,
    "function" => \&action_paper
  },
  "path" => {
    "options"  => { "w32mode" => "=s" },
    "run-post" => 0,
    "function" => \&action_path
  },
  "pinning" => { 
    "options"  => { "all" => 1 },
    "run-post" => 1,
    "function" => \&action_pinning
  },
  "platform" => { 
    "options"  => { "dry-run|n" => 1 },
    "run-post" => 1,
    "function" => \&action_platform
  },
  "postaction" => {
    "options" => {
      "w32mode" => "=s",
      "all" => 1,
      "fileassocmode" => "=i"
    },
    "run-post" => 0,
    "function" => \&action_postaction
  },
  "recreate-tlpdb" => { 
    "options"  => { "platform|arch" => "=s" },
    "run-post" => 0,
    "function" => \&action_recreate_tlpdb
  },
  "remove" => { 
    "options"  => {
      "no-depends"        => 1,
      "no-depends-at-all" => 1,
      "force" => 1,
      "dry-run|n" => 1
    },
    "run-post" => 1,
    "function" => \&action_remove
  },
  repository => {
    "options"  => { "with-platforms" => 1 },
    "run-post" => 1,
    "function" => \&action_repository
  },
  "restore" => {
    "options"  => {
      "backupdir" => "=s",
      "dry-run|n" => 1,
      "all" => 1,
      "force" => 1
    },
    "run-post" => 1,
    "function" => \&action_restore
  },
  "search" => {
    "options"  => {
      "global" => 1,
      "word" => 1,
      "file" => 1,
      "all" => 1,
    },
    "run-post" => 1,
    "function" => \&action_search
  },
  "uninstall" => {
    "options"  => { "force" => 1 },
    "run-post" => 0,
    "function" => \&action_uninstall
  },
  "update" => {
    "options"  => {
      "no-depends"                 => 1,
      "no-depends-at-all"          => 1,
      "all" => 1,
      "self" => 1,
      "list" => 1,
      "no-auto-remove"             => 1,
      "no-auto-install"            => 1,
      "reinstall-forcibly-removed" => 1,
      "force" => 1,
      "backupdir" => "=s",
      "backup" => 1,
      "exclude" => "=s@",
      "dry-run|n" => 1
    },
    "run-post" => 1,
    "function" => \&action_update
  },
  "version" => { }, # handled separately
);

main() if $ismain;

#####################################################################


sub main {
  my %options;       # TL options from local tlpdb

  my %globaloptions = (
    "gui" => 1,
    "gui-lang" => "=s",
    "debug-translation" => 1,
    "h|?" => 1,
    "help" => 1,
    "location|repository|repo" => "=s",
    "machine-readable" => 1,
    "no-execute-actions" => 1,
    "package-logfile" => "=s",
    "persistent-downloads" => "!",
    "pause" => 1,
    "pin-file" => "=s",
    "print-platform|print-arch" => 1,
    "usermode|user-mode" => 1,
    "usertree|user-tree" => "=s",
    "version" => 1,
  );

  my %optarg;
  for my $k (keys %globaloptions) {
    if ($globaloptions{$k} eq "1") {
      $optarg{$k} = 1;
    } else {
      $optarg{"$k" . $globaloptions{$k}} = 1;
    }
  }
  for my $v (values %action_specification) {
    if (defined($v->{'options'})) {
      my %opts = %{$v->{'options'}};
      for my $k (keys %opts) {
        if ($opts{$k} eq "1") {
          $optarg{$k} = 1;
        } else {
          $optarg{"$k" . $opts{$k}} = 1;
        }
      }
    }
  }

  # save command line options for later restart, if necessary
  @::SAVEDARGV = @ARGV;

  TeXLive::TLUtils::process_logging_options();

  GetOptions(\%opts, keys(%optarg)) or pod2usage(2);

  $::debug_translation = 0;
  $::debug_translation = 1 if $opts{"debug-translation"};

  $::machinereadable = $opts{"machine-readable"}
    if (defined($opts{"machine-readable"}));

  $action = shift @ARGV;
  if (!defined($action)) {
    if ($opts{"gui"}) {			# -gui = gui
      $action = "gui";
    } elsif ($opts{"print-platform"}) {	# -print-arch = print-arch
      $action = "print-platform";
    } else {
      $action = "";
    }
  }
  $action = lc($action);

  $action = "platform" if ($action eq "arch");

  ddebug("action = $action\n");
  for my $k (keys %opts) {
    ddebug("$k => $opts{$k}\n");
  }
  ddebug("arguments: @ARGV\n") if @ARGV;

  if ($opts{"version"} || (defined $action && $action eq "version")) {
    info(give_version());
    exit(0);
  }

  if (defined($action) && $action eq "help") {
    $opts{"help"} = 1;
  }

  if (defined($action) && $action eq "print-platform") {
    print TeXLive::TLUtils::platform(), "\n";
    exit 0;
  }

  #
  # ACTION massaging
  # for backward compatibility and usability

  # unify arguments so that the $action contains paper in all cases
  # and push the first arg back to @ARGV for action_paper processing
  if ($action =~ /^(paper|xdvi|psutils|pdftex|dvips|dvipdfmx?|context)$/) {
    unshift(@ARGV, $action);
    $action = "paper";
  }

  # backward compatibility with action "show" and "list" from before
  if ($action =~ /^(show|list)$/) {
    $action = "info";
  }

  # now $action should be part of %actionoptions, otherwise this is
  # an error
  if (defined($action) && $action && !exists $action_specification{$action}) {
    die "$prg: unknown action: $action; try --help if you need it.\n";
  }

  if ((!defined($action) || !$action) && !$opts{"help"} && !$opts{"h"}) {
    die "$prg: missing action; try --help if you need it.\n";
  }

  if ($opts{"help"} || $opts{"h"}) {
    # perldoc does ASCII emphasis on the output, and runs it through
    # $PAGER, so people want it.  But not all Unix platforms have it,
    # and on Windows our Config.pm can apparently interfere, so always
    # skip it there.  Or if users have NOPERLDOC set in the environment.
    my @noperldoc = ();
    if (win32() || $ENV{"NOPERLDOC"}) {
      @noperldoc = ("-noperldoc", "1");
    } else {
      if (!TeXLive::TLUtils::which("perldoc")) {
        @noperldoc = ("-noperldoc", "1");
      } else {
        # checking only for the existence of perldoc is not enough
        # because Debian/Ubuntu unfortunately ship a stub that does nothing;
        # try to check for that, too.
        my $ret = system("perldoc -V >/dev/null 2>&1");
        if ($ret == 0) {
          debug("working perldoc found, using it\n");
        } else {
          tlwarn("$prg: perldoc seems to be non-functional, not using it.\n");
          @noperldoc = ("-noperldoc", "1");
        }
      }
    }
    # less can break control characters and thus the output of pod2usage
    # is broken.  We add/set LESS=-R in the environment and unset
    # LESSPIPE and LESSOPEN to try to help.
    # 
    if (defined($ENV{'LESS'})) {
      $ENV{'LESS'} .= " -R";
    } else {
      $ENV{'LESS'} = "-R";
    }
    delete $ENV{'LESSPIPE'};
    delete $ENV{'LESSOPEN'};
    if ($action && ($action ne "help")) {
      # 1) Must use [...] form for -sections arg because otherwise the
      #    /$action subsection selector applies to all sections.
      #    https://rt.cpan.org/Public/Bug/Display.html?id=102116
      # 2) Must use "..." for that so the $action value is interpolated.
      pod2usage(-exitstatus => 0, -verbose => 99,
                -sections => [ 'NAME', 'SYNOPSIS', "ACTIONS/$::action.*" ],
                @noperldoc);
    } else {
      if ($opts{"help"}) {
        pod2usage(-exitstatus => 0, -verbose => 2, @noperldoc);
      } else {
        # give a short message about usage
        print "
tlmgr revision $tlmgrrevision
usage: tlmgr  OPTION...  ACTION  ARGUMENT...
where ACTION is one of:\n";
        for my $k (sort keys %action_specification) {
          # don't print internal options
          next if ($k =~ m/^_/);
          print " $k\n";
        }
        print "\nUse\n tlmgr ACTION --help
for more details on a specific option, and
 tlmgr --help
for the full story.\n";
        exit 0;
      }
    }
  }

  # --machine-readable is only supported by update.
  if ($::machinereadable && 
    $action ne "update" && $action ne "install" && $action ne "option") {
    tlwarn("$prg: --machine-readable output not supported for $action\n");
  }

  #
  # bail out of it is unknown action
  if (!defined($action_specification{$action})) {
    tlwarn("$prg: action unknown: $action\n");
    exit ($F_ERROR);
  }

  # check on supported arguments
  #
  my %suppargs;
  %suppargs = %{$action_specification{$action}{'options'}}
    if defined($action_specification{$action}{'options'});
  my @notvalidargs;
  for my $k (keys %opts) {
    my @allargs = keys %suppargs;
    push @allargs, keys %globaloptions;
    my $found = 0;
    for my $ok (@allargs) {
      my @variants = split '\|', $ok;
      if (TeXLive::TLUtils::member($k, @variants)) {
        $found = 1;
        last;
      }
    }
    push @notvalidargs, $k if !$found;
  }
  if (@notvalidargs) {
    my $msg = "The action $action does not support the following option(s):\n";
    for my $c (@notvalidargs) {
      $msg .= " $c";
    }
    tlwarn("$prg: $msg\n");
    tldie("$prg: Try --help if you need it.\n");
  }

  #
  # the main tree we will be working on
  $::maintree = $Master;
  if ($opts{"usermode"}) {
    # we could also try to detect that we don't have write permissions
    # and switch to user mode automatically
    if (defined($opts{"usertree"})) {
      $::maintree = $opts{"usertree"};
    } else {
      chomp($::maintree = `kpsewhich -var-value TEXMFHOME`);
    }
  }

  # besides doing normal logging if -logfile is specified, we try to log
  # package related actions (install, remove, update) to
  # the package-log file TEXMFSYSVAR/web2c/tlmgr.log
  $packagelogged = 0;  # how many msgs we logged
  chomp (my $texmfsysvar = `kpsewhich -var-value=TEXMFSYSVAR`);
  $packagelogfile = $opts{"package-logfile"};
  if ($opts{"usermode"}) {
    $packagelogfile ||= "$::maintree/web2c/tlmgr.log";
  } else {
    $packagelogfile ||= "$texmfsysvar/web2c/tlmgr.log";
  }
  #
  # Try to open the packagelog file, but do NOT die when that does not work
  if (!open(PACKAGELOG, ">>$packagelogfile")) {
    debug("Cannot open package log file $packagelogfile for appending\n");
    debug("Will not log package installation/removal/update for that run\n");
    $packagelogfile = "";
  }

  $loadmediasrcerror = "Cannot load TeX Live database from ";

  # load the config file and set the config options
  # load it BEFORE starting downloads as we set persistent-downloads there!
  load_config_file();

  # set global variable if execute actions should be suppressed
  $::no_execute_actions = 1 if (defined($opts{'no-execute-actions'}));


  # if we are asked to use persistent connections try to start it here
  {
    my $do_persistent;
    if (defined($opts{'persistent-downloads'})) {
      # a command line argument for persistent-downloads has been given,
      # either with --no-... or --... that overrides any other setting
      $do_persistent = $opts{'persistent-downloads'};
    } else {
      # check if it is set in the config file
      if (defined($config{'persistent-downloads'})) {
        $do_persistent = $config{'persistent-downloads'};
      }
    }
    # default method is doing persistent downloads:
    if (!defined($do_persistent)) {
      $do_persistent = 1;
    }
    ddebug("tlmgr:main: do persistent downloads = $do_persistent\n");
    if ($do_persistent) {
      TeXLive::TLUtils::setup_persistent_downloads() ;
    }
    if (!defined($::tldownload_server)) {
      debug("tlmgr:main: ::tldownload_server not defined\n");
    } else {
      debug("tlmgr:main: ::tldownload_server defined\n");
    }
  }

  my $ret = execute_action($action, @ARGV);

  if ($ret & $F_ERROR) {
    tlwarn("$prg: An error has occurred. See above messages. Exiting.\n");
  }

  # end of main program, returns also error codes 
  exit ($ret);

} # end main

sub give_version {
  if (!defined($::version_string)) {
    $::version_string = "";
    $::version_string .= "tlmgr revision $tlmgrrevision\n";
    $::version_string .= "tlmgr using installation: $Master\n";
    if (open (REL_TL, "$Master/release-texlive.txt")) {
      # print first and last lines, which have the TL version info.
      my @rel_tl = <REL_TL>;
      $::version_string .= $rel_tl[0];
      $::version_string .= $rel_tl[$#rel_tl];
      close (REL_TL);
    }
  }
  #
  # add the list of revisions
  if ($::opt_verbosity > 0) {
    $::version_string .= "Revisions of TeXLive:: modules:";
    $::version_string .= "\nTLConfig: " . TeXLive::TLConfig->module_revision();
    $::version_string .= "\nTLUtils:  " . TeXLive::TLUtils->module_revision();
    $::version_string .= "\nTLPOBJ:   " . TeXLive::TLPOBJ->module_revision();
    $::version_string .= "\nTLPDB:    " . TeXLive::TLPDB->module_revision();
    $::version_string .= "\nTLPaper:  " . TeXLive::TLPaper->module_revision();
    $::version_string .= "\nTLWinGoo: " . TeXLive::TLWinGoo->module_revision();
    $::version_string .= "\n";
  }
  return $::version_string;
}


sub execute_action {
  my ($action, @argv) = @_;

  # we have to set @ARGV to the @argv since many of the action_* subs
  # use GetOption
  @ARGV = @argv;

  # actions which shouldn't have any lasting effects, such as search or
  # list, end by calling finish(0), which skips postinstall actions.
  if (!defined($action_specification{$action})) {
    tlwarn ("$prg: unknown action: $action; try --help if you need it.\n");
    return ($F_ERROR);
  }

  if (!defined($action_specification{$action}{"function"})) {
    tlwarn ("$prg: action $action defined, but no way to execute it.\n");
    return ($F_ERROR);
  }

  my $ret = $F_OK;
  my $foo = &{$action_specification{$action}{"function"}}();
  if (defined($foo)) {
    if ($foo & $F_ERROR) {
      # warnings etc are given at the highest level, i.e., in main
      return($foo);
    }
    if ($foo & $F_WARNING) {
      tlwarn("$prg: action $action returned a warning.\n");
      $ret = $foo;
    }
  } else {
    $ret = $F_OK;
    tlwarn("$prg: didn't get return value from action $action, assuming ok.\n");
  }
  my $run_post = 1;
  if ($ret & $F_NOPOSTACTION) {
    # clear the postaction bit
    $ret ^= $F_NOPOSTACTION;
    $run_post = 0;
  }
  if (!$action_specification{$action}{"run-post"}) {
    $run_post = 0;
  }

  # close the special log file
  if ($packagelogfile && !$::gui_mode) {
    info("$prg: package log updated: $packagelogfile\n") if $packagelogged;
    close(PACKAGELOG);
  }

  return ($ret) if (!$run_post);

  # run external programs.
  $ret |= &handle_execute_actions();

  return $ret;
}



# run CMD with notice to the user and if exit status is nonzero, complain.
# return exit status.
# 
sub do_cmd_and_check
{
  my $cmd = shift;
  # we output the pre-running notice on a separate line so that
  # tlmgr front ends (MacOSX's TeX Live Utility) can read it
  # and show it to the user before the possibly long delay.
  info("running $cmd ...\n");
  my ($out, $ret);
  if ($opts{"dry-run"}) {
    $ret = $F_OK;
    $out = "";
  } else {
    ($out, $ret) = TeXLive::TLUtils::run_cmd("$cmd 2>&1");
  }
  if ($ret == 0) {
    info("done running $cmd.\n");
    log("--output of $cmd:\n$out\n--end of output of $cmd.");
    return ($F_OK);
  } else {
    info("\n");
    tlwarn("$cmd failed (status $ret), output:\n$out\n");
    return ($F_ERROR);
  }
}

# run external programs (mktexlsr, updmap-sys, etc.) as specified by the
# keys in the RET hash.  We return the number of unsuccessful runs, zero
# if all ok.
#
# If the "map" key is specified, the value may be a reference to a list
# of map command strings to pass to updmap, e.g., "enable Map=ascii.map".
#
sub handle_execute_actions {
  my $errors = 0;

  my $sysmode = ($opts{"usermode"} ? "" : "-sys");
  my $invoke_fmtutil = "fmtutil$sysmode $common_fmtutil_args";

  if ($::files_changed) {
    $errors += do_cmd_and_check("mktexlsr");
    if (defined($localtlpdb->get_package('context'))) {
      $errors += do_cmd_and_check("mtxrun --generate");
    }
    $::files_changed = 0;
  }

  chomp(my $TEXMFSYSVAR = `kpsewhich -var-value=TEXMFSYSVAR`);
  chomp(my $TEXMFSYSCONFIG = `kpsewhich -var-value=TEXMFSYSCONFIG`);
  chomp(my $TEXMFLOCAL = `kpsewhich -var-value=TEXMFLOCAL`);
  chomp(my $TEXMFDIST = `kpsewhich -var-value=TEXMFDIST`);

  # maps handling
  {
    my $updmap_run_needed = 0;
    for my $m (keys %{$::execute_actions{'enable'}{'maps'}}) {
      $updmap_run_needed = 1;
    }
    for my $m (keys %{$::execute_actions{'disable'}{'maps'}}) {
      $updmap_run_needed = 1;
    }
    my $dest = $opts{"usermode"} ? "$::maintree/web2c/updmap.cfg" 
               : "$TEXMFDIST/web2c/updmap.cfg";
    if ($updmap_run_needed) {
      TeXLive::TLUtils::create_updmap($localtlpdb, $dest);
    }
    $errors += do_cmd_and_check("updmap$sysmode") if $updmap_run_needed;
  }

  # format relevant things
  # we first have to check if the config files, that is fmtutil.cnf 
  # or one of the language* files have changed, regenerate them
  # if necessary, and then run the necessary fmtutil calls.
  {
    # first check for language* files
    my $regenerate_language = 0;
    for my $m (keys %{$::execute_actions{'enable'}{'hyphens'}}) {
      $regenerate_language = 1;
      last;
    }
    for my $m (keys %{$::execute_actions{'disable'}{'hyphens'}}) {
      $regenerate_language = 1;
      last;
    }
    if ($regenerate_language) {
      for my $ext ("dat", "def", "dat.lua") {
        my $lang = "language.$ext";
        info("regenerating $lang\n");
        my $arg1 = "$TEXMFSYSVAR/tex/generic/config/language.$ext";
        my $arg2 = "$TEXMFLOCAL/tex/generic/config/language-local.$ext";
        if ($ext eq "dat") {
          TeXLive::TLUtils::create_language_dat($localtlpdb, $arg1, $arg2);
        } elsif ($ext eq "def") {
          TeXLive::TLUtils::create_language_def($localtlpdb, $arg1, $arg2);
        } else {
          TeXLive::TLUtils::create_language_lua($localtlpdb, $arg1, $arg2);
        }
      }
    }

    #
    # check if *depending* formats have been changed
    # we are currently only caring for package "latex" and "tex". If
    # one of these has changed, we search for all packages *depending*
    # on latex/tex and regenerate all formats in these packages.
    #
    # do this only if we are not in --list or --dry-run mode
    if (!$opts{"list"}) {
      my @check_indirect_formats;
      # TODO:
      # in case that hyphenation patterns are changed, ie $regenerate_language
      # then maybe we don't need to update latex based ones?
      push @check_indirect_formats, $localtlpdb->needed_by("latex")
        if ($::latex_updated);
      push @check_indirect_formats, $localtlpdb->needed_by("tex")
        if ($::tex_updated);
      for my $p (@check_indirect_formats) {
          my $tlp = $localtlpdb->get_package($p);
          if (!defined($tlp)) {
            tlwarn("$p mentioned but not found in local tlpdb, strange!\n");
            next;
          }
          TeXLive::TLUtils::announce_execute_actions("enable", $tlp, "format");
      }
    }

    # format-regenerate is used when the paper size changes.  In that
    # case, if option("create_formats") is set, we simply want to generate
    # all formats
    #
    my %done_formats;
    my %updated_engines;
    my %format_to_engine;
    my %do_enable;
    my $do_full = 0;
    for my $m (keys %{$::execute_actions{'enable'}{'formats'}}) {
      $do_full = 1;
      $do_enable{$m} = 1;
      # here we check whether an engine is updated
      my %foo = %{$::execute_actions{'enable'}{'formats'}{$m}};
      if (!defined($foo{'name'}) || !defined($foo{'engine'})) {
        tlwarn("$prg: Very strange error, please report ", %foo);
      } else {
        $format_to_engine{$m} = $foo{'engine'};
        if ($foo{'name'} eq $foo{'engine'}) {
          $updated_engines{$m} = 1;
        }
      }
    }
    for my $m (keys %{$::execute_actions{'disable'}{'formats'}}) {
      $do_full = 1;
    }
    my $opt_fmt = $localtlpdb->option("create_formats");
    if ($do_full) {
      info("regenerating fmtutil.cnf in $TEXMFDIST\n");
      TeXLive::TLUtils::create_fmtutil($localtlpdb,
                                       "$TEXMFDIST/web2c/fmtutil.cnf");
    }
    if ($opt_fmt && !$::regenerate_all_formats) {
      # first regenerate all formats --byengine 
      for my $e (keys %updated_engines) {
        log ("updating formats based on $e\n");
        $errors += do_cmd_and_check
                    ("$invoke_fmtutil --no-error-if-no-format --byengine $e");
      }
      # now rebuild all other formats
      for my $f (keys %do_enable) {
        next if defined($updated_engines{$format_to_engine{$f}});
        # ignore disabled formats
        next if !$::execute_actions{'enable'}{'formats'}{$f}{'mode'};
        log ("(re)creating format dump $f\n");
        $errors += do_cmd_and_check ("$invoke_fmtutil --byfmt $f");
        $done_formats{$f} = 1;
      }
    }

    # now go back to the hyphenation patterns and regenerate formats
    # based on the various language files
    # this of course will in some cases duplicate fmtutil calls,
    # but it is much easier than actually checking which formats
    # don't need to be updated

    if ($regenerate_language) {
      for my $ext ("dat", "def", "dat.lua") {
        my $lang = "language.$ext";
        if (! TeXLive::TLUtils::win32()) {
          # Use full path for external command, except on Windows.
          $lang = "$TEXMFSYSVAR/tex/generic/config/$lang";
        }
        if ($localtlpdb->option("create_formats")
            && !$::regenerate_all_formats) {
          $errors += do_cmd_and_check ("$invoke_fmtutil --byhyphen \"$lang\"");
        }
      }
    }
  }

  #
  if ($::regenerate_all_formats) {
    info("Regenerating all formats, this may take some time ...");
    $errors += do_cmd_and_check("$invoke_fmtutil --all");
    info("done\n");
    $::regenerate_all_formats = 0;
  }

  # undefine the global var, otherwise in GUI mode the actions
  # are accumulating
  undef %::execute_actions;

  if ($errors > 0) {
    # should we return warning here?
    return $F_ERROR;
  } else {
    return $F_OK;
  }
}


#  GET_MIRROR
#
# just return a mirror
sub action_get_mirror {
  my $loc = give_ctan_mirror(); 
  print "$loc\n";
  return ($F_OK | $F_NOPOSTACTION);
}

#
# includes a .tlpobj in the db, also searchers for sub-tlpobj
# for doc and source files
#

#  _INCLUDE_TLPOBJ
#
# includes a .tlpobj in the db, also searchers for sub-tlpobj
# for doc and source files
#
sub action_include_tlpobj {
  # this is an internal function that should not be used outside
  init_local_db();
  for my $f (@ARGV) {
    my $tlpobj = TeXLive::TLPOBJ->new;
    $tlpobj->from_file($f);
    # we now have to check whether that is a .doc or .src package, so shipping
    # src or doc files from a different package.
    # We should have that package already installed ...
    my $pkg = $tlpobj->name;
    if ($pkg =~ m/^(.*)\.(source|doc)$/) {
      # got a .src or .doc package
      my $type = $2;
      my $mothership = $1;
      my $mothertlp = $localtlpdb->get_package($mothership);
      if (!defined($mothertlp)) {
        tlwarn("We are trying to add ${type} files to a nonexistent package $mothership!\n");
        tlwarn("Trying to continue!\n");
        # the best we can do is rename that package to $mothername and add it!
        $tlpobj->name($mothership);
        # add the src/docfiles tlpobj under the mothership name
        $localtlpdb->add_tlpobj($tlpobj);
      } else {
        if ($type eq "source") {
          $mothertlp->srcfiles($tlpobj->srcfiles);
          $mothertlp->srcsize($tlpobj->srcsize);
        } else {
          # must be "doc"
          $mothertlp->docfiles($tlpobj->docfiles);
          $mothertlp->docsize($tlpobj->docsize);
        }
        # that make sure that the original entry is overwritten
        $localtlpdb->add_tlpobj($mothertlp);
      }
    } else {
      # completely normal package, just add it
      $localtlpdb->add_tlpobj($tlpobj);
    }
    $localtlpdb->save;
  }
  # no error checking here for now
  return ($F_OK);
}


#  REMOVE
#
# tlmgr remove foo bar baz
#   will remove the packages foo bar baz itself
#   and will remove all .ARCH dependencies, too
#   and if some of them are collections it will also remove the
#   depending packages which are NOT Collections|Schemes.
#   if some of them are referenced somewhere they will not be removed
#   unless --force given
#
# tlmgr remove --no-depends foo bar baz
#   will remove the packages foo bar baz itself without any dependencies
#   but it will still remove all .ARCH dependency
#   if some of them are referenced somewhere they will not be removed
#   unless --force given
#
# tlmgr remove --no-depends-at-all foo bar baz
#   will absolutely only install foo bar baz not even taking .ARCH into
#   account
#
sub action_remove {
  my $ret = $F_OK;
  # we do the following:
  # - (not implemented) order collections such that those depending on
  #   other collections are first removed, and then those which only
  #   depend on packages. Otherwise
  #     remove collection-latex collection-latexrecommended
  #   will not succeed
  # - first loop over all cmd line args and consider only the collections
  # - for each to be removed collection:
  #   . check that no other collections/scheme asks for that collection
  #   . remove the collection
  #   . remove all dependencies
  # - for each normal package not already removed (via the above)
  #   . check that no collection/scheme still depends on this package
  #   . remove the package
  #
  $opts{"no-depends"} = 1 if $opts{"no-depends-at-all"};
  my %already_removed;
  my @more_removal;
  init_local_db();
  return($F_ERROR) if !check_on_writable();
  info("$prg remove: dry run, no changes will be made\n") if $opts{"dry-run"};
  my @packs = @ARGV;
  #
  # we have to be carefull not to remove too many packages. The idea is
  # as follows:
  # - let A be the set of all packages to be removed from the cmd line
  # - let A* be the set of A with all dependencies expanded
  # - let B be the set of all packages
  # - let C = B \ A*, ie the set of all packages without those packages
  #   in the set of A*
  # - let C* be the set of C with all dependencies expanded
  # - let D = A* \ C*, ie the set of all packages to be removed (A*)
  #   without all the package that are still needed (C*)
  # - remove all package in D
  # - for any package in A (not in A*, in A, ie on the cmd line) that is
  #   also in C* (so a package that was asked for to be removed on the
  #   cmd line, but it isn't because someone else asks for it), warn the
  #   user that it is still needed
  #
  # remove all .ARCH dependencies, too, unless $opts{"no-depends-at-all"}
  @packs = $localtlpdb->expand_dependencies("-only-arch", $localtlpdb, @packs)
    unless $opts{"no-depends-at-all"}; 
  # remove deps unless $opts{"no-depends"}
  @packs = $localtlpdb->expand_dependencies("-no-collections", $localtlpdb, @packs) unless $opts{"no-depends"};
  my %allpacks;
  for my $p ($localtlpdb->list_packages) { $allpacks{$p} = 1; }
  for my $p (@packs) { delete($allpacks{$p}); }
  my @neededpacks = $localtlpdb->expand_dependencies($localtlpdb, keys %allpacks);
  my %packs;
  my %origpacks;
  my @origpacks = $localtlpdb->expand_dependencies("-only-arch", $localtlpdb, @ARGV) unless $opts{"no-depends-at-all"};
  for my $p (@origpacks) { $origpacks{$p} = 1; }
  for my $p (@packs) { $packs{$p} = 1; }
  for my $p (@neededpacks) {
    if (defined($origpacks{$p})) {
      # that package was asked for to be removed on the cmd line
      my @needed = $localtlpdb->needed_by($p);
      if ($opts{"force"}) {
        info("$prg: $p is needed by " . join(" ", @needed) . "\n");
        info("$prg: removing it anyway, due to --force\n");
      } else {
        delete($packs{$p});
        tlwarn("$prg: not removing $p, needed by " .
          join(" ", @needed) . "\n");
        $ret |= $F_WARNING;
      }
    } else {
      delete($packs{$p});
    }
  }
  @packs = keys %packs;
  foreach my $pkg (sort @packs) {
    my $tlp = $localtlpdb->get_package($pkg);
    next if defined($already_removed{$pkg});
    if (!defined($tlp)) {
      info("$pkg: package not present, cannot remove\n");
      $ret |= $F_WARNING;
    } else {
      # in the first round we only remove collections, nothing else
      # but removing collections will remove all dependencies, too
      # save the information of which packages have already been removed
      # into %already_removed.
      if ($tlp->category eq "Collection") {
        my $foo = 0;
        info ("$prg: removing $pkg\n");
        if (!$opts{"dry-run"}) {
          $foo = $localtlpdb->remove_package($pkg);
          logpackage("remove: $pkg");
        }
        if ($foo) {
          # removal was successful, so the return is at least 0x0001 mktexlsr
          # remove dependencies, too
          $already_removed{$pkg} = 1;
        }
      } else {
        # save all the other packages into the @more_removal list to
        # be removed at the second state. Note that if a package has
        # already been removed due to a removal of a collection
        # it will be marked as such in %already_removed and not tried again
        push (@more_removal, $pkg);
      }
    }
  }
  foreach my $pkg (sort @more_removal) {
    if (!defined($already_removed{$pkg})) {
      info ("$prg: removing package $pkg\n");
      if (!$opts{"dry-run"}) {
        if ($localtlpdb->remove_package($pkg)) {
          # removal was successful
          logpackage("remove: $pkg");
          $already_removed{$pkg} = 1;
        }
      }
    }
  }
  if ($opts{"dry-run"}) {
    # stop here, don't do any postinstall actions
    return ($ret | $F_NOPOSTACTION);
  } else {
    $localtlpdb->save;
    my @foo = sort keys %already_removed;
    if (@foo) {
      info("$prg: ultimately removed these packages: @foo\n");
    } else {
      info("$prg: no packages removed.\n");
    }
  }
  return ($ret);
}


#  PAPER
# ARGV can look like:
#   paper a4
#   paper letter
#   [xdvi|...|context] paper [help|papersize|--list]
#
sub action_paper {
  init_local_db();
  my $texmfconfig;
  if ($opts{"usermode"}) {
    chomp($texmfconfig = `kpsewhich -var-value=TEXMFCONFIG`);
  } else {
    chomp($texmfconfig = `kpsewhich -var-value=TEXMFSYSCONFIG`);
  }
  $ENV{"TEXMFCONFIG"} = $texmfconfig;

  my $action = shift @ARGV;
  if ($action =~ m/^paper$/i) {  # generic paper
    my $newpaper = shift @ARGV;
    if ($opts{"list"}) {  # tlmgr paper --list => complain.
      tlwarn("$prg: ignoring paper setting to $newpaper with --list\n")
        if $newpaper;  # complain if they tried to set, too.
      tlwarn("$prg: please specify a program before paper --list, ",
             "as in: tlmgr pdftex paper --list\n");
      return($F_ERROR)

    } elsif (!defined($newpaper)) {  # tlmgr paper => show all current sizes.
      my $ret = $F_OK;
      for my $prog (sort keys %TeXLive::TLPaper::paper) {
        my $pkg = $TeXLive::TLPaper::paper{$prog}{'pkg'};
        if ($localtlpdb->get_package($pkg)) {
          $ret |= TeXLive::TLPaper::do_paper($prog,$texmfconfig,undef);
        }
      }
      return($ret);
      # return TeXLive::TLPaper::paper_all($texmfconfig,undef);

    } elsif ($newpaper !~ /^(a4|letter)$/) {  # tlmgr paper junk => complain.
      $newpaper = "the empty string" if !defined($newpaper);
      tlwarn("$prg: expected `a4' or `letter' after paper, not $newpaper\n");
      return($F_ERROR);

    } else { # tlmgr paper {a4|letter} => do it.
      return ($F_ERROR) if !check_on_writable();
      my $ret = $F_OK;
      for my $prog (sort keys %TeXLive::TLPaper::paper) {
        my $pkg = $TeXLive::TLPaper::paper{$prog}{'pkg'};
        if ($localtlpdb->get_package($pkg)) {
          $ret |= TeXLive::TLPaper::do_paper($prog,$texmfconfig,$newpaper);
        }
      }
      return($ret);
      # return (TeXLive::TLPaper::paper_all($texmfconfig,$newpaper));
    }

  } else {  # program-specific paper
    my $prog = $action;     # first argument is the program to change
    my $pkg = $TeXLive::TLPaper::paper{$prog}{'pkg'};
    if (!$localtlpdb->get_package($pkg)) {
      tlwarn("$prg: package $pkg is not installed - cannot adjust paper size!\n");
      return ($F_ERROR);
    }
    my $arg = shift @ARGV;  # get "paper" argument
    if (!defined($arg) || $arg ne "paper") {
      $arg = "the empty string." if ! $arg;
      tlwarn("$prg: expected `paper' after $prog, not $arg\n");
      return ($F_ERROR);
    }
    # the do_paper progs check for the argument --list, so if given
    # restore it to the cmd line.
    if (@ARGV) {
      return ($F_ERROR) if !check_on_writable();
    }
    unshift(@ARGV, "--list") if $opts{"list"};
    return(TeXLive::TLPaper::do_paper($prog,$texmfconfig,@ARGV));
  }
  # we should not come here anyway
  return($F_OK);
}


#  PATH
#
sub action_path {
  if ($opts{"usermode"}) {
    tlwarn("action `path' not supported in usermode!\n");
    exit 1;
  }
  my $what = shift @ARGV;
  if (!defined($what) || ($what !~ m/^(add|remove)$/i)) {
    $what = "" if ! $what;
    tlwarn("$prg: action path requires add or remove, not: $what\n");
    return ($F_ERROR);
  }
  init_local_db();
  my $winadminmode = 0;
  if (win32()) {
    #
    # for w32 we do system wide vs user setting detection as follows:
    # - if --w32mode is NOT given,
    #   - if admin
    #     --> honor opt_w32_multi_user setting in tlpdb
    #   - if not admin
    #     - if opt_w32_multi_user == NO
    #       --> do user path adjustment
    #     - if opt_w32_multi_user == YES
    #       --> do nothing, warn that the setting is on, suggest --w32mode user
    # - if --w32mode admin
    #   - if admin
    #     --> ignore opt_w32_multi_user and do system path adjustment
    #   - if non-admin
    #     --> do nothing but warn that user does not have privileges
    # - if --w32mode user
    #   - if admin
    #     --> ignore opt_w32_multi_user and do user path adjustment
    #   - if non-admin
    #     --> ignore opt_w32_multi_user and do user path adjustment
    if (!$opts{"w32mode"}) {
      $winadminmode = $localtlpdb->option("w32_multi_user");
      if (!TeXLive::TLWinGoo::admin()) {
        if ($winadminmode) {
          tlwarn("The TLPDB specifies system wide path adjustments\nbut you don't have admin privileges.\nFor user path adjustment please use\n\t--w32mode user\n");
          # and do nothing
          return ($F_ERROR);
        }
      }
    } else {
      # we are in the block where a --w32mode argument is given
      # we reverse the tests:
      if (TeXLive::TLWinGoo::admin()) {
        # in admin mode we simply use what is given on the cmd line
        if ($opts{"w32mode"} eq "user") {
          $winadminmode = 0;
        } elsif ($opts{"w32mode"} eq "admin") {
          $winadminmode = 1;
        } else {
          tlwarn("Unknown --w32admin mode: $opts{w32mode}, should be 'admin' or 'user'\n");
          return ($F_ERROR);
        }
      } else {
        # we are non-admin
        if ($opts{"w32mode"} eq "user") {
          $winadminmode = 0;
        } elsif ($opts{"w32mode"} eq "admin") {
          tlwarn("You don't have the privileges to work in --w32mode admin\n");
          return ($F_ERROR);
        } else {
          tlwarn("Unknown --w32admin mode: $opts{w32mode}, should be 'admin' or 'user'\n");
          return ($F_ERROR);
        }
      }
    }
  }
  my $ret = $F_OK;
  if ($what =~ m/^add$/i) {
    if (win32()) {
      $ret |= TeXLive::TLUtils::w32_add_to_path(
        $localtlpdb->root . "/bin/win32",
        $winadminmode);
      $ret |= TeXLive::TLWinGoo::broadcast_env();
    } else {
      $ret |= TeXLive::TLUtils::add_symlinks($localtlpdb->root,
        $localtlpdb->platform(),
        $localtlpdb->option("sys_bin"),
        $localtlpdb->option("sys_man"),
        $localtlpdb->option("sys_info"));
    }
  } elsif ($what =~ m/^remove$/i) {
    if (win32()) {
      $ret |= TeXLive::TLUtils::w32_remove_from_path(
        $localtlpdb->root . "/bin/win32",
        $winadminmode);
      $ret |= TeXLive::TLWinGoo::broadcast_env();
    } else {
      # remove symlinks
      $ret |= TeXLive::TLUtils::remove_symlinks($localtlpdb->root,
        $localtlpdb->platform(),
        $localtlpdb->option("sys_bin"),
        $localtlpdb->option("sys_man"),
        $localtlpdb->option("sys_info"));
    }
  } else {
    tlwarn("\n$prg: Should not happen, action_path what=$what\n");
    return ($F_ERROR);
  }
  # we should not need to run any post actions here, since
  # that changes only integrations, but no rebuild of formats etc etc
  # is needed
  return ($ret | $F_NOPOSTACTION);
}

#  DUMP TLPDB
#
sub action_dumptlpdb {
  init_local_db();
  
  # we are basically doing machine-readable output.
  my $savemr = $::machinereadable;
  $::machinereadable = 1;
  
  if ($opts{"local"} && !$opts{"remote"}) {
    # for consistency we write out the location of the installation,
    # too, in the same format as when dumping the remote tlpdb
    print "location-url\t", $localtlpdb->root, "\n";
    $localtlpdb->writeout;

  } elsif ($opts{"remote"} && !$opts{"local"}) {
    init_tlmedia_or_die();
    $remotetlpdb->writeout;

  } else {
    tlwarn("tlmgr dump-tlpdb: need exactly one of --local and --remote.\n");
    return ($F_ERROR);
  }
  
  $::machinereadable = $savemr;
  return ($F_OK | $F_NOPOSTACTION);
}
    
#  INFO
#
sub action_info {
  init_local_db();
  my ($what,@todo) = @ARGV;
  my $ret = $F_OK | $F_NOPOSTACTION;
  #
  # tlmgr info
  # tlmgr info collection
  # tlmgr info scheme
  # these commands just list the packages/collections/schemes installed with 
  # a short list
  if (!defined($what) || ($what =~ m/^(collections|schemes)$/i)) {
    show_list_of_packages($what);
    return ($F_OK | $F_NOPOSTACTION);
  }
  # we are still here, so $what is defined and neither collection nor scheme,
  # so assume the arguments are package names
  foreach my $ppp ($what, @todo) {
    my ($pkg, $tag) = split ('@', $ppp, 2);
    my $tlpdb = $localtlpdb;
    my $source_found;
    my $tlp = $localtlpdb->get_package($pkg);
    my $installed = 0;
    if (!$tlp) {
      if (!$remotetlpdb) {
        init_tlmedia_or_die();
      }
      if (defined($tag)) {
        if (!$remotetlpdb->is_virtual) {
          tlwarn("$prg: specifying implicit tags not allowed for non-virtual databases!\n");
          $ret |= $F_WARNING;
          next;
        } else {
          if (!$remotetlpdb->is_repository($tag)) {
            tlwarn("$prg: no such repository tag defined: $tag\n");
            $ret |= $F_WARNING;
            next;
          }
        }
      }
      $tlp = $remotetlpdb->get_package($pkg, $tag);
      if (!$tlp) {
        if (defined($tag)) {
          # we already searched for the package in a specific tag, don't retry
          # all candidates!
          tlwarn("$prg: Cannot find package $pkg in repository $tag\n");
          $ret |= $F_WARNING;
          next;
        }
        if ($remotetlpdb->is_virtual) {
          # we might have a package that is available in a
          # subsidiary repository, but not installable
          # because it is not pinned
          # we will list it but warn about this fact
          my @cand = $remotetlpdb->candidates($pkg);
          if (@cand) {
            my $first = shift @cand;
            if (defined($first)) {
              tlwarn("strange, we have a first candidate but no tlp: $pkg\n");
              $ret |= $F_WARNING;
              next;
            }
            # already shifted away the first element
            if ($#cand >= 0) {
              # recursively showing all tags, but warn
              print "package:     ", $pkg, "\n";
              print "WARNING:     This package is not pinned but present in subsidiary repositories\n";
              print "WARNING:     As long as it is not pinned it is not installable.\n";
              print "WARNING:     Listing all available copies of the package.\n";
              my @aaa;
              for my $a (@cand) {
                my ($t,$r) = split(/\//, $a, 2);
                push @aaa, "$pkg" . '@' . $t;
              }
              $ret |= action_info(@aaa);
              next;
            } else {
              tlwarn("strange, package listed but no residual candidates: $pkg\n");
              next;
            }
          } else {
            tlwarn("strange, package listed but no candidates: $pkg\n");
            $ret |= $F_WARNING;
            next;
          }
        }
        # we didn't find a package like this, so use search
        info("$prg: cannot find package $pkg, searching for other matches:\n");
        my ($foundfile, $founddesc) = search_tlpdb($remotetlpdb,$pkg,1,1,0);
        print "\nPackages containing \`$pkg\' in their title/description:\n";
        print $founddesc;
        print "\nPackages containing files matching \`$pkg\':\n";
        print $foundfile;
        #$ret |= $F_WARNING;
        next;
      }
      # we want to also show the source if it is known
      if (defined($tag)) {
        $source_found = $tag;
      } else {
        if ($remotetlpdb->is_virtual) {
          my ($firsttag, @cand) = $remotetlpdb->candidates($pkg);
          $source_found = $firsttag;
        } else {
          # might be single user repository, don't mention anything
        }
      }
      $tlpdb = $remotetlpdb;
    } else {
      $installed = 1;
    }
    my @colls;
    if ($tlp->category ne "Collection" && $tlp->category ne "Scheme") {
      @colls = $localtlpdb->needed_by($pkg);
      if (!@colls) {
        # not referenced in the local tlpdb, so try the remote here, too
        if (!$remotetlpdb) {
          init_tlmedia_or_die();
        }
        @colls = $remotetlpdb->needed_by($pkg);
      }
    }
    # some packages might depend on other packages, so do not
    # include arbitrary package in the list of collections, but
    # only collectons:
    @colls = grep {m;^collection-;} @colls;
    print "package:     ", $tlp->name, "\n";
    print "repository:  ", $source_found, "\n" if (defined($source_found));
    print "category:    ", $tlp->category, "\n";
    print "shortdesc:   ", $tlp->shortdesc, "\n" if ($tlp->shortdesc);
    print "longdesc:    ", $tlp->longdesc, "\n" if ($tlp->longdesc);
    print "installed:   ", ($installed ? "Yes" : "No"), "\n";
    print "revision:    ", $tlp->revision, "\n" if ($installed);
    # print out sizes
    my $sizestr = "";
    my $srcsize = $tlp->srcsize * $TeXLive::TLConfig::BlockSize;
    $sizestr = sprintf("%ssrc: %dk", $sizestr, int($srcsize / 1024) + 1) 
      if ($srcsize > 0);
    my $docsize = $tlp->docsize * $TeXLive::TLConfig::BlockSize;
    $sizestr .= sprintf("%sdoc: %dk", 
      ($sizestr ? ", " : ""), int($docsize / 1024) + 1)
        if ($docsize > 0);
    my $runsize = $tlp->runsize * $TeXLive::TLConfig::BlockSize;
    $sizestr .= sprintf("%srun: %dk", 
      ($sizestr ? ", " : ""), int($runsize / 1024) + 1)
        if ($runsize > 0);
    # check for .ARCH expansions
    my $do_archs = 0;
    for my $d ($tlp->depends) {
      if ($d =~ m/^(.*)\.ARCH$/) {
        $do_archs = 1;
        last;
      }
    }
    if ($do_archs) {
      my @a = $localtlpdb->available_architectures;
      my %binsz = %{$tlp->binsize};
      my $binsize = 0;
      for my $a (@a) {
        $binsize += $binsz{$a} if defined($binsz{$a});
        my $atlp = $tlpdb->get_package($tlp->name . ".$a");
        if (!$atlp) {
          tlwarn("$prg: cannot find depending package" . $tlp->name . ".$a\n");
          $ret |= $F_WARNING;
          next;
        }
        my %abinsz = %{$atlp->binsize};
        $binsize += $abinsz{$a} if defined($abinsz{$a});
      }
      $binsize *= $TeXLive::TLConfig::BlockSize;
      $sizestr .= sprintf("%sbin: %dk",
        ($sizestr ? ", " : ""), int($binsize / 1024) + 1)
          if ($binsize > 0);
    }
    print "sizes:       ", $sizestr, "\n";
    print "relocatable: ", ($tlp->relocated ? "Yes" : "No"), "\n";
    print "cat-version: ", $tlp->cataloguedata->{'version'}, "\n"
      if $tlp->cataloguedata->{'version'};
    print "cat-date:    ", $tlp->cataloguedata->{'date'}, "\n"
      if $tlp->cataloguedata->{'date'};
    print "cat-license: ", $tlp->cataloguedata->{'license'}, "\n"
      if $tlp->cataloguedata->{'license'};
    print "cat-topics:  ", $tlp->cataloguedata->{'topics'}, "\n"
      if $tlp->cataloguedata->{'topics'};
    print "cat-related: ", $tlp->cataloguedata->{'also'}, "\n"
      if $tlp->cataloguedata->{'also'};
    print "collection:  ", @colls, "\n" if (@colls);
    if ($opts{"list"}) {
      if ($tlp->category eq "Collection" || $tlp->category eq "Scheme") {
        # in the case of collections of schemes we list the deps
        my @deps = $tlp->depends;
        if (@deps) {
          print "depends:\n";
          for my $d (@deps) {
            print "\t$d\n";
          }
        }
      }
      print "Included files, by type:\n";
      # if the package has a .ARCH dependency we also list the files for
      # those packages
      my @todo = $tlpdb->expand_dependencies("-only-arch", $tlpdb, ($pkg));
      for my $d (sort @todo) {
        my $foo = $tlpdb->get_package($d);
        if (!$foo) {
          tlwarn ("\nShould not happen, no dependent package $d\n");
          $ret |= $F_WARNING;
          next;
        }
        if ($d ne $pkg) {
          print "depending package $d:\n";
        }
        if ($foo->runfiles) {
          print "run files:\n";
          for my $f (sort $foo->runfiles) { print "  $f\n"; }
        }
        if ($foo->srcfiles) {
          print "source files:\n";
          for my $f (sort $foo->srcfiles) { print "  $f\n"; }
        }
        if ($foo->docfiles) {
          print "doc files:\n";
          for my $f (sort $foo->docfiles) {
            print "  $f";
            my $dfd = $foo->docfiledata;
            if (defined($dfd->{$f})) {
              for my $k (keys %{$dfd->{$f}}) {
                print " $k=\"", $dfd->{$f}->{$k}, '"';
              }
            }
            print "\n";
          }
        }
        # in case we have them
        if ($foo->allbinfiles) {
          print "bin files (all platforms):\n";
        for my $f (sort $foo->allbinfiles) { print " $f\n"; }
        }
      }
    }
    print "\n";
  }
  return ($ret);
}


#  SEARCH
#
sub action_search {
  my ($r) = @ARGV;
  my $tlpdb;
  # check the arguments
  my $search_type_nr = 0;
  $search_type_nr++ if $opts{"file"};
  $search_type_nr++ if $opts{"all"};
  if ($search_type_nr > 1) {
    tlwarn("$prg: please specify only one thing to search for\n");
    return ($F_ERROR);
  }
  #
  if (!defined($r) || !$r) {
    tlwarn("$prg: nothing to search for.\n");
    return ($F_ERROR);
  }

  init_local_db();
  if ($opts{"global"}) {
    init_tlmedia_or_die();
    $tlpdb = $remotetlpdb;
  } else {
    $tlpdb = $localtlpdb;
  }

  my ($foundfile, $founddesc) = search_tlpdb($tlpdb, $r, 
    $opts{'file'} || $opts{'all'}, 
    (!$opts{'file'} || $opts{'all'}), 
    $opts{'word'});
 
  print $founddesc;
  print $foundfile;

  return ($F_OK | $F_NOPOSTACTION);
}

sub search_tlpdb {
  my ($tlpdb, $what, $dofile, $dodesc, $inword) = @_;
  my $retfile = '';
  my $retdesc = '';
  foreach my $pkg ($tlpdb->list_packages) {
    my $tlp = $tlpdb->get_package($pkg);
    
    # --file or --all -> search (full) file names
    if ($dofile) {
      my @ret = search_pkg_files($tlp, $what);
      if (@ret) {
        $retfile .= "$pkg:\n";
        foreach (@ret) {
          $retfile .= "\t$_\n";
        }
      }
    }
    #
    # no options or --all -> search package names/descriptions
    if ($dodesc) {
      next if ($pkg =~ m/\./);
      my $matched = search_pkg_desc($tlp, $what, $inword);
      $retdesc .= "$matched\n" if ($matched);
    }
  }
  return($retfile, $retdesc);
}

sub search_pkg_desc {
  my ($tlp, $what, $inword) = @_;
  my $pkg = $tlp->name;
  my $t = "$pkg\n";
  $t = $t . $tlp->shortdesc . "\n" if (defined($tlp->shortdesc));
  $t = $t . $tlp->longdesc . "\n" if (defined($tlp->longdesc));
  $t = $t . $tlp->cataloguedata->{'topics'} . "\n" if (defined($tlp->cataloguedata->{'topics'}));
  my $pat = $what;
  $pat = '\W' . $what . '\W' if ($inword);
  my $matched = "";
  if ($t =~ m/$pat/i) {
    my $shortdesc = $tlp->shortdesc || "";
    $matched .= "$pkg - $shortdesc";
  }
  return $matched;
}

sub search_pkg_files {
  my ($tlp, $what) = @_;
  my @files = $tlp->all_files;
  if ($tlp->relocated) {
    for (@files) { s:^$RelocPrefix/:$RelocTree/:; }
  }
  my @ret = grep(m;$what;, @files);
  return @ret;
}

#  RESTORE
#
# read the directory and check what files/package/rev are available
# for restore
sub get_available_backups {
  my $bd = shift;
  my $do_stat = shift;
  # initialize the hash(packages) of hash(revisions)
  my %backups;
  opendir (DIR, $bd) || die "opendir($bd) failed: $!";
  my @dirents = readdir (DIR);
  closedir (DIR) || warn "closedir($bd) failed: $!";
  #
  # see below for explanation, this has effects only on W32
  my $oldwsloppy = ${^WIN32_SLOPPY_STAT};
  ${^WIN32_SLOPPY_STAT} = 1;
  #
  for my $dirent (@dirents) {
    next if (-d $dirent);
    next if ($dirent !~ m/^(.*)\.r([0-9]+)\.tar\.xz$/);
    if (!$do_stat) {
      $backups{$1}->{$2} = 1;
      next;
    }
    my ($dev,$ino,$mode,$nlink,$uid,$gid,$rdev,$size,
      $atime,$mtime,$ctime,$blksize,$blocks) = stat("$bd/$dirent");
    # times: as we want to be portable we try the following times:
    # - first choice is ctime which hopefully works nicely
    # - on UFS (OSX) ctime is not supported, so use mtime
    # furthermore, if we are on W32 we want to be fast and make only
    # a sloppy stat
    # for more on that please see man perlport
    my $usedt = $ctime;
    if (!$usedt) {
      # can happen on 
      $usedt = $mtime;
    }
    if (!$usedt) {
      # stat failed, set key to -1 as a sign that there is a backup
      # but we cannot stat it
      $backups{$1}->{$2} = -1;
    } else {
      $backups{$1}->{$2} = $usedt;
    }
  }
  # reset the original value of the w32 sloppy mode for stating files
  ${^WIN32_SLOPPY_STAT} = $oldwsloppy;
  return %backups;
}

sub restore_one_package {
  my ($pkg, $rev, $bd) = @_;
  # first remove the package, then reinstall it
  # this way we get rid of useless files
  my $restore_file = "$bd/${pkg}.r${rev}.tar.xz";
  if (! -r $restore_file) {
    tlwarn("Cannot read $restore_file, no action taken\n");
    return ($F_ERROR);
  }
  $localtlpdb->remove_package($pkg);
  TeXLive::TLPDB->_install_package($restore_file , 0, [] ,$localtlpdb);
  logpackage("restore: $pkg ($rev)");
  # now we have to read the .tlpobj file and add it to the DB
  my $tlpobj = TeXLive::TLPOBJ->new;
  $tlpobj->from_file($localtlpdb->root . "/tlpkg/tlpobj/$pkg.tlpobj");
  $localtlpdb->add_tlpobj($tlpobj);
  TeXLive::TLUtils::announce_execute_actions("enable",
                                      $localtlpdb->get_package($pkg));
  $localtlpdb->save;
  # TODO_ERROCHECKING we should check the return values of the
  # various calls above
  return ($F_OK);
}

sub check_backupdir_selection {
  my $warntext = "";
  if ($opts{"backupdir"}) {
    my $ob = abs_path($opts{"backupdir"});
    $ob && ($opts{"backupdir"} = $ob);
    if (! -d $opts{"backupdir"}) {
      $warntext .= "$prg: backupdir argument\n";
      $warntext .= "  $opts{'backupdir'}\n";
      $warntext .= "is not a directory.\n";
      return ($F_ERROR, $warntext);
    }
  } else {
    # no argument, check for presence in TLPDB
    init_local_db(1);
    $opts{"backupdir"} = norm_tlpdb_path($localtlpdb->option("backupdir"));
    if (!$opts{"backupdir"}) {
      return (0, "$prg: No way to determine backupdir.\n");
    }
    # we are still here, there is something set in tlpdb
    my $ob = abs_path($opts{"backupdir"});
    $ob && ($opts{"backupdir"} = $ob);
    if (! -d $opts{"backupdir"}) {
      $warntext =  "$prg: backupdir as set in tlpdb\n";
      $warntext .= "  $opts{'backupdir'}\n";
      $warntext .= "is not a directory.\n";
      return ($F_ERROR, $warntext);
    }
  }
  return $F_OK;
}

sub action_restore {
  # tlmgr restore [--backupdir dir] --all
  #   restores of all packages found in backupdir the latest version
  # tlmgr restore --backupdir dir
  #   lists all packages with all revisions
  # tlmgr restore --backupdir dir pkg
  #   lists all revisions of pkg
  # tlmgr restore --backupdir dir pkg rev
  #   restores pkg to revision rev
  # check the backup dir argument

  {
    my ($a, $b) = check_backupdir_selection();
    if ($a & $F_ERROR) {
      # in all these cases we want to terminate in the non-gui mode
      tlwarn($b);
      return ($F_ERROR);
    }
  }
  info("$prg restore: dry run, no changes will be made\n") if $opts{"dry-run"};

  # initialize the hash(packages) of hash(revisions), do stat files! (the 1)
  my %backups = get_available_backups($opts{"backupdir"}, 1);
  my ($pkg, $rev) = @ARGV;
  if (defined($pkg) && $opts{"all"}) {
    tlwarn("$prg: Specify either --all or individual package(s) ($pkg)\n");
    tlwarn("$prg: to restore, not both.  Terminating.\n");
    return ($F_ERROR);
  }
  if ($opts{"all"}) {
    init_local_db(1);
    return ($F_ERROR) if !check_on_writable();
    if (!$opts{"force"}) {
      print "Do you really want to restore all packages to the latest revision found in\n\t$opts{'backupdir'}\n===> (y/N): ";
      my $yesno = <STDIN>;
      if ($yesno !~ m/^y(es)?$/i) {
        print "Ok, cancelling the restore!\n";
        return ($F_OK | $F_NOPOSTACTION);
      }
    }
    for my $p (sort keys %backups) {
      my @tmp = sort {$b <=> $a} (keys %{$backups{$p}});
      my $rev = $tmp[0];
      print "Restoring $p, $rev from $opts{'backupdir'}/${p}.r${rev}.tar.xz\n";
      if (!$opts{"dry-run"}) {
        # first remove the package, then reinstall it
        # this way we get rid of useless files
        # TODO_ERRORCHECK needs check for return values!!
        restore_one_package($p, $rev, $opts{"backupdir"});
      }
    }
    # localtlpdb already saved, so we are finished
    return ($F_OK);
  }
  #
  # intermediate sub
  sub report_backup_revdate {
    my $p = shift;
    my %revs = @_;
    my @rs = sort {$b <=> $a} (keys %revs);
    for my $rs (@rs) {
      my $dstr;
      if ($revs{$rs} == -1) {
        $dstr = "unknown";
      } else {
        my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) =
          localtime($revs{$rs});
        # localtime returns dates starting from 1900, and the month is 0..11
        $dstr = sprintf "%04d-%02d-%02d %02d:%02d", 
          $year+1900, $mon+1, $mday, $hour, $min;
      }
      print "$rs ($dstr) ";
    }
  }
  # end sub
  if (!defined($pkg)) {
    if (keys %backups) {
      print "Available backups:\n";
      foreach my $p (sort keys %backups) {
        print "$p: ";
        report_backup_revdate($p, %{$backups{$p}});
        print "\n";
      }
    } else {
      print "No backups available in $opts{'backupdir'}\n";
    }
    return ($F_OK | $F_NOPOSTACTION);
  }
  if (!defined($rev)) {
    print "Available backups for $pkg: ";
    report_backup_revdate($pkg, %{$backups{$pkg}});
    print "\n";
    return ($F_OK | $F_NOPOSTACTION);
  }
  # we did arrive here, so we try to restore ...
  if (defined($backups{$pkg}->{$rev})) {
    return if !check_on_writable();
    if (!$opts{"force"}) {
      print "Do you really want to restore $pkg to revision $rev (y/N): ";
      my $yesno = <STDIN>;
      if ($yesno !~ m/^y(es)?$/i) {
        print "Ok, cancelling the restore!\n";
        return ($F_OK | $F_NOPOSTACTION);
      }
    }
    print "Restoring $pkg, $rev from $opts{'backupdir'}/${pkg}.r${rev}.tar.xz\n";
    if (!$opts{"dry-run"}) {
      init_local_db(1);
      # first remove the package, then reinstall it
      # this way we get rid of useless files
      restore_one_package($pkg, $rev, $opts{"backupdir"});
    }
    # TODO_ERRORCHECKING check return value of restore_one_package
    return ($F_OK);
  } else {
    print "revision $rev for $pkg is not present in $opts{'backupdir'}\n";
    return ($F_ERROR);
  }
}

sub action_backup {
  init_local_db(1);
  # --clean argument
  # can be either -1 ... don't clean
  #               0  ... remove all backups
  #               N  ... keep only N backups
  # that parallels the value of autoclean in the configuration
  # we have to be careful, because if simply --clean is given, we should
  # check for the value saved in the tlpdb, and if that is not present
  # do nothing.
  # We have set clean to clean:-99 which makes -99 the default value
  # if only --clean is given without any argument
  # !defined($opts{"clean"})  -> no --clean given
  # $opts{"clean"} = -99      -> --clean without argument given, check tlpdb
  # $opts{"clean"} = -1, 0, N -> --clean=N given, check argument
  #
  my $clean_mode = 0;
  $clean_mode = 1 if defined($opts{"clean"});
  if ($clean_mode) {
    if ($opts{"clean"} == -99) {
      # we need to check the tlpdb
      my $tlpdb_option = $localtlpdb->option("autobackup");
      if (!defined($tlpdb_option)) {
        tlwarn ("--clean given without an argument, but no default clean\n");
        tlwarn ("mode specified in the tlpdb.\n");
        return ($F_ERROR);
      }
      $opts{"clean"} = $tlpdb_option;
    }
    # now $opts{"clean"} is something, but maybe not a number, check for
    # validity
    if ($opts{"clean"} =~ m/^(-1|[0-9]+)$/) {
      # get rid of leading zeros etc etc
      $opts{"clean"} = $opts{"clean"} + 0;
    } else {
      tlwarn ("clean mode as specified on the command line or as given by default\n");
      tlwarn ("must be an integer larger or equal than -1, terminating.\n");
      return($F_ERROR);
    }
  }
  # check the backup dir argument
  {
    my ($a, $b) = check_backupdir_selection();
    if ($a & $F_ERROR) {
      # in all these cases we want to terminate in the non-gui mode
      tlwarn($b);
      return($F_ERROR);
    }
  }

  # if we do --clean --all we also want to remove packages that
  # are not present anymore in the tlpdb, so use the readdir mode 
  # to determine backups
  if ($opts{"all"} && $clean_mode) {
    # initialize the hash(packages) of hash(revisions)
    # no need to stat the files
    my %backups = get_available_backups($opts{"backupdir"}, 0);
    init_local_db(1);
    for my $p (sort keys %backups) {
      clear_old_backups ($p, $opts{"backupdir"}, $opts{"clean"}, $opts{"dry-run"});
    }
    return ($F_OK | $F_NOPOSTACTION);
  }

  # in case we are not cleaning or cleaning only specific packages
  # use the one-by-one mode
  my @todo;
  if ($opts{"all"}) {
    @todo = $localtlpdb->list_packages;
  } else {
    @todo = @ARGV;
    @todo = $localtlpdb->expand_dependencies("-only-arch", $localtlpdb, @todo);
  }
  if (!@todo) {
    printf "tlmgr backup takes either a list of packages or --all\n";
    return ($F_ERROR);
  }
  foreach my $pkg (@todo) {
    if ($clean_mode) {
      clear_old_backups ($pkg, $opts{"backupdir"}, $opts{"clean"}, $opts{"dry-run"});
    } else {
      my $tlp = $localtlpdb->get_package($pkg);
      info("saving current status of $pkg to $opts{'backupdir'}/${pkg}.r" .
        $tlp->revision . ".tar.xz\n");
      if (!$opts{"dry-run"}) {
        $tlp->make_container("xz", $localtlpdb->root,
                             $opts{"backupdir"}, "${pkg}.r" . $tlp->revision);
      }
    }
  }
  # TODO_ERRORCHECKING neets checking of the above
  return ($F_OK);
}

# =====================================================================
#                  INFRASTRUCTURE UPDATE ON WINDOWS
# =====================================================================
#      Infrastructure files cannot be updated directly from the 
# tlmgr.pl script due to file locking problem on Windows - files that 
# are in use (either open or executing) cannot be removed or replaced. 
# For that reason the update process is performed by a batch script 
# outside of tlmgr.pl.
#      There are three pieces involved in the update: tlmgr.bat 
# launcher, write_w32_updater subroutine below and a batch 
# updater script. Their roles are as follows:
# * tlmgr.bat is a watchdog, it launches tlmgr.pl and watches for
#   the updater script that is to be executed. If the updater script 
#   exists before tlmgr.pl is launched, it will be removed or 
#   tlmgr.bat will abort if it fails to do so. This means that the 
#   updater script has to be created by the current invocation of 
#   tlmgr.pl. Futhermore, the updater script is renamed from 
#   updater-w32 to updater-w32.bat just before it is run, and thus 
#   it can be executed only once.
# * write_w32_updater subroutine in tlmgr.pl prepares the update
#   and writes the updater script. Packages in .xz archives are
#   dowloaded/copied and uncompressed to .tar files. Also .tar 
#   backups of the current packages are made. If everything is 
#   successful, the update script is created from the template. 
#   Otherwise the update is aborted.
# * updater-w32[.bat] batch script, triggers and executes the actual 
#   update. It first restarts itself in a separate instance of cmd.exe 
#   (and in a new console window in gui mode) and runs the update 
#   from there. The update is run with echo on and all output is 
#   logged to a file (or stderr in verbose mode). After successful 
#   infrastructure update, tlmgr is optionally restarted if update 
#   of other packages is asked for.
#      The infrastructure update itself proceeds as follows:
#   (1) untar all package archives
#   (2) include .tlpobj files into tlpdb
#   (3) print update info to console
#      Any error during (1) or (2) triggers the rollback sequence:
#   (1) print failed update info to console
#   (2) untar all package backups
#   (3) include .tlpobj files (from backup) into tlpdb
#   (4) print restore info to console
#      Any error during (2) or (3) and we go into panic state.  At this 
#   point there is no guarantee that the installation is still working. 
#   There is not much we can do but to print failed restore info and 
#   give instructions to download and run 'update-tlmgr-latest.exe'
#   to repair the installation.
# =====================================================================
#
sub write_w32_updater {
  my ($restart_tlmgr, $ref_files_to_be_removed, @w32_updated) = @_;
  my @infra_files_to_be_removed = @$ref_files_to_be_removed;
  # TODO do something with these files TODO
  my $media = $remotetlpdb->media;
  # we have to download/copy also the src/doc files if necessary!
  my $container_src_split = $remotetlpdb->config_src_container;
  my $container_doc_split = $remotetlpdb->config_doc_container;
  # get options about src/doc splitting from $totlpdb
  # TT: should we use local options to decide about install of doc & src?
  my $opt_src = $localtlpdb->option("install_srcfiles");
  my $opt_doc = $localtlpdb->option("install_docfiles");
  my $root = $localtlpdb->root;
  my $temp = "$root/temp";
  TeXLive::TLUtils::mkdirhier($temp);
  tlwarn("Backup option not implemented for infrastructure update.\n") if ($opts{"backup"});
  if ($media eq 'local_uncompressed') {
    tlwarn("Creating updater from local_uncompressed currently not implemented!\n");
    tlwarn("But it should not be necessary!\n");
    return 1; # abort
  }
  my (@upd_tar, @upd_tlpobj, @upd_info, @rst_tar, @rst_tlpobj, @rst_info);
  foreach my $pkg (@w32_updated) {
    my $repo;
    my $mediatlp;
    if ($media eq "virtual") {
      my $maxtlpdb;
      (undef, undef, $mediatlp, $maxtlpdb) = 
        $remotetlpdb->virtual_candidate($pkg);
      $repo = $maxtlpdb->root . "/$Archive";
      # update the media type of the used tlpdb
      # otherwise later on we stumble when preparing the updater
      $media = $maxtlpdb->media;
    } else {
      $mediatlp = $remotetlpdb->get_package($pkg);
      $repo = $remotetlpdb->root . "/$Archive";
    }
    my $localtlp = $localtlpdb->get_package($pkg);
    my $oldrev = $localtlp->revision;
    my $newrev = $mediatlp->revision;
    # we do install documenation files for category Documentation even if
    # option("install_docfiles") is false
    my $opt_real_doc = ($mediatlp->category =~ m/documentation/i) ? 1 : $opt_doc;
    my @pkg_parts = ($pkg);
    push(@pkg_parts, "$pkg.source") if ($container_src_split && $opt_src && $mediatlp->srcfiles);
    push(@pkg_parts, "$pkg.doc") if ($container_doc_split && $opt_real_doc && $mediatlp->docfiles);
    foreach my $pkg_part (@pkg_parts) {
      push (@upd_tar, "$pkg_part.tar");
      push (@upd_tlpobj, "tlpkg\\tlpobj\\$pkg_part.tlpobj");
    }
    push (@upd_info, "$pkg ^($oldrev -^> $newrev^)");
    push (@rst_tar, "__BACKUP_$pkg.r$oldrev.tar");
    push (@rst_tlpobj, "tlpkg\\tlpobj\\$pkg.tlpobj");
    push (@rst_info, "$pkg ^($oldrev^)");
    next if ($opts{"dry-run"});
    # create backup; make_container expects file name in a format: some-name.r[0-9]+
    my ($size, $md5, $fullname) = $localtlp->make_container("tar", $root, $temp, "__BACKUP_$pkg.r$oldrev");
    if ($size <= 0) {
      tlwarn("Creation of backup container of $pkg failed.\n");
      return 1; # backup failed? abort
    }
    foreach my $pkg_part (@pkg_parts) {
      if ($media eq 'local_compressed') {
        copy("$repo/$pkg_part.tar.xz", "$temp");
      } else { # net
        TeXLive::TLUtils::download_file("$repo/$pkg_part.tar.xz", "$temp/$pkg_part.tar.xz");
      }
      # now we should have the file present
      if (!-r "$temp/$pkg_part.tar.xz") {
        tlwarn("Couldn't get $pkg_part.tar.xz, that is bad\n");
        return 1; # abort
      }
      # unpack xz archive
      my $sysret = system("$::progs{'xzdec'} < \"$temp/$pkg_part.tar.xz\" > \"$temp/$pkg_part.tar\"");
      if ($sysret) {
        tlwarn("Couldn't unpack $pkg_part.tar.xz\n");
        return 1; # unpack failed? abort
      }
      unlink("$temp/$pkg_part.tar.xz"); # we don't need that archive anymore
    }
  }
  
  # prepare updater script
  my $respawn_cmd = "cmd.exe /e:on/v:off/d/c";
  $respawn_cmd = "start /wait $respawn_cmd" if ($::gui_mode);
  my $gui_pause = ($::gui_mode ? "pause" : "rem");
  my $upd_log = ($::opt_verbosity ? "STDERR" : '"%~dp0update-self.log"');
  my $std_handles_redir = ($::opt_verbosity ? "1^>^&2" : "2^>$upd_log 1^>^&2");
  my $pkg_log = ($packagelogfile ? "\"$packagelogfile\"" : "nul");
  my $post_update_msg = "You may now close this window.";
  my $rerun_tlmgr = "rem";
  if ($restart_tlmgr) {
    $post_update_msg = "About to restart tlmgr to complete update ...";
    # quote all arguments for tlmgr restart in case of spaces
    $rerun_tlmgr = join (" ", map ("\"$_\"", @::SAVEDARGV) );
    $rerun_tlmgr = "if not errorlevel 1 tlmgr.bat $rerun_tlmgr";
  }
  my $batch_script = <<"EOF";
:: This file is part of an automated update process of
:: infrastructure files and should not be run standalone. 
:: For more details about the update process see comments 
:: in tlmgr.pl (subroutine write_w32_updater).

  if [%1]==[:doit] goto :doit
  if not exist "%~dp0tar.exe" goto :notar
  $respawn_cmd call "%~f0" :doit $std_handles_redir
  $rerun_tlmgr
  goto :eof

:notar
  echo %~nx0: cannot run without "%~dp0tar.exe"
  findstr "^::" <"%~f0"
  exit /b 1

:doit
  set prompt=TL\$G
  title TeX Live Manager $TeXLive::TLConfig::ReleaseYear Update
  set PERL5LIB=$root/tlpkg/tlperl/lib
  >con echo DO NOT CLOSE THIS WINDOW!
  >con echo TeX Live infrastructure update in progress ...
  >con echo Detailed command logging to $upd_log
  chdir /d "%~dp0.."
  if not errorlevel 1 goto :update
  >con echo Could not change working directory to "%~dp0.."
  >con echo Aborting infrastructure update, no changes have been made.
  >con $gui_pause 
  exit /b 1
    
:update
  for %%I in (@upd_tar) do (
    temp\\tar.exe -xmf temp\\%%I
    if errorlevel 1 goto :rollback
  )
  tlpkg\\tlperl\\bin\\perl.exe .\\texmf-dist\\scripts\\texlive\\tlmgr.pl _include_tlpobj @upd_tlpobj
  if errorlevel 1 goto :rollback
  >>$pkg_log echo [%date% %time%] self update: @upd_info
  >con echo self update: @upd_info
  del "%~dp0*.tar" "%~dp0tar.exe" 
  >con echo Infrastructure update finished successfully.
  >con echo $post_update_msg
  >con $gui_pause 
  exit /b 0

:rollback
  >>$pkg_log echo [%date% %time%] failed self update: @upd_info
  >con echo failed self update: @upd_info
  >con echo Rolling back to previous version ...
  for %%I in (@rst_tar) do (
    temp\\tar.exe -xmf temp\\%%I
    if errorlevel 1 goto :panic
  )
  tlpkg\\tlperl\\bin\\perl.exe .\\texmf-dist\\scripts\\texlive\\tlmgr.pl _include_tlpobj @rst_tlpobj
  if errorlevel 1 goto :panic
  >>$pkg_log echo [%date% %time%] self restore: @rst_info
  >con echo self restore: @rst_info
  >con echo Infrastructure update failed. Previous version has been restored.
  >con $gui_pause 
  exit /b 1

:panic
  >>$pkg_log echo [%date% %time%] failed self restore: @rst_info
  >con echo failed self restore: @rst_info
  >con echo FATAL ERROR:
  >con echo Infrastructure update failed and backup recovery failed too.
  >con echo To repair your TeX Live installation download and run:
  >con echo $TeXLive::TLConfig::TeXLiveURL/update-tlmgr-latest.exe
  >con $gui_pause 
  exit /b 666
EOF

  ddebug("\n:: UPDATER BATCH SCRIPT ::\n$batch_script\n:: END OF FILE ::\n");
  if ($opts{"dry-run"}) {
    my $upd_info = "self update: @upd_info";
    $upd_info =~ s/\^//g;
    info($upd_info);
  } else {
    copy("$root/tlpkg/installer/tar.exe", "$temp");
    # make sure copied tar is working
    if (system("\"$temp/tar.exe\" --version >nul")) {
      tlwarn("Could not copy tar.exe, that is bad.\n");
      return 1; # abort
    }
    open UPDATER, ">$temp/updater-w32" or die "Cannot create updater script: $!";
    print UPDATER $batch_script;
    close UPDATER;
  }
  return 0;
}


#  UPDATE

# compute the list of auto-install, auto-remove, forcibly-removed 
# packages from the list of packages to be installed
# the list of packages passed in is already expanded
sub auto_remove_install_force_packages {
  my @todo = @_;
  my %removals_full;
  my %forcermpkgs_full;
  my %newpkgs_full;
  my %new_pkgs_due_forcerm_coll;
  # check for new/removed/forcibly removed packages.
  # we start from the list of installed collections in the local tlpdb
  # which are also present in the remote database
  # and expand this list once with expand_dependencies in the local tlpdb
  # and once in the tlmedia tlpdb. Then we compare the lists
  # let A = set of local expansions
  #     B = set of remote expansions
  # then we should(?) have
  #     B \ A  set of new packages
  #     A \ B  set of packages removed on the server
  #     A \cup B set of packages which should be checked for forcible removal
  #
  my @all_schmscolls = ();
  for my $p ($localtlpdb->schemes) {
    push (@all_schmscolls, $p) if defined($remotetlpdb->get_package($p));
  }
  for my $p ($localtlpdb->collections) {
    push (@all_schmscolls, $p) if defined($remotetlpdb->get_package($p));
  }
  my @localexpansion_full =
    $localtlpdb->expand_dependencies($localtlpdb, @all_schmscolls);
  my @remoteexpansion_full =
    $remotetlpdb->expand_dependencies($localtlpdb, @all_schmscolls);

  # compute new/remove/forcerm based on the full expansions
  for my $p (@remoteexpansion_full) {
    $newpkgs_full{$p} = 1;
  }
  for my $p (@localexpansion_full) {
    delete($newpkgs_full{$p});
    $removals_full{$p} = 1;
  }
  for my $p (@remoteexpansion_full) {
    delete($removals_full{$p});
  }
  # in a first round we check only for forcibly removed collections
  # this is necessary to NOT declare a package that is contained 
  # in a forcibly removed collections as auto-install since it appears
  # in the @remoteexpansion_full, but not in @localexpansion_full.
  for my $p (@localexpansion_full) {
    # intersection, don't check A\B and B\A
    next if $newpkgs_full{$p};
    next if $removals_full{$p};
    my $remotetlp = $remotetlpdb->get_package($p);
    if (!defined($remotetlp)) {
      tlwarn("Strange, $p mentioned but not found anywhere!\n");
      next;
    }
    next if ($remotetlp->category ne "Collection");
    my $tlp = $localtlpdb->get_package($p);
    if (!defined($tlp)) {
      if ($opts{"reinstall-forcibly-removed"}) {
        $newpkgs_full{$p} = 1;
      } else {
        $forcermpkgs_full{$p} = 1;
      }
    }
  }
  # now we have in %forcermpkgs_full only collections that have been
  # forcibly removed. Again, expand those against the remote tlpdb
  # and remove the expanded packages from the list of localexpansion.
  my @pkgs_from_forcerm_colls = 
    $remotetlpdb->expand_dependencies($localtlpdb, keys %forcermpkgs_full);
  # 
  # the package in @pkgs_from_forcerm_colls would be auto-installed, so
  # check for that:
  for my $p (keys %newpkgs_full) {
    if (member($p, @pkgs_from_forcerm_colls)) {
      delete $newpkgs_full{$p};
      $new_pkgs_due_forcerm_coll{$p} = 1;
    }
  }
  #
  # now create the final list of forcerm packages by checking against
  # all packages
  for my $p (@localexpansion_full) {
    # intersection, don't check A\B and B\A
    next if $newpkgs_full{$p};
    next if $removals_full{$p};
    my $tlp = $localtlpdb->get_package($p);
    if (!defined($tlp)) {
      if ($opts{"reinstall-forcibly-removed"}) {
        $newpkgs_full{$p} = 1;
      } else {
        $forcermpkgs_full{$p} = 1;
      }
    }
  }
  #
  # for some packages (texworks, psview, ...) we only have w32 packages
  # in the repository, but it is possible that alternative repositories
  # ship binaries for some platforms (like texworks for linux on tlcontrib)
  # currently updating from tlnet will remove these alternative .ARCH
  # packages because they are not listed anywhere locally, so they
  # are considered as disappearing.
  # We remove here packages PKG.ARCH if the main package PKG is found
  # here and is *not* disappearing, from the removal hash
  for my $p (keys %removals_full) {
    if ($p =~ m/^([^.]*)\./) {
      my $mpkg = $1;
      if (!defined($removals_full{$mpkg})) {
        delete($removals_full{$p});
      }
    }
  }
  #
  # now take only the subset of packages that is in @todo
  # note that @todo is already expanded in action_updated according
  # to the --no-depends and --no-depends-at-all options
  #
  my %removals;
  my %forcermpkgs;
  my %newpkgs;
  for my $p (@todo) {
    $removals{$p} = 1 if defined($removals_full{$p});
    $forcermpkgs{$p} = 1 if defined($forcermpkgs_full{$p});
    $newpkgs{$p} = 1 if defined($newpkgs_full{$p});
  }
  debug ("$prg: new pkgs: " . join("\n\t",keys %newpkgs) . "\n");
  debug ("$prg: deleted : " . join("\n\t",keys %removals) . "\n");
  debug ("$prg: forced  : " . join("\n\t",keys %forcermpkgs) . "\n");

  return (\%removals, \%newpkgs, \%forcermpkgs, \%new_pkgs_due_forcerm_coll);
}

# tlmgr update foo
#   if foo is of type Package|Documentation it will update only foo
#     and the respective .ARCH dependencies
#   if foo is of type Collection|Scheme it will update itself AND
#     will check all depending packs of type NOT(COllection|Scheme)
#     for necessary updates
#
# tlmgr update --no-depends foo
#   as above, but will not check for depends of Collections/Schemes
#   but it will still update .ARCH deps
#
# tlmgr update --no-depends-at-all foo
#   will absolutely only update foo not even taking .ARCH into account
#
# TLPDB->install_package INSTALLS ONLY ONE PACKAGE, no deps whatsoever
# anymore. That has all to be done by hand.
#
sub machine_line {
  my ($flag1) = @_;
  my $ret = 0;
  if ($flag1 eq "-ret") {
    $ret = 1;
    shift;
  }
  my ($pkg, $flag, $lrev, $rrev, $size, $runtime, $esttot, $tag, $lcv, $rcv) = @_;
  $lrev ||= "-";
  $rrev ||= "-";
  $flag ||= "?";
  $size ||= "-";
  $runtime ||= "-";
  $esttot ||= "-";
  $tag ||= "-";
  $lcv ||= "-";
  $rcv ||= "-";
  my $str = join("\t", $pkg, $flag, $lrev, $rrev, $size, $runtime, $esttot, $tag, $lcv, $rcv);
  $str .= "\n";
  return($str) if $ret;
  print $str;
}

sub upd_info {
  my ($pkg, $kb, $lrev, $mrev, $txt) = @_;
  my $flen = 25;
  my $kbstr = ($kb >= 0 ? " [${kb}k]" : "");
  my $kbstrlen = length($kbstr);
  my $pkglen = length($pkg);
  my $is = sprintf("%-9s ", "$txt:");
  if ($pkglen + $kbstrlen > $flen) {
    $is .= "$pkg$kbstr: ";
  } else {
    $is .= sprintf ('%*2$s', $pkg, -($flen-$kbstrlen));
    $is .= "$kbstr: ";
  }
  $is .= sprintf("local: %8s, source: %8s",
                         $lrev,       $mrev);
  info("$is\n");
}

sub action_update {
  my $ret = $F_OK;

  init_local_db(1);
  $opts{"no-depends"} = 1 if $opts{"no-depends-at-all"};

  # make a quick check on command line arguments to avoid loading
  # the remote db uselessly. 
  # we require:
  # if no --list is given: either --self or --all or <pkgs> 
  # if --list is given:    nothing
  # other options just change the behaviour
  if (!($opts{"list"} || @ARGV || $opts{"all"} || $opts{"self"})) {
    tlwarn("tlmgr update: specify --list, --all, --self, or a list of package names.\n");
    return ($F_ERROR);
  }

  init_tlmedia_or_die();
  info("$prg update: dry run, no changes will be made\n") if $opts{"dry-run"};

  my @excluded_pkgs = ();
  if ($opts{"exclude"}) {
    @excluded_pkgs = @{$opts{"exclude"}};
  }

  if (!$opts{"list"}) {
    return ($F_ERROR) if !check_on_writable();
  }

  # check for updates to tlmgr and die unless either --force or --list or --self
  # is given
  my @critical;
  if (!$opts{"usermode"}) {
    @critical = check_for_critical_updates($localtlpdb, $remotetlpdb);
  }
  my $dry_run_cont = $opts{"dry-run"} && ($opts{"dry-run"} < 0);
  if ( !$dry_run_cont  && !$opts{"self"} && @critical) {
    critical_updates_warning();
    if ($opts{"force"}) {
      tlwarn("$prg: Continuing due to --force.\n");
    } elsif ($opts{"list"}) {
      # do not warn here
    } else {
      return($F_ERROR);
    }
  }

  my $autobackup = 0;
  # check for the tlpdb option autobackup, and if present and true (!= 0)
  # assume we are doing backups
  if (!$opts{"backup"}) {
    $autobackup = $localtlpdb->option("autobackup");
    if ($autobackup) {
      # check the format, we currently allow only natural numbers, and -1
      if ($autobackup eq "-1") {
        debug ("Automatic backups activated, keeping all backups.\n");
        $opts{"backup"} = 1;
      } elsif ($autobackup eq "0") {
        debug ("Automatic backups disabled.\n");
      } elsif ($autobackup =~ m/^[0-9]+$/) {
        debug ("Automatic backups activated, keeping $autobackup backups.\n");
        $opts{"backup"} = 1;
      } else {
        tlwarn ("Option autobackup can only be an integer >= -1.\n");
        tlwarn ("Disabling auto backups.\n");
        $localtlpdb->option("autobackup", 0);
        $autobackup = 0;
        $ret |= $F_WARNING;
      }
    }
  }

  # cmd line --backup, we check for --backupdir, and if that is not given
  # we try to get the default from the tlpdb. If that doesn't work, exit.
  if ($opts{"backup"}) {
    my ($a, $b) = check_backupdir_selection();
    if ($a & $F_ERROR) {
      # in all these cases we want to terminate in the non-gui mode
      tlwarn($b);
      return ($F_ERROR);
    }
  }

  # finally, if we have --backupdir, but no --backup, just enable it
  $opts{"backup"} = 1 if $opts{"backupdir"};

  info("$prg: saving backups to $opts{'backupdir'}\n")
    if $opts{"backup"} && !$::machinereadable;

  # these two variables are used throughout this function
  my $root = $localtlpdb->root;
  my $temp = "$root/temp";

  # remove old _BACKUP packages that have piled up in temp
  # they can be recognized by their name starting with __BACKUP_
  for my $f (<$temp/__BACKUP_*>) {
    unlink($f) unless $opts{"dry-run"};
  }


  my @todo;
  if ($opts{"list"}) {
    if ($opts{"all"}) {
      @todo = $localtlpdb->list_packages;
    } elsif ($opts{"self"}) {
      @todo = @critical;
    } else {
      if (@ARGV) {
        @todo = @ARGV;
      } else {
        @todo = $localtlpdb->list_packages;
      }
    }
  } elsif ($opts{"self"} && @critical) {
    @todo = @critical;
  } elsif ($opts{"all"}) {
    @todo = $localtlpdb->list_packages;
  } else {
    @todo = @ARGV;
  }
  # don't do anything if we have been invoked in a strange way
  if (!@todo) {
    if ($opts{"self"}) {
      info("$prg: no updates for tlmgr present.\n");
    } else {
      tlwarn("tlmgr update: please specify a list of packages, --all, or --self.\n");
      return ($F_ERROR);
    }
  }

  if (!($opts{"self"} && @critical) || ($opts{"self"} && $opts{"list"})) {
    # update all .ARCH dependencies, too, unless $opts{"no-depends-at-all"}:
    @todo = $remotetlpdb->expand_dependencies("-only-arch", $localtlpdb, @todo)
      unless $opts{"no-depends-at-all"};
    #
    # update general deps unless $opts{"no-depends"}:
    @todo = $remotetlpdb->expand_dependencies("-no-collections",$localtlpdb,@todo)
      unless $opts{"no-depends"};
    #
    # filter out critical packages
    @todo = grep (!m/$CriticalPackagesRegexp/, @todo)
      unless $opts{"list"};
  }
    
  my ($remref, $newref, $forref, $new_due_to_forcerm_coll_ref) = 
    auto_remove_install_force_packages(@todo);
  my %removals = %$remref;
  my %forcermpkgs = %$forref;
  my %newpkgs = %$newref;
  my %new_due_to_forcerm_coll = %$new_due_to_forcerm_coll_ref;

  # check that the --exclude options do not conflict with the
  # options --no-auto-remove, --no-auto-install, --reinstall-forcibly-removed
  my @option_conflict_lines = ();
  my $in_conflict = 0;
  if (!$opts{"no-auto-remove"} && $config{"auto-remove"}) {
    for my $pkg (keys %removals) {
      for my $ep (@excluded_pkgs) {
        if ($pkg eq $ep || $pkg =~ m/^$ep\./) {
          push @option_conflict_lines, "$pkg: excluded but scheduled for auto-removal\n";
          $in_conflict = 1;
          last; # of the --exclude for loop
        }
      }
    }
  }
  if (!$opts{"no-auto-install"}) {
    for my $pkg (keys %newpkgs) {
      for my $ep (@excluded_pkgs) {
        if ($pkg eq $ep || $pkg =~ m/^$ep\./) {
          push @option_conflict_lines, "$pkg: excluded but scheduled for auto-install\n";
          $in_conflict = 1;
          last; # of the --exclude for loop
        }
      }
    }
  }
  if ($opts{"reinstall-forcibly-removed"}) {
    for my $pkg (keys %forcermpkgs) {
      for my $ep (@excluded_pkgs) {
        if ($pkg eq $ep || $pkg =~ m/^$ep\./) {
          push @option_conflict_lines, "$pkg: excluded but scheduled for reinstall\n";
          $in_conflict = 1;
          last; # of the --exclude for loop
        }
      }
    }
  }
  if ($in_conflict) {
    tlwarn("Conflicts have been found:\n");
    for (@option_conflict_lines) { tlwarn("  $_"); }
    tlwarn("Please resolve these conflicts!\n");
    return ($F_ERROR);
  }
      
  #
  # we first collect the list of packages to be actually updated or installed
  my %updated;
  my @new;
  my @addlines;

  TODO: foreach my $pkg (sort @todo) {
    next if ($pkg =~ m/^00texlive/);
    for my $ep (@excluded_pkgs) {
      if ($pkg eq $ep || $pkg =~ m/^$ep\./) {
        info("Skipping excluded package $pkg\n");
        next TODO;
      }
    }
    my $tlp = $localtlpdb->get_package($pkg);
    if (!defined($tlp)) {
      # if the user has forcibly removed (say) bin-makeindex, then the
      # loop above has no way to add bin-makeindex.ARCH into the
      # %forcermpkgs hash, but the .ARCH will still be in the dependency
      # expansion.  So try both with and without the .ARCH extension.
      (my $pkg_noarch = $pkg) =~ s/\.[^.]*$//;
      my $forcerm_coll = $forcermpkgs{$pkg} || $forcermpkgs{$pkg_noarch};

      # similarly for new packages.  If latexmk is new, latexmk.ARCH
      # will be in the dependency expansion, and we want it.
      my $newpkg_coll = $newpkgs{$pkg} || $newpkgs{$pkg_noarch};
      if ($forcerm_coll) {
        if ($::machinereadable) {
          # TODO should we add a revision number
          push @addlines,
            # $pkg, $flag, $lrev, $rrev, $size, $runtime, $esttot, $tag, $lcv, $rcv
            machine_line("-ret", $pkg, $FLAG_FORCIBLE_REMOVED);
        } else {
          info("skipping forcibly removed package $pkg\n");
        }
        next;
      } elsif ($newpkg_coll) {
        # do nothing here, it will be reported below.
      } elsif (defined($removals{$pkg})) {
        # skipping this package, it has been removed due to server removal
        # and has already been removed
        next;
      } elsif (defined($new_due_to_forcerm_coll{$pkg})) {
        debug("$prg: $pkg seems to be contained in a forcibly removed" .
          " collection, not auto-installing it!\n");
        next;
      } else {
        tlwarn("\n$prg: $pkg mentioned, but neither new nor forcibly removed\n");
        next;
      }
      # install new packages
      my $mediatlp = $remotetlpdb->get_package($pkg);
      if (!defined($mediatlp)) {
        tlwarn("\nShould not happen: $pkg not found in $location\n");
        $ret |= $F_WARNING;
        next;
      }
      my $mediarev = $mediatlp->revision;
      push @new, $pkg;
      next;
    }
    my $rev = $tlp->revision;
    my $lctanvers = $tlp->cataloguedata->{'version'};
    my $mediatlp;
    my $maxtag;
    if ($remotetlpdb->is_virtual) {
      ($maxtag, undef, $mediatlp, undef) =
        $remotetlpdb->virtual_candidate($pkg);
    } else {
      $mediatlp = $remotetlpdb->get_package($pkg);
    }
    if (!defined($mediatlp)) {
      debug("$pkg cannot be found in $location\n");
      next;
    }
    my $rctanvers = $mediatlp->cataloguedata->{'version'};
    my $mediarev = $mediatlp->revision;
    my $mediarevstr = $mediarev;
    my @addargs = ();
    if ($remotetlpdb->is_virtual) {
      push @addargs, $maxtag;
      $mediarevstr .= "\@$maxtag";
    } else {
      push @addargs, undef;
    }
    push @addargs, $lctanvers, $rctanvers;
    if ($rev < $mediarev) {
      $updated{$pkg} = 0; # will be changed to one on successful update
    } elsif ($rev > $mediarev) {
      if ($::machinereadable) {
        # $pkg, $flag, $lrev, $rrev, $size, $runtime, $esttot, $tag, $lcv, $rcv
        push @addlines,
          machine_line("-ret", $pkg, $FLAG_REVERSED_UPDATE, $rev, $mediarev, "-", "-", "-", @addargs);
      } else {
        if ($opts{"list"}) {
          # not issueing anything if we keep a package
          upd_info($pkg, -1, $rev, $mediarevstr, "keep");
        }
      }
    }
  }
  my @updated = sort keys %updated;
  for my $i (sort @new) {
    debug("$i new package\n");
  }
  for my $i (@updated) {
    debug("$i upd package\n");
  }

  # number calculation
  # without w32 special packages, those are dealt with in the updater batch
  # script
  my $totalnr = $#updated + 1;
  my @alltodo = @updated;
  my $nrupdated = 0;
  my $currnr = 1;

  # we have to remove all the stuff before we install other packages
  # to support moving of files from one package to another.
  # remove the packages that have disappeared:
  # we add that only to the list of total packages do be worked on
  # when --all is given, because we remove packages only on --all
  if (!$opts{"no-auto-remove"} && $config{"auto-remove"}) {
    my @foo = keys %removals;
    $totalnr += $#foo + 1;
  }
  if (!$opts{"no-auto-install"}) {
    $totalnr += $#new + 1;
    push @alltodo, @new;
  }

  # sizes_of_packages returns the sizes of *all* packages if nothing
  # is passed over, so if @new and @updated both are empty we will
  # get something wrong back, namely the total size of all packages
  # the third argument is undef to compute *all* platforms
  my %sizes;
  if (@alltodo) {
    %sizes = %{$remotetlpdb->sizes_of_packages(
      $localtlpdb->option("install_srcfiles"),
      $localtlpdb->option("install_docfiles"), undef, @alltodo)};
  } else {
    $sizes{'__TOTAL__'} = 0;
  }

  print "total-bytes\t$sizes{'__TOTAL__'}\n" if $::machinereadable;
  print "end-of-header\n" if $::machinereadable;

  # print deferred machine-readable lines after the header
  for (@addlines) { print; }

  #
  # compute the list of moved files from %removals, @new, @updated
  #
  my %do_warn_on_move;
  {
    # keep all these vars local to this block
    my @removals = keys %removals;
    my %old_files_to_pkgs;
    my %new_files_to_pkgs;
    # first save for each file in the currently installed packages
    # to be updated the packages it is contained it (might be more!)
    #
    # TODO WHY WHY is there the next so that all the file move checks
    # are actually disabled?!?!?!
    for my $p (@updated, @removals) {
      my $pkg = $localtlpdb->get_package($p);
      tlwarn("Should not happen: $p not found in local tlpdb\n") if (!$pkg);
      next;
      for my $f ($pkg->all_files) {
        push @{$old_files_to_pkgs{$f}}, $p;
      }
    }
    for my $p (@updated, @new) {
      my $pkg = $remotetlpdb->get_package($p);
      tlwarn("Should not happen: $p not found in $location\n") if (!$pkg);
      next;
      for my $f ($pkg->all_files) {
        if ($pkg->relocated) {
          $f =~ s:^$RelocPrefix/:$RelocTree/:;
        }
        push @{$new_files_to_pkgs{$f}}, $p;
      }
    }
    #
    # the idea of supressing warnings is simply that if a file is present
    # in more than one package either in the beginning or after a full 
    # update then this should give a warning. In all other cases
    # the warning should be supressed.
    for my $f (keys %old_files_to_pkgs) {
      my @a = @{$old_files_to_pkgs{$f}};
      $do_warn_on_move{$f} = 1 if ($#a > 0)
    }
    for my $f (keys %new_files_to_pkgs) {
      my @a = @{$new_files_to_pkgs{$f}};
      $do_warn_on_move{$f} = 1 if ($#a > 0)
    }
  }

  # parameters for field width
  my $totalnrdigits = length("$totalnr");

  #
  # ORDER OF PACKAGE ACTIONS
  # 1. removals
  # 2. updates
  # 3. auto-install
  # that way if a file has been moved from one to another package it
  # removing the old version after the new package has been installed 
  # will not give a warning about files being included somewhere else
  #

  #
  # REMOVALS
  #
  for my $p (keys %removals) {
    if ($opts{"no-auto-remove"} || !$config{"auto-remove"}) {
      info("not removing $p due to -no-auto-remove or config file option (removed on server)\n");
    } else {
      &ddebug("removing package $p\n");
      my $pkg = $localtlpdb->get_package($p);
      if (! $pkg) {
        # This happened when a collection was removed by the user,
        # and then renamed on the server, e.g., collection-langarab ->
        # collection-langarabic; Luecking report 20 July 2009.
        &ddebug(" get_package($p) failed, ignoring");
        next;
      }
      my $rev = $pkg->revision;
      my $lctanvers = $pkg->cataloguedata->{'version'};
      if ($opts{"list"}) {
        if ($::machinereadable) {
          # $pkg, $flag, $lrev, $rrev, $size, $runtime, $esttot, $tag, $lcv, $rcv
          machine_line($p, $FLAG_REMOVE, $rev, "-", "-", "-", "-", "-", $lctanvers);
        } else {
          upd_info($p, -1, $rev, "<absent>", "autorm");
        }
        $currnr++;
      } else {
        # new we are sure that:
        # - $opts{"no-auto-remove"} is *not* set
        # - $opts{"list"} is *not* set
        # we have to check in addition that
        # - $opts{"dry-run"} is not set
        if ($::machinereadable) {
          # $pkg, $flag, $lrev, $rrev, $size, $runtime, $esttot, $tag, $lcv, $rcv
          machine_line($p, $FLAG_REMOVE, $rev, "-", "-", "-", "-", "-", $lctanvers);
        } else {
          info("[" . sprintf ('%*2$s', $currnr, $totalnrdigits) .
            "/$totalnr] auto-remove: $p ... ");
        }
        if (!$opts{"dry-run"}) {
          # older tlmgr forgot to clear the relocated bit when saving a tlpobj
          # into the local tlpdb, although the paths were rewritten.
          # We have to clear this bit otherwise the make_container calls below
          # for creating the backup will create some rubbish!
          # Same as further down in the update part!
          if ($pkg->relocated) {
            debug("$prg: warn, relocated bit set for $p, but that is wrong!\n");
            $pkg->relocated(0);
          }
          if ($opts{"backup"}) {
            $pkg->make_container("xz", $root,
                                 $opts{"backupdir"}, 
                                 "${p}.r" . $pkg->revision,
                                 $pkg->relocated);
            if ($autobackup) {
              # in case we do auto backups we remove older backups
              clear_old_backups($p, $opts{"backupdir"}, $autobackup);
            }
          }
          $localtlpdb->remove_package($p);
          logpackage("remove: $p");
        }
        info("done\n") unless $::machinereadable;
        $currnr++;
      }
    }
  }


  my $starttime = time();
  my $donesize = 0;
  my $totalsize = $sizes{'__TOTAL__'};


  # 
  # UPDATES AND NEW PACKAGES
  #
  # order:
  # - update normal packages
  # - install new normal packages
  # - update collections
  # - install new collections
  # - update schemes
  # - install new schemes (? will not happen?)
  #
  # this makes sure that only if all depending packages are installed
  # the collection is updated, which in turn makes sure that 
  # if the installation of a new package does break it will not be
  # counted as forcibly removed later on.
  # 
  my @inst_packs;
  my @inst_colls;
  my @inst_schemes;
  for my $pkg (@updated) {
    # we do name checking here, not to load all tlpobj again and again
    if ($pkg =~ m/^scheme-/) {
      push @inst_schemes, $pkg;
    } elsif ($pkg =~ m/^collection-/) {
      push @inst_colls, $pkg;
    } else {
      push @inst_packs, $pkg;
    }
  }
  @inst_packs = sort packagecmp @inst_packs;

  my @new_packs;
  my @new_colls;
  my @new_schemes;
  for my $pkg (sort @new) {
    # we do name checking here, not to load all tlpobj again and again
    if ($pkg =~ m/^scheme-/) {
      push @new_schemes, $pkg;
    } elsif ($pkg =~ m/^collection-/) {
      push @new_colls, $pkg;
    } else {
      push @new_packs, $pkg;
    }
  }
  @new_packs = sort packagecmp @new_packs;
  my %is_new;
  for my $pkg (@new_packs, @new_colls, @new_schemes) {
    $is_new{$pkg} = 1;
  }
  
  #
  # TODO idea
  # currently this big loop contains a long if then for new packages
  # and updated package. That *could* be merged into one so that
  # some things like the logging has not been written two times.
  # OTOH, the control flow in the "new package" part is much simpler
  # and following it after the change would make it much harder
  #
  foreach my $pkg (@inst_packs, @new_packs, @inst_colls, @new_colls, @inst_schemes, @new_schemes) {
    
    if (!$is_new{$pkg}) {
      # skip this loop if infra update on w32
      next if ($pkg =~ m/^00texlive/);
      my $tlp = $localtlpdb->get_package($pkg);
      # we checked already that this package is present!
      # but our checks seem to be wrong, no idea why
      # ahhh, it seems that it can happen due to a stupid incident, a bug
      # on the server:
      # - remove a package from a collection
      # - at the same time increase its version number
      # then what happens is:
      # - first the package is removed (auto-remove!)
      # - then it is tried to be updated here, which is not working!
      # report that and ask for report
      if (!defined($tlp)) {
        my %servers = repository_to_array($location);
        my $servers = join("\n ", values(%servers));
        tlwarn("$prg: inconsistency on (one of) the server(s): $servers\n");
        tlwarn("$prg: tlp for package $pkg cannot be found, please report.\n");
        $ret |= $F_WARNING;
        next;
      }
      my $unwind_package;
      my $remove_unwind_container = 0;
      my $rev = $tlp->revision;
      my $lctanvers = $tlp->cataloguedata->{'version'};
      my $mediatlp;
      my $maxtag;
      if ($remotetlpdb->is_virtual) {
        ($maxtag, undef, $mediatlp, undef) =
          $remotetlpdb->virtual_candidate($pkg);
      } else {
        $mediatlp = $remotetlpdb->get_package($pkg);
      }
      if (!defined($mediatlp)) {
        debug("$pkg cannot be found in $location\n");
        next;
      }
      my $rctanvers = $mediatlp->cataloguedata->{'version'};
      my $mediarev = $mediatlp->revision;
      my $mediarevstr = $mediarev;
      my @addargs = ();
      if ($remotetlpdb->is_virtual) {
        push @addargs, $maxtag;
        $mediarevstr .= "\@$maxtag";
      } else {
        push @addargs, undef;
      }
      push @addargs, $lctanvers, $rctanvers;
      $nrupdated++;
      if ($opts{"list"}) {
        if ($::machinereadable) {
          # $pkg, $flag, $lrev, $rrev, $size, $runtime, $esttot, $tag, $lcv, $rcv
          machine_line($pkg, $FLAG_UPDATE, $rev, $mediarev, $sizes{$pkg}, "-", "-", @addargs);
        } else {
          my $kb = int($sizes{$pkg} / 1024) + 1;
          upd_info($pkg, $kb, $rev, $mediarevstr, "update");
          if ($remotetlpdb->is_virtual) {
            my @cand = $remotetlpdb->candidates($pkg);
            shift @cand;  # remove the top element
            if (@cand) {
              print "\tother candidates: ";
              for my $a (@cand) {
                my ($t,$r) = split(/\//, $a, 2);
                print $r . '@' . $t . " ";
              }
              print "\n";
            }
          }
        }
        $updated{$pkg} = 1;
        next;
      } elsif (win32() && ($pkg =~ m/$CriticalPackagesRegexp/)) {
        # we pretend that the update happened
        # in order to calculate file changes properly
        $updated{$pkg} = 1;
        next;
      }
      
      # older tlmgr forgot to clear the relocated bit when saving a tlpobj
      # into the local tlpdb, although the paths were rewritten. 
      # We have to clear this bit otherwise the make_container calls below
      # for creating an unwind container will create some rubbish
      # TODO for user mode we should NOT clear this bit!
      if ($tlp->relocated) {
        debug("$prg: warn, relocated bit set for $pkg, but that is wrong!\n");
        $tlp->relocated(0);
      }

      if ($opts{"backup"} && !$opts{"dry-run"}) {
        $tlp->make_container("xz", $root,
                             $opts{"backupdir"}, "${pkg}.r" . $tlp->revision,
                             $tlp->relocated);
        $unwind_package =
            "$opts{'backupdir'}/${pkg}.r" . $tlp->revision . ".tar.xz";
        
        if ($autobackup) {
          # in case we do auto backups we remove older backups
          clear_old_backups($pkg, $opts{"backupdir"}, $autobackup);
        }
      }
      
      my ($estrem, $esttot);
      if (!$opts{"list"}) {
        ($estrem, $esttot) = TeXLive::TLUtils::time_estimate($totalsize,
                                                             $donesize, $starttime);
      }
      
      if ($::machinereadable) {
        machine_line($pkg, $FLAG_UPDATE, $rev, $mediarev, $sizes{$pkg}, $estrem, $esttot, @addargs);
      } else {
        my $kb = int ($sizes{$pkg} / 1024) + 1;
        info("[" . sprintf ('%*2$s', $currnr, $totalnrdigits) .
          "/$totalnr, $estrem/$esttot] update: $pkg [${kb}k] ($rev -> $mediarevstr)");
      }
      $donesize += $sizes{$pkg};
      $currnr++;
      
      if ($opts{"dry-run"}) {
        info("\n") unless $::machinereadable;
        $updated{$pkg} = 1;
        next;
      } else {
        info(" ... ") unless $::machinereadable;  # more to come
      }
      
      if (!$unwind_package) {
        # no backup was made, so let us create a temporary .tar file
        # of the package
        my $tlp = $localtlpdb->get_package($pkg);
        my ($s, $m, $fullname) = $tlp->make_container("tar", $root, $temp,
                                      "__BACKUP_${pkg}.r" . $tlp->revision,
                                      $tlp->relocated);
        if ($s <= 0) {
          tlwarn("\n$prg: Creation of backup container of $pkg failed.\n");
          tlwarn("Continuing to update other packages, please retry...\n");
          $ret |= $F_WARNING;
          # we should try to update other packages at least
          next;
        }
        $remove_unwind_container = 1;
        $unwind_package = "$fullname";
      }
      # first remove the package, then reinstall it
      # this way we get rid of useless files
      # force the deinstallation since we will reinstall it
      #
      # the remove_package should also remove empty dirs in case
      # a dir is changed into a file
      if ($pkg =~ m/$CriticalPackagesRegexp/) {
        debug("Not removing critical package $pkg\n");
      } else {
        $localtlpdb->remove_package($pkg, 
          "remove-warn-files" => \%do_warn_on_move);
      }
      if ($remotetlpdb->install_package($pkg, $localtlpdb)) {
        # installation succeeded because we got a reference
        logpackage("update: $pkg ($rev -> $mediarevstr)");
        unlink($unwind_package) if $remove_unwind_container;
        # remember successful update
        $updated{$pkg} = 1;
        #
        # if we updated a .ARCH package we have to announce the postactions
        # of the parent package so that formats are rebuild
        if ($pkg =~ m/^([^.]*)\./) {
          my $parent = $1;
          if (!TeXLive::TLUtils::member($parent, @inst_packs, @new_packs, @inst_colls, @new_colls, @inst_schemes, @new_schemes)) {
            # ok, nothing happens with the parent package, so we have to
            # find it and execute the postactions
            my $parentobj = $localtlpdb->get_package($parent);
            if (!defined($parentobj)) {
              # well, in this case we might have hit a package that only
              # has .ARCH package, like psv.win32, so do nothing
              debug("$prg: .ARCH package without parent, not announcing postaction\n");
            } else {
              debug("$prg: announcing parent execute action for $pkg\n");
              TeXLive::TLUtils::announce_execute_actions("enable", $parentobj);
            }
          }
        }
      } else {
        # install_package returned a scalar, so error.
        # now in fact we should do some cleanup, removing files and
        # dirs from the new package before re-installing the old one.
        # TODO
        logpackage("failed update: $pkg ($rev -> $mediarevstr)");
        tlwarn("\n\nInstallation of new version of $pkg did fail, trying to unwind.\n");
        if (win32()) {
          # w32 is notorious for not releasing a file immediately
          # we experienced permission denied errors
          my $newname = $unwind_package;
          $newname =~ s/__BACKUP/___BACKUP/;
          copy ("-f", $unwind_package, $newname);
          # try to remove the file if has been created by us
          unlink($unwind_package) if $remove_unwind_container;
          # and make sure that the temporary file is removed in any case
          $remove_unwind_container = 1;
          $unwind_package = $newname;
        }
        my $instret = TeXLive::TLPDB->_install_package("$unwind_package", 0,
                                                       [], $localtlpdb);
        if ($instret) {
          # now we have to include the tlpobj
          my $tlpobj = TeXLive::TLPOBJ->new;
          $tlpobj->from_file($root . "/tlpkg/tlpobj/$pkg.tlpobj");
          $localtlpdb->add_tlpobj($tlpobj);
          $localtlpdb->save;
          logpackage("restore: $pkg ($rev)");
          $ret |= $F_WARNING;
          tlwarn("Restoring old package state succeeded.\n");
        } else {
          logpackage("failed restore: $pkg ($rev)");
          tlwarn("Restoring of old package did NOT succeed.\n");
          tlwarn("Most likely repair: run tlmgr install $pkg and hope.\n");
          # TODO_ERRORCHECKING
          # should we return F_ERROR here??? If we would do this, then
          # no postactions at all would run? Maybe better only to give
          # a warning
          $ret |= $F_WARNING;
        }
        unlink($unwind_package) if $remove_unwind_container;
      }
      info("done\n") unless $::machinereadable;
    } else { # $is_new{$pkg} is true!!!
      # 
      # NEW PACKAGES
      #
      if ($opts{"no-auto-install"}) {
        info("not auto-installing $pkg due to -no-auto-install (new on server)\n")
            unless $::machinereadable;
      } else {
        # install new packages
        my $mediatlp;
        my $maxtag;
        if ($remotetlpdb->is_virtual) {
          ($maxtag, undef, $mediatlp, undef) =
            $remotetlpdb->virtual_candidate($pkg);
        } else {
          $mediatlp = $remotetlpdb->get_package($pkg);
        }
        if (!defined($mediatlp)) {
          tlwarn("\nShould not happen: $pkg not found in $location\n");
          $ret |= $F_WARNING;
          next;
        }
        my $mediarev = $mediatlp->revision;
        my $mediarevstr = $mediarev;
        my @addargs;
        if ($remotetlpdb->is_virtual) {
          $mediarevstr .= "\@$maxtag";
          push @addargs, $maxtag;
        }
        my ($estrem, $esttot);
        if (!$opts{"list"}) {
          ($estrem, $esttot) = TeXLive::TLUtils::time_estimate($totalsize,
                                          $donesize, $starttime);
        }
        if ($::machinereadable) {
          my @maargs = ($pkg, $FLAG_AUTOINSTALL, "-", $mediatlp->revision, $sizes{$pkg});
          if (!$opts{"list"}) {
            push @maargs, $estrem, $esttot;
          } else {
            push @maargs, undef, undef;
          }
          machine_line(@maargs, @addargs);
        } else {
          my $kb = int($sizes{$pkg} / 1024) + 1;
          if ($opts{"list"}) {
            upd_info($pkg, $kb, "<absent>", $mediarevstr, "autoinst");
          } else {
            info("[" . sprintf ('%*2$s', $currnr, $totalnrdigits) .
              "/$totalnr, $estrem/$esttot] auto-install: $pkg ($mediarevstr) [${kb}k] ... ");
          }
        }
        $currnr++;
        $donesize += $sizes{$pkg};
        next if ($opts{"dry-run"} || $opts{"list"});
        if ($remotetlpdb->install_package($pkg, $localtlpdb)) {
          # installation succeeded because we got a reference
          logpackage("auto-install new: $pkg ($mediarevstr)");
          $nrupdated++;
          info("done\n") unless $::machinereadable;
        } else {
          tlwarn("$prg: couldn't install new package $pkg\n");
        }
      }
    }
  }

  #
  # special check for depending format updates:
  # if one of latex or tex has been updated, we rebuild the formats
  # defined in packages *depending* on these packages.
  if (!$opts{"list"}) {
    if ($updated{"latex"} || $updated{"babel"}) {
      TeXLive::TLUtils::announce_execute_actions("latex-updated");
    }
    TeXLive::TLUtils::announce_execute_actions("tex-updated") if ($updated{"tex"});
  }

  print "end-of-updates\n" if $::machinereadable;

  #
  # check that if updates to the critical packages are present all of
  # them have been successfully updated
  my $infra_update_done = 1;
  my @infra_files_to_be_removed;
  if ($opts{"list"}) {
    $infra_update_done = 0;
  } else {
    for my $pkg (@critical) {
      next unless (defined($updated{$pkg}));
      $infra_update_done &&= $updated{$pkg};
      my $oldtlp;
      my $newtlp;
      if ($updated{$pkg}) {
        $oldtlp = $localtlpdb->get_package($pkg);
        $newtlp = $remotetlpdb->get_package($pkg);
      } else {
        # update failed but we could introduce new files, that
        # should be removed now as a part of restoring backup
        $oldtlp = $remotetlpdb->get_package($pkg);
        $newtlp = $localtlpdb->get_package($pkg);
      }
      die ("That shouldn't happen: $pkg not found in tlpdb") if !defined($newtlp);
      die ("That shouldn't happen: $pkg not found in tlpdb") if !defined($oldtlp);
      my @old_infra_files = $oldtlp->all_files;
      my @new_infra_files = $newtlp->all_files;
      my %del_files;
      @del_files{@old_infra_files} = ();
      delete @del_files{@new_infra_files};
      for my $k (keys %del_files) {
        my @found_pkgs = $localtlpdb->find_file($k);
        if ($#found_pkgs >= 0) {
          my $bad_file = 1;
          if (win32()) {
            # on w32 the packages have not been removed already,
            # so we check that the only package listed in @found_pkgs
            # is the one we are working on ($pkg)
            if ($#found_pkgs == 0 && $found_pkgs[0] =~ m/^$pkg:/) {
              # only one package has been returned and it
              # matches the current package followed by a colon
              # remember the TLPDB->find_file returns 
              #   $pkg:$file
              # in this case we can ignore it
              $bad_file = 0;
            }
          }
          if ($bad_file) {
            tlwarn("$prg: The file $k has disappeared from the critical" .
                   "package $pkg but is still present in @found_pkgs\n");
            $ret |= $F_WARNING;
          } else {
            push @infra_files_to_be_removed, $k;
          }
        } else {
          push @infra_files_to_be_removed, $k;
        }
      }
    }

    if (!win32()) {
      for my $f (@infra_files_to_be_removed) {
        # TODO actually unlink the stuff
        #unlink("$Master/$f");
        debug("removing disappearing file $f\n");
      }
    } 
  } # end of if ($opts{"list"}) ... else part

  # check if any additional updates are asked for
  my $other_updates_asked_for = 0;
  if ($opts{"all"}) {
    $other_updates_asked_for = 1;
  } else {
    foreach my $p (@ARGV) {
      if ($p !~ m/$CriticalPackagesRegexp/) {
        $other_updates_asked_for = 1;
        last;
      }
    }
  }

  my $restart_tlmgr = 0;
  if ($opts{"self"} && @critical &&
      $infra_update_done && $other_updates_asked_for) {
    # weed out the --self argument from the saved arguments
    @::SAVEDARGV = grep (!m/^-?-self$/, @::SAVEDARGV);
    $restart_tlmgr = 1;
  }

  # infra update and tlmgr restart on w32 is done by the updater batch script
  if (win32() && !$opts{"list"} && @critical) {
    info("$prg: Preparing TeX Live infrastructure update...\n");
    for my $f (@infra_files_to_be_removed) {
      debug("file scheduled for removal $f\n");
    }
    my $ret = write_w32_updater($restart_tlmgr, 
                                \@infra_files_to_be_removed, @critical);
    if ($ret) {
      tlwarn ("$prg: Aborting infrastructure update.\n");
      $ret |= $F_ERROR;
      $restart_tlmgr = 0 if ($opts{"dry-run"});
    }
  }

  # only when we are not dry-running we restart the program
  if (!win32() && $restart_tlmgr && !$opts{"dry-run"} && !$opts{"list"}) {
    info ("Restarting tlmgr to complete update ...\n");
    debug("restarting tlmgr @::SAVEDARGV\n");
    exec("tlmgr", @::SAVEDARGV);
    # we need warn here, otherwise perl gives warnings!
    warn ("$prg: cannot restart tlmgr, please retry update\n");
    return ($F_ERROR);
  }

  # for --dry-run we cannot restart tlmgr (no way to fake successful 
  # infra update) instead we call action_update() again and signal this 
  # by $opts{"dry-run"} = -1
  if ($opts{"dry-run"} && !$opts{"list"} && $restart_tlmgr) {
    $opts{"self"} = 0;
    $opts{"dry-run"} = -1;
    $localtlpdb = undef;
    $remotetlpdb = undef;
    info ("Restarting tlmgr to complete update ...\n");
    $ret |= action_update();
    return ($ret);
  }
  
  # if a real update from default disk location didn't find anything,
  # warn if nothing is updated.
  if (!(@new || @updated)) {
    info("$prg: no updates available\n");
    if ($remotetlpdb->media ne "NET"
        && $remotetlpdb->media ne "virtual"
        && !$opts{"dry-run"}
        && !$opts{"repository"}
        && !$ENV{"TEXLIVE_INSTALL_ENV_NOCHECK"}
       ) {
      tlwarn(<<END_DISK_WARN);
$prg: Your installation is set up to look on the disk for updates.
To install from the Internet for this one time only, run:
  tlmgr -repository $TeXLiveURL ACTION ARG...
where ACTION is install, update, etc.; see tlmgr -help if needed.

To change the default for all future updates, run:
  tlmgr option repository $TeXLiveURL
END_DISK_WARN
    }
  }
  return ($ret);
}


#  INSTALL
#
# tlmgr install foo bar baz
#   will create the closure under dependencies of {foo,bar,baz}, i.e. all
#   dependencies recursively down to the last package, and install all
#   the packages that are necessary
#
# tlmgr install --no-depends foo bar baz
#   will *only* install these three packages (if they are not already installed
#   but it will STILL INSTALL foo.ARCH if they are necessary.
#
# tlmgr install --no-depends-at-all foo bar baz
#   will absolutely only install these three packages, and will not even
#   take .ARCH deps into account
#
# tlmgr install --reinstall ...
#   behaves exactely like without --reinstall BUT the following two
#   differences:
#   . dependencies are not expanded from collection to collection, so
#     if you reinstall a collection then all its dependencies of type
#     Package will be reinstalled, too, but not the dependencies on
#     other collection, because that would force the full reinstallation
#     of the whole installation
#   . it does not care for whether a package seems to be installed or
#     not (that is the --reinstall)
#
# TLPDB->install_package does ONLY INSTALL ONE PACKAGE, no deps whatsoever
# anymore!  That has all to be done by the caller.
#
sub action_install {
  init_local_db(1);
  my $ret = $F_OK;
  return ($F_ERROR) if !check_on_writable();

  # installation from a .tar.xz
  if ($opts{"file"}) {
    if ($localtlpdb->install_package_files(@ARGV)) {
      return ($ret);
    } else {
      return ($F_ERROR);
    }
  }

  # if we are still here, we are installing from some repository
  # initialize the TLPDB from $location
  $opts{"no-depends"} = 1 if $opts{"no-depends-at-all"};
  init_tlmedia_or_die();

  # check for updates to tlmgr itself, and die unless --force is given
  if (!$opts{"usermode"}) {
    if (check_for_critical_updates( $localtlpdb, $remotetlpdb)) {
      critical_updates_warning();
      if ($opts{"force"}) {
        tlwarn("Continuing due to --force\n");
      } else {
        if ($::gui_mode) {
          # return here and don't do any updates
          return ($F_ERROR);
        } else {
          die "$prg: Terminating; please see warning above!\n";
        }
      }
    }
  }

  $opts{"no-depends"} = 1 if $opts{"no-depends-at-all"};
  info("$prg install: dry run, no changes will be made\n") if $opts{"dry-run"};

  my @packs = @ARGV;
  # first expand the .ARCH dependencies unless $opts{"no-depends-at-all"}
  @packs = $remotetlpdb->expand_dependencies("-only-arch", $localtlpdb, @ARGV)
    unless $opts{"no-depends-at-all"};
  #
  # if no-depends, we're done; else get rest of deps.
  unless ($opts{"no-depends"}) {
    if ($opts{"reinstall"} || $opts{"usermode"}) {
      # if reinstall or usermode, omit collection->collection deps
      @packs = $remotetlpdb->expand_dependencies("-no-collections",
                                                 $localtlpdb, @packs);
    } else {
      @packs = $remotetlpdb->expand_dependencies($localtlpdb, @packs);
    }
  }
  #
  # expand dependencies returns a list pkg@tag in case of a virtual
  # remote db.
  my %packs;
  for my $p (@packs) {
    my ($pp, $aa) = split('@', $p);
    $packs{$pp} = (defined($aa) ? $aa : 0);
  }
  #
  # installation order of packages:
  # first all normal packages, then collections, then schemes
  # isn't already installed, but the collection already updated, it will
  # be reported as forcibly removed.
  my @inst_packs;
  my @inst_colls;
  my @inst_schemes;
  for my $pkg (sort keys %packs) {
    # we do name checking here, not to load all tlpobj again and again
    if ($pkg =~ m/^scheme-/) {
      push @inst_schemes, $pkg;
    } elsif ($pkg =~ m/^collection-/) {
      push @inst_colls, $pkg;
    } else {
      push @inst_packs, $pkg;
    }
  }
  @inst_packs = sort packagecmp @inst_packs;

  my $starttime = time();
  # count packages
  my $totalnr = 0;
  my %revs;
  my @todo;
  for my $pkg (@inst_packs, @inst_colls, @inst_schemes) {
    my $pkgrev = 0;
    # if the package name is asked from a specific repository, use
    # that one, otherwise leave the  decision to $remotetlpdb by not
    # giving a final argument
    my $mediatlp = $remotetlpdb->get_package($pkg,
      ($packs{$pkg} ? $packs{$pkg} : undef));
    if (!defined($mediatlp)) {
      tlwarn("$prg install: package $pkg not present in repository.\n");
      $ret |= $F_WARNING;
      next;
    }
    if (defined($localtlpdb->get_package($pkg))) {
      if ($opts{"reinstall"}) {
        $totalnr++;
        $revs{$pkg} = $mediatlp->revision;
        push @todo, $pkg;
      } else {
        # debug msg that we have this one.
        debug("already installed: $pkg\n");
        # if explicitly requested by user (not a dep), tell them.
        info("$prg install: package already present: $pkg\n")
          if grep { $_ eq $pkg } @ARGV;
      }
    } else {
      $totalnr++;
      $revs{$pkg} = $mediatlp->revision;
      push (@todo, $pkg);
    }
  }
  # return if there is nothing to install!
  return ($ret) if (!@todo);

  my $orig_do_src = $localtlpdb->option("install_srcfiles");
  my $orig_do_doc = $localtlpdb->option("install_docfiles");
  if (!$opts{"dry-run"}) {
    $localtlpdb->option("install_srcfiles", 1) if $opts{'with-src'};
    $localtlpdb->option("install_docfiles", 1) if $opts{'with-doc'};
  }

  my $currnr = 1;
  # undef here is a ref to array of platforms, if undef all are used
  my %sizes = %{$remotetlpdb->sizes_of_packages(
    $localtlpdb->option("install_srcfiles"),
    $localtlpdb->option("install_docfiles"), undef, @todo)};
  defined($sizes{'__TOTAL__'}) || ($sizes{'__TOTAL__'} = 0);
  my $totalsize = $sizes{'__TOTAL__'};
  my $donesize = 0;
  
  print "total-bytes\t$sizes{'__TOTAL__'}\n" if $::machinereadable;
  print "end-of-header\n" if $::machinereadable;

  foreach my $pkg (@todo) {
    my $flag = $FLAG_INSTALL;
    my $re = "";
    my $tlp = $remotetlpdb->get_package($pkg);
    my $rctanvers = $tlp->cataloguedata->{'version'};
    if (!defined($tlp)) {
      info("Unknown package $pkg\n");
      next;
    }
    if (!$tlp->relocated && $opts{"usermode"}) {
      info("Package $pkg is not relocatable, cannot install it in user mode!\n");
      next;
    }
    my $lctanvers;
    if (defined($localtlpdb->get_package($pkg))) {
      my $lctanvers = $localtlpdb->get_package($pkg)->cataloguedata->{'version'};
      if ($opts{"reinstall"}) {
        $re = "re";
        $flag = $FLAG_REINSTALL;
      } else {
        debug("already installed (but didn't we say that already?): $pkg\n");
        next;
      }
    }
    my ($estrem, $esttot) = TeXLive::TLUtils::time_estimate($totalsize,
                              $donesize, $starttime);
    my $kb = int($sizes{$pkg} / 1024) + 1;
    my @addargs = ();
    my $tagstr = "";
    if ($remotetlpdb->is_virtual) {
      if ($packs{$pkg} ne "0") {
        push @addargs, $packs{$pkg};
        $tagstr = " \@" . $packs{$pkg};
      } else {
        my ($maxtag,undef,undef,undef) = $remotetlpdb->virtual_candidate($pkg);
        push @addargs, $maxtag;
        $tagstr = " \@" . $maxtag;
      }
    }
    push @addargs, $lctanvers, $rctanvers;
    if ($::machinereadable) {
      machine_line($pkg, $flag, "-", $revs{$pkg}, $sizes{$pkg}, $estrem, $esttot, @addargs);
    } else {
      info("[$currnr/$totalnr, $estrem/$esttot] ${re}install: $pkg$tagstr [${kb}k]\n");
    }
    if (!$opts{"dry-run"}) {
      $remotetlpdb->install_package($pkg, $localtlpdb,
        ($packs{$pkg} ? $packs{$pkg} : undef) );
      logpackage("${re}install: $pkg$tagstr");
    }
    $donesize += $sizes{$pkg};
    $currnr++;
  }
  print "end-of-updates\n" if $::machinereadable;


  if ($opts{"dry-run"}) {
    # stop here, don't do any postinstall actions
    return($ret | $F_NOPOSTACTION);
  } else {
    # reset option if --with-src argument was given
    $localtlpdb->option("install_srcfiles", $orig_do_src) if $opts{'with-src'};
    $localtlpdb->option("install_docfiles", $orig_do_doc) if $opts{'with-doc'};
    $localtlpdb->save if ($opts{'with-src'} || $opts{'with-doc'});
  }
  return ($ret);
}

sub show_list_of_packages {
  init_local_db();
  # make sure that the @ARGV hash is not changed in case we switch to
  # show mode
  my ($what) = @_;
  $what = "" if !$what;
  my $tlm;
  if ($opts{"only-installed"}) {
    $tlm = $localtlpdb;
  } else {
    init_tlmedia_or_die();
    $tlm = $remotetlpdb;
  }
  my @whattolist;
  if ($what =~ m/^collections/i) {
    @whattolist = $tlm->collections;
  } elsif ($what =~ m/^schemes/i) {
    @whattolist = $tlm->schemes;
  } else {
    if ($tlm->is_virtual) {
      @whattolist = $tlm->list_packages("-all");
    } else {
      @whattolist = $tlm->list_packages;
    }
  }
  foreach (@whattolist) {
    next if ($_ =~ m/^00texlive/);
    if (defined($localtlpdb->get_package($_))) {
      print "i ";
    } else {
      print "  ";
    }
    my $tlp = $tlm->get_package($_);
    if (!$tlp) {
      if ($remotetlpdb->is_virtual) {
        # we might have the case that a package is present in a
        # subsidiary repository, but not pinned, so it will
        # not be found by ->get_package
        # In this case we list all repositories shipping it,
        # but warn that it is not pinned and thus not reachable.
        my @cand = $remotetlpdb->candidates($_);
        if (@cand) {
          my $first = shift @cand;
          if (defined($first)) {
            tlwarn("strange, we have a first candidate but no tlp: $_\n");
            next;
          }
          # already shifted away the first element
          if ($#cand >= 0) {
            print "$_: --- no installable candidate found, \n";
            print "    but present in subsidiary repositories without a pin.\n";
            print "    This package is not reachable without pinning.\n";
            print "    Repositories containing this package:\n";
            for my $a (@cand) {
              my ($t,$r) = split(/\//, $a, 2);
              my $tlp = $remotetlpdb->get_package($_, $t);
              my $foo = $tlp->shortdesc;
              print "      $t: ", defined($foo) ? $foo : "(shortdesc missing)" , "\n";
            }
            next;
          } else {
            tlwarn("strange, package listed but no residual candidates: $_\n");
            next;
          }
        } else {
          tlwarn("strange, package listed but no candidates: $_\n");
          next;
        }
      } else {
        tlwarn("strange, package cannot be found in remote tlpdb: $_\n");
        next;
      }
    }
    my $foo = $tlp->shortdesc;
    print "$_: ", defined($foo) ? $foo : "(shortdesc missing)" , "\n";
  }
  return;
}

#  PINNING
#
# this action manages the pinning file
# of course it can be edited by hand, but we want to make this
# easier for people to use
# tlmgr pinning show
# tlmgr pinning check
# tlmgr pinning add <repo> <pkgglob> [<pkgglob> ...]
# tlmgr pinning remove <repo> <pkgglob> [<pkgglob> ...]
# tlmgr pinning remove <repo> --all
sub action_pinning {
  my $what = shift @ARGV;
  $what || ($what = 'show');
  init_local_db();
  init_tlmedia_or_die();
  if (!$remotetlpdb->is_virtual) {
    tlwarn("$prg: only one repository configured, "
           . "pinning actions not supported.\n");
    return;
  }
  my $pinref = $remotetlpdb->virtual_pindata();
  my $pf = $remotetlpdb->virtual_pinning();

  if ($what =~ m/^show$/i) {
    my @pins = @$pinref;
    if (!@pins) {
      tlwarn("$prg: no pinning data present.\n");
      return 0;
    }
    info("$prg: this pinning data is defined:\n");
    for my $p (@pins) {
      info("  ", $p->{'repo'}, ":", $p->{'glob'}, "\n");
    }
    return 1;

  } elsif ($what =~ m/^check$/i) {
    tlwarn("$prg: not implemented yet, sorry!\n");
    return 0;

  } elsif ($what =~ m/^add$/i) {
    # we need at least two more arguments
    if (@ARGV < 2) {
      tlwarn("$prg: need at least two arguments to pinning add\n");
      return;
    }
    my $repo = shift @ARGV;
    my @new = ();
    my @ov = $pf->value($repo);
    for my $n (@ARGV) {
      if (member($n, @ov)) {
        info("$prg: already pinned to $repo: $n\n");
      } else {
        push (@ov, $n);
        push (@new, $n);
      }
    }
    $pf->value($repo, @ov);
    $remotetlpdb->virtual_update_pins();
    $pf->save;
    info("$prg: new pinning data for $repo: @new\n") if @new;
    return 1;

  } elsif ($what =~ m/^remove$/i) {
    my $repo = shift @ARGV;
    if (!defined($repo)) {
      tlwarn("$prg: missing repository argument to pinning remove\n");
      return 0;
    }
    if ($opts{'all'}) {
      if (@ARGV) {
        tlwarn("$prg: additional argument(s) not allowed with --all: @ARGV\n");
        return 0;
      }
      $pf->delete_key($repo);
      $remotetlpdb->virtual_update_pins();
      $pf->save;
      info("$prg: all pinning data removed for repository $repo\n");
      return 1;
    }
    # complicated case, we want to remove only one setting
    my @ov = $pf->value($repo);
    my @nv;
    for my $pf (@ov) {
      push (@nv, $pf) if (!member($pf, @ARGV));
    }
    if ($#ov == $#nv) {
      info("$prg: no changes in pinning data for $repo\n");
      return 1;
    }
    if (@nv) {
      $pf->value($repo, @nv);
    } else {
      $pf->delete_key($repo);
    }
    $remotetlpdb->virtual_update_pins();
    $pf->save;
    info("$prg: removed pinning data for repository $repo: @ARGV\n");
    return 1;

  } else {
    tlwarn("$prg: unknown argument for pinning action: $what\n");
    return 0;
  }
  # $pin{'repo'} = $repo;
  # $pin{'glob'} = $glob;
  # $pin{'re'} = $re;
  # $pin{'line'} = $line; # for debug/warning purpose
  return 0;
}

#  REPOSITORY
#
# this action manages the list of repositories
# tlmgr repository list               -> lists repositories
# tlmgr repository list path|tag      -> lists content of repo path|tag
# tlmgr repository add path [tag]     -> add repository with optional tag
# tlmgr repository remove [path|tag]  -> removes repository or tag
# tlmgr repository set path[#tag] [path[#tag] ...] -> sets the list
#

sub array_to_repository {
  my %r = @_;
  my @ret;
  my @k = keys %r;
  if ($#k == 0) {
    # only one repo, don't write any tag
    return $r{$k[0]};
  }
  for my $k (keys %r) {
    my $v = $r{$k};
    if ($k ne $v) {
      $v = "$v#$k";
    }
    # encode spaces and % in the path and tags
    $v =~ s/%/%25/g;
    $v =~ s/ /%20/g;
    push @ret, $v;
  }
  return "@ret";
}
sub repository_to_array {
  my $r = shift;
  my %r;
  my @repos = split ' ', $r;
  if ($#repos == 0) {
    # only one repo, this is the main one!
    $r{'main'} = $repos[0];
    return %r;
  }
  for my $rr (@repos) {
    my $tag;
    my $url;
    # decode spaces and % in reverse order
    $rr =~ s/%20/ /g;
    $rr =~ s/%25/%/g;
    $tag = $url = $rr;
    if ($rr =~ m/^([^#]+)#(.*)$/) {
      $tag = $2;
      $url = $1;
    }
    $r{$tag} = $url;
  }
  return %r;
}
sub merge_sub_packages {
  my %pkgs;
  for my $p (@_) {
    if ($p =~ m/^(.*)\.([^.]*)$/) {
      my $n = $1;
      my $a = $2;
      if ($p eq "texlive.infra") {
        push @{$pkgs{$p}}, "all";
      } else {
        push @{$pkgs{$n}}, $a;
      }
    } else {
      push @{$pkgs{$p}}, "all";
    }
  }
  return %pkgs;
}
sub action_repository {
  init_local_db();
  my $what = shift @ARGV;
  $what = "list" if !defined($what);
  my %repos = repository_to_array($localtlpdb->option("location"));
  if ($what =~ m/^list$/i) {
    if (@ARGV) {
      # list what is in a repository
      for my $repo (@ARGV) {
        my $loc = $repo;
        if (defined($repos{$repo})) {
          $loc = $repos{$repo};
        }
        my ($tlpdb, $errormsg) = setup_one_remotetlpdb($loc);
        if (!defined($tlpdb)) {
          tlwarn("cannot get TLPDB from location $loc\n\n");
        } else {
          print "Packages at $loc:\n";
          my %pkgs = merge_sub_packages($tlpdb->list_packages);
          for my $p (sort keys %pkgs) {
            next if ($p =~ m/00texlive/);
            print "  $p";
            if (!$opts{'with-platforms'}) {
              print "\n";
            } else {
              my @a = @{$pkgs{$p}};
              if ($#a == 0) {
                if ($a[0] eq "all") {
                  # no further information necessary
                  print "\n";
                } else {
                  print ".$a[0]\n";
                }
              } else {
                print " (@{$pkgs{$p}})\n";
              }
            }
          }
        }
      }
    } else {
      print "List of repositories (with tags if set):\n";
      for my $k (keys %repos) {
        my $v = $repos{$k};
        print "\t$v";
        if ($k ne $v) {
          print " ($k)";
        }
        print "\n";
      }
    }
    return ($F_OK);
  }
  if ($what eq "add") {
    my $p = shift @ARGV;
    if (!defined($p)) {
      tlwarn("$prg: no repository given (to add)\n");
      return ($F_ERROR);
    }
    # check if it is either url or absolute path
    if (($p !~ m!^(http|ftp)://!i) && 
        !File::Spec->file_name_is_absolute($p)) {
      tlwarn("$prg: neither http/ftp URL nor absolute path, no action: $p\n");
      return ($F_ERROR);
    }
    my $t = shift @ARGV;
    $t = $p if (!defined($t));
    if (defined($repos{$t})) {
      tlwarn("$prg: repository or its tag already defined, no action: $p\n");
      return ($F_ERROR);
    }
    # TODO more checks needed?
    # if there was till now only *one* repository and that without
    # a tag, we give that one the "main" tag which is necessary
    # for proper operation!
    my @tags = keys %repos;
    if ($#tags == 0) {
      # we have only one repository, check if it has the main tag
      my $maintag = $tags[0];
      if ($maintag ne 'main') {
        $repos{'main'} = $repos{$maintag};
        delete $repos{$maintag};
      }
    }
    $repos{$t} = $p;
    $localtlpdb->option("location", array_to_repository(%repos));
    $localtlpdb->save;
    if ($t eq $p) {
      print "$prg: added repository: $p\n";
    } else {
      print "$prg: added repository with tag $t: $p\n";
    }
    return ($F_OK);
  }
  if ($what eq "remove") {
    my $p = shift @ARGV;
    if (!defined($p)) {
      tlwarn("$prg: no repository given (to remove)\n");
      return ($F_ERROR);
    }
    my $found = 0;
    for my $k (keys %repos) {
      if ($k eq $p || $repos{$k} eq $p) {
        $found = 1;
        delete $repos{$k};
      }
    }
    if (!$found) {
      tlwarn("$prg: repository not defined, cannot remove: $p\n");
      return ($F_ERROR);
    } else {
      $localtlpdb->option("location", array_to_repository(%repos));
      $localtlpdb->save;
      print "$prg: removed repository: $p\n";
      return ($F_OK);
    }
    # no reached
    return ($F_OK);
  }
  if ($what eq "set") {
    # TODO TODO
    # we have to make sure that there is ONE main repository!!!
    %repos = repository_to_array("@ARGV");
    $localtlpdb->option("location", array_to_repository(%repos));
    $localtlpdb->save;
    return ($F_OK);
  }
  # we are still here, unknown command to repository
  tlwarn("$prg: unknown subaction for tlmgr repository: $what\n");
  return ($F_ERROR);
}

sub action_candidates {
  my $what = shift @ARGV;
  if (!defined($what)) {
    tlwarn("$prg: candidates needs a package name as argument\n");
    return ($F_ERROR);
  }
  init_local_db();
  init_tlmedia_or_die();
  my @cand = $remotetlpdb->candidates($what);
  if (@cand) {
    my $first = shift @cand;
    if (defined($first)) {
      my ($t,$r) = split(/\//, $first, 2);
      print "Install candidate for $what from $t ($r)\n";
    } else {
      print "No install candidate for $what found.\n";
    }
    # already shifted away the first element
    if ($#cand >= 0) {
      print "Other repositories providing this package:\n";
      for my $a (@cand) {
        my ($t,$r) = split(/\//, $a, 2);
        print "$t ($r)\n";
      }
    }
  } else {
    print "Package $what not found.\n";
    return ($F_WARNING);
  }
  return ($F_OK);;
}

#  OPTION
#
sub action_option {
  my $what = shift @ARGV;
  $what = "show" unless defined($what);
  init_local_db();
  my $ret = $F_OK;
  if ($what =~ m/^show$/i) {
    for my $o (keys %{$localtlpdb->options}) {
      # ignore some things which are w32 specific
      next if ($o eq "desktop_integration" && !win32());
      next if ($o eq "file_assocs" && !win32());
      next if ($o eq "w32_multi_user" && !win32());
      if (win32()) {
        next if ($o =~ m/^sys_/);
      }
      if (defined $TLPDBOptions{$o}) {
        if ($::machinereadable) {
          print "$TLPDBOptions{$o}->[2]\t", $localtlpdb->option($o), "\n";
        } else {
          info("$TLPDBOptions{$o}->[3] ($TLPDBOptions{$o}->[2]): " .
                $localtlpdb->option($o) . "\n");
        }
      } else {
        tlwarn ("$prg: option $o not supported\n");
        $ret |= $F_WARNING;
      }
    }
  } elsif ($what =~ m/^showall$/i) {
    my %loc = %{$localtlpdb->options};
    for my $o (sort keys %TLPDBOptions) {
      if ($::machinereadable) {
        print "$TLPDBOptions{$o}->[2]\t",
          (defined($loc{$o}) ? $loc{$o} : "(not set)"), "\n";
      } else {
        info("$TLPDBOptions{$o}->[3] ($TLPDBOptions{$o}->[2]): " .
             (defined($loc{$o}) ? $loc{$o} : "(not set)") . "\n");
      }
    }
  } else {
    if ($what eq "location" || $what eq "repo") {
      # silently rewrite location|repo -> repository
      $what = "repository";
    }
    my $found = 0;
    for my $opt (keys %TLPDBOptions) {
      if ($what eq $TLPDBOptions{$opt}->[2]) {
        $found = 1;
        # the option argument matches the name
        my $val = shift @ARGV;
        if (defined($val)) {
          return ($F_ERROR) if !check_on_writable();
          # set new value
          # here we have to care for some special cases
          if ($what eq $TLPDBOptions{"location"}->[2]) {
            # support "ctan" on the cmd line
            if ($val =~ m/^ctan$/i) {
              $val = "$TeXLive::TLConfig::TeXLiveURL";
            }
            info("$prg: setting default package repository to $val\n");
            $localtlpdb->option($opt, $val);
          } elsif ($what eq $TLPDBOptions{"backupdir"}->[2]) {
            info("$prg: setting option $what to $val.\n");
            if (! -d $val) {
              info("$prg: the directory $val does not exists, it has to be created\n");
              info("$prg: before backups can be done automatically.\n");
            }
            $localtlpdb->option($opt, $val);
          } elsif ($what eq $TLPDBOptions{"w32_multi_user"}->[2]) {
            # when running w32 do not allow that a non-admin users sets
            # this from false to true
            my $do_it = 0;
            if (win32()) {
              if (admin()) {
                $do_it = 1;
              } else {
                if ($val) {
                  # non admin and tries to set to true, warn
                  tlwarn("$prg: non-admin user cannot set $TLPDBOptions{'w32_multi_user'}->[2] option to true\n");
                } else {
                  $do_it = 1;
                }
              }
            } else {
              $do_it = 1;
            }
            if ($do_it) {
              if ($val) {
                info("$prg: setting option $what to 1.\n");
                $localtlpdb->option($opt, 1);
              } else {
                info("$prg: setting option $what to 0.\n");
                $localtlpdb->option($opt, 0);
              }
            }
          } else {
            # default case, switch for different types
            if ($TLPDBOptions{$opt}->[0] eq "b") {
              if ($val) {
                info("$prg: setting option $what to 1.\n");
                $localtlpdb->option($opt, 1);
              } else {
                info("$prg: setting option $what to 0.\n");
                $localtlpdb->option($opt, 0);
              }
            } elsif ($TLPDBOptions{$opt}->[0] eq "p") {
              info("$prg: setting option $what to $val.\n");
              $localtlpdb->option($opt, $val);
            } elsif ($TLPDBOptions{$opt}->[0] eq "u") {
              info("$prg: setting option $what to $val.\n");
              $localtlpdb->option($opt, $val);
            } elsif ($TLPDBOptions{$opt}->[0] =~ m/^n(:((-)?\d+)?..((-)?\d+)?)?$/) {
              my $isgood = 1;
              my $n = int($val);
              my $low;
              my $up;
              if (defined($1)) {
                # range given
                if (defined($2)) {
                  # lower border
                  if ($2 > $n) {
                    tlwarn("value $n for $what out of range ($TLPDBOptions{$opt}->[0])\n");
                    $isgood = 0;
                  }
                }
                if (defined($4)) {
                  # upper border
                  if ($4 < $n) {
                    tlwarn("value $n for $what out of range ($TLPDBOptions{$opt}->[0])\n");
                    $isgood = 0;
                  }
                }
              }
              if ($isgood) {
                info("$prg: setting option $what to $n.\n");
                $localtlpdb->option($opt, $n);
              }
            } else {
              tlwarn ("Unknown type of option $opt: $TLPDBOptions{$opt}->[0]\n");
              return ($F_ERROR);
            }
          }
          $localtlpdb->save;
          # now also save the TLPOBJ of 00texlive.installation
          my $tlpo = $localtlpdb->get_package("00texlive.installation");
          if ($tlpo) {
            if (open(TOFD, ">$::maintree/tlpkg/tlpobj/00texlive.installation.tlpobj")) {
              $tlpo->writeout(\*TOFD);
              close(TOFD);
            } else {
              tlwarn("Cannot save 00texlive.installation to $::maintree/tlpkg/tlpobj/00texlive.installation.tlpobj\n");
              $ret |= $F_WARNING;
            }
          }
        } else {
          # show current value
          if ($::machinereadable) {
            print "$TLPDBOptions{$opt}->[2]\t", $localtlpdb->option($opt), "\n";
          } else {
            info ("$TLPDBOptions{$opt}->[3] ($TLPDBOptions{$opt}->[2]): " .
                  $localtlpdb->option($opt) . "\n");
          }
        }
        last;
      }
    }
    if (!$found) {
      tlwarn("$prg: option $what not supported!\n");
      return ($F_ERROR);
    }
  }
  return ($ret);
}


#  ARCH
#
sub action_platform {
  my $ret = $F_OK;
  my @extra_w32_packs = qw/tlperl.win32 tlgs.win32 tlpsv.win32
                           collection-wintools
                           dviout.win32 wintools.win32/;
  if ($^O=~/^MSWin(32|64)$/i) {
    warn("action `platform' not supported on Windows\n");
    return ($F_WARNING);
  }
  if ($opts{"usermode"}) {
    tlwarn("action `platform' not supported in usermode\n");
    return ($F_ERROR);
  }
  my $what = shift @ARGV;
  init_local_db(1);
  info("$prg platform: dry run, no changes will be made\n") if $opts{"dry-run"};
  $what || ($what = "list");
  if ($what =~ m/^list$/i) {
    # list the available platforms
    # initialize the TLPDB from $location
    init_tlmedia_or_die();
    my @already_installed_arch = $localtlpdb->available_architectures;
    print "Available platforms:\n";
    foreach my $a ($remotetlpdb->available_architectures) {
      if (member($a,@already_installed_arch)) {
        print "(i) $a\n";
      } else {
        print "    $a\n";
      }
    }
    print "Already installed platforms are marked with (i)\n";
    print "You can add new platforms with: tlmgr platform add ARCH1 ARCH2...\n";
    return ($F_OK | $F_NOPOSTACTION);
  } elsif ($what =~ m/^add$/i) {
    return ($F_ERROR) if !check_on_writable();
    init_tlmedia_or_die();
    my @already_installed_arch = $localtlpdb->available_architectures;
    my @available_arch = $remotetlpdb->available_architectures;
    my @todoarchs;
    foreach my $a (@ARGV) {
      if (TeXLive::TLUtils::member($a, @already_installed_arch)) {
        info("Platform $a is already installed\n");
        next;
      }
      if (!TeXLive::TLUtils::member($a, @available_arch)) {
        info("Platform $a not available, use 'tlmgr platform list'!\n");
        next;
      }
      push @todoarchs, $a;
    }
    foreach my $pkg ($localtlpdb->list_packages) {
      next if ($pkg =~ m/^00texlive/);
      my $tlp = $localtlpdb->get_package($pkg);
      foreach my $dep ($tlp->depends) {
        if ($dep =~ m/^(.*)\.ARCH$/) {
          # we have to install something
          foreach my $a (@todoarchs) {
            if ($remotetlpdb->get_package("$pkg.$a")) {
              info("install: $pkg.$a\n");
              if (!$opts{'dry-run'}) {
                if (! $remotetlpdb->install_package("$pkg.$a", $localtlpdb)) {
                  $ret |= $F_ERROR;
                }
              }
            } else {
              tlwarn("action platform add, cannot find package $pkg.$a\n");
              $ret |= $F_WARNING;
            }
          }
        }
      }
    }
    if (TeXLive::TLUtils::member('win32', @todoarchs)) {
      # install the necessary w32 stuff
      for my $p (@extra_w32_packs) {
        info("install: $p\n");
        if (!$opts{'dry-run'}) {
          if (! $remotetlpdb->install_package($p, $localtlpdb)) {
            $ret |= $F_ERROR;
          }
        }
      }
    }
    # update the option("available_architectures") list of installed archs
    if (!$opts{"dry-run"}) {
      my @larchs = $localtlpdb->setting("available_architectures");
      push @larchs, @todoarchs;
      $localtlpdb->setting("available_architectures",@larchs);
      $localtlpdb->save;
    }
  } elsif ($what =~ m/^remove$/i) {
    return ($F_ERROR) if !check_on_writable();
    my @already_installed_arch = $localtlpdb->available_architectures;
    my @todoarchs;
    my $currentarch = $localtlpdb->platform();
    foreach my $a (@ARGV) {
      if (!TeXLive::TLUtils::member($a, @already_installed_arch)) {
        tlwarn("Platform $a not installed, use 'tlmgr platform list'!\n");
        $ret |= $F_WARNING;
        next;
      }
      if ($currentarch eq $a) {
        info("You are running on platform $a, you cannot remove that one!\n");
        $ret |= $F_WARNING;
        next;
      }
      push @todoarchs, $a;
    }
    foreach my $pkg ($localtlpdb->list_packages) {
      next if ($pkg =~ m/^00texlive/);
      my $tlp = $localtlpdb->get_package($pkg);
      if (!$tlp) {
        # that is a package foobar.$a that has already been remove but
        # is still in the list above, so ignore that
        next;
      }
      foreach my $dep ($tlp->depends) {
        if ($dep =~ m/^(.*)\.ARCH$/) {
          # we have to install something
          foreach my $a (@todoarchs) {
            if ($localtlpdb->get_package("$pkg.$a")) {
              info("remove: $pkg.$a\n");
              # assume that this works out
              $localtlpdb->remove_package("$pkg.$a") if (!$opts{"dry-run"});
            }
          }
        }
      }
    }
    if (TeXLive::TLUtils::member('win32', @todoarchs)) {
      for my $p (@extra_w32_packs) {
        info("remove: $p\n");
        $localtlpdb->remove_package($p) if (!$opts{"dry-run"});
      }
    }
    if (!$opts{"dry-run"}) {
      # try to remove bin/$a dirs
      for my $a (@todoarchs) {
        if (!rmdir("$Master/bin/$a")) {
          tlwarn("binary directory $Master/bin/$a not empty after removal of $a.\n");
          $ret |= $F_WARNING;
        }
      }
      # update the option("available_architectures") list of installed archs
      my @larchs = $localtlpdb->setting("available_architectures");
      my @newarchs;
      for my $a (@larchs) {
        push @newarchs, $a if !member($a, @todoarchs);
      }
      $localtlpdb->setting("available_architectures",@newarchs);
      $localtlpdb->save;
    }
  } elsif ($what =~ m/^set$/i) {
    return if !check_on_writable();
    my $arg = shift @ARGV;
    die "Missing argument to platform set" unless defined($arg);
    my @already_installed_arch = $localtlpdb->available_architectures;
    if ($arg =~ m/^auto$/i) {
      info("Setting platform detection to auto mode.\n");
      $localtlpdb->setting('-clear', 'platform');
      $localtlpdb->save;
    } else {
      if (!TeXLive::TLUtils::member($arg, @already_installed_arch)) {
        tlwarn("cannot set platform to a not installed one.\n");
        return ($F_ERROR);
      }
      $localtlpdb->setting('platform', $arg);
      $localtlpdb->save;
    }
  } else {
    tlwarn("Unknown option for platform: $what\n");
    $ret |= $F_ERROR;
  }
  return ($ret);
}


#  GENERATE
#
sub action_generate {
  if ($opts{"usermode"}) {
    tlwarn("action `generate' not supported in usermode!\n");
    return $F_ERROR;
  }
  my $what = shift @ARGV;
  init_local_db();

  # we create fmtutil.cnf, language.dat, language.def in TEXMFSYSVAR and
  # updmap.cfg in TEXMFDIST. The reason is that we are now using an
  # implementation of updmap that supports multiple updmap files.
  # Local adaptions should not be made there, but only in TEXMFLOCAL
  # or TEXMF(SYS)CONFIG updmap.cfg
  #
  chomp (my $TEXMFSYSVAR = `kpsewhich -var-value=TEXMFSYSVAR`);
  chomp (my $TEXMFSYSCONFIG = `kpsewhich -var-value=TEXMFSYSCONFIG`);
  chomp (my $TEXMFLOCAL = `kpsewhich -var-value=TEXMFLOCAL`);
  chomp (my $TEXMFDIST = `kpsewhich -var-value=TEXMFDIST`);

  # we do generate all config files, treat $opts{"dest"} as pattern
  # and make it append the respective extensions
  my $append_extension = (($opts{"dest"} && ($what eq "language")) ? 1 : 0);

  if ($what =~ m/^language(\.dat|\.def|\.dat\.lua)?$/i) {
    #
    # if --rebuild-sys is given *and* --dest we warn that this might not
    # work if the destination is not the default one
    if ($opts{"rebuild-sys"} && $opts{"dest"}) {
      tlwarn("tlmgr generate $what: warning: both --rebuild-sys and --dest\n",
             "given; the call to fmtutil-sys can fail if the given\n",
             "destination is different from the default.\n");
    }
    #
    # we have to set TEXMFVAR, TEXMFCONFIG in the environment so that
    # searching for language.(dat/def) does search in the right place
    if ($what =~ m/^language(\.dat\.lua)?$/i) {
      my $dest = $opts{"dest"} ||
        "$TEXMFSYSVAR/tex/generic/config/language.dat.lua";
      $dest .= ".dat.lua" if $append_extension;
      my $localcfg = $opts{"localcfg"} ||
        "$TEXMFLOCAL/tex/generic/config/language-local.dat.lua";
      debug("$prg: writing language.dat.lua data to $dest\n");
      TeXLive::TLUtils::create_language_lua($localtlpdb, $dest, $localcfg);
      if ($opts{"rebuild-sys"}) {
        do_cmd_and_check
                     ("fmtutil-sys $common_fmtutil_args --byhyphen \"$dest\"");
      } else {
        info("To make the newly-generated language.dat.lua take effect,"
             . " run fmtutil-sys --byhyphen $dest.\n"); 
      }
    }
    if ($what =~ m/^language(\.dat)?$/i) {
      my $dest = $opts{"dest"} ||
        "$TEXMFSYSVAR/tex/generic/config/language.dat";
      $dest .= ".dat" if $append_extension;
      my $localcfg = $opts{"localcfg"} ||
        "$TEXMFLOCAL/tex/generic/config/language-local.dat";
      debug ("$prg: writing language.dat data to $dest\n");
      TeXLive::TLUtils::create_language_dat($localtlpdb, $dest, $localcfg);
      if ($opts{"rebuild-sys"}) {
        do_cmd_and_check
                     ("fmtutil-sys $common_fmtutil_args --byhyphen \"$dest\"");
      } else {
        info("To make the newly-generated language.dat take effect,"
             . " run fmtutil-sys --byhyphen $dest.\n"); 
      }
    }
    if ($what =~ m/^language(\.def)?$/i) {
      my $dest = $opts{"dest"} ||
        "$TEXMFSYSVAR/tex/generic/config/language.def";
      $dest .= ".def" if $append_extension;
      my $localcfg = $opts{"localcfg"} ||
        "$TEXMFLOCAL/tex/generic/config/language-local.def";
      debug("$prg: writing language.def data to $dest\n");
      TeXLive::TLUtils::create_language_def($localtlpdb, $dest, $localcfg);
      if ($opts{"rebuild-sys"}) {
        do_cmd_and_check
                     ("fmtutil-sys $common_fmtutil_args --byhyphen \"$dest\"");
      } else {
        info("To make the newly-generated language.def take effect,"
             . " run fmtutil-sys --byhyphen $dest.\n");
      }
    }

  } elsif ($what =~ m/^fmtutil$/i) {
    tlwarn("$prg: generate fmtutil is no longer needed or supported.\n");
    tlwarn("$prg: Please read the documentation of the `fmtutil' program.\n");
    tlwarn("$prg: Goodbye.\n");
    return $F_ERROR;

  } elsif ($what =~ m/^_fmtutil$/i) {
    my $dest = $opts{"dest"} || "$TEXMFDIST/web2c/fmtutil.cnf";
    debug("$prg: writing new fmtutil.cnf to $dest\n");
    TeXLive::TLUtils::create_fmtutil($localtlpdb, $dest);

    if ($opts{"rebuild-sys"}) {
      do_cmd_and_check("fmtutil-sys $common_fmtutil_args --all");
    } else {
      info("To make the newly-generated fmtutil.cnf take effect,"
           . " run fmtutil-sys --all.\n"); 
    }

  } elsif ($what =~ m/^updmap$/i) {
    tlwarn("$prg: generate updmap is no longer needed or supported.\n");
    tlwarn("$prg: Please read the documentation of the `updmap' program.\n");
    tlwarn("$prg: Goodbye.\n");
    return $F_ERROR;

  } elsif ($what =~ m/^_updmap$/i) {
    my $dest = $opts{"dest"} || "$TEXMFDIST/web2c/updmap.cfg";
    debug("$prg: writing new updmap.cfg to $dest\n");
    TeXLive::TLUtils::create_updmap($localtlpdb, $dest);

    if ($opts{"rebuild-sys"}) {
      do_cmd_and_check("updmap-sys");
    } else {
      info("To make the newly-generated updmap.cfg take effect,"
           . " run updmap-sys.\n");
    }

  } else {
    tlwarn("$prg: Unknown option for generate: $what; try --help if you need it.\n");
    return $F_ERROR;
  }

  return $F_OK;
}


#  GUI
#
sub action_gui {
  eval { require Tk; };
  if ($@) {
    # that didn't work out, give some usefull error message and stop
    my $tkmissing = 0;
    if ($@ =~ /^Can\'t locate Tk\.pm/) {
      $tkmissing = 1;
    }
    if ($tkmissing) {
      if ($^O=~/^MSWin(32|64)$/i) {
        # that should not happen, we are shipping Tk!!
        require Win32;
        my $msg = "Cannot load Tk, that should not happen as we ship it!\nHow did you start tlmgrgui??\n(Error message: $@)\n";
        Win32::MsgBox($msg, 1|Win32::MB_ICONSTOP(), "Warning");
      } else {
        printf STDERR "
$prg: Cannot load Tk, thus the GUI cannot be started!
The Perl/Tk module is not shipped with the TeX Live installation.
You have to install it to get the tlmgr GUI working.
(INC = @INC)

See http://tug.org/texlive/distro.html#perltk for more details.
Goodbye.
";
      }
    } else {
      printf STDERR "$prg: unexpected problem loading Tk: $@\n";
    }
    exit 1;
  }

  # now check that we can actually create a top level window,
  # on darwin the X server might not be started, or on unix we are working
  # on a console, or whatever.
  eval { my $foo = Tk::MainWindow->new; $foo->destroy; };
  if ($@) {
    printf STDERR "perl/Tk unusable, cannot create main windows.
That could be a consequence of not having X Windows installed or started!
Error message from creating MainWindow:
  $@
";
    exit 1;
  }

  # be sure that sub actions do *not* finish
  $::gui_mode = 1;
  # also unset the $opts{"gui"} to make recursive calls to action_* not starting
  # another GUI instance (or better trying to ...)
  $opts{"gui"} = 0;

  require("tlmgrgui.pl");
  # should not be reached
  exit(1);
}


#  UNINSTALL
#
sub action_uninstall {
  if (win32()) {
    printf STDERR "Please use \"Add/Remove Programs\" from the Control Panel to removing TeX Live!\n";
    return ($F_ERROR);
  }
  return if !check_on_writable();
  my $force = defined($opts{"force"}) ? $opts{"force"} : 0;
  if (!$force) {
    print("If you answer yes here the whole TeX Live installation will be removed!\n");
    print "Remove TeX Live (y/N): ";
    my $yesno = <STDIN>;
    if ($yesno !~ m/^y(es)?$/i) {
      print "Ok, cancelling the removal!\n";
      return ($F_OK | $F_NOPOSTACTION);
    }
  }
  print ("Ok, removing the whole installation:\n");
  init_local_db();
  TeXLive::TLUtils::remove_symlinks($localtlpdb->root,
    $localtlpdb->platform(),
    $localtlpdb->option("sys_bin"),
    $localtlpdb->option("sys_man"),
    $localtlpdb->option("sys_info"));
  # now do remove the rest
  system("rm", "-rf", "$Master/texmf-dist");
  system("rm", "-rf", "$Master/texmf-doc");
  system("rm", "-rf", "$Master/texmf-var");
  system("rm", "-rf", "$Master/tlpkg");
  system("rm", "-rf", "$Master/bin");
  system("rm", "-rf", "$Master/readme-html.dir");
  system("rm", "-rf", "$Master/readme-txt.dir");
  for my $f (qw/doc.html index.html LICENSE.CTAN LICENSE.TL README
                README.usergroups release-texlive.txt texmf.cnf/) {
    system("rm", "-f", "$Master/$f");
  }
  if (-d "$Master/temp") {
    system("rmdir", "--ignore-fail-on-non-empty", "$Master/temp");
  }
  unlink("$Master/install-tl.log");
  # should we do that????
  system("rm", "-rf", "$Master/texmf-config");
  system("rmdir", "--ignore-fail-on-non-empty", "$Master");
}


#  RECREATE-TLPDB
#
sub action_recreate_tlpdb {
  return if !check_on_writable();
  my $tlpdb = TeXLive::TLPDB->new;
  $tlpdb->root($Master);
  my $inst = TeXLive::TLPOBJ->new;
  $inst->name("00texlive.installation");
  $inst->category("TLCore");
  my @deps;
  # options are done further down with $tlpdb->reset_options()
  #for my $k (keys %TeXLive::TLConfig::TLPDBOptions) {
  # push @deps, "opt_$k:" . $TeXLive::TLConfig::TLPDBOptions{k}->[1];
  #}
  # find list of available archs
  my @archs;
  opendir (DIR, "$Master/bin") || die "opendir($Master/bin) failed: $!";
  my @dirents = readdir (DIR);
  closedir (DIR) || warn "closedir($Master/bin) failed: $!";
  for my $dirent (@dirents) {
    next if $dirent eq ".";
    next if $dirent eq "..";
    next unless -d "$Master/bin/$dirent";
    if (-r "$Master/bin/$dirent/kpsewhich" || -r "$Master/bin/$dirent/kpsewhich.exe") {
      push @archs, $dirent;
      debug("Skipping directory $Master/bin/$dirent, no kpsewhich there\n");
    }
  }
  push @deps, "setting_available_architectures:" . join(" ",@archs);
  # we have to find out the default arch
  # if there is only one dir in $Master/bin then we are settled,
  # otherwise we expect the user to pass a correct arch string
  if (!TeXLive::TLUtils::member(TeXLive::TLUtils::platform(), @archs)) {
    # hmm that is bad, the platform as detected is not in the list
    # of installed platforms, so the option --arch has to be given
    # if only one is installed use that one
    if ($#archs == 0) {
      # only one arch available, fine, use it as default
      push @deps, "setting_platform:$archs[0]";
    } else {
      if (defined($opts{"platform"})) {
        if (member($opts{"platform"}, @archs)) {
          push @deps, "setting_platform:" . $opts{"platform"};
        } else {
          tlwarn("The platform you passed in with --platform is not present in $Master/bin\n");
          tlwarn("Please specify one of the available ones: @archs\n");
          exit(1);
        }
      } else {
        tlwarn("More than one platform available: @archs\n");
        tlwarn("Please pass one as the default you are running on with --platform=...\n");
        exit(1);
      }
    }
  }
  $inst->depends(@deps);
  # now we have all the stuff for 00texlive.installation done
  $tlpdb->add_tlpobj($inst);
  # reset the options to default values
  $tlpdb->add_default_options();
  # check for location == _MASTER_
  if ($tlpdb->option("location") eq "__MASTER__") {
    $tlpdb->option("location", $TeXLive::TLConfig::TeXLiveURL);
  }
  # add the other stuff in $Master/tlpkg/tlpobj/*.tlpobj
  # we can ignore *.{source,doc}.tlpobj because they are already
  # included in the *.tlpobj parent one at install time
  # (TODO: we should actually REMOVE the *.{source,doc}.tlpobj files
  #        at package install time)
  opendir (DIR, "$Master/tlpkg/tlpobj") or die "opendir($Master/tlpkg/tlpobj) failed: $!";
  my @tlps = readdir(DIR);
  closedir (DIR) || warn "closedir($Master/tlpkg/tlpobj) failed: $!";
  for my $t (@tlps) {
    next if -d $t; # also does . and ..
    next if ($t !~ m/\.tlpobj$/i);
    # ignore .source and .doc tlpobjs
    next if ($t =~ m/\.(source|doc)\.tlpobj$/i);
    my $tlp = TeXLive::TLPOBJ->new;
    $tlp->from_file("$Master/tlpkg/tlpobj/$t");
    $tlpdb->add_tlpobj($tlp);
  }
  # writeout the re-created tlpdb to stdout
  $tlpdb->writeout;
  return;
}

#  CHECK
#
sub init_tltree {
  my ($svn) = @_;

  # if we are on W32, die (no find).  
  my $arch = $localtlpdb->platform();
  if ($arch eq "win32") {
    tldie("$prg: sorry, cannot check this on Windows.\n");
  }

  my $Master = $localtlpdb->root;
  my $tltree = TeXLive::TLTREE->new ("svnroot" => $Master);
  if ($svn) {
    debug("Initializine TLTREE from svn\n");
    $tltree->init_from_svn;
  } else {
    debug("Initializine TLTREE from find\n");
    $tltree->init_from_files;
  }
  return($tltree);
}

sub action_check {
  my $svn = defined($opts{"use-svn"}) ? $opts{"use-svn"} : 0;
  my $what = shift @ARGV;
  $what || ($what = "all");
  init_local_db();
  my $ret = 0;
  if ($what =~ m/^all/i) {
    my $tltree = init_tltree($svn);
    print "Running check files:\n";
    $ret |= check_files($tltree);
    print "Running check depends:\n";
    $ret |= check_depends();
    print "Running check executes:\n";
    $ret |= check_executes();
    print "Running check runfiles:\n";
    $ret |= check_runfiles();
  } elsif ($what =~ m/^files/i) {
    my $tltree = init_tltree($svn);
    $ret |= check_files($tltree);
  } elsif ($what =~ m/^collections/i) {
    tlwarn("the \"collections\" check is replaced by the \"depends\" check.\n");
    $ret |= check_depends();
  } elsif ($what =~ m/^depends/i) {
    $ret |= check_depends();
  } elsif ($what =~ m/^runfiles/i) {
    $ret |= check_runfiles();
  } elsif ($what =~ m/^executes/i) {
    $ret |= check_executes();
  } else {
    print "No idea how to check that: $what\n";
  }
  if ($ret) {
    return ($F_ERROR);
  } else {
    return ($F_OK);
  }
}

# check file coverage in both direction.
#
sub check_files {
  my $tltree = shift;
  my $ret = 0;
  my %filetopacks;
  my $Master = $localtlpdb->root;
  debug("Collecting all files of all packages\n");
  for my $p ($localtlpdb->list_packages()) {
    # ignore files in the installer
    next if ($p eq "00texlive.installer");
    my $tlp = $localtlpdb->get_package($p);
    my @files = $tlp->all_files;
    if ($tlp->relocated) {
      for (@files) { s:^$RelocPrefix/:$RelocTree/:; }
    }
    for my $f (@files) {
      push @{$filetopacks{$f}}, $p;
    }
  }
  my @multiple = ();
  my @missing = ();
  debug("Checking for occurrences and existence of all files\n");
  for (keys %filetopacks) {
    push @missing, $_ if (! -r "$Master/$_");
    my @foo = @{$filetopacks{$_}};
    if ($#foo < 0) {
      warn "that shouldn't happen: $_\n";
    } elsif ($#foo > 0) {
      push @multiple, $_;
    }
  }
  if ($#multiple >= 0) {
    $ret = 1;
    print "\f Multiple included files (relative to $Master):\n";
    for (sort @multiple) {
      my @foo = @{$filetopacks{$_}};
      print "  $_ (@foo)\n";
    }
    print "\n";
  }
  if ($#missing >= 0) {
    $ret = 1;
    print "\f Files mentioned in tlpdb but missing (relative to $Master):\n";
    for my $m (@missing) {
      print "\t$m\n";
    }
    print "\n";
  }

  # check that all files in the trees are covered, along with
  # 00texlive.image, q.v.  The ones here are not included in the
  # archival source/ tarball;
  my @IgnorePatterns = qw!
    release-texlive.txt source/
    texmf-dist/ls-R$ texmf-doc/ls-R$
    tlpkg/archive tlpkg/backups tlpkg/installer
    tlpkg/texlive.tlpdb tlpkg/tlpobj tlpkg/texlive.profile
    texmf-config/ texmf-var/
    texmf.cnf texmfcnf.lua install-tl.log
  !;
  my %tltreefiles = %{$tltree->{'_allfiles'}};
  my @tlpdbfiles = keys %filetopacks;
  my @nohit;
  for my $f (keys %tltreefiles) {
    # if it is mentioned in the tlpdb or is ignored it is considered
    # as covered, thus, otherwise we push it onto the nothit list
    if (!defined($filetopacks{$f})) {
      my $ignored = 0;
      for my $p (@IgnorePatterns) {
        if ($f =~ m/^$p/) {
          $ignored = 1;
          last;
        }
      }
      if (!$ignored) {
        push @nohit, $f;
      }
    }
  }
  if (@nohit) {
    $ret = 1;
    print "\f Files present but not covered (relative to $Master):\n";
    for my $f (sort @nohit) {
      print "  $f\n";
    }
    print "\n";
  }
  return($ret);
}

# Check for runtime files with the same name but different contents.
# 
sub check_runfiles {
  my $Master = $localtlpdb->root;

  # build a list of all runtime files associated to 'normal' packages
  (my $non_normal = `ls "$Master/bin"`) =~ s/\n/\$|/g; # binaries
  $non_normal .= '^0+texlive|^bin-|^collection-|^scheme-|^texlive-|^texworks';
  $non_normal .= '|^pgf$';  # has lots of intentionally duplicated .lua
  my @runtime_files = ();
  #
  foreach my $tlpn ($localtlpdb->list_packages) {
    next if ($tlpn =~ /$non_normal/);
    #
    my $tlp = $localtlpdb->get_package($tlpn);
    my @files = $tlp->runfiles;
    if ($tlp->relocated) {
      for (@files) { 
        s!^$TeXLive::TLConfig::RelocPrefix/!$TeXLive::TLConfig::RelocTree/!;
      }
    }
    # special case for koma-script where doc/src files are in runfiles section
    if ($tlpn eq "koma-script") {
      @files = grep {!m;^texmf-dist/source/latex/koma-script/;} @files;
      @files = grep {!m;^texmf-dist/doc/latex/koma-script/;} @files;
    }
    push @runtime_files, @files;
  }

  # build the duplicates list.
  my @duplicates = (""); # just to use $duplicates[-1] freely
  my $prev = "";
  foreach my $f (sort map { TeXLive::TLUtils::basename($_) } @runtime_files) {
    push (@duplicates, $f) if (($f eq $prev) and not ($f eq $duplicates[-1]));
    $prev = $f;
  }
  shift @duplicates; # get rid of the fake 1st value

  # check if duplicates are different files.
  foreach my $f (@duplicates) {
    # assume tex4ht, xdy, afm stuff is ok, and don't worry about
    # Changes, README et al.  Other per-format versions.
    next if $f =~ /\.(afm|cfg|dll|exe|4hf|htf|xdy)$/;
    next if $f
      =~ /^((czech|slovak)\.sty
            |Changes
            |Makefile
            |README
            |cid2code\.txt
            |etex\.src
            |fithesis.*
            |kinsoku\.tex
            |language\.dat
            |language\.def
            |local\.mf
            |m-tex4ht\.tex
            |metatex\.tex
            |.*-noEmbed\.map
            |ps2mfbas\.mf
            |pstricks\.con
            |sample\.bib
            |tex4ht\.env
            |test\.mf
            |texutil\.rb
            |tlmgrgui\.pl
           )$/x;
    #
    my @copies = grep (/\/$f$/, @runtime_files);
    # map files can be duplicated between (but not within) formats.
    if ($f =~ /\.map$/) {
      my $need_check = 0;
      my $prev_dir = "";
      my @cop = @copies; # don't break the outside list
      map { s#^texmf-dist/fonts/map/(.*?)/.*#$1# } @cop;
      foreach my $dir (sort @cop ) {
        last if ($need_check = ($dir eq $prev_dir));
        $prev_dir = $dir;
      }
      next unless $need_check;
    }
    # if all copies are identical, ok, else, complain
    my $diff = 0;
    for (my $i = 1; $i < scalar(@copies); $i++) {
      if ($diff = tlcmp("$Master/$copies[$i-1]", "$Master/$copies[$i]")) {
        print "# $f\ndiff $Master/$copies[$i-1] $Master/$copies[$i]\n";
        last;
      }
    }
    print join ("\n", @copies), "\n" if ($diff and (scalar(@copies) > 2));
  }
}

# check executes
#
sub check_executes {
  my $Master = $localtlpdb->root;
  my (%maps,%langcodes,%fmtlines);
  for my $pkg ($localtlpdb->list_packages) {
    for my $e ($localtlpdb->get_package($pkg)->executes) {
      if ($e =~ m/add(Mixed|Kanji)?Map\s+(.*)$/) {
        my $foo = $2;
        chomp($foo);
        if ($foo !~ m/\@kanjiEmbed@/) {
          push @{$maps{$foo}}, $pkg;
        }
      } elsif ($e =~ m/AddFormat\s+(.*)$/) {
        my $foo = $1;
        chomp($foo);
        push @{$fmtlines{$foo}}, $pkg;
      } elsif ($e =~ m/AddHyphen\s+.*\s+file=(\S+)(\s*$|\s+.*)/) {
        my $foo = $1;
        chomp($foo);
        push @{$langcodes{$foo}}, $pkg;
      } else {
        warn "$pkg: unmatched execute: $e\n";
      }
    }
  }
  my %badmaps;
  foreach my $mf (keys %maps) {
    my @pkgsfound = @{$maps{$mf}};
    if ($#pkgsfound > 0) {
      tlwarn ("map file $mf is referenced in the executes of @pkgsfound\n");
    } else {
      # less then 1 occurrences is not possible, so we have only one
      # package that contains the reference to that map file
      my $pkgfoundexecute = $pkgsfound[0];
      my @found = $localtlpdb->find_file($mf);
      if ($#found < 0) {
        $badmaps{$mf} = $maps{$mf};
      } elsif ($#found > 0) {
        # we want to check for multiple inclusions
        my %mapfn;
        foreach my $foo (@found) {
          $foo =~ m/^(.*):(.*)$/;
          push @{$mapfn{$2}}, $1;
        }
        foreach my $k (keys %mapfn) {
          my @bla = @{$mapfn{$k}};
          if ($#bla > 0) {
            tlwarn ("map file $mf occurs multiple times (in pkgs: @bla)!\n");
          }
        }
      } else {
        # only one occurrence found, we check that the map is also contained
        # in the right package!
        my ($pkgcontained) = ( $found[0] =~ m/^(.*):.*$/ );
        if ($pkgcontained ne $pkgfoundexecute) {
          tlwarn("map file $mf: execute in $pkgfoundexecute, map file in $pkgcontained\n");
        }
      }
    }
  }
  if (keys %badmaps) {
    tlwarn("$prg: mentioned map file not present in any package:\n");
    foreach my $mf (keys %badmaps) {
      print "\t$mf (execute in @{$badmaps{$mf}})\n";
    }
  }
  my %badhyphcodes;
  my %problemhyphen;
  foreach my $lc (keys %langcodes) {
    next if ($lc eq "zerohyph.tex");
    my @found = $localtlpdb->find_file("texmf-dist/tex/generic/hyph-utf8/loadhyph/$lc");
    if ($#found < 0) {
      # try again this time search all packages
      my @found = $localtlpdb->find_file("$lc");
      if ($#found < 0) {
        $badhyphcodes{$lc} = $langcodes{$lc};
      } else {
        $problemhyphen{$lc} = [ @found ];
      }
    }
  }
  if (keys %badhyphcodes) {
    print "\f mentioned hyphen loaders without file:\n";
    foreach my $mf (keys %badhyphcodes) {
      print "\t$mf (execute in @{$badhyphcodes{$mf}})\n";
    }
  }
  # disable the echoing of problematic hyphens
  #if (keys %problemhyphen) {
  #  print "hyphen files with possible problematic location:\n";
  #  foreach my $mf (keys %problemhyphen) {
  #    print "\t$mf (@{$problemhyphen{$mf}})\n";
  #  }
  #}
  #
  # what should be checked for the executes? we could check
  # - the existence of the engine in bin/i386-linux or all $arch
  # - the existence of the format name link/bat
  # - parse the options parameter and check for the inifile
  # - rework the format definition that we have inifile=pdflatex.ini
  #   isn't the * unnecessary?
  my %missingbins;
  my %missingengines;
  my %missinginis;
  for (keys %fmtlines) {
    my %r = TeXLive::TLUtils::parse_AddFormat_line("$_");
    if (defined($r{"error"})) {
      die "$r{'error'}, parsing $_, package(s) @{$fmtlines{$_}}";
    }
    my $opt = $r{"options"};
    my $engine = $r{"engine"};
    my $name = $r{"name"};
    my $mode = $r{"mode"};
    # special case for cont-en ...
    next if ($name eq "cont-en");
    # we check that the name exist in bin/$arch
    my @archs_to_check = $localtlpdb->available_architectures;
    if ($engine eq "luajittex") {
      # luajittex is special since it is not available on all architectures
      # due to inherent reasons (machine code)
      # We do not want to have error messages here, so we do the following:
      # * if tlpkg/tlpsrc/luatex.tlpsrc is available, then load it
      #   and filter away those archs that are excluded with f/!...
      # * if tlpkg/tlpsrc/luatex.tlpsrc is *not* available (user installation)
      #   we just ignore it completely.
      my $tlpsrc_file = $localtlpdb->root . "/tlpkg/tlpsrc/luatex.tlpsrc";
      if (-r $tlpsrc_file) {
        require TeXLive::TLPSRC;
        my $tlpsrc = new TeXLive::TLPSRC;
        $tlpsrc->from_file($tlpsrc_file);
        my @binpats = $tlpsrc->binpatterns;
        my @negarchs;
        for my $p (@binpats) {
          if ($p =~ m%^(\w+)/(!?[-_a-z0-9,]+)\s+(.*)$%) {
            my $pt = $1;
            my $aa = $2;
            my $pr = $3;
            if ($pr =~ m!/luajittex$!) {
              # bingo, get the negative patterns
              if ($aa =~ m/^!(.*)$/) {
                @negarchs = split(/,/,$1);
              }
            }
          }
        }
        my %foo;
        for my $a (@archs_to_check) {
          $foo{$a} = 1;
        }
        for my $a (@negarchs) {
          delete $foo{$a} if defined($foo{$a});
        }
        @archs_to_check = keys %foo;
      } else {
        @archs_to_check = ();
      }
    }
    for my $a (@archs_to_check) {
      my $f = "$Master/bin/$a/$name";
      if (!check_file($a, $f)) {
        push @{$missingbins{$_}}, "bin/$a/$name" if $mode;
      }
      if (!check_file($a, "$Master/bin/$a/$engine")) {
        push @{$missingengines{$_}}, "bin/$a/$engine" if $mode;
      }
    }
    # check for the existence of the .ini file
    # by using the last word in the options value
    my $inifile = $opt;
    # $inifile now contains "bla bla bla *file.ini"
    # strip initial and trailing "
    $inifile =~ s/^"(.*)"$/$1/;
    # remove everything before the last space
    $inifile =~ s/^.* ([^ ]*)$/$1/;
    # remove the optional leading *
    $inifile =~ s/^\*//;
    my @found = $localtlpdb->find_file("$inifile");
    if ($#found < 0) {
      $missinginis{$_} = "$inifile";
    }
  }
  if (keys %missinginis) {
    print "\f mentioned ini files that cannot be found:\n";
    for my $i (keys %missinginis) {
      print "\t $missinginis{$i} (execute: $i)\n";
    }
  }
  if (keys %missingengines) {
    print "\f mentioned engine files that cannot be found:\n";
    for my $i (keys %missingengines) {
      print "\t @{$missingengines{$i}}\n";
    }
  }
  if (keys %missingbins) {
    print "\f mentioned bin files that cannot be found:\n";
    for my $i (keys %missingbins) {
      print "\t @{$missingbins{$i}}\n";
    }
  }
}

sub check_file {
  my ($a, $f) = @_;
  if (-r $f) {
    return 1;
  } else {
    # not -r, so check for the extensions .bat and .exe on windoze-ish.
    if ($a =~ /win[0-9]|.*-cygwin/) {
      if (-r "$f.exe" || -r "$f.bat") {
        return 1;
      }
    }
    return 0;
  }
}

# check depends
#
sub check_depends {
  my $ret = 0;
  my $Master = $localtlpdb->root;
  my %presentpkg;
  for my $pkg ($localtlpdb->list_packages) {
    $presentpkg{$pkg} = 1;
  }
  # list of collections.
  my @colls = $localtlpdb->collections;
  my @coll_deps
    = $localtlpdb->expand_dependencies("-no-collections", $localtlpdb, @colls);
  my %coll_deps;
  @coll_deps{@coll_deps} = ();  # initialize hash with keys from list

  my (%wrong_dep, @no_dep);
  for my $pkg ($localtlpdb->list_packages) {
    # do not check any package starting with 00texlive.
    next if $pkg =~ m/^00texlive/;

    # For each package, check that it is a dependency of some collection.
    if (! exists $coll_deps{$pkg}) {
      # Except that schemes and our ugly Windows packages are ok.
      push (@no_dep, $pkg) unless $pkg =~/^scheme-|\.win32$/;
    }

    # For each dependency, check that we have a package.
    for my $d ($localtlpdb->get_package($pkg)->depends) {
      next if ($d =~ m/\.ARCH$/);
      if (!defined($presentpkg{$d})) {
        push (@{$wrong_dep{$d}}, $pkg);
      }
    }
  }

  # check whether packages are included more than one time in a collection
  my %pkg2mother;
  for my $c (@colls) {
    for my $p ($localtlpdb->get_package($c)->depends) {
      next if ($p =~ /^collection-/);
      push @{$pkg2mother{$p}}, $c;
    }
  }
  my @double_inc_pkgs;
  for my $k (keys %pkg2mother) {
    if (@{$pkg2mother{$k}} > 1) {
      push @double_inc_pkgs, $k;
    }
  }

  if (keys %wrong_dep) {
    $ret++;
    print "\f DEPENDS WITHOUT PACKAGES:\n";
    for my $d (keys %wrong_dep) {
      print "$d in: @{$wrong_dep{$d}}\n";
    }
  }

  if (@no_dep) {
    $ret++;
    print "\f PACKAGES NOT IN ANY COLLECTION: @no_dep\n";
  }

  if (@double_inc_pkgs) {
    $ret++;
    print "\f PACKAGES IN MORE THAN ONE COLLECTION: @double_inc_pkgs\n";
  }

  return $ret;
}

#  POSTACTION
# explictly run the various post actions, e.g.,
# on a client system or overriding global settings.
# 
# tlmgr postaction [--w32mode=user|admin] [--fileassocmode=1|2] [--all]
#    [install|remove] [shortcut|fileassoc|script] [<pkg>...]

sub action_postaction {
  my $how = shift @ARGV;
  if (!defined($how) || ($how !~ m/^(install|remove)$/i)) {
    tlwarn("action postaction needs at least two arguments, first being either 'install' or 'remove'\n");
    return;
  }
  my $type = shift @ARGV;
  my $badtype = 0;
  if (!defined($type)) {
    $badtype = 1;
  } elsif ($type !~ m/^(shortcut|fileassoc|script)$/i) {
    $badtype = 1;
  }
  if ($badtype) {
    tlwarn("action postaction needs as second argument one from 'shortcut', 'fileassoc', 'script'\n");
    return;
  }
  if (win32()) {
    if ($opts{"w32mode"}) {
      if ($opts{"w32mode"} eq "user") {
        if (TeXLive::TLWinGoo::admin()) {
          debug("Switching to user mode on user request\n");
          TeXLive::TLWinGoo::non_admin();
        }
        # in user mode we also switch TEXMFSYSVAR to TEXMFVAR since
        # xetex.pl, but maybe others are writing to TEXMFSYSVAR
        chomp($ENV{"TEXMFSYSVAR"} = `kpsewhich -var-value TEXMFVAR`);
      } elsif ($opts{"w32mode"} eq "admin") {
        if (!TeXLive::TLWinGoo::admin()) {
          tlwarn("You don't have the permissions for --w32mode=admin\n");
          return;
        }
      } else {
        tlwarn("action postaction --w32mode can only be 'admin' or 'user'\n");
        return;
      }
    }
  }
  my @todo;
  if ($opts{"all"}) {
    init_local_db();
    @todo = $localtlpdb->list_packages;
  } else {
    if ($#ARGV < 0) {
      tlwarn("action postaction: need either --all or a list of packages\n");
      return;
    }
    init_local_db();
    @todo = @ARGV;
    @todo = $localtlpdb->expand_dependencies("-only-arch", $localtlpdb, @todo);
  }
  if ($type =~ m/^shortcut$/i) {
    if (!win32()) {
      tlwarn("action postaction shortcut only works on windows.\n");
      return;
    }
    for my $p (@todo) {
      my $tlp = $localtlpdb->get_package($p);
      if (!defined($tlp)) {
        tlwarn("$p is not installed, ignoring it.\n");
      } else {
        # run all shortcut actions, desktop and menu integration
        TeXLive::TLUtils::do_postaction($how, $tlp, 0, 1, 1, 0);
      }
    }
  } elsif ($type =~ m/^fileassoc$/i) {
    if (!win32()) {
      tlwarn("action postaction fileassoc only works on windows.\n");
      return;
    }
    my $fa = $localtlpdb->option("file_assocs");
    if ($opts{"fileassocmode"}) {
      if ($opts{"fileassocmode"} < 1 || $opts{"fileassocmode"} > 2) {
        tlwarn("action postaction: value of --fileassocmode can only be 1 or 2\n");
        return;
      }
      $fa = $opts{"fileassocmode"};
    }
    for my $p (@todo) {
      my $tlp = $localtlpdb->get_package($p);
      if (!defined($tlp)) {
        tlwarn("$p is not installed, ignoring it.\n");
      } else {
        TeXLive::TLUtils::do_postaction($how, $tlp, $fa, 0, 0, 0);
      }
    }
  } elsif ($type =~ m/^script$/i) {
    for my $p (@todo) {
      my $tlp = $localtlpdb->get_package($p);
      if (!defined($tlp)) {
        tlwarn("$p is not installed, ignoring it.\n");
      } else {
        TeXLive::TLUtils::do_postaction($how, $tlp, 0, 0, 0, 1);
      }
    }
  } else {
    tlwarn("action postaction needs one of 'shortcut', 'fileassoc', 'script'\n");
    return;
  }
}

#  INIT USER TREE
# sets up the user tree for tlmgr in user mode
sub action_init_usertree {
  # init_local_db but do not die if localtlpdb is not found!
  init_local_db(2);
  my $tlpdb = TeXLive::TLPDB->new;
  my $usertree;
  if ($opts{"usertree"}) {
    $usertree = $opts{"usertree"};
  } else {
    chomp($usertree = `kpsewhich -var-value TEXMFHOME`);
  }
  if (-r "$usertree/$InfraLocation/$DatabaseName") {
    tldie("$prg: user mode database already set up in\n$prg:   $usertree/$InfraLocation/$DatabaseName\n$prg: not overwriting it.\n");
  }
  $tlpdb->root($usertree);
  # copy values from main installation over
  my $maininsttlp;
  my $inst;
  if (defined($localtlpdb)) {
    $maininsttlp = $localtlpdb->get_package("00texlive.installation");
    $inst = $maininsttlp->copy;
  } else {
    $inst = TeXLive::TLPOBJ->new;
    $inst->name("00texlive.installation");
    $inst->category("TLCore");
  }
  $tlpdb->add_tlpobj($inst);
  # remove all available architectures
  $tlpdb->setting( "available_architectures", "");
  $tlpdb->option( "location", $TeXLive::TLConfig::TeXLiveURL);
  # specify that we are in user mode
  $tlpdb->setting( "usertree", 1 );
  $tlpdb->save;
  #
  # we need to create web2c dir for TLMedia to succeed setting up
  # and for tlmgr.log file
  mkdir ("$usertree/web2c");
  mkdir ("$usertree/tlpkg/tlpobj");
}

#  CONF
# tries to mimic texconfig conf but can also set values for both tlmgr
# and texmf conf files.
#
sub action_conf {
  my $arg = shift @ARGV;
  if (!defined($arg)) {
    texconfig_conf_mimic();
    return;
  }
  if ($arg eq "tlmgr" || $arg eq "texmf" || $arg eq "updmap") {
    my ($fn,$cf);
    if ($opts{'conffile'}) {
      $fn = $opts{'conffile'} ;
    }
    if ($arg eq "tlmgr") {
      chomp (my $TEXMFCONFIG = `kpsewhich -var-value=TEXMFCONFIG`);
      $fn || ( $fn = "$TEXMFCONFIG/tlmgr/config" ) ;
      $cf = TeXLive::TLConfFile->new($fn, "#", "=");
    } elsif ($arg eq "texmf") {
      $fn || ( $fn = "$Master/texmf.cnf" ) ;
      $cf = TeXLive::TLConfFile->new($fn, "[%#]", "=");
    } elsif ($arg eq "updmap") {
      $fn || ( chomp ($fn = `kpsewhich updmap.cfg`) ) ;
      $cf = TeXLive::TLConfFile->new($fn, '(#|(Mixed)?Map)', ' ');
    } else {
      die "Should not happen, conf arg=$arg";
    }
    my ($key,$val) = @ARGV;
    if (!defined($key)) {
      # show all settings
      if ($cf) {
        info("$arg configuration values (from $fn):\n");
        for my $k ($cf->keys) {
          info("$k = " . $cf->value($k) . "\n");
        }
      } else {
        info("$arg config file $fn not present\n");
      }
    } else {
      if (!defined($val)) {
        if (defined($opts{'delete'})) {
          if (defined($cf->value($key))) {
            info("removing setting $arg $key value: " . $cf->value($key) . "from $fn\n");
            $cf->delete_key($key);
          } else {
            info("$arg $key not defined, cannot remove ($fn)\n");
          }
        } else {
          if (defined($cf->value($key))) {
            info("$arg $key value: " . $cf->value($key) . " ($fn)\n");
          } else {
            info("$key not defined in $arg config file ($fn)\n");
            if ($arg eq "texmf") {
              # not in user-specific file, show anything kpsewhich gives us.
              chomp (my $defval = `kpsewhich -var-value $key`);
              if ($? != 0) {
                info("$arg $key default value is unknown");
              } else {
                info("$arg $key default value: $defval");
              }
              info(" (kpsewhich -var-value)\n");
            }
          }
        }
      } else {
        if (defined($opts{'delete'})) {
          warning("$arg --delete and value for key $key given, don't know what to do!\n");
        } else {
          info("setting $arg $key to $val (in $fn)\n");
          $cf->value($key, $val);
        }
      }
    }
    if ($cf->is_changed) {
      $cf->save;
    }
  } else {
    warn "$prg: unknown conf arg: $arg (try tlmgr or texmf or updmap)\n";
  }
}

# output various values in same form as texconfig conf.
sub texconfig_conf_mimic {
  my $PATH = $ENV{'PATH'};
  info("=========================== version information ==========================\n");
  info(give_version());
  info("==================== executables found by searching PATH =================\n");
  info("PATH: $PATH\n");
  for my $cmd (qw/kpsewhich updmap fmtutil tlmgr tex pdftex mktexpk
                  dvips dvipdfmx/) {
    info("$cmd: " . TeXLive::TLUtils::which($cmd) . "\n");
  }
  info("=========================== active config files ==========================\n");
  for my $m (qw/texmf.cnf updmap.cfg/) {
    for my $f (`kpsewhich -all $m`) {
      info("$m: $f");
    }
  }
  for my $m (qw/fmtutil.cnf config.ps mktex.cnf pdftexconfig.tex/) {
    info("$m: " . `kpsewhich $m`);
  }

  #tlwarn("missing finding of XDvi, config!\n");

  info("============================= font map files =============================\n");
  for my $m (qw/psfonts.map pdftex.map ps2pk.map kanjix.map/) {
    info("$m: " . `kpsewhich $m`);
  }

  info("=========================== kpathsea variables ===========================\n");
  for my $v (qw/TEXMFMAIN TEXMFDIST TEXMFLOCAL TEXMFSYSVAR TEXMFSYSCONFIG TEXMFVAR TEXMFCONFIG TEXMFHOME VARTEXFONTS TEXMF SYSTEXMF TEXMFDBS WEB2C TEXPSHEADERS TEXCONFIG ENCFONTS TEXFONTMAPS/) {
    info("$v=" . `kpsewhich -var-value=$v`);
  }

  info("==== kpathsea variables from environment only (ok if no output here) ====\n");
  my @envVars = qw/
    AFMFONTS BIBINPUTS BSTINPUTS CMAPFONTS CWEBINPUTS ENCFONTS GFFONTS
    GLYPHFONTS INDEXSTYLE LIGFONTS MFBASES MFINPUTS MFPOOL MFTINPUTS
    MISCFONTS MPINPUTS MPMEMS MPPOOL MPSUPPORT OCPINPUTS OFMFONTS
    OPENTYPEFONTS OPLFONTS OTPINPUTS OVFFONTS OVPFONTS PDFTEXCONFIG PKFONTS
    PSHEADERS SFDFONTS T1FONTS T1INPUTS T42FONTS TEXBIB TEXCONFIG TEXDOCS
    TEXFONTMAPS TEXFONTS TEXFORMATS TEXINDEXSTYLE TEXINPUTS TEXMFCNF
    TEXMFDBS TEXMFINI TEXMFSCRIPTS TEXPICTS TEXPKS TEXPOOL TEXPSHEADERS
    TEXSOURCES TFMFONTS TRFONTS TTFONTS VFFONTS WEB2C WEBINPUTS
  /;
  for my $v (@envVars) {
    if (defined($ENV{$v})) {
      info("$v=$ENV{$v}\n");
    }
  }
}


# Subroutines galore.
#
# set global $location variable.
#
# argument $should_i_die specifies what is requried
# to suceed during initialization.
#
# undef or false: TLPDB needs to be found and initialized, but
#                 support programs need not be found
# 1             : TLPDB initialized and support programs must work
# 2             : not even TLPDB needs to be found
# if we cannot read tlpdb, die if arg SHOULD_I_DIE is true.
#
# if an argument is given and is true init_local_db will die if
# setting up of programs failed.
#
sub init_local_db {
  my ($should_i_die) = @_;
  defined($should_i_die) or ($should_i_die = 0);
  # if the localtlpdb is already defined do simply return here already
  # to make sure that the settings in the local tlpdb do not overwrite
  # stuff changed via the GUI
  return if defined $localtlpdb;
  $localtlpdb = TeXLive::TLPDB->new ( root => $::maintree );
  if (!defined($localtlpdb)) {
    if ($should_i_die == 2) {
      return undef;
    } else {
      die("cannot setup TLPDB in $::maintree");
    }
  }
  # setup the programs, for w32 we need the shipped wget/xz etc, so we
  # pass the location of these files to setup_programs.
  if (!setup_programs("$Master/tlpkg/installer", $localtlpdb->platform)) {
    tlwarn("Couldn't set up the necessary programs.\nInstallation of packages is not supported.\nPlease report to texlive\@tug.org.\n");
    if (defined($should_i_die) && $should_i_die) {
      return ($F_ERROR);
    } else {
      tlwarn("Continuing anyway ...\n");
      return ($F_WARNING);
    }
  }
  # let cmd line options override the settings in localtlpdb
  my $loc = norm_tlpdb_path($localtlpdb->option("location"));
  if (defined($loc)) {
    $location = $loc;
  }
  if (defined($opts{"location"})) {
    $location = $opts{"location"};
  }
  if (!defined($location)) {
    die("$prg: No installation source found: neither in texlive.tlpdb nor on command line.\n$prg: Please specify one!");
  }
  if ($location =~ m/^ctan$/i) {
    $location = "$TeXLive::TLConfig::TeXLiveURL";
  }
  # we normalize the path only if it is
  # - a url starting with neither http or ftp
  # - if we are on Windows, it does not start with Drive:[\/]
  if (! ( $location =~ m!^(http|ftp)://!i  ||
          (win32() && (!(-e $location) || ($location =~ m!^.:[\\/]!) ) ) ) ) {
    # seems to be a local path, try to normalize it
    my $testloc = abs_path($location);
    # however, if we were given a url, that will get "normalized" to the
    # empty string, it not being a path.  Restore the original value if so.
    $location = $testloc if $testloc;
  }
}


# initialize the global $remotetlpdb object, or die.
# uses the global $location.
#
sub init_tlmedia_or_die {
  my ($ret, $err) = init_tlmedia();
  if (!$ret) {
    tldie("$prg: $err\n");
  }
}

sub init_tlmedia
{
  # first check if $location contains multiple locations
  # in this case we go to virtual mode
  #my %repos = repository_to_array($localtlpdb->option("location"));
  my %repos = repository_to_array($location);
  my @tags = keys %repos;
  # if we have only one repo, but this one contains a name tag #....
  # then we remove it and save the local tlpdb
  if ($#tags == 0 && ($location =~ m/#/)) {
    $location = $repos{$tags[0]};
    $localtlpdb->option("location", $location);
    $localtlpdb->save;
    %repos = repository_to_array($location);
  }
  # check if we are only one tag/repo
  if ($#tags == 0) {
    # go to normal mode
    return _init_tlmedia();
  }
  # we are still here, so we have more tags

  # check that there is a main repository
  if (!TeXLive::TLUtils::member('main', @tags)) {
    return(0, "Cannot find main repository, you have to tag one as main!");
  }

  # TODO TODO
  # - abstract the set up of a single media tlpdb
  # - make clear how to check for a already loaded remotetlpdb
  $remotetlpdb = TeXLive::TLPDB->new();
  $remotetlpdb->make_virtual;

  my $locstr = $repos{'main'};
  my ($tlmdb, $errormsg) = setup_one_remotetlpdb($locstr);
  if (!defined($tlmdb)) {
    return (0, $errormsg);
  }
  $remotetlpdb->virtual_add_tlpdb($tlmdb, "main");
  for my $t (@tags) {
    if ($t ne 'main') {
      my ($tlmdb, $errormsg) = setup_one_remotetlpdb($repos{$t});
      if (!defined($tlmdb)) {
        return(0, $errormsg);
      }
      $remotetlpdb->virtual_add_tlpdb($tlmdb, $t);
      $locstr .= " $repos{$t}";
    }
  }

  # now check/setup pinning
  if (!$opts{"pin-file"}) {
    # check for pinning file in TEXMFLOCAL/tlpkg/pinning.txt
    chomp (my $TEXMFLOCAL = `kpsewhich -var-value=TEXMFLOCAL`);
    debug("trying to load pinning file $TEXMFLOCAL/tlpkg/pinning.txt\n");
    # since we use TLConfFile it does not matter if the file
    # is not existing, it will be treated properly in TLConfFile
    $opts{"pin-file"} = "$TEXMFLOCAL/tlpkg/pinning.txt";
  }
  $pinfile = TeXLive::TLConfFile->new($opts{"pin-file"}, "#", ":", 'multiple');
  $remotetlpdb->virtual_pinning($pinfile);
  # this "location-url" line should not be changed since GUI programs
  # depend on it:
  print "location-url\t$locstr\n" if $::machinereadable;
  info("$prg: package repositories:\n");
  info("\tmain = " . $repos{'main'} . "\n");
  for my $t (@tags) {
    if ($t ne 'main') {
      info("\t$t = " . $repos{$t} . "\n");
    }
  }
  return 1;
}




sub _init_tlmedia
{

  # if we are already initialized to the same location, nothing
  # needs to be done.
  # if we are initialized to a virtual tlpdb, then we have to 
  # do in any case an initialization
  if (defined($remotetlpdb) && !$remotetlpdb->is_virtual &&
      ($remotetlpdb->root eq $location)) {
    # nothing to be done
    return 1;
  }

  # choose a mirror if we are asked.
  if ($location =~ m/^ctan$/i) {
    $location = give_ctan_mirror();
  } elsif ($location =~ m,^$TeXLiveServerURL,) {
    my $mirrorbase = TeXLive::TLUtils::give_ctan_mirror_base();
    $location =~ s,^$TeXLiveServerURL,$mirrorbase,;
  }

  my $errormsg;
  ($remotetlpdb, $errormsg) = setup_one_remotetlpdb($location);
  if (!defined($remotetlpdb)) {
    return(0, $errormsg);
  }


  # this "location-url" line should not be changed since GUI programs
  # depend on it:
  print "location-url\t$location\n" if $::machinereadable;
  info("$prg: package repository $location\n");
  return 1;
}

sub setup_one_remotetlpdb
{
  my $location = shift;
  my $remotetlpdb;

  # TODO
  # check if that is already loaded!!!

  # choose a mirror if we are asked.
  if ($location =~ m/^ctan$/i) {
    $location = give_ctan_mirror();
  } elsif ($location =~ m,^$TeXLiveServerURL,) {
    my $mirrorbase = TeXLive::TLUtils::give_ctan_mirror_base();
    $location =~ s,^$TeXLiveServerURL,$mirrorbase,;
  }

  # if we talk about a net location try to download the hash of the tlpdb
  # - if that is possible, check for the locally saved file and if the hash
  #   agrees load the local copy if present instead of the remote one,
  #   if the hashes disagree, load the remote tlpdb
  # - if that does not work assume we are offline or target not reachable,
  #   so warn the user and use saved, but note that installation will
  #   not work

  my $local_copy_tlpdb_used = 0;
  if ($location =~ m;^(http|ftp)://;) {
    # first check that the saved tlpdb is present at all
    my $loc_digest = Digest::MD5::md5_hex($location);
    my $loc_copy_of_remote_tlpdb =
      "$Master/$InfraLocation/texlive.tlpdb.$loc_digest";
    ddebug("loc_digest = $loc_digest\n");
    ddebug("loc_copy = $loc_copy_of_remote_tlpdb\n");
    if (-r $loc_copy_of_remote_tlpdb) {
      ddebug("loc copy found!\n");
      # we found the tlpdb matching the current location
      # check for the remote hash
      my $path = "$location/$InfraLocation/$DatabaseName.md5";
      ddebug("remote path of digest = $path\n");
      my $fh = TeXLive::TLUtils::download_file($path, "|");
      my $rem_digest;
      if (read ($fh, $rem_digest, 32) != 32) {
        info(<<END_NO_INTERNET);
Unable to download the remote TeX Live database,
but found a local copy so using that.

You may want to try specifying an explicit or different CTAN mirror;
see the information and examples for the -repository option at
http://tug.org/texlive/doc/install-tl.html
(or in the output of install-tl --help).

END_NO_INTERNET
        # above text duplicated in install-tl

        $remotetlpdb = TeXLive::TLPDB->new(root => $location,
          tlpdbfile => $loc_copy_of_remote_tlpdb);
        $local_copy_tlpdb_used = 1;
      } else {
        ddebug("found remote digest: $rem_digest\n");
        my $rem_copy_digest = TeXLive::TLUtils::tlmd5($loc_copy_of_remote_tlpdb);
        ddebug("rem_copy_digest = $rem_copy_digest\n");
        if ($rem_copy_digest eq $rem_digest) {
          debug("md5 of local copy identical with remote hash\n");
          $remotetlpdb = TeXLive::TLPDB->new(root => $location,
            tlpdbfile => $loc_copy_of_remote_tlpdb);
          $local_copy_tlpdb_used = 1;
        }
      }
    }
  }
  if (!$local_copy_tlpdb_used) {
    $remotetlpdb = TeXLive::TLPDB->new(root => $location);
  }
  if (!defined($remotetlpdb)) {
    return(undef, $loadmediasrcerror . $location);
  }
  # we allow a range of years to be specified by the remote tlpdb
  # for which it might work.
  # the lower limit is TLPDB->config_minrelease
  # the upper limit is TLPDB->config_release
  # if the later is not present only the year in config_release is accepted
  # checks are done on the first 4 digits only
  # Why only the first four places: some optional network distributions
  # might use
  #   release/2009-foobar
  # If it should work for 2009 and 2010, please use
  #   minrelease/2009-foobar
  #   release/2010-foobar
  my $texlive_release = $remotetlpdb->config_release;
  my $texlive_minrelease = $remotetlpdb->config_minrelease;
  my $rroot = $remotetlpdb->root;
  if (!defined($texlive_release)) {
    return(undef, "The installation repository ($rroot) does not specify a "
          . "release year for which it was prepared, goodbye.");
  }
  # still here, so we have $texlive_release defined
  my $texlive_release_year = $texlive_release;
  $texlive_release_year =~ s/^(....).*$/$1/;
  if ($texlive_release_year !~ m/^[1-9][0-9][0-9][0-9]$/) {
    return(undef, "The installation repository ($rroot) does not specify a "
          . "valid release year, goodbye: $texlive_release");
  }
  # so $texlive_release_year is numeric, good
  if (defined($texlive_minrelease)) {
    # we specify a range of years!
    my $texlive_minrelease_year = $texlive_minrelease;
    $texlive_minrelease_year =~ s/^(....).*$/$1/;
    if ($texlive_minrelease_year !~ m/^[1-9][0-9][0-9][0-9]$/) {
      return(undef, "The installation repository ($rroot) does not specify a "
            . "valid minimal release year, goodbye: $texlive_minrelease");
    }
    # ok, all numeric and fine, check for range
    if ($TeXLive::TLConfig::ReleaseYear < $texlive_minrelease_year
        || $TeXLive::TLConfig::ReleaseYear > $texlive_release_year) {
      return (undef, "The TeX Live versions supported by the repository
$rroot
  ($texlive_minrelease_year--$texlive_release_year)
do not include the version of the local installation
  ($TeXLive::TLConfig::ReleaseYear).");
    }
  } else {
    # $texlive_minrelease not defined, so only one year is valid
    if ($texlive_release_year != $TeXLive::TLConfig::ReleaseYear) {
      return(undef, "The TeX Live versions of the local installation
and the repository are not compatible:
      local: $TeXLive::TLConfig::ReleaseYear
 repository: $texlive_release_year ($rroot)
(Perhaps you need to use a different CTAN mirror? Just a guess.)");
    }
  }

  # check for being frozen
  if ($remotetlpdb->option("frozen")) {
    my $frozen_msg = <<FROZEN;
TeX Live $TeXLive::TLConfig::ReleaseYear is frozen forever and will no
longer be updated.  This happens in preparation for a new release.

If you're interested in helping to pretest the new release (when
pretests are available), please read http://tug.org/texlive/pretest.html.
Otherwise, just wait, and the new release will be ready in due time.
FROZEN
    # don't die here, we want to allow updates even if tlnet is frozen!
    tlwarn($frozen_msg);
  }

  # save remote database if it is a net location
  # make sure that the writeout of the tlpdb is done in UNIX mode
  # since otherwise the sha256 will change.
  if (!$local_copy_tlpdb_used && $location =~ m;^(http|ftp)://;) {
    my $loc_digest = Digest::MD5::md5_hex($location);
    my $loc_copy_of_remote_tlpdb =
      "$Master/$InfraLocation/texlive.tlpdb.$loc_digest";
    my $tlfh;
    if (!open($tlfh, ">:unix", $loc_copy_of_remote_tlpdb)) {
      # that should be only a debug statement, since a user without
      # write permission might have done a tlmgr search --global or
      # similar
      &debug("Cannot save remote TeX Live database to $loc_copy_of_remote_tlpdb: $!\n");
    } else {
      &debug("writing out tlpdb to $loc_copy_of_remote_tlpdb\n");
      $remotetlpdb->writeout($tlfh);
      close($tlfh);
    }
  }

  return($remotetlpdb);
}



# finish handles the -pause option (wait for input from stdin),
# and then exits unless the global $::gui_mode is set, in which case we
# merely return.
#
sub finish {
  my ($ret) = @_;

  if ($ret > 0) {
    print "$prg: exiting unsuccessfully (status $ret).\n";
  }

  if ($::gui_mode) {
    return $ret;
  } else {
    exit($ret);
  }
}


# tlmgr config file handling.  These config files are located in
# TEXMFCONFIG/tlmgr/config, thus specific for each user.
#
# format:
#  key=value
#
sub load_config_file {
  #
  # first set default values
  # the default for gui-expertmode is 1 since that is what we
  # have shipped till now
  $config{"gui-expertmode"} = 1;
  #
  # by default we remove packages
  $config{"auto-remove"} = 1;

  chomp (my $TEXMFCONFIG = `kpsewhich -var-value=TEXMFCONFIG`);
  my $fn = "$TEXMFCONFIG/tlmgr/config";
  $tlmgr_config_file = TeXLive::TLConfFile->new($fn, "#", "=");

  # switched names for this one after initial release.
  if ($tlmgr_config_file->key_present("gui_expertmode")) {
    $tlmgr_config_file->rename_key("gui_expertmode", "gui-expertmode");
  }

  for my $key ($tlmgr_config_file->keys) {
    my $val = $tlmgr_config_file->value($key);
    if ($key eq "gui-expertmode") {
      if ($val eq "0") {
        $config{"gui-expertmode"} = 0;
      } elsif ($val eq "1") {
        $config{"gui-expertmode"} = 1;
      } else {
        tlwarn("$fn: Unknown value for gui-expertmode: $val\n");
      }

    } elsif ($key eq "persistent-downloads") {
      if (($val eq "0") || ($val eq "1")) {
        $config{'persistent-downloads'} = $val;
      } else {
        tlwarn("$fn: Unknown value for persistent-downloads: $val\n");
      }

    } elsif ($key eq "gui-lang") {
      $config{'gui-lang'} = $val;

    } elsif ($key eq "auto-remove") {
      if ($val eq "0") {
        $config{"auto-remove"} = 0;
      } elsif ($val eq "1") {
        $config{"auto-remove"} = 1;
      } else {
        tlwarn("$fn: Unknown value for auto-remove: $val\n");
      }

    } else {
      tlwarn("$fn: Unknown tlmgr configuration variable: $key\n");
    }
  }
}

sub write_config_file {
  if (!defined($tlmgr_config_file)) {
    chomp (my $TEXMFCONFIG = `kpsewhich -var-value=TEXMFCONFIG`);
    my $dn = "$TEXMFCONFIG/tlmgr";
    my $fn = "$dn/config";
    # create a new one
    $tlmgr_config_file = TeXLive::TLConfFile->new($fn, "#", "=");
  }
  for my $k (keys %config) {
    # it doesn't hurt to save all config settings as we check in TLConfFile
    # if the value has actually changed
    $tlmgr_config_file->value($k, $config{$k});
  }
  # make sure that deleted config entries are carried over
  for my $k ($tlmgr_config_file->keys) {
    if (not(defined($config{$k}))) {
      $tlmgr_config_file->delete_key($k);
    }
  }
  if ($tlmgr_config_file->is_changed) {
    $tlmgr_config_file->save;
  }
}

# if the packagelog variable is set then write to PACKAGELOG filehandle
#
sub logpackage
{
  if ($packagelogfile) {
    $packagelogged++;
    my $tim = localtime();
    print PACKAGELOG "[$tim] @_\n";
  }
}

# resolve relative paths from tlpdb wrt tlroot 
sub norm_tlpdb_path
{
  my ($path) = @_;
  return if (!defined($path));
  $path =~ s!\\!/!;
  # just return if absolute path 
  return $path if ($path =~ m!^/|:!);
  init_local_db() unless defined($localtlpdb);
  return $localtlpdb->root . "/$path";
}

# clear the backup dir for $pkg and keep only $autobackup packages
# mind that with $autobackup == 0 all packages are cleared
sub clear_old_backups
{
  my ($pkg, $backupdir, $autobackup, $dry) = @_;

  my $dryrun = 0;
  $dryrun = 1 if ($dry);
  # keep arbitrary many backups
  return if ($autobackup == -1);

  opendir (DIR, $backupdir) || die "opendir($backupdir) failed: $!";
  my @dirents = readdir (DIR);
  closedir (DIR) || warn "closedir($backupdir) failed: $!";
  my @backups;
  for my $dirent (@dirents) {
    next if (-d $dirent);
    next if ($dirent !~ m/^$pkg\.r([0-9]+)\.tar\.xz$/);
    push @backups, $1;
  }
  my $i = 1;
  for my $e (reverse sort {$a <=> $b} @backups) {
    if ($i > $autobackup) {
      log ("Removing backup $backupdir/$pkg.r$e.tar.xz\n");
      unlink("$backupdir/$pkg.r$e.tar.xz") unless $dryrun;
    }
    $i++;
  }
}

# check for updates to tlcritical packages
#
sub check_for_critical_updates
{
  my ($localtlpdb, $mediatlpdb) = @_;

  my $criticalupdate = 0;
  my @critical = $localtlpdb->expand_dependencies("-no-collections",
    $localtlpdb, @CriticalPackagesList);
  my @critical_upd;
  for my $pkg (sort @critical) {
    my $tlp = $localtlpdb->get_package($pkg);
    if (!defined($tlp)) {
      # that should not happen, we expanded in the localtlpdb so why
      # should it not be present, any anyway, those are so fundamental
      # so they have to be there
      tlwarn("\nFundamental package $pkg not present, uh oh, goodbye");
      die "Should not happen, $pkg not found";
    }
    my $localrev = $tlp->revision;
    my $mtlp = $mediatlpdb->get_package($pkg);
    if (!defined($mtlp)) {
      debug("Very surprising, $pkg is not present in the remote tlpdb.\n");
      next;
    }
    my $remoterev = $mtlp->revision;
    push (@critical_upd, $pkg) if ($remoterev > $localrev);
  }
  return(@critical_upd);
}

sub critical_updates_warning {
  tlwarn("=" x 79, "\n");
  tlwarn("tlmgr itself needs to be updated.\n");
  tlwarn("Please do this via either\n");
  tlwarn("  tlmgr update --self\n");
  tlwarn("or by getting the latest updater for Unix-ish systems:\n");
  tlwarn("  $TeXLiveURL/update-tlmgr-latest.sh\n");
  tlwarn("and/or Windows systems:\n");
  tlwarn("  $TeXLiveURL/update-tlmgr-latest.exe\n");
  tlwarn("Then continue with other updates as usual.\n");
  tlwarn("=" x 79, "\n");
}

#
# our compare function for package sorting, which makes sure that
# packages with .ARCH names are sorted *before* the main packages
sub packagecmp {
  my $aa = $a;
  my $bb = $b;
  # remove the part after the . if at all present
  $aa =~ s/\..*$//;
  $bb =~ s/\..*$//;
  if ($aa lt $bb) {
    return -1;
  } elsif ($aa gt $bb) {
    return 1;
  } else {
    # the parts before the . are the same
    # sort the .something *before* the ones without
    if ($a eq $aa && $b eq $bb) {
      return 0;
    } elsif ($a eq $aa) {
      # so  $a = foobar
      # and $b = foobar.something
      # this is the special case where we want to invert the order
      return 1;
    } elsif ($b eq $bb) {
      # so  $a = foobar.something
      # and $b = foobar
      return -1;
    } else {
      return ($a cmp $b);
    }
  }
}

sub check_on_writable {
  return 1 if $opts{"usermode"};
  if (!TeXLive::TLUtils::dir_writable("$Master/tlpkg")) {
    tlwarn("You don't have permission to change the installation in any way,\n");
    tlwarn("specifically, the directory $Master/tlpkg/ is not writable.\n");
    tlwarn("Please run this program as administrator, or contact your local admin.\n");
    if ($opts{"dry-run"}) {
      tlwarn("Continuing due to --dry-run\n");
      return 1;
    } else {
      return 0;
    }
  }
  return 1;
}
    
1;
__END__

=head1 NAME

tlmgr - the TeX Live Manager

=head1 SYNOPSIS

tlmgr [I<option>]... I<action> [I<option>]... [I<operand>]...

=head1 DESCRIPTION

B<tlmgr> manages an existing TeX Live installation, both packages and
configuration options.  For information on initially downloading and
installing TeX Live, see L<http://tug.org/texlive/acquire.html>.

The most up-to-date version of this documentation (updated nightly from
the development sources) is available at
L<http://tug.org/texlive/tlmgr.html>, along with procedures for updating
C<tlmgr> itself and information about test versions.

TeX Live is organized into a few top-level I<schemes>, each of which is
specified as a different set of I<collections> and I<packages>, where a
collection is a set of packages, and a package is what contains actual
files.  Schemes typically contain a mix of collections and packages, but
each package is included in exactly one collection, no more and no less.
A TeX Live installation can be customized and managed at any level.

See L<http://tug.org/texlive/doc> for all the TeX Live documentation
available.

=head1 EXAMPLES

After successfully installing TeX Live, here are a few common operations
with C<tlmgr>:

=over 4

=item C<tlmgr option repository http://mirror.ctan.org/systems/texlive/tlnet>

Tell C<tlmgr> to use a nearby CTAN mirror for future updates; useful if
you installed TeX Live from the DVD image and want continuing updates.

=item C<tlmgr update --list>

Report what would be updated without actually updating anything.

=item C<tlmgr update --all>

Make your local TeX installation correspond to what is in the package
repository (typically useful when updating from CTAN).

=item C<tlmgr info> I<what>

Display detailed information about a package I<what>, such as the installation
status and description, of searches for I<what> in all packages.

=back

For all the capabilities and details of C<tlmgr>, please read the
following voluminous information.

=head1 OPTIONS

The following options to C<tlmgr> are global options, not specific to
any action.  All options, whether global or action-specific, can be
given anywhere on the command line, and in any order.  The first
non-option argument will be the main action.  In all cases,
C<-->I<option> and C<->I<option> are equivalent, and an C<=> is optional
between an option name and its value.

=over 4

=item B<--repository> I<url|path>

Specifies the package repository from which packages should be installed
or updated, overriding the default package repository found in the
installation's TeX Live Package Database (a.k.a. the TLPDB, defined
entirely in the file C<tlpkg/texlive.tlpdb>).  The documentation for
C<install-tl> has more details about this
(L<http://tug.org/texlive/doc/install-tl.html>).

C<--repository> changes the repository location only for the current
run; to make a permanent change, use C<option repository> (see the
L</option> action).

For backward compatibility and convenience, C<--location> and C<--repo>
are accepted as aliases for this option.


=item B<--gui> [I<action>]

C<tlmgr> has a graphical interface as well as the command line
interface.  You can give this option, C<--gui>, together with an action
to be brought directly into the respective screen of the GUI.  For
example, running

  tlmgr --gui update

starts you directly at the update screen.  If no action is given, the
GUI will be started at the main screen.

=for comment Keep language list in sync with install-tl.

=item B<--gui-lang> I<llcode>

By default, the GUI tries to deduce your language from the environment
(on Windows via the registry, on Unix via C<LC_MESSAGES>). If that fails
you can select a different language by giving this option with a
language code (based on ISO 639-1).  Currently supported (but not
necessarily completely translated) are: English (en, default), Czech
(cs), German (de), French (fr), Italian (it), Japanese (ja), Dutch (nl),
Polish (pl), Brazilian Portuguese (pt_BR), Russian (ru), Slovak (sk),
Slovenian (sl), Serbian (sr), Ukrainian (uk), Vietnamese (vi),
simplified Chinese (zh_CN), and traditional Chinese (zh_TW).

=item B<--debug-translation>

In GUI mode, this switch tells C<tlmgr> to report any untranslated (or
missing) messages to standard error.  This can help translators to see
what remains to be done.

=item B<--machine-readable>

Instead of the normal output intended for human consumption, write (to
standard output) a fixed format more suitable for machine parsing.  See
the L</MACHINE-READABLE OUTPUT> section below.

=item B<--no-execute-actions>

Suppress the execution of the execute actions as defined in the tlpsrc
files.  Documented only for completeness, as this is only useful in
debugging.

=item B<--package-logfile> I<file>

C<tlmgr> logs all package actions (install, remove, update, failed
updates, failed restores) to a separate log file, by default
C<TEXMFSYSVAR/web2c/tlmgr.log>.  This option allows you to specific a
different file for the log.

=item B<--pause>

This option makes C<tlmgr> wait for user input before exiting.  Useful on
Windows to avoid disappearing command windows.

=item B<--persistent-downloads>

=item B<--no-persistent-downloads>

For network-based installations, this option (on by default) makes
C<tlmgr> try to set up a persistent connection (using the C<LWP> Perl
module).  The idea is to open and reuse only one connection per session
between your computer and the server, instead of initiating a new
download for each package.

If this is not possible, C<tlmgr> will fall back to using C<wget>.  To
disable these persistent connections, use C<--no-persistent-downloads>.

=item B<--pin-file>

Change the pinning file location from C<TEXMFLOCAL/tlpkg/pinning.txt>
(see L</Pinning> below).  Documented only for completeness, as this is
only useful in debugging.

=item B<--usermode>

Activates user mode for this run of C<tlmgr>; see L<USER MODE> below.

=item B<--usertree> I<dir>

Uses I<dir> for the tree in user mode; see L<USER MODE> below.

=back

The standard options for TeX Live programs are also accepted:
C<--help/-h/-?>, C<--version>, C<-q> (no informational messages), C<-v>
(debugging messages, can be repeated).  For the details about these, see
the C<TeXLive::TLUtils> documentation.

The C<--version> option shows version information about the TeX Live
release and about the C<tlmgr> script itself.  If C<-v> is also given,
revision number for the loaded TeX Live Perl modules are shown, too.


=head1 ACTIONS

=head2 help

Display this help information and exit (same as C<--help>, and on the
web at L<http://tug.org/texlive/doc/tlmgr.html>).  Sometimes the
C<perldoc> and/or C<PAGER> programs on the system have problems,
resulting in control characters being literally output.  This can't
always be detected, but you can set the C<NOPERLDOC> environment
variable and C<perldoc> will not be used.

=head2 version

Gives version information (same as C<--version>).

If C<-v> has been given the revisions of the used modules are reported, too.

=head2 backup [--clean[=I<N>]] [--backupdir I<dir>] [--all | I<pkg>]...

If the C<--clean> option is not specified, this action makes a backup of
the given packages, or all packages given C<--all>. These backups are
saved to the value of the C<--backupdir> option, if that is an existing and
writable directory. If C<--backupdir> is not given, the C<backupdir>
option setting in the TLPDB is used, if present.  If both are missing,
no backups are made.

If the C<--clean> option is specified, backups are pruned (removed)
instead of saved. The optional integer value I<N> may be specified to
set the number of backups that will be retained when cleaning. If C<N>
is not given, the value of the C<autobackup> option is used. If both are
missing, an error is issued. For more details of backup pruning, see
the C<option> action.

Options:

=over 4

=item B<--backupdir> I<directory>

Overrides the C<backupdir> option setting in the TLPDB.
The I<directory> argument is required and must specify an existing,
writable directory where backups are to be placed.

=item B<--all>

If C<--clean> is not specified, make a backup of all packages in the TeX
Live installation; this will take quite a lot of space and time.  If
C<--clean> is specified, all packages are pruned.

=item B<--clean>[=I<N>]

Instead of making backups, prune the backup directory of old backups, as
explained above. The optional integer argument I<N> overrides the
C<autobackup> option set in the TLPDB.  You must use C<--all> or a list
of packages together with this option, as desired.

=item B<--dry-run>

Nothing is actually backed up or removed; instead, the actions to be
performed are written to the terminal.

=back


=head2 candidates I<pkg>

=over 4

=item B<candidates I<pkg>>

Shows the available candidate repositories for package I<pkg>.
See L</MULTIPLE REPOSITORIES> below.


=back

=head2 check [I<option>]... [files|depends|executes|runfiles|all]

Executes one (or all) check(s) on the consistency of the installation.

=over 4

=item B<files>

Checks that all files listed in the local TLPDB (C<texlive.tlpdb>) are
actually present, and lists those missing.

=item B<depends>

Lists those packages which occur as dependencies in an installed collections,
but are themselves not installed, and those packages that are not
contained in any collection.

If you call C<tlmgr check collections> this test will be carried out
instead since former versions for C<tlmgr> called it that way.

=item B<executes>

Check that the files referred to by C<execute> directives in the TeX
Live Database are present.

=item B<runfiles>

List those filenames that are occurring more than one time in the runfiles.

=back

Options:

=over 4

=item B<--use-svn>

Use the output of C<svn status> instead of listing the files; for
checking the TL development repository.

=back


=head2 conf [texmf|tlmgr|updmap [--conffile I<file>] [--delete] [I<key> [I<value>]]]

With only C<conf>, show general configuration information for TeX Live,
including active configuration files, path settings, and more.  This is
like the C<texconfig conf> call, but works on all supported platforms.

With either C<conf texmf>, C<conf tlmgr>, or C<conf updmap> given in
addition, shows all key/value pairs (i.e., all settings) as saved in
C<ROOT/texmf.cnf>, the tlmgr configuration file (see below), or the
first found (via kpsewhich) C<updmap.cfg> file, respectively.

If I<key> is given in addition, shows the value of only that I<key> in
the respective file.  If option I<--delete> is also given, the
configuration file -- it is removed, not just commented out!

If I<value> is given in addition, I<key> is set to I<value> in the 
respective file.  I<No error checking is done!>

In all cases the file used can be explicitly specified via the option
C<--conffile I<file>>, in case one wants to operate on a different file.

Practical application: if the execution of (some or all) system commands
via C<\write18> was left enabled during installation, you can disable
it afterwards:
  
  tlmgr conf texmf shell_escape 0

A more complicated example: the C<TEXMFHOME> tree (see the main TeX Live
guide, L<http://tug.org/texlive/doc.html>) can be set to multiple
directories, but they must be enclosed in braces and separated by
commas, so quoting the value to the shell is a good idea.  Thus:

  tlmgr conf texmf TEXMFHOME "{~/texmf,~/texmfbis}"

Warning: The general facility is here, but tinkering with settings in
this way is very strongly discouraged.  Again, no error checking on
either keys or values is done, so any sort of breakage is possible.


=head2 dump-tlpdb [--local|--remote]

Dump complete local or remote TLPDB to standard output, as-is.  The
output is analogous to the C<--machine-readable> output; see
L<MACHINE-READABLE OUTPUT> section.

Options:

=over 4

=item B<--local>

Dump the local tlpdb.

=item B<--remote>

Dump the remote tlpdb.

=back

Exactly one of C<--local> and C<--remote> must be given.

In either case, the first line of the output specifies the repository
location, in this format:

  "location-url" "\t" location

where C<location-url> is the literal field name, followed by a tab, and
I<location> is the file or url to the repository.

Line endings may be either LF or CRLF depending on the current platform.


=head2 generate [I<option>]... I<what>

=over 4

=item B<generate language>

=item B<generate language.dat>

=item B<generate language.def>

=item B<generate language.dat.lua>

=back

The C<generate> action overwrites any manual changes made in the
respective files: it recreates them from scratch based on the
information of the installed packages, plus local adaptions.
The TeX Live installer and C<tlmgr> routinely call C<generate> for
all of these files.

For managing your own fonts, please read the C<updmap --help>
information and/or L<http://tug.org/fonts/fontinstall.html>.

For managing your own formats, please read the C<fmtutil --help>
information.

In more detail: C<generate> remakes any of the configuration files
C<language.dat>, C<language.def>, and C<language.dat.lua>
from the information present in the local TLPDB, plus
locally-maintained files.

The locally-maintained files are C<language-local.dat>,
C<language-local.def>, or C<language-local.dat.lua>,
searched for in C<TEXMFLOCAL> in the respective
directories.  If local additions are present, the final file is made by
starting with the main file, omitting any entries that the local file
specifies to be disabled, and finally appending the local file.

(Historical note: The formerly supported C<updmap-local.cfg> and
C<fmtutil-local.cnf> are no longer read, since C<updmap> and C<fmtutil>
now reads and supports multiple configuration files.  Thus,
local additions can and should be put into an C<updmap.cfg> of C<fmtutil.cnf>
file in C<TEXMFLOCAL>.  The C<generate updmap> and C<generate fmtutil> actions
no longer exist.)

Local files specify entries to be disabled with a comment line, namely
one of these:

  %!NAME
  --!NAME

where C<language.dat> and C<language.def> use C<%>, 
and C<language.dat.lua> use C<-->.  In all cases, the I<name> is
the respective format name or hyphenation pattern identifier.
Examples:

  %!german
  --!usenglishmax

(Of course, you're not likely to actually want to disable those
particular items.  They're just examples.)

After such a disabling line, the local file can include another entry
for the same item, if a different definition is desired.  In general,
except for the special disabling lines, the local files follow the same
syntax as the master files.

The form C<generate language> recreates all three files C<language.dat>,
C<language.def>, and C<language.dat.lua>, while the forms with an
extension recreates only that given language file.

Options:

=over 4

=item B<--dest> I<output_file>

specifies the output file (defaults to the respective location in
C<TEXMFSYSVAR>).  If C<--dest> is given to C<generate language>, it
serves as a basename onto which C<.dat> will be appended for the name of
the C<language.dat> output file, C<.def> will be appended to the value
for the name of the C<language.def> output file, and C<.dat.lua> to the
name of the C<language.dat.lua> file.  (This is just to avoid
overwriting; if you want a specific name for each output file, we
recommend invoking C<tlmgr> twice.)

=item B<--localcfg> I<local_conf_file>

specifies the (optional) local additions (defaults to the respective
location in C<TEXMFLOCAL>).

=item B<--rebuild-sys>

tells tlmgr to run necessary programs after config files have been
regenerated. These are:
C<fmtutil-sys --all> after C<generate fmtutil>,
C<fmtutil-sys --byhyphen .../language.dat> after C<generate language.dat>,
and
C<fmtutil-sys --byhyphen .../language.def> after C<generate language.def>.

These subsequent calls cause the newly-generated files to actually take
effect.  This is not done by default since those calls are lengthy
processes and one might want to made several related changes in
succession before invoking these programs.

=back

The respective locations are as follows:

  tex/generic/config/language.dat (and language-local.dat);
  tex/generic/config/language.def (and language-local.def);
  tex/generic/config/language.dat.lua (and language-local.dat.lua);


=head2 gui

Start the graphical user interface. See B<GUI> below.


=head2 info [I<option>...] [collections|schemes|I<pkg>...]

With no argument, lists all packages available at the package
repository, prefixing those already installed with C<i>.

With the single word C<collections> or C<schemes> as the argument, lists
the request type instead of all packages.

With any other arguments, display information about I<pkg>: the name,
category, short and long description, installation status, and TeX Live
revision number.  If I<pkg> is not locally installed, searches in the
remote installation source.

If I<pkg> is not found locally or remotely, the search action is used
and lists matching packages and files.

It also displays information taken from the TeX Catalogue, namely the
package version, date, and license.  Consider these, especially the
package version, as approximations only, due to timing skew of the
updates of the different pieces.  By contrast, the C<revision> value
comes directly from TL and is reliable.

The former actions C<show> and C<list> are merged into this action,
but are still supported for backward compatibility.

Options:

=over 4

=item B<--list>

If the option C<--list> is given with a package, the list of contained
files is also shown, including those for platform-specific dependencies.
When given with schemes and collections, C<--list> outputs their
dependencies in a similar way.

=item B<--only-installed>

If this options is given,  the installation source will
not be used; only locally installed packages, collections, or schemes
are listed.
(Does not work for listing of packages for now)

=back


=head2 init-usertree

Sets up a texmf tree for so-called user mode management, either the
default user tree (C<TEXMFHOME>), or one specified on the command line
with C<--usertree>.  See L<USER MODE> below.


=head2 install [I<option>]... I<pkg>...

Install each I<pkg> given on the command line, if it is not already
installed.  (It does not touch existing packages; see the C<update>
action for how to get the latest version of a package.)

By default this also installs all packages on which the given I<pkg>s are
dependent.  Options:

=over 4

=item B<--dry-run>

Nothing is actually installed; instead, the actions to be performed are
written to the terminal.

=item B<--file>

Instead of fetching a package from the installation repository, use
the package files given on the command line.  These files must
be standard TeX Live package files (with contained tlpobj file).

=item B<--force>

If updates to C<tlmgr> itself (or other parts of the basic
infrastructure) are present, C<tlmgr> will bail out and not perform the
installation unless this option is given.  Not recommended.

=item B<--no-depends>

Do not install dependencies.  (By default, installing a package ensures
that all dependencies of this package are fulfilled.)

=item B<--no-depends-at-all>

Normally, when you install a package which ships binary files the
respective binary package will also be installed.  That is, for a
package C<foo>, the package C<foo.i386-linux> will also be installed on
an C<i386-linux> system.  This option suppresses this behavior, and also
implies C<--no-depends>.  Don't use it unless you are sure of what you
are doing.

=item B<--reinstall>

Reinstall a package (including dependencies for collections) even if it
already seems to be installed (i.e, is present in the TLPDB).  This is
useful to recover from accidental removal of files in the hierarchy.

When re-installing, only dependencies on normal packages are followed
(i.e., not those of category Scheme or Collection).

=item B<--with-doc>

=item B<--with-src>

While not recommended, the C<install-tl> program provides an option to
omit installation of all documentation and/or source files.  (By
default, everything is installed.)  After such an installation, you may
find that you want the documentation or source files for a given package
after all.  You can get them by using these options in conjunction with
C<--reinstall>, as in (using the C<fontspec> package as the example):

  tlmgr install --reinstall --with-doc --with-src fontspec

=back


=head2 option

=over 4

=item B<option [show]>

=item B<option showall>

=item B<option I<key> [I<value>]>

=back

The first form shows the global TeX Live settings currently saved in the
TLPDB with a short description and the C<key> used for changing it in
parentheses.

The second form is similar, but also shows options which can be defined
but are not currently set to any value.

In the third form, if I<value> is not given, the setting for I<key> is
displayed.  If I<value> is present, I<key> is set to I<value>.

Possible values for I<key> are (run C<tlmgr option showall> for
the definitive list):

 repository (default package repository),
 formats    (create formats at installation time),
 postcode   (run postinst code blobs)
 docfiles   (install documentation files),
 srcfiles   (install source files),
 backupdir  (default directory for backups),
 autobackup (number of backups to keep).
 sys_bin    (directory to which executables are linked by the path action)
 sys_man    (directory to which man pages are linked by the path action)
 sys_info   (directory to which Info files are linked by the path action)
 desktop_integration (Windows-only: create Start menu shortcuts)
 fileassocs (Windows-only: change file associations)
 multiuser  (Windows-only: install for all users)

One common use of C<option> is to permanently change the installation to
get further updates from the Internet, after originally installing from
DVD.  To do this, you can run

 tlmgr option repository http://mirror.ctan.org/systems/texlive/tlnet

The C<install-tl> documentation has more information about the possible
values for C<repository>.  (For backward compatibility, C<location> can
be used as alternative name for C<repository>.)

If C<formats> is set (this is the default), then formats are regenerated
when either the engine or the format files have changed.  Disable this
only when you know what you are doing.

The C<postcode> option controls execution of per-package
postinstallation action code.  It is set by default, and again disabling
is not likely to be of interest except perhaps to developers.

The C<docfiles> and C<srcfiles> options control the installation of
their respective files of a package. By default both are enabled (1).
This can be disabled (set to 0) if disk space is (very) limited.

The options C<autobackup> and C<backupdir> determine the defaults for
the actions C<update>, C<backup> and C<restore>.  These three actions
need a directory in which to read or write the backups.  If
C<--backupdir> is not specified on the command line, the C<backupdir>
option value is used (if set).

The C<autobackup> option (de)activates automatic generation of backups.
Its value is an integer.  If the C<autobackup> value is C<-1>, no
backups are removed.  If C<autobackup> is 0 or more, it specifies the
number of backups to keep.  Thus, backups are disabled if the value is
0.  In the C<--clean> mode of the C<backup> action this option also
specifies the number to be kept.

To setup C<autobackup> to C<-1> on the command line, use:

  tlmgr option -- autobackup -1

The C<--> avoids having the C<-1> treated as an option.  (C<--> stops
parsing for options at the point where it appears; this is a general
feature across most Unix programs.)

The C<sys_bin>, C<sys_man>, and C<sys_info> options are used on
Unix-like systems to control the generation of links for executables,
info files and man pages. See the C<path> action for details.

The last three options control behaviour on Windows installations.  If
C<desktop_integration> is set, then some packages will install items in
a sub-folder of the Start menu for C<tlmgr gui>, documentation, etc.  If
C<fileassocs> is set, Windows file associations are made (see also the
C<postaction> action).  Finally, if C<multiuser> is set, then adaptions
to the registry and the menus are done for all users on the system
instead of only the current user.  All three options are on by default.


=head2 paper

=over 4

=item B<paper [a4|letter]>

=item B<S<[xdvi|pdftex|dvips|dvipdfmx|context|psutils] paper [I<papersize>|--list]>>

=back

With no arguments (C<tlmgr paper>), shows the default paper size setting
for all known programs.

With one argument (e.g., C<tlmgr paper a4>), sets the default for all
known programs to that paper size.

With a program given as the first argument and no paper size specified
(e.g., C<tlmgr dvips paper>), shows the default paper size for that
program.

With a program given as the first argument and a paper size as the last
argument (e.g., C<tlmgr dvips paper a4>), set the default for that
program to that paper size.

With a program given as the first argument and C<--list> given as the
last argument (e.g., C<tlmgr dvips paper --list>), shows all valid paper
sizes for that program.  The first size shown is the default.

Incidentally, this syntax of having a specific program name before the
C<paper> keyword is unusual.  It is inherited from the longstanding
C<texconfig> script, which supports other configuration settings for
some programs, notably C<dvips>.  C<tlmgr> does not support those extra
settings.


=head2 path [--w32mode=user|admin] [add|remove]

On Unix, merely adds or removes symlinks for binaries, man pages, and
info pages in the system directories specified by the respective options
(see the L</option> description above).  Does not change any
initialization files, either system or personal.

On Windows, the registry part where the binary directory is added or
removed is determined in the following way:

If the user has admin rights, and the option C<--w32mode> is not given,
the setting I<w32_multi_user> determines the location (i.e., if it is
on then the system path, otherwise the user path is changed).

If the user has admin rights, and the option C<--w32mode> is given, this
option determines the path to be adjusted.

If the user does not have admin rights, and the option C<--w32mode>
is not given, and the setting I<w32_multi_user> is off, the user path
is changed, while if the setting I<w32_multi_user> is on, a warning is
issued that the caller does not have enough privileges.

If the user does not have admin rights, and the option C<--w32mode>
is given, it must be B<user> and the user path will be adjusted. If a
user without admin rights uses the option C<--w32mode admin> a warning
is issued that the caller does not have enough privileges.


=head2 pinning 

The C<pinning> action manages the pinning file, see L</Pinning> below.

=over 4

=item C<pinning show>

Shows the current pinning data.

=item C<pinning add> I<repo> I<pkgglob>...

Pins the packages matching the I<pkgglob>(s) to the repository
I<repo>.

=item C<pinning remove> I<repo> I<pkgglob>...

Any packages recorded in the pinning file matching the <pkgglob>s for
the given repository I<repo> are removed.

=item C<pinning remove I<repo> --all>

Remove all pinning data for repository I<repo>.

=back

=head2 platform list|add|remove I<platform>...

=head2 platform set I<platform>

=head2 platform set auto

C<platform list> lists the TeX Live names of all the platforms
(a.k.a. architectures), (C<i386-linux>, ...) available at the package
repository.

C<platform add> I<platform>... adds the executables for each given platform
I<platform> to the installation from the repository.

C<platform remove> I<platform>... removes the executables for each given 
platform I<platform> from the installation, but keeps the currently 
running platform in any case.

C<platform set> I<platform> switches TeX Live to always use the given
platform instead of auto detection.

C<platform set auto> switches TeX Live to auto detection mode for platform.

Platform detection is needed to select the proper C<xz>, C<xzdec> and 
C<wget> binaries that are shipped with TeX Live.

C<arch> is a synonym for C<platform>.

Options:

=over 4

=item B<--dry-run>

Nothing is actually installed; instead, the actions to be performed are
written to the terminal.

=back


=cut

# keep the following on *ONE* line otherwise Losedows perldoc does
# not show it!!!!

=pod

=head2 postaction [--w32mode=user|admin] [--fileassocmode=1|2] [--all] [install|remove] [shortcut|fileassoc|script] [I<pkg>]...

Carry out the postaction C<shortcut>, C<fileassoc>, or C<script> given
as the second required argument in install or remove mode (which is the
first required argument), for either the packages given on the command
line, or for all if C<--all> is given.

If the option C<--w32mode> is given the value C<user>, all actions will
only be carried out in the user-accessible parts of the
registry/filesystem, while the value C<admin> selects the system-wide
parts of the registry for the file associations.  If you do not have
enough permissions, using C<--w32mode=admin> will not succeed.

C<--fileassocmode> specifies the action for file associations.  If it is
set to 1 (the default), only new associations are added; if it is set to
2, all associations are set to the TeX Live programs.  (See also
C<option fileassocs>.)


=head2 print-platform

Print the TeX Live identifier for the detected platform
(hardware/operating system) combination to standard output, and exit.
C<--print-arch> is a synonym.


=head2 remove [I<option>]... I<pkg>...

Remove each I<pkg> specified.  Removing a collection removes all package
dependencies (unless C<--no-depends> is specified), but not any
collection dependencies of that collection.  However, when removing a
package, dependencies are never removed.  Options:

=over 4

=item B<--no-depends>

Do not remove dependent packages.

=item B<--no-depends-at-all>

See above under B<install> (and beware).

=item B<--force>

By default, removal of a package or collection that is a dependency of
another collection or scheme is not allowed.  With this option, the
package will be removed unconditionally.  Use with care.

A package that has been removed using the C<--force> option because it
is still listed in an installed collection or scheme will not be
updated, and will be mentioned as B<forcibly removed> in the output of
B<tlmgr update --list>.

=item B<--dry-run>

Nothing is actually removed; instead, the actions to be performed are
written to the terminal.

=back


=head2 repository

=over 4

=item B<repository list>

=item B<repository list I<path|tag>>

=item B<repository add I<path> [I<tag>]>

=item B<repository remove I<path|tag>>

=item B<repository set I<path>[#I<tag>] [I<path>[#I<tag>] ...]>

This action manages the list of repositories.  See L</MULTIPLE
REPOSITORIES> below for detailed explanations.

The first form (C<list>) lists all configured repositories and the
respective tags if set. If a path, url, or tag is given after the
C<list> keyword, it is interpreted as source from where to 
initialize a TeX Live Database and lists the contained packages.
This can also be an up-to-now not used repository, both locally
and remote. If one pass in addition C<--with-platforms>, for each
package the available platforms (if any) are listed, too.

The third form (C<add>) adds a repository
(optionally attaching a tag) to the list of repositories.  The forth
form (C<remove>) removes a repository, either by full path/url, or by
tag.  The last form (C<set>) sets the list of repositories to the items
given on the command line, not keeping previous settings

In all cases, one of the repositories must be tagged as C<main>;
otherwise, all operations will fail!

=back


=head2 restore [--backupdir I<dir>] [--all | I<pkg> [I<rev>]]

Restore a package from a previously-made backup.

If C<--all> is given, try to restore the latest revision of all 
package backups found in the backup directory.

Otherwise, if neither I<pkg> nor I<rev> are given, list the available
backup revisions for all packages.  With I<pkg> given but no I<rev>,
list all available backup revisions of I<pkg>.

When listing available packages tlmgr shows the revision, and in 
parenthesis the creation time if available (in format yyyy-mm-dd hh:mm).

If (and only if) both I<pkg> and a valid revision number I<rev> are
specified, try to restore the package from the specified backup.

Options:

=over 4

=item B<--all>

Try to restore the latest revision of all package backups found in the
backup directory. Additional non-option arguments (like I<pkg>) are not
allowed.

=item B<--backupdir> I<directory>

Specify the directory where the backups are to be found. If not given it
will be taken from the configuration setting in the TLPDB.

=item B<--dry-run>

Nothing is actually restored; instead, the actions to be performed are
written to the terminal.

=item B<--force>

Don't ask questions.

=back


=head2 search [I<option>...] I<what>

=head3 search [I<option>...] --file I<what>

=head3 search [I<option>...] --all I<what>

By default, search the names, short descriptions, and long descriptions
of all locally installed packages for the argument I<what>, interpreted
as a (Perl) regular expression.

Options:

=over 4

=item B<--file>

List all filenames containing I<what>.

=item B<--all>

Search everything: package names, descriptions and filenames.

=item B<--global>

Search the TeX Live Database of the installation medium, instead of the
local installation.

=item B<--word>

Restrict the search of package names and descriptions (but not
filenames) to match only full words.  For example, searching for
C<table> with this option will not output packages containing the word
C<tables> (unless they also contain the word C<table> on its own).

=back


=head2 uninstall

Uninstalls the entire TeX Live installation.  Options:

=over 4

=item B<--force>

Do not ask for confirmation, remove immediately.

=back


=head2 update [I<option>]... [I<pkg>]...

Updates the packages given as arguments to the latest version available
at the installation source.  Either C<--all> or at least one I<pkg> name
must be specified.  Options:

=over 4

=item B<--all>

Update all installed packages except for C<tlmgr> itself.  Thus, if
updates to C<tlmgr> itself are present, this will simply give an error,
unless also the option C<--force> or C<--self> is given.  (See below.)

In addition to updating the installed packages, during the update of a
collection the local installation is (by default) synchronized to the
status of the collection on the server, for both additions and removals.

This means that if a package has been removed on the server (and thus
has also been removed from the respective collection), C<tlmgr> will
remove the package in the local installation.  This is called
``auto-remove'' and is announced as such when using the option
C<--list>.  This auto-removal can be suppressed using the option
C<--no-auto-remove> (not recommended, see option description).

Analogously, if a package has been added to a collection on the server
that is also installed locally, it will be added to the local
installation.  This is called ``auto-install'' and is announced as such
when using the option C<--list>.  This auto-installation can be
suppressed using the option C<--no-auto-install>.

An exception to the collection dependency checks (including the
auto-installation of packages just mentioned) are those that have been
``forcibly removed'' by you, that is, you called C<tlmgr remove --force>
on them.  (See the C<remove> action documentation.)  To reinstall any
such forcibly removed packages use C<--reinstall-forcibly-removed>.

If you want to exclude some packages from the current update run (e.g.,
due to a slow link), see the C<--exclude> option below.

=item B<--self>

Update C<tlmgr> itself (that is, the infrastructure packages) if updates
to it are present. On Windows this includes updates to the private Perl
interpreter shipped inside TeX Live.

If this option is given together with either C<--all> or a list of
packages, then C<tlmgr> will be updated first and, if this update
succeeds, the new version will be restarted to complete the rest of the
updates.

In short:

  tlmgr update --self        # update infrastructure only
  tlmgr update --self --all  # update infrastructure and all packages
  tlmgr update --force --all # update all packages but *not* infrastructure
                             # ... this last at your own risk, not recommended!

=item B<--dry-run>

Nothing is actually installed; instead, the actions to be performed are
written to the terminal.  This is a more detailed report than C<--list>.

=item B<--list> [I<pkg>]

Concisely list the packages which would be updated, newly installed, or
removed, without actually changing anything. 
If C<--all> is also given, all available updates are listed.
If C<--self> is given, but not C<--all>, only updates to the
critical packages (tlmgr, texlive infrastructure, perl on Windows, etc.)
are listed.
If neither C<--all> nor C<--self> is given, and in addition no I<pkg> is
given, then C<--all> is assumed (thus, C<tlmgr update --list> is the
same as C<tlmgr update --list --all>).
If neither C<--all> nor C<--self> is given, but specific package names are
given, those packages are checked for updates.

=item B<--exclude> I<pkg>

Exclude I<pkg> from the update process.  If this option is given more
than once, its arguments accumulate.

An argument I<pkg> excludes both the package I<pkg> itself and all
its related platform-specific packages I<pkg.ARCH>.  For example,

  tlmgr update --all --exclude a2ping

will not update C<a2ping>, C<a2ping.i386-linux>, or
any other C<a2ping.>I<ARCH> package.

If this option specifies a package that would otherwise be a candidate
for auto-installation, auto-removal, or reinstallation of a forcibly
removed package, C<tlmgr> quits with an error message.  Excludes are not
supported in these circumstances.

=item B<--no-auto-remove> [I<pkg>]...

By default, C<tlmgr> tries to remove packages which have disappeared on
the server, as described above under C<--all>.  This option prevents
such removals, either for all packages (with C<--all>), or for just the
given I<pkg> names.  This can lead to an inconsistent TeX installation,
since packages are not infrequently renamed or replaced by their
authors.  Therefore this is not recommend.

=item B<--no-auto-install> [I<pkg>]...

Under normal circumstances C<tlmgr> will install packages which are new
on the server, as described above under C<--all>.  This option prevents
any such automatic installation, either for all packages (with
C<--all>), or the given I<pkg> names.

Furthermore, after the C<tlmgr> run using this has finished, the
packages that would have been auto-installed I<will be considered as
forcibly removed>.  So, if C<foobar> is the only new package on the
server, then

  tlmgr update --all --no-auto-install

is equivalent to

  tlmgr update --all
  tlmgr remove --force foobar

=item B<--reinstall-forcibly-removed>

Under normal circumstances C<tlmgr> will not install packages that have
been forcibly removed by the user; that is, removed with C<remove
--force>, or whose installation was prohibited by C<--no-auto-install>
during an earlier update.

This option makes C<tlmgr> ignore the forcible removals and re-install
all such packages. This can be used to completely synchronize an
installation with the server's idea of what is available:

  tlmgr update --reinstall-forcibly-removed --all

=item B<--backup> and B<--backupdir> I<directory>

These two options control the creation of backups of packages I<before>
updating; that is, backup of packages as currently installed.  If
neither of these options are given, no backup package will be saved. If
C<--backupdir> is given and specifies a writable directory then a backup
will be made in that location. If only C<--backup> is given, then a
backup will be made to the directory previously set via the C<option>
action (see below). If both are given then a backup will be made to the
specified I<directory>.

You can set options via the C<option> action to automatically create
backups for all packages, and/or keep only a certain number of
backups.  Please see the C<option> action for details.

C<tlmgr> always makes a temporary backup when updating packages, in case
of download or other failure during an update.  In contrast, the purpose
of this C<--backup> option is to allow you to save a persistent backup
in case the actual I<content> of the update causes problems, e.g.,
introduces an incompatibility.

The C<restore> action explains how to restore from a backup.

=item B<--no-depends>

If you call for updating a package normally all depending packages
will also be checked for updates and updated if necessary. This switch
suppresses this behavior.

=item B<--no-depends-at-all>

See above under B<install> (and beware).

=item B<--force>

Force update of normal packages, without updating C<tlmgr> itself 
(unless the C<--self> option is also given).  Not recommended.

Also, C<update --list> is still performed regardless of this option.

=back

If the package on the server is older than the package already installed
(e.g., if the selected mirror is out of date), C<tlmgr> does not
downgrade.  Also, packages for uninstalled platforms are not installed.

C<tlmgr> saves a copy of the C<texlive.tlpdb> file used for an update
with a suffix representing the repository url, as in
C<tlpkg/texlive.tlpdb.>I<long-hash-string>.  These can be useful for
fallback information, but if you don't like them accumulating (e.g.,
on each run C<mirror.ctan.org> might resolve to a new host, resulting in
a different hash), it's harmless to delete them.

=head1 USER MODE

C<tlmgr> provides a restricted way, called ``user mode'', to manage
arbitrary texmf trees in the same way as the main installation.  For
example, this allows people without write permissions on the
installation location to update/install packages into a tree of their
own.

C<tlmgr> is switched into user mode with the command line option
C<--usermode>.  It does not switch automatically, nor is there any
configuration file setting for it.  Thus, this option has to be
explicitly given every time user mode is to be activated.

This mode of C<tlmgr> works on a user tree, by default the value of the
C<TEXMFHOME> variable.  This can be overridden with the command line
option C<--usertree>.  In the following when we speak of the user tree
we mean either C<TEXMFHOME> or the one given on the command line.

Not all actions are allowed in user mode; C<tlmgr> will warn you and not
carry out any problematic actions.  Currently not supported (and
probably will never be) is the C<platform> action.  The C<gui> action is
currently not supported, but may be in a future release.

Some C<tlmgr> actions don't need any write permissions and thus work the
same in user mode and normal mode.  Currently these are: C<check>,
C<help>, C<list>, C<print-platform>, C<search>, C<show>, C<version>.

On the other hand, most of the actions dealing with package management
do need write permissions, and thus behave differently in user mode, as
described below: C<install>, C<update>, C<remove>, C<option>, C<paper>,
C<generate>, C<backup>, C<restore>, C<uninstall>, C<symlinks>.

Before using C<tlmgr> in user mode, you have to set up the user tree
with the C<init-usertree> action.  This creates I<usertree>C</web2c> and
I<usertree>C</tlpkg/tlpobj>, and a minimal
I<usertree>C</tlpkg/texlive.tlpdb>.  At that point, you can tell
C<tlmgr> to do the (supported) actions by adding the C<--usermode>
command line option.

In user mode the file I<usertree>C</tlpkg/texlive.tlpdb> contains only
the packages that have been installed into the user tree using C<tlmgr>,
plus additional options from the ``virtual'' package
C<00texlive.installation> (similar to the main installation's
C<texlive.tlpdb>).

All actions on packages in user mode can only be carried out on packages
that are known as C<relocatable>.  This excludes all packages containing
executables and a few other core packages.  Of the 2500 or so packages
currently in TeX Live the vast majority are relocatable and can be
installed into a user tree.

Description of changes of actions in user mode:

=head2 User mode install

In user mode, the C<install> action checks that the package and all
dependencies are all either relocated or already installed in the system
installation.  If this is the case, it unpacks all containers to be
installed into the user tree (to repeat, that's either C<TEXMFHOME> or
the value of C<--usertree>) and add the respective packages to the user
tree's C<texlive.tlpdb> (creating it if need be).

Currently installing a collection in user mode installs all dependent
packages, but in contrast to normal mode, does I<not> install dependent
collections.  For example, in normal mode C<tlmgr install
collection-context> would install C<collection-basic> and other
collections, while in user mode, I<only> the packages mentioned in
C<collection-context> are installed.

=head2 User mode backup, restore, remove, update

In user mode, these actions check that all packages to be acted on are
installed in the user tree before proceeding; otherwise, they behave
just as in normal mode.
 
=head2 User mode generate, option, paper

In user mode, these actions operate only on the user tree's
configuration files and/or C<texlive.tlpdb>.
creates configuration files in user tree


=head1 CONFIGURATION FILE FOR TLMGR

A small subset of the command line options can be set in a config file
for C<tlmgr> which resides in C<TEXMFCONFIG/tlmgr/config>.  By default, the
config file is in C<~/.texliveYYYY/texmf-config/tlmgr/config> (replacing
C<YYYY> with the year of your TeX Live installation). This is I<not>
C<TEXMFSYSVAR>, so that the file is specific to a single user.

In this file, empty lines and lines starting with # are ignored.  All
other lines must look like

  key = value

where the allowed keys are C<gui-expertmode> (value 0 or 1),
C<persistent-downloads> (value 0 or 1), C<auto-remove> (value 0 or 1),
and C<gui-lang> (value like in the command line option).

C<persistent-downloads>, C<gui-lang>, and C<auto-remove> correspond to
the respective command line options of the same name.  C<gui-expertmode>
switches between the full GUI and a simplified GUI with only the
important and mostly used settings.


=head1 MULTIPLE REPOSITORIES

The main TeX Live repository contains a vast array of packages.
Nevertheless, additional local repositories can be useful to provide
locally-installed resources, such as proprietary fonts and house styles.
Also, alternative package repositories distribute packages that cannot
or should not be included in TeX Live, for whatever reason.

The simplest and most reliable method is to temporarily set the
installation source to any repository (with the C<-repository> or
C<option repository> command line options), and perform your operations.

When you are using multiple repositories over a sustained time, however,
explicitly switching between them becomes inconvenient.  Thus, it's
possible to tell C<tlmgr> about additional repositories you want to use.
The basic command is C<tlmgr repository add>.  The rest of this section
explains further.

When using multiple repositories, one of them has to be set as the main
repository, which distributes most of the installed packages.  When you
switch from a single repository installation to a multiple repository
installation, the previous sole repository will be set as the main
repository.

By default, even if multiple repositories are configured, packages are
I<still> I<only> installed from the main repository.  Thus, simply
adding a second repository does not actually enable installation of
anything from there.  You also have to specify which packages should be
taken from the new repository, by specifying so-called ``pinning''
rules, described next.

=head2 Pinning

When a package C<foo> is pinned to a repository, a package C<foo> in any
other repository, even if it has a higher revision number, will not be
considered an installable candidate.

As mentioned above, by default everything is pinned to the main
repository.  Let's now go through an example of setting up a second
repository and enabling updates of a package from it.

First, check that we have support for multiple repositories, and have
only one enabled (as is the case by default):

 $ tlmgr repository list
 List of repositories (with tags if set):
   /var/www/norbert/tlnet

Ok.  Let's add the C<tlcontrib> repository (this is a real
repository, hosted at L<http://tlcontrib.metatex.org>, maintained by
Taco Hoekwater et al.), with the tag C<tlcontrib>:

 $ tlmgr repository add http://tlcontrib.metatex.org/2012 tlcontrib

Check the repository list again:

 $ tlmgr repository list
 List of repositories (with tags if set):
    http://tlcontrib.metatex.org/2012 (tlcontrib)
    /var/www/norbert/tlnet (main)

Now we specify a pinning entry to get the package C<context> from
C<tlcontrib>:

 $ tlmgr pinning add tlcontrib context

Check that we can find C<context>:

 $ tlmgr show context
 tlmgr: package repositories:
 ...
 package:     context
 repository:  tlcontrib/26867
 ...

- install C<context>:

 $ tlmgr install context
 tlmgr: package repositories:
 ...
 [1/1,  ??:??/??:??] install: context @tlcontrib [

In the output here you can see that the C<context> package has been
installed from the C<tlcontrib> repository (C<@tlcontrib>).

Finally, C<tlmgr pinning> also supports removing certain or all packages
from a given repository:

  $ tlmgr pinning remove tlcontrib context  # remove just context
  $ tlmgr pinning remove tlcontrib --all    # take nothing from tlcontrib

A summary of the C<tlmgr pinning> actions is given above.


=head1 GUI FOR TLMGR

The graphical user interface for C<tlmgr> needs Perl/Tk to be installed.
For Windows the necessary modules are shipped within TeX Live, for all
other (i.e., Unix-based) systems Perl/Tk (as well as Perl of course) has
to be installed.  L<http://tug.org/texlive/distro.html#perltk> has a
list of invocations for some distros.

When started with C<tlmgr gui> the graphical user interface will be
shown.  The main window contains a menu bar, the main display, and a
status area where messages normally shown on the console are displayed.

Within the main display there are three main parts: the C<Display
configuration> area, the list of packages, and the action buttons.

Also, at the top right the currently loaded repository is shown; this
also acts as a button and when clicked will try to load the default
repository.  To load a different repository, see the C<tlmgr> menu item.

Finally, the status area at the bottom of the window gives additional
information about what is going on.


=head2 Main display

=head3 Display configuration area

The first part of the main display allows you to specify (filter) which
packages are shown.  By default, all are shown.  Changes here are
reflected right away.

=over 4

=item Status

Select whether to show all packages (the default), only those installed,
only those I<not> installed, or only those with update available.

=item Category

Select which categories are shown: packages, collections, and/or
schemes.  These are briefly explained in the L</DESCRIPTION> section
above.

=item Match

Select packages matching for a specific pattern.  By default, this
searches both descriptions and filenames.  You can also select a subset
for searching.

=item Selection

Select packages to those selected, those not selected, or all.  Here,
``selected'' means that the checkbox in the beginning of the line of a
package is ticked.

=item Display configuration buttons

To the right there are three buttons: select all packages, select none
(a.k.a. deselect all), and reset all these filters to the defaults,
i.e., show all available.

=back

=head3 Package list area

The second are of the main display lists all installed packages.  If a
repository is loaded, those that are available but not installed are
also listed.

Double clicking on a package line pops up an informational window with
further details: the long description, included files, etc.

Each line of the package list consists of the following items:

=over 4

=item a checkbox

Used to select particular packages; some of the action buttons (see
below) work only on the selected packages.

=item package name

The name (identifier) of the package as given in the database.

=item local revision (and version)

If the package is installed the TeX Live revision number for the
installed package will be shown.  If there is a catalogue version given
in the database for this package, it will be shown in parentheses.
However, the catalogue version, unlike the TL revision, is not
guaranteed to reflect what is actually installed.

=item remote revision (and version)

If a repository has been loaded the revision of the package in the
repository (if present) is shown.  As with the local column, if a
catalogue version is provided it will be displayed.  And also as with
the local column, the catalogue version may be stale.

=item short description

The short description of the package.

=back

=head3 Main display action buttons

Below the list of packages are several buttons:

=over 4

=item Update all installed

This calls C<tlmgr update --all>, i.e., tries to update all available
packages.  Below this button is a toggle to allow reinstallation of
previously removed packages as part of this action.

The other four buttons only work on the selected packages, i.e., those
where the checkbox at the beginning of the package line is ticked.

=item Update

Update only the selected packages.

=item Install

Install the selected packages; acts like C<tlmgr install>, i.e., also
installs dependencies.  Thus, installing a collection installs all its
constituent packages.

=item Remove

Removes the selected packages; acts like C<tlmgr remove>, i.e., it will
also remove dependencies of collections (but not dependencies of normal
packages).

=item Backup

Makes a backup of the selected packages; acts like C<tlmgr backup>. This
action needs the option C<backupdir> set (see C<Options -> General>).

=back


=head2 Menu bar

The following entries can be found in the menu bar:

=over 4

=item C<tlmgr> menu

The items here load various repositories: the default as specified in
the TeX Live database, the default network repository, the repository
specified on the command line (if any), and an arbitrarily
manually-entered one.  Also has the so-necessary C<quit> operation.

=item C<Options menu>

Provides access to several groups of options: C<Paper> (configuration of
default paper sizes), C<Platforms> (only on Unix, configuration of the
supported/installed platforms), C<GUI Language> (select language used in
the GUI interface), and C<General> (everything else).

Several toggles are also here.  The first is C<Expert options>, which is
set by default.  If you turn this off, the next time you start the GUI a
simplified screen will be shown that display only the most important
functionality.  This setting is saved in the configuration file of
C<tlmgr>; see L<CONFIGURATION FILE FOR TLMGR> for details.

The other toggles are all off by default: for debugging output, to
disable the automatic installation of new packages, and to disable the
automatic removal of packages deleted from the server.  Playing with the
choices of what is or isn't installed may lead to an inconsistent TeX Live
installation; e.g., when a package is renamed.

=item C<Actions menu>

Provides access to several actions: update the filename database (aka
C<ls-R>, C<mktexlsr>, C<texhash>), rebuild all formats (C<fmtutil-sys
--all>), update the font map database (C<updmap-sys>), restore from a backup
of a package, and use of symbolic links in system directories (not on
Windows).

The final action is to remove the entire TeX Live installation (also not
on Windows).

=item C<Help menu>

Provides access to the TeX Live manual (also on the web at
L<http://tug.org/texlive/doc.html>) and the usual ``About'' box.

=back


=head1 MACHINE-READABLE OUTPUT

With the C<--machine-readable> option, C<tlmgr> writes to stdout in the
fixed line-oriented format described here, and the usual informational
messages for human consumption are written to stderr (normally they are
written to stdout).  The idea is that a program can get all the
information it needs by reading stdout.

Currently this option only applies to the 
L<update|/update [I<option>]... [I<pkg>]...>,
L<install|/install [I<option>]... I<pkg>...>, and
L</option> actions.  


=head2 Machine-readable C<update> and C<install> output

The output format is as follows:

  fieldname "\t" value
  ...
  "end-of-header"
  pkgname status localrev serverrev size runtime esttot
  ...
  "end-of-updates"
  other output from post actions, not in machine readable form

The header section currently has two fields: C<location-url> (the
repository source from which updates are being drawn), and
C<total-bytes> (the total number of bytes to be downloaded).

The I<localrev> and I<serverrev> fields for each package are the
revision numbers in the local installation and server repository,
respectively.  The I<size> field is the number of bytes to be
downloaded, i.e., the size of the compressed tar file for a network
installation, not the unpacked size. The runtime and esttot fields 
are only present for updated and auto-install packages, and contain
the currently passed time since start of installation/updates
and the estimated total time.

Line endings may be either LF or CRLF depending on the current platform.

=over 4

=item C<location-url> I<location>

The I<location> may be a url (including C<file:///foo/bar/...>), or a
directory name (C</foo/bar>).  It is the package repository from which
the new package information was drawn.

=item C<total-bytes> I<count>

The I<count> is simply a decimal number, the sum of the sizes of all the
packages that need updating or installing (which are listed subsequently).

=back

Then comes a line with only the literal string C<end-of-header>.

Each following line until a line with literal string C<end-of-updates>
reports on one package.  The fields on
each line are separated by a tab.  Here are the fields.

=over 4

=item I<pkgname>

The TeX Live package identifier, with a possible platform suffix for
executables.  For instance, C<pdftex> and C<pdftex.i386-linux> are given
as two separate packages, one on each line.

=item I<status>

The status of the package update.  One character, as follows:

=over 8

=item C<d>

The package was removed on the server.

=item C<f>

The package was removed in the local installation, even though a
collection depended on it.  (E.g., the user ran C<tlmgr remove
--force>.)

=item C<u>

Normal update is needed.

=item C<r>

Reversed non-update: the locally-installed version is newer than the
version on the server.

=item C<a>

Automatically-determined need for installation, the package is new on
the server and is (most probably) part of an installed collection.

=item C<i>

Package will be installed and isn't present in the local installation
(action install).

=item C<I>

Package is already present but will be reinstalled (action install).

=back

=item I<localrev>

The revision number of the installed package, or C<-> if it is not
present locally.

=item I<serverrev>

The revision number of the package on the server, or C<-> if it is not
present on the server.

=item I<size>

The size in bytes of the package on the server.  The sum of all the
package sizes is given in the C<total-bytes> header field mentioned above.

=item I<runtime>

The run time since start of installations or updates.

=item I<esttot>

The estimated total time.

=back

=head2 Machine-readable C<option> output

The output format is as follows:

  key "\t" value

If a value is not saved in the database the string C<(not set)> is shown.

If you are developing a program that uses this output, and find that
changes would be helpful, do not hesitate to write the mailing list.


=head1 AUTHORS AND COPYRIGHT

This script and its documentation were written for the TeX Live
distribution (L<http://tug.org/texlive>) and both are licensed under the
GNU General Public License Version 2 or later.

=cut

# to remake HTML version: pod2html --cachedir=/tmp tlmgr.pl >/foo/tlmgr.html.

### Local Variables:
### perl-indent-level: 2
### tab-width: 2
### indent-tabs-mode: nil
### End:
# vim:set tabstop=2 expandtab: #
