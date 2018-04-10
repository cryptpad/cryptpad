define(function () {
    return {
        onReady: function (cb) {
            if (document.readyState === 'complete') { return void cb(); }
            document.onreadystatechange = function () {
                if (document.readyState === 'complete') { cb(); }
            };
        }
    };
});
