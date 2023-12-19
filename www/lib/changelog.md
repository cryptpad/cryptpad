<!--
SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

This file is intended to be used as a log of what third-party source we have vendored, where we got it, and what modifications we have made to it (if any).

* [asciidoc.js 2.0.0](https://github.com/asciidoctor/codemirror-asciidoc/releases/tag/2.0.0) with slight changes to match the format of other codemirror modes
* [Asciidoctor.js 2.2.6](https://github.com/asciidoctor/asciidoctor.js/releases/tag/v2.2.6) for AsciiDoc rendering
* [diffDOM 2.1.0](https://github.com/fiduswriter/diffDOM) with minor modifications
* [Fabricjs 4.6.0](https://github.com/fabricjs/fabric.js) and [Fabric-history](https://github.com/lyzerk/fabric-history) for the whiteboard app
* [highlightjs v10.2.0](https://github.com/highlightjs/highlight.js/) for syntax highlighting in our code editor
* [ical.js 1.4.0](https://github.com/kewisch/ical.js/releases/tag/v1.4.0) to manipulate ICS files for calendar import/export
* [jquery.ui 1.12.1](https://jqueryui.com/) for its 'autocomplete' extension which is used for our tag picker
* [jscolor v2.0.5](https://jscolor.com/) for providing a consistent color picker across all browsers
* [less.min.js v3.11.1](https://github.com/less/less.js/releases/tag/v3.11.1) with a minor modification to produce slightly more compact CSS
* [mermaid 10.2.4](https://github.com/mermaid-js/mermaid/releases/tag/v10.2.4) extends our markdown integration to support a variety of diagram types
* [Moment v2.29.4](http://momentjs.com/) for providing a date parser
* [our fork of tippy.js v1.2.0](https://github.com/xwiki-labs/tippyjs) for adding tooltips.
* [pdfjs](https://mozilla.github.io/pdf.js/) with some minor modifications to prevent CSP errors
* [qrcode.js](https://github.com/davidshimjs/qrcodejs) from [this commit](https://github.com/davidshimjs/qrcodejs/commit/06c7a5e134f116402699f03cda5819e10a0e5787) since the repo doesn't use tags
* [Rangy 1.3.0](https://github.com/timdown/rangy/tree/1.3.0) for cursor management. NOTE: [A CVE](https://github.com/advisories/GHSA-65rp-mhqf-8gj3) exists for this version but CryptPad isn't affected
* [Requirejs optional module plugin](https://stackoverflow.com/a/27422370)
* [textFit.min.js v2.4.0 ](https://github.com/STRML/textFit/releases/tag/v2.4.0) to ensure that app names fit inside their icon containers on the home page
* [turndown v7.1.1](https://github.com/mixmark-io/turndown/releases/tag/v7.1.1) built from unmodified source as per its build scripts.
