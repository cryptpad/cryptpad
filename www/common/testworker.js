// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

if (!self.crypto && !self.msCrypto) {
    throw new Error("E_NOCRYPTO");
}
self.postMessage("OK");
