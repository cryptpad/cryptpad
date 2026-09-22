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
