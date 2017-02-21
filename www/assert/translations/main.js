define([
    '/bower_components/jquery/dist/jquery.min.js',
    '/common/cryptpad-common.js',
    '/customize/translations/messages.js',
], function (jQuery, Cryptpad, English) {
    var $ = window.jQuery;

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

                res += (need ? '' : '// ') + 'out.' + key + ' = "";';
                if (need)
                {
                    res += ' // ' + JSON.stringify(English[key]);
                }
                return res;
            }).join('\n')));
        } else {
            $body.text('// All keys are present in all translations');
        }
    };
    Cryptpad.Messages._checkTranslationState(todo);
});
