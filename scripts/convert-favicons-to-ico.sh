#!/bin/sh

# SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
#
# SPDX-License-Identifier: AGPL-3.0-or-later

for f in ../customize.dist/favicon/*.png; do
    base="$(basename $f ".png")"
    magick convert $f -define icon:auto-resize=16,24,32,48,64,72,96,128,256 "$base.ico"
done
