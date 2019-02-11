define([
    'jquery',
    '/common/common-util.js',
    '/customize/messages.js',
    'json!/common/translations/messages.json',
], function ($, Util, Messages, English) {

    var $body = $('body');

    var pre = function (text, opt) {
        return $('<pre>', opt).text(text);
    };

    var todo = function (missing) {
        var currentLang = "";
        var currentState = 1;

        if (missing.length) {
            $body.append(pre(missing.map(function (msg) {
                var res = "";
                var lang = msg[0];
                var key = msg[1]; // Array
                var state = msg[2]; // 0 === toDelete, 1 === missing, 2 === updated, 3 === invalid (wrong type)
                var value = msg[3] || '""';

                if (currentLang !== lang) {
                    if (currentLang !== "")
                    {
                        res += '\n';
                    }
                    currentLang = lang;
                    res += '/*\n *\n * ' + lang + '\n *\n */\n\n';
                }
                if (currentState !== state) {
                    currentState = state;
                    if (currentState === 0)
                    {
                        res += '\n// TODO: These keys are not needed anymore and should be removed ('+ lang + ')\n\n';
                    }
                }

                res += (currentState ? '' : '// ') + 'out.' + key.join('.') + ' = ' + value + ';';
                if (currentState === 1) {
                    res += ' // ' + JSON.stringify(Util.find(English, key));
                } else if (currentState === 2) {
                    res += ' // TODO: Key updated --> make sure the updated key "'+ value +'" exists and is translated before this one.';
                } else if (currentState === 3) {
                    res += ' // NOTE: this key has an invalid type! Original value: ' + JSON.stringify(Util.find(English, key));
                }
                return res;
            }).join('\n')));
        } else {
            $body.text('// All keys are present in all translations');
        }
    };
    Messages._checkTranslationState(todo);
});
