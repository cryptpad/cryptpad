define([
    'jquery',
    '/common/cryptpad-common.js',
    '/customize/translations/messages.js',
], function ($, Cryptpad, English) {

    var $body = $('body');

    var pre = function (text, opt) {
        return $('<pre>', opt).text(text);
    };

    var todo = function (missing) {
        var str = "";
        var need = 1;

        if (missing.length) {
            $body.append(pre(missing.map(function (msg) {
                var res = "";
                var code = msg[0];
                var key = msg[1];
                var needed = msg[2];
                var value = msg[3] || '""';

                if (str !== code) {
                    if (str !== "")
                    {
                        res += '\n';
                    }
                    str = code;
                    res += '/*\n *\n * ' + code + '\n *\n */\n\n';
                }
                if (need !== needed) {
                    need = needed;
                    if (need === 0)
                    {
                        res += '\n// TODO: These keys are not needed anymore and should be removed ('+ code + ')\n\n';
                    }
                }

                res += (need ? '' : '// ') + 'out.' + key + ' = ' + value + ';';
                if (need === 1) {
                    res += ' // ' + JSON.stringify(English[key]);
                } else if (need === 2) {
                    res += ' // TODO: Key updated --> make sure the updated key "'+ value +'" exists and is translated before that one.';
                }
                return res;
            }).join('\n')));
        } else {
            $body.text('// All keys are present in all translations');
        }
    };
    Cryptpad.Messages._checkTranslationState(todo);
});
