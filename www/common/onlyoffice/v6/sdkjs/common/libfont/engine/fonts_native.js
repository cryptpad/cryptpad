/*
 * (c) Copyright Ascensio System SIA 2010-2019
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at 20A-12 Ernesta Birznieka-Upisha
 * street, Riga, Latvia, EU, LV-1050.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */

(function(window, undefined) {

window['AscFonts'] = window['AscFonts'] || {};
var AscFonts = window['AscFonts'];

var g_native_engine = CreateNativeTextMeasurer();

function CReturnObject()
{
	this.error = 0;
}
CReturnObject.prototype.free = function()
{
};

let g_return_obj = new CReturnObject();
let g_return_obj_count = new CReturnObject();
g_return_obj_count.count = 0;

AscFonts.CopyStreamToMemory = function(data, size)
{
	return data;
};

function CShapeString(size)
{
	this.size = size;
	this.pointer = new Uint8Array(size);
}
CShapeString.prototype.getBuffer = function()
{
	return this.pointer;
};
CShapeString.prototype.free = function()
{
	// GC
};
CShapeString.prototype.set = function(index, value)
{
	this.pointer[index] = value;
};

AscFonts.AllocString = function(size)
{
	return new CShapeString(size);
};

AscFonts.FT_CreateLibrary = function(library) 
{ 
	return g_native_engine["FT_Init"](library); 
};
AscFonts.FT_Done_Library = function(face)
{
	if (face) 
		g_native_engine.FT_Free(face);
};
AscFonts.FT_Set_TrueType_HintProp = function(library, tt_interpreter) 
{ 
	return g_native_engine["FT_Set_TrueType_HintProp"](library, tt_interpreter); 
};

AscFonts.FT_Open_Face = function(library, memory, len, face_index)
{
	return g_native_engine["FT_Open_Face2"](library, memory, face_index);
};
AscFonts.FT_Done_Face = function(face)
{
	if (face) 
		g_native_engine["FT_Free"](face);
};
AscFonts.FT_SetCMapForCharCode = function(face, unicode) 
{ 
	return g_native_engine["FT_SetCMapForCharCode"](face, unicode); 
};
AscFonts.FT_GetKerningX = function(face, gid1, gid2) 
{ 
	return g_native_engine["FT_GetKerningX"](face, gid1, gid2); 
};
AscFonts.FT_GetFaceMaxAdvanceX = function(face) 
{ 
	return g_native_engine["FT_GetFaceMaxAdvanceX"](face); 
};
AscFonts.FT_Set_Transform = function(face, xx, yx, xy, yy) 
{ 
	return g_native_engine["FT_Set_Transform"](face, xx, yx, xy, yy); 
};
AscFonts.FT_Set_Char_Size = function(face, cw, ch, hres, vres) 
{ 
	return g_native_engine["FT_Set_Char_Size"](face, cw, ch, hres, vres); 
};
AscFonts.FT_GetFaceInfo = function(face, reader)
{
	var data = g_native_engine["FT_GetFaceInfo"](face);
	if (!data)
	{
		g_return_obj.error = 1;
		return g_return_obj;
	}

	g_return_obj.error = 0;
	reader.init(data, 0, data.length);
	return g_return_obj;
};

AscFonts.FT_Load_Glyph = function(face, gid, mode) 
{ 
	return g_native_engine["FT_Load_Glyph"](face, gid, mode); 
};
AscFonts.FT_SetCMapForCharCode = function(face, unicode)
{
	return g_native_engine["FT_SetCMapForCharCode"](face, unicode); 
}
AscFonts.FT_Get_Glyph_Measure_Params = function(face, vector_worker, reader)
{
	var data = g_native_engine["FT_Get_Glyph_Measure_Params"](face, vector_worker ? true : false);
	if (!data)
	{
		g_return_obj_count.error = 1;
		return g_return_obj_count;
	}

	reader.init(new Uint8Array(data, 0, data.length));
	g_return_obj_count.count = reader.readInt();
	g_return_obj_count.error = 0;
	return g_return_obj_count;
};
AscFonts.FT_Get_Glyph_Render_Params = function(face, render_mode, reader)
{
	var data = g_native_engine["FT_Get_Glyph_Render_Params"](face, render_mode);
	if (!data)
	{
		g_return_obj.error = 1;
		return g_return_obj;
	}

	g_return_obj.error = 0;
	reader.init(data, 0, data.length);
	return g_return_obj;
};
AscFonts.FT_Get_Glyph_Render_Buffer = function(face, size)
{
	return g_native_engine["FT_Get_Glyph_Render_Buffer"](face, size);
};

let hb_cache_languages = {};
AscFonts.HB_FontFree = function(font)
{
	if (font) 
		g_native_engine["FT_Free"](font);
}
AscFonts.HB_ShapeText = function(fontFile, text, features, script, direction, language, reader)
{
	if (!hb_cache_languages[language])
	{
		hb_cache_languages[language] = g_native_engine["HB_LanguageFromString"]();
	}

	if (!fontFile["GetHBFont"]())
		fontFile["SetHBFont"](g_native_engine["HB_FontMalloc"]());

	let data = g_native_engine["HB_ShapeText"](fontFile["GetFace"](), fontFile["GetHBFont"](), text.pointer, features, script, direction, hb_cache_languages[language]);
	if (!data)
	{
		g_return_obj_count.error = 1;
		return g_return_obj_count;
	}

	reader.init(new Uint8Array(data, 0, data.length));
	let len = reader.readUInt();
	let fontPointer = reader.readPointer64(); // just skip

	g_return_obj_count.count = (len - 12) / 26;
	g_return_obj_count.error = 0;
	return g_return_obj_count;
};

AscFonts.onLoadModule();
AscFonts.onLoadModule();

})(window, undefined);
