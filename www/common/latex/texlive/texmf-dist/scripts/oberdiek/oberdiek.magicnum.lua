-- 
--  This is file `oberdiek.magicnum.lua',
--  generated with the docstrip utility.
-- 
--  The original source files were:
-- 
--  magicnum.dtx  (with options: `lua')
--  
--  This is a generated file.
--  
--  Project: magicnum
--  Version: 2011/04/10 v1.4
--  
--  Copyright (C) 2007, 2009-2011 by
--     Heiko Oberdiek <heiko.oberdiek at googlemail.com>
--  
--  This work may be distributed and/or modified under the
--  conditions of the LaTeX Project Public License, either
--  version 1.3c of this license or (at your option) any later
--  version. This version of this license is in
--     http://www.latex-project.org/lppl/lppl-1-3c.txt
--  and the latest version of this license is in
--     http://www.latex-project.org/lppl.txt
--  and version 1.3 or later is part of all distributions of
--  LaTeX version 2005/12/01 or later.
--  
--  This work has the LPPL maintenance status "maintained".
--  
--  This Current Maintainer of this work is Heiko Oberdiek.
--  
--  The Base Interpreter refers to any `TeX-Format',
--  because some files are installed in TDS:tex/generic//.
--  
--  This work consists of the main source file magicnum.dtx
--  and the derived files
--     magicnum.sty, magicnum.pdf, magicnum.ins, magicnum.drv, magicnum.txt,
--     magicnum-test1.tex, magicnum-test2.tex, magicnum-test3.tex,
--     magicnum-test4.tex, magicnum.lua, oberdiek.magicnum.lua.
--  
module("oberdiek.magicnum", package.seeall)
function getversion()
  tex.write("2011/04/10 v1.4")
end
local data = {
  ["tex.catcode"] = {
    [0] = "escape",
    [1] = "begingroup",
    [2] = "endgroup",
    [3] = "math",
    [4] = "align",
    [5] = "eol",
    [6] = "parameter",
    [7] = "superscript",
    [8] = "subscript",
    [9] = "ignore",
    [10] = "space",
    [11] = "letter",
    [12] = "other",
    [13] = "active",
    [14] = "comment",
    [15] = "invalid",
    ["active"] = 13,
    ["align"] = 4,
    ["begingroup"] = 1,
    ["comment"] = 14,
    ["endgroup"] = 2,
    ["eol"] = 5,
    ["escape"] = 0,
    ["ignore"] = 9,
    ["invalid"] = 15,
    ["letter"] = 11,
    ["math"] = 3,
    ["other"] = 12,
    ["parameter"] = 6,
    ["space"] = 10,
    ["subscript"] = 8,
    ["superscript"] = 7
  },
  ["etex.grouptype"] = {
    [0] = "bottomlevel",
    [1] = "simple",
    [2] = "hbox",
    [3] = "adjustedhbox",
    [4] = "vbox",
    [5] = "align",
    [6] = "noalign",
    [8] = "output",
    [9] = "math",
    [10] = "disc",
    [11] = "insert",
    [12] = "vcenter",
    [13] = "mathchoice",
    [14] = "semisimple",
    [15] = "mathshift",
    [16] = "mathleft",
    ["adjustedhbox"] = 3,
    ["align"] = 5,
    ["bottomlevel"] = 0,
    ["disc"] = 10,
    ["hbox"] = 2,
    ["insert"] = 11,
    ["math"] = 9,
    ["mathchoice"] = 13,
    ["mathleft"] = 16,
    ["mathshift"] = 15,
    ["noalign"] = 6,
    ["output"] = 8,
    ["semisimple"] = 14,
    ["simple"] = 1,
    ["vbox"] = 4,
    ["vcenter"] = 12
  },
  ["etex.iftype"] = {
    [0] = "none",
    [1] = "char",
    [2] = "cat",
    [3] = "num",
    [4] = "dim",
    [5] = "odd",
    [6] = "vmode",
    [7] = "hmode",
    [8] = "mmode",
    [9] = "inner",
    [10] = "void",
    [11] = "hbox",
    [12] = "vbox",
    [13] = "x",
    [14] = "eof",
    [15] = "true",
    [16] = "false",
    [17] = "case",
    [18] = "defined",
    [19] = "csname",
    [20] = "fontchar",
    ["case"] = 17,
    ["cat"] = 2,
    ["char"] = 1,
    ["csname"] = 19,
    ["defined"] = 18,
    ["dim"] = 4,
    ["eof"] = 14,
    ["false"] = 16,
    ["fontchar"] = 20,
    ["hbox"] = 11,
    ["hmode"] = 7,
    ["inner"] = 9,
    ["mmode"] = 8,
    ["none"] = 0,
    ["num"] = 3,
    ["odd"] = 5,
    ["true"] = 15,
    ["vbox"] = 12,
    ["vmode"] = 6,
    ["void"] = 10,
    ["x"] = 13
  },
  ["etex.nodetype"] = {
    [-1] = "none",
    [0] = "char",
    [1] = "hlist",
    [2] = "vlist",
    [3] = "rule",
    [4] = "ins",
    [5] = "mark",
    [6] = "adjust",
    [7] = "ligature",
    [8] = "disc",
    [9] = "whatsit",
    [10] = "math",
    [11] = "glue",
    [12] = "kern",
    [13] = "penalty",
    [14] = "unset",
    [15] = "maths",
    ["adjust"] = 6,
    ["char"] = 0,
    ["disc"] = 8,
    ["glue"] = 11,
    ["hlist"] = 1,
    ["ins"] = 4,
    ["kern"] = 12,
    ["ligature"] = 7,
    ["mark"] = 5,
    ["math"] = 10,
    ["maths"] = 15,
    ["none"] = -1,
    ["penalty"] = 13,
    ["rule"] = 3,
    ["unset"] = 14,
    ["vlist"] = 2,
    ["whatsit"] = 9
  },
  ["etex.interactionmode"] = {
    [0] = "batch",
    [1] = "nonstop",
    [2] = "scroll",
    [3] = "errorstop",
    ["batch"] = 0,
    ["errorstop"] = 3,
    ["nonstop"] = 1,
    ["scroll"] = 2
  },
  ["luatex.pdfliteral.mode"] = {
    [0] = "setorigin",
    [1] = "page",
    [2] = "direct",
    ["direct"] = 2,
    ["page"] = 1,
    ["setorigin"] = 0
  }
}
function get(name)
  local startpos, endpos, category, entry =
      string.find(name, "^(%a[%a%d%.]*)%.(-?[%a%d]+)$")
  if not entry then
    return
  end
  local node = data[category]
  if not node then
    return
  end
  local num = tonumber(entry)
  local value
  if num then
    value = node[num]
    if not value then
      return
    end
  else
    value = node[entry]
    if not value then
      return
    end
    value = "" .. value
  end
  tex.write(value)
end
-- 
--  End of File `oberdiek.magicnum.lua'.
