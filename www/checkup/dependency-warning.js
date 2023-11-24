// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

(function () { 
    var h = (tag, children) => {
        var el = document.createElement(tag);
        children.forEach(child => {
            if (typeof(child) === 'string') {
                return void el.appendChild(document.createTextNode(child));
            }
            el.appendChild(child);
        });
        return el;
    };

    var first = true;
    window.addEventListener('error', function (ev) {
        if (window.CHECKUP_MAIN_LOADED) { return; }
        if (!ev) { return; }
        var srcElement = ev.srcElement;
        if (!srcElement) { return; }
        var nodeName = srcElement.nodeName;
        if (nodeName !== 'SCRIPT') { return; }
        var src = srcElement.src;

        if (/\/api\/.*/.test(src)) {
            console.error("A serverside API endpoint could not be reached.", src);
            // don't warn about missing components if the error is the optional instance endpoint
            if (/\/api\/instance/.test(src)) { return; }
        }

        //if (!/\/components\/.*/.test(src)) { return; }
        if (first) {
            document.body.appendChild(h('h1', ['Oops!']));
            document.body.appendChild(h('p', [
                `It's possible that required resource couldn't be loaded.`,
                ` See your browser's console for more details.`,
            ]));
            first = false;
        }
        document.body.appendChild(h('p', [
            'Failed to load ',
            h('code', [src]),
            '.',
        ]));
    }, true);
}());
