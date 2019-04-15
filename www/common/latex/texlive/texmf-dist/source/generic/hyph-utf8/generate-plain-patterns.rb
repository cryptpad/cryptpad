#!/usr/bin/env ruby
# encoding: utf-8

# this file generates plain patterns (one-per-line) out of TeX source

# use 'gem install unicode' if unicode is missing on your computer
require 'unicode'

load 'languages.rb'

$path_root=File.expand_path("../../..")
$path_plain="#{$path_root}/tex/generic/hyph-utf8/patterns/txt"
$path_quote="#{$path_root}/tex/generic/hyph-utf8/patterns/quote"
$path_TL=File.expand_path("../../../../TL")
$path_language_dat_lua="#{$path_root}/tex/luatex/hyph-utf8/config"

$l = Languages.new
# TODO: should be singleton
languages = $l.list.sort{|a,b| a.name <=> b.name}

# TODO: we should rewrite this
# not using: eo, el
# todo: mn, no!, sa, sh
# codes = ['bg', 'ca', 'cs', 'cy', 'da', 'de-1901', 'de-1996', 'de-ch-1901', 'en-gb', 'en-us', 'es', 'et', 'eu', 'fi', 'fr', 'ga', 'gl', 'hr', 'hsb', 'hu', 'ia', 'id', 'is', 'it', 'kmr', 'la', 'lt', 'lv', 'nl', 'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sl', 'sr-cyrl', 'sv', 'tr', 'uk']

language_codes = Hash.new
languages.each do |language|
	language_codes[language.code] = language.code
end

language_codes['mn-cyrl-x-lmc'] = nil
# language_codes['sh-latn']       = nil
# language_codes['sh-cyrl']       = nil
# language_codes['sr-cyrl']       = nil

# $file_language_dat_lua = File.open("#{$path_language_dat_lua}/language.dat.lua", "w")
# $file_language_dat_lua.puts "return {\n"

languages.sort{|x,y| x.code <=> y.code }.each do |language|
	if language.use_new_loader or language.code == 'en-us' then
		include_language = true
	else
		include_language = false
		puts "(skipping #{language.code})"
	end

	code = language_codes[language.code]
	if code == nil
		include_language = false
	end
	if code == 'en_US'
		include_language = true
	end

	if include_language
		puts "generating #{code}"
	
		$file_pat = File.open("#{$path_plain}/hyph-#{code}.pat.txt", 'w')
		$file_hyp = File.open("#{$path_plain}/hyph-#{code}.hyp.txt", 'w')
		$file_let = File.open("#{$path_plain}/hyph-#{code}.chr.txt", 'w')
		$file_inf = File.open("#{$path_plain}/hyph-#{code}.lic.txt", 'w')

		patterns   = language.get_patterns
		exceptions = language.get_exceptions
		patterns_quote = Array.new

		if code == 'nn' or code == 'nb'
			patterns = ""
			patterns = $l['no'].get_patterns
		end

		characters_indexes = patterns.join('').gsub(/[.0-9]/,'').unpack('U*').sort.uniq

		# patterns
		patterns.each do |pattern|
			$file_pat.puts pattern
			if pattern =~ /'/ then
				if code != "grc" and code != "el-monoton" and code != "el-polyton" then
					pattern_with_quote = pattern.gsub(/'/,"’")
					$file_pat.puts pattern_with_quote
					patterns_quote.push(pattern_with_quote)
				end
			end
		end
		# exceptions
		if exceptions != ""
			$file_hyp.puts exceptions
		end
		# letters
		characters_indexes.each do |c|
			ch = [c].pack('U')
			$file_let.puts ch + Unicode.upcase(ch)
			if ch == "'" and code != "grc" and code != "el-monoton" and code != "el-polyton" then
				$file_let.puts "’’"
			end
		end
		# licence and readme
		$file_inf.puts "#{language.message}\n\n(more info about the licence to be added later)\n\n"
		$file_inf.puts language.get_comments_and_licence

		$file_pat.close
		$file_hyp.close
		$file_let.close
		$file_inf.close

		if patterns_quote.length > 0
			f = File.open("#{$path_quote}/hyph-quote-#{code}.tex", 'w')
			f.puts "\\bgroup\n\\lccode`\\’=`\\’\n\\patterns{\n#{patterns_quote.join("\n")}\n}\n\\egroup\n"
			f.close
		end

		# $file_language_dat_lua.puts "\t[\"#{language.name}\"]={"
		# $file_language_dat_lua.puts "\t\tloader=\"loadhyph-#{language.code}.tex\","
		# $file_language_dat_lua.puts "\t\tcode=\"#{code}\","
		# if language.hyphenmin == nil or language.hyphenmin.length == 0 then
		# 	lmin = ''
		# 	rmin = ''
		# else
		# 	lmin = language.hyphenmin[0]
		# 	rmin = language.hyphenmin[1]
		# end
		# $file_language_dat_lua.puts "\t\tlefthyphenmin=#{lmin},"
		# $file_language_dat_lua.puts "\t\trighthyphenmin=#{rmin},"
		# if language.synonyms.length > 0
		# 	$file_language_dat_lua.puts "\t\tsynonyms={\"#{language.synonyms.join('","')}\"},"
		# else
		# 	$file_language_dat_lua.puts "\t\tsynonyms={},"
		# end
		# $file_language_dat_lua.puts "\t},\n"
	end
end

# $file_language_dat_lua.puts "}\n"

# $file_language_dat_lua.close
