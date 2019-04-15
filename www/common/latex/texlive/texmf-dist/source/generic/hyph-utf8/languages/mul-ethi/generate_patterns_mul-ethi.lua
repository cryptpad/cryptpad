#!/usr/bin/env texlua

-- Extract Ethiopic syllables from the Unicode Character Database.
-- Arthur Reutenauer, London, 2011, for the hyph-utf8 project
-- http://tug.org/tex-hyphen
-- Copyright (c) TeX Users Group, 2011.
-- You may freely use, copy, modify and / or redistribute this file.

-- Use with TeXLua.

-- Small library to convert a hexadecimal string to a number
local function hex_digit_to_num(h)
  local c = string.byte(h)
  if c >= 48 and c < 58
  then return c - 48
  elseif c >= 65 and c < 71
  then return c - 55
  elseif c >= 97 and c < 103
  then return c - 87
  end
  return 0
end

local function hex_string_to_num(hex)
  local n = 0
  for i = 1, string.len(hex) do
    n = 16 * n + hex_digit_to_num(string.sub(hex, i, i + 1))
  end
  return n
end

local ucd_file = "UnicodeData.txt"

local error_install_ucd = [[
Error: the Unicode Character Database could not be found.
Please download it from http://www.unicode.org/Public/UNIDATA/UnicodeData.txt
and install it in the current directory.]]

if not lfs.attributes(ucd_file) then
  print(error_install_ucd)
  return -1
end

local P, R, C, match = lpeg.P, lpeg.R, lpeg.C, lpeg.match

local digit = R"09" + R"AF"
local colon = P";"
local field = (1 - colon)^0
local eth_syll = P"ETHIOPIC SYLLABLE " * C(field)
local ucd_entry = C(digit^4) * colon * eth_syll

local pattfile = assert(io.open("hyph-mul-ethi.tex", "w"))

pattfile:write[[
% Experimental pattern file for languages written using the Ethiopic script.
% Arthur Reutenauer, London, 2011, for the hyph-utf8 project.
% Copyright (c) TeX Users Group, 2011.
% You may freely use, copy, modify and / or redistribute this file.
%
% This is a generated file.  If you wish to edit it, consider adapting the
% generating programme
% (svn://tug.org/texhyphen/trunk/hyph-utf8/source/generic/hyph-utf8/languages/mul-ethi/generate_patterns_mul-ethi.lua).
%
% The BCP 47 language tag for that file is "mul-ethi" to reflect the fact that
% it can be used by multiple languages (and a single script, Ethiopic).  It is,
% though, not supposed to be linguistically relevant and should, for proper
% typography, be replaced by files tailored to individual languages.  What we
% do for the moment is to simply allow break on either sides of Ethiopic
% syllables, and to forbid it before some punctuation marks particular to
% the Ethiopic script (which we thus make letters for this purpose).

]]

pattfile:write"\\patterns{%\n"
for ucd_line in io.lines(ucd_file) do
  local usv, char_name = match(ucd_entry, ucd_line)
  -- print(string.format("%04X", usv))
  -- if usv then print(usv, char_name) end
  if usv then
    -- arbitrarily excluding Ethiopic Extended-A
    -- because they're not in unicode-letters.tex
    local hex = hex_string_to_num(usv)
    if hex < 0xAB00  then
      local hex = hex_string_to_num
      pattfile:write("1", unicode.utf8.char(hex_string_to_num(usv)), "1 ")
      pattfile:write("% U+", usv, " ", char_name:lower(), "\n")
    end
  end
end

pattfile:write("2", unicode.utf8.char(0x1361), "1 % U+1361 ETHIOPIC WORDSPACE\n")
pattfile:write("2", unicode.utf8.char(0x1362), "1 % U+1362 ETHIOPIC FULL STOP\n")

pattfile:write"}"

assert(io.close(pattfile))
