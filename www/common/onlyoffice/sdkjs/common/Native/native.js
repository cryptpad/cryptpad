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

var editor = undefined;
var window = {};
var navigator = {};
navigator.userAgent = "chrome";
window.navigator = navigator;
window.location = {};

window.location.protocol = "";
window.location.host = "";
window.location.href = "";
window.location.pathname = "";

window.NATIVE_EDITOR_ENJINE = true;
window.NATIVE_EDITOR_ENJINE_SYNC_RECALC = true;

var document = {};
window.document = document;

window["Asc"] = {};
var Asc = window["Asc"];

window["AscFonts"] = {};
var AscFonts = window["AscFonts"];

window["AscCommon"] = {};
var AscCommon = window["AscCommon"];

window["AscFormat"] = {};
var AscFormat = window["AscFormat"];

window["AscDFH"] = {};
var AscDFH = window["AscDFH"];

window["AscCH"] = {};
var AscCH = window["AscCH"];

window["AscCommonExcel"] = {};
var AscCommonExcel = window["AscCommonExcel"];

window["AscCommonWord"] = {};
var AscCommonWord = window["AscCommonWord"];

window["AscCommonSlide"] = {};
var AscCommonSlide = window["AscCommonSlide"];

function ConvertJSC_Array(_array)
{
	var _len = _array.length;
	var ret = new Uint8Array(_len);
	for (var i = 0; i < _len; i++)
		ret[i] = _array.getAt(i);
	return ret;
}

function Image()
{
	this.src = "";
	this.onload = function ()
	{
	};
	this.onerror = function ()
	{
	};
}

function _image_data()
{
	this.data = null;
	this.length = 0;
}

function native_pattern_fill()
{
}
native_pattern_fill.prototype =
{
	setTransform: function (transform)
	{
	}
};

function native_gradient_fill()
{
}
native_gradient_fill.prototype =
{
	addColorStop: function (offset, color)
	{
	}
};

function native_context2d(parent)
{
	this.canvas = parent;

	this.globalAlpha = 0;
	this.globalCompositeOperation = "";
	this.fillStyle = "";
	this.strokeStyle = "";

	this.lineWidth = 0;
	this.lineCap = 0;
	this.lineJoin = 0;
	this.miterLimit = 0;
	this.shadowOffsetX = 0;
	this.shadowOffsetY = 0;
	this.shadowBlur = 0;
	this.shadowColor = 0;
	this.font = "";
	this.textAlign = 0;
	this.textBaseline = 0;
}
native_context2d.prototype =
{
	save: function ()
	{
	},
	restore: function ()
	{
	},

	scale: function (x, y)
	{
	},
	rotate: function (angle)
	{
	},
	translate: function (x, y)
	{
	},
	transform: function (m11, m12, m21, m22, dx, dy)
	{
	},
	setTransform: function (m11, m12, m21, m22, dx, dy)
	{
	},

	createLinearGradient: function (x0, y0, x1, y1)
	{
		return new native_gradient_fill();
	},
	createRadialGradient: function (x0, y0, r0, x1, y1, r1)
	{
		return null;
	},
	createPattern: function (image, repetition)
	{
		return new native_pattern_fill();
	},

	clearRect: function (x, y, w, h)
	{
	},
	fillRect: function (x, y, w, h)
	{
	},
	strokeRect: function (x, y, w, h)
	{
	},

	beginPath: function ()
	{
	},
	closePath: function ()
	{
	},
	moveTo: function (x, y)
	{
	},
	lineTo: function (x, y)
	{
	},
	quadraticCurveTo: function (cpx, cpy, x, y)
	{
	},
	bezierCurveTo: function (cp1x, cp1y, cp2x, cp2y, x, y)
	{
	},
	arcTo: function (x1, y1, x2, y2, radius)
	{
	},
	rect: function (x, y, w, h)
	{
	},
	arc: function (x, y, radius, startAngle, endAngle, anticlockwise)
	{
	},

	fill: function ()
	{
	},
	stroke: function ()
	{
	},
	clip: function ()
	{
	},
	isPointInPath: function (x, y)
	{
	},
	drawFocusRing: function (element, xCaret, yCaret, canDrawCustom)
	{
	},

	fillText: function (text, x, y, maxWidth)
	{
	},
	strokeText: function (text, x, y, maxWidth)
	{
	},
	measureText: function (text)
	{
	},

	drawImage: function (img_elem, dx_or_sx, dy_or_sy, dw_or_sw, dh_or_sh, dx, dy, dw, dh)
	{
	},

	createImageData: function (imagedata_or_sw, sh)
	{
		var _data = new _image_data();
		_data.length = imagedata_or_sw * sh * 4;
		_data.data = (typeof(Uint8Array) != 'undefined') ? new Uint8Array(_data.length) : new Array(_data.length);
		return _data;
	},
	getImageData: function (sx, sy, sw, sh)
	{
	},
	putImageData: function (image_data, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight)
	{
	}
};

function native_canvas()
{
	this.id = "";
	this.width = 300;
	this.height = 150;

	this.nodeType = 1;
}
native_canvas.prototype =
{
	getContext: function (type)
	{
		if (type == "2d")
			return new native_context2d(this);
		return null;
	},

	toDataUrl: function (type)
	{
		return "";
	},

	addEventListener: function ()
	{
	},

	attr: function ()
	{
	}
};

var _null_object = {};
_null_object.length = 0;
_null_object.nodeType = 1;
_null_object.offsetWidth = 1;
_null_object.offsetHeight = 1;
_null_object.clientWidth = 1;
_null_object.clientHeight = 1;
_null_object.scrollWidth = 1;
_null_object.scrollHeight = 1;
_null_object.style = {};
_null_object.documentElement = _null_object;
_null_object.body = _null_object;
_null_object.ownerDocument = _null_object;
_null_object.defaultView = _null_object;

_null_object.addEventListener = function ()
{
};
_null_object.setAttribute = function ()
{
};
_null_object.getElementsByTagName = function ()
{
	return [];
};
_null_object.appendChild = function ()
{
};
_null_object.removeChild = function ()
{
};
_null_object.insertBefore = function ()
{
};
_null_object.childNodes = [];
_null_object.parent = _null_object;
_null_object.parentNode = _null_object;
_null_object.find = function ()
{
	return this;
};
_null_object.appendTo = function ()
{
	return this;
};
_null_object.css = function ()
{
	return this;
};
_null_object.width = function ()
{
	return 0;
};
_null_object.height = function ()
{
	return 0;
};
_null_object.attr = function ()
{
	return this;
};
_null_object.prop = function ()
{
	return this;
};
_null_object.val = function ()
{
	return this;
};
_null_object.remove = function ()
{
};
_null_object.getComputedStyle = function ()
{
	return null;
};
_null_object.getContext = function (type)
{
	if (type == "2d")
		return new native_context2d(this);
	return null;
};

window._null_object = _null_object;

document.createElement = function (type)
{
	if (type && type.toLowerCase)
	{
		if (type.toLowerCase() == "canvas")
			return new native_canvas();
	}

	return _null_object;
};

function _return_empty_html_element()
{
	return _null_object;
};

document.createDocumentFragment = _return_empty_html_element;
document.getElementsByTagName = function (tag)
{
	var ret = [];
	if ("head" == tag)
		ret.push(_null_object);
	return ret;
};
document.insertBefore = function ()
{
};
document.appendChild = function ()
{
};
document.removeChild = function ()
{
};
document.getElementById = function ()
{
	return _null_object;
};
document.createComment = function ()
{
	return undefined;
};

document.documentElement = _null_object;
document.body = _null_object;

var native = (typeof native === undefined) ? undefined : native;
if (!native)
{
	if (typeof NativeEngine === "undefined")
	{
		native = CreateNativeEngine();
	}
	else
	{
		native = NativeEngine;
	}
}

window.native = native;

function GetNativeEngine()
{
	return window.native;
}

var native_renderer = null;
var Api = null;
var _api = null;

function NativeOpenFileData(data, version, xlsx_file_path)
{
	window.NATIVE_DOCUMENT_TYPE = window.native.GetEditorType();

	if (window.NATIVE_DOCUMENT_TYPE == "presentation" || window.NATIVE_DOCUMENT_TYPE == "document")
	{
		_api = new window["Asc"]["asc_docs_api"]({});
		_api.asc_nativeOpenFile(data, version);
	}
	else
	{
		_api = new window["Asc"]["spreadsheet_api"]({});
		_api.asc_nativeOpenFile(data, version, undefined, xlsx_file_path);
	}
	Api = _api;
}

function NativeOpenFile()
{
	var doc_bin = window.native.GetFileString(window.native.GetFilePath());
	window.NATIVE_DOCUMENT_TYPE = window.native.GetEditorType();

	if (window.NATIVE_DOCUMENT_TYPE == "presentation" || window.NATIVE_DOCUMENT_TYPE == "document")
	{
		_api = new window["Asc"]["asc_docs_api"]("");

		_api.asc_nativeOpenFile(doc_bin);
	}
	else
	{
		_api = new window["Asc"]["spreadsheet_api"]();
		_api.asc_nativeOpenFile(doc_bin);
	}
	Api = _api;
}

function NativeOpenFile2(_params)
{
	window["CreateMainTextMeasurerWrapper"]();

	window.g_file_path = "native_open_file";
	window.NATIVE_DOCUMENT_TYPE = window.native.GetEditorType();
	var doc_bin = window.native.GetFileString(window.g_file_path);
	if (window.NATIVE_DOCUMENT_TYPE == "presentation" || window.NATIVE_DOCUMENT_TYPE == "document")
	{
		_api = new window["Asc"]["asc_docs_api"]("");

		if (undefined !== _api.Native_Editor_Initialize_Settings)
		{
			_api.Native_Editor_Initialize_Settings(_params);
		}

		_api.asc_nativeOpenFile(doc_bin);

		if (_api.NativeAfterLoad)
			_api.NativeAfterLoad();

		// ToDo get_PropertyThemeColorSchemes method removed, now the only Event!!!!
		/*if (_api.__SendThemeColorScheme)
			_api.__SendThemeColorScheme();

		if (_api.get_PropertyThemeColorSchemes)
		{
			var schemes = _api.get_PropertyThemeColorSchemes();
			if (schemes)
			{
				var st = global_memory_stream_menu;
				st["ClearNoAttack"]();
				AscCommon.asc_WriteColorSchemes(schemes, st);
				window["native"]["OnCallMenuEvent"](2404, st); // ASC_MENU_EVENT_TYPE_COLOR_SCHEMES
			}
		}*/
	}
	else
	{
		_api = new window["Asc"]["spreadsheet_api"]();
		_api.asc_nativeOpenFile(doc_bin);
	}

	Api = _api;
}

function NativeCalculateFile()
{
	_api.asc_nativeCalculateFile();
}

function NativeApplyChangesData(data, isFull)
{
	if (window.NATIVE_DOCUMENT_TYPE == "presentation" || window.NATIVE_DOCUMENT_TYPE == "document")
	{
		_api.asc_nativeApplyChanges2(data, isFull);
	}
	else
	{
		_api.asc_nativeApplyChanges2(data, isFull);
	}
}

function NativeApplyChanges()
{
	if (window.NATIVE_DOCUMENT_TYPE == "presentation" || window.NATIVE_DOCUMENT_TYPE == "document")
	{
		var __changes = [];
		var _count_main = window.native.GetCountChanges();
		for (var i = 0; i < _count_main; i++)
		{
			var _changes_file = window.native.GetChangesFile(i);
			var _changes = JSON.parse(window.native.GetFileString(_changes_file));

			for (var j = 0; j < _changes.length; j++)
			{
				__changes.push(_changes[j]);
			}
		}
		_api.asc_nativeApplyChanges(__changes);
	}
	else
	{
		var __changes = [];
		var _count_main = window.native.GetCountChanges();
		for (var i = 0; i < _count_main; i++)
		{
			var _changes_file = window.native.GetChangesFile(i);
			var _changes = JSON.parse(window.native.GetFileString(_changes_file));

			for (var j = 0; j < _changes.length; j++)
			{
				__changes.push(_changes[j]);
			}
		}

		_api.asc_nativeApplyChanges(__changes);
	}
}
function NativeGetFileString()
{
	return _api.asc_nativeGetFile();
}
function NativeGetFileData()
{
	return _api.asc_nativeGetFileData();
}
function NativeGetFileDataHtml()
{
	if (_api.asc_nativeGetHtml)
		return _api.asc_nativeGetHtml();
	return "";
}

function NativeStartMailMergeByList(database)
{
	if (_api.asc_StartMailMergeByList)
		return _api.asc_StartMailMergeByList(database);
	return undefined;
}
function NativePreviewMailMergeResult(index)
{
	if (_api.asc_PreviewMailMergeResult)
		return _api.asc_PreviewMailMergeResult(index);
	return undefined;
}
function NativeGetMailMergeFiledValue(index, name)
{
	if (_api.asc_GetMailMergeFiledValue)
		return _api.asc_GetMailMergeFiledValue(index, name);
	return "";
}

function GetNativeCountPages()
{
	return _api.asc_nativePrintPagesCount();
}

function GetNativeFileDataPDF(_param)
{
	return _api.asc_nativeGetPDF(_param);
}

window.memory1 = null;
window.memory2 = null;

function GetNativePageBase64(pageIndex)
{
	if (null == window.memory1)
		window.memory1 = CreateNativeMemoryStream();
	else
		window.memory1.ClearNoAttack();

	if (null == window.memory2)
		window.memory2 = CreateNativeMemoryStream();
	else
		window.memory2.ClearNoAttack();

	if (native_renderer == null)
	{
		native_renderer = _api.asc_nativeCheckPdfRenderer(window.memory1, window.memory2);
	}
	else
	{
		window.memory1.ClearNoAttack();
		window.memory2.ClearNoAttack();
	}

	_api.asc_nativePrint(native_renderer, pageIndex);
	return window.memory1;
}

function GetNativePageMeta(pageIndex)
{
	return _api.GetNativePageMeta(pageIndex);
}

function GetNativeId()
{
	return window.native.GetFileId();
}

// для работы с таймерами
window.NativeSupportTimeouts = false;
window.NativeTimeoutObject = {};

function clearTimeout(_id)
{
	if (!window.NativeSupportTimeouts)
		return;

	window.NativeTimeoutObject["" + _id] = undefined;
	window.native["ClearTimeout"](_id);
}
function setTimeout(func, interval)
{
	if (!window.NativeSupportTimeouts)
		return;

	var _id = window.native["GenerateTimeoutId"](interval);
	window.NativeTimeoutObject["" + _id] = func;
	return _id;
}

window.native.Call_TimeoutFire = function (_id)
{
	if (!window.NativeSupportTimeouts)
		return;

	var _prop = "" + _id;
	var _func = window.NativeTimeoutObject[_prop];
	window.NativeTimeoutObject[_prop] = undefined;

	if (!_func)
		return;

	_func.call(null);
	_func = null;
};

function clearInterval(_id)
{
	if (!window.NativeSupportTimeouts)
		return;

	window.NativeTimeoutObject["" + _id] = undefined;
	window.native["ClearTimeout"](_id);
}
function setInterval(func, interval)
{
	if (!window.NativeSupportTimeouts)
		return;

	var _intervalFunc = function ()
	{
		func.call(null);
		setTimeout(func, interval);
	};

	var _id = window.native["GenerateTimeoutId"](interval);
	window.NativeTimeoutObject["" + _id] = _intervalFunc;
	return _id;
}

window.clearTimeout = clearTimeout;
window.setTimeout = setTimeout;
window.clearInterval = clearInterval;
window.setInterval = setInterval;

var console = {
	log: function (param)
	{
		window.native.ConsoleLog(param);
	},
	time: function (param)
	{
	},
	timeEnd: function (param)
	{
	}
};

window["NativeCorrectImageUrlOnPaste"] = function (url)
{
	return window["native"]["CorrectImageUrlOnPaste"](url);
};
window["NativeCorrectImageUrlOnCopy"] = function (url)
{
	return window["native"]["CorrectImageUrlOnCopy"](url);
};

var global_memory_stream_menu = CreateNativeMemoryStream();

// HTML page interface
window.native.Call_OnUpdateOverlay = function (param)
{
	return _api.Call_OnUpdateOverlay(param);
};

window.native.Call_OnMouseDown = function (e)
{
	return _api.Call_OnMouseDown(e);
};
window.native.Call_OnMouseUp = function (e)
{
	return _api.Call_OnMouseUp(e);
};
window.native.Call_OnMouseMove = function (e)
{
	return _api.Call_OnMouseMove(e);
};
window.native.Call_OnCheckMouseDown = function (e)
{
	return _api.Call_OnCheckMouseDown(e);
};

window.native.Call_OnKeyDown = function (e)
{
	return _api.Call_OnKeyDown(e);
};
window.native.Call_OnKeyPress = function (e)
{
	return _api.Call_OnKeyPress(e);
};
window.native.Call_OnKeyUp = function (e)
{
	return _api.Call_OnKeyUp(e);
};
window.native.Call_OnKeyboardEvent = function (e)
{
	return _api.Call_OnKeyboardEvent(e);
};

window.native.Call_CalculateResume = function ()
{
	return _api.Call_CalculateResume();
};

window.native.Call_TurnOffRecalculate = function ()
{
	return _api.Call_TurnOffRecalculate();
};
window.native.Call_TurnOnRecalculate = function ()
{
	return _api.Call_TurnOnRecalculate();
};

window.native.Call_CheckTargetUpdate = function ()
{
	return _api.Call_CheckTargetUpdate();
};
window.native.Call_Common = function (type, param)
{
	return _api.Call_Common(type, param);
};

window.native.Call_HR_Tabs = function (arrT, arrP)
{
	return _api.Call_HR_Tabs(arrT, arrP);
};
window.native.Call_HR_Pr = function (_indent_left, _indent_right, _indent_first)
{
	return _api.Call_HR_Pr(_indent_left, _indent_right, _indent_first);
};
window.native.Call_HR_Margins = function (_margin_left, _margin_right)
{
	return _api.Call_HR_Margins(_margin_left, _margin_right);
};
window.native.Call_HR_Table = function (_params, _cols, _margins, _rows)
{
	return _api.Call_HR_Table(_params, _cols, _margins, _rows);
};

window.native.Call_VR_Margins = function (_top, _bottom)
{
	return _api.Call_VR_Margins(_top, _bottom);
};
window.native.Call_VR_Header = function (_header_top, _header_bottom)
{
	return _api.Call_VR_Header(_header_top, _header_bottom);
};
window.native.Call_VR_Table = function (_params, _cols, _margins, _rows)
{
	return _api.Call_VR_Table(_params, _cols, _margins, _rows);
};

window.native.Call_Menu_Event = function (type, _params)
{
	return _api.Call_Menu_Event(type, _params);
};
