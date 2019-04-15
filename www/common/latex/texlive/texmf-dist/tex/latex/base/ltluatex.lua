--
-- This is file `ltluatex.lua',
-- generated with the docstrip utility.
--
-- The original source files were:
--
-- ltluatex.dtx  (with options: `lua')
-- 
-- This is a generated file.
-- 
-- The source is maintained by the LaTeX Project team and bug
-- reports for it can be opened at http://latex-project.org/bugs.html
-- (but please observe conditions on bug reports sent to that address!)
-- 
-- 
-- Copyright 2015
-- The LaTeX3 Project and any individual authors listed elsewhere
-- in this file.
-- 
-- This file was generated from file(s) of the LaTeX base system.
-- --------------------------------------------------------------
-- 
-- It may be distributed and/or modified under the
-- conditions of the LaTeX Project Public License, either version 1.3c
-- of this license or (at your option) any later version.
-- The latest version of this license is in
--    http://www.latex-project.org/lppl.txt
-- and version 1.3c or later is part of all distributions of LaTeX
-- version 2005/12/01 or later.
-- 
-- This file has the LPPL maintenance status "maintained".
-- 
-- This file may only be distributed together with a copy of the LaTeX
-- base system. You may however distribute the LaTeX base system without
-- such generated files.
-- 
-- The list of all files belonging to the LaTeX base distribution is
-- given in the file `manifest.txt'. See also `legal.txt' for additional
-- information.
-- 
-- The list of derived (unpacked) files belonging to the distribution
-- and covered by LPPL is defined by the unpacking scripts (with
-- extension .ins) which are part of the distribution.
luatexbase       = luatexbase or { }
local luatexbase = luatexbase
local string_gsub      = string.gsub
local tex_count        = tex.count
local tex_setattribute = tex.setattribute
local tex_setcount     = tex.setcount
local texio_write_nl   = texio.write_nl
local modules = modules or { }
local function provides_module(info)
  if not (info and info.name) then
    luatexbase_error("Missing module name for provides_modules")
    return
  end
  local function spaced(text)
    return text and (" " .. text) or ""
  end
  texio_write_nl(
    "log",
    "Lua module: " .. info.name
      .. spaced(info.date)
      .. spaced(info.version)
      .. spaced(info.description)
  )
  modules[info.name] = info
end
luatexbase.provides_module = provides_module
local function msg_format(mod, msg_type, text)
  local leader = ""
  local cont
  if mod == "LaTeX" then
    cont = string_gsub(leader, ".", " ")
    leader = leader .. "LaTeX: "
  else
    first_head = leader .. "Module "  .. msg_type
    cont = "(" .. mod .. ")"
      .. string_gsub(first_head, ".", " ")
    first_head =  leader .. "Module "  .. mod .. " " .. msg_type  .. ":"
  end
  if msg_type == "Error" then
    first_head = "\n" .. first_head
  end
  if string.sub(text,-1) ~= "\n" then
    text = text .. " "
  end
  return first_head .. " "
    .. string_gsub(
         text
 .. "on input line "
         .. tex.inputlineno, "\n", "\n" .. cont .. " "
      )
   .. "\n"
end
local function module_info(mod, text)
  texio_write_nl("log", msg_format(mod, "Info", text))
end
luatexbase.module_info = module_info
local function module_warning(mod, text)
  texio_write_nl("term and log",msg_format(mod, "Warning", text))
end
luatexbase.module_warning = module_warning
local function module_error(mod, text)
  error(msg_format(mod, "Error", text))
end
luatexbase.module_error = module_error
local function luatexbase_warning(text)
  module_warning("luatexbase", text)
end
local function luatexbase_error(text)
  module_error("luatexbase", text)
end
local luaregisterbasetable = { }
local registermap = {
  attributezero = "assign_attr"    ,
  charzero      = "char_given"     ,
  CountZero     = "assign_int"     ,
  dimenzero     = "assign_dimen"   ,
  mathcharzero  = "math_given"     ,
  muskipzero    = "assign_mu_skip" ,
  skipzero      = "assign_skip"    ,
  tokszero      = "assign_toks"    ,
}
local i, j
local createtoken
if tex.luatexversion >79 then
 createtoken   = newtoken.create
end
local hashtokens    = tex.hashtokens
local luatexversion = tex.luatexversion
for i,j in pairs (registermap) do
  if luatexversion < 80 then
    luaregisterbasetable[hashtokens()[i][1]] =
      hashtokens()[i][2]
  else
    luaregisterbasetable[j] = createtoken(i).mode
  end
end
local registernumber
if luatexversion < 80 then
  function registernumber(name)
    local nt = hashtokens()[name]
    if(nt and luaregisterbasetable[nt[1]]) then
      return nt[2] - luaregisterbasetable[nt[1]]
    else
      return false
    end
  end
else
  function registernumber(name)
    local nt = createtoken(name)
    if(luaregisterbasetable[nt.cmdname]) then
      return nt.mode - luaregisterbasetable[nt.cmdname]
    else
      return false
    end
  end
end
luatexbase.registernumber = registernumber
local attributes=setmetatable(
{},
{
__index = function(t,key)
return registernumber(key) or nil
end}
)
luatexbase.attributes=attributes
local function new_attribute(name)
  tex_setcount("global", "e@alloc@attribute@count",
                          tex_count["e@alloc@attribute@count"] + 1)
  if tex_count["e@alloc@attribute@count"] > 65534 then
    luatexbase_error("No room for a new \\attribute")
    return -1
  end
  attributes[name]= tex_count["e@alloc@attribute@count"]
  texio_write_nl("Lua-only attribute " .. name .. " = " ..
                 tex_count["e@alloc@attribute@count"])
  return tex_count["e@alloc@attribute@count"]
end
luatexbase.new_attribute = new_attribute
local function new_whatsit(name)
  tex_setcount("global", "e@alloc@whatsit@count",
                         tex_count["e@alloc@whatsit@count"] + 1)
  if tex_count["e@alloc@whatsit@count"] > 65534 then
    luatexbase_error("No room for a new custom whatsit")
    return -1
  end
  texio_write_nl("Custom whatsit " .. (name or "") .. " = " ..
                 tex_count["e@alloc@whatsit@count"])
  return tex_count["e@alloc@whatsit@count"]
end
luatexbase.new_whatsit = new_whatsit
local function new_bytecode(name)
  tex_setcount("global", "e@alloc@bytecode@count",
                         tex_count["e@alloc@bytecode@count"] + 1)
  if tex_count["e@alloc@bytecode@count"] > 65534 then
    luatexbase_error("No room for a new bytecode register")
    return -1
  end
  texio_write_nl("Lua bytecode " .. (name or "") .. " = " ..
                 tex_count["e@alloc@bytecode@count"])
  return tex_count["e@alloc@bytecode@count"]
end
luatexbase.new_bytecode = new_bytecode
local function new_chunkname(name)
  tex_setcount("global", "e@alloc@luachunk@count",
                         tex_count["e@alloc@luachunk@count"] + 1)
  local chunkname_count = tex_count["e@alloc@luachunk@count"]
  chunkname_count = chunkname_count + 1
  if chunkname_count > 65534 then
    luatexbase_error("No room for a new chunkname")
    return -1
  end
  lua.name[chunkname_count]=name
  texio_write_nl("Lua chunkname " .. (name or "") .. " = " ..
                 chunkname_count .. "\n")
  return chunkname_count
end
luatexbase.new_chunkname = new_chunkname
local callbacklist = callbacklist or { }
local list, data, exclusive, simple = 1, 2, 3, 4
local types = {
  list      = list,
  data      = data,
  exclusive = exclusive,
  simple    = simple,
}
local callbacktypes = callbacktypes or {
  find_read_file     = exclusive,
  find_write_file    = exclusive,
  find_font_file     = data,
  find_output_file   = data,
  find_format_file   = data,
  find_vf_file       = data,
  find_map_file      = data,
  find_enc_file      = data,
  find_sfd_file      = data,
  find_pk_file       = data,
  find_data_file     = data,
  find_opentype_file = data,
  find_truetype_file = data,
  find_type1_file    = data,
  find_image_file    = data,
  open_read_file     = exclusive,
  read_font_file     = exclusive,
  read_vf_file       = exclusive,
  read_map_file      = exclusive,
  read_enc_file      = exclusive,
  read_sfd_file      = exclusive,
  read_pk_file       = exclusive,
  read_data_file     = exclusive,
  read_truetype_file = exclusive,
  read_type1_file    = exclusive,
  read_opentype_file = exclusive,
  process_input_buffer  = data,
  process_output_buffer = data,
  process_jobname       = data,
  token_filter          = exclusive,
  buildpage_filter      = simple,
  pre_linebreak_filter  = list,
  linebreak_filter      = list,
  post_linebreak_filter = list,
  hpack_filter          = list,
  vpack_filter          = list,
  pre_output_filter     = list,
  hyphenate             = simple,
  ligaturing            = simple,
  kerning               = simple,
  mlist_to_hlist        = list,
  pre_dump            = simple,
  start_run           = simple,
  stop_run            = simple,
  start_page_number   = simple,
  stop_page_number    = simple,
  show_error_hook     = simple,
  show_error_message  = simple,
  show_lua_error_hook = simple,
  start_file          = simple,
  stop_file           = simple,
  finish_pdffile = data,
  finish_pdfpage = data,
  define_font = exclusive,
  find_cidmap_file           = data,
  pdf_stream_filter_callback = data,
}
luatexbase.callbacktypes=callbacktypes
local callback_register = callback_register or callback.register
function callback.register()
  luatexbase_error("Attempt to use callback.register() directly\n")
end
local function data_handler(name)
  return function(data, ...)
    local i
    for _,i in ipairs(callbacklist[name]) do
      data = i.func(data,...)
    end
    return data
  end
end
local function exclusive_handler(name)
  return function(...)
    return callbacklist[name][1].func(...)
  end
end
local function list_handler(name)
  return function(head, ...)
    local ret
    local alltrue = true
    local i
    for _,i in ipairs(callbacklist[name]) do
      ret = i.func(head, ...)
      if ret == false then
        luatexbase_warning(
          "Function `i.description' returned false\n"
            .. "in callback `name'"
         )
         break
      end
      if ret ~= true then
        alltrue = false
        head = ret
      end
    end
    return alltrue and true or head
  end
end
local function simple_handler(name)
  return function(...)
    local i
    for _,i in ipairs(callbacklist[name]) do
      i.func(...)
    end
  end
end
local handlers = {
  [data]      = data_handler,
  [exclusive] = exclusive_handler,
  [list]      = list_handler,
  [simple]    = simple_handler,
}
local user_callbacks_defaults = { }
local function create_callback(name, ctype, default)
  if not name or
    name == "" or
    callbacktypes[name] or
    not(default == false or  type(default) == "function")
    then
      luatexbase_error("Unable to create callback " .. name)
  end
  user_callbacks_defaults[name] = default
  callbacktypes[name] = types[ctype]
end
luatexbase.create_callback = create_callback
local function call_callback(name,...)
  if not name or
    name == "" or
    user_callbacks_defaults[name] == nil
    then
        luatexbase_error("Unable to call callback " .. name)
  end
  local l = callbacklist[name]
  local f
  if not l then
    f = user_callbacks_defaults[name]
    if l == false then
   return nil
 end
  else
    f = handlers[callbacktypes[name]](name)
  end
  return f(...)
end
luatexbase.call_callback=call_callback
local function add_to_callback(name, func, description)
  if
    not name or
    name == "" or
    not callbacktypes[name] or
    type(func) ~= "function" or
    not description or
    description == "" then
    luatexbase_error(
      "Unable to register callback.\n\n"
        .. "Correct usage:\n"
        .. "add_to_callback(<callback>, <function>, <description>)"
    )
    return
  end
  local l = callbacklist[name]
  if l == nil then
    l = { }
    callbacklist[name] = l
    if user_callbacks_defaults[name] == nil then
      callback_register(name, handlers[callbacktypes[name]](name))
    end
  end
  local f = {
    func        = func,
    description = description,
  }
  local priority = #l + 1
  if callbacktypes[name] == exclusive then
    if #l == 1 then
      luatexbase_error(
        "Cannot add second callback to exclusive function\n`" ..
        name .. "'")
    end
  end
  table.insert(l, priority, f)
  texio_write_nl(
    "Inserting `" .. description .. "' at position "
      .. priority .. " in `" .. name .. "'."
  )
end
luatexbase.add_to_callback = add_to_callback
local function remove_from_callback(name, description)
  if
    not name or
    name == "" or
    not callbacktypes[name] or
    not description or
    description == "" then
    luatexbase_error(
      "Unable to remove function from callback.\n\n"
        .. "Correct usage:\n"
        .. "remove_from_callback(<callback>, <description>)"
    )
    return
  end
  local l = callbacklist[name]
  if not l then
    luatexbase_error(
      "No callback list for `" .. name .. "'\n")
  end
  local index = false
  local i,j
  local cb = {}
  for i,j in ipairs(l) do
    if j.description == description then
      index = i
      break
    end
  end
  if not index then
    luatexbase_error(
      "No callback `" .. description .. "' registered for `" ..
      name .. "'\n")
    return
  end
  cb = l[index]
  table.remove(l, index)
  texio_write_nl(
    "Removing  `" .. description .. "' from `" .. name .. "'."
  )
  if #l == 0 then
    callbacklist[name] = nil
    callback_register(name, nil)
  end
  return cb.func,cb.description
end
luatexbase.remove_from_callback = remove_from_callback
local function in_callback(name, description)
  if not name
    or name == ""
    or not callbacktypes[name]
    or not description then
      return false
  end
  local i
  for _, i in pairs(callbacklist[name]) do
    if i.description == description then
      return true
    end
  end
  return false
end
luatexbase.in_callback = in_callback
local function disable_callback(name)
  if(callbacklist[name] == nil) then
    callback_register(name, false)
  else
    luatexbase_error("Callback list for " .. name .. " not empty")
  end
end
luatexbase.disable_callback = disable_callback
local function callback_descriptions (name)
  local d = {}
  if not name
    or name == ""
    or not callbacktypes[name]
    then
    return d
  else
  local i
  for k, i in pairs(callbacklist[name] or {}) do
    d[k]= i.description
    end
  end
  return d
end
luatexbase.callback_descriptions =callback_descriptions
local function uninstall()
  module_info(
    "luatexbase",
    "Uninstalling kernel luatexbase code"
  )
  callback.register = callback_register
  luatexbase = nil
end
luatexbase.uninstall = uninstall
