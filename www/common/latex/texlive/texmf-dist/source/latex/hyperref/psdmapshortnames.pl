#!/usr/bin/env perl
use strict;
$^W=1;

# File: psdmapshortnames.pl
# Date: 2012-07-12
# Copyright (c) 2012 by Heiko Oberdiek.
#
# This file is part of the `Hyperref Bundle'.
# -------------------------------------------
#
# This work may be distributed and/or modified under the
# conditions of the LaTeX Project Public License, either version 1.3
# of this license or (at your option) any later version.
# The latest version of this license is in
#   http://www.latex-project.org/lppl.txt
# and version 1.3 or later is part of all distributions of LaTeX
# version 2005/12/01 or later.
#
# This work has the LPPL maintenance status `maintained'.
#
# The Current Maintainer of this work is Heiko Oberdiek.
#
# The list of all files belonging to the `Hyperref Bundle' is
# given in the file `manifest.txt'.

my $file_org = 'hyperref.dtx';
my $file_bak = 'hyperref.dtx.bak';
my $file_tmp = 'hyperref.dtx.tmp';

my @lines_map;
my $cmd_map = 'psdmapshortnames';
my $found_map_beg = 0;
my $found_map_end = 0;

my @lines_alias;
my $cmd_alias = 'psdaliasnames';
my $found_alias_beg = 0;
my $found_alias_end = 0;

open(IN, '<', $file_org) or die "!!! Error: Cannot open `$file_org'!\n";
binmode(IN);
unlink $file_tmp if -f $file_tmp;
open(OUT, '>', $file_tmp) or die "!!! Error: Cannot open `$file_org'!\n";
binmode(OUT);

while (<IN>) {
    print OUT;
    if (/^\\newcommand\*\{\\$cmd_map\}\{\%\s*$/) {
        $found_map_beg = 1;
        print OUT @lines_map;
        while (<IN>) {
            if (/^\}\% \\$cmd_map$/) {
                print OUT;
                $found_map_end = 1;
                last;
            }
            if (/^\}/) {
                print OUT;
                last;
            }
        }
    }
    if (/^\\DeclareTextCommand\{\\text(\w+)\}\{PU\}\{[\\\d\w]+\}\%\*/) {
        my $name = $1;
        push @lines_map, "  \\let\\$name\\text$name\n";
    }
    
    if (/^\\newcommand\*\{\\$cmd_alias\}\{\%\s*$/) {
        $found_alias_beg = 1;
        print OUT @lines_alias;
        while (<IN>) {
            if (/^\}\% \\$cmd_alias$/) {
                print OUT;
                $found_alias_end = 1;
                last;
            }
            if (/^\}/) {
                print OUT;
                last;
            }
        }
    }
    if (/^%\* \\([A-Za-z@]+)\s+->\s+\\(\w+)(\s|$)/) {
        my $name_old = $1;
        my $name_new = $2;
        push @lines_alias, "  \\let\\$name_new\\$name_old\n";
    }
}

close(IN);
close(OUT);

$found_map_beg or die "!!! Error: Definition for \\$cmd_map not found!\n";
$found_map_end or die "!!! Error: End of \\$cmd_map not found!\n";

$found_alias_beg or die "!!! Error: Definition for \\$cmd_alias not found!\n";
$found_alias_end or die "!!! Error: End of \\$cmd_alias not found!\n";

my $count_map = @lines_map;
print "* $count_map map entries found.\n";

my $count_alias = @lines_alias;
print "* $count_alias alias entries found.\n";

use Digest::MD5;

open(IN, '<', $file_org) or die "!!! Error: Cannot open `$file_org'!\n";
binmode(IN);
my $md5_org = Digest::MD5->new->addfile(*IN)->hexdigest;
close(IN);
print "* 0x$md5_org = md5($file_org)\n";

open(IN, '<', $file_tmp) or die "!!! Error: Cannot open `$file_tmp'!\n";
binmode(IN);
my $md5_tmp = Digest::MD5->new->addfile(*IN)->hexdigest;
close(IN);
print "* 0x$md5_tmp = md5($file_tmp)\n";

if ($md5_org eq $md5_tmp) {
    print "* Done, nothing to do.\n";
    exit(0);
}

unlink $file_bak if -f $file_bak;
rename $file_org, $file_bak or die "!!! Error: Moving `$file_org' to `$file_bak' failed!\n";
print "* $file_org -> $file_bak\n";
rename $file_tmp, $file_org or die "!!! Error: Moving `$file_tmp' to `$file_org' failed!\n";
print "* $file_tmp -> $file_org\n";

print "* Done.\n";

__END__
