#!/usr/bin/env perl
# $Id: uninstall-win32.pl 36785 2015-04-12 14:40:36Z peter $
# Copyright 2008, 2010, 2011, 2012, 2014 Norbert Preining
#
# GUI for tlmgr

my $Master;

BEGIN {
  $^W = 1;
  $Master = `%COMSPEC% /c kpsewhich -var-value=SELFAUTOPARENT`;
  chomp($Master);
  unshift (@INC, "$Master/tlpkg");
}

use TeXLive::TLWinGoo;
use TeXLive::TLPDB;
use TeXLive::TLPOBJ;
use TeXLive::TLConfig;
use TeXLive::TLUtils;
use Tk;
use Tk::Dialog;

my $mw = MainWindow->new(-title => "remove tlmgr $TeXLive::TLConfig::ReleaseYear");

my $f = $mw->Frame;
my $lab = $f->Label(
# -justify    => 'left',
  -text => "Do you really want to remove TeX Live $TeXLive::TLConfig::ReleaseYear?");
$lab->pack(-side => "left", -padx => "12", -pady => "6");

$f->pack(# -padx => "10m",
  -pady => "12");

my $ok = $f->Button(-text => "Ok",
                    -command => sub { $mw->destroy; doit(); exit(0); });
my $cancel = $f->Button(-text => "Cancel",
                        -command => sub { $mw->destroy; exit(1); });

$cancel->pack(-side => 'right' , -padx => "12");
$ok->pack(-side => 'right', -padx => "12");

$mw->Label(
  -text => "Please make sure that no TeX Live programs are still running!"
)->pack(-padx => "12", -pady => "12");

sub doit {
  # first we remove the whole bunch of shortcuts and menu entries
  # by calling all the post action codes for the installed packages
  my $localtlpdb = TeXLive::TLPDB->new ("root" => $Master);
  if (!defined($localtlpdb)) {
    tlwarn("Cannot load the TLPDB from $Master, are you sure there is an installation?\n");
  } else {
    # set the mode for windows uninstall according to the setting in
    # tlpdb
    if (TeXLive::TLWinGoo::admin() && !$localtlpdb->option("w32_multi_user")) {
      non_admin();
    }
    for my $pkg ($localtlpdb->list_packages) {
      &TeXLive::TLUtils::do_postaction("remove", $localtlpdb->get_package($pkg),
                                   $localtlpdb->option("file_assocs"),
                                   $localtlpdb->option("desktop_integration"),
                                   $localtlpdb->option("desktop_integration"),
                                   $localtlpdb->option("post_code"));
    }
  }
  my $menupath = &TeXLive::TLWinGoo::menu_path();
  $menupath =~ s!/!\\!g;
  `rmdir /s /q "$menupath\\$TeXLive::TLConfig::WindowsMainMenuName" 2>nul`;

  # remove bindir from PATH settings
  TeXLive::TLUtils::w32_remove_from_path("$Master/bin/win32", 
    $localtlpdb->option("w32_multi_user"));

  # unsetenv_reg("TEXBINDIR");
  # unsetenv_reg("TEXMFSYSVAR");
  # unsetenv_reg("TEXMFCNF");
  unregister_uninstaller($localtlpdb->option("w32_multi_user"));
  broadcast_env();
  update_assocs();
}

Tk::MainLoop();

__END__


### Local Variables:
### perl-indent-level: 2
### tab-width: 2
### indent-tabs-mode: nil
### End:
# vim:set tabstop=2 expandtab: #
