#!/usr/bin/env ruby
#
# First version:     97/02/20
#    
# This script generates TeX hyphenation patterns for Basque
# and was written by (c) Juan M. Aguirregabiria, 1997
# based on the shyphen.sh file by Julio Sanchez, which
# generates the hyphenation patterns for Spanish
# The copyright notice below applies to this script as well,
# read it before using this software.
#
# Rewritten into ruby by Mojca Miklavec <mojca.miklavec[.lists] at gmail.com>
# in June 2008. Modifications:
# - added support for Unicode
# - dropped support for every other "encoding"
# - added ñ by default
# - removed part of copyright that was not relevant any more
#   (actually, nothing here resembles the work for Spanish patterns in any way any more)
#
# open file for writing the patterns
# $file = File.new("hyph-eu.tex", "w")
# in TDS
$file = File.new("../../../../../tex/generic/hyph-utf8/patterns/tex/hyph-eu.tex", "w")

# write comments into the file
def add_comment(str)
	$file.puts "% " + str.gsub(/\n/, "\n% ").gsub(/% \n/, "%\n")
end

# h is not here.
consonants=%w{b c d f g j k l m n ñ p q r s t v w x y z}
# Open vowels: a e o
vop=%w{a e o}
# Closed vowels: i u
vcl=%w{i u}
#
# In June 2008 the following conversation took place.
# In case that anyone figures out how the situation might be improved ...
#
# Mojca:
#   Why do you need open and closed vewels separately?
# Juan:
#   Open and closed vowels are very different from the point of view of
#   hyphenation in Basque (and Spanish):
#   you may write "...e-o...", but not "...u-i..."
# Mojca:
#   But the script generates the same patterns for both sets of vowels.
# Juan:
#   After eleven years I don't remember *anything* about all this. Maybe I
#   intended to make a difference between open and closed vowels and then
#   thought it would be safer to avoid all breaking between vowels, because in
#   some cases a rule I don't remember now prevents some of them. Maybe some
#   legal breaks are ignored with current patterns, but a least I have never
#   seen an illegal hyphen and never get a report of such a break.
# 
#   I guess a couple of extra lines in the script don't hurt and maybe some day
#   someone will use the difference to allow more breaks.
#
vowels=[].concat(vop).concat(vcl)
# Groups that cannot be broken.
legal=%w{ll rr ts tx tz bl br dr fl fr gl gr kl kr pl pr tr}
#		echo -n Usage: `basename $0`
add_comment(
"Hyphenation patterns for Basque.

This file has first been written by Juan M. Aguirregabiria
(juanmari.aguirregabiria@ehu.es) on February 1997 based on the
shyphen.sh script that generates the Spanish patterns as compiled
by Julio Sanchez (jsanchez@gmv.es) on September 1991.

In June 2008 the generating script has been rewritten into ruby and
adapted for native UTF-8 TeX engines. Patterns became part of hyph-utf8
package and were renamed from bahyph.tex into hyph-eu.tex.
Functionality should not change apart from adding ñ by default.

The original Copyright followed and applied also to precessor of this file
whose last version will be always available by anonymous ftp
from tp.lc.ehu.es or by poynting your Web browser to
    http://tp.lc.ehu.es/jma/basque.html

For more information about the new UTF-8 hyphenation patterns and
links to this file see
    http://www.tug.org/tex-hyphen/

         COPYRIGHT NOTICE

These patterns and the generating script are Copyright (c) JMA 1997, 2008
These patterns are made public in the hope that they will benefit others.
You can use this software for any purpose.
However, this is given for free and WITHOUT ANY WARRANTY.

You are kindly requested to send any changes to the author.
If you change the generating script, you must include code
in it such that any output is clearly labeled as generated
by a modified script.

              END OF COPYRIGHT NOTICE

Open vowels: #{vop.join(" ")}
Closed vowels: #{vcl.join(" ")}
Consonants: #{consonants.join(" ")}

Some of the patterns below represent combinations that never
happen in Basque. Would they happen, they would be hyphenated
according to the rules.
")

$file.puts '\patterns{'

add_comment(
"Rule SR1
Vowels are kept together by the defaults
Rule SR2
Attach vowel groups to left consonant")
consonants.each do |consonant|
	patterns = []
	vowels.each do |vowel|
		patterns.push "1#{consonant}#{vowel}"
	end
	$file.puts patterns.join(" ")
end

add_comment(
"Rule SR3
Build legal consonant groups, leave other consonants bound to 
the previous group. This overrides part of the SR2 pattern group.")
legal.each do |pair|
	patterns = []
	vowels.each do |vowel|
		patterns.push "1#{pair[0,1]}2#{pair[1,1]}#{vowel}"
	end
	$file.puts patterns.join(" ")
end

add_comment("We now avoid some problematic breaks.")
$file.puts "su2b2r su2b2l"
$file.puts "}"
