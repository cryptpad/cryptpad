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

"use strict";
function CNativeGraphics()
{
    this.Native = CreateNativeGraphics();

    this.isNativeGraphics = true;

    this.width        = 0;
    this.height       = 0;
    this.m_dWidthMM   = 0;
    this.m_dHeightMM  = 0;
    this.m_lWidthPix  = 0;
    this.m_lHeightPix = 0;
    this.m_dDpiX      = 96.0;
    this.m_dDpiY      = 96.0;

    this.TextureFillTransformScaleX = 1;
    this.TextureFillTransformScaleY = 1;

    this.m_oFontManager2 = null;
    this.dash_no_smart   = null;
    this.m_oLastFont2    = null;
    this.TextClipRect    = null;
    this.ArrayPoints     = null;
    this.MaxEpsLine      = null;
    this.m_oContext      = null;
    this.m_oTextPr       = null;

    this.m_oGrFonts = {
        Ascii    : {Name : "", Index : -1}, 
        EastAsia : {Name : "", Index : -1}, 
        HAnsi    : {Name : "", Index : -1}, 
        CS       : {Name : "", Index : -1}
    };

    this.RENDERER_PDF_FLAG   = true;

    this.IsSlideBoundsCheckerType = false;
    this.IsDemonstrationMode      = false;
    this.IsNoSupportTextDraw      = false;
    this.AutoCheckLineWidth       = false;
    this.m_bBrushColorInit        = false;
    this.m_bPenColorInit          = false;
    this.Start_Command            = false;
    this.IsClipContext            = false;
    this.End_Command              = false;
    this.IsUseFonts2              = false;
    this.IsThumbnail              = false;
    this.updatedRect              = false;
    this.m_bIsBreak               = false;
    this.bDrawSmart               = false;
    this.ClearMode                = false;
    this.IsRetina                 = false;
    this.IsTrack                  = false;
}

CNativeGraphics.prototype =
{
    create : function(nativecontrol, width_px, height_px, width_mm, height_mm)
    {
        this.TextureFillTransformScaleX = width_mm  / (width_px  >> 0);
        this.TextureFillTransformScaleY = height_mm / (height_px >> 0);
        this.Native["create"](nativecontrol, width_px, height_px, width_mm, height_mm);
    },
    EndDraw : function()
    {
        // this.Native["EndDraw"]();
    },
    put_GlobalAlpha : function(enable, alpha)
    {
        this.Native["put_GlobalAlpha"](enable, alpha);
    },
    Start_GlobalAlpha : function()
    {
        // this.Native["Start_GlobalAlpha"]();
    },
    End_GlobalAlpha : function()
    {
        this.Native["End_GlobalAlpha"]();
    },
    // pen methods
    p_color : function(r, g, b, a)
    {
        this.Native["p_color"](r, g, b, a);
    },
    p_width : function(w)
    {
        this.Native["p_width"](w);
    },
    p_dash : function(params)
    {
        this.Native["p_dash"](params ? params : []);
    },
    // brush methods
    b_color1 : function(r, g, b, a)
    {
        this.Native["b_color1"](r, g, b, a);
    },
    b_color2 : function(r, g, b, a)
    {
        this.Native["b_color2"](r, g, b, a);
    },
    transform : function(sx, shy, shx, sy, tx, ty)
    {
        this.Native["transform"](sx, shy, shx, sy, tx, ty);
    },
    CalculateFullTransform : function(isInvertNeed)
    {
        this.Native["CalculateFullTransform"](isInvertNeed);
    },
    // path commands
    _s : function()
    {
        this.Native["_s"]();
    },
    _e : function()
    {
        this.Native["_e"]();
    },
    _z : function()
    {
        this.Native["_z"]();
    },
    _m : function(x, y)
    {
        this.Native["_m"](x, y);
        
        if (false === this.GetIntegerGrid() && this.ArrayPoints != null)
            this.ArrayPoints[this.ArrayPoints.length] = {x: x, y: y};
    },
    _l : function(x, y)
    {
        this.Native["_l"](x, y);
        
        if (false === this.GetIntegerGrid() && this.ArrayPoints != null)
            this.ArrayPoints[this.ArrayPoints.length] = {x: x, y: y};
    },
    _c : function(x1, y1, x2, y2, x3, y3)
    {
        this.Native["_c"](x1, y1, x2, y2, x3, y3);
        
        if (false === this.GetIntegerGrid() && this.ArrayPoints != null)
        {
            this.ArrayPoints[this.ArrayPoints.length] = {x: x1, y: y1};
            this.ArrayPoints[this.ArrayPoints.length] = {x: x2, y: y2};
            this.ArrayPoints[this.ArrayPoints.length] = {x: x3, y: y3};
        }
    },
    _c2 : function(x1, y1, x2, y2)
    {
        this.Native["_c2"](x1, y1, x2, y2);
        
        if (false === this.GetIntegerGrid() && this.ArrayPoints != null)
        {
            this.ArrayPoints[this.ArrayPoints.length] = {x: x1, y: y1};
            this.ArrayPoints[this.ArrayPoints.length] = {x: x2, y: y2};
        }
    },
    ds : function()
    {
        this.Native["ds"]();
    },
    df : function()
    {
        this.Native["df"]();
    },
    // canvas state
    save : function()
    {
        this.Native["save"]();
    },
    restore : function()
    {
        this.Native["restore"]();
    },
    clip : function()
    {
        this.Native["clip"]();
    },
    reset : function()
    {
        this.Native["reset"]();
    },
    transform3 : function(m, isNeedInvert)
    {
        this.Native["transform"](m.sx, m.shy, m.shx, m.sy, m.tx, m.ty);
    },
    FreeFont : function()
    {
        // this.Native["FreeFont"]();
    },
    ClearLastFont : function()
    {
        // this.Native["ClearLastFont"]();
    },
    // images
    drawImage2 : function(img, x, y, w, h, alpha, srcRect)
    {
        this.Native["drawImage2"](img, x, y, w, h, alpha, srcRect);
    },
    drawImage : function(img, x, y, w, h, alpha, srcRect, nativeImage)
    {
        this.Native["drawImage"](img, x, y, w, h, alpha, srcRect, nativeImage);
    },
    // text
    GetFont : function()
    {
        return this.Native["GetFont"]();
    },
    font : function(font_id, font_size)
    {
        this.Native["font"](font_id, font_size);
    },
    SetFont : function(font)
    {
        if (null == font)
            return;

        var flag = 0;
        if (font.Bold)    flag |= 0x01;
        if (font.Italic)  flag |= 0x02;
        if (font.Bold)    flag |= 0x04;
        if (font.Italic)  flag |= 0x08;

        this.Native["SetFont"](font.FontFamily.Name, font.FontFamily.Index, font.FontSize, flag);
    },
    SetTextPr : function(textPr, theme)
    {
        this.m_oTextPr = textPr;
        if (theme)
        {
            this.m_oGrFonts.Ascii.Name     = theme.themeElements.fontScheme.checkFont(this.m_oTextPr.RFonts.Ascii    ? this.m_oTextPr.RFonts.Ascii.Name    : null);
            this.m_oGrFonts.EastAsia.Name  = theme.themeElements.fontScheme.checkFont(this.m_oTextPr.RFonts.EastAsia ? this.m_oTextPr.RFonts.EastAsia.Name : null);
            this.m_oGrFonts.HAnsi.Name     = theme.themeElements.fontScheme.checkFont(this.m_oTextPr.RFonts.HAnsi    ? this.m_oTextPr.RFonts.HAnsi.Name    : null);
            this.m_oGrFonts.CS.Name        = theme.themeElements.fontScheme.checkFont(this.m_oTextPr.RFonts.CS       ? this.m_oTextPr.RFonts.CS.Name       : null);
            this.m_oGrFonts.Ascii.Index    = -1;
            this.m_oGrFonts.EastAsia.Index = -1;
            this.m_oGrFonts.HAnsi.Index    = -1;
            this.m_oGrFonts.CS.Index       = -1;
        }
        else
        {
            this.m_oGrFonts = this.m_oTextPr.RFonts;
        }
    },

    SetFontInternal : function(name, size, style)
    {
        this.Native["SetFont"](name, -1, size, style);
    },

    SetFontSlot : function(slot, fontSizeKoef)
    {
        var _lastFont = {FontFamily : {Name : "Arial", Index : -1}, FontSize : 16, Italic : true, Bold : true};
        switch(slot) 
        {
            case 0: // fontslot_ASCII
            {
                _lastFont.FontFamily.Name = this.m_oGrFonts.Ascii.Name;
                _lastFont.FontSize = this.m_oTextPr.FontSize;
                _lastFont.Bold     = this.m_oTextPr.Bold;
                _lastFont.Italic   = this.m_oTextPr.Italic;
                break;
            }
            case 1: // fontslot_EastAsia
            {
                  _lastFont.FontFamily.Name = this.m_oGrFonts.EastAsia.Name;
                  _lastFont.FontSize = this.m_oTextPr.FontSize;
                  _lastFont.Bold     = this.m_oTextPr.Bold;
                  _lastFont.Italic   = this.m_oTextPr.Italic;
                  break;
            }
            case 2: // fontslot_CS
            {
                _lastFont.FontFamily.Name = this.m_oGrFonts.CS.Name;
                _lastFont.FontSize = this.m_oTextPr.FontSizeCS;
                _lastFont.Bold     = this.m_oTextPr.BoldCS;
                _lastFont.Italic   = this.m_oTextPr.ItalicCS;
                break;
            }
            case 3: // fontslot_HAnsi
            default:
            {
                _lastFont.FontFamily.Name = this.m_oGrFonts.HAnsi.Name;
                _lastFont.FontSize = this.m_oTextPr.FontSize;
                _lastFont.Bold     = this.m_oTextPr.Bold;
                _lastFont.Italic   = this.m_oTextPr.Italic;
                break;
            }
        }
        if (undefined !== fontSizeKoef)
        {
            _lastFont.FontSize *= fontSizeKoef;
        }
        this.SetFont(_lastFont);
    },
    GetTextPr : function()
    {
        // return this.Native["GetTextPr"]();
    },
    FillText : function(x, y, text)
    {
        var _code = text.charCodeAt(0);
        this.Native["FillText"](x, y, _code);
    },
    t : function(text, x, y, isBounds)
    {
        this.Native["t"](x, y, text);
    },
    FillText2 : function(x, y, text, cropX, cropW)
    {
        var _code = text.charCodeAt(0);
        this.Native["FillText2"](x, y, _code, cropX, cropW);
    },
    t2 : function(text, x, y, cropX, cropW)
    {
        this.Native["t2"](x, y, text, cropX, cropW);
    },
    FillTextCode : function(x, y, lUnicode)
    {
        this.Native["FillTextCode"](x, y, lUnicode);
    },
    tg : function(code, x, y)
    {
        this.Native["tg"](code, x, y);
    },
    charspace : function(space)
    {
        // this.Native["charspace"](space);
    },
    // private methods
    private_FillGlyph : function(pGlyph, _bounds)
    {
        // this.Native["private_FillGlyph"](pGlyph, _bounds);
    },
    private_FillGlyphC : function(pGlyph, cropX, cropW)
    {
        // this.Native["private_FillGlyphC"](pGlyph, cropX, cropW);
    },
    private_FillGlyph2 : function(pGlyph)
    {
        // this.Native["private_FillGlyph2"](pGlyph);
    },
    SetIntegerGrid : function(param)
    {
        this.Native["SetIntegerGrid"](param);
    },
    GetIntegerGrid : function()
    {
        return this.Native["GetIntegerGrid"]();
    },
    DrawStringASCII : function(name, size, bold, italic, text, x, y, bIsHeader)
    {
        this.SetFont({FontFamily : {Name : name, Index : -1}, FontSize : size, Italic : italic, Bold : bold});
        this.Native["DrawStringASCII"](text, x, y);
    },
    DrawStringASCII2 : function(name, size, bold, italic, text, x, y, bIsHeader)
    {
        this.SetFont({FontFamily : {Name : name, Index : -1}, FontSize : size, Italic : italic, Bold : bold});
        this.Native["DrawStringASCII2"](text, x, y);
    },
    DrawHeaderEdit : function(yPos, lock_type, sectionNum, bIsRepeat, type)
    {
        this.Native["DrawHeaderEdit"](yPos, lock_type, sectionNum, bIsRepeat, type);
    },
    DrawFooterEdit : function(yPos, lock_type, sectionNum, bIsRepeat, type)
    {
        this.Native["DrawFooterEdit"](yPos, lock_type, sectionNum, bIsRepeat, type);
    },
    DrawLockParagraph : function(lock_type, x, y1, y2)
    {
        this.Native["DrawLockParagraph"](x, y1, y2);
    },
    DrawLockObjectRect : function(lock_type, x, y, w, h)
    {
        if (this.IsThumbnail)
            return;

        this.Native["DrawLockObjectRect"](x, y, w, h);
    },
    DrawEmptyTableLine : function(x1, y1, x2, y2)
    {
        this.Native["DrawEmptyTableLine"](x1, y1, x2, y2);
    },
    DrawSpellingLine : function(y0, x0, x1, w)
    {
        this.Native["DrawSpellingLine"](y0, x0, x1, w);
    },
    // smart methods for horizontal / vertical lines
    drawHorLine : function(align, y, x, r, penW)
    {
        this.Native["drawHorLine"](align, y, x, r, penW);
        
        if (false === this.GetIntegerGrid() && this.ArrayPoints != null)
        {
            this.ArrayPoints[this.ArrayPoints.length] = {x: x, y: y};
            this.ArrayPoints[this.ArrayPoints.length] = {x: r, y: y};
        }
    },
    drawHorLine2 : function(align, y, x, r, penW)
    {
        this.Native["drawHorLine2"](align, y, x, r, penW);
        
        if (false === this.GetIntegerGrid() && this.ArrayPoints != null)
        {
            var _y1 = y - penW / 2;
            var _y2 = _y1 + 2 * penW;
            
            this.ArrayPoints[this.ArrayPoints.length] = {x: x, y: _y1};
            this.ArrayPoints[this.ArrayPoints.length] = {x: r, y: _y1};
            this.ArrayPoints[this.ArrayPoints.length] = {x: x, y: _y2};
            this.ArrayPoints[this.ArrayPoints.length] = {x: r, y: _y2};
        }
    },
    drawVerLine : function(align, x, y, b, penW)
    {
        this.Native["drawVerLine"](align, x, y, b, penW);
        
        if (false === this.GetIntegerGrid() && this.ArrayPoints != null)
        {
            this.ArrayPoints[this.ArrayPoints.length] = {x: x, y: y};
            this.ArrayPoints[this.ArrayPoints.length] = {x: x, y: b};
        }
    },
    // мега крутые функции для таблиц
    drawHorLineExt : function(align, y, x, r, penW, leftMW, rightMW)
    {
        this.Native["drawHorLineExt"](align, y, x, r, penW, leftMW, rightMW);
        
        if (false === this.GetIntegerGrid() && this.ArrayPoints != null)
        {
            this.ArrayPoints[this.ArrayPoints.length] = {x: x, y: y};
            this.ArrayPoints[this.ArrayPoints.length] = {x: r, y: y};
        }
    },
    rect : function(x, y, w, h)
    {
        this.Native["rect"](x, y, w, h);
    },
    TableRect : function(x, y, w, h)
    {
        this.Native["TableRect"](x, y, w, h);
    },
    // функции клиппирования
    AddClipRect : function(x, y, w, h)
    {
        this.Native["AddClipRect"](x, y, w, h);
    },
    RemoveClipRect : function()
    {
        this.Native["RemoveClipRect"]();
    },
    SetClip : function(r)
    {
        this.Native["SetClip"](r.x, r.y, r.w, r.h);
    },
    RemoveClip : function()
    {
        this.Native["RemoveClip"]();
    },
    drawCollaborativeChanges : function(x, y, w, h, Color)
    {
    },
    drawMailMergeField : function(x, y, w, h)
    {
        this.Native["drawMailMergeField"](x, y, w, h);
    },
    drawSearchResult : function(x, y, w, h)
    {
        this.Native["drawSearchResult"](x, y, w, h);
    },
    drawFlowAnchor : function(x, y)
    {
        this.Native["drawFlowAnchor"](x, y);
    },
    SavePen : function()
    {
        this.Native["SavePen"]();
    },
    RestorePen : function()
    {
        this.Native["RestorePen"]();
    },
    SaveBrush : function()
    {
        this.Native["SaveBrush"]();
    },
    RestoreBrush : function()
    {
        this.Native["RestoreBrush"]();
    },
    SavePenBrush : function()
    {
        this.Native["SavePenBrush"]();
    },
    RestorePenBrush : function()
    {
        this.Native["RestorePenBrush"]();
    },
    SaveGrState : function()
    {
        this.Native["SaveGrState"]();
    },
    RestoreGrState : function()
    {
        this.Native["RestoreGrState"]();
    },
    StartClipPath : function()
    {
        this.Native["StartClipPath"]();
    },
    EndClipPath : function()
    {
        this.Native["EndClipPath"]();
    },
    StartCheckTableDraw : function()
    {
        return this.Native["StartCheckTableDraw"]();
    },
    EndCheckTableDraw : function(bIsRestore)
    {
        if(bIsRestore)
            this.RestoreGrState();
    },
    SetTextClipRect : function(_l, _t, _r, _b)
    {
        this.Native["SetTextClipRect"](_l, _t, _r, _b);
    },
    AddSmartRect : function(x, y, w, h, pen_w)
    {
        this.Native["AddSmartRect"](x, y, w, h, pen_w);
    },
    CheckUseFonts2 : function(_transform)
    {
        // this.Native["CheckUseFonts2"](_transform);
    },
    UncheckUseFonts2 : function()
    {
        // this.Native["UncheckUseFonts2"]();
    },
    Drawing_StartCheckBounds : function(x, y, w, h)
    {
        // this.Native["Drawing_StartCheckBounds"](x, y, w, h);
    },
    Drawing_EndCheckBounds : function()
    {
        // this.Native["Drawing_EndCheckBounds"]();
    },
    DrawPresentationComment : function(type, x, y, w, h)
    {
        // this.Native["DrawPresentationComment"](type, x, y, w, h);
    },
    DrawPolygon : function(oPath, lineWidth, shift)
    {
        this.p_width(lineWidth);
        this._s();

        var Points = oPath.Points;
        var nCount = Points.length;
        // берем предпоследнюю точку, т.к. последняя совпадает с первой
        var PrevX = Points[nCount - 2].X, PrevY = Points[nCount - 2].Y;
        var _x    = Points[nCount - 2].X,    _y = Points[nCount - 2].Y;
        var StartX, StartY;

        for (var nIndex = 0; nIndex < nCount; nIndex++)
        {
            if(PrevX > Points[nIndex].X)
            {
                _y = Points[nIndex].Y - shift;
            }
            else if(PrevX < Points[nIndex].X)
            {
                _y  = Points[nIndex].Y + shift;
            }

            if(PrevY < Points[nIndex].Y)
            {
                _x = Points[nIndex].X - shift;
            }
            else if(PrevY > Points[nIndex].Y)
            {
                _x = Points[nIndex].X + shift;
            }

            PrevX = Points[nIndex].X;
            PrevY = Points[nIndex].Y;

            if(nIndex > 0)
            {
                if (1 == nIndex)
                {
                    StartX = _x;
                    StartY = _y;
                    this._m(_x, _y);
                }
                else
                {
                    this._l(_x, _y);
                }
            }
        }

        this._l(StartX, StartY);
        this._z();
        this.ds();
    },
    DrawFootnoteRect : function(x, y, w, h)
    {
        this.Native["DrawFootnoteRect"](x, y, w, h);
    },
    // new methods
    toDataURL : function(type)
    {
        return this.Native["toDataURL"](type);
    },
    GetPenColor : function()
    {
        return this.Native["GetPenColor"]();
    },
    GetBrushColor : function()
    {
        return this.Native["GetBrushColor"]();
    },
    put_brushTexture : function(src, type)
    {
        this.Native["put_brushTexture"](src, type);
    },
    put_brushTextureMode : function(mode)
    {
        this.Native["put_brushTextureMode"](mode);
    },
    put_BrushTextureAlpha : function(a)
    {
        this.Native["put_BrushTextureAlpha"](a);
    },
    put_BrushGradient : function(gradFill, points, transparent)
    {
        var colors = new Array(gradFill.colors.length * 5);
        for (var i = 0; i < gradFill.colors.length; i++) {
            colors[i * 5] = gradFill.colors[i].pos;
            colors[i * 5 + 1] = gradFill.colors[i].color.RGBA.R;
            colors[i * 5 + 2] = gradFill.colors[i].color.RGBA.G;
            colors[i * 5 + 3] = gradFill.colors[i].color.RGBA.B;
            colors[i * 5 + 4] = gradFill.colors[i].color.RGBA.A;
        }
        this.Native["put_BrushGradient"](colors, transparent, points.x0, points.y0, points.x1, points.y1, points.r0, points.r1);
    },
    TransformPointX : function(x, y)
    {
        return this.Native["TransformPointX"](x, y);
    },
    TransformPointY : function(x, y)
    {
        return this.Native["TransformPointY"](x, y);
    },
    put_LineJoin : function(join)
    {
        this.Native["put_LineJoin"](join);
    },
    get_LineJoin : function()
    {
        return this.Native["get_LineJoin"]();
    },
    put_TextureBoundsEnabled : function(enabled)
    {
    },
    put_TextureBounds : function(x, y, w, h)
    {
        this.Native["put_TextureBounds"](x, y, w, h);
    },
    GetLineWidth : function()
    {
        return this.Native["GetlineWidth"]();
    },
    DrawPath : function(path)
    {
        this.Native["DrawPath"](path);
    },
    drawpath : function(path)
    {
        this.Native["DrawPath"](path);
    },
    CoordTransformOffset : function(tx, ty)
    {
        this.Native["CoordTransformOffset"](tx, ty);
    },
    GetTransform : function()
    {
        var _trans = this.Native["GetTransform"]();
        var _transform = new AscCommon.CMatrix;
        _transform.sx  = _trans.sx;
        _transform.shx = _trans.shx;
        _transform.shy = _trans.shy;
        _transform.sy  = _trans.sy;
        _transform.tx  = _trans.tx;
        _transform.ty  = _trans.ty;
        return _transform;
    },
    GetBrush : function()
    {
        return { Color1 : this.Native["GetBrushColor"]()};
    },
    GetPen : function()
    {
        return { Color : this.Native["GetPenColor"]()};
    },

    Destroy : function()
    {
        this.Native["Destroy"]();
    }
};
