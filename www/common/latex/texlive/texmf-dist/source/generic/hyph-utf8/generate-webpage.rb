#!/usr/bin/env ruby

load 'languages.rb'

# this file auto-generates loaders for hyphenation patterns - to be improved

$package_name="hyph-utf8"
$ctan_url = "http://mirror.ctan.org/language/hyph-utf8/tex/generic/hyph-utf8"

# TODO - make this a bit less hard-coded
$path_tex_generic="../../../tex/generic"

language_default = Language.new({
	"code"      => "(default)",
	"name"      => "english", "synonyms" => ["usenglish", "USenglish", "american"],
	"hyphenmin" => [2,3],
	"encoding"  => "ascii",
	"type"      => "dictionary",
	"authors"   => [ "donald_knuth" ],
	"licence"   => "",
})

$l = Languages.new
# add english to the list
$l["default"] = language_default
# TODO: should be singleton
languages = $l.list.sort{|a,b| a.name <=> b.name}

$a = Authors.new

language_grouping = {
	'english' => ['default', 'en-gb', 'en-us'],
	'latin' => ['la', 'la-x-classic'],
	'norwegian' => ['nb', 'nn'],
	'german' => ['de-1901', 'de-1996','de-ch-1901'],
	'mongolian' => ['mn-cyrl', 'mn-cyrl-x-lmc'],
	'greek' => ['el-monoton', 'el-polyton'],
	'ancientgreek' => ['grc', 'grc-x-ibycus'],
	'chinese' => ['zh-latn-pinyin'],
	# TODO - until someone tells what to do
	#'serbian' => ['sr-latn', 'sr-cyrl'],
	'serbian' => ['sh-latn', 'sh-cyrl'],
}

language_used_in_group = Hash.new
language_grouping.each_value do |group|
	group.each do |code|
		language_used_in_group[code] = true
	end
end

space_leading = "            "
space_tr      = "  "

# a hash with language name as key and array of languages as the value
language_groups = Hash.new
# single languages first
languages.each do |language|
	# temporary remove cyrilic serbian until someone explains what is needed
	if language.code == 'sr-cyrl' then
		languages.delete(language)
	elsif language_used_in_group[language.code] == nil then
		language_groups[language.name] = [language]
	end
end
# then groups of languages
language_grouping.each do |name,group|
	language_groups[name] = []
	group.each do |code|
		language_groups[name].push($l[code])
	end
end

language_groups.sort.each do |language_name,language_list|
	first_line_printed = false
	language_list.each do |language|
		if language != nil then
			puts "#{space_leading}<tr>"

			line_content = ""
			if not first_line_printed then
				line_content = "<b>#{language_name.capitalize}</b>"
				first_line_printed = true;
			else
				line_content = "&nbsp;"
			end
			puts "#{space_leading}#{space_tr}<td>#{line_content}</td>"
	
			# synonyms
			if language.synonyms != nil and language.synonyms.length > 0 then
				synonyms=", #{language.synonyms.join(', ')}"
			else
				synonyms=""
			end
			puts "#{space_leading}#{space_tr}<td>#{language.name}#{synonyms}</td>"
	
	#		if language.use_old_patterns == false then
			if language.use_new_loader == true then
				url_patterns = "#{$ctan_url}/patterns/tex/hyph-#{language.code}.tex"
				code = "<a href=\"#{url_patterns}\">#{language.code}</a>"
			else
				url_patterns = ""
				code = language.code
			end
			
			puts "#{space_leading}#{space_tr}<td>#{code}</td>"
	
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
			puts "#{space_leading}#{space_tr}<td>(#{lmin},#{rmin})</td>"
			# which file to use
			if language.use_new_loader then
				file = "loadhyph-#{language.code}.tex"
			else
				file = "#{language.filename_old_patterns}"
			end
			#puts "\t<td>#{file}</td>"
			if language.encoding == nil then
				encoding = ""
			else
				encoding = language.encoding.upcase
			end
			puts "#{space_leading}#{space_tr}<td>#{encoding}</td>"

			# licence
			licence = language.licence
			puts "#{space_leading}#{space_tr}<td>#{licence}</td>"

			authors = []
			if language.authors != nil then
				language.authors.each do |a|
					author = $a[a]
					if author != nil then
						authors.push("#{author.name} #{author.surname}")
					else
						puts "author is nil!!!"
					end
				end
			end
			puts "#{space_leading}#{space_tr}<td>#{authors.join('<br/>')}</td>"

			# finish the language definition
			puts "#{space_leading}</tr>\n"
		end
	end
end

