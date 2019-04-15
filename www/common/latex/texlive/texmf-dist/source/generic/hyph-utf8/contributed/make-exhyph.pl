#!/usr/bin/perl
# -*- coding: utf-8; -*-
# Copyright (C) 2008 Vladimir Volovich.
# You may freely use, modify and/or distribute this file.
#
# Generate additional patterns (for some language), to be used in case
# there is an alternative hyphen character available.
#
# It enables the hyphenation of words containing explicit hyphens
# when using fonts with \hyphenchar\font <> `\- (e.g. T1 or T2A encoding).
#
# sample usage: perl make-exhyph.pl ru > exhyph-ru.tex

use strict;
use utf8;
binmode(STDOUT, ":utf8");

my %alphabet = (
  'ru' => [ qw( а б в г д е ё ж з и й к л м н о п р с т у ф х ц ч ш щ ъ ы ь э ю я ) ],
  'uk' => [ qw( а б в г ґ д е є ж з и і ї й к л м н о п р с т у ф х ц ч ш щ ь ю я ' ) ]
);

my $lang = $ARGV[0];
die "unspecified lang" if ! defined $lang;
die "invalid lang" if ! exists $alphabet{$lang};

my @alphabet = @{$alphabet{$lang}};

print <<\EOF;
\begingroup
\lccode45=45 % Make hyphen "-" a word constituent
\patterns{
8-7
--8
EOF

for my $l (@alphabet) {
  print ".${l}-8\n";
}

for my $l1 (@alphabet) {
  for my $l2 (@alphabet) {
    print "-${l1}8${l2}8\n8${l1}8${l2}-\n";
  }
}

print <<\EOF;
}
\endgroup
EOF
