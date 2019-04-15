#!/usr/bin/env ruby
#
# This script generates hyphenation patterns for modern Turkish
#
# "Algorithm" originally developed by:
#
# /****************************************************************************
#  *                                                                          *
#  *          turk_hyf.c -- a program to produce PatGen-like hyphenation      *
#  *                        patterns for the Turkish Language.                *
#  *                                                                          *
#  *          Copyright 1987, by Pierre A. MacKay.                            *
#  *                                                                          *
#  *          Humanities and Arts Computing Center                            *
#  *          Mail-Stop DW-10                                                 *
#  *          University of Washington                                        *
#  *          Seattle, Washington 98105                                       *
#  *                                                                          *
#  ****************************************************************************/
#
# Script written in June 2008 by Mojca Miklavec
# as part of "Unicode Hyphenation Patterns" project
#
# Thanks to previous work, modifications and suggestions by:
# - H. Turgut Uyar <uyar at itu.edu.tr>
# - S. Ekin Kocabas <kocabas at stanford.edu>

# TODO: add a function to generate patterns for Ottoman Turkish

# open file for writing the patterns
$tr = File.new("hyph-tr.tex", "w")
# in TDS
$tr = File.new("../../../../../tex/generic/hyph-utf8/patterns/tex/hyph-tr.tex", "w")

# write comments into the file
def add_comment(str)
	$tr.puts "% " + str.gsub(/\n/, "\n% ").gsub(/% \n/, "%\n")
end

# The patterns (and algorithm for generating them) were first meant
# for supporting Ottoman Turkish, but adapted for modern Turkish later.
# Turkish alphabet includes some special vowels (ıiöü) and consonants (çğş),
# but the patterns also support another three vowels (âîû):
# - a with circumflex is a necessity, it must be supported
# - ı and u with circumflex could be there, not as pressing as "a" but still
# Some letters such as z, k, s or t represent multiple letters in the old
# alphabet, so some transcriptions from Ottoman to Turkish use some accents on
# these for phonetic reasons, but there is no need to support them.
# 
# Comment posted by: H. Turgut Uyar <uyar at itu.edu.tr>

# define a class of vowels and consonants
vowels = %w{a â e ı i î o ö u ü û}
consonants = %w{b c ç d f g ğ h j k l m n p r s ş t v y z}

# start the file
add_comment(
	"hyph-tr.tex\n\n" +
	"Turkish hyphenation patterns\n\n" +
	"This file is auto-generated from source/generic/hyph-utf8/languages/tr/generate_patterns_tr.rb that is part of hyph-utf8.\n" +
	"Please don't modify this file; modify the generating script instead.\n\n" +
	"Copyright (C) 1987 Pierre A. MacKay\n" +
	"              2008, 2011 TUG\n\n" +
	"This program can redistributed and/or modified under the terms\n" +
	"of the LaTeX Project Public License Distributed from CTAN\n" +
	"archives in directory macros/latex/base/lppl.txt; either\n" +
	"version 1 of the License, or (at your option) any later version.\n\n" +
	"Credits:\n" +
	"- algorithm developed by P. A. MacKay for the Ottoman Texts Project in 1987\n" +
	"- rules adapted for modern Turkish by H. Turgut Uyar <uyar at itu.edu.tr>\n" +
	"- initiative to improve Turkish patterns by S. Ekin Kocabas <kocabas at stanford.edu>\n" +
	"- script written by Mojca Miklavec <mojca.miklavec.lists at gmail.com> in June 2008\n\n" +
	"See also:\n" +
	"- http://mirror.ctan.org/language/turkish/hyphen/turk_hyf.c\n" +
	"- http://www.tug.org/TUGboat/Articles/tb09-1/tb20mackay.pdf\n\n" +
	"Differences with Ottoman patterns:\n" +
	"- adapted for the use on modern TeX engines, using UTF-8 charactes\n" +
	"- only letters for Modern Turkish + âîû (the first one often needed, the other two don't hurt)\n" +
	"- (if needed, support for Ottoman Turkish might be provided separately under language code 'ota')\n\n" +
	"Changes:\n" +
	"- 2008-06-25/27/28 - create this file by adapting Ottoman rules for modern Turkish\n" +
	"- 2011-08-10 - add LPPL licence with permission of Pierre A. MacKay\n"
)
$tr.puts '\patterns{'

# rules for hyphenation
add_comment("prohibit hyphen before vowels, allow after")
vowels.each do |vowel|
	$tr.puts "2#{vowel}1"
end

add_comment("allow hyphen either side of consonants")
consonants.each do |cons|
	$tr.puts "1#{cons}1"
end

add_comment("prevent e-cek at end of word")
$tr.puts "2e2cek."

add_comment("prohibit hyphen before pair of consonants\nmany pairs generated here are impossible anyway")
consonants.each do |c1|
	consonants.each do |c2|
		$tr.puts "2#{c1}#{c2}"
	end
end

add_comment("allow hyphen between vowels, but not after second vowel of pair\nseveral phonetically impossible pairs here")
vowels.each do |v1|
	vowels.each do |v2|
		$tr.puts "#{v1}3#{v2}2"
	end
end

add_comment("a couple of consonant-clusters")
$tr.puts 'tu4r4k'
$tr.puts 'm1t4rak'

# end the file
$tr.puts '}'
$tr.close
