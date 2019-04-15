#!/usr/bin/env ruby
#
# This script generates hyphenation patterns for Turkmen
#
# This script has been written by Mojca Miklavec <mojca dot miklavec dot lists at gmail dot com>

# open file for writing the patterns
# $tr = File.new("hyph-tk.tex", "w")
# in TDS
$tr = File.new("../../../../../tex/generic/hyph-utf8/patterns/tex/hyph-tk.tex", "w")

# write comments into the file
def add_comment(str)
	$tr.puts "% " + str.gsub(/\n/, "\n% ").gsub(/% \n/, "%\n")
end

# define a class of vowels and consonants
# vowels are split into so that unnecessary permutations are not generated
front_vowels = %w{ä e i ö ü}
back_vowels = %w{a y o u}
consonants = %w{b ç d f g h j k l m n p r s t w ý z ň ž ş}
# This is to eliminate impossible combinations
common_suffix_consonants = %w{b ç d g j k l m n p s t ý z ş}


# start the file
add_comment(
"Hyphenation patterns for Turkmen (hyph-tk.tex)

Author:  Nazar Annagurban <nazartm at gmail.com>
License: Public domain
Version: 0.1
Date:    16 March 2010

----------------------------------------------------------------------

The file has been auto-generated from generate_patterns_tk.rb
that is part of hyph-utf8.

For more information about UTF-8 hyphenation patterns for TeX and
links to this file see
    http://www.tug.org/tex-hyphen/
")

# we have the following comment for Basque:
#
# Some of the patterns below represent combinations that never
# happen in Turkmen. Would they happen, they would be hyphenated
# according to the rules.

$tr.puts '\patterns{'
add_comment("Some suffixes are added through a hyphen. When hyphenating these words, a hyphen is added before the hyphen so that the line ends with a hyphen and the new line starts with a hyphen.")
$tr.puts "1-4"

add_comment("Allow hyphen after a vowel if and only if there is a single consonant before next the vowel")
front_vowels.each do |v1|
	consonants.each do |c|
		front_vowels.each do |v2|
			$tr.puts "#{v1}1#{c}#{v2}"
		end
	end
end

back_vowels.each do |v1|
	consonants.each do |c|
		back_vowels.each do |v2|
			$tr.puts "#{v1}1#{c}#{v2}"
		end
	end
end

add_comment("These combinations occur in words of foreign origin or joined words")
consonants.each do |c|
  	$tr.puts "a1#{c}i"
  	$tr.puts "a1#{c}e"
	$tr.puts "y1#{c}ä"
	$tr.puts "y1#{c}i"
	$tr.puts "y1#{c}e"
	$tr.puts "o1#{c}i"
	$tr.puts "o1#{c}e"
	$tr.puts "u1#{c}i"
	$tr.puts "u1#{c}e"
	$tr.puts "i1#{c}a"
	$tr.puts "i1#{c}o"
	$tr.puts "e1#{c}a"
	$tr.puts "e1#{c}o"
	$tr.puts "ä1#{c}o"
	$tr.puts "ä1#{c}a"
	$tr.puts "ö1#{c}a"
end

add_comment("Allow hyphen between two consonants (if there is only two of them), except when they are at the begining of the word")
consonants.each do |c1|
	consonants.each do |c2|
		$tr.puts "#{c1}1#{c2}"
		$tr.puts ".#{c1}2#{c2}"
	end
end

add_comment("Patterns for triple consonants. There may be additions to this category, as this list is not exhaustive.")
common_suffix_consonants.each do |c|
	$tr.puts "ý2t1#{c}"
	$tr.puts "ý2n1#{c}"
	$tr.puts "ý2d1#{c}"
	$tr.puts "r2t1#{c}"
	$tr.puts "ý2p1#{c}"
	$tr.puts "l2p1#{c}"
	$tr.puts "l2t1#{c}"
	$tr.puts "g2t1#{c}"
	$tr.puts "n2t1#{c}"
	$tr.puts "r2k1#{c}"
	$tr.puts "r2p1#{c}"
	$tr.puts "k2t1#{c}"
	$tr.puts "r2h1#{c}"
	$tr.puts "s2t1#{c}"
	$tr.puts "l2k1#{c}"
	$tr.puts "w2p1#{c}"
	$tr.puts "n2s1#{c}"
	$tr.puts "r2s1#{c}"
	$tr.puts "l2m1#{c}"
end

add_comment("Exceptions and single word occurence patterns for words of foreign origin i.e. Russian")
$tr.puts "s2k1d"
$tr.puts "l1s2k"
$tr.puts "l1s2t"
$tr.puts "s1t2r"
$tr.puts "n2g1l"
$tr.puts "n1g2r"
$tr.puts "s2k1w"

# end the file
$tr.puts '}'
$tr.close

