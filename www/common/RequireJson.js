define(function () {
    var api = {};
    api.normalize = function(name, normalize) { return normalize(name); };
    api.load = function(name, req, onLoad /*, config */) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (this.readyState !== 4) { return; }
            if (this.status === 200) {
                try { onLoad(JSON.parse(xhr.responseText)); } catch (e) { onLoad.error(e); }
                return;
            }
            onLoad.error("status: " + this.status);
        };
        xhr.open("GET", "/api/config.json");
        xhr.send();
    };
    return api;
});
