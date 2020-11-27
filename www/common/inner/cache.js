define([
], function () {
    var S = {};

    S.create = function (sframeChan) {
        var getBlobCache = function (id, cb) {
            sframeChan.query('Q_GET_BLOB_CACHE', {id:id}, function (err, data) {
                var e = err || (data && data.error);
                if (e) { return void cb(e); }
                if (!data || typeof(data) !== "object") { return void cb('EINVAL'); }
                var arr = Object.keys(data).map(function (i) { return data[i]; });
                var u8 = Uint8Array.from(arr);
                cb(null, u8);
            });
        };
        var setBlobCache = function (id, u8, cb) {
            sframeChan.query('Q_SET_BLOB_CACHE', {
                id: id,
                u8: u8
            }, function (err, data) {
                var e = err || (data && data.error) || undefined;
                cb(e);
            });
        };


        return {
            getBlobCache: getBlobCache,
            setBlobCache: setBlobCache
        };
    };

    return S;
});

