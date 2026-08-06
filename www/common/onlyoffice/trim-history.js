const factory = () => {

    const sortCpIndex = (hashes) => {
        return Object.keys(hashes).map(Number).sort(function (a, b) {
            return a-b;
        });
    };

    const trim = (content) => {
        let hashes = content?.content?.hashes || {};
        if (!hashes) { return content; }
        const sortedCp = sortCpIndex(hashes);
        const lastIdx = sortedCp.pop();
        if (!lastIdx) { return content; }
        const lastCp = hashes[lastIdx];
        if (!lastCp) { return content; }
        content.content.hashes = hashes = {};
        if (lastCp.rtChannel) {
            delete content.content.channel;
        }
        hashes[lastIdx] = lastCp;
        return content;
    };

    return { trim };
};

if (typeof(module) !== 'undefined' && module.exports) {
    module.exports = factory();
} else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
    define([], factory);
}
