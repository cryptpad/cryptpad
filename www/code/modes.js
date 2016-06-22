define(function () {
    return [
        "Javascript javascript",
        "Python python",
        "Mixed_HTML htmlmixed",
    ].map(function (line) {
        var kv = line.split(/\s/);
        return {
            language: kv[0].replace(/_/g, ' '),
            mode: kv[1]
        };
    });
});
