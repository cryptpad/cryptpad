define([], function () {
    var module = {
        ext: '.xlsx', // default
        exts: ['.xlsx']
    };

    module.main = function (userDoc, cb, ext, sframeChan, padData) {
        sframeChan.query('Q_OOIFRAME_OPEN', {
            json: userDoc,
            type: 'sheet',
            padData: padData
        }, function (err, u8) {
            if (!u8) { return void cb(''); }
            var blob = new Blob([u8], {type: "application/bin;charset=utf-8"});
            cb(blob);
        }, {
            raw: true
        });
    };

    return module;
});

