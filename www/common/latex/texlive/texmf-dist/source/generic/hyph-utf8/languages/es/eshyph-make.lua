-- (encoding:utf-8)

-- (c) Javier Bezos 2009
-- License: LPPL. v. 4.5

patfile = io.open('eshyph.tex', 'w')
patfile:write('\\patterns{\n')

-- Basic patters
-- Using the characters iterator in luatex

digraphs = 'ch ll'
liquids =  'bl cl fl gl kl pl vl br cr dr fr gr kr pr rr tr vr'
avoid = 'tl'
silent = 'h'
letters = 'bcdfghjklmnpqrstvwxyz'

for n in letters:gmatch('.') do
  if silent:find(n) then
    patfile:write('2' .. n .. '.')
  else
    patfile:write('1' .. n .. ' 2' .. n .. '.')
  end
  for m in letters:gmatch('.')  do
    pat = n .. m
    if digraphs:find(pat) then
      patfile:write(' ' .. n .. '4'.. m .. ' 2' .. pat .. '.')
    elseif liquids:find(pat) then
      patfile:write(' ' .. n .. '2'.. m .. ' 2' .. pat .. '.')
    elseif avoid:find(pat) then
      patfile:write(' 2' .. n .. '2'.. m)
    elseif silent:find(m) then
	  patfile:write(' 2' .. n .. '1' .. m)
    else
      patfile:write(' 2' .. pat)
    end
  end
  patfile:write('\n')
end

patfile:write('1ñ 2ñ.\n')

letters = 'bcdlmnrstxy'
etim = 'pt ct cn ps mn gn ft pn cz tz ts'

for n in etim:gmatch('%S+') do
  for m in letters:gmatch('.') do
    patfile:write('2' .. m .. '3' .. n:sub(1,1) .. '2' .. n:sub(2,2) .. ' ')
  end
  patfile:write('4' .. n .. '.\n')
end

src = io.open('eshyph.src')

function prefix(p)
  if p:match('r$') then
    p = p:sub(1,-2) .. '2' .. p:sub(-1) .. '1'
    patfile:write(p:sub(1,-2) .. '3r\n')
  elseif p:match('[aeiou]$') then
    p = p .. '1'
    patfile:write(p .. 'h\n')
  end 
  patfile:write(p .. 'a2 ' .. p .. 'e2 ' .. p .. 'i2 ' .. p .. 'o2 ' .. p .. 'u2\n')
  patfile:write(p .. 'á2 ' .. p .. 'é2 ' .. p .. 'í2 ' .. p .. 'ó2 ' .. p .. 'ú2\n')

end

for ln in src:lines() do
  ln = ln:match('[^%%]*')
  for p in ln:gmatch('%S+') do
    if p:match('/(.*)/') then
      prefix(p:match('/(.*)/'))
    elseif p:sub(1,1) == '*' then
      patfile:write('de2s3' .. p:sub(2) .. '\n')
    else
      patfile:write(p .. '\n')
    end
  end
end

patfile:write('}')
patfile:close()
