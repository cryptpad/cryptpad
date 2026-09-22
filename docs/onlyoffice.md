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

## Getting document bytes into OnlyOffice

Because CryptPad is end-to-end encrypted, OnlyOffice can't be pointed at a normal server URL
to fetch the file - the server never sees plaintext. Instead, `inner.js` decrypts the
document client-side into a `Blob`, turns it into an object URL, and hands that to
OnlyOffice as `document.url`. Snippet from method `createOOConfig` in `inner.js`:

```js
const url = URL.createObjectURL(blob);
//...
const ooconfig = {
    document: {
        fileType: file.type,   // always 'xlsx' / 'docx' / 'pptx' for CryptPad
        url: url,
        ...
    },
    ...
};
```

OnlyOffice's own loader fetches that `blob:` URL and feeds the bytes into `sdkjs`.

## Collaboration model: checkpoints + a private OO channel

CryptPad doesn't let ChainPad synchronize the OOXML binary directly. The pad's main
ChainPad channel (the same CRDT-based sync CryptPad uses for every pad type - see
[ARCHITECTURE.md](./ARCHITECTURE.md)) only carries a small JSON metadata object
(`content` in `inner.js`): checkpoint hashes, object-id/lock bookkeeping, save/migration
flags, and the id of a *second*, separate realtime channel used for the
actual document edits. ChainPad's CRDT merge keeps that metadata object consistent across
clients even when several of them touch it concurrently.

That second channel (`ooChannel`) is a plain relay channel, not ChainPad/CRDT-backed -
OnlyOffice already does its own operational-transform conflict resolution on its change
format, so CryptPad just needs to broadcast messages in order, not merge them. Instead:

- Individual edits are captured as OnlyOffice's own collaborative change format and relayed
  over `ooChannel`, separate from the pad's main ChainPad channel.
- Periodically (based on `CHECKPOINT_INTERVAL` / `FORCE_CHECKPOINT_INTERVAL` in `inner.js`),
  one client serializes the *entire* current document to a binary blob and uploads it as a **checkpoint**
  (`saveToServer` / `makeCheckpoint`). This bounds how much incremental
  history every client has to replay to catch up.
