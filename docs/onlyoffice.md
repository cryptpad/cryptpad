<!--
SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

# OnlyOffice integration

CryptPad doesn't implement its own document/spreadsheet/presentation editor. For `.docx`,
`.xlsx` and `.pptx` files it embeds [OnlyOffice](https://github.com/ONLYOFFICE)'s editor -
`web-apps` (the UI) and `sdkjs` (the document engine) - and wraps it with glue code that
connects it to CryptPad's own end-to-end encrypted realtime sync layer.

The OnlyOffice source used is a CryptPad-maintained fork,
[`cryptpad/onlyoffice-editor`](https://github.com/cryptpad/onlyoffice-editor). It isn't
vendored as source in this repo - `install-onlyoffice.sh` downloads prebuilt dist bundles
into `www/common/onlyoffice/dist/v<version>/` (`sdkjs`, `web-apps`, dictionaries, etc.).
CryptPad's own glue code lives in `www/common/onlyoffice/` (`main.js`, `inner.js`,
`history.js`, ...).

## Two nested contexts

There are two layers of iframe involved, each with different code and a different trust
boundary:

1. **CryptPad's inner sandbox frame** - `www/common/onlyoffice/inner.js`. This is CryptPad's
   own code. It talks to CryptPad's realtime channel (ChainPad, via `rtChannel`) and to the
   outer page via `sframeChan`. This is where checkpoints, locks, user presence, and the
   bridge to OnlyOffice's own message protocol are handled.
2. **The OnlyOffice editor iframe** (`frameEditor`) - created *inside* the sandbox frame by
   `inner.js`, running OnlyOffice's own `web-apps` HTML page (e.g.
   `dist/v9/web-apps/apps/spreadsheeteditor/main/index.html`), which loads `sdkjs`. This is
   third-party code, driven through OnlyOffice's public embedding API (`DocsAPI`).

Instantiation example:

```js
APP.docEditor = new window.DocsAPI.DocEditor("cp-app-oo-placeholder-a", APP.ooconfig);
```
