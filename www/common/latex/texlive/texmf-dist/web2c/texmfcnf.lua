-- public domain

-- ConTeXt needs a properly expanded TEXMFLOCAL, so here is a
-- bit of lua code to make that happen

local texmflocal = resolvers.prefixes.selfautoparent();
texmflocal = string.gsub(texmflocal, "20%d%d$", "texmf-local");

return {

    type    = "configuration",
    version = "1.1.0",
    date    = "2012-05-24",
    time    = "12:12:12",
    comment = "ConTeXt MkIV configuration file",
    author  = "Hans Hagen, PRAGMA-ADE, Hasselt NL",

    content = {

        -- Originally there was support for engines and progname but I don't expect
        -- other engines to use this file, so first engines were removed. After that
        -- if made sense also to get rid of progname. At some point specific formats
        -- will be supported but then as a subtable with fallbacks, which sounds more
        -- natural. Also, at some point the paths will become tables. For the moment
        -- I don't care too much about it as extending is easy.

        variables = {

            -- The following variable is predefined (but can be overloaded) and in
            -- most cases you can leve this one untouched. The built-in definition
            -- permits relocation of the tree.
            --
            -- TEXMFCNF     = "{selfautodir:,selfautoparent:}{,{/share,}/texmf{-local,}/web2c}"
            --
            -- more readable than "selfautoparent:{/texmf{-local,}{,/web2c},}}" is:
            --
            -- TEXMFCNF     = {
            --     "selfautoparent:/texmf-local",
            --     "selfautoparent:/texmf-local/web2c",
            --     "selfautoparent:/texmf-dist",
            --     "selfautoparent:/texmf/web2c",
            --     "selfautoparent:",
            -- }

            -- only used for FONTCONFIG_PATH & TEXMFCACHE in TeX Live

            TEXMFSYSVAR     = "selfautoparent:texmf-var",
            TEXMFVAR        = "home:.texlive2015/texmf-var",

            -- We have only one cache path but there can be more. The first writable one
            -- will be chosen but there can be more readable paths.

            TEXMFCACHE      = "$TEXMFSYSVAR;$TEXMFVAR",
            TEXMFCONFIG     = "home:.texlive2015/texmf-config",

            -- I don't like this texmf under home and texmf-home would make more
            -- sense. One never knows what installers put under texmf anywhere and
            -- sorting out problems will be a pain. But on the other hand ... home
            -- mess is normally under the users own responsibility.
            --
            -- By using prefixes we don't get expanded paths in the cache __path__
            -- entry. This makes the tex root relocatable.

            TEXMFOS         = "selfautodir:",
            TEXMFDIST       = "selfautoparent:texmf-dist",

            TEXMFLOCAL      = texmflocal,
            TEXMFSYSCONFIG  = "selfautoparent:texmf-config",
            TEXMFFONTS      = "selfautoparent:texmf-fonts",
            TEXMFPROJECT    = "selfautoparent:texmf-project",

            TEXMFHOME       = "home:texmf",
         -- TEXMFHOME       = os.name == "macosx" and "home:Library/texmf" or "home:texmf",

            -- We need texmfos for a few rare files but as I have a few more bin trees
            -- a hack is needed. Maybe other users also have texmf-platform-new trees.

            TEXMF           = "{$TEXMFCONFIG,$TEXMFHOME,!!$TEXMFSYSCONFIG,!!$TEXMFSYSVAR,!!$TEXMFPROJECT,!!$TEXMFFONTS,!!$TEXMFLOCAL,!!$TEXMFDIST}",

            TEXFONTMAPS     = ".;$TEXMF/fonts/data//;$TEXMF/fonts/map/{pdftex,dvips}//",
            ENCFONTS        = ".;$TEXMF/fonts/data//;$TEXMF/fonts/enc/{dvips,pdftex}//",
            VFFONTS         = ".;$TEXMF/fonts/{data,vf}//",
            TFMFONTS        = ".;$TEXMF/fonts/{data,tfm}//",
            T1FONTS         = ".;$TEXMF/fonts/{data,type1}//;$OSFONTDIR",
            AFMFONTS        = ".;$TEXMF/fonts/{data,afm}//;$OSFONTDIR",
            TTFONTS         = ".;$TEXMF/fonts/{data,truetype}//;$OSFONTDIR",
            OPENTYPEFONTS   = ".;$TEXMF/fonts/{data,opentype}//;$OSFONTDIR",
            CMAPFONTS       = ".;$TEXMF/fonts/cmap//",
            FONTFEATURES    = ".;$TEXMF/fonts/{data,fea}//;$OPENTYPEFONTS;$TTFONTS;$T1FONTS;$AFMFONTS",
            FONTCIDMAPS     = ".;$TEXMF/fonts/{data,cid}//",
            OFMFONTS        = ".;$TEXMF/fonts/{data,ofm,tfm}//",
            OVFFONTS        = ".;$TEXMF/fonts/{data,ovf,vf}//",

            TEXINPUTS       = ".;$TEXMF/tex/{context,plain/base,generic}//",
            MPINPUTS        = ".;$TEXMF/metapost/{context,base,}//",

            -- In the next variable the inputs path will go away.

            TEXMFSCRIPTS    = ".;$TEXMF/scripts/context/{lua,ruby,python,perl}//;$TEXINPUTS",
            PERLINPUTS      = ".;$TEXMF/scripts/context/perl",
            PYTHONINPUTS    = ".;$TEXMF/scripts/context/python",
            RUBYINPUTS      = ".;$TEXMF/scripts/context/ruby",
            LUAINPUTS       = ".;$TEXINPUTS;$TEXMF/scripts/context/lua//",
            CLUAINPUTS      = ".;$SELFAUTOLOC/lib/{context,luatex,}/lua//",

            -- Not really used by MkIV so they might go away.

            BIBINPUTS       = ".;$TEXMF/bibtex/bib//",
            BSTINPUTS       = ".;$TEXMF/bibtex/bst//",

            -- Experimental

            ICCPROFILES     = ".;$TEXMF/tex/context/colors/{icc,profiles}//;$OSCOLORDIR",

            -- A few special ones that will change some day.

            FONTCONFIG_FILE = "fonts.conf",
            FONTCONFIG_PATH = "$TEXMFSYSVAR/fonts/conf",

        },

        -- We have a few reserved subtables. These control runtime behaviour. The
        -- keys have names like 'foo.bar' which means that you have to use keys
        -- like ['foo.bar'] so for convenience we also support 'foo_bar'.

        directives = {

            -- There are a few variables that determine the engines
            -- limits. Most will fade away when we close in on version 1.

            ["luatex.expanddepth"]       =  "10000", -- 10000
            ["luatex.hashextra"]         = "100000", --     0
            ["luatex.nestsize"]          =   "1000", --    50
            ["luatex.maxinopen"]         =    "500", --    15
            ["luatex.maxprintline"]      = " 10000", --    79
            ["luatex.maxstrings"]        = "500000", -- 15000 -- obsolete
            ["luatex.paramsize"]         =  "25000", --    60
            ["luatex.savesize"]          =  "50000", --  4000
            ["luatex.stacksize"]         =  "10000", --   300

            -- A few process related variables come next.

         -- ["system.checkglobals"]      = "10",
         -- ["system.nostatistics"]      = "yes",
            ["system.errorcontext"]      = "10",
            ["system.compile.cleanup"]   = "no",    -- remove tma files
            ["system.compile.strip"]     = "yes",   -- strip tmc files

            -- The io modes are similar to the traditional ones. Possible values
            -- are all, paranoid and restricted.

            ["system.outputmode"]        = "restricted",
            ["system.inputmode"]         = "any",

            -- The following variable is under consideration. We do have protection
            -- mechanims but it's not enabled by default.

            ["system.commandmode"]       = "any", -- any none list
            ["system.commandlist"]       = "mtxrun, convert, inkscape, gs, imagemagick, curl, bibtex, pstoedit",

            -- The mplib library support mechanisms have their own
            -- configuration. Normally these variables can be left as
            -- they are.

            ["mplib.texerrors"]          = "yes",

            -- Normally you can leave the font related directives untouched
            -- as they only make sense when testing.

         -- ["fonts.autoreload"]         = "no",
         -- ["fonts.otf.loader.method"]  = "table", -- table mixed sparse
         -- ["fonts.otf.loader.cleanup"] = "0",     -- 0 1 2 3

            -- In an edit cycle it can be handy to launch an editor. The
            -- preferred one can be set here.

         -- ["pdfview.method"]           = "okular", -- default (often acrobat) xpdf okular

        },

        experiments = {
            ["fonts.autorscale"] = "yes",
        },

        trackers = {
        },

    },

}
