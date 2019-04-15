-- 
--  This is file `luacolor-pre065.lua',
--  generated with the docstrip utility.
-- 
--  The original source files were:
-- 
--  luacolor.dtx  (with options: `lua,pre065')
--  
--  This is a generated file.
--  
--  Project: luacolor
--  Version: 2011/11/01 v1.8
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
--  This work consists of the main source file luacolor.dtx
--  and the derived files
--     luacolor.sty, luacolor.pdf, luacolor.ins, luacolor.drv,
--     luacolor-test1.tex, luacolor-test2.tex, luacolor-test3.tex,
--     oberdiek.luacolor.lua, luacolor.lua,
--     oberdiek.luacolor-pre065.lua, luacolor-pre065.lua.
--  
module("oberdiek.luacolor", package.seeall)
function getversion()
  tex.write("2011/11/01 v1.8")
end
local ifpdf
if tonumber(tex.pdfoutput) > 0 then
  ifpdf = true
else
  ifpdf = false
end
local prefix
local prefixes = {
  dvips   = "color ",
  dvipdfm = "pdf:sc ",
  truetex = "textcolor:",
  pctexps = "ps::",
}
local patterns = {
  ["^color "]            = "dvips",
  ["^pdf: *begincolor "] = "dvipdfm",
  ["^pdf: *bcolor "]     = "dvipdfm",
  ["^pdf: *bc "]         = "dvipdfm",
  ["^pdf: *setcolor "]   = "dvipdfm",
  ["^pdf: *scolor "]     = "dvipdfm",
  ["^pdf: *sc "]         = "dvipdfm",
  ["^textcolor:"]        = "truetex",
  ["^ps::"]              = "pctexps",
}
local function info(msg, term)
  local target = "log"
  if term then
    target = "term and log"
  end
  texio.write_nl(target, "Package luacolor info: " .. msg .. ".")
  texio.write_nl(target, "")
end
function dvidetect()
  local v = tex.box[0]
  assert(v.id == node.id("hlist"))
  for v in node.traverse_id(node.id("whatsit"), v.list) do
    if v and v.subtype == node.subtype("special") then
      local data = v.data
      for pattern, driver in pairs(patterns) do
        if string.find(data, pattern) then
          prefix = prefixes[driver]
          tex.write(driver)
          return
        end
      end
      info("\\special{" .. data .. "}", true)
      return
    end
  end
  info("Missing \\special", true)
end
local map = {
  n = 0,
}
function get(color)
  tex.write("" .. getvalue(color))
end
function getvalue(color)
  local n = map[color]
  if not n then
    n = map.n + 1
    map.n = n
    map[n] = color
    map[color] = n
  end
  return n
end
local attribute
function setattribute(attr)
  attribute = attr
end
function getattribute()
  return attribute
end
local LIST = 1
local LIST_LEADERS = 2
local COLOR = 3
local RULE = node.id("rule")
local node_types = {
  [node.id("hlist")] = LIST,
  [node.id("vlist")] = LIST,
  [node.id("rule")]  = COLOR,
  [node.id("glyph")] = COLOR,
  [node.id("disc")]  = COLOR,
  [node.id("whatsit")] = {
    [node.subtype("special")] = COLOR,
    [node.subtype("pdf_literal")] = COLOR,
    [node.subtype("pdf_refximage")] = COLOR,
  },
  [node.id("glue")] =
    function(n)
      if n.subtype >= 100 then -- leaders
        if n.leader.id == RULE then
          return COLOR
        else
          return LIST_LEADERS
        end
      end
    end,
}
local function get_type(n)
  local ret = node_types[n.id]
  if type(ret) == 'table' then
    ret = ret[n.subtype]
  end
  if type(ret) == 'function' then
    ret = ret(n)
  end
  return ret
end
local mode = 2 -- luatex.pdfliteral.direct
local WHATSIT = node.id("whatsit")
local SPECIAL = 3
local PDFLITERAL = 8
local DRY_FALSE = false
local DRY_TRUE = true
local function traverse(list, color, dry)
  if not list then
    return color
  end
  if get_type(list) ~= LIST then
    texio.write_nl("!!! Error: Wrong list type: " .. node.type(list.id))
    return color
  end
  local head = list.list
  for n in node.traverse(head) do
    local t = get_type(n)
    if t == LIST then
      color = traverse(n, color, dry)
    elseif t == LIST_LEADERS then
      local color_after = traverse(n.leader, color, DRY_TRUE)
      if color == color_after then
        traverse(n.leader, color, DRY_FALSE or dry)
      else
        traverse(n.leader, '', DRY_FALSE or dry)
        color = ''
      end
    elseif t == COLOR then
      local v = node.has_attribute(n, attribute)
      if v then
        local newColor = map[v]
        if newColor ~= color then
          color = newColor
          if dry == DRY_FALSE then
            local newNode
            if ifpdf then
              newNode = node.new(WHATSIT, PDFLITERAL)
              newNode.mode = mode
              newNode.data = color
            else
              newNode = node.new(WHATSIT, SPECIAL)
              newNode.data = prefix .. color
            end
            if head == n then
              newNode.next = head
              local old_prev = head.prev
              head.prev = newNode
              head = newNode
              head.prev = old_prev
            else
              head = node.insert_before(head, n, newNode)
            end
          end
        end
      end
    end
  end
  list.list = head
  return color
end
function process(box)
  local color = ""
  local list = tex.getbox(box)
  traverse(list, color, DRY_FALSE)
end
-- 
--  End of File `luacolor-pre065.lua'.
