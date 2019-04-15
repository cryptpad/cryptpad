#!/usr/bin/env ruby

load 'languages.rb'

# this file auto-generates loaders for hyphenation patterns - to be improved

$package_name="hyph-utf8"

# TODO - make this a bit less hard-coded
$path_tex_generic=File.expand_path("../../../tex/generic")
$path_TL=File.expand_path("../../../../TL")
$path_language_dat="#{$path_TL}/texmf-dist/tex/generic/config"
# hyphen-foo.tlpsrc for TeX Live
$path_tlpsrc="#{$path_TL}/tlpkg/tlpsrc"

$path_txt="#{$path_tex_generic}/#{$package_name}/patterns/txt"

$l = Languages.new
# TODO: should be singleton
languages = $l.list.sort{|a,b| a.name <=> b.name}

language_grouping = {
	'english' => ['en-gb', 'en-us'],
	'norwegian' => ['nb', 'nn'],
	'german' => ['de-1901', 'de-1996', 'de-ch-1901'],
	'mongolian' => ['mn-cyrl', 'mn-cyrl-x-lmc'],
	'greek' => ['el-monoton', 'el-polyton'],
	'ancientgreek' => ['grc', 'grc-x-ibycus'],
	'chinese' => ['zh-latn-pinyin'],
	'indic' => ['as', 'bn', 'gu', 'hi', 'kn', 'ml', 'mr', 'or', 'pa', 'ta', 'te'],
	'serbian' => ['sh-latn', 'sh-cyrl'],
	'latin' => ['la', 'la-x-classic'],
}

language_used_in_group = Hash.new
language_grouping.each_value do |group|
	group.each do |code|
		language_used_in_group[code] = true
	end
end

# a hash with language name as key and array of languages as the value
language_groups = Hash.new
# single languages first
languages.each do |language|
	# temporary remove cyrilic serbian until someone explains what is needed
	if language.code == 'sr-cyrl' or language.code == 'en-us' then
		# ignore the language
	elsif language_used_in_group[language.code] == nil then
		language_groups[language.name] = [language]
	end

	if language.code == 'sh-latn' then
		language.code = 'sr-latn'
	elsif language.code == 'sh-cyrl' then
		language.code = 'sr-cyrl'
	end
end

# then groups of languages
language_grouping.each do |name,group|
	language_groups[name] = []
	group.each do |code|
		language_groups[name].push($l[code])
	end
end

# languages.each do |language|
# 	if language.hyphenmin == nil then
# 		lmin = ''
# 		rmin = ''
# 	else
# 		lmin = language.hyphenmin[0]
# 		rmin = language.hyphenmin[1]
# 	end
# 	puts "#{language.name}: #{lmin} #{rmin}"
# end

#--------#
# TLPSRC #
#--------#
language_groups.sort.each do |language_name,language_list|
	$file_tlpsrc = File.open("#{$path_tlpsrc}/hyphen-#{language_name}.tlpsrc", 'w')
	puts "generating #{$path_tlpsrc}/hyphen-#{language_name}.tlpsrc"
	
	#$file_tlpsrc.puts "name hyphen-#{language_name}"
	$file_tlpsrc.puts "category TLCore"
	$file_tlpsrc.puts "depend hyphen-base"
	$file_tlpsrc.puts "depend hyph-utf8"

	# external dependencies for Russian and Ukrainian (until we implement the new functionality at least)
	if language_name == "russian" then
		$file_tlpsrc.puts "depend ruhyphen"
	elsif language_name == "ukrainian" then
		$file_tlpsrc.puts "depend ukrhyph"
	end
	language_list.each do |language|
		if language.description_s != nil then
			$file_tlpsrc.puts "shortdesc #{language.description_s}."
			$file_tlpsrc.puts "longdesc #{language.description_l.join("\nlongdesc ")}"
			# if language.version != nil then
			# 	$file_tlpsrc.puts "catalogue-version #{language.version}"
			# end
		end
		name = "name=#{language.name}"

		# synonyms
		if language.synonyms != nil and language.synonyms.length > 0 then
			synonyms=" synonyms=#{language.synonyms.join(',')}"
		else
			synonyms=""
		end
		# lefthyphenmin/righthyphenmin
		if language.hyphenmin == nil or language.hyphenmin.length == 0 then
			lmin = ''
			rmin = ''
		elsif language.filename_old_patterns == "zerohyph.tex" then
			lmin = ''
			rmin = ''
		else
			lmin = language.hyphenmin[0]
			rmin = language.hyphenmin[1]
		end
		hyphenmins = "lefthyphenmin=#{lmin} \\\n\trighthyphenmin=#{rmin}"
		# which file to use
		file = ""
		file_patterns = ""
		file_exceptions = ""
		if language.use_new_loader then
			file = "file=loadhyph-#{language.code}.tex"
			# we skip the mongolian language
			if language.code != "mn-cyrl-x-lmc" then
				if language.code == "sr-latn" or language.code == "sr-cyrl" then
					filename_pat = "hyph-sh-latn.pat.txt,hyph-sh-cyrl.pat.txt"
					filename_hyp = "hyph-sh-latn.hyp.txt,hyph-sh-cyrl.hyp.txt"
				else
					filename_pat = "hyph-#{language.code}.pat.txt"
					filename_hyp = "hyph-#{language.code}.hyp.txt"

					# check for existance of patterns and exceptions
					if !File::exists?( "#{$path_txt}/#{filename_pat}" ) then
						puts "some problem with #{$path_txt}/#{filename_pat}!!!"
					end
					if !File::exists?( "#{$path_txt}/#{filename_hyp}" ) then
						puts "some problem with #{$path_txt}/#{filename_hyp}!!!"
					end
				end

				file_patterns   = "file_patterns=#{filename_pat}"
				if File::size?( "#{$path_txt}/#{filename_hyp}" ) != nil then
					file_exceptions = "file_exceptions=#{filename_hyp}"
				# TODO: nasty workaround
				elsif language.code == "sr-latn" or language.code == "sr-cyrl" then
					file_exceptions = "file_exceptions=#{filename_hyp}"
				else
					file_exceptions = "file_exceptions="
					# puts ">   #{filename_hyp} is empty"
				end
			end
		else
			file = "file=#{language.filename_old_patterns}"
			if language.code == 'ar' or language.code == 'fa' then
				file = file + " \\\n\tfile_patterns="
			elsif language.code == 'grc-x-ibycus' then
				# TODO: fix this
				file = file + " \\\n\tluaspecial=\"disabled:8-bit only\""
			end
		end

		$file_tlpsrc.puts  "execute AddHyphen \\\n\t#{name}#{synonyms} \\"
		$file_tlpsrc.print "\t#{hyphenmins} \\\n\t#{file}"
		if file_patterns + file_exceptions != ""
			$file_tlpsrc.print " \\\n\t#{file_patterns} \\\n\t#{file_exceptions}"
		end
		if language.code == "mn-cyrl-x-lmc" then
			$file_tlpsrc.print " \\\n\tluaspecial=\"disabled:only for 8bit montex with lmc encoding\""
		end
		# end-of-line
		$file_tlpsrc.puts
	end
	if language_name != "russian" and language_name != "ukrainian" then
		$file_tlpsrc.puts
		language_list.each do |language|
			if language.use_old_patterns and language.filename_old_patterns != "zerohyph.tex" and language.filename_old_patterns != "copthyph.tex" then
				$file_tlpsrc.puts "runpattern f texmf-dist/tex/generic/hyphen/#{language.filename_old_patterns}"
			end
		end
	end
	if language_name == "greek" then
		$file_tlpsrc.puts
		$file_tlpsrc.puts "docpattern d texmf-dist/doc/generic/elhyphen"
	elsif language_name == "hungarian" then
		$file_tlpsrc.puts
		$file_tlpsrc.puts "docpattern d texmf-dist/doc/generic/huhyphen"
	elsif language_name == "german" then
		$file_tlpsrc.puts
		$file_tlpsrc.puts "runpattern f texmf-dist/tex/generic/hyphen/dehyphtex.tex"
		$file_tlpsrc.puts "runpattern f texmf-dist/tex/generic/hyphen/ghyphen.README"
	end
	$file_tlpsrc.close
end

#--------------#
# language.dat #
#--------------#
$file_language_dat = File.open("#{$path_language_dat}/language.dat", "w")
language_groups.sort.each do |language_name,language_list|
	language_list.each do |language|
		if language.use_new_loader then
			$file_language_dat.puts "#{language.name}\tloadhyph-#{language.code}.tex"
		else
			$file_language_dat.puts "#{language.name}\t#{language.filename_old_patterns}"
		end

		# synonyms
		if language.synonyms != nil then
			language.synonyms.each do |synonym|
				$file_language_dat.puts "=#{synonym}"
			end
		end
	end
end
$file_language_dat.close
