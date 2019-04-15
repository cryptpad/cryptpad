# -*- coding: utf-8 -*-

class Author
	def initialize(name,surname,email,contacted1,contacted2)
		@name       = name
		@surname    = surname
		@email      = email
		# this mostly means if email has been recently checked
		@contacted1 = contacted1
		# this means if we made more cooperation with author,
		# exchanging patches etc.
		@contacted2 = contacted2
	end

	attr_reader :name, :surname, :email
end

class Language
	def initialize(language_hash)
		@use_new_loader = language_hash["use_new_loader"]
		@use_old_patterns = language_hash["use_old_patterns"]
		@use_old_patterns_comment = language_hash["use_old_patterns_comment"]
		@filename_old_patterns = language_hash["filename_old_patterns"]
		@filename_old_patterns_other = language_hash["filename_old_patterns_other"]
		@code = language_hash["code"]
		@name = language_hash["name"]
		@synonyms = language_hash["synonyms"] 
		@hyphenmin = language_hash["hyphenmin"]
		@encoding = language_hash["encoding"]
		@exceptions = language_hash["exceptions"]
		@message = language_hash["message"]

		@description_s = language_hash["description_s"]
		@description_l = language_hash["description_l"]
		@version       = language_hash["version"]

		@licence = language_hash["licence"]
		@authors = language_hash["authors"]

		if @synonyms==nil then @synonyms = [] end
	end

	# TODO: simplify this (reduce duplication)

	def get_exceptions
		if @exceptions1 == nil
			filename = "../../../tex/generic/hyph-utf8/patterns/tex/hyph-#{@code}.tex";
			lines = IO.readlines(filename, '.').join("")
			exceptions = lines.gsub(/%.*/,'');
			if (exceptions.index('\hyphenation') != nil)
				@exceptions1 = exceptions.gsub(/.*\\hyphenation\s*\{(.*?)\}.*/m,'\1').
					gsub(/\s+/m,"\n").
					gsub(/^\s*/m,'').
					gsub(/\s*$/m,'').
					split("\n")
			else
				@exceptions1 = ""
			end
		end

		return @exceptions1
	end

	def get_patterns
		if @patterns == nil
			filename = "../../../tex/generic/hyph-utf8/patterns/tex/hyph-#{@code}.tex"
			lines = IO.readlines(filename, '.').join("")
			@patterns = lines.gsub(/%.*/,'').
				gsub(/.*\\patterns\s*\{(.*?)\}.*/m,'\1').
				gsub(/\s+/m,"\n").
				gsub(/^\s*/m,'').
				gsub(/\s*$/m,'').
				split("\n")

			if @code == 'eo' then
				@patterns = lines.gsub(/%.*/,'').
					gsub(/.*\\patterns\s*\{(.*)\}.*/m,'\1').
					#
					gsub(/\\adj\{(.*?)\}/m,'\1a. \1aj. \1ajn. \1an. \1e.').
					gsub(/\\nom\{(.*?)\}/m,'\1a. \1aj. \1ajn. \1an. \1e. \1o. \1oj. \1ojn. \1on.').
					gsub(/\\ver\{(.*?)\}/m,'\1as. \1i. \1is. \1os. \1u. \1us.').
					#
					gsub(/\s+/m,"\n").
					gsub(/^\s*/m,'').
					gsub(/\s*$/m,'').
					split("\n")
			end
		end
		return @patterns
	end

	def get_comments_and_licence
		if @comments_and_licence == nil then
			filename = File.expand_path("../../../tex/generic/hyph-utf8/patterns/tex/hyph-#{@code}.tex");
			lines = IO.readlines(filename, '.').join("")
			@comments_and_licence = lines.
				gsub(/(.*)\\patterns.*/m,'\1')
		end
		return @comments_and_licence
	end

	# def lc_characters
	# 	if @lc_characters == nil
	# 		lc_characters = Hash.new
	# 		p = self.patterns
	# 		p.each do |pattern|
	# 		end
	# 	end
	# 	return @lc_characters
	# end

	attr_reader :use_new_loader, :use_old_patterns, :use_old_patterns_comment, :filename_old_patterns
	attr_reader :code, :name, :synonyms, :hyphenmin, :encoding, :exceptions, :message
	attr_reader :description_s, :description_l, :version
	attr_reader :licence, :authors
	# this hack is needed for Serbian
	attr_writer :code
end

class Authors < Hash
	@@list = []
	
	def initialize
		authors = {
#authors = {
	"donald_knuth"        => ["Donald", "Knuth", nil, false, false],
	"peter_heslin"        => ["Peter", "Heslin", nil, false, false],
	"dimitrios_filippou"  => ["Dimitrios", "Filippou", "dimitrios{dot}filippou{at}riotinto{dot}com", true, true],
	"claudio_beccari"     => ["Claudio", "Beccari","claudio{dot}beccari{at}gmail{dot}com", true, true],
	"juan_aguirregabiria" => ["Juan M.", "Aguirregabiria", "juanmari{dot}aguirregabiria{at}ehu.es", true, true],
	"igor_marinovic"      => ["Igor", "Marinović", "marinowski{at}gmail.com", true, true],
	"tilla_fick"          => ["Tilla", "Fick", "fick{dot}tilla{at}gmail{dot}com", true, true],
	"chris_swanepoel"     => ["Chris", "Swanepoel", "cj{at}swanepoel{dot}net", true, true],
	"matjaz_vrecko"       => ["Matjaž", "Vrečko", "matjaz{at}mg-soft{dot}si", true, true],
	"goncal_badenes"      => ["Gonçal", "Badenes", "g{dot}badenes{at}ieee.org", false, false],
	"pavel_sevecek"       => ["Pavel", "Ševeček", "pavel{at}lingea{dot}cz", false, false],
	# email doesn't work
	"jana_chlebikova"     => ["Jana", "Chlebíková", "chlebikj{at}dcs{dot}fmph{dot}uniba{dot}sk", false, false],
	"yannis_haralambous"  => ["Yannis", "Haralambous", "yannis{dot}haralambous{at}telecom-bretagne{dot}eu", true, false],
	"frank_jensen"        => ["Frank", "Jensen", "frank{dot}jensen{at}hugin{dot}com", true, true],
	"sergei_pokrovsky"    => ["Sergei", "Pokrovsky", "sergio{dot}pokrovskij{at}gmail{dot}com", true, true],
	"javier_bezos"        => ["Javier", "Bezos", "jbezos{at}tex-tipografia{dot}com", true, true],
	"een_saar"            => ["Enn", "Saar", "saar{at}aai{dot}ee", false, false],
	"dejan_muhamedagic"   => ["Dejan", "Muhamedagić", "dejan{at}hello-penguin{dot}com", true, true],
	"brian_wilson"        => ["Brian", "Wilson", "bountonw{at}gmail{dot}com", true, true],
	"arthur_reutenauer"   => ["Arthur", "Reutenauer", "arthur{dot}reutenauer{at}normalesup{dot}org", true, true],
	"mojca_miklavec"      => ["Mojca", "Miklavec", "mojca{dot}miklavec{dot}lists{at}gmail{dot}com", true, true],
	"santhosh_thottingal" => ["Santhosh", "Thottingal", "santhosh{dot}thottingal{at}gmail{dot}com>", true, true],
	# email doesn't work
	"yves_codet"          => ["Yves", "Codet", "ycodet{at}club-internet{dot}fr", true, true],
	"rune_kleveland"      => ["Rune", "Kleveland", nil, false, false],
	# email doesn't work
	"ole_michael_selberg" => ["Ole Michael", "Selberg", "o{dot}m{dot}selberg{at}c2i{dot}net", true, true],
	"dorjgotov_batmunkh"  => ["Dorjgotov", "Batmunkh", "bataak{at}gmail{dot}com", true, true],
	"nazar_annagurban"    => ["Nazar", "Annagurban", "nazartm{at}gmail{dot}com", false, false],
	"jan_michael_rynning" => ["Jan Michael", "Rynning", nil, false, false],
	"eduard_werner"       => ["Eduard", "Werner", "edi{dot}werner{at}gmx{dot}de", false, false],
	"werner_lemberg"      => ["Werner", "Lemberg", "wl{at}gnu{dot}org", true, true],
	# email doesn't work
	"pedro_j_de_rezende"  => ["Pedro J.", "de Rezende", "rezende{at}ddc{dot}unicamp{dot}br", false, false],
	"j_joao_dias_almeida" => ["J. Joao", "Dias Almeida", "jj{at}di{dot}uminho{dot}pt"],
	# email doesn't work
	"piet_tutelaers"      => ["Piet", "Tutelaers", "p{dot}t{dot}h{dot}tutelaers{at}tue{dot}nl", false, false],
	"vytas_statulevicius" => ["Vytas", "Statulevičius", "vytas{at}vtex{dot}nl", false, false],
	"sigitas_tolusis"     => ["Sigitas", "Tolušis", "sigitas{at}vtex{dot}lt", false, false],
	"janis_vilims"        => ["Janis", "Vilims", "jvilims{at}apollo{dot}lv", false, false],
	"joerg_knappen"       => ["Jörg", "Knappen", "jknappen{at}web{dot}de", true, true],
	"medeni_shemde"        => ["Medeni", "Shemdê", nil, false, false],
	"terry_mart"          => ["Terry", "Mart", "mart{at}kph{dot}uni-mainz{dot}de", false, false],
	# email doesn't work
	"jorgen_pind"         => ["Jorgen", "Pind", "jorgen{at}lexis{dot}hi{dot}is", false, false],
	"marteinn_sverrisson" => ["Marteinn", "Sverrisson", nil, false, false],
	# email doesn't work
	"kristinn_gylfason"   => ["Kristinn", "Gylfason", "kristgy{at}ieee{dot}org", false, false],
	# email doesn't work
	"kevin_p_scannell"    => ["Kevin P.", "Scannell", "scanell{at}slu{dot}edu", false, false],
	# email doesn't work
	"peter_kleiweg"       => ["Peter", "Kleiweg", "p{dot}c{dot}c{dot}kleiweg{at}rug{dot}nl", false, false],
	"hanna_kolodziejska"  => ["Hanna", "Kołodziejska", nil, false, false],
	"boguslaw_jackowski"  => ["Bogusław", "Jackowski", nil, true, true],
	"marek_rycko"         => ["Marek", "Ryćko", nil, false, false],
	"vladimir_volovich"   => ["Vladimir", "Volovich", nil, true, true], # TODO add e-mail address
	"alexander_i_lebedev" => ["Alexander I.", "Lebedev", "swan{at}scon155{dot}phys{dot}msu{dot}su", false, false], # Not sure were 'I' belongs
	# first email doesn't work
	"maksym_polyakov"     => ["Maksym", "Polyakov", "polyama{at}auburn{dot}edu", false, false], # Second e-mail address in ukrhypmp.tex: mpoliak@i.com.ua
	"adrian_rezus"        => ["Adrian", "Rezus", "adriaan{at}\{sci,cs\}{dot}kun{dot}nl", false, false],
	# email doesn't work
	"sahak_petrosyan"     => ["Sahak", "Petrosyan", "sahak{at}mit{dot}edu", true, true], # I think "true, true" is right.  Arthur
	"dominik_wujastyk"    => ["Dominik", "Wujastyk", "wujastyk{at}gmail{dot}com", false, false],
	"graham_toal"         => ["Graham", "Toal", nil, false, false],
	"donald_e_knuth"      => ["Donald E.", "Knuth", nil, false, false], # Don doesn't use e-mail ;-)
	"gerard_d_c_kuiken"   => ["Gerard D.C.", "Kuiken", nil, false, false],
	"pierre_mackay"       => ["P. A.", "MacKay", nil, true, true],
	"h_turgut_uyar"       => ["H. Turgut", "Uyar", "uyar{at}itu{dot}edu{tr}", true, true],
	# email doesn't work
	"s_ekin_kocabas"      => ["S. Ekin", "Kocabas", "kocabas{at}stanford{dot}edu", true, true],
	"bence_nagy"          => ["Bence", "Nagy", "nagybence{at}tipogral{dot}hu", true, true],
	"kauko_saarinen"      => ["Kauko", "Saarinen", nil, false, false],
	"fred_karlsson"       => ["Fred", "Karlsson", nil, false, false],
	"rene_bastian"        => ["René", "Bastian", nil, false, false], # TODO make contact
	"daniel_flipo"        => ["Daniel", "Flipo", nil, false, false], # TODO make contact
	"bernard_gaulle"      => ["Bernard", "Gaulle", nil, false, false], # Deceased...
	"theppitak_karoonboonyanan" => ["Theppitak", "Karoonboonyanan", "theppitak{at}gmail{dot}com", true, true],
	"levan_shoshiashvili" => ["Levan", "Shoshiashvili", "shoshia{at}hotmail{dot}com", true, true],
	# email doesn't work
	"javier_mugica"       => ["Javier", "Múgica", "javier{at}digi21{dot}eu", true, true],
	"georgi_boshnakov"    => ["Georgi", "Boshnakov", "georgi{dot}boshnakov{at}manchester{dot}ac{dot}uk", true, true],
}
#
		authors.each do |a|
			author = Author.new(a[1][0], a[1][1], a[1][2], a[1][3], a[1][4])
			@@list.push(author)
			self[a[0]] = author
		end
	end
end


# "use_new_loader"
# => true - create a new file and use that one
# => false - use "filename_old_patterns" in language.dat
# "filename_old_patterns"
# => [string] - the name used in language.dat if "use_new_loader" is false
# "eightbitfilename"
# => [string] - if set, load another file for 8-bit engines
# "code"
# => [string] - used in filenames, needs to conform to the standard
# "name"
# => [string] -
# "synonyms" => [],
# "hyphenmin" => [],
# "encoding" => nil,
# "exceptions" => false,
# "message" => nil,

class Languages < Hash
	@@list = []
	
	def initialize
		languages = [
# --------------------------------------
# languages with no hyphenation patterns
# --------------------------------------
# arabic
{
	"code" => "ar",
	"name" => "arabic",
	"use_new_loader" => false,
	"use_old_patterns" => false,
	"filename_old_patterns" => "zerohyph.tex",
#	"hyphenmin" => [], # not needed
	"encoding" => nil,
	"exceptions" => false,
	"message" => nil,

	# TODO
	"description_s" => "(No) Arabic hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Prevent hyphenation in Arabic.",
	],
},
# farsi
# =persian
{
	"code" => "fa",
	"name" => "farsi", "synonyms" => ["persian"],
	"use_new_loader" => false,
	"use_old_patterns" => false,
	"filename_old_patterns" => "zerohyph.tex",
#	"hyphenmin" => [], # not needed
	"encoding" => nil,
	"exceptions" => false,
	"message" => nil,

	# TODO
	"description_s" => "(No) Persian hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Prevent hyphenation in Persian.",
	],
},
# -------------------------------
# special patterns, not converted
# -------------------------------
# ibycus ibyhyph.tex
{
	"code" => "grc-x-ibycus",
	"name" => "ibycus",
	"use_new_loader" => false,
	"use_old_patterns" => true,
	"filename_old_patterns" => "ibyhyph.tex",
	"hyphenmin" => [2,2],
	"encoding" => nil,
	"exceptions" => false,
	"message" => "Ancient Greek hyphenation patterns for Ibycus encoding (v3.0)",
	
	# "authors" => ["peter_heslin"],
	"version" => 3.0,
},
# ----------------------------
# languages using old patterns
# ----------------------------
# greek
# =polygreek
{
	"code" => "el-polyton",
	"name" => "greek", "synonyms" => ["polygreek"],
	"use_new_loader" => true,
	"use_old_patterns" => true,
	"use_old_patterns_comment" => "Old patterns work in a different way, one-to-one conversion from UTF-8 is not possible.",
	"filename_old_patterns" => "grphyph5.tex",
	# left/right hyphen min for Greek can be as low as one (1),
	# but for aesthetic reasons keep them at 2/2.
	# Dimitrios Filippou
	"hyphenmin" => [1,1], # polyglossia
	"encoding" => nil,
	"exceptions" => true,
	"message" => "Hyphenation patterns for multi-accent (polytonic) Modern Greek",

	"version"       => "5.0",
	"last_modified" => "2008-06-06",
	"type"          => "rules",
	"authors"       => ["dimitrios_filippou"],
	"licence"       => "LPPL",
	# "description_s" => "Polytonic Modern Greek hyphenation patterns",
	# #                  #.....................................................................#
	# "description_l" => [
	# 	#......................................................................#
	# 	"Hyphenation patterns for Modern Greek in polytonic spelling.",
	# 	"The pattern file used for 8-bit engines is grphyph5.tex that is",
	# 	"not part of hyph-utf8. Patterns in UTF-8 use two code positions for",
	# 	"each of the vowels with acute accent (a.k.a tonos, oxia), e.g.,",
	# 	"U+03AC, U+1F71 for alpha.",
	# ],
},
# monogreek
{
	"code" => "el-monoton",
	"name" => "monogreek",
	"use_new_loader" => true,
	"use_old_patterns" => true,
	"use_old_patterns_comment" => "Old patterns work in a different way, one-to-one conversion from UTF-8 is not possible.",
	"filename_old_patterns" => "grmhyph5.tex",
	"hyphenmin" => [1,1], # polyglossia
	"encoding" => nil,
	"exceptions" => true,
	"message" => "Hyphenation patterns for uni-accent (monotonic) Modern Greek",

	"version"       => "5.0",
	"last_modified" => "2008-06-06",
	"type"          => "rules",
	"authors"       => ["dimitrios_filippou"],
	"licence"       => "LPPL",
	# "description_s" => "Monotonic Modern Greek hyphenation patterns",
	# "description_l" => [
	# 	#......................................................................#
	# 	"Hyphenation patterns for Modern Greek in monotonic spelling.",
	# 	"The pattern file used for 8-bit engines is grmhyph5.tex, in Babel's LGR encoding,",
	# 	"that is not part of hyph-utf8.",
	# 	"Patterns in UTF-8 use two code positions for each of the vowels with acute accent",
	# 	"(a.k.a tonos, oxia), e.g., U+03AD, U+1F73 for epsilon.",
	# ],
	"description_s" => "Modern Greek hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Modern Greek in monotonic and polytonic",
		"spelling in LGR and UTF-8 encodings.  Patterns in UTF-8 use two code",
		"positions for each of the vowels with acute accent (a.k.a tonos,",
		"oxia), e.g., U+03AC, U+1F71 for alpha.",
	],
},
# ancientgreek
{
	"code" => "grc",
	"name" => "ancientgreek",
	"use_new_loader" => true,
	"use_old_patterns" => true,
	"use_old_patterns_comment" => "Old patterns work in a different way, one-to-one conversion from UTF-8 is not possible.",
	"filename_old_patterns" => "grahyph5.tex",
	"hyphenmin" => [1,1], # polyglossia
	"encoding" => nil,
	"exceptions" => false,
	"message" => "Hyphenation patterns for Ancient Greek",

	"version"       => "5.0",
	"last_modified" => "2008-06-06",
	"type"          => "rules",
	"authors"       => ["dimitrios_filippou"],
	"licence"       => "LPPL",
	# "description_s" => "Ancient Greek hyphenation patterns",
	# "description_l" => [
	# 	#......................................................................#
	# 	"Hyphenation patterns for Ancient Greek.",
	# 	"The pattern file used for 8-bit engines is grahyph5.tex, in Babel's LGR encoding,",
	# 	"that is not part of hyph-utf8.",
	# 	"Patterns in UTF-8 use two code positions for each of the vowels with acute accent",
	# 	"(a.k.a tonos, oxia), e.g., U+03AE, U+1F75 for eta.",
	# ],
	"description_s" => "Ancient Greek hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Ancient Greek in LGR and UTF-8 encodings,",
		"including support for (obsolete) Ibycus font encoding.",
		"Patterns in UTF-8 use two code positions for each of the vowels with",
		"acute accent (a.k.a tonos, oxia), e.g., U+03AE, U+1F75 for eta.",
	],
},
# coptic
{
	"code" => "cop",
	"name" => "coptic",
	"use_new_loader" => true,
	"use_old_patterns" => true,
	"use_old_patterns_comment" => "TODO: automatic conversion could be done, but was too complicated; leave for later.",
	"filename_old_patterns" => "copthyph.tex",
	"hyphenmin" => [1,1], # polyglossia TODO: no documentation found
	"encoding" => nil,
	"exceptions" => false,
	"message" => "Coptic hyphenation patterns",

	"version"       => nil,
	"last_modified" => "2004-10-03",
	"type"          => "rules",
	"authors"       => [ "claudio_beccari" ],
	"licence"       => "LPPL",
	"description_s" => "Coptic hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Coptic in UTF-8 encoding",
		"as well as in ASCII-based encoding for 8-bit engines.",
		"The latter can only be used with special Coptic fonts (like CBcoptic).",
		"The patterns are considered experimental.",
	],
},
# german
{
	"code" => "de-1901",
	"name" => "german",
	"use_new_loader" => true,
	"use_old_patterns" => true,
	"use_old_patterns_comment" => "Kept for the sake of backward compatibility, but newer and better patterns by WL are available.",
	"filename_old_patterns" => "dehypht.tex",
	"hyphenmin" => [2,2], # babel
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "German hyphenation patterns (traditional orthography)",

	"version"       => "0.40",
	"last_modified" => "2014-05-21", # For the active project
	"type"          => "dictionary",
	"authors"       => ["werner_lemberg"],
	"licence"       => "LPPL",
	# "description_s" => "German hyphenation patterns in traditional spelling",
	# "description_l" => [
	# 	"Hyphenation patterns for German in traditional spelling, in T1/EC and UTF-8 encoding.",
	# 	"Patterns encoded in UTF-8 are provided by a separate package.",
	# ],

	"description_s" => "German hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for German in T1/EC and UTF-8 encodings,",
		"for traditional and reformed spelling, including Swiss German.",
		"The package includes the latest patterns from dehyph-exptl",
		"(known to TeX under names 'german', 'ngerman' and 'swissgerman'),",
		"however 8-bit engines still load old versions of patterns",
		"for 'german' and 'ngerman' for backward-compatibility reasons.",
		"Swiss German patterns are suitable for Swiss Standard German",
		"(Hochdeutsch) not the Alemannic dialects spoken in Switzerland",
		"(Schwyzerduetsch).",
		"There are no known patterns for written Schwyzerduetsch.",
	]
},
# ngerman
{
	"code" => "de-1996",
	"name" => "ngerman",
	"use_new_loader" => true,
	"use_old_patterns" => true,
	"use_old_patterns_comment" => "Kept for the sake of backward compatibility, but newer and better patterns by WL are available.",
	"filename_old_patterns" => "dehyphn.tex",
	"hyphenmin" => [2,2], # babel
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "German hyphenation patterns (reformed orthography)",

	"version"       => "0.40",
	"last_modified" => "2014-05-21", # For the active project
	"type"          => "dictionary",
	"authors"       => ["werner_lemberg"],
	"licence"       => "LPPL",
	# "description_s" => "German hyphenation patterns in reformed spelling",
	# "description_l" => [
	# 	"Hyphenation patterns for German in reformed spelling, in T1/EC and UTF-8 encoding.",
	# 	"Patterns encoded in UTF-8 are provided by a separate package.",
	# ],
},
# swissgerman
{
	"code" => "de-ch-1901",
	"name" => "swissgerman",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"hyphenmin" => [2,2], # babel
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "Swiss-German hyphenation patterns (traditional orthography)",

	"version"       => "0.40",
	"last_modified" => "2014-05-21", # For the active project
	"type"          => "dictionary",
	"authors"       => ["werner_lemberg"],
	"licence"       => "LPPL",
	# "description_l" => "German hyphenation patterns, traditional spelling in Switzerland.",
	# "description_s" => [
	# 	"Hyphenation patterns for German in traditional spelling as used in Switzerland, in T1/EC and UTF-8.",
	# 	"These patterns are suitable for Standard German (Hochdeutsch), not the Alemannic dialects",
	# 	"spoken in Switzerland (Schwyzerdütsch).  There are no patterns for written Schwyzerdütsch",
	# 	"we know of.",
	# ],
},
# russian
{
	"code" => "ru",
	"name" => "russian",
	"use_new_loader" => true,
	"use_old_patterns" => true,
	"use_old_patterns_comment" => "The old system allows choosing patterns and encodings manually. That mechanism needs to be implemented first in this package, so we still fall back on old system.",
	"filename_old_patterns" => "ruhyphen.tex",
	"hyphenmin" => [2,2],
	"encoding" => "t2a",
	"exceptions" => false,
	"message" => "Russian hyphenation patterns",

	"version"       => nil,
	"last_modified" => "2003-03-10", # Date of the patterns proper, not the support files
	"type"          => "dictionary",
	"authors"       => ["alexander_i_lebedev", "werner_lemberg", "vladimir_volovich"],
	"licence"       => "LPPL",
	"description_s" => "Russian hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Russian in T2A and UTF-8 encodings.",
		"For 8-bit engines, the 'ruhyphen' package provides a number of",
		"different pattern sets, as well as different (8-bit) encodings, that",
		"can be chosen at format-generation time.  The UTF-8 version only",
		"provides the default pattern set.  A mechanism similar to the one used",
		"for 8-bit patterns may be implemented in the future.",
	],
},
# ukrainian
{
	"code" => "uk",
	"name" => "ukrainian",
	"use_new_loader" => true,
	"use_old_patterns" => true,
	"use_old_patterns_comment" => "The old system allows choosing patterns and encodings manually. That mechanism needs to be implemented first in this package, so we still fall back on old system.",
	"filename_old_patterns" => "ukrhyph.tex",
	"hyphenmin" => [2,2],
	"encoding" => "t2a",
	"exceptions" => false,
	"message" => "Ukrainian hyphenation patterns",

	"version"       => nil,
	"last_modified" => "2001-05-10", # Date of the patterns proper
	# "type"          => "rules", # TODO: it is not really clear
	"authors"       => ["maksym_polyakov", "werner_lemberg", "vladimir_volovich"],
	"licence"       => "LPPL",
	"description_s" => "Ukrainian hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Ukrainian in T2A and UTF-8 encodings.",
		"For 8-bit engines, the 'ukrhyph' package provides a number of",
		"different pattern sets, as well as different (8-bit) encodings, that",
		"can be chosen at format-generation time.  The UTF-8 version only",
		"provides the default pattern set.  A mechanism similar to the one used",
		"for 8-bit patterns may be implemented in the future.",
	],
},
# ----------------------------
# languages using new patterns
# ----------------------------
# afrikaans
{
	"code" => "af",
	"name" => "afrikaans",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => nil,
	"hyphenmin" => [1,2], # in babel: 2,2
	"encoding" => "ec",
	"exceptions" => true,
	"message" => "Afrikaans hyphenation patterns",

	"version"       => "1.0",
	"last_modified" => "2013-10-08",
	"type"          => "dictionary",
	"authors"       => [ "tilla_fick", "chris_swanepoel" ],
	"email"         => [ "hyphen{at}rekenaar{dot}net" ],
	"licence"       => "LPPL",
	"description_s" => "Afrikaans hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Afrikaans in T1/EC and UTF-8 encodings.",
		"OpenOffice includes older patterns created by a different author,",
		"but the patterns packaged with TeX are considered superior in quality.",
		# "Word list used to generate patterns with opatgen might be released in future.",
	],
},
# catalan
{
	"code" => "ca",
	"name" => "catalan",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "cahyph.tex",
	"hyphenmin" => [2,2], # babel
	"encoding" => "ec",
	"exceptions" => true,
	"message" => "Catalan hyphenation patterns",

	"version"       => "1.11",
	"last_modified" => "2003-07-15",
	"type"          => "rules", # not only rules, also patgen, but it is a good approximation
	"authors"       => [ "goncal_badenes" ],
	"licence"       => "LPPL",
	"description_s" => "Catalan hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Catalan in T1/EC and UTF-8 encodings.",
	],
},
# czech
{
	"code" => "cs",
	"name" => "czech",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "czhyph.tex",
	"filename_old_patterns_other" => ["czhyphen.tex","czhyphen.ex"],
	# Both Czech and Slovak: \lefthyphenmin=2, \righthyphenmin=3
	# Typographical rules allow \righthyphenmin=2 when typesetting in a
	# narrow column (newspapers etc.).
	# (used to be 2,2)
	"hyphenmin" => [2,3],
	"encoding" => "ec",
	"exceptions" => true,
	"message" => "Czech hyphenation patterns (Pavel Sevecek, v3, 1995)",

	"version"       => "3",
	# guessing based on CTAN/macros/cstex/base/csplain.tar.gz:
	# 1998-12-17 (patterns)
	# 1995-08-23 (exceptions)
	# but patterns claim 1995
	"last_modified" => "1995", # todo: no date
	"type"          => "dictionary",
	"authors"       => [ "pavel_sevecek" ],
	"licence"       => "GPL",
	"description_s" => "Czech hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Czech in T1/EC and UTF-8 encodings.",
		"Original patterns 'czhyphen' are still distributed in the 'csplain'",
		"package and loaded with ISO Latin 2 encoding (IL2).",
		# however hyph-utf8 could also be used for that
	],
},
# slovak
{
	"code" => "sk",
	"name" => "slovak",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "skhyph.tex",
	"filename_old_patterns_other" => ["skhyphen.tex","skhyphen.ex"],
	# see czech
	"hyphenmin" => [2,3],
	"encoding" => "ec",
	"exceptions" => true,
	"message" => "Slovak hyphenation patterns (Jana Chlebikova, 1992)",

	"version"       => "2",
	"last_modified" => "1992-04-24",
	"type"          => "dictionary",
	"authors"       => [ "jana_chlebikova" ],
	"licence"       => "GPL",
	"description_s" => "Slovak hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Slovak in T1/EC and UTF-8 encodings.",
		"Original patterns 'skhyphen' are still distributed in the 'csplain'",
		"package and loaded with ISO Latin 2 encoding (IL2).",
		# however hyph-utf8 could also be used for that
	],
},
# welsh
{
	"code" => "cy",
	"name" => "welsh",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "cyhyph.tex",
	"hyphenmin" => [2,3],
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "Welsh hyphenation patterns",

	"version"       => nil,
	"last_modified" => "1996",
	"type"          => "dictionary",
	"authors"       => [ "yannis_haralambous" ],
	"licence"       => "LPPL",
	"description_s" => "Welsh hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Welsh in T1/EC and UTF-8 encodings.",
	],
},
# danish
{
	"code" => "da",
	"name" => "danish",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "dkhyph.tex",
	"filename_old_patterns_other" => ["dkcommon.tex", "dkspecial.tex"],
	"hyphenmin" => [2,2], # babel
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "Danish hyphenation patterns",
	
	"version"       => nil,
	"last_modified" => "2011-01-11",
	"type"          => "dictionary",
	"authors"       => [ "frank_jensen" ],
	"licence"       => "LPPL",
	"description_s" => "Danish hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Danish in T1/EC and UTF-8 encodings.",
	],
},
# esperanto
{
	"code" => "eo",
	"name" => "esperanto",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "eohyph.tex",
	"hyphenmin" => [2,2],
	"encoding" => "il3", # TODO
	"exceptions" => false,
	"message" => "Esperanto hyphenation patterns",

	"version"       => nil,
	"last_modified" => "1999-08-10",
	"type"          => "rules",
	"authors"       => [ "sergei_pokrovsky" ],
	"licence"       => "LPPL",
	"description_s" => "Esperanto hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Esperanto ISO Latin 3 and UTF-8 encodings.",
		"Note that TeX distributions don't ship any suitable fonts in Latin 3",
		"encoding, so unless you create your own font support or want to use",
		"MlTeX, using native Unicode engines is highly recommended.",
		# "Hyphenation patterns for Esperanto ISO Latin 3 and UTF-8 encodings.",
		# "Note that TeX distributions usually don't ship any suitable fonts in",
		# "Latin 3 encoding, so unless you create your own font support or want",
		# "to use MlTeX, using native UTF-8 engines is highly recommended.",
	],
},
# spanish
# =espanol
{
	"code" => "es",
	"name" => "spanish", "synonyms" => ["espanol"],
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "eshyph.tex",
	"hyphenmin" => [2,2],
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "Spanish hyphenation patterns",

	"version"       => "4.6",
	"last_modified" => "2010-05-18",
	"type"          => "dictionary",
	"authors"       => [ "javier_bezos" ],
	"licence"       => "LPPL",
	"description_s" => "Spanish hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Spanish in T1/EC and UTF-8 encodings.",
	],
},
# basque
{
	"code" => "eu",
	"name" => "basque",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "bahyph.tex",
	"hyphenmin" => [2,2], # babel
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "Basque hyphenation patterns",

	"version"       => nil,
	"last_modified" => "2008-06-26",
	"type"          => "rules",
	"authors"       => [ "juan_aguirregabiria" ],
	"licence"       => "other-free", # "public-check",
	"description_s" => "Basque hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Basque in T1/EC and UTF-8 encodings.",
		# "Generating scripts for these rule-based patterns is included in hyph-utf8."
	],
},
# french
# =patois
# =francais
{
	"code" => "fr",
	"name" => "french", "synonyms" => ["patois","francais"],
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "frhyph.tex",
	"hyphenmin" => [2,3],
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "French hyphenation patterns (V2.12, 2002/12/11)",

	"version"       => "2.12",
	"last_modified" => "2002-12-11",
	"type"          => "rules",
	"authors"       => ["rene_bastian", "daniel_flipo", "bernard_gaulle"],
	# TODO for Arthur: recreate mailing-list
	# "email"         => ["cesure-l{at}gutenberg{dot}eu{dot}org"],
	"licence"       => "other-free", # Knuthian type
	"description_s" => "French hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for French in T1/EC and UTF-8 encodings.",
	]
},
# galician
{
	"code" => "gl",
	"name" => "galician",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "glhyph.tex",
	"hyphenmin" => [2,2],
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "Galician hyphenation patterns",

	"version"       => "2.4",
	"last_modified" => "2010-04-23",
	"type"          => "rules",
	"authors"       => ["javier_mugica"],
	"licence"       => "LPPL", # Status maintained
	"description_s" => "Galician hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Galician in T1/EC and UTF-8 encodings.",
		# "Generated automatically from the mkpattern utility.",
	]
},
# estonian
{
	"code" => "et",
	"name" => "estonian",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "ethyph.tex",
	"hyphenmin" => [2,3], # babel
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "Estonian hyphenation patterns",

	"version"       => nil,
	"last_modified" => "2004-04-13",
	"type"          => "dictionary",
	"authors"       => [ "een_saar" ],
	"licence"       => "LPPL",
	"description_s" => "Estonian hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Estonian in T1/EC and UTF-8 encodings.",
	],
},
# finnish
{
	"code" => "fi",
	"name" => "finnish",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "fihyph.tex",
	"hyphenmin" => [2,2],
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "Finnish hyphenation patterns",

	"version"       => "2.2",
	"last_modified" => "1989-03-08",
	"type"          => "rules",
	"authors"       => ["kauko_saarinen", "fred_karlsson"],
	"licence"       => "other-free",
	"description_s" => "Finnish hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Finnish in T1/EC and UTF-8 encodings.",
	],
},
# croatian
{
	"code" => "hr",
	"name" => "croatian",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "hrhyph.tex",
	"hyphenmin" => [2,2],
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "Croatian hyphenation patterns",

	"version"       => nil,
	"last_modified" => "1996-03-19",
	"type"          => "dictionary",
	"authors"       => [ "igor_marinovic" ],
	"licence"       => "LPPL",
	"description_s" => "Croatian hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Croatian in T1/EC and UTF-8 encodings.",
	],
},
# hungarian
{
	"code" => "hu",
	"name" => "hungarian",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "huhyphn.tex",
	"hyphenmin" => [2,2], # polyglossia
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "Hungarian hyphenation patterns (v20110815)",

	# https://github.com/nagybence/huhyphn/
	"version"       => "v20110815",
	"last_modified" => "2011-08-15", # actually, it is "2009-06-12" or older for contents; we probably want to check/fix this
	"type"          => "dictionary",
	"authors"       => ["bence_nagy"],
	"licence"       => "MPL 1.1/GPL 2.0/LGPL 2.1", # TODO
	"description_s" => "Hungarian hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Hungarian in T1/EC and UTF-8 encodings.",
		# TODO: same comment as for Irish: I'm slightly reluctant to put URL addresses here.
		"From https://github.com/nagybence/huhyphn/."
	],
},
# armenian
# Sahak Petrosyan <sahak at mit dot edu>
{
	"code" => "hy",
	"name" => "armenian",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => nil,
	"hyphenmin" => [1,2], # taken from Hyphenator.js; check the value
	"encoding" => nil,
	"exceptions" => false,
	"message" => "Armenian hyphenation patterns",

	"version"       => nil,
	"last_modified" => "2010-05",
	"type"          => "rules",
	"authors"       => ["sahak_petrosyan"],
	"licence"       => "LPGL",
	"description_s" => "Armenian hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Armenian for Unicode engines.",
		# "Auto-generated from a script included in hyph-utf8.",
	],
},
# interlingua
{
	"code" => "ia",
	"name" => "interlingua",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "iahyphen.tex",
	"hyphenmin" => [2,2], # babel
	"encoding" => "ascii",
	"exceptions" => true,
	"message" => "Hyphenation patterns for Interlingua",

	"version"       => "0.2c",
	"last_modified" => "2005-06-28",
	"type"          => "dictionary",
	"authors"       => ["peter_kleiweg"],
	"licence"       => "LPPL", # TODO Status maintained
	"description_s" => "Interlingua hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Interlingua in ASCII encoding.",
	],
},
# indonesian
{
	"code" => "id",
	"name" => "indonesian",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "inhyph.tex",
	"hyphenmin" => [2,2],
	"encoding" => "ascii",
	"exceptions" => true,
	"message" => "Indonesian hyphenation patterns",

	"version"       => "1.3",
	"last_modified" => "1997-09-19",
	"type"          => "rules",
	"authors"       => ["joerg_knappen", "terry_mart"],
	"licence"       => "GPL",
	"description_s" => "Indonesian hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Indonesian (Bahasa Indonesia) in ASCII",
		"encoding.  They are probably also usable for Malay (Bahasa Melayu).",
	],
},
# icelandic
{
	"code" => "is",
	"name" => "icelandic",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "icehyph.tex",
	"hyphenmin" => [2,2], # babel
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "Icelandic hyphenation patterns",

	"version"       => nil,
	"last_modified" => "2004-03-02",
	"type"          => "dictionary",
	# TODO: I'm not sure that the last two names are relevant, I don't find the source of Marteinn Sverrisson
	"authors"       => ["jorgen_pind", "marteinn_sverrisson", "kristinn_gylfason"],
	"licence"       => "LPPL",
	"description_s" => "Icelandic hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Icelandic in T1/EC and UTF-8 encodings.",
	],
},
# irish
{
	"code" => "ga",
	"name" => "irish",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "gahyph.tex",
	"hyphenmin" => [2,3], # babel
	"encoding" => "ec",
	"exceptions" => true,
	"message" => "Irish hyphenation patterns",

	"version"       => "1.0",
	"last_modified" => "2004-01-22",
	"type"          => "dictionary",
	"authors"       => ["kevin_p_scannell"],
	"licence"       => "GPL",
	"description_s" => "Irish hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Irish (Gaeilge) in T1/EC and UTF-8 encodings.",
		"Visit http://borel.slu.edu/fleiscin/index.html for more information.",
		# TODO: I'm slightly reluctant to put URL here
	],
},
# italian
{
	"code" => "it",
	"name" => "italian",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "ithyph.tex",
	"hyphenmin" => [2,2], # babel
	"encoding" => "ascii",
	"exceptions" => false,
	"message" => "Italian hyphenation patterns",

	"version"       => "4.9",
	"last_modified" => "2014-04-22",
	"type"          => "rules", # TODO: we might want to check that, but it seems unlikely that patgen was used
	"authors"       => ["claudio_beccari"],
	"licence"       => "LPPL", # Status: maintained!
	"description_s" => "Italian hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Italian in ASCII encoding.",
		# supposed to be ...
		"Compliant with the Recommendation UNI 6461 on hyphenation",
		"issued by the Italian Standards Institution",
		"(Ente Nazionale di Unificazione UNI).",
		# "Implements Recommendation UNI 6461 issued by the Italian Standards Institution",
		# "(Ente Nazionale di Unificazione UNI).",
	],
},
# romansh
{
	"code" => "rm",
	"name" => "romansh",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => nil,
	"hyphenmin" => [2,2], # todo
	"encoding" => "ascii",
	"exceptions" => false,
	"message" => "Romansh hyphenation patterns",

	"version"       => "1.1",
	"last_modified" => "2012-04-10",
	"type"          => "rules",
	"authors"       => ["claudio_beccari"],
	"licence"       => "LPPL", # Status: maintained!
	"description_s" => "Romansh hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Romansh in ASCII encoding.",
		"They are supposed to comply with the rules indicated by the Lia",
		"Rumantscha (Romansh language society).",
	],
},
# friulan
{
	"code" => "fur",
	"name" => "friulan", "synonyms" => [],
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => nil,
	"hyphenmin" => [2,2],
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "Friulan hyphenation patterns",

	"version"       => "1.1",
	"last_modified" => "2012-04-10",
	"type"          => "rules",
	"authors"       => ["claudio_beccari"],
	"licence"       => "LPPL", # Status: maintained!
	"description_s" => "Friulan hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Friulan in ASCII encoding.",
		"They are supposed to comply with the common spelling of the",
		"Friulan (Furlan) language as fixed by the Regional Law N.15/96",
		"dated November 6, 1996 and its following amendments.",
	],
},
# piedmontese
{
	"code" => "pms",
	"name" => "piedmontese",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => nil,
	"hyphenmin" => [2,2],
	"encoding" => "ascii",
	"exceptions" => false,
	"message" => "Piedmontese hyphenation patterns",

	"version"       => "1.0",
	"last_modified" => "2013-02-14",
	"type"          => "rules",
	"authors"       => ["claudio_beccari"],
	"licence"       => "LPPL", # Status: maintained!
	"description_s" => "Piedmontese hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Piedmontese in ASCII encoding.",
		"Compliant with 'Gramatica dla lengua piemonteisa' by Camillo Brero.",
	],
},
# kurmanji
{
	"code" => "kmr",
	"name" => "kurmanji",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "kmrhyph.tex",
	"hyphenmin" => [2,2],
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "Kurmanji hyphenation patterns (v. 1.0 2009/06/29 JKn and MSh)",

	"version"       => "1.0",
	"last_modified" => "2009-06-29",
	"type"          => "dictionary",
	"authors"       => ["joerg_knappen", "medeni_shemde"],
	"licence"       => "LPPL", # Status: maintained!
	"description_s" => "Kurmanji hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Kurmanji (Northern Kurdish) as spoken in",
		"Turkey and by the Kurdish diaspora in Europe, in T1/EC and UTF-8",
		"encodings."
	],
},
# latin
{
	"code" => "la",
	"name" => "latin",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "lahyph.tex",
	"hyphenmin" => [2,2], # babel
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "Latin hyphenation patterns",

	"version"       => "3.2a",
	"last_modified" => "2014-06-04", # patterns (behaviour) last modified on 2010-06-01
	"type"          => "rules",
	"authors"       => [ "claudio_beccari" ],
	"licence"       => "LPPL",
	"description_s" => "Latin hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Latin in T1/EC and UTF-8 encodings,",
		"mainly in modern spelling (u when u is needed and v when v is needed),",
		"medieval spelling with the ligatures \\ae and \\oe and the (uncial)",
		"lowercase 'v' written as a 'u' is also supported.  Apparently",
		"there is no conflict between the patterns of modern Latin and",
		"those of medieval Latin.",
	],
},
# classiclatin
{
	"code" => "la-x-classic",
	"name" => "classiclatin",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => nil,
	"hyphenmin" => [2,2],
	"encoding" => "ascii",
	"exceptions" => false,
	"message" => "Classical Latin hyphenation patterns",

	"version"       => "1.2",
	"last_modified" => "2014-10-06",
	"type"          => "rules",
	"authors"       => [ "claudio_beccari" ],
	"licence"       => "LPPL",
	"description_s" => "Classical Latin hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for the Classical Latin in T1/EC and UTF-8",
		"encodings. Classical Latin hyphenation patterns are different from",
		"those of 'plain' Latin, the latter being more adapted to modern Latin.",
	],
},
# lithuanian
{
	"code" => "lt",
	"name" => "lithuanian",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"hyphenmin" => [2,2],
	"encoding" => "l7x",
	"exceptions" => false,
	"message" => "Lithuanian hyphenation patterns",

	"version"       => nil,
	"last_modified" => "2002-11-20", # 1992-03-04, for the content?
	"authors"       => ["vytas_statulevicius", "yannis_haralambous", "sigitas_tolusis"],
	# "licence"       => "LPPL",
	"description_s" => "Lithuanian hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Lithuanian in L7X and UTF-8 encodings.",
		# "Designed for \\lefthyphenmin and \\righthyphenmin set to 2.",
		"\\lefthyphenmin and \\righthyphenmin have to be at least 2.",
		# "Changing them to 1 according to grammatical rules from 1997",
		# "would require to review and maybe rebuild the patterns."
	],
},
# latvian
{
	"code" => "lv",
	"name" => "latvian",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"hyphenmin" => [2,2],
	"encoding" => "l7x",
	"exceptions" => false,
	"message" => "Latvian hyphenation patterns",

	"version"       => "0.3",
	"last_modified" => "2005-09-14",
	"type"          => "dictionary",
	"authors"       => ["janis_vilims"],
	"licence"       => "LGPL",
	"description_s" => "Latvian hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Latvian in L7X and UTF-8 encodings.",
	],
},
# dutch
{
	"code" => "nl",
	"name" => "dutch",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "nehyph96.tex",
	# quoting Hans Hagen:
	# patterns generated with 2,2 (so don't go less) but use prefered values 2,3 (educational publishers want 4,5 -)
	"hyphenmin" => [2,2],
	"encoding" => "ec",
	"exceptions" => true,
	"message" => "Dutch hyphenation patterns",

	"version"       => "1.1",
	"last_modified" => "1996-11",
	"type"          => "dictionary",
	"authors"       => ["piet_tutelaers"],
	"licence"       => "LPPL",
	"description_s" => "Dutch hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Dutch in T1/EC and UTF-8 encodings.",
		# "\\lefthyphenmin and \\righthyphenmin must both be > 1.",
		"These patterns don't handle cases like 'menuutje' > 'menu-tje',",
		"and don't hyphenate words that have different hyphenations according",
		"to their meaning."
	],
},
# polish
{
	"code" => "pl",
	"name" => "polish",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "plhyph.tex",
	#{}"hyphenmin" => [1,1],
	"hyphenmin" => [2,2],
	"encoding" => "qx",
	"exceptions" => true,
	"message" => "Polish hyphenation patterns",

	"version"       => "3.0a",
	"last_modified" => "1995-06-17",
	"type"          => "dictionary",
	"authors"       => ["hanna_kolodziejska", "boguslaw_jackowski", "marek_rycko"],
	"licence"       => "public", # TODO Knuthian type
	"description_s" => "Polish hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Polish in QX and UTF-8 encodings.",
		"These patterns are also used by Polish TeX formats MeX and LaMeX.",
	],
},
# portuguese
# =portuges
{
	"code" => "pt",
	"name" => "portuguese", "synonyms" => ["portuges"],
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "pthyph.tex",
	"hyphenmin" => [2,3], # babel
	"encoding" => "ec",
	"exceptions" => true,
	"message" => "Portuguese hyphenation patterns",

	"version"       => "1.0",
	"last_modified" => "1996-07-21",
	"type"          => "rules", # TODO: we could create a generating script
	"authors"       => ["pedro_j_de_rezende", "j_joao_dias_almeida"],
	"licence"       => "LPPL",
	"description_s" => "Portuguese hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Portuguese in T1/EC and UTF-8 encodings.",
	],
},
# pinyin
{
	"code" => "zh-latn-pinyin",
	"name" => "pinyin",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "pyhyph.tex",
	"hyphenmin" => [1,1],
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "Hyphenation patterns for unaccented pinyin syllables (CJK 4.8.0)",

	"version"       => "4.8.0",
	"last_modified" => "2008-05-22",
	"type"          => "rules", # TODO: we could create a generating script
	"authors"       => ["werner_lemberg"],
	"licence"       => "GPL",
	"description_s" => "Chinese pinyin hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for unaccented transliterated Mandarin Chinese",
		"(pinyin) in T1/EC and UTF-8 encodings.",
	],
},
# romanian
{
	"code" => "ro",
	"name" => "romanian",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "rohyphen.tex",
	"hyphenmin" => [2,2],
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "Romanian hyphenation patterns", # : `rohyphen' 1.1 <29.10.1996>

	"version"       => "1.1R",
	"last_modified" => "1996-11-07",
	"type"          => "dictionary",
	"authors"       => ["adrian_rezus"],
	"description_s" => "Romanian hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Romanian in T1/EC and UTF-8 encodings.",
		"The UTF-8 patterns use U+0219 for the character 's with comma accent'",
		"and U+021B for 't with comma accent', but we may consider using U+015F",
		"and U+0163 as well in the future.",
		# "Generated by PatGen2-output hyphen-level 9.",
	],
},
# slovenian
# =slovene
{
	"code" => "sl",
	"name" => "slovenian", "synonyms" => ["slovene"],
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "sihyph.tex",
	"hyphenmin" => [2,2],
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "Slovenian hyphenation patterns",

	"version"       => "2.3",
	"last_modified" => "1997-15-04",
	"type"          => "dictionary",
	"authors"       => [ "matjaz_vrecko" ],
	"licence"       => "LPPL",
	"description_s" => "Slovenian hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Slovenian in T1/EC and UTF-8 encodings.",
	],
},
# uppersorbian
{
	"code" => "hsb",
	"name" => "uppersorbian",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "sorhyph.tex",
	"hyphenmin" => [2,2],
	"encoding" => "ec",
	"exceptions" => true,
	"message" => "Upper Sorbian hyphenation patterns (E. Werner)",
#	\message{Hyphenation patterns for Upper Sorbian, E. Werner}
#	\message{Completely new revision 1997, March 22}

	"version"       => nil,
	"last_modified" => "1997-03-22",
	"authors"       => ["eduard_werner"],
	"type"          => "dictionary",
	"licence"       => "LPPL",
	"description_s" => "Upper Sorbian hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Upper Sorbian in T1/EC and UTF-8 encodings.",
	],
},
# swedish
{
	"code" => "sv",
	"name" => "swedish",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "svhyph.tex",
	"hyphenmin" => [2,2], # patters say it could be 1,2; babel says 2,2 - double check
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "Swedish hyphenation patterns (Jan Michael Rynning, 1994-03-03)",

	# "version"       => "1994-03-03", # that is what author used in message
	"version"       => nil,
	"last_modified" => "1994-03-03",
	"type"          => "dictionary",
	"authors"       => ["jan_michael_rynning"],
	"licence"       => "LPPL",
	"description_s" => "Swedish hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Swedish in T1/EC and UTF-8 encodings.",
	],
},
# turkmen
{
	"code" => "tk",
	"name" => "turkmen",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => nil,
	"hyphenmin" => [2,2],
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "Turkmen hyphenation patterns",

	"version"       => "0.1",
	"last_modified" => "2010-03-16",
	"type"          => "dictionary",
	"authors"       => [ "nazar_annagurban" ],
	"licence"       => "public",
	"description_s" => "Turkmen hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Turkmen in T1/EC and UTF-8 encodings.",
	],
},
# turkish
{
	"code" => "tr",
	"name" => "turkish",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "tkhyph.tex",
	"hyphenmin" => [2,2], # polyglossia
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "Turkish hyphenation patterns",

	"version" => nil,
	"last_modified" => "2008-06-28",
	"type"          => "rules",
	"authors"       => ["pierre_mackay", "h_turgut_uyar", "s_ekin_kocabas", "mojca_miklavec"],
	"licence"       => "LPPL",
	"description_s" => "Turkish hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Turkish in T1/EC and UTF-8 encodings.",
		# "Auto-generated from a script included in the distribution.",
		"The patterns for Turkish were first produced for the Ottoman Texts",
		"Project in 1987 and were suitable for both Modern Turkish and Ottoman",
		"Turkish in Latin script, however the required character set didn't fit",
		"into EC encoding, so support for Ottoman Turkish had to be dropped to",
		"keep compatibility with 8-bit engines.",
	]
},




# ukenglish
{
	"code" => "en-gb",
	"name" => "ukenglish", "synonyms" => ["british", "UKenglish"],
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "ukhyphen.tex",
	"hyphenmin" => [2,3], # confirmed, same as what Knuth says
	"encoding" => "ascii",
	"exceptions" => true,
	"message" => "Hyphenation patterns for British English",

	"version"       => "1.0a", # FIXME a much older comment says 2.0?
	"last_modified" => "2005-10-18",
	"type"          => "dictionary",
	"authors"       => ["dominik_wujastyk", "graham_toal"],
	"licence"       => "other-free", # TODO Knuth-like
	# (This will be uncommented during reimplementation)
	# "description_s" => "British English hyphenation patterns",
	# "description_l" => [
	# 	"Hyphenation patterns for British English in ASCII encoding.",
	# ],

	"description_s" => "English hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Additional hyphenation patterns for American and British",
		"English in ASCII encoding.  The American English patterns",
		"(usenglishmax) greatly extend the standard patterns from Knuth",
		"to find many additional hyphenation points.  British English",
		"hyphenation is completely different from US English, so has its",
		"own set of patterns.",
	],
},
# (US english)
# usenglishmax
{
	"code" => "en-us",
	"name" => "usenglishmax",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "ushyphmax.tex",
	"hyphenmin" => [2,3], # confirmed, same as what Knuth says
	"encoding" => "ascii",
	"exceptions" => true,
	"message" => "Hyphenation patterns for American English",

	"version"       => nil,
	"last_modified" => "1990-03-01", # 8-bit file also has version 2005-05-30.
	"type"          => "dictionary",
	"authors"       => ["donald_e_knuth", "gerard_d_c_kuiken"],
	"licence"       => "other-free",
	# (This will be uncommented during reimplementation)
	# "description_s" => "American English hyphenation patterns",
	# "description_l" => [
	# 	"Hyphenation patterns for American English in ASCII encoding.",
	# ],
},
# US english
# {
# 	"code" => "en-us-x-knuth",
# 	"name" => "english",
# 	"use_new_loader" => false,
# 	"use_old_patterns" => false,
# 	"filename_old_patterns" => "hyphen.tex",
# 	"hyphenmin" => [2,3], # confirmed, same as what Knuth says
# 	"encoding" => "ascii",
# 	"exceptions" => true,
# 	"message" => "Hyphenation patterns for American English",
# },
# TODO: FIXME!!!
# serbian
{
	"code" => "sh-latn",
	"name" => "serbian",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "shhyphl.tex",
	# It is allowed to leave one character at the end of the row.
	# However, if you think that it is graphicaly not very
	# pleasant these patterns will work well with \lefthyphenmin=2.
	# \lefthyphenmin=1 \righthyphenmin=2
	"hyphenmin" => [2,2],
	"encoding" => "ec",
	"exceptions" => true,
	"message" => "Serbian hyphenation patterns in Latin script",

	# only for serbian
	"version"       => "2.02",
	"last_modified" => "2008-06-22",
	"type"          => "dictionary",
	"authors"       => [ "dejan_muhamedagic" ],
	"licence"       => "LPPL",
	# for both scripts
	"description_s" => "Serbian hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Serbian in T1/EC, T2A and UTF-8 encodings.",
		"For 8-bit engines the patterns are available separately as 'serbian'",
		"in T1/EC encoding for Latin script and 'serbianc' in T2A encoding for",
		"Cyrillic script. Unicode engines should only use 'serbian'",
		"which has patterns in both scripts combined.",
	],
},
# serbianc
{
	"code" => "sh-cyrl",
	"name" => "serbianc",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	# "filename_old_patterns" => "srhyphc.tex",
	"hyphenmin" => [2,2],
	"encoding" => "t2a",
	"exceptions" => true,
	"message" => "Serbian hyphenation patterns in Cyrillic script",
},
# mongolian (used to be mongolian2a)
{
	"code" => "mn-cyrl",
	"name" => "mongolian",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "mnhyphn.tex",
	"hyphenmin" => [2,2],
	"encoding" => "t2a",
	"exceptions" => false,
	"message" => "(New) Mongolian hyphenation patterns",

	# only for this one
	"version"       => "1.2",
	"last_modified" => "2010-04-03",
	"type"          => "dictionary",	
	"authors"       => [ "dorjgotov_batmunkh" ],
	"licence"       => "LPPL",
	# for both
	"description_s" => "Mongolian hyphenation patterns in Cyrillic script",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Mongolian in T2A, LMC and UTF-8 encodings.",
		"LMC encoding is used in MonTeX. The package includes two sets of",
		"patterns that will hopefully be merged in future.",
	],
},
# mongolianlmc	xu-mnhyph.tex (used to be mongolian)
{
	"code" => "mn-cyrl-x-lmc",
	"name" => "mongolianlmc",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "mnhyph.tex",
	"hyphenmin" => [2,2],
	"encoding" => "lmc",
	"exceptions" => false,
	"message" => "Mongolian hyphenation patterns",
},
# bulgarian
{
	"code" => "bg",
	"name" => "bulgarian",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"filename_old_patterns" => "bghyphen.tex",
	"hyphenmin" => [2,2], # babel
	"encoding" => "t2a",
	"exceptions" => false,
	"message" => "Bulgarian hyphenation patterns",

	"version"       => "1.7",
	"last_modified" => "2008-06",
	"type"          => "pattern",
	"authors"       => [ "georgi_boshnakov" ],
	"licence"       => "LPPL",
	"description_s" => "Bulgarian hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Bulgarian in T2A and UTF-8 encodings.",
	],
},
# sanskrit
{
	"code" => "sa",
	"name" => "sanskrit",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"hyphenmin" => [1,3], # polyglossia
	"encoding" => nil, # no patterns for 8-bit engines
	"exceptions" => false,
	"message" => "Sanskrit hyphenation patterns (v0.6, 2011/09/14)",

	"version"       => "0.6",
	"last_modified" => "2011-09-14",
	"type"          => "rules",
	"authors"       => ["yves_codet"],
	"licence"       => "free", # You may freely use, copy, modify and/or distribute this file.
	"description_s" => "Sanskrit hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Sanskrit and Prakrit in transliteration,",
		"and in Devanagari, Bengali, Kannada, Malayalam and Telugu scripts",
		"for Unicode engines.",
	],
},
# norwegian
{
	"code" => "no",
	"name" => "norwegian", # TODO: fixme
	"use_new_loader" => false,
	"use_old_patterns" => false,
	"hyphenmin" => [2,2], # babel
	"encoding" => "ec",
	"exceptions" => false,
	"message" => "Norwegian hyphenation patterns",
},
# norsk
{
	"code" => "nb",
	"name" => "bokmal", "synonyms" => ["norwegian", "norsk"],
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"hyphenmin" => [2,2], # babel
	"encoding" => "ec",
	"exceptions" => true,
	"message" => "Norwegian Bokmal hyphenation patterns",

	"version"       => nil,
	"last_modified" => "2012-05-18",
	"type"          => "dictionary",
	"authors"       => [ "rune_kleveland", "ole_michael_selberg" ],
	"licence"       => "free", # TODO
	"description_s" => "Norwegian Bokmal and Nynorsk hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Norwegian Bokmal and Nynorsk in T1/EC and",
		"UTF-8 encodings.",
	],
},
# nynorsk
{
	"code" => "nn",
	"name" => "nynorsk",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"hyphenmin" => [2,2], # babel
	"encoding" => "ec",
	"exceptions" => true,
	"message" => "Norwegian Nynorsk hyphenation patterns",
},
#####
# assamese
{
	"code" => "as",
	"name" => "assamese",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"hyphenmin" => [1,1], # TODO
	"encoding" => nil, # no patterns for 8-bit engines
	"exceptions" => false,
	"message" => "Assamese hyphenation patterns",

	# this is true for all Indic patterns
	"version"       => "0.5.3",
	"last_modified" => "2010-05-01",
	"type"          => "rules",
	"authors"       => ["santhosh_thottingal"],
	"licence"       => "LGPL",
	"description_s" => "Indic hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Assamese, Bengali, Gujarati, Hindi, Kannada,",
		"Malayalam, Marathi, Oriya, Panjabi, Tamil and Telugu for Unicode",
		"engines.",
	],
},
# bengali
{
	"code" => "bn",
	"name" => "bengali",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"hyphenmin" => [1,1], # TODO
	"encoding" => nil, # no patterns for 8-bit engines
	"exceptions" => false,
	"message" => "Bengali hyphenation patterns",
},
# gujarati
{
	"code" => "gu",
	"name" => "gujarati",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"hyphenmin" => [1,1], # TODO
	"encoding" => nil, # no patterns for 8-bit engines
	"exceptions" => false,
	"message" => "Gujarati hyphenation patterns",
},
# hindi
{
	"code" => "hi",
	"name" => "hindi",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"hyphenmin" => [1,1], # TODO
	"encoding" => nil, # no patterns for 8-bit engines
	"exceptions" => false,
	"message" => "Hindi hyphenation patterns",
},
# kannada
{
	"code" => "kn",
	"name" => "kannada",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"hyphenmin" => [1,1], # TODO
	"encoding" => nil, # no patterns for 8-bit engines
	"exceptions" => false,
	"message" => "Kannada hyphenation patterns",
},
# malayalam
{
	"code" => "ml",
	"name" => "malayalam",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"hyphenmin" => [1,1], # TODO
	"encoding" => nil, # no patterns for 8-bit engines
	"exceptions" => false,
	"message" => "Malayalam hyphenation patterns",
},
# marathi
{
	"code" => "mr",
	"name" => "marathi",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"hyphenmin" => [1,1], # TODO
	"encoding" => nil, # no patterns for 8-bit engines
	"exceptions" => false,
	"message" => "Marathi hyphenation patterns",
},
# oriya
{
	"code" => "or",
	"name" => "oriya",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"hyphenmin" => [1,1], # TODO
	"encoding" => nil, # no patterns for 8-bit engines
	"exceptions" => false,
	"message" => "Oriya hyphenation patterns",
},
# panjabi
{
	"code" => "pa",
	"name" => "panjabi",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"hyphenmin" => [1,1], # TODO
	"encoding" => nil, # no patterns for 8-bit engines
	"exceptions" => false,
	"message" => "Panjabi hyphenation patterns",
},
# tamil
{
	"code" => "ta",
	"name" => "tamil",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"hyphenmin" => [1,1], # TODO
	"encoding" => nil, # no patterns for 8-bit engines
	"exceptions" => false,
	"message" => "Tamil hyphenation patterns",
},
# telugu
{
	"code" => "te",
	"name" => "telugu",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"hyphenmin" => [1,1], # TODO
	"encoding" => nil, # no patterns for 8-bit engines
	"exceptions" => false,
	"message" => "Telugu hyphenation patterns",
},
# thai
{
	"code" => "th",
	"name" => "thai",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"hyphenmin" => [2,3],
	"encoding" => "lth",
	"exceptions" => false,
	"message" => "Thai hyphenation patterns",

	"version"       => nil,
	"last_modified" => "2015-05-07",
	"type"          => "dictionary",
	"authors"       => [ "theppitak_karoonboonyanan" ],
	"licence"       => "LPPL",
	"description_s" => "Thai hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Thai in LTH and UTF-8 encodings.",
	],
},
# lao
#{
#	"code" => "lo",
#	"name" => "lao",
#	"use_new_loader" => true,
#	"use_old_patterns" => false,
#	"hyphenmin" => [1,1], # TODO
#	"encoding" => nil, # no patterns for 8-bit engines
#	"exceptions" => false,
#	"message" => "Lao hyphenation patterns",
#
#	"version"       => nil,
#	"last_modified" => "2010-05-19",
#	"type"          => "rules",
#	"authors"       => [ "brian_wilson", "arthur_reutenauer", "mojca_miklavec" ],
#	"licence"       => "other-free",
#	"description_s" => "Lao hyphenation patterns",
#	"description_l" => [
#		#......................................................................#
#		"Hyphenation patterns for Lao language for Unicode engines.",
#		"Current version is experimental and gives bad results.",
#	],
#},
# pan-Ethiopic
{
	"code" => "mul-ethi",
	"name" => "ethiopic", "synonyms" => ["amharic", "geez"],
	"version" => nil,
	"last_modified" => "2011-01-10",
	"authors" => ["arthur_reutenauer", "mojca_miklavec"],
	"licence" => "public-ask", # TODO
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"hyphenmin" => [1,1],
	"encoding" => nil, # no patterns for 8-bit engines
	"exceptions" => false,
	"message" => "Pan-Ethiopic hyphenation patterns",
	"description_s" => "Hyphenation patterns for Ethiopic scripts",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for languages written using the Ethiopic script",
		"for Unicode engines. They are not supposed to be linguistically",
		"relevant in all cases and should, for proper typography, be replaced",
		"by files tailored to individual languages.",
	],
},
# georgian
{
	"code" => "ka",
	"name" => "georgian",
	"use_new_loader" => true,
	"use_old_patterns" => false,
	"hyphenmin" => [1,2],
	"encoding" => "t8m",
	"exceptions" => false,
	"message" => "Georgian hyphenation patterns",

	"version"       => "0.3",
	"last_modified" => "2013-04-15",
	"type"          => "dictionary",
	"authors"       => [ "levan_shoshiashvili" ],
	"licence"       => "LPPL",
	"description_s" => "Georgian hyphenation patterns",
	"description_l" => [
		#......................................................................#
		"Hyphenation patterns for Georgian in T8M, T8K and UTF-8 encodings.",
	],
},
# dumylang -> dumyhyph.tex
# nohyphenation -> zerohyph.tex
# arabic -> zerohyph.tex
# farsi zerohyph.tex
# =persian
		]

		languages.each do |l|
			language = Language.new(l)
			@@list.push(language)
			self[language.code] = language
		end
	end
	
	def list
		return @@list
	end
end
