# SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
#
# SPDX-License-Identifier: AGPL-3.0-or-later

git clone https://github.com/ldubost/web-apps.git
git clone https://github.com/ldubost/sdkjs.git
cd sdkjs
make
cd ..
rm -rf ../web-apps
cp -r web-apps/deploy/web-apps ..
rm -rf ../sdkjs
cp -r web-apps/deploy/sdkjs ..

