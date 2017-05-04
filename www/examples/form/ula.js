define([], function () {
    var ula = {};

    ula.uid = (function () {
        var i = 0;
        var prefix = 'rt_';
        return function () { return prefix + i++; };
    }());

    ula.getInputType = function ($el) { return $el[0].type; };

    ula.eventsByType = {
        text: 'change keyup',
        password: 'change keyup',
        radio: 'change click',
        checkbox: 'change click',
        number: 'change',
        range: 'keyup change',
        'select-one': 'change',
        'select-multiple': 'change',
        textarea: 'change keyup',
    };

    return ula;
});
