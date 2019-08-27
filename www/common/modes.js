define([
    '/code/orgmode.js'
], function () {
    var Modes = {};

    // mode language (extension)
    var list = Modes.list = [
        "APL apl .apl",
        "ASCII-Armor asciiarmor .asc",
        "ASN.1 asn.1 .asn1",
        "Asterisk asterisk",
        "Brainfuck brainfuck .b",
        "C text/x-csrc .c",
        "C text/x-c++src .cpp",
        "C-like clike .c",
        "Clojure clojure .clj",
        "CMake cmake _", /* no extension */
        "COBOL cobol .cbl",
        "CoffeeScript coffeescript .coffee",
        "Common_Lisp commonlisp .lisp",
        "Crystal crystal .cr",
        "CSS css .css",
        "Cypher cypher .cypher",
        "D d .d",
        "Dart dart .dart",
        "Diff diff .diff",
        "Django django .py",
        "Dockerfile dockerfile _", /* no extension */
        "DTD dtd .dtd",
        "Dylan dylan .dylan",
        "EBNF ebnf .ebnf",
        "ECL ecl .ecl",
        "Eiffel eiffel .e",
        "Elm elm .elm",
        "Erlang erlang .erl",
        "Factor factor .factor",
        "FCL fcl .fcl",
        "Forth forth .fs",
        "Fortran fortran .f90",
        "GAS gas .gas",
        "Gherkin gherkin .feature",
        "Go go .go",
        "Groovy groovy .groovy",
        "Haml haml .haml",
        "Handlebars handlebars .hbs",
        "Haskell haskell .hs",
        "Haskell-Literate haskell-literate .lhs",
        "Haxe haxe .hx",
        "HTML htmlmixed .html",
        "HTTP http _", /* no extension */
        "IDL idl .idl",
        "JADE jade .jade",
        "Java text/x-java .java",
        "JavaScript javascript .js",
        "Jinja2 jinja2 .j2",
        "JSX jsx .jsx",
        "Julia julia .jl",
        "LiveScript livescript .ls",
        "Lua lua .lua",
        "Markdown gfm .md",
        //"markdown markdown .md",
        "Mathematica mathematica .nb",
        "mIRC mirc .irc",
        "ML mllike _", /* no extension */
        "Modelica modelica .mo",
        "MscGen mscgen .mscgen",
        "MUMPS mumps .m",
        "Nginx nginx .conf",
        "NSIS nsis .nsi",
        "N-Triples ntriples .nq",
        "Objective-C text/x-objectivec .m",
        "Octave octave .m",
        "Org-mode orgmode .org",
        "Oz oz .oz",
        "Pascal pascal .pas",
        "PEG.js pegjs .pegjs",
        "Perl perl .pl",
        "PHP php .php",
        "Pig pig .pig",
        "PowerShell powershell .ps1",
        "Properties properties .properties",
        "Protocol_Buffers protobuf .proto",
        "Puppet puppet .pp",
        "Python python .py",
        "Q q .q",
        "R r .r",
        "RPM rpm .rpm",
        "RST rst .rst",
        "Ruby ruby .rb",
        "Rust rust .rs",
        "Sass sass .sass",
        "Scheme scheme .scm",
        "Shell shell .sh",
        "Sieve sieve .sieve",
        "Slim slim .slim",
        "Smalltalk smalltalk _", /* no extension */
        "Smarty smarty _", /* no extension */
        "Solr solr _", /* no extension */
        "Soy soy .soy",
        "SPARQL sparql .rq",
        "Spreadsheet spreadsheet .xls",
        "SQL sql .sql",
        "sTeX stex .stex",
        "Stylus stylus .styl",
        "Swift swift .swift",
        "Tcl tcl .tcl",
        "Text text .txt",
        "Textile textile .textile",
        "TiddlyWiki tiddlywiki .tw",
        "Tiki tiki _", /* no extension */
        "TOML toml .toml",
        "Tornado tornado .tornado",
        "troff troff .troff",
        "TTCN ttcn",
        "TTCN-cfg ttcn-cfg",
        "Turtle turtle .ttl",
        "Twig twig .twig",
        "Visual_Basic vb .vb",
        "VBScript vbscript .vbs",
        "Velocity velocity .vm",
        "Verilog verilog .v",
        "VHDL vhdl .vhdl",
        "Vue vue .vue",
        "XML xml .xml",
        //"xwiki xwiki21",
        "XQuery xquery .xquery",
        "YAML yaml .yaml",
        "YAML_Frontmatter yaml-frontmatter _", /* no extension */
        "Z80 z80 .z80"
    ].map(function (line) {
        var kv = line.split(/\s/);
        return {
            language: kv[0].replace(/_/g, ' '),
            mode: kv[1],
            ext: kv[2] === '_' ? '' : kv[2],
        };
    });

    Modes.extensionOf = function (mode) {
        var ext;
        list.some(function (o) {
            if (o.mode !== mode) { return; }
            ext = o.ext;
            return true;
        });
        return ext;
    };

    return Modes;
});
