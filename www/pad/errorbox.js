/*
 * Copyright 2014 XWiki SAS
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
require.config({
    'shim': {
        '/bower_components/modalBox/modalBox-min.js': [
            '/bower_components/jquery/dist/jquery.min.js'
        ],
    }
});
define([
    '/common/messages.js',
    '/bower_components/modalBox/modalBox-min.js'
], function (Messages) {

    var STYLE = [
        '<style>',
        '.modalBox {',
        '    padding:5px;',
        '    border:1px solid #CCC;',
        '    background:#FFF;',
        '    height:500px;',
        '    width:700px;',
        '    display:none;',
        '}',
        'img.iw-closeImg {',
        '    width:24px;',
        '    height:24px',
        '}',
        '.modalFooter {',
        '    color:#FFF;',
        '    position:absolute;',
        '    bottom:0px',
        '}',
        '.modalFooter span {',
        '    cursor:pointer;',
        '}',
        '.iw-modalOverlay {',
        '    background:#000;',
        '    opacity:.5',
        '}',
        '</style>'
    ].join('');

    var CONTENT = [
        '<center><h2 class="errorType"></h2></center>',
        '<br>',
        '<p class="errorExplanation"></p>'
    ].join('');

    var ERROR_ADDITIONAL = [
        '<p class="errorMoreExplanation"></p>',
        '<label for="errorBox_detailsBox" class="errorDetailsLabel"></label>',
        '<textarea id="errorBox_detailsBox" class="errorData"></textarea>',
    ].join('');    

    var showError = function (errorType, docHtml, moreInfo) {
        $('body').append('<div class="modalBox"></div>');
        var $modalbox = $('.modalBox')
        $modalbox.append(CONTENT + STYLE);

        $modalbox.find('.errorType').text(Messages['errorBox_errorType_' + errorType]);
        $modalbox.find('.errorExplanation').text(Messages['errorBox_errorExplanation_' + errorType]);
        if (moreInfo) {
            $modalbox.append(ERROR_ADDITIONAL);
            $modalbox.find('.errorMoreExplanation').text(Messages.errorBox_moreExplanation);
            $modalbox.find('.errorData').text(Messages['errorBox_' + errorType]);
        }

        $modalbox.modalBox({
            onClose: function () { $('.modalBox').remove(); }
        });
        $('.iw-modalOverlay').css({'z-index':10000});
    };

    return {
        show: showError
    };
});
