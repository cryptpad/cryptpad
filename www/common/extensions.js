define([
    '/extensions.js'
], (Extensions) => {
    console.error(Extensions);
    const ext = {};
    if (!Array.isArray(Extensions) || !Extensions.length) { return ext; }

    let all = Extensions.slice();
    while(all.length) {
        let current = all.splice(0, 3);
        console.error(current);
        let f = current[0];
        if (typeof(f) !== "function") {
            continue;
        }
        let defaultLang = current[1];
        let lang = current[2];
        if (!Object.keys(lang).length && Object.keys(defaultLang).length) {
            lang = defaultLang;
        }
        let currentExt = f(lang) || {};

        Object.keys(currentExt).forEach(key => {
            ext[key] = ext[key] || [];
            Array.prototype.push.apply(ext[key], currentExt[key]); // concat in place
        });
    }

    return ext;
});
