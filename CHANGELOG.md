<!--
SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

# 2024.6.1

## Goals

This is a bugfix release to address issues that were reported by Cryptpad.fr users. We took the opportunity to update the translations with some new languages contributed by the community.

## Improvements

- Translations update from CryptPad Translations [#1575](https://github.com/cryptpad/cryptpad/pull/1575)
  - Added: Español cubano, اَلْعَرَبِيَّةُ Arabic, Svenska
  - Removed some languages without enough coverage
    - Greek (16%)
    - Romanian (36%)

## Fixes
- Calendar events sometimes don’t appear when created [#1551](https://github.com/cryptpad/cryptpad/issues/1551) fixed by [072dba2](https://github.com/cryptpad/cryptpad/commit/072dba254e3c2be32cd6b261d84510909deb713f)
- Revert the new method of counting registered users in the admin panel [4544be6](https://github.com/cryptpad/cryptpad/commit/4544be6b4d9fa7291b19cb366f7dd492dfe07340)
- Fix broken OnlyOffice Document [#1572](https://github.com/cryptpad/cryptpad/issues/1572)
- Fix printing in Code documents [#1557](https://github.com/cryptpad/cryptpad/pull/1557) [#1478](https://github.com/cryptpad/cryptpad/pull/1478) 
- Fix OnlyOffice undefined functions [#1550](https://github.com/cryptpad/cryptpad/pull/1550)
- Fix keyboard operation of confirm modals [#1576](https://github.com/cryptpad/cryptpad/issues/1576)
  - Pressing Enter on the "Cancel" button triggered the "OK" button instead


## Upgrade notes

If you are upgrading from a version older than `2024.6.0` please read the upgrade notes of all versions between yours and `2024.6.1` to avoid configuration issues.

To upgrade:

1. Stop your server
2. Get the latest code with git

```bash
git fetch origin --tags
git checkout 2024.6.1
npm ci
npm run install:components
./install-onlyoffice.sh
```

3. Restart your server
4. Review your instance's checkup page to ensure that you are passing all tests


# 2024.6.0

## Goals

This release introduces a new onboarding flow to guide administrators through the setup of an instance. After creating the first admin account, 3 screens guide them through the customization of the instance title, logo, accent color, available applications, and security features. We also include a new language, some fixes on accessibility, deployment, OnlyOffice and more.

## Features

- Onboarding screens & app configuration [#1513](https://github.com/cryptpad/cryptpad/pull/1513)
- Bahasa Indonesia is a new available language [fe78b6a](https://github.com/cryptpad/cryptpad/commit/fe78b6ab1dc76ce9eb8d5361c309db8e92117fa8)
  - Thanks to our [Weblate](https://weblate.cryptpad.org) contributors who made that happen!

## Improvements

- Improve plugins API [#1511](https://github.com/cryptpad/cryptpad/pull/1511)

## Fixes

- Accessibility
  - Kanban accessibility fixes [#1488](https://github.com/cryptpad/cryptpad/pull/1488)
  - Fix modal focus [#1483](https://github.com/cryptpad/cryptpad/pull/1483)
  - Fix locked focus on text editors [#1473](https://github.com/cryptpad/cryptpad/pull/1473)
  - Frames must have accessible names [#1123](https://github.com/cryptpad/cryptpad/issues/1123)
  - Focus trapped on notifications menu [#1430](https://github.com/cryptpad/cryptpad/issues/1430)
  - Add page language [#1125](https://github.com/cryptpad/cryptpad/issues/1125)
  - Can not open folder via "▼" -> "Open".  [#1089](https://github.com/cryptpad/cryptpad/issues/1089)
  - Images must have alternate text [#1449](https://github.com/cryptpad/cryptpad/issues/1449)
- OnlyOffice
  - Remove x2t from the CryptPad repo [#1454](https://github.com/cryptpad/cryptpad/issues/1454)
  - Other OnlyOffice users are shown as "Guest" [#1446](https://github.com/cryptpad/cryptpad/issues/1446)
  - Document PDF exports are empty when remote embedding is disabled  [#1472](https://github.com/cryptpad/cryptpad/issues/1472)
  - Sometimes images of a presentation are not exported to PDF [#1500](https://github.com/cryptpad/cryptpad/issues/1500)
  - Automatic upgrade of an OnlyOffice document fails sometimes [#1534](https://github.com/cryptpad/cryptpad/issues/1534)
  - Import/Export is broken [#1532](https://github.com/cryptpad/cryptpad/issues/1532)
  - Print is broken [#1533](https://github.com/cryptpad/cryptpad/issues/1533)
- Deployment / Hosting
  - Upgrade CryptPad version in docker-compose.yml [#1529](https://github.com/cryptpad/cryptpad/pull/1529)
  - Optimize HTTPd example config [#1498](https://github.com/cryptpad/cryptpad/pull/1498)
  - Tidy up HTTPd config [#1527](https://github.com/cryptpad/cryptpad/pull/1527)
  - Clarify sandbox `httpSafePort` use in `config.example.js` [#1518](https://github.com/cryptpad/cryptpad/pull/1518)
  - Switch to new `http2` Nginx option [#1516](https://github.com/cryptpad/cryptpad/pull/1516)
  - Server fixes and aggregated stats [#1509](https://github.com/cryptpad/cryptpad/pull/1509)
  - Create the block folder at boot [#911](https://github.com/cryptpad/cryptpad/pull/911)
  - Remove obsolete `version` from `docker-compose.yml` [2e716eb](https://github.com/cryptpad/cryptpad/commit/2e716eb4e39fb835f95a1fa1a340e01142d11b1c)
- Other
  - Unsharp the corners when hovering the dismiss button on notification drop-down menu [#1466](https://github.com/cryptpad/cryptpad/pull/1466)
  - Fix contextual menu `Open` on anonymous drive [#1464](https://github.com/cryptpad/cryptpad/pull/1464)
  - Tighten eslint rules [#1456](https://github.com/cryptpad/cryptpad/pull/1456)
  - Remove mediatag subfolder [#844](https://github.com/cryptpad/cryptpad/pull/844)

## Dependencies

- Upgrade CryptPad version in `package.json`, update description as well [#1530](https://github.com/cryptpad/cryptpad/pull/1530)
- Remove deprecated and unmaintained `lesshint` library and use `stylelint` and its `stylelint-less` plugin instead

## Upgrade notes

If you are upgrading from a version older than `2024.3.1` please read the upgrade notes of all versions between yours and `2024.3.1` to avoid configuration issues.

To upgrade:

1. Stop your server
2. Get the latest code with git

```bash
git fetch origin --tags
git checkout 2024.6.0
npm ci
npm run install:components
./install-onlyoffice.sh
```

3. Restart your server
4. Review your instance's checkup page to ensure that you are passing all tests

# 2024.3.1

## Goals
This minor release introduces a workaround to recover corrupted OnlyOffice documents alongside other fixes, with some improvements.

## Fixes
- Workarounds for missing OnlyOffice methods: [#1492](https://github.com/cryptpad/cryptpad/pull/1492)
- Fix HTTP server issue with NodeJs >= v20.13.0: [4483b84](https://github.com/cryptpad/cryptpad/commit/4483b848ff2ba23176cb05dacf073f3e0581ba7b)
- Fix merge issues with `package.json`: [7f45d59](https://github.com/cryptpad/cryptpad/commit/7f45d598cbf230002863bbd84004c38252b97031)
- Fix Docker ports: [#1485](https://github.com/cryptpad/cryptpad/pull/1485)
- Change _inactive_ to _archived_ in `config.example.js` file: [#1474](https://github.com/cryptpad/cryptpad/pull/1474)

## Improvements
- New translations from our Weblate contributors: [#1491](https://github.com/cryptpad/cryptpad/pull/1491)
  - Polish
  - French
  - Bulgarian
  - Hungarian
  - Basque
- Optimize default Nginx example config: [#1486](https://github.com/cryptpad/cryptpad/pull/1486)
- Add `.mjs` support in HTTPd example config: [#1471](https://github.com/cryptpad/cryptpad/pull/1471)

## Upgrade notes
If you are upgrading from a version older than `2024.3.0` please read the upgrade notes of all versions between yours and `2024.3.1` to avoid configuration issues.

To upgrade:

1. Stop your server
2. Get the latest code with git

```bash
git fetch origin --tags
git checkout 2024.3.1
npm ci
npm run install:components
./install-onlyoffice.sh
```

3. Restart your server
4. Review your instance's checkup page to ensure that you are passing all tests


# 2024.3.0

## Goals

This release is aimed at instance administrators with new features and changes in the way CryptPad is installed. This marks a major release and we are also taking the opportunity to change the way we number CryptPad versions, moving to a date-based format (from semver to [calver](https://calver.org/)). For full details on the reasons behind this change please read [our March 2024 status blog post](https://blog.cryptpad.org/2024/03/29/status-2024-03/). The short version is that this is our Spring 2024 release with number `2024.3.0` and that we are aiming for the following schedule going forward, sticking to the `YYYY.MM.micro` format:

- 💐 Spring `2024.3.0`
- 🌻 Summer `2024.6.0` end June 2024
- 🍁 Autumn `2024.9.0` end September 2024
- ❄️ Winter `2024.12.0` end December 2024


## Features

- Admin and moderation changes [#1438](https://github.com/cryptpad/cryptpad/pull/1438)
  - Support system refactoring with a new help-desk functionality, allowing non-admins to be moderators and handle support tickets
  - New instance customization features from the admin panel
    - Instance logo
    - Instance accent color
  - Admin panel code refactoring

## Improvements

- Completed accessibility improvements for all dropdown menus [#1380](https://github.com/cryptpad/cryptpad/pull/1380)
- Developer experience [#1436](https://github.com/cryptpad/cryptpad/pull/1436) with new `.editorconfig` and updated `.gitignore` files

## Fixes

- Fix Notifications replaying (#1399) [#1428](https://github.com/cryptpad/cryptpad/pull/1428)
- Fix hover and focus styling of toolbar menus [#1417](https://github.com/cryptpad/cryptpad/pull/1417)
- Fix ssoauth path regex [#1411](https://github.com/cryptpad/cryptpad/pull/1411)
- File upload broken with a specific size [#1419](https://github.com/cryptpad/cryptpad/issues/1419)
- User menu displays may include consecutive separators [#1402](https://github.com/cryptpad/cryptpad/issues/1402)

- Diagram
  - Enable and fix internal drawio exports [#1439](https://github.com/cryptpad/cryptpad/pull/1439)
- OnlyOffice
  - Do not allow OnlyOffice comments in view mode [#1424](https://github.com/cryptpad/cryptpad/pull/1424)

## Dependencies

### OnlyOffice

- OnlyOffice is now a separate module [#1435](https://github.com/cryptpad/cryptpad/pull/1435)
  - avoids having compiled binaries in the main code repository
  - first step towards new instances only downloading the current version + any future updates (i.e. avoiding 1.7GB of historical  OnlyOffice versions they will never use).

Starting with this version, OnlyOffice applications (Sheets, Document, Presentation) are not bundled with CryptPad anymore. You can install/update them by running the installation script we provide:

```bash
./install-onlyoffice.sh
# press q to close the license screen
# and Y ⏎ to accept the OnlyOffice license
```

For Docker users that want to use OnlyOffice, please read our updated [Docker installation guide](https://docs.cryptpad.org/en/admin_guide/installation.html#admin-docker-install).


### Others

- Bump follow-redirects from 1.15.4 to 1.15.6 [#1432](https://github.com/cryptpad/cryptpad/pull/1432)
- Bump jose from 4.15.3 to 4.15.5 [#1426](https://github.com/cryptpad/cryptpad/pull/1426)
- Bump express from 4.18.2 to 4.19.2 [#1451](https://github.com/cryptpad/cryptpad/pull/1451)


## Upgrade notes

If you are upgrading from a version older than `5.7` please read the upgrade notes of all versions between yours and `5.7` to avoid configuration issues.

To upgrade:

1. Stop your server
2. Get the latest code with git

```bash
git fetch origin --tags
git checkout 2024.3.0
./install-onlyoffice.sh
# press q to close the license screen
# and Y ⏎ to accept the OnlyOffice license
```

1. Restart your server
2. Review your instance's checkup page to ensure that you are passing all tests


# 5.7.0

## Goals

This release includes some features that could not be included into 5.6.0, namely instance invitations and support for images in diagrams. It also includes bug fixes in the drive, calendar and many other places.

## Features

- Instance administrators can now issue invitation links that can be used to create one account each, even if registration is closed on the instance. An optional User Directory can help keep track of the known accounts on the instance. This feature is designed for the needs of enterprise customers who use their own instance, hence allowing administrators access to more information than on a public-facing service [#1395](https://github.com/cryptpad/cryptpad/pull/1395)
- Diagram documents now support images [#1295](https://github.com/cryptpad/cryptpad/pull/1295)

## Fixes

- Fix access modal issues after password change [#1394](https://github.com/cryptpad/cryptpad/pull/1394)
- Drive
  - Shared folder access list [#1388](https://github.com/cryptpad/cryptpad/pull/1388)
  - File icons in drive [#1386](https://github.com/cryptpad/cryptpad/pull/1386)
  - Emptying trash with multiple folders and files fails [#1344](https://github.com/cryptpad/cryptpad/issues/1344)
  - Shared folder and drive, read-only link issue [#1238](https://github.com/cryptpad/cryptpad/issues/1238)
  - Loss of access to a shared folder after a double password change [#1365](https://github.com/cryptpad/cryptpad/issues/1365)
- Files
  - PDFjs rendering issue with Firefox 121 [#1393](https://github.com/cryptpad/cryptpad/pull/1393)
- Rich Text
  - Fix richtext issues [#1392](https://github.com/cryptpad/cryptpad/pull/1392)
    - Duplicated element in table of content (TOC) [#1336](https://github.com/cryptpad/cryptpad/issues/1336)
    - Anchors don't work anymore [#1226](https://github.com/cryptpad/cryptpad/issues/1226)
    - Rows and columns numbers in tables can't be modified anymore [#1358](https://github.com/cryptpad/cryptpad/issues/1358)
- Forms
  - Fix issue with duplicating choice/checkbox grid questions [#1359](https://github.com/cryptpad/cryptpad/pull/1359)
  - Date question datepicker/input field now displays correctly  [#1357](https://github.com/cryptpad/cryptpad/pull/1357)
  - Duplicated “Enter” event sent when navigating with keyboard [#1396](https://github.com/cryptpad/cryptpad/issues/1396)
- Kanban
  - Kanban item export [#1360](https://github.com/cryptpad/cryptpad/pull/1360)
- Calendar
  - Calendar datepicker on mobile now easily toggled  [#1368](https://github.com/cryptpad/cryptpad/pull/1368)
  - Behaviour change: keep the offset between start and end date constant when updating the start date (otherwise it was possible to create events that end before even starting that thus don’t appear in the calendar)
  - Calendar yearly recurring event - wrong month name [#1398](https://github.com/cryptpad/cryptpad/issues/1398)
- Admin
  - Encoding issues in broadcast messages [#1379](https://github.com/cryptpad/cryptpad/issues/1379)
- Deployment
  - Fix Cryptpad is unhealthy on Docker [#1350](https://github.com/cryptpad/cryptpad/pull/1350) thanks to @llaumgui


## Dependencies

- Bump follow-redirects from 1.15.3 to 1.15.4 [#1378](https://github.com/cryptpad/cryptpad/pull/1378)


## Upgrade notes

If you are upgrading from a version older than `5.6.0` please read the upgrade notes of all versions between yours and `5.6.0` to avoid configuration issues.

⚠️ Before proceeding note that this upgrade requires changes to the Nginx configuration, please see full diff below.

To upgrade:

1. Stop your server
2. Get the latest code with git

```bash
git fetch origin --tags
git checkout 5.7.0
```
3. Update dependencies

```bash
npm ci
npm run install:components
```

4. Restart your server
5. Review your instance's checkup page to ensure that you are passing all tests

### Nginx config changes

```diff
diff --git a/docs/example-advanced.nginx.conf b/docs/example-advanced.nginx.conf
index cb827b4b0..f2b32e959 100644
--- a/docs/example-advanced.nginx.conf
+++ b/docs/example-advanced.nginx.conf
@@ -14,6 +14,8 @@ server {

     # Let's Encrypt webroot
     include letsencrypt-webroot;
+    # Include mime.types to be able to support .mjs files (see "types" below)
+    include mime.types;

     # CryptPad serves static assets over these two domains.
     # `main_domain` is what users will enter in their address bar.
@@ -166,11 +168,6 @@ server {
     # We've applied other sandboxing techniques to mitigate the risk of running WebAssembly in this privileged scope
     if ($uri ~ ^\/unsafeiframe\/inner\.html.*$) { set $unsafe 1; }

-    # draw.io uses inline script tags in it's index.html. The hashes are added here.
-    if ($uri ~ ^\/components\/drawio\/src\/main\/webapp\/index.html.*$) {
-        set $scriptSrc "'self' 'sha256-dLMFD7ijAw6AVaqecS7kbPcFFzkxQ+yeZSsKpOdLxps=' 'sha256-6g514VrT/cZFZltSaKxIVNFF46+MFaTSDTPB8WfYK+c=' resource: https://${main_domain}";
-    }
-
     # privileged contexts allow a few more rights than unprivileged contexts, though limits are still applied
     if ($unsafe) {
         set $scriptSrc "'self' 'unsafe-eval' 'unsafe-inline' resource: https://${main_domain}";
@@ -179,6 +176,11 @@ server {
     # Finally, set all the rules you composed above.
     add_header Content-Security-Policy "default-src 'none'; child-src $childSrc; worker-src $workerSrc; media-src $mediaSrc; style-src $styleSrc; script-src $scriptSrc; connect-src $connectSrc; font-src $fontSrc; img-src $imgSrc; frame-src $frameSrc; frame-ancestors $frameAncestors";

+    # Add support for .mjs files used by pdfjs
+    types {
+        application/javascript mjs;
+    }
+
     # The nodejs process can handle all traffic whether accessed over websocket or as static assets
     # We prefer to serve static content from nginx directly and to leave the API server to handle
     # the dynamic content that only it can manage. This is primarily an optimization
```

# 5.6.0


## Goals

This release introduces support for integrating CryptPad instances with Single-Sign On authentication. It  brings a lot of improvements and fixes to Form, Calendar, and other parts of CryptPad. This release begins to improve the accessibility of the toolbar towards full WCAG compliance which we hope to achieve in the near future.

## Features

- Authentication
  - This version paves the way for SSO authentication for a CryptPad instance via a plugin (est. release Jan. 2024) [#1320](https://github.com/cryptpad/cryptpad/pull/1320)
  - New setting to make Two-Factor Authentication mandatory for all user accounts on an instance [#1341](https://github.com/cryptpad/cryptpad/pull/1341)
- Form
  - New button to duplicate a question [#1305](https://github.com/cryptpad/cryptpad/pull/1305)
- Calendar
  - New description field for calendar events [#1299](https://github.com/cryptpad/cryptpad/pull/1299)

## Improvements

- Accessibility of toolbars and some drop-down menus [#1290](https://github.com/cryptpad/cryptpad/pull/1290)
  -  "+ New" drop-down menu in Drive and Team Drive #1191
  -  New `Ctrl + e` modal #1192
  -  Code contact request notifications as headings #1197
  -  DOM order of toolbar #1198
  -  Notifications menu not accessible via Keyboard #1201
  -  Sidebar "tabs" not accessible via keyboard #1203
  -  Implement keyboard navigation of toolbar menus #1209
  -  CryptDrive page needs a logical tab order #1151
  -  Elements not accessible using the keyboard #1162
  -  Calendar event modal date-picker is cut-off at some screen resolutions #1280
  -  Visible focus #1206
- Rich Text
  - Improvements to the Rich Text toolbar and layout for mobile usage [#1296](https://github.com/cryptpad/cryptpad/pull/1296)
- Calendar
  - Handling the move of repeating events from a calendar to another [#1308](https://github.com/cryptpad/cryptpad/pull/1308)
- Kanban
  - Changed positioning of kanban tag container on smaller screens [#1307](https://github.com/cryptpad/cryptpad/pull/1307)
- New option to increase the number of teams slots for premium users only [#1315](https://github.com/cryptpad/cryptpad/pull/1315)
- Improve licensing information, CryptPad code now complies with the [REUSE](https://reuse.software/) specifications [#1300](https://github.com/cryptpad/cryptpad/pull/1300)
- Deployment
  - Basic configuration for Apache HTTPd [#1332](https://github.com/cryptpad/cryptpad/pull/1332)
  - Add Docker health check [#1287](https://github.com/cryptpad/cryptpad/pull/1287)
- Cleanup
  - Old // XXX comments [#1334](https://github.com/cryptpad/cryptpad/pull/1334)
  - Outdated/misplaced files [#1327](https://github.com/cryptpad/cryptpad/pull/1327)

## Fixes

- Fix browser autocomplete issues (password, numbers, etc.) [#1342](https://github.com/cryptpad/cryptpad/pull/1342)
- Drive
  - Container height fills screen [#1304](https://github.com/cryptpad/cryptpad/pull/1304)
  - Context menu on mobile [#1301](https://github.com/cryptpad/cryptpad/pull/1301)
- OnlyOffice applications
  - Use correct mime type for .wasm files (export functionality) [#1288](https://github.com/cryptpad/cryptpad/pull/1288)
  - Fix filter functionality in Sheets [#1319](https://github.com/cryptpad/cryptpad/issues/1319)
- Form
  - Fix an error upon importing a template in forms [#1316](https://github.com/cryptpad/cryptpad/pull/1316)
  - Can now set form closing date/time on mobile [#1305](https://github.com/cryptpad/cryptpad/pull/1305)
  - Can now edit time options for poll questions on mobile [#1305](https://github.com/cryptpad/cryptpad/pull/1305)
  - Dates in CSV exports of forms are now in ISO (not timestamp) format [#1305](https://github.com/cryptpad/cryptpad/pull/1305)
  - Page breaks are no longer visible in conditional sections when condition is not met [#1305](https://github.com/cryptpad/cryptpad/pull/1305)
  - Final submission page now has margins [#1305](https://github.com/cryptpad/cryptpad/pull/1305)
  - Question blocks on mobile are now only draggable at the top of the block to make scrolling possible [#1305](https://github.com/cryptpad/cryptpad/pull/1305)
- Whiteboard
  - Fix a few export-related issues [#1328](https://github.com/cryptpad/cryptpad/pull/1328)
- Calendar
  - Reformat `www/calendar/export.js` [#1314](https://github.com/cryptpad/cryptpad/pull/1314)
  - Fix a bug with stopping the recurrence of a calendar event [#1312](https://github.com/cryptpad/cryptpad/pull/1312)
  - Calendar creates itself twice when navigating with the keyboard	[#1250](https://github.com/cryptpad/cryptpad/issues/1250)
  - Fix timezone in Daylight Saving Time issues [#1317](https://github.com/cryptpad/cryptpad/pull/1317)
- Translations
  - Revise the translation of `zh` [#1329](https://github.com/cryptpad/cryptpad/pull/1329)

## Dependencies
- Added [Moment.js](http://momentjs.com/) for improved handling of dates in Calendar (added as part of [#1317](https://github.com/cryptpad/cryptpad/pull/1317))

## Deployment
We [fixed an issue with the Systemd service file and logging](https://github.com/cryptpad/cryptpad/commit/078095c3e25d39707bdaab7ec066ceed6cb7158b), you'll need to add the following lines to your `cryptpad.service` before continuing by following the upgrade notes below.

```diff
# Restart service after 10 seconds if node service crashes
RestartSec=2

+ # Proper logging to journald
+ StandardOutput=journal
+ StandardError=journal+console

User=cryptpad
Group=cryptpad
```

## Upgrade notes

If you are upgrading from a version older than `5.5.0` please read the upgrade notes of all versions between yours and `5.5.0` to avoid configuration issues.

To upgrade:

1. Reload the Systemd daemon, required due to the changes in the **Deployment** section
```bash
sudo systemctl daemon-reload
```

2. Stop your server
3. Get the latest code with git
```bash
git fetch origin --tags
git checkout 5.6.0
```

4. Restart your server
5. Review your instance's checkup page to ensure that you are passing all tests



# 5.5.0

## Features

- Moderation and content deletion features [#1253](https://github.com/cryptpad/cryptpad/pull/1253)
  * Moderation
    * archive an entire account and its owned documents from its public key
    * restore this entire account if necessary
  * Placeholder
    * unavailable documents now provide improved messages communicating the reason they are unavailable:
      - Deleted by an owner
      - Deleted by an admin + reason from admin team (user account or document)
      - Deleted for inactivity (documents not stored in a user drive and inactive)
      - Protected with a new password (user account or document)
    * it is no longer possible to re-use an previous password for a password-protected document
- Only Office upgrade to 7.3.3.60
  - New version of x2t for document conversions

## Improvements

- Accessibility
  - Add text labels to elements [#1163](https://github.com/cryptpad/cryptpad/issues/1163), [#1122](https://github.com/cryptpad/cryptpad/issues/1122), [#1123](https://github.com/cryptpad/cryptpad/issues/1123), [#1124](https://github.com/cryptpad/cryptpad/issues/1124), [#1128](https://github.com/cryptpad/cryptpad/issues/1128), [#1129](https://github.com/cryptpad/cryptpad/issues/1129), [#1131](https://github.com/cryptpad/cryptpad/issues/1131), [#1140](https://github.com/cryptpad/cryptpad/issues/1140), [#1150](https://github.com/cryptpad/cryptpad/issues/1150), [#1159](https://github.com/cryptpad/cryptpad/issues/1159), [#1195](https://github.com/cryptpad/cryptpad/issues/1195), [#1194](https://github.com/cryptpad/cryptpad/issues/1194)
  - Enable zooming and scaling [#1130](https://github.com/cryptpad/cryptpad/issues/1130)
  - Turn login error message into an instruction [#1207](https://github.com/cryptpad/cryptpad/issues/1207)
- Mobile usage
  - Fix the instance links layout on the home-page [#1085](https://github.com/cryptpad/cryptpad/issues/1085)
  - Display full file upload progress modal [#1086](https://github.com/cryptpad/cryptpad/issues/1086)
  - Add text to Teams buttons [#1093](https://github.com/cryptpad/cryptpad/issues/1093)
  - Fix button spacings [#1104](https://github.com/cryptpad/cryptpad/issues/1104), [#1106](https://github.com/cryptpad/cryptpad/issues/1106)
  - Add even space between category buttons [#1113](https://github.com/cryptpad/cryptpad/pull/1113) thanks to @lemondevxyz
  - Allow the About panel to be closed [#1088](https://github.com/cryptpad/cryptpad/issues/1088)
  - Calendar
    - Display full event edit panel [#1094](https://github.com/cryptpad/cryptpad/issues/1094)
    - Make menu usable [#971](https://github.com/cryptpad/cryptpad/issues/971)
  - Kanban
    - Hide markdown help button instead of breaking the layout [#1117](https://github.com/cryptpad/cryptpad/issues/1117)
    - Added margin for horizontal scroll [#1039](https://github.com/cryptpad/cryptpad/issues/1039)
    - Remove margin from cards and columns [#1120](https://github.com/cryptpad/cryptpad/issues/1120)

- Instance admin
  - Added a warning to `/admin/#stats` about a process that can crash the instance [#1176](https://github.com/cryptpad/cryptpad/issues/1176)
  - Added a setting to display a status page for the instance [#1172](https://github.com/cryptpad/cryptpad/issues/1172)
- Replace the "sign up" button on the log-in page with a link [#1164](https://github.com/cryptpad/cryptpad/issues/1164)
- Add support for Webp images [#1008] thanks @lukasdotcom
- improvements and bug fixes for the archival of inactive documents

## Fixes

- Revert a button spacing regression introduced with 5.4.0 [#1229](https://github.com/cryptpad/cryptpad/pull/1229)
- Login bug on the new Safari following macOS/iPadOS 14 [#1257](https://github.com/cryptpad/cryptpad/issues/1257)
- Mermaid diagrams were sometimes displayed over each other in Code documents [#1244](https://github.com/cryptpad/cryptpad/issues/1244)
- Own responses to a form could not be deleted [#1239](https://github.com/cryptpad/cryptpad/issues/1239)
- Timezone differences caused errors in Forms "date/time" polls
- The large attachment button did not look consistent in Forms [#1237](https://github.com/cryptpad/cryptpad/issues/1237)
- The recent tab in the drive was missing column titles [#1233](https://github.com/cryptpad/cryptpad/issues/1233)
- An export file type dropdown was hidden inside a popup [#1241](https://github.com/cryptpad/cryptpad/issues/1241)
- Guest emoji avatars were not displayed constistently [#1188](https://github.com/cryptpad/cryptpad/issues/1188)
- "Early Access" apps were not shown on the instance home page even when active
- OnlyOffice document conversions
  - Fix PDF export from Presentation document [#913](https://github.com/cryptpad/cryptpad/issues/913)
  - Print sheets with long links [#1032](https://github.com/cryptpad/cryptpad/issues/1032)
  - Fix some .xlsx imports [#1240](https://github.com/cryptpad/cryptpad/issues/1240)

## Dependencies

- Pin CKEditor to 4.22.1 [#1248](https://github.com/cryptpad/cryptpad/issues/1248)
- Prevent x2t from being cached [#1278](https://github.com/cryptpad/cryptpad/issues/1278)

## Deployment

We now support Nginx with two configurations (find more information in our [administrator guide](https://docs.cryptpad.org/en/admin_guide/installation.html#install-and-configure-nginx)):
* New recommended "basic" nginx config for small instances: `example.nginx.conf`
* Update to the old "advanced" config: `example-advanced.nginx.conf`
  * Add 2 lines in the "blob|block" section
```diff
# Requests for blobs and blocks are now proxied to the API server
# This simplifies NGINX path configuration in the event they are being hosted in a non-standard location
# or with odd unexpected permissions. Serving blobs in this manner also means that it will be possible to
# enforce access control for them, though this is not yet implemented.
# Access control (via TOTP 2FA) has been added to blocks, so they can be handled with the same directives.
location ~ ^/(blob|block)/.*$ {
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' "${allowed_origins}";
        add_header 'Access-Control-Allow-Credentials' true;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range';
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'application/octet-stream; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }
    # Since we are proxying to the API server these headers can get duplicated
    # so we hide them
    proxy_hide_header 'X-Content-Type-Options';
    proxy_hide_header 'Access-Control-Allow-Origin';
    proxy_hide_header 'Permissions-Policy';
    proxy_hide_header 'X-XSS-Protection';
+   proxy_hide_header 'Cross-Origin-Resource-Policy';
+   proxy_hide_header 'Cross-Origin-Embedder-Policy';
    proxy_pass http://localhost:3000;
}
```
  * Fix DrawIO hash not matching the latest version
```diff
    # draw.io uses inline script tags in it's index.html. The hashes are added here.
    if ($uri ~ ^\/components\/drawio\/src\/main\/webapp\/index.html.*$) {
-        set $scriptSrc "'self' 'sha256-6zAB96lsBZREqf0sT44BhH1T69sm7HrN34rpMOcWbNo=' 'sha256-6g514VrT/cZFZltSaKxIVNFF46+MFaTSDTPB8WfYK+c=' resource: https://${main_domain}";
+        set $scriptSrc "'self' 'sha256-dLMFD7ijAw6AVaqecS7kbPcFFzkxQ+yeZSsKpOdLxps=' 'sha256-6g514VrT/cZFZltSaKxIVNFF46+MFaTSDTPB8WfYK+c=' resource: https://${main_domain}";
    }
```

## Upgrade notes

If you are upgrading from a version older than `5.4.1` please read the upgrade notes of all versions between yours and `5.4.1` to avoid configuration issues.

To upgrade:

1. Stop your server
2. Get the latest code with git

```bash
git fetch origin --tags
git checkout 5.5.0
```

3. Update dependencies

```bash
npm ci
npm run install:components
```

4. Restart your server

5. Review your instance's checkup page to ensure that you are passing all tests

# 5.4.1

## Goals

This point release aims to fix some deployment related issues that were identified with 5.4.0

## Fixes

- Typo in example Nginx config [[#1184](https://github.com/cryptpad/cryptpad/issues/1184)]
- Enable port 3003 on Docker [[#1183](https://github.com/cryptpad/cryptpad/issues/1183]
- Bind websocket to the address specified in the `httpAddress` setting [[#1182](https://github.com/cryptpad/cryptpad/issues/1182) [#1186](https://github.com/cryptpad/cryptpad/issues/1186)]
- Fix production CSP headers [[#912](https://github.com/cryptpad/cryptpad/pull/912) thanks @superboum]
- Fix checkup test when registration is restricted [[#1185](https://github.com/cryptpad/cryptpad/issues/1185)]
- Fix collaboration of Nextcloud integration
- Fix broadcast settings not applied instantly [[#1189](https://github.com/cryptpad/cryptpad/issues/1189)]

## Upgrade notes

If you are upgrading from a version older than `5.4.0` please read the upgrade notes of all versions between yours and `5.4.0` to avoid configuration issues.

To upgrade:

1. Stop your server
2. Get the latest code with git

```bash
git fetch origin --tags
git checkout 5.4.1
```

1. Restart your server
2. Review your instance's checkup page to ensure that you are passing all tests

# 5.4.0

## Goals

This release introduces two major new features:
- New Diagram application
- 2 factor authentication using time-based one-time passwords (TOTP)

Also included are some improvements, dependency updates, and bug fixes

## Features

- Diagram application: integration of [Draw.io](https://www.drawio.com/) with CryptPad's encrypted real time collaboration [[#1070](https://github.com/cryptpad/cryptpad/pull/1070)]
  - Introduce a new app color for Diagram and adjust Whiteboard color [[#1059](https://github.com/cryptpad/cryptpad/issues/1059)]
- New 2 Factor Authentication with TOTP [[#1071](https://github.com/cryptpad/cryptpad/pull/1071)]. To enable for a user account:
  1. Settings > Security & Privacy
  2. Enter your password
  3. Save the recovery code
  4. Snap the QR code with a 2FA app of your choice
  5. ✅ 2FA is enabled
- Docker deployment is now officially supported [[#1064](https://github.com/cryptpad/cryptpad/pull/1064)]

## Improvements

- New setting to destroy all documents of which you are the sole owner
- Settings re-organization
- Add favicons in ICO format [[#1068](https://github.com/cryptpad/cryptpad/pull/1068) thanks @lemondevxyz]

## Bugs / issues

- Form
  - Make Form question text selectable in participant view [[#1046](https://github.com/cryptpad/cryptpad/issues/1046)]
  - Add form title to archived notifications [[#1065](https://github.com/cryptpad/cryptpad/pull/1065) thanks to @lemondevxyz]
- Add "make a copy" to office editors [[#1067](https://github.com/cryptpad/cryptpad/pull/1067) thanks to @lemondevxyz]
- Disable the "protect tab" feature in Sheets as it cannot be integrated in CryptPad [[#1053](https://github.com/cryptpad/cryptpad/issues/1053)]

## Dependencies

- Remove Bower to manage client side dependencies [[#989](https://github.com/cryptpad/cryptpad/pull/989) [#1072](https://github.com/cryptpad/cryptpad/pull/1072) thanks to @Pamplemousse] ⚠️ Please read upgrade notes carefully if you administer an instance
- Upgrade Mermaid diagrams to 10.2.4 [[#1118](https://github.com/cryptpad/cryptpad/issues/1118)]
- Upgrade CKeditor to 4.22.1 [[#1119](https://github.com/cryptpad/cryptpad/issues/1119)]


## Upgrade notes

⚠️ Please read upgrade notes carefully as this version introduces breaking changes

If you are upgrading from a version older than `5.3.0` please read the upgrade notes of all versions between yours and `5.4.0` to avoid configuration issues.

To upgrade:

1. Stop your server
2. Get the latest code with git
  ```bash
  git fetch origin --tags
  git checkout 5.4.0
  ```
3. Major changes to the Nginx config
    - Access-Control-Allow-Credentials header
    - proxy_pass request for /blob/ and /block/ to the node process
    - new port for the websocket
    - set CSP headers for draw.io, used by the new diagram app
    - see the [full diff](https://github.com/cryptpad/cryptpad/compare/5.4-rc#diff-a97d166145edec9545df5228d500c144bd5ec20db759cf5cc6f90309e963b1ca)
4. Bower removed
    - To download all dependencies, use `npm install`
    - Then, to copy client-side dependencies, use `npm run install:components`
    - `www/bower_components` can be removed
5. If you have previously used the `build` command to enable opengraph preview images
    - Please run `npm run build` again after upgrading
6. Restart your server
7. Review your instance's checkup page to ensure that you are passing all tests

# 5.3.0

## Goals

This release updates OnlyOffice applications to version 7.1 It improves the Form application and other areas of CryptPad with minor features and bug fixes.

## Features

- Upgrade OnlyOffice applications (Sheet, Document, Presentation) to version 7.1

- Forms
  - New question type: Date [[#811](https://github.com/cryptpad/cryptpad/issues/811)]
  - Add Condorcet voting results to ordered list responses

- Default dark theme switch [[#759](https://github.com/cryptpad/cryptpad/issues/759)]: set dark theme as the default for the instance in `application_config.js`

- New FreeBSD rc.d init script

## Improvements

- Auto-select document name on edit if it's still the default [thanks to [piemonkey](https://github.com/piemonkey)]

- Forms
  - Clarify button text to "Copy Public Link" [[#937](https://github.com/cryptpad/cryptpad/issues/937)]
  - Clarify text on the document creation screen so that "Expiration date" (date at which the document will be destroyed) is not confused with the _closing date_ of the form [user feedback]
  - Decimals are now allowed in text questions with type "number" [[Forum](https://forum.cryptpad.org/d/88-decimals-in-number-type-text-field)]

- Rich Text
  - Move width-toggle button out of the way of the text [[#957](https://github.com/cryptpad/cryptpad/issues/957)]

- Deployment
  - Systemd: Removed outdated logging directives and implemented sandboxing and other hardening best practices
  - Nginx: Invert settings to forbid remote embedding by default

- Removed unused dev dependencies

## Bug Fixes

- Forms and Kanban
  - Fixed spacing issues with input fields

- Forms
  - Fixed ways to bypass "required" questions [[#1007](https://github.com/cryptpad/cryptpad/issues/1007) [#1014](https://github.com/cryptpad/cryptpad/issues/1014)]
  - Fix missing notifications for responses
  - Send response notifications to all owners

- Rich Text
  - Fix scroll issues when clicking on the table of contents
  - Fix double notification for mention + reply in a comment

- Fix issues with deprecated cache

- Fix bug that kept certain documents from being "pinned" to the drive. This could lead them to be deleted for inactivity even though they were stored in the drive. Note that storage quotas may increase as a result

## Update notes

If you are upgrading from a version older than `5.2.0` please read the upgrade notes of all versions between yours and `5.3.0` to avoid configuration issues.

To upgrade:

1. Stop your server
2. Get the latest code with git

```bash
git fetch origin --tags
git checkout 5.3.0
```

1. Restart your server
2. Review your instance's checkup page to ensure that you are passing all tests

# 5.2.1

## Goals

This minor releases fixes a bug with one of the Form features introduced in 5.2.0.

We took the opportunity to include two other fixes for older issues.

## Bug Fixes

- The option to delete all responses to a form was not available to form authors when the form had been created in a drive (user or team) using the **+ NEW** button

- Drag & drop from a shared folder into the Templates folder made documents "disappear". They would reappear in the root of the drive when using a new worker (after all CryptPad tabs had been closed)

- Clicking a link in a Calendar event location field failed to open

## Update notes

Our `5.2.0` release introduced some changes to the Nginx configuration. If you are not already running `5.2.0` we recommend following the upgrade notes for that version first, and then updating to `5.2.1`

To do so:

1. Stop your server
2. Get the latest code with git

```bash
git fetch origin --tags
git checkout 5.2.1
```

1. Install the latest dependencies with `bower update`
2. Restart your server
3. Review your instance's checkup page to ensure that you are passing all tests

# 5.2.0

## Goals

This release is focused on addressing long-standing user feedback with new features. The most requested are improvements to Forms—multiple submissions and the ability to delete responses—as well as recurring events in Calendar.

## Features

- Forms
  - New setting to allow participants (including Guests) to submit a form multiple times and/or delete their responses
  - Notifications for form owners when new responses are submitted
  - New option for form authors to delete all responses
  - New option for form authors/auditors to export responses as JSON (in addition to existing CSV and CryptPad Sheet)
  - Settings have been refactored in a modal with a summary in the main editor view
  - Display fixes for long questions/options in some question types

- Calendar
  - New event settings to repeat periodically
    - quick default patterns (e.g. weekly on Mondays, yearly on December 14th, etc), and custom intervals
    - modify one, future, or all events
    - easily stop repetition from event preview

- Drive
  - New button to filter the drive view by document type

- Teams
  - Improved onboarding with the ability to use the same invitation link for a set number of people. Previously each link was limited to one use
  - Initial role can now be set for invitation links, the recipient is assigned the role directly when joining, previously all new members joined as "Viewers"

- Code
  - Asciidoc syntax support AND asciidoc rendering
  - New jade language support
  - Removed duplicate C-language option

- /checkup/
  - [new test to confirm that public instances are open for registration](https://github.com/cryptpad/cryptpad/commit/174d97c442d5400d512dfccc478fd9fbd6fa075c)
  - new test to check that the host provides an HSTS header

## Update notes

To update from `5.1.0` to `5.2.0`:

1. Read the **Nginx** section below to ensure you are using the right version and update your reverse proxy configuration to match the settings in our current `./docs/example.nginx.conf`
2. Reload nginx
3. Stop your API server
4. Fetch the latest code with git
5. Install the latest dependencies with `bower update` and `npm i`
6. Restart your server
7. Review your instance's checkup page to ensure that all tests are passing

### Nginx

We added some directives that may cause issues with older versions of Nginx. We now recommend and only support [Nginx stable](https://nginx.org/en/download.html). Please note that if you are running below `v1.14.2`, applying this update will likely result in breakage.
- Internet Protocol version 6 ([IPv6](https://en.wikipedia.org/wiki/IPv6)) support
- TLS generation, see [the recent tutorial](https://blog.cryptpad.org/2022/12/12/tutorial-nginx-tls-acme/) on our blog
- Better [TLS sessions](https://vincent.bernat.ch/en/blog/2011-ssl-session-reuse-rfc5077),  handling timeout, tickets & longer cache
- Longer [HTTP Strict Transport Security](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security) (HSTS), now 2 years
- [Online Certificate Status Protocol](https://en.wikipedia.org/wiki/OCSP_stapling) (OCSP) stapling support

# 5.1.0

## Goals

We had two new members join our team in the time since our previous release.

Mathilde joined us as an administrator of CryptPad.fr, so we decided to put some unplanned time towards the platform's administrative tooling to simplify some common workflows.

Maxime joined us for a summer internship as a front-end developer, and took initiative on a number of popular issues from our tracker on GitHub.

## Update notes

* We applied a minor optimization to CryptPad's caching rules which should result in a slight decrease of many pages' loading times, thanks to some helpful profiling by one of our users.


* We have started implementing a very basic build system for CryptPad which, at the moment, is only responsible for generating a few static HTML pages.
  * These pages include the _opengraph_ tags which describe how previews of the page should be rendered in social media posts, messenger applications, and search engine summaries.
  * For the moment we haven't configured the system to build distinct pages for every language, so they will include text which is hardcoded in a single language which defaults to English. This can be configured in `config/config.js` (for example: `preferredLanguage: 'de',`). We intend to improve this in the future.
  * They also update the content of the page's `<noscript>` tag, which is displayed in the event that the user has disabled JavaScript in their browser. The build system includes every translation of this message that is available, rather than just the English and French translations that were displayed previously.
  * We've included some new tests on the checkup page to detect whether these customized pages have been built, and to remind administrators to generate them otherwise (using `npm run build`).
  * Because the generated pages are based on the current default versions of these pages, updating to future versions of the software without re-building could result in errors due to outdated code being served. We'll include reminders in the update steps as we do for other common errors.


* In order for the above changes to be effective, you'll need to update your NGINX configuration file. You can use git to see what has changed since v5.0.0 by running `git diff 5.0.0...main ./docs` in the root of your CryptPad repository.


* We've updated the home page to use a distinct version of the CryptPad logo for its main image. This makes it easier to customize the home page itself without impacting the rest of the platform. To override the default image, include your own at `/customize/CryptPad_logo_hero.svg`.


* Finally, a number of admins had opted into inclusion in our public instance directory but had not configured pages for their privacy policy or terms of service, which caused the checkup page to display an error. We've updated this error message to point directly to the relevant documentation, since the previous values were not sufficiently clear.


To update from `5.0.0` to `5.1.0`:

1. Update your reverse proxy configuration to match the settings in our current `./docs/example.nginx.conf` and reload its configuration
2. Stop your API server
3. Fetch the latest code with git
4. Install the latest dependencies with `bower update` and `npm i`
5. Run `npm run build` to generate the new static pages
5. Restart your server
6. Review your instance's checkup page to ensure that you are passing all tests

## Features

* Administration:
  * The instance admin panel now features a "Database" tab which makes it possible to generate reports for accounts, documents, and "login blocks". This finally enables administrators to review document and account metadata, archive or restore data, and generally perform actions that used to require specialized knowledge about the platform's data storage formats.
  * Since the _Database_ tab identifies accounts by their public signing keys, we made it easier to access these keys by adding a button to support tickets which copies the author's key to your clipboard.
* Thanks to contributors, the platform is now available in Spanish (100%) and  European Portuguese (91%).
* We've updated our mermaid integration to [v9.1.7](https://github.com/mermaid-js/mermaid/releases/tag/v9.1.7).
* Spellcheck is now enabled by default in our rich text editor and can be disabled via the settings page in case you have not already done so.
* Our code editor now includes a highlighting module for _asciidoc_ syntax.
* The contact page has been updated to reflect that we have migrated our Mastodon account to [Fosstodon.org/@cryptpad](https://fosstodon.org/@cryptpad)
* Various links throughout the platform have been updated to reflect that we've migrated our documentation from docs.cryptpad.fr to [docs.cryptpad.org](https://docs.cryptpad.org). The old domain now redirects to the new one to preserve compatibility with old instances or any other pages that have linked to it.
* We've updated our issue templates on GitHub to use their new _Issue Forms_ functionality, making it easier to correctly submit a well-formatted bug report or feature request.
* The project's readme now includes a widget indicating the completeness of CryptPad's translations on our Weblate instance.
* We've added a placeholder to pages' basic HTML to make it easier to tell that something is happening before the proper loading screen is displayed.

## Bug fixes

* Thanks to some detailed reports from users of our spreadsheet editor we were able to reproduce an error that caused very large changes to be saved incorrectly. Such changes trigger multi-part messages to be created, but only the first message was correctly sent to the server. The client has now been updated to correctly send each part of the patch.
* The behaviour of the long-form text input editor in our form app was not consistent with markdown-editing interfaces on the rest of the platform, so we enabled the same functionality as elsewhere.
* Administration
  * We found that the quantity of support tickets shown for each category was sometimes inaccurate, so we corrected the way this number was computed.
  * A change in the internal format of each instance's name, location, and description caused these fields not to be included in telemetry for instances that had opted into the [public instance directory](https://cryptpad.org/instances/). We've corrected this so such instances provide all the necessary information.
  * We've corrected some logic for displaying configured URLs for privacy policies, terms of service, and similar resources such that relative URLs are considered relative to the top-level domain (rather than the sandbox domain).
  * The "Launch time" value on the admin panel was using a hard-coded rather than the relevant translation, and was not correctly updating when the "Refresh" button was clicked. Both issues have been fixed.
  * Members of editing sessions are correctly informed when administrators archive active channels.
  * The _Custom limits_ section of the API is now displayed in a somewhat nicer table.
* A flaw in some of the styles for the kanban app made it impossible to add text to an empty card via the usual inline text field UI. Adding placeholder content to this field made the default click events work as expected.
* Dropdowns with text content containing quotes (such as those that could be created in the form app) caused an invalid CSS selector to be constructed, which resulted in rendering issues. Such quotes are now properly escaped.
* We found that some message handlers in CryptPad were receiving and trying to parse messages from unexpected sources (browser extensions). These messages triggered parsing errors which cause CryptPad's error screen to be displayed. We now guard against such messages and ignore them when they are not in the expected format or when they otherwise trigger parsing errors.
* We updated our translation linting script to compare markup and variable substitution patterns across different translations. We identified and fixed quite a few errors (invalid markup, incomplete translations), and expect to have an easier time ensuring consistency going forward.

# 5.0.0

## Goals

This release was centered around two main goals:

1. Implement a new, more modern and minimalist design with rounded corners and simpler colors
2. Remove detailed information about the open-source project from the platform itself and instead host it on the recently deployed project site (https://cryptpad.org)

## Update notes

Recent versions of CryptPad have introduced strict configuration requirements. If you are not already running version `4.14.1` then we recommend you read the notes of our past few releases and apply their updates in sequence. Each version introduces new tests on the checkup page which will help to identify configuration errors that may result in a non-functional server unless corrected.

Version 5.0.0 introduces a new server-side API (`/api/instance`) which serves customized information (server name, description, hosting location) from the admin panel so that it can be displayed on the redesigned home page.

We've done some extra work relative to similar APIs we've introduced in the past to ensure that the client-side code will continue to work without it. The upgrade process should go smoothly even if you fail to apply the suggested updates to your reverse proxy configuration (see `cryptpad/docs/example.nginx.conf`). If this data cannot be retrieved by the client it will fall back to some sensible defaults, but we recommend you take the time to fix it now in case this API ceases to be optional in some future release. The checkup page will identify whether the API is accessible and display an error otherwise.

```diff
diff --git a/docs/example.nginx.conf b/docs/example.nginx.conf
index a2d1cb1ce..23139c58c 100644
--- a/docs/example.nginx.conf
+++ b/docs/example.nginx.conf
@@ -183,7 +183,7 @@ server {
     # /api/config is loaded once per page load and is used to retrieve
     # the caching variable which is applied to every other resource
     # which is loaded during that session.
-    location ~ ^/api/(config|broadcast).*$ {
+    location ~ ^/api/.*$ {
         proxy_pass http://localhost:3000;
         proxy_set_header X-Real-IP $remote_addr;
         proxy_set_header Host $host;
```

To update from `4.14.1` to `5.0.0`:

1. Update your reverse proxy configuration to forward all `/api/` requests to the API server, as per the diff shown above, and reload your reverse proxy config
2. Stop your API server
3. Fetch the latest code with git
4. Install the latest dependencies with `bower update` and `npm i`
5. Restart your server
6. Review your instance's checkup page to ensure that you are passing all tests

## Features

* The most notable feature of this release is its new look: with rounded corners, a more subtle use of colors, and some updated icons.
* As noted above, instance information from the admin panel is now displayed on the home page, making it easier to customize a CryptPad instance without having to edit so many files on the server. In particular, the home page will now display:
  1. The instance's configured name or its domain (as a default).
  2. The instance's description or a default string.
  3. The instance's hosting location (if specified).
  4. An optional notice to be displayed as a banner.
* Many of the informational pages have been replaced by a link the project site (cryptpad.org). Links to optional, instance-specific pages like its terms of service, privacy policy, legal notice and contact information are displayed inline, allowing for a smaller footer.
* The drive's directory tree (also shown in teams) can now be resized by dragging its border.
* The checkup page features several new tests, including some which only apply to public instances (a description and location are expected if you have opted into the public instance directory (https://cryptpad.org/instances/).

## Bug fixes

* The font selector in our OnlyOffice-based editors (sheets, docs, presentations) now supports several new fonts, and we've fixed a rendering error which caused the wrong font to be selected when clicking on certain options in the dropdown list (https://github.com/cryptpad/cryptpad/issues/898).
* Clicking on an option in the user administration menu (in the top-right corner) didn't automatically close the menu in some cases because some browsers emitted an event while others did not. We now explicitly close this menu when any of its options are clicked.
* We now guard against a type error that occurred when trying to generate a list of documents to "pin" while shared folders were still in the process of synchronizing.
* Thanks to a user report we identified that when a premium user uploaded to a non-premium team the error message incorrectly indicated that the uploaded file exceeded the premium size limit (rather than the non-premium size limit). This resulted in confusing behaviour where a 30MB file was described as being over the 150MB file upload limit. We've updated the resulting error message to display the appropriate size limit and indicate that it is relative to the target drive or team, rather than the user's account.
* Another user reported that they had trouble exporting OnlyOffice documents that contained certain unprintable control characters in their file names. We now remove those unprintable characters when exporting.
* We noticed that very long messages in team invitation links could overflow their container, so we fixed its incorrect styles.
* We observed that some third-party instances had been incorrectly configured such that when they entered an editor's URL (such as `/pad`) they only observed a blank page rather than being redirected to the appropriate URL which contained a trailing slash (ie. `/pad/`). We've added a script which detects such cases and redirects to the appropriate URL if it exists.

# 4.14.1

This minor release fixes a number of bugs that we noticed after deploying 4.14.0.

* A bug in the code responsible for loading document metadata caused documents to be incorrectly treated as if they had no owners. As a result, several options in the Drive's UI did not work as expected:
  * owned documents could not be destroyed from the access menu.
  * document passwords could not be changed from the access menu.
  * document history could not be trimmed from the properties menu.
* We also found that some components did not behave as expected in the Drive UI while in history mode:
  * it was not possible to open shared folders' menus (properties, share, access) to view what their properties were in the past (in the event that they had been deleted or had their passwords changed).
  * shared folders names were not correctly displayed even when their data was available.
* Some last minute changes to the checkup page before the 4.14.0 release caused a default error message to be incorrectly concatenated with the intended error message for each failing test.
* A rule in one of our translation linting scripts incorrectly flagged the "ise" in the word "milliseconds" as an instance of the UK-English "-ise" suffix (we use "-ize" elsewhere).
* An admin of a third-party instance found that they were unable to load their checkup page. As it turned out, they were trying to access it via `/checkup` instead of `/checkup/`. We've updated our example NGINX config to rewrite this URL to include the trailing slash.
* Some of the comments in `cryptpad/config/config.example.js` were outdated or incorrect and have been removed or corrected.
* The "About CryptPad" now correctly accepts handles custom links provided as protocol-relative URLs.
* A number of pages did not set custom titles and instead used the default "CryptPad". They now update the document title, making it possible to distinguish between such pages when you have multiple tabs open.
* The forms and kanban apps both allow users to write content in Markdown, but did not always display the toolbar above their editors. This was because they inferred the user's preferred editor configuration based on whether they had collapsed the toolbar in the code editor. Since these apps don't offer an easy way to display the toolbar once more, we decided that it was better to just display it all the time.

We've also merged a few significant improvements:

* The Polish translation was updated by Dariusz Laska.
* A significant percentage (currently 66%) of the Ukrainian translation has also been completed and enabled.
* We've updated Mermaidjs to version 9.0.0, which fixes a number of bugs and also introduces support for [`gitGraph` diagrams](https://mermaid-js.github.io/mermaid/#/gitgraph?id=gitgraph-diagrams)
* Users on cryptpad.fr will no longer be warned that they are leaving the platform when they open a link to our documentation. Users on third-party instances will continue to see the usual warning, since they really are navigating to a site operated by different admins.

Our `4.14.0` release notes introduced breaking changes. If you are not already running `4.14.0` we recommend updating to that first, then updating to `4.14.1` once you've confirmed that you are correctly passing all the tests on your instance's checkup page.S

To do so:

1. Stop your server
2. Get the latest code with git
3. Install the latest dependencies with `bower update` and `npm i`
4. Restart your server
5. Review your instance's checkup page to ensure that you are passing all tests

# 4.14.0

## Goals

Our main goal for this release was to follow up on some of the findings of the [Intigriti](https://www.intigriti.com/) bug bounty program that was [sponsored by the European Commission](https://ec.europa.eu/info/news/european-commissions-open-source-programme-office-starts-bug-bounties-2022-jan-19_en). We also aimed to deploy some features that we want to have in place before the deployment of our upcoming 5.0 release and a corresponding update to our project site ([cryptpad.org](https://cryptpad.org)). You can read more about all of this in [our latest blog post](https://blog.cryptpad.org/2022/03/29/March-2022-status-catching-up-on-recent-news/).

## Update notes

This release includes **BREAKING CHANGES**, especially if you have not configured your instance correctly. We advise that you read the following section carefully and follow its recommendations as closely as possible if you operate your own CryptPad instance.

First, some review: CryptPad is designed to be deployed using two domains. One is the primary domain which users enter into their address bar, while the second is a "sandbox" that is loaded indirectly. Sensitive operations like cryptographic key management are performed in the scope of the primary domain, while the sandbox is used to load the majority of the platform's UI. If there is a vulnerability in the sandbox, it is at least limited in scope because of measures we've taken to prevent it from accessing user accounts' keys. We initially introduced this system [nearly five years ago](https://blog.cryptpad.org/2017/08/30/CryptPad-s-new-Secure-Cross-Domain-Iframe/), it is described in [our admin installation guide](https://docs.cryptpad.org/en/admin_guide/installation.html#domains), and we've done our best to make sure admins are aware of its importance. Even so, only a small number of our admins follow our recommendations.

Since we've tried every other option we could think of to inform administrators of the risks of storing sensitive data on a misconfigured CryptPad instance, we are now adopting a more drastic policy where correct behaviour is _enforced_ in the code itself. What that means for admins is that if you fail to implement configuration parameters which we consider essential, then various parts of the codebase will detect this and _refuse to operate_.

If your instance is configured correctly, then this shouldn't impact you at all. If you're worried that you might be impacted, then the best course of action is to update to 4.13.0 (the previous release, if you aren't already running it) and to follow its recommendation to review the checkup page and ensure that your instance passes its self-diagnostic tests. _4.14.0_ introduces a large number of new tests, but those that were already present in 4.13.0 should identify the major issues that will prevent your instance from loading after the update.

Now, a bit about the situations in which CryptPad will fail to load:

* if CryptPad is loaded via any origin that does not match its configured `httpUnsafeOrigin`, then it will abort.
  * hint: for cryptpad.fr, this value is `https://cryptpad.fr`
* if CryptPad's sandbox does not correctly block the use of `eval`, then it will abort.
  * the use of `eval` is blocked by the recommended `Content-Security-Policy` headers. These strict headers are applied to most resources loaded from the _sandbox origin_.
  * hint: for cryptpad.fr the `httpSafeOrigin` is `https://sandbox.cryptpad.info`, while our NGINX sets `$sandbox_domain` to `sandbox.cryptpad.info`.
* if CryptPad is loaded in a browser that does not enforce `Content-Security-Policy` (such as Internet Explorer or any other browser using a non-compliant configuration) then it will abort.
* if CryptPad is embedded within an iframe and you have not explicitly enabled embedding via the admin panel (more on that later) it will abort.
* if any CryptPad application that requires special permissions (drive, calendar, sheet, doc, presentation) is loaded in an iframe then it will abort.

The reasons for blocking embedding will be described in the _Features_ section below, so keep reading if you're curious.

We're also recommending a few more updates, but we don't expect that these will stop the service from loading:

* NodeJS `v12.14.0` (which we have recommended for some time) will be considered _End-Of-Life_ as of April 30th.
  * We recommend updating to [NodeJS v16.14.2](https://nodejs.org/en/download/) via [NVM](https://github.com/nvm-sh/nvm).
  * The API server will check the version of its runtime when it launches. It will print a warning to your server logs and set a public flag in `/api/config` indicating that it should be updated. There is a corresponding test on the checkup page which checks for the presence of this flag for admins that aren't in the habit of reviewing their logs.
* The recommended NGINX config file also includes some minor changes. You can compare the current version (in `cryptpad/docs/example.nginx.conf`) against your live config with a diff tool. There are also new tests on the checkup page which will identify whether the newly changed headers have been correctly applied.
* There are updates to our dependencies using both `npm` and `bower`.
* There are a number of new configuration parameters that can be customized via `application_config.js`. Some are optional. A number of other parameters, such as URLs for a privacy policy and terms of service, will be expected if your instance permits registration. The checkup page will display warnings if these are absent. Configuration via `application_config.js` is described in [our docs](https://docs.cryptpad.org/en/admin_guide/customization.html#application-config).

We've also made a number of changes and additions to the instance admin panel:

* controls for archiving and restoring documents can now be found under _User storage_, rather _General_.
  * Both sections now include an optional "note" field, allowing admins to specify the reason why a document was archived/restored. This value will be included in the server's logs.
* the _Performance_ tab now includes two new settings which permit admins to enable a new API endpoint (`/api/profiling`) which exposes some live performance data as JSON endpoint. If you don't know what this means you probably don't need it.
* The admin support ticket panel now responds somewhat more quickly thanks to some sorting optimizations.
* The _General_ tab now includes three new fields (instance name, instance description, hosting location).
  * These are primarily intended for admins who have opted in to inclusion in the directory of public instances which we plan to deploy along with our next release.
  * In the future we hope to use these values on the home page as well, making it easier to customize your instance.

To update from  4.13.0 to 4.14.0:

0. Before updating, review your instance's checkup page to see whether you have any unresolved issues
1. Install NodeJS v16.14.2
2. Update your systemd service file (or whatever method you use to launch CryptPad) to use the newer NodeJS version
3. Update your NGINX configuration file to match the provided example
4. Stop your server
5. Get the latest code with git
6. Install the latest dependencies with `bower update` and `npm i`
7. Restart your server
8. Confirm that your instance is passing all the tests included on the `/checkup/` page (on whatever devices you intend to support)

## Features

* Embedding of CryptPad in iframes on third-party websites is now disabled by default because doing so prevents a number of possible attacks in cases of overly permissive HTTP headers.
  * CryptPad's editors will only load properly if the instance is explicitly configured via the admin panel to permit this behaviour.
  * Even where embedding is enabled, the properties, share, access, and insert menus are disabled. Attempts to use them cause a dialog to open which prompts users to open the current document/page in a dedicated tab/window.
  * The _embed_ tab of the share menu (which generates code for embedding CryptPad documents in third-party sites) is only shown if the instance administrators have enabled embedding.
* More information about the host instance is included in the _About CryptPad_ dialog which can be opened via the account administration menu in the top-right corner of the screen.
  * specifically: it now displays the same configurable instance description which is displayed on the home page, as well as links to the instance's terms of service and source code (if they are available).
* The support page has a number of new features:
  * A new tab is accessible via the left sidebar which displays a preview of the metadata which is included along with support tickets.
  * We revised the ticket categories which are listed in the dropdown menu. Users are prompted to choose a category. Once a category is chosen, more specific information is automatically requested with links to the relevant documentation.
* The login page now features a reminder that _administrators cannot reset passwords or recover accounts_.
* Tracking parameters are automatically removed from the address bar after the page loads for cases where a third-party tool automatically added them.
* Calendars in the sidebar of the calendar app are now sorted according to their title.
* The checkup page features many new tests and improvements:
  * Errors are now sorted above warnings.
  * Errors and warnings are each sorted according to their test number.
  * In cases where multiple tests need to inspect the HTTP headers of a common resource, the resource is only requested once and subsequent requests access it from a cache, speeding up loading time and reducing network usage.
  * The _Server header_ is displayed in the page summary if it is available.
  * The tests for CSP headers now describe the failures of _each misconfigured CSP directive_, rather than just the first one to fail.
  * Warnings are displayed for each of several important resources (privacy policy, terms of service, etc) when the instance allows registration but has not provided this information for new users.
  * Our test runner catches synchronously thrown errors and tries to display helpful messages.
  * Tests will time out after 25 seconds to ensure that the set of tests eventually completes.
  * A new script is executed before CryptPad's bootloader which should detect and handle bootloader errors such as missing dependencies or unreachable API endpoints.

## Bug fixes

* The checkup page now handles and error that occurred when trying to parse CSP headers that were not provided (trying to parse `null` as a string).
* The form app allowed authors to specify links (via markdown) in questions' descriptions and the form's submit message, but none of these links used CryptPad's typical link click handler. As a result these links failed to open.
* Links specified on users' profile pages are opened via the _bounce_ app, which warns users when a link will navigate outside CryptPad and blocks links which are clearly malicious in nature (trying to execute code).
* We discovered and fixed a deadlock that occurred in cases where users tried to download a folder that contained multiple Office documents.
* The drive's _history mode_ now displays the appropriate document id in the properties menu in cases where an earlier version of a document had a different id (due to a password change).
* During development of a new feature we discovered that the server could respond to HTTP requests with _stack traces_ in cases where the request triggered an error. These responses could contain information about the server's directory structure, so we now handle these errors and send the client a page indicating that there was an internal server error.
* Attempting to convert office documents could mistakenly trigger two concurrent downloads of the client-side conversion engine. Now it is only downloaded once, so conversion should be roughly twice as fast for cases where the WebAssembly blob was not already cached.
* A number of users reported various actions which could cause documents in their team drives to be duplicated. These duplicated entries are _references to the same document as the original_, not complete copies, so care should be taken **not to use the destroy option** when removing them from your drive. If a user accidentally destroys a document then it should be possible for an administrator to restore its content via the admin panel if the user can provide a [safe link](https://docs.cryptpad.org/en/user_guide/user_account.html?highlight=safe%20link#confidentiality) that they can find using the drive's _history mode_.

# 4.13.0

## Goals

For this release we set aside time to update a number of our software dependencies and to investigate a variety of bugs that had been reported in support tickets.

We have also been coordinating with security researchers through a bug bounty program hosted by [Intigriti.com](https://intigriti.com) and sponsored by the European Commission. This release includes security fixes and a number of new tests on the checkup page to help ensure that your instance is configured in the most secure manner possible. We recommend you read these notes thoroughly to ensure you update correctly.

## Update notes

4.13.0 includes significant changes to the _Content-Security-Policy_ found in the example NGINX configuration which we recommend ([available on GitHub](https://github.com/cryptpad/cryptpad/tree/main/docs/example.nginx.conf)). The updated policy only allows client behaviour which is strictly necessary for clients to work correctly, and is intended to be resilient against misconfiguration beyond the scope of this file. For instance, rather than simply allowing clients to connect to a list of permitted domains we are now explicit that those domains should only be accessible via HTTPS, in case the administrator was incorrectly serving unencrypted content over the same domain. These changes will need to be applied manually.

Several of the new tests on the checkup page (`https://your-instance.com/checkup/`) evaluate the host instance's CSP headers and are very strict about what is considered correct. These settings are a core part of CryptPad's security model, and failing to configure them correctly can undermine its encryption by putting users at risk of cross-site-scripting (XSS) vulnerabilities.

To update from 4.12.0 or 4.12.1 to 4.13.0:

0. Before updating, review your instance's checkup page to see whether you have any unresolved issues
1. Update your NGINX configuration file to match the provided example
2. Stop your server
3. Get the latest code with git
3. Install the latest dependencies with `bower update` and `npm i`
4. Restart your server
5. Confirm that your instance is passing all the tests included on the `/checkup/` page (on whatever devices you intend to support)

## Features

* This release updates OnlyOffice to v6.4.2, which includes a wide variety of improvements and bug fixes, such as:
  * dark mode
  * conditional formatting in sheets
  * fixes for various font and scaling issues
  * numerous other issues mentioned in [OnlyOffice's changelog](https://github.com/ONLYOFFICE/DocumentServer/blob/master/CHANGELOG.md#642)
* We switched from using our fork of Fabricjs back to the latest version of the upstream branch, since the maintainers had resolved the cause of an incompatibility with our strict _Content Security Policy_ settings. Among other things, this brought improved support for a variety of pressure-sensitive drawing tablets when using our whiteboard app.
* Mermaidjs (https://mermaid-js.github.io/mermaid/#/) has been updated to the version (8.13.10) which:
  * includes fixes a number of possible security flaws which should not have had any effect due to our CSP settings
  * introduces support for several new diagram types (entity relationship, requirement diagrams, user journeys)
  * adds support for dark mode and more modern styles
* ~~We've begun to experiment with additional iframe sandboxing features to further isolate common platform features (sharing, access controls, media transclusion, upload) from the apps that can trigger their display. These measures should be mostly redundant on CryptPad instances with correctly configured sandboxes, but may help mitigate unexpected risks in other circumstances.~~
  * these improvements were disabled because they were handled incorrectly by Safari
* We've added the ability for guests to edit calendars when they have the appropriate editing rights
* A number of groups and individuals volunteered to help translate CryptPad into more languages or complete translations of languages that had fallen out of date. We are happy to say that CryptPad is now fully translated in Russian, Brazilian Portuguese, Czech, and Polish.

## Bug fixes

* 4.13.0 fixes a number of security issues:
  * There were several instances where unsanitized user input was display as HTML in the UI. This had no effect on instances with correctly configured CSP headers, but could have been leveraged by attackers to run scripts on other users devices where these protections were not applied.
  * The 'bounce' page (which handles navigation from a CryptPad document to another page) didn't warn users when they were leaving CryptPad (a flaw known as an 'open redirect'). We now detect and warn users of redirection to untrusted pages, reducing the risk of phishing attacks. Some users have complained that they find this new behaviour annoying, but it's there to make the platform safer by default.
  * We've updated the protocol through which our cross-domain sandboxing system communicates with content served on the main domain so that it completely ignores messages from untrusted sources and refuses to communicate to other contexts unless they are explicitly trusted by the platform. Because of these restrictions it is possible that misconfigured instances will fail to load or otherwise behave incorrectly. Once again, there are tests on the checkup page designed to help identify these configuration issues, so please do take advantage of them.
* Some code which was intended to prompt guests to log in or register when viewing a shared folder stopped working due to some changes in a past release. We now correctly identify when these guests have edit rights, and instead of simply displaying the text **READ ONLY** we prompt them with instructions on how to make full use of the rights they've been given.
* We fixed some border styles on the horizontal dividers that are sometimes shown in dropdown menus such that consecutive dividers beyond the first are hidden.
* One of our developer dependencies (`json-schema`) has been updated to fix a prototype pollution bug which should not have had any impact on anyone in practice.
* A user reported that including `__proto__` as the language in fenced code blocks in a markdown document triggered an error, so we now guard against this case.
* We've fixed a few issues related to templates:
  * after creating a template in a team drive, clicking the store button would store it in your own drive
  * the creation of a template from a password-protected sheet did not correctly use the source sheet's password
* Thanks to some user reports we discovered some possible type errors that could occur when migrating some account data to a newer internal version.
* We disabled some unmaintained client-side tests after discovering that they were throwing errors under certain conditions, seemingly due to some browser regressions.
* We updated some code to handle uploading dropped folders in the drive. Unfortunately this type of "drop" event has to be handled differently than when a folder is uploaded through other means, and Opera browser doesn't support the required APIs, so this is only supported in Firefox and Chromium-based browsers.
* When previewing uploaded media we now supply the file object rather than its raw buffer contents which were not supported for all media types.
* We've fixed numerous issues with forms:
  * layout issues with buttons displayed in forms' author mode
  * the configured options for certain types of questions are reprocessed when you convert between related question types (multi-checkbox, multi-radio) with options being set back to their defaults when configurations are rendered invalid
  * editing status is recovered whenever possible if autosave interrupts user activity
* Finally, we've fixed a number of issues specific to our integration of OnlyOffice's editors:
  * we now guard against some possible type errors if the metadata required for sharing cursor and selection data is absent or poorly formed
  * we do our best to recover your old cursor position if the document needs to be reloaded after a checkpoint
  * some special cases of image inclusion are now handled in the presentation editor
  * we ensure that images are correctly loaded when exporting, including embedded media and theme backgrounds in presentations
  * the chart and table buttons were temporarily disabled in OnlyOffice's toolbar due to some incompatibilities which have since been resolved
  * we now avoid creating duplicated network handlers when reconnecting to an office editing session

# 4.12.1

This minor release contains a few bug fixes based on feedback we received and adjustments to prepare for the update to OnlyOffice 6.4.

* We noticed that charts and tables in the Document and Presentation (early access) applications cause conflicts with the upcoming OnlyOffice update. They are now disabled until the next release.
* We found that the button to export form results to a CryptPad sheet was empty so we added the missing text.
* Several issues were reported with the Forms application and are now fixed. This patch will prevent conditional sections from losing their content (questions and conditions) while editing the form. The "max options" selector won't be displayed anymore when converting "checkbox" questions to other types. The first two lines of a "choice grid" weren't always registered when submitting a form and this patch fixes it for newly created choice grids.
* Some calendars created with external tools couldn't be imported in CryptPad due to notifications settings. We've changed the "import" script to make sure the event could still be imported but without the problematic notification.
* We've received conflicting feedback about the privacy settings in forms. In the existing system, the users had to untick a box to submit with their name but, depending on the context, it's not always a good solution to make a form result anonymous by default. Similarly submitting form results with the username by default isn't privacy-friendly. We implemented a new system to prompt users to choose between submitting anonymously or with their name (unless one of the options is disabled).

# 4.12.0

## Goals

Our primary goal for this release was to improve support for office file formats in CryptPad by

1. integrating OnlyOffice's word processor and presentation editor and
2. introducing more intuitive workflows that allow users to convert and open uploaded office files directly from their drives

## Update notes

This release requires configuration changes to work correctly. We've updated our example NGINX config file to apply the required HTTP headers where appropriate.

You can compare the updated example against that of a previous CryptPad version by running something like `git diff -U2 4.11.0 docs/` to generate a diff:

```diff
diff --git a/docs/example.nginx.conf b/docs/example.nginx.conf
index 14a3d4fc2..ea21e3ba7 100644
--- a/docs/example.nginx.conf
+++ b/docs/example.nginx.conf
@@ -65,5 +65,5 @@ server {

     set $coop '';
-    if ($uri ~ ^\/(sheet|presentation|doc|convert)\/.*$) { set $coop 'same-origin'; }
+    #if ($uri ~ ^\/(sheet|presentation|doc|convert)\/.*$) { set $coop 'same-origin'; }

     # Enable SharedArrayBuffer in Firefox (for .xlsx export)
@@ -91,5 +91,5 @@ server {

     # connect-src restricts URLs which can be loaded using script interfaces
-    set $connectSrc "'self' https://${main_domain} ${main_domain} https://${api_domain} blob: wss://${api_domain} ${api_domain} ${files_domain}";
+    set $connectSrc "'self' https://${main_domain} ${main_domain} https://${api_domain} blob: wss://${api_domain} ${api_domain} ${files_domain} https://${sandbox_domain}";

     # fonts can be loaded from data-URLs or the main domain
@@ -121,8 +121,13 @@ server {
     # they unfortunately still require exceptions to the sandboxing to work correctly.
     if ($uri ~ ^\/(sheet|doc|presentation)\/inner.html.*$) { set $unsafe 1; }
-    if ($uri ~ ^\/common\/onlyoffice\/.*\/index\.html.*$) { set $unsafe 1; }
+    if ($uri ~ ^\/common\/onlyoffice\/.*\/.*\.html.*$) { set $unsafe 1; }

     # everything except the sandbox domain is a privileged scope, as they might be used to handle keys
     if ($host != $sandbox_domain) { set $unsafe 0; }
+    # this iframe is an exception. Office file formats are converted outside of the sandboxed scope
+    # because of bugs in Chromium-based browsers that incorrectly ignore headers that are supposed to enable
+    # the use of some modern APIs that we require when javascript is run in a cross-origin context.
+    # We've applied other sandboxing techniques to mitigate the risk of running WebAssembly in this privileged scope
+    if ($uri ~ ^\/unsafeiframe\/inner\.html.*$) { set $unsafe 1; }

     # privileged contexts allow a few more rights than unprivileged contexts, though limits are still applied
```

We've also updated the checkup page to test for the expected server behaviour and suggest helpful steps for correcting misconfiguration issues. You can access this diagnostic page at `https://<your-cryptpad-domain>/checkup/`.

Our team has limited resources, so we've chosen to introduce the new (and **experimental**) office editors gradually to avoid getting overwhelmed by support tickets as was the case when we introduced the current spreadsheet editor in 2019. In order to support this we've implemented an **early access** system which _optionally_ restricts the use of these editors to premium subscribers. We will enable this system on CryptPad.fr, but admins of independent instances can enable them at their discretion.

To enable the use of the OnlyOffice Document and Presentation editor for everyone on your instance, edit your [customize/application_config.js](https://docs.cryptpad.org/en/admin_guide/customization.html#application-config) file to include `AppConfig.enableEarlyAccess = true;`.

If you wish to avoid a rush of support tickets from your users by limiting early access to users with custom quota increases, add another line like so `AppConfig.premiumTypes = ['doc', 'presentation'];`.

As these editors become more stable we plan to enable them by default on third-party instances. Keep in mind, these editors may be unstable and users may lose their work. Our team will fix bugs given sufficient information to reproduce them, but we will not take the time to help you recover lost data unless you have taken a support contract with us.

To update from 4.11.0 to 4.12.0:

1. Stop your server
2. Get the latest code with git
3. Apply the recommended changes to your NGINX config (don't forget to **reload NGINX**)
  * optionally edit your `application_config.js` file to enable early access apps. restart your server or use the admin panel's _Flush cache_ button for this to take effect.
4. Install the latest dependencies with `bower update` and `npm i`
5. Restart your server
6. Confirm that your instance is passing all the tests included on the `/checkup/` page (on whatever devices you intend to support)

## Features

* It took a lot of experimentation, reading of specification documents, and reverse-engineering of undocumented workarounds to avoid browser-specific regressions, but we've gotten our client-side engine for office file format conversion to work as intended in the context of user or team drives. This means that as long as you are using a relatively modern browser (not Safari or anything on iOS) you should be able to do things like:
  * right-click and open uploaded XLSX or ODS files in our OnlyOffice Sheet integration,
  * implicitly convert editable sheets to XLSX individually (using the _download_ option) or as part of a collection when you download your full drive or one of its subtrees,
  * perform similar workflows with DOCX, ODT, PPT, and ODP files.
* As mentioned above, admins that enable _early access_ editors will be able try out the word processor and presentation editor. These editors use OnlyOffice _client-side_ components, but have had their server-side components completely replaced, just as with our Sheet integration. Nobody else has packaged OnlyOffice's editors in this manner, so this is **experimental technology** and we recommend that you **back up your documents regularly**!
* The form app now includes an option to open collected results in a new spreadsheet for advanced analysis.

## Bug fixes

* We finally tracked down a sneaky bug that was responsible for scrambling users' spreadsheets. The issue was triggered when they were disconnected and reconnected after editing the sheet by themself, usually for an extended period. A bug in the reconnection logic caused their earlier changes to the sheet to be replayed a second time, typically to disastrous effect if they had inserted rows in the meantime. A minor patch guards against this possibility, making sheets (and the newer office editors) far more stable.
* We noticed that the OnlyOffice editors' _print to PDF_ functionality behaved differently depending on the user's preferences for downloads and file-type handling. In some cases the resulting PDF would be opened in an invisible iframe. In addition to the intentional download prompt we meant to trigger, some users would be implicitly shown a second prompt to download the contents of the iframe. We suppressed the creation of the hidden iframe and now download the generated PDF directly using a single, more modern method.
* It was reported that responses to conditional sections of forms were not included in their results. Our patch has been tested in production and has been verified to correct the issue.
* The recently introduced file upload preview was capable of throwing an error under certain circumstances when previewing text files, which prevented them from being uploaded. We now guard against these errors and fall back to _no preview_.
* The chat box in pads failed to load for guests using the _no-drive_ mode which we introduced as an optimization to reduce load time for one-time visitors. An attempt to access a data structure that did not exist caused a type error, which resulted in the chat interface appearing to load indefinitely.
* Loading a shared folder by its link now causes it to be displayed in the context of your drive, rather than loading it in the background but displaying your last accessed folder instead.
* We now guard against _DOMException_ errors whenever we try to write data into localStorage, as this is capable of triggering a _QuotaExceeded_ error which we has been observed to occur more frequently lately.
* When attempting to use an editor's _Insert_ menu to embed uploaded media in a document, we now wait until all thumbnails are loaded before displaying the menu. This is intended to avoid circumstances where the user attempts to click the menu's _upload_ button but accidentally chooses a previously uploaded media file when the position of the button changes.

# 4.11.0

## Goals

Our main goal for this release was to update our Forms app to address feedback gathered in the research we conducted over the summer (survey and one-on-one interviews with volunteers). Many of these points were limited to forms itself, but some were closely related with some other concepts in the platform and prompted us to make some considerable changes throughout.

## Update notes

As of this release we are dropping support for Internet Explorer 11 we learned that even Microsoft stopped supporting it in their own Office 365 platform. This means that we can finally start using some newer browser features that are available in every other modern browser and simplify parts of our code, making it smaller and faster to load for everyone else.

4.11 doesn't require any manual configuration if you're updating from 4.10, so this should be a fairly simple release. There is a new customization option that is described in the following features section, however, this is entirely optional.

To update from 4.10.0 to 4.11.0:

1. Stop your server
2. Get the latest code with git
3. Install the latest dependencies with `bower update` and `npm i`
  * this release requires new client-side dependencies, so **don't forget this step**
4. Restart your server
5. Confirm that your instance is passing all the tests included on the `/checkup/` page (on whatever devices you intend to support)

## Features

* We've changed the platform's default display name from "Anonymous" to "Guest" and have also replaced existing mentions of "Unregistered" or "Non-registered" users with this terminology.
  * The term "Anonymous" was only ever intended to convey the classical sense of the word ("without name or attribution") rather than the stricter modern sense "indistinguishable from a meaningfully large set of other individuals". To be clear, this is a change of terminology, not behaviour. To prevent your IP address from being revealed to the host server while using CryptPad the best option has always been, and continues to be [Tor browser](https://www.torproject.org/download/).
  * Going forward, if you see "anonymize" in CryptPad (such as in forms), you can take it to mean that extra efforts are being taken to make protocol-level metadata indistinguishable from that of other users, while "Guest" means only that you haven't registered or have removed your display name.
* While we were reconsidering the notion of guest accounts we decided that it would be useful to be able to distinguish one guest from another. We decided to implement this by hooking into the existing system for displaying users' profile pictures by mapping a list of emojis to guests' randomly generated identifiers.
  * We chose a list of emojis that we hoped nobody would find objectionable ('🙈 🦀 🐞 🦋 🐬 🐋 🐢 🦉 🦆 🐧 🦡 🦘 🦨 🦦 🦥 🐼 🐻 🦝 🦓 🐄 💮️ 🐙️ 🌸️ 🌻️ 🐝️ 🐐 🦙 🦒 🐘 🦏 🐁 🐹 🐰 🦫 🦔 🐨 🐱 🐺 👺 👹 👽 👾 🤖'), but we realize that cultures and contexts differ widely. As such, we've made this configurable on a per-instance basis. A custom list of emojis can be set in `customize/application_config.js` as an array of single-emoji strings (`AppConfig.emojiAvatars = ['🥦', '🧄', '🍄', '🌶️'];`) or as an empty array if you prefer not to display any emojis (`AppConfig.emojiAvatars = [];`). See [our admin docs](https://docs.cryptpad.org/en/admin_guide/customization.html#application-config) for more info on customization.
  * Users can edit their display name inline in the user list or on their settings page, in which case their avatar will be one or two letters from their name (their first two initials if their name contains at least one space, otherwise the first two letters of their name).
  * Once these initial improvements had been made to the user list, the lack of support for emoji avatars in a number of places felt very conspicuous, so we've done our best to implement them consistently across every social aspect of the platform. Default emoji avatars are also displayed in comments in the rich text editor, in authorship data in our code/markdown editor, in tooltips when you hover over the marker for remote users' cursor location, in the "currently editing" indicator for Kanban cards, in the share and access menus, and in the "contacts" app.
* The file upload dialog now includes a preview of the media that you are about to upload (as long as it's something CryptPad is capable of displaying) as well as a text field for describing the media. Descriptive text is added to the file's encrypted metadata and is applied to rendered media as `alt` or `title` attributes wherever applicable. This coincides with a broader effort to improve keyboard navigation and add support for screen-readers.
* The link creation UI from 4.9.0 now highlights the URL input field as you type to indicate whether the current URL value is valid, rather than simply displaying an error when you submit.
* The 'Performance' tab of the admin panel has reused the bar chart UI we added for displaying the results of forms.
* We've written a small script to help us identify translated strings that are consistently duplicated across the four languages into which CryptPad has been fully translated (English, French, German, Japanese). We plan to use this to remove unnecessary strings in an upcoming release and make it easier to translate the platform into new languages.
* The "share" menu now makes its primary actions more clear, with explicit text ("copy link" instead of just "copy") on its main buttons, as well as icons that better match button UI on the rest of the platform.
* Finally, this release introduces our "v2" forms update with many usability enhancements:
  * Forms can now include questions which are displayed based on the condition of participants' earlier answers.
  * The participant view of forms no longer displays CryptPad's toolbar and popups and instead uses a full-page view. CryptPad's logo is included at the bottom of the page and acts as a link to the home page.
  * Form authors can set a custom message to be displayed to participants once they have submitted a response.
  * Some more advanced form settings are available for authors, and we've clarified the descriptions of existing options ("Anonymize responses", "Guest access", "Editing after submission").
  * Form authorship supports real-time editing more broadly than before:
    * Changes are saved as you type, so you no longer need to manually save each question.
    * Multiple authors can edit edit the same question concurrently without overwriting each other's work.
    * We avoid redrawing active parts of the UI when other authors make a change, so remote actions won't interfere with your local date-picker, dropdown selections, etc.
    * The UI is redrawn no more than once every 500ms for performance reasons.
    * We do our best to preserve current scroll position when other users make changes so authors don't accidentally click on the wrong elements.
  * Authors have easier access to basic functionality in the left sidebar that allows them to _preview_ a form, copy the participant link, and view existing responses with a single click.
  * The form creation presents better default options (placeholders instead of pre-filled fields for text inputs) and offers intuitive controls, such as "enter" to create a new field, "esc" to clear an empty field, and "tab" to navigate with just the keyboard.
  * The summary of existing responses is presented more intuitively:
    * The tally of empty responses is now displayed at the top of each question's summary rather than the bottom.
    * Bar charts are used throughout, wherever applicable.
    * Options with no answers are still displayed with zero results in the summary rather than not being displayed at all.
    * Options are displayed according to the order of their appearance in the original question, rather than according to the order in which participants chose them.
  * Form authors can conveniently change a question's type wherever its content can be automatically converted to a related format (radio, checkbox, ranked choices).
  * There are more options for form validation, such as required questions and new types of questions with automatic validation. Invalid answers are summarized at the bottom of the form. Clicking summaries jumps to the relevant question.
  * CryptPad logo is included at the bottom of the participant page and links to the home page so that participants can create their own forms or learn more about how data is encrypted.
  * We now pre-fill some options in our "simple scheduling poll" template, suggesting some basic options for the upcoming week and better indicating how the poll is intended to be used.
  * Lastly, authors can assign color themes to their form for some basic visual customization.

## Bug fixes

* While implementing and testing the display of emojis as avatars for guests we found several instances (in teams, chat, and the contacts app) where the UI did not fall back to the default display name.
* We've clarified a comment in our example NGINX file which recommended that admins contact us if they are using CryptPad in a production environment. It now indicates that they should do so _if they require professional support_.
* We now handle an edge case in ICS import to calendars where DTEND was not defined. When a duration is specified we calculate the end of the event relative to the provided start time, and otherwise consider it a "full-day" event as per the ICS specification.
* Users can share links directly with contacts, but we noticed that the color of the previewed link was overridden by some styles from bootstrap, resulting in very low contrast. We now use a standard CryptPad color which is clearly legible in both light and dark mode.
* Finally, we've applied some stricter validation to the encrypted content of team invite links which could have previously resulted in type errors.

# 4.10.0

## Goals

August is typically a quiet month for CryptPad's development team, as members of our team and many of our users take their (northern hemisphere) summer holidays. We took the opportunity to catch up on some regular maintentance and to review and some prototype branches of our code that had been ready for integration for some time.

It seems that some browser developers thought to do the same thing, because we noticed some significant regressions in some APIs that we rely on. Some of our time went towards addressing the resulting bugs and restructuring some code to avoid future regressions for browser behaviour that seem likely to be changed again in the near future.

## Update notes

4.10.0 includes some minor changes to [the checkup page](https://docs.cryptpad.org/fr/admin_guide/installation.html#diagnostics). Some admins have included screenshots of this page in bug reports or requests for support along with details of problems they suspect of being related. Because we've observed that the root of many issues is the browser (sometimes in addition to the server) we have decided to include details about the browser in this page's summary.

Up until now the checkup page only tested observable behaviour of the server such as HTTP headers on particular resources, configuration parameters distributed to the client, and the availability of essential resources. This practice meant that a report for an instance should have been the same regardless of the device that was used to generate the report. In light of a serious regression in Chrome (and all its derivatives) we decided that objectiveness was less important than utility and introduced some tests which check whether the client running the diagnostics interprets the provided server configuration. Terrible browsers (ie. every browser that is available on iOS) will fail these tests every time because they don't implement the expected APIs, but we've tried to detect these cases and warn that they are expected.

For the most part you (as an admin) will not need to do anything special for this release as a result. If you notice weird issues on particular browsers in the future, however, it might be helpful to view this page from the affected browser/device and include any information that is provided in bug reports.

To update from 4.9.0 to 4.10.0:

1. Stop your server
2. Get the latest code with git
3. Install the latest dependencies with `bower update` and `npm i`
4. Restart your server
5. Confirm that your instance is passing all the tests included on the `/checkup/` page (on whatever devices you intend to support)

## Features

As noted above, web standards and the browsers that implement them are constantly changing. Web applications like CryptPad which use new and advanced browser features are particularly prone to regressions even when we use browser features exactly as intended and advertized. The "Features" section of each release's notes typically highlights visible things, like clickable buttons or improvements to the interface. This point is included as a reminder that _regular maintenance is at least as important to an open-source software project_, even though it gets little attention and far less funding. The funding bodies that have generously supported our work typically award grants for research and the development of novel features, but we are sorely in need of increased support to allow us the flexibility to deal with unanticipated problems as they arise. If you are fortunate enough to have some disposable income and value the work that keeps CryptPad functional we would greatly appreciate a one-time or recurring donation to [our OpenCollative campaign](https://opencollective.com/cryptpad/contribute).

* This release coincided the yearly seminar of [XWiki (our parent organization)](https://www.xwiki.com) which always features a day-long hackathon. This year our team was joined by [@aemi-dev](https://github.com/aemi-dev) who has been working as an intern within XWiki's product team. Together we worked on adding some data visualization to our recently introduced _Form_ app. The improvements include a timeline to visualize how many responses were submitted to the form during each day and bar charts for a variety of question types to complement the existing tally of results. There's still more work to be done in this direction, but we established some useful foundations during our relatively short session.
* Frequent users of small screens will be pleased to hear that CryptPad's app toolbar now includes a button to collapse the upper segment of the toolbar which includes CryptPad's logo, the current document's title, status indicator (saved, editing, disconnected, etc.), and the user administration menu.
* Likewise, Kanban users may note that the app's toolbar also features a "Tools" menu (like that in the markdown editor) which toggles display of the controls which filter board items by tag and select view state (detailed or brief).
* Password fields that are specific to files and documents now have the `autocomplete="new-password"` attribute applied to prevent browsers and integrated password managers from suggesting that users enter their account password. This lowers the risk that users will inadvertently reveal their account password in the future. Additionally, Firefox will now prompt users to use a high-entropy password instead.
* Our integrated support ticket functionality automatically includes some commonly needed information about the user's account and browser. As of this release this data will also include the browser's `vendor` and `appVersion`, which are useful hints about the host browser and OS (which we almost always have to ask about when the ticket is for a bug report). This data will also include the browser's current width and height, as some issues only occur at particular resolutions and can otherwise be difficult to reproduce.
* We reviewed a range of third-party dependencies that are included in our repository and updated `cryptpad/www/lib/changelog.md` to better indicate their exact version, source, and any CryptPad-specific modifications we've made to them.
  * We found `less.js` had been duplicated, with one version (provided by bower) being used for custom styles in our slide editor while the rest of the platform used a custom version that fixed an apparent bug in the _reference import_ syntax. We've standardized on our custom version and removed the alternative from our `bower.json` file.
  * We also identified a few files that were no longer in use and removed them. There's still more work to be done to document the exact versions and source of some dependencies, so we've made this process a part of our regular release checklist.
* During a manual review we noticed some inconsistencies between different translations of CryptPad and have automated these checks by adding them to a script which we use to review translations before each release. These have helped us standardize things like the capitalization of "CryptPad", the syntax for some basic markup like `<br>` tags, and the consistent use of both dialect-specific suffixes in English and punctuation rules in French. We have only added tests for languages in which members of our team are fluent, so if you maintain a translation in another language and can suggest additional qualities we could test we would welcome your suggestions.
* The improved consistency of our translations has also enabled us to construct some translated UI components programmatically without directly using their inline HTML. This provides an extra layer of security in the event that
  1. malicious code was included in a translation file
  2. our tests failed to identify the code before it was included in a release
  3. the release was deployed by an admin that had failed to take advantage of the sandboxing system that prevents the injection of scripts into the UI

## Bug fixes

* The Chrome development team made some changes related to the availability of the `SharedArrayBuffer` API in cross-site-isolated contexts such as that of our sandboxing system which resulted in it being disabled despite the fact that our usage conformed to a specification that should have been supported. We use this modern browser feature (where available) to convert spreadsheets between different formats in the browser itself, whereas other services (even those advertizing their use of encryption for documents) send users' content to their server for conversion. Since Chrome's engine is used as the basis for a wide variety of other browsers, this broke sheet export everywhere except Firefox (which correctly implements the specification). Luckily, we found a simple workaround to use the same underlying feature using an alternate syntax that they had failed to disable. This is only a short-term solution as we have no expectation that it will continue to work, so we are actively investigating making this conversion a trusted process that will be run outside of our sandboxing system.
* On the topic of spreadsheet conversion, we updated our translations of the warning that is displayed in our conversion UI when the required browser features are not available. Rather than referring to "Microsoft Office formats" we now refer to _"Office formats"_ since we offer support for ODS in addition to XLSX.
* We found that CSV export mysteriously stopped working as well (seemingly everywhere, not just Chrome and derivatives). We're still not sure why this is the case, but the option is disabled in the UI until we can find and fix the problem.
* The _drive_ app includes a button that lets guest users wipe their personal data from their browser's session. We noticed that this button did nothing after approximately 50% of page loads in Firefox, suggesting there was an unpredictable quality related to either how the button was being created or how "click handlers" were declared. We traced it back to the jQuery library and rewrote the handler to use "VanillaJS". We don't have the time or budget to dig into why it stopped working, so unless someone else can figure it out for us then you, dear reader, may never learn the answer to this mystery.
* While investigating the drive we also added some guards against some possible type errors.
* We noticed that the `loginToken` attribute was not correctly removed from clients' localStorage when they deleted their account. The value of this token is random and is of no use to attackers (especially when the token belongs to a deleted account), but it was a cause of some inconvenience to us when testing account deletion, as the mismatch between the token stored locally and in accounts (after login) required us to login in a second time before. We've updated the related code to:
  1. correctly delete the token when you delete an account from the settings page
  2. ensure that no such token is present when logging in
* Document ids with invalid lengths are excluded from accounts' lists of "pinned documents" (those which should not be deleted from the server). We recently implemented a similar fix, but found that this list could be constructed in more than one way depending on the context.
* We identified and fixed two problems with our "history trim" functionality (accessible via documents' "Properties" menu):
  1. In the extremely unlikely event that a user requested that the server trim the history of a document and its metadata failed to load, the server would respond to the user with an error but did not correctly abort from the subsequent process to trim the document's history. In theory this could have been used by non-owners to archive parts of the documents history, however, we have no reason to believe that this was possible in practice. In any case, the flaw has been corrected.
  2. Complex documents like spreadsheets that use more than one channel to store different types of content would trim their respective histories in parallel, however, in such cases any errors were returned to the calling function as a list of warnings rather than a singular error. This format was not handled by the UI, resulting in an apparent success in cases of a partial or complete failure for such document types.

# 4.9.0

## Goals and announcements

We allocated most of this release cycle towards a schedule of one-on-one user interviews and some broad usage studies leveraging our new Form app. The remainder of our time was spent on some minor improvements. We'll continue at a slightly slower pace of implementation for the coming weeks while we complete our scheduled interviews and take some much-needed vacations.

## Update notes

It appears our promotion of the checkup page through our recent release notes and the inclusion of a link to it from the instance admin have been moderately successful. We've observed that more instance admins are noticing and fixing some common configuration issues.

This release features some minor changes to one instance configuration test which incorrectly provided an exemption for the use of `http://localhost:3000` as an `httpUnsafeOrigin` value. This exemption was provided because this value is valid for local development. However, it suppressed errors when this configuration was used for production instances where it could cause a variety of problems. As usual, we recommend checking your instance's admin page after updating to confirm that you are passing the latest tests. Information about the checkup page is included in [our documentation](https://docs.cryptpad.org/en/admin_guide/admin_panel.html#network).

To update from 4.8.0 to 4.9.0:

1. Stop your server
2. Get the latest code with git
3. Install the latest dependencies with `bower update` and `npm i`
4. Restart your server
5. Confirm that your instance is passing all the tests included on the `/checkup/` page

## Features

* We've added the ability to store URLs in user and team drives as requested in a private support ticket and [this issue](https://github.com/cryptpad/cryptpad/issues/732). Links can be shared directly with contacts. Unlike pads, links are not collaborative objects, so updating a link's name will not update the entry in another user's drive if you've already shared it with them. Links are integrated into our apps' _insert_ menu to facilitate quick insertion of links you've stored into your documents. We're interested in measuring how this functionality is used in practice so we can decide whether it's worth spending more time on it. We have added some telemetry to measure (in aggregate) how often its components are used. We anonymize IP addresses in the logs for CryptPad.fr, but as always, you can disable telemetry via your settings panel.
* Our rich text editor now supports indentation with the tab key, as per [issue #634](https://github.com/cryptpad/cryptpad/issues/634).
* Forms received another round of improvements to styles, workflows, and some basic survey functionality to yield more accurate results.
  * Ordered lists are now shuffled for each survey participant so that their initial order has less effect on the final results.
  * CSV export now uses one column for each option in polls, making them easier to read.
  * Unregistered users can now add a name to their response.
  * Form results are displayed automatically (when available) to those who have answered.
  * Authors and auditors can now click on usernames in polls to jump directly to other answers from the same user.
* Users with very large drives might notice that their account loads slightly faster now, due to some minor optimizations in an integrity check that the client performs when loading accounts.

## Bugs

* We've added a guard against a type error that could be triggered when loading teams under certain rare conditions.
* Unregistered users' drives now show the "bread-crumb" UI for navigating between folders when viewing a shared folder in read-only mode. We've also suppressed the "Files" button for displaying the tree view which was non-functional for such users.
* A change in the format of support tickets caused tickets recently created by premium users to not be recognized as such. We've fixed the categorization in the admin panel's support ticket view.
* We've fixed a number of minor issues with forms:
  * The maximum number of selectable choices for checkbox questions can no longer exceed the number of available choices.
  * We guard against a type error that could occur when parsing dates.
  * Forms imported from templates now have their initial title corrected.
  * We've disabled the use of our indexedDB caching system for form results, since it was quietly dropping older responses when more than 100 responses had been submitted. We plan to re-enable caching for results once we've updated the eviction metric to better handle the response format.

# 4.8.0

## Goals

This release cycle we decided to give people a chance to try our forms app and provide feedback before we begin developing its second round of major features and improvements. In the meantime we planned to work mostly on the activities of our [NGI DAPSI](https://dapsi.ngi.eu/) project which concerns client-side file format conversions. Otherwise, we dedicated some of our independently funded time towards some internal code review and security best-practices as a follow-up to the recent quick-scan performed by [Radically Open Security](https://radicallyopensecurity.com/) that was funded by [NLnet](https://nlnet.nl) as a part of our now-closing _CryptPad for Communities_ project.

## Update notes

We are still accepting feedback concerning our Form application via [a form hosted on CryptPad.fr](https://cryptpad.fr/form/#/2/form/view/gYs4QS7DetInCXy0z2CQoUW6CwN6kaR2utGsftDzp58/). We will accept feedback here until July 12th, 2021, so if you'd like your opinions to be represented in the app's second round of development act quickly!

Following our last release we sent out an email to the admins of each outdated instance that had included their addresses in the server's daily telemetry. This appears to have been successful, as more than half of the 700+ instances that provide this telemetry are now running **4.7.0**. Previously, only 15% of instances were running the latest version. It's worth noting that of those admins that are hosting the latest version, less than 10% have opted into future emails warning them of security issues. In case you missed it, this can be done on the admin panel's _Network_ tab. Unlike most companies, we consider excess data collection a liability rather than an asset. As such, administrator emails are no longer included in server telemetry unless the admin has consented to be contacted.

The same HTTP request that communicates server telemetry will soon begin responding with the URL of our latest release notes if it is detected that the remote instance is running an older version. The admin panel's _Network_ tab for instances running 4.7.0 or later will begin prompting admins to view the release notes and update once 4.8.0 is available.

The Network tab now includes a multiple choice form as well. If you have not disabled your instance's telemetry you can use this field to answer _why you run your instance_ (for a business, an academic institution, personal use, etc.). We intend to use this data to inform our development roadmap, though as always, the fastest way to get us to prioritize your needs is to contact us for a support contract (sales@cryptpad.fr).

Server telemetry will also include an `installMethod` property. By default this is `"unspecified"`, but we are planning to work with packagers of alternate install methods to modify this property in their installation scripts. This will help us assess what proportion of instances are installed via the steps included in our installation guide vs other methods such as the various docker images. We hope that it will also allow us to determine the source of some common misconfigurations so we can propose some improvements to the root cause.

Getting off the topic of telemetry: two types of data that were previously deleted outright (pin logs and login blocks) are now archived when the client sends a _remove_ command. This provides for the ability to restore old user credentials in cases where users claim that their new credentials do not work following a password change. Some discretion is required in such cases as a user might have intentionally invalidated their old credentials due to shoulder-surfing or the breach of another service's database where they'd reused credentials. Neither of these types of data are currently included in the scripts which evict old data as they are not likely to consume a significant amount of storage space. In any case, CryptPad's data is stored on the filesystem, so it's always possible to remove outdated files by removing them from `cryptpad/data/archive/*` or whatever path you've configured for your archives.

This release introduces some minor changes to the provided NGINX configuration file to enable support for WebAssembly where it is required for client-side file format conversions. We've added some new tests on the /checkup/ page that determine whether these changes have been applied. This page can be found via a button on the admin panel.

To update from 4.7.0 to 4.8.0:

1. Apply the documented NGINX configuration
2. Stop your server
3. Get the latest code with git
4. Install the latest dependencies with `bower update` and `npm i`
5. Restart your server
6. Confirm that your instance is passing all the tests included on the `/checkup/` page

## Features

* Those who prefer using tools localized in Japanese can thank [@Suguru](https://mstdn.progressiv.dev/@suguru) for completing the Japanese translation of the platform's text! CryptPad is a fairly big platform with a lot of text to translate, so we really appreciate how much effort went into this.
  * While we're on the topic, CryptPad's _Deutsch_ translation is kept up to date largely by a single member of the German Pirate Party (Piratenpartei Deutschland). This is a huge job and we appreciate your work too!
  * Anyone else who wishes to give back to the project by doing the same can contribute translations on an ongoing basis through [our Weblate instance](https://weblate.cryptpad.fr/projects/cryptpad/app/).
* We've implemented a new app for file format conversions as a part of our _INTEROFFICE_ project. At this point this page is largely a test-case for the conversion engine that we hope to integrate more tightly into the rest of the platform. It allows users to load a variety of file formats into their browser and convert to any other format that has a defined conversion process from the original format. What's special about this is that files are converted entirely in your browser, unlike other platforms which do so in the cloud and expose their contents in the process. Currently we support conversion between the following formats in every browser that supports modern web standards (ie. not safari):
  * XLSX and ODS
  * DOCX and ODT and TXT
  * PPTX and ODP
* In addition to the /convert/ page which supports office file formats, we also put some time into improving interoperability for our existing apps. We're introducing the ability to export rich text documents as Markdown (via the [turndown](https://github.com/mixmark-io/turndown) library), to import trello's JSON format into our Kanban app (with some loss of attributes because we don't support all the same features), and to export form summaries as CSV files.
* We've added another extension to our customized markdown renderer which replaces markdown images with a warning that CryptPad blocks remote content to prevent malicious users from tracking visitors to certain pages. Such images should already be blocked by our strict use of Content-Security-Policy headers, but this will provide a better indication why images are failing to load on instances that are correctly configured and a modest improvement to users' privacy on instances that aren't.
* Up until now it was possible to include style tags in markdown documents, which some of our more advanced users used in order to customize the appearance of their rendered documents. Unfortunately, these styles were not applied strictly to the markdown preview window, but to the page as a whole, making it possible to break the platform's interface (for that pad) through the use of overly broad and powerful style rules. As of this release style tags are now treated as special elements, such that their contents are compiled as [LESS](https://lesscss.org/) within a scope that is only applied to the preview pane. This was intended as a bug fix, but it's included here as a _feature_ because advanced users might see it as such and use it to do neat things. We have no funding for further work in this direction, however, and presently have no intent of providing documentation about this behaviour.
* The checkup page uses some slightly nicer methods of displaying values returned by tests when the expected value of `true` is not returned. Some tests have been revised to return the problematic value instead of `false` when the test fails, since there were some cases where it was not clear why the test was failing, such as when a header was present but duplicated.
* We've made some server requests related to _pinning files_ moderately faster by skipping an expensive calculation and omitting the value it returned. This value was meant to be used as a checksum to ensure that all of a user's documents were included in the list which should be associated with their account, however, clients used a separate command to fetch this checksum. The value provided in response to the other commands was never used by the client.
* We've implemented a system on the client for defining default templates for particular types of documents across an entire instance in addition to the use of documents in the _templates_ section of the users drive (or that of their teams). This is intended more as a generic system for us to reuse throughout the platform's source than an API for instance admins to use. If there is sufficient interest (and funding) from other admins we'll implement this as an instance configuration point. We now provide a _poll_ template to replicate the features of our old poll app which has been deprecated in favour of forms.
* We've included some more non-sensitive information about users' teams to the debugging data to which is automatically submitted along with support tickets, such as the id of the team's drive, roster, and how large the drive's contents are.
* The _Log out everywhere_ option that is displayed in the user admin menu in the top-right corner of the page for logged-in users now displays a confirmation before terminating all remote sessions.

## Bug fixes

* It was brought to our attention that the registration page was not trimming leading and trailing whitespace from usernames as intended. We've updated the page to do so, however, accounts created with such characters in their username field must enter their credentials exactly as they were at registration time in order to log in. We have no means of detecting such accounts on the server, as usernames are not visible to server admins. We'll consider this behaviour in the future if we introduce an option to change usernames as we do with passwords.
* We now double-check that login blocks (account credentials encrypted with a key derived from a username and password) can be accessed by the client when registering or changing passwords. It should be sufficient to rely on the server to report whether the encrypted credentials were stored successfully when uploading them, but in instances where these resources don't load due to a misbehaving browser extension it's better that we detect it at registration time rather than after the user creates content that will be difficult to access without assistance determining which extension or browser customization is to blame.
* We learned that the Javascript engine used on iOS has trouble parsing an alternative representation of data strings that every other platform seems to handle. This caused calendars to display incorrect data. Because Apple prevents third-party browsers from including their own JavaScript engines this means that users were affected by this Safari bug regardless of whether they used browsers branded as Safari, Firefox, Chrome, or otherwise.
* After some internal review we now guard against a variety of cases where user-crafted input could trigger a DOMException error and prevent a whole page worth of markdown content to fail to render. While there is no impact for users' privacy or security in this bug, a malicious user could exploit it to be annoying.
* Shortly after our last release a user reported being unable to access their account due to a typeError which we were able to [guard against](https://github.com/cryptpad/cryptpad/commit/abc9466abe71a76d1d31ef6a3c2c9bba4d2233e4).
* Images appearing in the 'lightbox' preview modal no longer appear stretched.
* Before applying actions that modify the team's membership we now confirm that server-enforced permissions match our local state.

# 4.7.0

## Goals

Our main goal for this release was to prepare a BETA version of our new forms app, however, it also includes a number of nice bug fixes and minor features.

## Update notes

As this release includes a new app you'll want to compare your current NGINX config against our example (`cryptpad/docs/example.nginx.conf`) and update yours to match the updated sections which rewrites URLs to include trailing slashes. We've also introduced a number of new variables to our color scheme which might conflict with customizations you've made to your stylesheets. As always, it's recommended that you test your customizations on a updated non-production instance before deploying.

We've been steadily adding new tests to our recently developed checkup page each time we observe particular types of instance misconfigurations in the wild. Unfortunately, it seems the admins that have the most trouble with instance configuration are those that haven't read the numerous mentions of this page throughout the last few release notes. For that reason we've made it so the server prints a link to this page at launch time if it detects that some important value is left unconfigured.

On the topic of instance configuration, admins that have enabled their instance's admin panel may notice that it contains a new "Network" tab. On this pane you may find a button that links to the instance's checkup page to make it even easier to identify configuration problems. You should also notice options for configuring a number of values, some of which could previously only be set by modifying the server's configuration file and restarting.

* One checkbox allows you to opt out of the server telemetry which tells our server that your server exists. This is mostly so that we have a rough idea of how many admins are running CryptPad and what version they have installed. It was clearly documented in the config file, but now it's even easier to opt out if you don't want us to know you exist. In the interest of transparency, everything that is sent to our server as a part of this telemetry is also printed to your application server's logs, so you always check what information has been shared.
* Another setting opts in to listing your server in public directories. At present there is no public directory of CryptPad instances that are suitable for public use, but we plan to launch one in the coming months. For now this checkbox will serve to inform us how many instance admins are interested in offering their server to the public. This setting will have no effect if you've disabled telemetry as that is how your server informs ours of your preferences. We reserve the right to exclude instances from our listing for _any reason_.
* A third option allows admins to consent to be contacted by email. We aren't interested in spamming anyone with marketing email, rather, it's so that we can inform administrators of vulnerabilities in the software before they are publicly disclosed. Leave this unchecked if you prefer to be surprised by security flaws.
* The option to disable crowdfunding notices in the UI can be disabled via a simple checkbox.
* Starting with our next release (4.8.0) anyone running 4.7.0 should also notice that a button appears on this pane informing them that an update is available. We regularly fix security flaws and improve general safeguards against them, so if you aren't up to date you might be putting your users' data at risk.

To update from 4.6.0 to 4.7.0:

1. Apply the documented NGINX configuration
2. Stop your server
3. Get the latest code with git
4. Install the latest dependencies with `bower update` and `npm i`
5. Restart your server

Please note that the new _Forms_ app depends on an update to our cryptography library. If you omit `bower update` from the upgrade sequence above, the app will not work.

## Features

* This release introduces our new _Forms_ app. This app allows users to create complex forms and to collect answers. Three roles are available with granular permissions:

  * Authors can collaboratively create surveys with different types of questions and generate links to share with participants.
  * Participants can respond to forms and view responses if these are made public (this can be set by authors).
  * Auditors can view responses, but cannot necessarily add their own answers unless they have the correct participant key.

  This new app addresses many of the shortcomings of our current _Polls_ and vastly expands the feature set. Polls are effectively one of the many question types now available in _Forms_. For this reason we are deprecating the _Polls_ app. It will remain available to view and respond to existing polls, but we discourage the creation of new polls and all future improvements will be focused on _Forms_.

* In response to a GitHub issue we've added an option to the toolbar's _File_ menu to add the current pad to your drive regardless of whether it is already stored in one of your teams' drives.
* Likewise, we received some reports that some users found it frustrating that the home page automatically redirected them to their drive when they were logged in. We've disabled this behaviour by default but added an option in the settings page through which you may re-enable the old behaviour. This can be found at the top of the "CryptDrive" pane.
* Embedded markdown editors' toolbars (such as that in the kanban and form apps) now include an "embed file" option.
* We've revised some text on the checkup page to better explain what some headers do and how to correct them.
* Some error messages printed by the server under rare conditions now include a little more debugging information.
* We've improved some of the UI of the "report" page (which diagnoses possible reasons why your drive, shared folders, or teams might be failing to load now includes) so that users can now copy the output of the report directly to their clipboard instead of having to select that page's text and use their OS's copy to clipboard functionality.

## Bug fixes

* The home page now displays the appropriate text ("Features" or "Pricing") for the features page depending on whether the instance in question supports subscriptions. We had made some changes to this before but missed an instance where the text was displayed.
* The admin page will now display the "General" pane if for some reason the hash in its URL does not contain a supported value.
* We found that there were two cases where localForage (a library that manages an in-browser cache) could throw a DOMExceptionerror because we didn't supply a handler. This caused the calendar app's UI to incorrectly treat a newly created event as though it had not been saved.
* A user brought it to our attention that the share menu was returning incorrect URLs for password-protected files. This has now been fixed.
* The code that is responsible for preserving your cursor position when using the code editor collaboratively was capable of interfering with active scrolling when other users' edits were applied. This is now handled more gracefully. Another fix addresses an issue that prevented the markdown preview pane from being resized under certain conditions.
* Finally, as a part of a routine security scan funded by [NLnet](https://nlnet.nl/) and executed by [Radically Open Security](https://www.radicallyopensecurity.com/) it was discovered that an unsanitized _account name_ was displayed in the users own toolbar. As a consequence, users could trigger a cross-site scripting vulnerability on themself by entering `<script>alert("pew")</script>` for their username at registration time. On a correctly configured instance this was blocked everywhere except in the sheet editor due to its more lax Content-Security Policy. This unsanitized value was never displayed for remote accounts, so the impact is extremely limited. Even so, we recommend that you update.

# 4.6.0

## Goals

Our main goal for this release cycle was to get a strong start on our upcoming _Forms_ app. This is a big job which we didn't expect to finish in the course of a few weeks, so in the meantime we've taken the opportunity to address many minor issues, stabilize the codebase, and implement a number of new tests.

## Update notes

Over the years the example configuration file has grown to include a large number of parameters. We've seen that this can make it hard to pick out which configuration parameters are important for a newly installed or migrated instance. We're trying to address this by moving more configuration options to the admin panel.

4.6.0 introduces the ability to generate credentials for your instance's support ticket mailbox and publish the corresponding public key with the push of a button. Previously it was necessary to run a script, copy its value, update the config file, restart the server, and enter the private component of the keypair into an input on the admin panel. The relevant button can be found in the admin panel's _Support_ tab.

We've also introduced the ability to update your _adminEmail_ settings via a field on the _General_ tab of the admin panel. This value is used by the contact page so that your users can contact you (instead of us) in case they encounter any problems when using your instance. Both the `supportMailbox` and `adminEmail` values are distributed by the `/api/config` endpoint which is typically cached by clients. You probably need to use the _Flush cache_ button to ensure that everyone loads the latest value. This button can also found on the _General_ tab.

One admin reported difficulty customizing their instance because they copy-pasted code from `cryptpad/www/common/application_config_internal.js` directly into `cryptpad/customize/application_config.js`. Unfortunately the internal variable name for the configuration object in the former did not match the value in the latter, so this led to a reference error. We've updated the variable name in the internal configuration file which provides the default options to match the customizable one, making it easier to copy-paste code examples without understanding what it's really doing.

We also introduced a new configuration option in `application_config_internal.js` which prevents unregistered users from creating new pads. Add `AppConfig.disableAnonymousPadCreation = true;` to your `customize/application_config.js` to disable anonymous pad creation. If you read the adjacent comment above the default example you'll see that this barrier is only enforced on the client, so it will keep out honest users but won't stop malicious ones from messaging the server directly.

This release also includes a number of new tests on the `/checkup/` page. Most notably it now checks for headers on certain assets which can only be checked from within the sandboxed iframe. These new tests automate the manual checks we were performing when admins reported that everything was working except for sheets, and go a little bit further to report which particular headers are incorrect. We also fixed some bugs that were checking headers on resources which could be cached, added a test for the recently added anti-FLoC header, fixed the styles on the page to respond to both light and dark mode, and made sure that websocket connections that were opened by tests were closed when they finished.

Some of the tests we implemented checked the headers on resources that were particularly prone to misconfiguration because its headers were set by both NGINX and the NodeJS application server (see [#694](https://github.com/cryptpad/cryptpad/issues/694)). We tested in a variety of configurations and ultimately decided that the most resilient solution was to give up on using heuristics in the application server and just update the example NGINX config to use a patch proposed by another admin which fully overrides the settings of the application server. You can find this patch in the `/api/(config|broadcast)` section of the example config.

Finally, we've made some minor changes to the provided `package-lock.json` file because `npm` reported some "Regular Expression Denial of Service" vulnerabilities. One of these was easy to fix, but another two were reported shortly thereafter. These "vulnerabilities" only affect some developer dependencies and will have no effect on regular usage of our software. The "risk" is essentially that malicious modifications to our source code can be tailored to make our style linting software run particularly slowly. This can only be triggered by integrating such malicious changes into your local repository and running `npm run lint:less`, so maybe don't do that.

To update from 4.5.0 to 4.6.0:

1. Apply the documented NGINX configuration
2. Stop your server
3. Get the latest code with git
4. Install the latest dependencies with `bower update` and `npm i`
5. Restart your server

## Features

This release includes very few new features aside from those already mentioned in the _Update notes_ section. One very minor improvement is that formatted code blocks in the code editor's markdown preview use the full width of their parent container instead of being indented.

## Bug fixes

* Once again we fixed a bug that only occurs on Safari because Apple refuses to implement APIs that make the web a viable competitor to their app store. This one was triggered by opening a shared folder from its link as an unregistered user, then trying to open a pad stored only in that folder and not elsewhere in your drive. Literally every other browser supports _SharedWorkers_, which allow tabs on the same domain to share a background process, reducing consumption of CPU, RAM, and electricity, as well as allowing the newly opened tab to read the document's credentials from the temporarily loaded shared folder. On Safari the new tab failed to load. We fixed it by checking whether the shared folder would be accessible from newly opened tabs, and choosing to use the document's "unsafe link" instead of its "safe link".
* We updated the "Features" page to be displayed as "Pricing" in the footer when some prospective clients reported that they couldn't find a mention of what they would get by creating a premium subscription. [#683](https://github.com/cryptpad/cryptpad/issues/683) had the opposite problem, that they didn't support payment and they wanted to only show features. Now the footer displays the appropriate string depending on your instance's configuration.
* We fixed some inconsistent UI in our recently introduced date picker. The time formats displayed in the text field and date picker interface should now match the localization settings provided to your browser by your OS. Previously it was possible for one of these elements to appear in 24 hour time while the other appeared in 12 hour time.
* Another time-related issue appeared in the calendar for users in Hawai'i, who reported that some events were displayed on the wrong day due to the incorrect initialization of a reference date.
* We've applied a minor optimization which should reduce the size of shared folders.
* Some functionality on the admin panel has been improved with some better error handling.
* Finally, one user reported that one of their PDFs was displaying only blank pages. After a short investigation we found that the problematic PDF was trying to run some scripts which were being blocked by our strict Content-Security-Policy headers. We've updated our PDF renderer to avoid compiling and running such scripts. As a result, such PDFs should not be prevented from rendering, though they may lack some dynamic functionality that you might be expecting. We'd welcome an example of such a PDF so we can assess if there is a safe way to load their embedded scripts and how much work would be required to do so.

# 4.5.0

## Goals

This release cycle we aimed to complete three major milestones: the official release of our calendar app, the ability for admins to close registration on their instance, and the deployment of the admin section of our [official documentation](https://docs.cryptpad.org/en/admin_guide/index.html). We spent the remainder of our time addressing a growing backlog of issues on GitHub by fixing a number of weird bugs.

## Update notes

This release includes a new GitHub issue template (`cryptpad/.github/ISSUE_TEMPLATE/initial-instance-configuration.md`). The intent of this file is to make it clear that _Bug Reports_ are for intended for bugs in the software itself, not for soliciting help in configuring your personal server. Such issues take away time that we'd rather spend improving the platform for everybody's benefit, rather than for single administrators.

Sometimes difficulty configuring an instance does stem from an actual bug, however, most of the time these issues relate to the use of an unsupported configuration or failure to correctly follow installation instructions. The issue template includes some basic debugging steps which should identify the vast majority of problems. Beyond its primary goal of narrowing the scope of our issue tracker, we hope it will also be useful as an offline reference for administrators attempting to debug their instance.

This template references the /checkup/ page that we've been steadily improving over the last few releases. It now includes even more tests to diagnose instance configuration problems, each with their own messages that provide some fairly detailed hints about what is wrong when an error is detected. This release introduces a number of tests that print _warnings_ that won't break an instance but might detract from users' experience. We recommend checking this page on your instance with each release as we will continue to improve it on an regular basis, and it might detect some errors of which you were unaware.

Otherwise, this release includes some changes to the provided example NGINX config file. It now includes a header designed to disable clients' participation in Google's [FLoC network](https://www.eff.org/deeplinks/2021/03/googles-floc-terrible-idea), as well as some basic rules related to the addition of our calendar app and OnlyOffice's two remaining editors (which are still not officially supported despite their inclusion here).

Lastly, any instance administrators that have had to customize their instance in order to disable registration can instead rely on a built-in feature that is available on the main page of the admin panel. Checking the "Close registration" checkbox will cause the application server to reject the creation of new "login blocks" (which store users' encrypted account credentials) while permitting existing users to change their passwords. Clients will be informed that registration is closed via the `/api/config` endpoint, causing the registration page to display a notice instead of the usual form. You may need to use the `FLUSH CACHE` button which can found on the same page of the admin panel in order to force clients to load the updated server config.

To update from 4.4.0 to 4.5.0:

1. Apply the documented NGINX configuration
2. Stop your server
3. Get the latest code with git
4. Install the latest dependencies with `bower update` and `npm i`
5. Restart your server

## Features

* We included a first version of our new calendar app in our last release, however, it was only accessible by URL as there were no links to it in the UI. We've spent time implementing the basic features we expect of any of our apps, including translated UI text (the first version was mostly for us to test) and the ability to import/export .ics files (via ical.js), and the ability to view and store a calendar shared via its URL. It also introduces support for configurable reminders (which can be disabled via the _notifications_ panel of your settings page) and fixes a number of style issues that occurred on small screens. You can access the calendar app via the _user admin menu_ found at the top-right corner of your screen.
* The _What-is-CryptPad_ page now includes the logo of our latest sponsor: [NGI DAPSI](https://dapsi.ngi.eu) (the Data and Portability Services Incubator). DAPSI is another branch of the European Next Generation Internet initiative which has already done so much for our project. Over the next nine months we will use their funding and mentorship to improve CryptPad's interoperability with other services via support for open and de-facto file formats and increasingly intuitive workflows for import and export of your documents. There is already a lot of demand for this functionality, so we're very grateful to finally have the support necessary to take on this big project.
* We've merged a contribution that implements a preference for the rich text editor to open links in a single click instead of treating them as text with a clickable bubble that contains a link. This can be configured on the rich text panel of your settings page.
* The _File_ menu in our apps now includes a _Store in CryptDrive_. This option appears when you have not already stored the document you are currently viewing and when the prompt to store the file has been dismissed or intentionally suppressed via the _never ask_ setting for pad storage.
* We've added support for the display of a configurable _Roadmap_ URL in the footer that can be found on our static pages. This is included mostly for our own purposes of increasing the visibility of the project's planned development, but administrators can also use it however they want to keep their own users informed of their upcoming plans. This value can be set via the host instance's `customize/application_config.js`. An example is included in `cryptpad/www/common/application_config_internal.js`.
* Following the addition of some basic telemetry in our 4.3.1 release we observed that about 20% of newly registered users actually opened the _What is CryptPad_ document which was automatically created in their drive. As such, we've removed the code responsible for its creation along with the translations of its text. New users will instead be directed to read our docs.

## Bug fixes

* Our 4.4.0 release included functionality allowing administrators to broadcast notifications to all the users of their instance. Since then, we noticed that clients were incorrectly "pinning" the log file which stores a record of all messages broadcast in this fashion. In other words, they were informing the server that it should continue to store this file on their behalf and that its size should count against their storage quota. We added an explicit exception to code responsible for generating the list of documents that should be "pinned".
* Right-clicking on rendered markdown extensions in the code editor's preview pane opens a custom menu that offers some basic options. This menu incorrectly displayed some options that were appropriate for encrypted uploads, but not for other extensions such _markmap_, _mathjax_, and _mermaid_. We now handle these explicitly and provide options to export to the relevant image format.
* In one more example of a long list of browser quirks that have broken CryptPad in bizarre ways, we learned that the web engine that used by all browsers available for iPhone incorrectly handles click events on elements that contain buttons. Rather than emitting a single click event in response to user action, the engine seems to emit an event for each sibling _button_ tag regardless of whether it is visible. The HTML structure of the list/grid view mode toggle in the drive caused the engine to emit two click events, immediately toggling the view mode away from and back to its original state. Since Apple has an anti-competitive policy requiring every browser to use the engine they provide (as opposed to independent ones which include speed-boosting optimizations, modern features, and frequent bug fixes), this means that iPhone users could not switch to an alternative. Anyway, we changed the HTML structure that was working well in literally every other browser to make this better for iPhone users.
* There were some CSS selectors in the code app that caused the preview pane to be hidden on narrow screens. This rule is no longer applied when the client loads in embed/present mode, which disable all other UI to display only the preview pane.
* We identified and addressed an unhandled error on the registration page which could have caused clients to act as though the upload of their accounts encrypted credentials had succeeded when it had not. This could result in the inability to access their content on successive login attempts.
* The whiteboard editor allows users to upload images for inclusion in their whiteboard up to a certain size. It was brought to our attention that the enforced size limit was compared against the size of the image after it had been encoded, while the resulting error message suggested that it was measuring the size of the image as uploaded. We've updated this limit to account for the encoding's overhead.
* We've added some extra error handling to diffDOM, the library we use to compute and apply a minimal set of patches to a document. It was brought to our attention that it did not correctly parse and compare some input that is valid in the HTML dialect used to display emails but does not commonly occur in modern browsers. This crashed the renderer with a DOMException error when it tried to apply the malformed attribute.
* Lastly, as usual, we've received a variety of questions and bug reports related to spreadsheets. We've added some guards to prevent the creation of invalid checkpoints. If a generated checkpoint is larger than the maximum file size limit allowed for a particular user we avoid successive attempts to upload within that same session, which avoids spamming the user with repeated warnings of failed uploads. We updated the notice that informs users when conversion to Office formats is not supported in their browser to recommend a recent version of Firefox or Chrome, and displayed the same notice when importing. We also updated the function which checks whether the APIs required for conversion were present, as it checked for SharedArrayBuffers and Atomics but not WebAssembly, all of which are necessary. Finally, we made some minor changes that allow the sheet editor to lock and unlock faster when a checkpoint is loaded and applied, resulting in less disruption to the user's work.

# 4.4.0

## Goals

Our main goal for this release was to complete the first steps of our ["Dialogue" project](https://nlnet.nl/project/CryptPadForms/), which will introduce surveys into CryptPad. We've also put considerable effort towards addressing some configuration issues, correcting some inconsistently translated UI, and writing some new documentation.

## Update notes

This release removes the default privacy policy that has been included in CryptPad up until now. It included some assertions that were true of our own instance (CryptPad.fr) which we couldn't guarantee on third-party instances. We've updated our custom configuration to link to a privacy policy that was written in a rich text pad. You can do the same on your instance by editing `cryptpad/customize/application_config.js` to include the absolute URL of your instance, like so: `AppConfig.privacy = "https://cryptpad.your.website/privacy.html";`.

We've clarified a point about telemetry in the notes of our 4.3.1 release. The text suggested that users on your instance would send telemetry to OUR webserver. It has been clarified to reflect that telemetry from your users is only ever sent to your instance.

We've spent some time working on improving our (officially) unreleased integrations of OnlyOffice's presentation and document editors. We've advised against enabling these editors on your instance. This release includes changes that may not be fully backwards compatible. If your users rely on either editor we advise that you not update until they have had an opportunity to back up their documents. We still aren't officially supporting either editor and we may make further breaking changes in the future. Consider this a warning and not an advertizement of their readiness!

This release also includes changes to the recommended NGINX configuration. Compare your instance's config against `cryptpad/docs/example.nginx.conf` and apply all the new changes before updating. In particular, you'll want to pay attention to the configuration for a newly exposed server API (`/api/broadcast`). This should work much the same as `/api/config`, so if you're using a non-standard configuration that uses more than one server you may want to proxy it in a similar fashion.

Lastly, we've made some big improvements to the `/checkup/` page which performs some basic tests to confirm that your instance is configured correctly. It now provides some much more detailed descriptions of what might be wrong and how you can start debugging any issues that were identified. If you experience any problems after updating please review this page to assess your instance for any known issues before asking for help.

To update from 4.3.1 to 4.4.0:

1. Apply the documented NGINX configuration
2. Stop your server
3. Get the latest code with git
4. Install the latest dependencies with `bower update` and `npm i`
5. Restart your server

This release requires updates to both clientside and serverside dependencies. **You will experience problems if you skip any of the above steps.**

## Features

* 4.4.0 includes a basic version of a calendar app. There are no links to it anywhere in the platform, its translations are hardcoded, and its title includes the text **BETA**. It's included in this release so that we can test and improve it for the next release, however, it should not be considered stable. Use it at your own risk! Our plan for this app is to offer the ability to set and review reminders for deadlines in CryptPad. We haven't secured funding for more advanced functionality, however, our team is available for sponsored development if you'd like to provide funding to include such improvements in our short-term roadmap.
* The admin panel now includes several closely related features in its "broadcast" tab, which allows administrators to send a few types of notifications to all users:
  1. _Maintenance notices_ inform users that the service may be unavailable during a specified time range.
  2. _Survey notices_ inform users that the instance administrators have published a new survey and would like their feedback. We plan to use this on CryptPad.fr to perform some voluntary user studies on an ongoing basis.
  3. _Broadcast messages_ allow admins to send all users a custom message with optional localization in their users' preferred language.
* The drive now includes a "Getting started" message and a link to our docs, like all our other apps. This replaces the creation of a personal "What is CryptPad" pad in the user's drive when they register.
* We recently wrote some scripts to automatically review our translations. This exposed some inconsistencies and incorrectly applied attributes in translations that included HTML. Since it's not reasonable to expect translators to know HTML, we've taken some steps to remove all but the most basic markup from translatable messages. Instead, more advanced attributes are applied via JavaScript. This makes it easier than ever to translate CryptPad as well as providing a more consistent experience to those using translations written by contributors.

## Bug fixes

* Premium users are now prompted to cancel their subscriptions before deleting their accounts.
* The /logout/ page will now clear users' local document cache. Admins can recommend that users try loading this page when users are mysteriously unable to load their drive (or that of a team). If you find that this solves a user's problem, please report their exact problem so we can investigate the underlying cause.
* The _support_ page guards against type errors that appear to have been caused by third-party extensions interfering with some browser APIs and rewriting URLs.
* We found that anonymous users who had not created a drive were not able to use the "Make a copy" functionality on a pad that they were viewing. This has been fixed.
* We noticed that under some unknown circumstances it was possible for users to store documents with invalid document IDs in their drive. We've added a few guards that detect these invalid channels and we're working on a solution to automatically repair them, if possible.
* Links to anchors in read-only rich text documents now navigate to the correct section of the document rather than opening a new tab.
* We've made a large number of improvements to our OnlyOffice integration. This will primarily affect the sheet app, but it also paves the way for us to introduce presentations and text documents in a future release.
  * We now inform OnlyOffice of user-list changes, which should fix the incorrect display of users names when they lock a portion of a document.
  * Text documents and presentations use a different data format than sheets for locking the document. We've adjusted our code to handle these formats.
  * We've fixed some lock-related errors in sheets that could be triggered when receiving checkpoints from other users while editing in strict mode.
  * We've adjusted some CSS selectors intended to hide parts of OnlyOffice's UI that are invalid within CryptPad, since those elements' IDs have changed since the last version.
  * OnlyOffice's cursors now use your CryptPad account's preferred color.
  * We now handle some errors that occurred when documents were migrated by a user editing a sheet in embed mode.
  * OnlyOffice modified some of the APIs used to lock a document, so we've adjusted our code to match.
* We found and fixed a race condition which could be triggered when loading a shared folder included in more than one of your user or team drives.

# 4.3.1

This minor release addresses some bugs discovered after deploying and tagging 4.3.0

* We found that some browser extensions interfered with checks to determine whether a registered user was correctly logged in, which resulted in some disabled functionality. If you are running extensions that actively delete the tokens that keep you logged your session should now stay alive until you close all its active tabs, after which you will have to log back in.
* Our 4.2.0 update introduced a new internal format for spreadsheets which broke support for spreadsheet templates using the older format. This release implements a compatibility layer.
* We fixed some minor bugs in our rich text editor. Section links in the table of contents now navigate correctly. Adding a comment to a link no longer prevents clicking on that link.
* A race condition that caused poll titles to reset occasionally has been fixed.
* We've added a little bit of telemetry to tell the application server when a newly registered user opens the new user guide which is automatically added to their drive. We're considering either rewriting or removing this guide, so it's helpful to be able to determine how often people actually read it.
* An error introduced in 4.3.0 was preventing the creation of new teams. It's been fixed.
* 4.3.0 temporarily broke the sheet editor for iPad users. Migrations to a new internal format that were run while the editor was in a bad state produced some invalid data that prevented sheets from loading correctly. This release improves the platforms ability to recover from bad states like this and improves its ability to detect the kind of errors we observed.

# 4.3.0 (D)

## Goals

This release is a continuation of our recent efforts to stabilize the platform, fixing small bugs and inconsistencies that we missed when developing larger features. In the meantime we've received reports of the platform performing poorly under various unusual circumstances, so we've developed some targeted fixes to both improve user experience and decrease the load on our server.

## Update notes

This release should be fairly simple for admins.

To update from 4.2.1 to 4.3.0:

1. Stop your server
2. Get the latest code with git
3. Install the latest dependencies with `bower update` and `npm i`
4. Restart your server

## Features

* We're introducing a "degraded mode" for most of our editors (all except polls and sheets). This follows reports we received that CryptPad performed poorly in settings where a relatively large number of users with *edit* rights were connected simultaneously. To alleviate this, some non-essential features will be disabled when a number of concurrent editors is reached, in order to save computing power on client devices. The user-list will stop being updated as users join and leave, users cursors will stop being displayed, and the chat will not be disabled. Sessions will enter this mode when 8 or more editors are present. This threshold can be configured via `customize/application_config.js` by setting a `degradedLimit` attribute.
* CryptPad was recently used to distribute some high-profile documents. For the first time we were able to observe our server supporting more than 1000 concurrent viewers in a single pad and around 350000 unique visitors over the course of a few days. While the distributed document incurred very little load, CryptPad created a drive for each visitor the first time they visited. Most of these drives were presumably abandoned as these users did not return to create or edit their own documents. Such users that directly load an existing document without having previously visited the platform will no longer create a drive automatically, unless they explicitly visit a page which requires it. This behaviour is supported in most of our editors except sheets and polls. This should result in faster load times for new users, but just in case it causes any issues we've made it easy to disable. Instance admins can disable "no-drive mode" via `customize/application_config.js` by setting `allowDrivelessMode` to `false`.
* We've updated our sheet editor to use OnlyOffice 6.2, which includes support for pivot tables, among a range of other improvements.
* Our rich text editor now features some keyboard shortcuts to apply some commonly used styles:
  * heading size 1-6: ctrl+alt+1-6
  * "div": ctrl+alt+8
  * "preformatted": ctrl+alt+9
  * paragraph: ctrl+alt+0
  * remove styles from selection: ctrl+space
* We've removed a large number of strings that were included in the "Getting started" box that was displayed to new users in each of our editors. Instead, this box simply contains a link to the relevant page in our documentation. Our intent is to both simplify the interface for newcomers and reduce the number of strings that require translation.
* We've continued to progress on our "checkup page" which performs some routine checks to see whether the host instance is correctly configured. While its hints are not especially helpful for admins without reading the code to understand what they are testing, they do detect a fairly wide range of issues and have already helped us to identify some inconsistencies in our recommended configuration. We plan to link directly from this page to the relevant sections of a configuration guide an in upcoming release.
* The admin support ticket interface has been updated to collapse very long messages in response to some ticket threads submitted in the last few weeks. We also found that sometimes we needed more information after a ticket had been closed, so we added the ability to re-open closed tickets.
* Some time ago we removed the "Survey link" option from the user admin dropdown menu (found in the top-right corner of the page). This release re-enables it for instances that explicitly provide a link to a survey, however, we no longer provide a link to a survey by default.

## Bug fixes

* We finally reviewed and merged a number of pull-requests that had been pending for some time. Collectively, they fixed some configuration issues and type errors in some of our older scripts.
* Sheets can now contain multiple images with the same name, whereas before they would conflict and one would be displayed multiple times.
* A recent change in our code to conditionally display size measurements in different magnitudes (GB, MB) removed support for Kilobytes (KB). This release restores the previous behaviour.
* We believe we've identified and corrected an issue that caused the rich text editor to scroll to the top of the document when the button to add a comment was clicked.
* We recently made it such that documents owned by a particular user would not be automatically re-added to that user's drive when they viewed them. This change revealed a number of odd cases where various commands (destroy, add password, get document size, etc.) did not work as expected unless the document was first added to their drive. We reviewed many of these features and corrected the underlying issues that caused these commands to fail.
* We performed a similar review of various commands related to user accounts and identified a number of issues that caused account deletion to fail.

# 4.2.1

This minor release addresses a few bugs discovered after deploying 4.2.0:

* The 4.2.0 release included major improvements to the sheet application. This introduced breaking changes to the "lock" system in the application. Existing spreadsheets (before 4.2.0) that were closed by a user without "unlocking" all cells first became impossible to open after the 4.2.0 changes. This has been fixed.
* Team owners can now properly upload a team avatar.
* We've improved the file upload script to better recognize markdown files.
* We've fixed a few issues resulting in an error screen:
  * New users were unable to create a drive without registering first.
  * Snapshots in the sheet application couldn't be loaded.
  * Loading an existing drive as an unregistered user could fail.

# 4.2.0 (C)

## Goals

We've made a lot of big changes to the platform lately. This release has largely been an attempt to stabilize the codebase by fixing bugs and merging features that we hadn't had a chance to test until now, all while updating our documentation and removing unused or outdated code.

## Update notes

This release includes an update to the sheet editor which is not backwards-compatible. Clients running the new version will not be able to correctly communicate with clients running older versions. Clients will automatically detect that a new version is available upon reconnecting to the server after a restart, so as long as you follow the steps recommended below this should be fine.

We've also updated a server-side dependency that is not backwards-compatible. Failure to update both the platform and its dependencies together will result in errors.

The `scripts` directory now includes a script to identify unused translations. We used this to reduce the size of our localization files (`cryptpad/www/common/translations/*.json`). We reviewed the changes carefully and did our best to test, but it's always possible that a string was erroneously removed. If you notice any bugs in the UI where text seems to be missing, please let us (the developers) know via a GitHub issue.

CryptPad.fr now stores more than a terabyte of data, making it quite intensive to run the scripts to remove inactive files from the disk. To help alleviate this strain we've moved the code responsible for deleting files that have been archived for longer than the configured retention period into its own script (`./scripts/evict-archived.js`). For the moment this script is not integrated into the server and will not automatically run in the background as the main eviction script does. It's recommended that you run it manually if you find you are low on disk space.

Since early in the pandemic we've been serving a custom home page on CryptPad.fr to inform users that we've increased the amount of storage provided for free. This was originally intended as a temporary measure, but since almost a year has passed we figured it was about time we integrate this custom code into the platform itself. Admins can now add a custom note to the home page, using customized HTML in `customize/application_config.js`. To do this, define an `AppConfig.homeNotice` attribute like so: `AppConfig.homeNotice = "<b>pewpew</b>";`.

To update from 4.1.0 to 4.2.0:

1. Stop your server
2. Get the latest code from the 4.2.0 tag (`git fetch origin && git checkout 4.2.0`, or just `git pull origin main`)
3. Install the latest dependencies with `bower update` and `npm i`
4. Restart your server

## Features

* The "What is CryptPad" page now links to our sponsors websites instead of just mentioning them by name.
* We've updated the colors for the contacts app and the chat integrated into documents and teams to fit better with our other styles.
* We've reverted the styles for the rich text editor so that the document always has a white background, even in dark mode, since we could not guarantee that documents would be legible to all users if custom text colors had been applied. While we were looking at this editor, we also repositioned several buttons used to control the page's layout, including the width of the document, the presence of the table of contents, and its comments.
* We've continued to improve several key parts of the platform to accommodate offline usage. Teams, shared folders within teams, and the file app can now load and display content cached within the browser even if the client cannot establish a connection to our API server.
* The content of _whiteboard_ documents can now be downloaded directly from within team or user drives, rather than exclusively from within the whiteboard editor itself. To do so, right-click a whiteboard and choose _download_ to export a PNG file.
* Since we now regularly serve more than 125 thousand visitors a week it's gotten quite difficult to keep up with support tickets. To help alleviate this burden we're taking steps to increase the visibility of our documentation (https://docs.cryptpad.org). The support ticket page now displays a link to that documentation above the form to create a new ticket.
* Several users have reported confusion regarding various password fields in CryptPad, in the access menu, pad creation screen, when uploading new files, and when creating a shared folder. We've updated the text associated with these fields to better indicate that they are not requesting your user password, but rather that they allow you to add an optional password as an additional layer of protection.
* Server administrators can now refresh the _performance_ table on the admin panel without reloading the page.
* We've begun working on a _checkup_ page for CryptPad to help administrators identify and fix common misconfigurations of the platform. It's still in a very basic state, but we hope to to make it a core part of the server installation guide that is under development.
* The kanban app now supports import like the rest of our apps and rejects content of any file-type other than JSON.
* We've dropped support for a very old migration that handled user accounts that had not been accessed fo several years. This should make everyone else's account slightly faster.

## Bug fixes

* We've fixed a long list of minor stylistic inconsistencies following last release's introduction of dark mode:
  * Text embedded in documents via media-tags now features the same background and text color as is applied to similar preformatted code blocks in markdown.
  * The arrow portion of our tooltips had inherited an inconsistent background color from a parent element. It now uses the same color as the body of the tooltip.
  * Our 404 page now correctly uses the theme's background color.
  * We removed a number of unused color variables from our style sheets.
  * The most recent user message of any thread on the admin panel's view of support tickets is no longer red. Since we now categorize messages according to their answered status and priority, this indicator was no longer necessary.
  * We fixed some contrast issues on for pages with sidebars (settings, teams, admin, etc.) when hovering over items in the sidebar.
  * Various items in the drive and pad type selection menu also had contrast issues when hovering over options.
  * Links in the drive's info boxes and in the admin panel are now correctly styled with the same color as links throughout the rest of the platform.
  * Race conditions between conflicting styles for autocomplete dropdowns caused them to be displayed behind other elements under certain circumstances.
  * The "bell" icon which we use for the notifications menu in the toolbar now uses the same color as documents' titles, rather than the color of the editor's toolbar.
  * Items in the filepicker modal which is opened by various apps' "Insert" menu now have a lighter grey background instead of the almost-black color applied in 4.1.0.
  * The storage limit indicator shown in the bottom-left corner of user and team drives no longer has round corners.
* An insufficiently specific CSS selector caused the "spinner" animation to persist in the chat interface after it should have been hidden.
* The client will now check whether a file is larger than is allowed by the server before attempting to upload it, rather failing only when the server rejects the upload.
* The drive no longer allows files to be dragged and dropped into locations other than the "Documents" section, as it did not make sense for files to be displayed anywhere else.
* We identified and fixed a number of issues which caused shared folders that were protected with access lists to fail to load due to race conditions between loading the document and authenticating with the server as a user or member of a team. This could also result in a loss of access to documents stored exclusively in those shared folders.
* There was a similar race condition that could occur when registering an account that could cause some parts of the UI to get stuck offline.
* We've fixed a number of server issues:
  1. A change in a function signature in late December caused the upload of unowned files to fail to complete.
  2. Messages sent via websocket are no longer broadcast to other members of a session until they have been validated by the server and stored on the disk. This was not a security issue as clients validate messages anyway, however, it could cause inconsistencies in documents when some members of a session incorrectly believed that a message had been saved.
  3. A subtle race condition in very specific circumstances could cause the server's in-memory index for a given session to become incorrect. This could cause one or two messages to be omitted when requesting the most recent history. We observed this in practice when some clients did not realize they had been kicked from a team. This is unlikely to have affected anyone in practice because it only occurred when reconnecting using cached messages for the document which records team membership, and this functionality is only being introduced in this release.
  4. Several HTTP headers were set by both our example NGINX configuration and the NodeJS server which is proxied by NGINX for a particular resource. The duplication of certain headers caused unexpected behaviour in Chrome-based browsers, so we've updated the Node process to avoid conflicting.
* We spent a lot of time improving our integration of OnlyOffice's sheet editor:
  * The editor is now initialized with your CryptPad account's preferred language.
  * We realized that our peer-to-peer locking system (which replaces the server-based system provided by OnlyOffice's document server) did not correctly handle multiple locks per user. This caused errors when filtering and sorting columns. We've improved our locking system so these features should now work as expected, but old clients will not understand the new format. As mentioned in the "Update notes" section, admins must follow the recommended update steps to ensure that all clients correctly update to the latest version.
  * We've removed a restriction we imposed to ensure all users editing a sheet were using OnlyOffice's "fast mode", since we now support the alternative "strict mode". In strict mode, changes you make to the document are not sent until you choose to save (using a button or by pressing ctrl+s). This introduces some additional complexity into our integration, however, it enables support for undoing local changes as per [issue #195](https://github.com/cryptpad/cryptpad/issues/195).

# 4.1.0 (B)

## Goals

Our recent 4.0.0 release introduced major changes to CryptPad's style-sheets which likely caused some difficulty for admins who'd made extensive changes to their instance's appearance. We figure it's best to make more changes now instead of making small breaking changes more frequently, so we decided now is a good time to refactor a lot of our styles to implement an often-requested dark mode in CryptPad.

## Update notes

As noted above, this release introduces some major changes to CryptPad styles. If you have customized the look of your instance we recommend testing this new version locally before deploying it to your server to ensure that there are no critical conflicts.

Otherwise, to update from 4.0.0 to 4.1.0:

1. Stop your server
2. Get the latest code from the 4.1.0 tag (`git fetch origin && git checkout 4.1.0`, or just `git pull origin main`)
3. Install the latest dependencies with `bower update` and `npm i`
4. Restart your server

## Features

* The new dark theme will be applied if CryptPad detects that your OS or browser are configured to prefer dark modes, otherwise you can choose to enable the dark mode on a per-device basis via the _Appearance_ tab of the settings page. Aside from general tweaks for common stylistic elements like the toolbar and loading screen, we made many app-specific changes:
  * Markdown-based slide colors are initialized to match the theme of their creator.
  * Freshly-opened whiteboards are initialized with _white_ preselected instead of _black_ if you are using dark mode.
  * Markdown-extensions, like mermaid, markmap, and mathjax required additional effort to match users themes.
  * The rich-text editor is somewhat challenging, like the whiteboard, because users can choose to use text colors that may not contrast well against the background, and users may not all see the same thing. The default text color will always contrast with the theme background. Manually set light/dark colors may render the text unreadable for users using another theme.
* We made some UI updates to offer an increased ability to hide features that can take up too much of the available screen space. In particular, rich-text editors can choose to hide comments and the table of contents. Document owners can use the new _Document settings_ menu (available from the _File_ dropdown) to suggest settings for the current document, such that new users can view the document in its intended configuration unless they have set their own preferences.
* We've made some performance optimizations in a few key places on the client:
  * Large, complex kanbans tended to slow down quite a bit when multiple people were editing or moving cards at once. Boards are now only applied one second after the most recent change (unless updates have not been displayed for more than five seconds).
  * The drive's search functionality is similarly throttled to prevent multiple concurrent searches from being executed in parallel.
* Updates to the whiteboard include the undo/redo functionality via _fabric-history.js_, and the ability to add text to drawings.
* The _teams-picker_ page has been redesigned to use a card-based interface so that clicking anywhere on a team's card opens its drive, rather than just a single "open" button.
* We've added a number of new features to the admin panel:
  * The _Statistics_ tab now features a button to load the latest stats from the server instead of requiring a page reload to see the latest numbers.
  * There is a new _Performance_ tab which includes a table of the time spent executing various server functions. We're using this data to prioritize optimizations to decrease resource consumption and increase the number of users one instance can support.
  * We've added a _Check account storage_ section on the _User storage_ tab to allow admins to check how much of their quota any particular user has consumed, however, it seems to return incorrect results some of the time, so you can consider it experimental for now.

## Bug fixes

* The recent updates to display recent versions of user data from a local cache before the latest content had been synchronized introduced a few minor issues which have been addressed:
  * The user menu (in the top-right corner) incorrectly linked to a _donate link_ instead of a link to their subscription page because their first attempt to check their quota failed.
  * The usage bar in the drive, teams, and settings pages only appeared after some time because it is scheduled to update every thirty seconds, and the first attempt failed while it was still connecting. We now update retry more eagerly until a connection is established.
* We've fixed a few links to our documentation which incorrectly concatenated two URLs together.
* Users that had added the same document template to their own drive as well as a team's drive could see two instances of it suggested on the pad creation screen. We now deduplicate this list such that only one copy is suggested for use.
* The Kanban app now offers better touch support, as some users reported that they were unable to drag and drop cards and columns.
* Finally, we now guard against some edge cases in the _access modal_ in which the owner of a document could send themself a request for edit rights if they loaded the document in view mode after deleting it from their drive.

# 4.0.0 (A)

We're very happy to introduce CryptPad v4.0!

This release is the culmination of a great deal of work over the last year, in which we searched for the right metaphors and imagery to clearly represent what CryptPad is all about. We've reworked our logo, color theme, text on our static pages, and the icons throughout the platform to convey the calm and safety we want our users to feel.

Our release schedule typically follows an alphabetical naming scheme, ranging from A for the first (or zero-th) release of the cycle to Z for the last, with a thematic name for each letter. In the rush of preparing translations and double-checking all of our changes we never found time to settle on a theme for this release, but we do find there's some value in maintaining the otherwise arbitrary rhythm we've followed all this time. The progression through the alphabet gives a sense of pace to what can otherwise seem like a endless stream of problems that need solving, and the end of the alphabet prompts us to build towards major milestones like this one.

With that in mind, you can expect 25 more major releases in this cycle before version 5.0, roughly every three weeks or so depending on circumstances.

## Goals

The main intent of this release was to deploy our `rebrand` branch which had been in development for some time. Along the way we also made notable improvements to the sheet editor which will be mentioned below.

## Update notes

In the process of redesigning the platform we started using some new features of the LESS CSS pre-processor language that were not supported by the version of lesshint that we were using to scan for errors. We've updated that dev dependency to a newer version (4.5.0 => 6.3.7) which introduced a rather large number of minor dependencies. These are only used during development, not by the server itself, so this is unlikely to have any impact on the software itself.

Otherwise, this release includes lots of changes to the platform's style sheets and static pages. If you've applied heavy customizations to your instance you might notice errors due to incompatibilities with your local changes. We recommend that you test your customizations against the latest release locally before updating a public instance to avoid service outages.

To update from 3.25.1 to 4.0.0:

1. Stop your server
2. Get the latest code from the 4.0.0 tag
3. Install the latest dependencies with `bower update` and `npm i`
4. Restart your server

## Features

* We've built a new version of the web-assembly code used to convert between OnlyOffice's internal representation of spreadsheet data and standard formats like XLSX, ODS, and CSV. We've also improved the ability to print whole sheets and selections in the UI. This still depends on the host browser's support of the required web APIs, but it should work in common browsers except maybe Safari and Internet Explorer.
* We found that certain issues reported via the built-in support ticket system were not easy to debug without knowing the id of the user's drive. Support tickets now include a `driveChannel` attribute to simplify this process.
* We've added a variety of settings for the control of how your browser uses a local database to speed up loading times and display cached versions of documents even when disconnected from our server. These are available in the "confidentiality" section of the settings page (https://cryptpad.fr/settings/#security).

Finally, the "rebrand" part of this release:

* Our home page features our new logo, a cleaner layout, new text (notably dropping the use of "zero-knowledge" from our explanation), new app icons, softer colors, neater fonts, and a custom illustration of a document shredder that hints at how CryptPad works.
* We no longer include a FAQ page with each instance, and instead link to relevant parts of our dedicated documentation platform (https://docs.cryptpad.org) from any place that previously referenced the FAQ. This will make it easier for translators to focus on text for the platform's interface if they wish. An updated Frequently Asked Questions will be added to the documentation in the near future.
* Each of our editors now features a dedicated favicon to make it easier to distinguish different CryptPad tabs in your browser.
* The contact page now points to _Element_ instead of Riot, since the Matrix team rebranded in the last while as well.
* The "pricing" or "features" page (features.html) reads the server's configured storage limits from a server endpoint and displays them, rather than hardcoding the default values in the text.
* There is now a custom illustration of a person swallowing a key on the registration page to convey that CryptPad admins cannot restore access to documents if users lose or forget their credentials. This is underscored by highlights to the explanatory text displayed to the left of the form.
* Our loading screen now features a much simpler color scheme instead of the vibrant blue blocks. This is part of an effort to pave the way for a _dark theme_ that we hope to introduce very soon.
* Lastly, we've added a number of semantic cues in various places to improve the experience of users that rely on screen-readers. There's still a lot to do in this regard, but this big rewrite was a good opportunity to review some easy pain-points to alleviate.

## Bug fixes

* We found andd fixed a regression in the slide app which caused newly created documents to be initialized without a title.
* Thanks to a helpful user-report we were able to identify an issue in our rich text editor's _comments_ system that prevented iOS users from typing.

# ZyzomysPedunculatus' revenge (3.25.1)

This minor release is primarily intended to fix some minor issues that were introduced or detected following our 3.25.0 release, but it also includes some major improvements that we want to test and stabilize before our upcoming 4.0.0 release.

Features

* Our recent introduction of a clientside cache for document content now allows us to load and display a readable copy of a document before the most recent history has been fully loaded from the server. You might notice that your drive and some document typees are now displayed in a "DISCONNECTED" of "OFFLINE" state until they gets the latest history. For now this just means the loading screen is removed soon so you can start reading, but it's also an essential improvement that will become even more useful when we introduce the use of service-workers for offline usage.
* We've added an `offline` mode to the server so that anyone developing features in CryptPad can test its offline and caching features by disabling the websocket components of the server. Use `npm run offline` to launch in this mode.
* We spent some time improving the support ticket components of the administration panel. Tickets are now shown in four categories: tickets from premium users, tickets from non-paying users, answered tickets, and closed tickets.
* We also improved the readability of some of the server's activity logs by rounding off some numbers to display fewer decimal points. On a related note, log events indicating the completion of a file upload now display the size of the uploaded file.
* Errors that occur when loading teams now trigger some basic telemetry to the server to indicate the error code. This should help us determine the origin of some annoying teams issues that several users have reported.
* Users of the rich text editor should now find that their scroll position is maintained when they are at the bottom of the document and a remote users adds more text.

Bug fixes

* Shortly after deploying 3.25.0 we identified several cases in which its cache invalidation logic was not correctly detecting corrupted cache entries. This caused some documents to fail to load. We quickly disabled most caching until we got the chance to review. Since then, we've tested it much more thoroughly under situations which made it more likely to become corrupt. Our new cache invalidation logic seems to catch all the known cases, so we're re-enabling the use of the cache for encrypted files and most of our supported document types.
* We found that a race condition in the logout process prevented the document cache from being cleared correctly. We now wait until the asynchronous cache eviction process completes before redirecting users to the login page.
* We discovered that the `postMessage` API by which CryptPad's different iframes and workers communicate could not serialize certain error messages after recent changes. We've added some special logic to send such messages in a valid format as well as some extra error handling to better recover from and report failed transmissions.
* In cases where user avatars fail to load (due to network issues or 404s) the first letter of the user's display name will be displayed instead
* We found that shared folders were reconnecting to the server correctly after a network failure, however, some changes in the UI caused clients to incorrectly remain locked.
* Some recent refactoring of some styles caused some buttons on the login page to inherit bootstrap's styles instead of our custom ones.
* A third-party admin brought it to our attention that a library that was used for some development tests was being fetched via http instead of https, and was thus blocked by some of their local configuration parameters. We've updated its source to load via secure protocols only.
* The recent replacement of a link to our faq with a link to our documentation platform violated some security headers and prevented the link from loading. We've fixed the inline link with some code to open this link in a compatible way.
* Finally, we found a bug that caused custom colors in the slide app to revert to the default settings on page reloads. Custom slide colors should now be preserved.

To update from 3.25.0 to 3.25.1:

1. Stop your server
2. Get the latest code with `git checkout 3.25.1`
3. Install the latest dependencies with `bower update` and `npm i`
4. Restart your server

# ZyzomysPedunculatus (3.25.0)

## Goals

This is the last major release of our 3.0.0 release cycle. We wanted to mark the occasion with some big improvements to keep everyone happy in case we need to take some more time to prepare our upcoming 4.0.0 release.

## Update notes

This update introduces some major database optimizations that should decrease both CPU and disk usage over time as users request resources and prime an on-disk cache for the next time.

We've also introduce the ability to archive illegal or otherwise objectionable material from the admin panel assuming you possess the ability to load the content in question. It's also possible to restore archived content via an adjacent form field on the admin panel as long as it has not been permanently deleted. Due to a quirk in how ownership of uploaded files works, restored files will not retain their "owners" property. We hope to fix this in a future release.

We've also made some minor changes to the example NGINX config file provided in `cryptpad/docs/example.nginx.confg`, specifically in [this commit](https://github.com/cryptpad/cryptpad/commit/2647acbb78643e651b71d2d4f74c2f66e264a258). CryptPad will probably work if you don't apply these changes to your nginx conf, but some functional improvements depend on the exposed headers.

To upgrade from 3.24.0 to 3.25.0:

1. Update your NGINX config as mentioned above.
2. Stop your nodejs server.
3. Pull the latest code using git (from the `3.25.0` tag or the `main` branch)
4. Ensure you have the latest clientside and serverside dependencies with `bower update` and `npm install`.
5. Restart  the nodejs server.

## Features

* This release makes a lot of changes to how content is loaded over the network.
  * Most notably, CryptPad now employs a client-side cache based on the _indexedDB API_. Browsers that support this functionality will opportunistically store messages in a local cache for the next time they need them. This should make a considerable difference in how quickly you're able to load a pad, particularly if you accessing the server over a low-bandwidth network.
  * Uploaded files (images, PDFs, etc.) are also cached in a similar way. Once you'd loaded an asset, your client will prefer to load its local copy instead of the server.
  * We've updated the code for our _full drive backup_ functionality so that it uses the local cache to load files more quickly. In addition to this, backing up the contents of your drive will also populate the cache as though you had loaded your documents in the normal fashion. This cache will persist until it is invalidated (due to the authoritative document having been deleted or had its history trimmed) or until you have logged out.
  * We've added the ability to configure the maximum size for automatically downloaded files. Any encrypted files that are above this size will instead require manual interaction to begin downloading. Files that are larger than this limit which are already loaded in your cache will still be automatically displayed.
* We've also changed a lot of the UI related to encrypted file uploads and downloads:
  * Encrypted files can display buttons instead of the intended media under a variety of circumstances (if they are larger than your configured limit or if there is no applicable rendering mode). The styles for these buttons are now much more consistent with those found throughout the rest of the platform.
  * The same assets should now display progress bars when downloading and decrypting encrypted media.
  * When the same asset is embedded into a document in more than one location it used to be possible to trigger two (or more) concurrent decryption processes. We've modified the rendering process so that duplicates are detected and rendered simultaneously after the relevant assets have been decrypted (once).
  * We noticed that some old code to filter out forbidden content from rich text pads was interfering with encrypted media. We've clarified the filtering rules to preserve such content (audio, video, iframes) when it occurs within an acceptable context.
  * We've fixed some inconsistencies with media styles and functionality across different editors. Most types of media now allow you to right-click and choose to _share_ (open that asset's share menu) or open it in a different context (in the file app or in the relevant editor where this behaviour is supported).
  * The _file_ app has been greatly simplified. It now uses the same methods to render encrypted media as is used elsewhere, so it also displays progress and has a more consistent UI.
  * The file uploads/downloads table has also been improved somewhat:
    * Download progress is displayed for groups of items when downloading a folder from your drive.
    * We found and removed a hard-coded translation from the table's header.
* In keeping with the theme of network traffic and files we've also made some improvements to policies for users' storage:
  * Users should now be prompted to trim the history of very large documents when viewing them, saving space for the server operator as well as freeing up some of the user's quota.
  * Users will also be prompted to use similar functionality available through the settings page when the history of their drive and other account-related functionality is consuming a significant amount of their quota.
  * Documents that you own used to be automatically added to your drive when viewed if they weren't already present. This was originally intended as an integrity check and a means to recover from incorrectly removed entries in your drive, however, as we now support the removal of owned elements from your drive without destroying them this only serves as an annoyance. As such, we have dropped this functionality.
  * The whiteboard editor allows users to insert encrypted images into whiteboards, but only up to a certain size. Before it would just warn you that your image was too large. Now it provides the actual size limit that you've exceeded.
  * The prompt to store uploads in your drive is now suppressed when uploading images via the support ticket panel.

## Bug fixes

* This release includes a fix for a very severe bug in Chrome and its derivatives where attempting to open a URL from within our sandboxing system would crash the browser entirely. This version works around the problem by _not doing that_.
* We've improved offline detection such that "offline" status is specific to particular resources like your drive, teams, and shared folders rather than treating your account as simply "online or offline".
* We've optimized one of our less style sheet mixins that was used in a lot of places at a more specific scope than was necessary. This resulted in more time compiling styles and higher storage space requirements for the css cache in localStorage.
* A small helper function that was intended to stop listening for `enter` and `esc` keypresses after closing a modal was overly zealous and stopped listening after _any keypress_. This made it so that any prompt with an input field did not correctly submit or cancel when pressing `enter` or `esc` after  typing some text.
* Various browsers now require the request for the permission to send notifications to originate from a "click" event, so CryptPad now opens a dialog prompting you to allow (or disallow) permission if you haven't already made that decision.
* Modern browsers commonly prevent tabs from opening new windows unless you've explicitly enabled that behaviour (it's an important feature), however, in some cases the indication that a new tab was blocked can be very subtle and some of our users did not notice it. We now check whether attempts to open a new tab were successful, and prompt the user to enable this behaviour so that CryptPad can perform regular actions like opening a pad from the drive.
* After some deep investigation we identified a number of scenarios where contact requests would behave incorrectly, such as not triggering a notification. Contact requests should now be much more stable. On a related note, it's now possible to cancel a pending contact request from the concerned user's profile.

# YunnanLakeNewt (3.24.0)

## Goals

We are once again working to develop some significant new features. This release is fairly small but includes some significant changes to detect and handle a variety of errors.

## Update notes

This release includes some minor corrections the recommended NGINX configuration supplied in `cryptpad/docs/example.nginx.conf`.

To update from 3.23.2 to 3.24.0:

1. Update your NGINX config to replicate the most recent changes and reload NGINX to apply them.
2. Stop the nodejs server.
3. Pull the latest code from the `3.24.0` tag or the `main` branch using `git`.
4. Ensure you have the latest clientside and serverside dependencies with `bower update` and `npm install`.
5. Restart the nodejs server.

## Features

* A variety of CryptPad's pages now feature a much-improved loading screen which provides a more informative account of what is being loaded. It also implements some generic error handling to detect and report when something has failed in a catastrophic way. This is intended to both inform users that the page is in a broken state as well as to improve the quality of the debugging information they can provide to us so that we can fix the underlying cause.
* It is now possible to create spreadsheets from templates. Template functionality has existed for a long time in our other editors, however, OnlyOffice's architecture differs significantly and required the implementation of a wholly different system.
* One user reported some confusion regarding the use of the Kanban app's _tag_ functionality. We've updated the UI to be a little more informative.
* The "table of contents" in rich text pads now includes "anchors" created via the editor's toolbar.

## Bug fixes

* Recent changes to CryptPad's recommended CSP headers enabled Firefox to export spreadsheets to XLSX format, but they also triggered some regressions due to a number of incompatible APIs.
  * Our usage of the `sessionStorage` for the purpose of passing important information to editors opened in a new tab stopped working. This meant that when you created a document in a folder, the resulting new tab would not receive the argument describing where it should be stored, and would instead save it to the default location. We've addressed this by replacing our usage of sessionStorage with a new format for passing the same arguments via the hash in the new document's URL.
  * The `window.print` API also failed in a variety of cases. We've updated the relevant CSP headers to only be applied on the sheet editor (to support XSLX export) but allow printing elsewhere. We've also updated some print styles to provide more appealing results.
* The table of contents available in rich text pads failed to scroll when there were a sufficient number of heading to flow beyond the length of the page. Now a scrollbar appears when necessary.
* We discovered a number of cases where the presence of an allow list prevented some valid behaviour due to the server incorrectly concluding that users were not authenticated. We've improved the client's ability to detect these cases and re-authenticate when necessary.
* We also found that when the server was under very heavy load some database queries were timing out because they were slow (but not stopped). We've addressed this to only terminate such queries if they have been entirely inactive for several minutes.
* It was possible for "safe links" to include a mode ("edit" or "view") which did not match the rights of the user opening them. For example, if a user loaded a safe link with edit rights though they only had read-only access via their "viewer" role in a team. CryptPad will now recover from such cases and open the document with the closest set of access rights that they possess.
* We found that the server query `"IS_NEW_PAD"` could return an error but that clients would incorrectly interpret such a response as a `false`. This has been corrected.
* Finally, we've modified the "trash" UI for user and team drives such that when users attempt to empty their trash of owned shared folders they are prompted to remove the items or delete them from the server entirely, as they would be with other owned assets.

# XerusDaamsi reloaded (3.23.2)

A number of instance administrators reported issues following our 3.23.1 release. We suspect the issues were caused by applying the recommended update steps out of order which would result in the incorrect HTTP header values getting cached for the most recent version of a file. Since the most recently updated headers modified some security settings, this caused a catastrophic error on clients receiving the incorrect headers which caused them to fail to load under certain circumstances.

Regardless of the reasons behind this, we want CryptPad to be resilient against misconfiguration. This minor release includes a number of measures to override the unruly caching mechanisms employed internally by two of our most stubborn dependencies (CKEditor and OnlyOffice). Deploying 3.23.2 should force these editors to load the most recent versions of these dependencies according to the same policies as the rest of CryptPad and instruct clients to ignore any incorrect server responses they might have cached over the last few updates.

This release also includes a number of bug fixes which had been tested in the meantime.

Other bug fixes

* We removed a hardcoded translation pertaining to the recently introduced "snapshot" functionality.
* Inspection of our server logs revealed a number of rare race conditions and type errors that have since been addressed. These included:
  * multiple invocations of a callback when iterating over the list of all encrypted blobs
  * a type error when recovering from the crash of one of the database worker processes
  * premature closure of filesystem read-streams due to a timeout when the server was under heavy load
* A thorough review of our teams functionality revealed the possibility of some similarly rare issues that have since been corrected:
  * it was possible to click the buttons on the "team invitation response dialog" multiple times before the first action completed. In some cases this could result in attempting to join a single team multiple times.
  * it was also possible to activate trigger several actions that would modify your access rights for a team when the team had not fully synchronized with the server. Some of the time this was recoverable, but it could occasionally result in your team membership getting stuck in a bad state.

We've implemented some measures to correct any team data that might have become corrupted due to the issues described above. Access rights from duplicated teams should be merged back into one set of cryptographic keys wherever possible. In cases where this isn't possible your role in the team will be automatically downgraded to the rank conferred by the keys you still have. For instance, somebody listed as an administrator who only has the keys required to view the team will downgrade themself to be a viewer. Subsequent promotions back to your previous team role should restore your possession of the required keys.

To update to 3.23.2 from 3.23.0 or 3.23.1:

Perform the same upgrade steps listed for 3.23.0 including the most recent configuration changes listed in `cryptpad/docs/example.nginx.conf...

1. Modify your server's NGINX config file (but don't apply its changes until step 6)
2. Stop CryptPad's nodejs server
3. Get the latest platform code with git
4. Install client-side dependencies with `bower update`
5. Install server-side dependencies with `npm install`
6. Reload NGINX with `service nginx reload` to apply its config changes
7. Restart the CryptPad API server

# XerusDaamsi's revenge (3.23.1)

We discovered a number of minor bugs after deploying 3.23.0. This minor release addresses them.

Features

* On instances with a lot of data (like our own) the background process responsible for evicting inactive data could time out. We've increased its permitted duration to a sufficient timeframe.
  * This process also aggregates some statistics about your database while it runs. Upon its completion a report is now stored in memory until it is overwritten by the next eviction process. This report will most likely be displayed on the admin panel in a future release.
  * We now introduce some artificial delays into this process to prevent it from interfering with instances' normal behaviour.
* Instance administrators may have noticed that support tickets include some basic information about the user account which submitted them. We've been debugging some problems related to teams recently and have included a little bit of non-sensitive data to tickets to help us isolate these problems.
* We've added some additional text to a few places to clarify some ambiguous behavior:
  * When creating a shared folder we now indicate that the password field will be used to add a layer of protection to the folder.
  * The "destroy" button on the access modal now indicates that it will completely destroy the file or folder in question, rather than its access list or other parameters.

Bug fixes

* We received a number of support tickets related to users being unable to open rich text pads and sheets. We determined the issue to have been caused by our deployment of new HTTP headers to enable XLSX export on Firefox. These headers conflicted with the those on some cached files. The issue seemed to affect users randomly and did not occur when we tested the new features. We deployed some one-time cache-busting code to force clients to load the latest versions of these files (and their headers).
* We addressed a regression introduced in 3.23.0 which incorrectly disabled the support ticket panels for users and admins.
* We also fixed some layout issues on the admin panel's new _User storage_ pane.
* Finally, we added a few guards against type errors in the drive which were most commonly triggered when viewing ranges of your drive's history which contained shared folders that had since been deleted.

To update from 3.23.0 to 3.23.1:

0. Read the 3.23.0 release notes carefully and apply all configuration changes if you haven't already done so.
1. Stop your server
2. Get the latest code with `git checkout 3.23.1`
3. Install the latest dependencies with `bower update` and `npm i`
4. Restart your server

# XerusDaamsi (3.23.0)

## Goals

We plan to produce an updated installation guide for CryptPad instance administrators to coincide with the release of our 4.0.0 release. As we get closer to the end of the alphabet we're working to simplify the process of configuring instances. This release features several new admin panel features intended to supersede the usage of the server configuration file and provide the ability to modify instance settings at runtime.

We also spent some time finalizing some major improvements to the history mode which is available in most of our document editors. More on that in the _Features_ section.

## Update notes

This release introduces some behaviour which may require manual configuration on the part of the administrator. Read the following sections carefully or proceed at your own risk!

### Automatic database maintenance

When a user employs the _destroy_ functionality to make a pad unavailable it isn't typically deleted. Instead it is made unavailable by moving it into the server's archive directory. Archived files are intended to be removed after another configurable amount of time (`archiveRetentionTime` in your config file). The deletion of old files from your archive is handled by `evict-inactive.js`, which can be found in `cryptpad/scripts/`. Up until now this script needed to be run manually (typically as a cron job) with `node ./scripts/evict-inactive.js`. Since this isn't widely known we decided to integrate it directly into the server by automatically running the script once per day.

The same _eviction_ process is also responsible for scanning your server's database for inactive documents (defined as those which haven't been accessed in a number of days specified in your config under `inactiveTime`). Such inactive documents are archived unless they have been stored within a registered users drive. Starting with this release we have added the ability to specify the number of days before an account will be considered inactive (`accountRetentionTime`). This will take into account whether they added any new documents to their drive, or whether any of the existing documents were accessed or modified by other users.

If you prefer to run the eviction script manually you can disable its integration into the server by adding `disableIntegratedEviction: true` to your config file. An example is given in `cryptpad/config/config.example.js`. If you want this process to run manually you may set the same value to `false`, or comment it out if you prefer. Likewise, if you prefer to never remove accounts and their data due to account inactivity, you may also comment it out.

If you haven't been manually running the eviction scripts we recommend that you carefully review all of the values mentioned above to ensure that you will not be surprised by the sudden and unintended removal of any data. As a reminder, they are:

* `inactiveTime` (number of days before a file is considered inactive)
* `archiveRetentionTime` (number of days that an archived file will be retained before it is permanently deleted)
* `accountRetentionTime` (number of days of inactivity before an account is considered inactive and eligible for deletion)
* `disableIntegratedEviction` (true if you prefer to run the eviction process manually or not at all, false or nothing if you want the server to handle eviction)

### NGINX Configuration update

After some testing on our part we've included an update to the example NGINX config file available in `cryptpad/docs/example.nginx.conf` which will enable a relatively new browser API which is required for XLSX export from our sheet editor. The relevant lines can be found beneath the comment `# Enable SharedArrayBuffer in Firefox (for .xlsx export)`.

### Quota management

Up until now the configuration file found in `cryptpad/config/config.js` has been the primary means of configuring a CryptPad instance. Unfortunately, as the server's behaviour becomes increasingly complex due to interest in a broad variety of use-cases this config file tends to grow. The kinds of questions that administrators ask via email, GitHub issues, and via our Matrix channel often suggest that admins haven't read through the comments in these files. Additionally, changes to the server's configuration can only be applied by restarting the server, which is increasingly disruptive as the service becomes more popular. To address these issues we've decided to start improving the instance admin panel such that it becomes the predominant means of modifying common server behaviours.

We've started by making it possible to update storage settings from the _User storage_ section of the admin panel. Administrators can now update the default storage limit for users registered on the instance from the default quota of 50MB. It's also possible to allocate storage limits to particular users on the basis of their _Public Signing Key_, which can be found at the top of the _Accounts_ section on the settings page.

Storage limits configured in this way will supercede those set via the server's config file, such that any modifications to a quota already set in the file will be ignored once you have modified or removed that user's quota via the admin panel. Admins are also able to view the parameters of all existing custom quotas loaded from either source.

### How to update

Once you've reviewed these settings and you're ready to update from 3.22.0 to 3.23.0:

1. Modify your server's NGINX config file to include the new headers enabling XLSX export
2. Stop CryptPad's nodejs server
3. Get the latest platform code with git
4. Install client-side dependencies with `bower update`
5. Install server-side dependencies with `npm install`
6. Reload NGINX with `service nginx reload` to apply its config changes
7. Restart the CryptPad API server

## Features

* As mentioned in the update notes, this release features a server update which will enable XLSX export from our sheet editor in Firefox. XLSX files are generated entirely on the client, so all information will remain confidential, it only required a server update to enable a feature in Firefox which is required to perform the conversion.
* We've also made some considerable improvements to the _history mode_ available in most of our document editors. We now display a more detailed timeline of changes according to who was present in the session, and group contiguous modifications made by a single user. Our intent is to provide an overview of the document's history which exposes the details which are most relevant to humans, rather than only allowing users to step through each individual change.
* Another change which is related to our history mode improvements is support for "version links", which allow you to link to a specific historical version of a document while you scroll through the timeline of its modifications. You can also create _named snapshots_ of documents which will subsequently be displayed as highlights in the document's timeline.
* Up until now we did not support _history mode_ for spreadsheets because our sheet integration is sufficiently different from our other editors that our existing history system could not be reused. That's still the case, but we've invested some time into creating a parallel history system with a slightly different user interface tailored to the display of sheet history.
* Team owners and admins can now export team drives in the same manner as their own personal drives. The button to begin a full-drive export is available on the team's administration page.
* During the summer we experimented with the idea of providing preview rendering options for more of the languages available in the code editor. We were particularly interested in providing LaTeX rendering in addition to Markdown. Unfortunately, it turned out to be a more complex feature than we have time for at the moment. In the process, however, we made it easier to integrate other rendering modes in addition to markdown. For the moment we've only added a simple rendering mode for displaying mixed HTML, but we'll consider using this framework to offer more options in the future.
* While it might not be very noticeable depending on the size of the screen you use to view CryptPad we've spent some time making more of our interface responsive for mobile devices. You may notice this in particular on the modal menus used for sharing, setting access control parameters, and otherwise displaying alerts.
* We've also begun improving support for screen-readers by adding the required HTML attributes to input fields and related markup. We'll continue to make incremental improvements regarding this and other accessibility issues that were raised during the third-party accessibility audit performed several months ago. This audit was performed on behalf of NLnet foundation (one of our major sponsors) as a part of their NGI Zero Privacy-Enhancing Technologies fund.
* The _share modal_ from which users can generate shareable links already detects whether you have added any contacts on the platform and suggests how you can connect with them if you have not. We added this functionality some time late in 2019 since the same modal allowed users share documents directly with contacts and this mode became the subject of many support tickets. As it turns out, many users are now discovering _contact_ functionality via the _access modal_ through which you can add users to a document's allow list or delegate ownership. Since this has become a similar point of confusion we've added the same hints to make it a natural entry-point into CryptPad's social functionality.

## Bug fixes

* We noticed that it was not possible for document owners to remove the extraneous history of old documents when those documents were protected by an _allow list_. This was due to the usage of an incorrect method for loading the document's metadata, leading to a false negative when testing if the user in question had sufficient access rights.
* We also discovered an annoying bug in our filesystem storage APIs which caused the database adaptor to prevent scripts from terminating until several timeouts had finished running. These timeouts are now cancelled automatically so that the scripts stop running in a timely manner.

# WoollyMammoth (3.22.0)

## Goals

We've been working on some long-term projects that we hope to deliver over the course of the next few releases. In the meantime, this release includes a number of minor improvements.

## Update notes

To upgrade from 3.21.0 to 3.22.0:

1. Stop your server
2. Get the latest platform code with git
3. Install client-side dependencies with `bower update`
4. Restart the CryptPad API server

## Features

* Contributors have helped by translating more of CryptPad into Finnish and traditional Chinese via [our weblate instance](https://weblate.cryptpad.fr/projects/cryptpad/app/)
* We've updated the syntax highlighting code that we use throughout the platform to include Rustlang (and possibly other languages that have been updated in the meantime).
* You can now use _ctrl-f_ in user or team drives to jump immediately to the search interface instead of possibly scrolling up to click on its entry in the sidebar.

## Bug fixes

* Some of the special behaviour implemented for Org-mode in our code editor sometimes failed when the document was first changed into Org-mode.
* We now clear some minor personal preferences like whether certain tooltips had been dismissed when you log out.
* We identified and addressed a number of issues with teams that caused valid teams to not be displayed and team member rights to fail to upgrade until a full session reload.
* We now display the number of days before an unregistered user's documents are considered inactive in their drive instead of hardcoding "3 months".

# VietnameseRhinoceros (3.21.0)

## Goals

This release was developed over a longer period than usual due to holidays, our yearly company seminar, and generally working on some important software-adjacent projects. As such, we opted not to aim for any major features and instead introduce some minor improvements and address some users' complaints.

## Update notes

We've had a few disgruntled administrators contact us about our apparent _failure to provide a docker image_ or to otherwise support their preferred configuration. With that in mind, this is a periodic reminder that CryptPad is provided to the public under the terms of the AGPL (found within this repository in the [LICENSE file](./LICENSE)) which implies on our part no warranty, liability, or responsibility to configure your server for you. We do our best to provide the necessary information to correctly launch your own instance of the software given our limited budget, however, all such files are provided **AS IS** and are only intended to function under the narrow circumstances of usage which we recommend within the comments of the provided example configuration files.

With that said, the vast majority of our community acts kindly and courteously towards us and each other. We really do appreciate it, and we'll continue to help you to the best of our ability. With that in mind, we're happy to announce that we've written and deployed a first version of our user guide, available at https://docs.cryptpad.org. The work that went into this was funded by NLnet foundation as an NGI Zero PET (Privacy-Enhancing Technology) grant. We are currently working on two more guides intended for developers and administrators, and will deploy them to the same domain as they are completed. In the meantime we have begun to update our README, GitHub wiki, and other resources to reflect the current recommended practices and remove references to unsupported configurations.

If you're only reading this for instructions on how to update your instance from 3.20.1 to 3.21.0:

1. Stop your server
2. Get the latest platform code with git
3. Install client-side dependencies with `bower update`
4. Install server-side dependencies with `npm install`
5. Restart the CryptPad API server

## Features

* We spent a little bit of time during our company seminar and implemented a first version of an automatically generated  _table of contents_ in our rich text editor. It is populated using header styles applied with the editor's dropdown menus, and can be hidden by clicking the "Outline" button in the app toolbar.
* We also made it possible to change the default behaviour of the Kanban tag filter via the settings page. You may choose to compound the selection of multiple tags as AND, resulting in the display of cards that have all the selected tags rather than the default OR behaviour which displays any card including any one of the selected tags.
* We've integrated a third-party Org-mode library into our code editor which features some fancy click-handlers that toggle the state of certain org-mode classifications.
* The search results interface which is present in individual and team drives has been improved such that it displays a spinner while a search is pending and that it indicates when there are no results for a given term.
* We've added a Japanese font (Komorebi-gothic) for use within the spreadsheet editor and have received and integrated Japanese translations from a contributor via our weblate instance (https://weblate.cryptpad.fr).
* Finally, we've modified some behaviour in individual and team drives, making it possible to move a shared folder to the trash where it was previously only possible to directly remove it from your drive.

## Bug fixes

* We've corrected a minor server issue in which it would respond to requests to destroy non-existent files with an E_NO_OWNERS error, rather than an ENOENT (doesn't exist) error. The client code interpreted this as the file existing without them having the rights to delete it, rather than realizing that it no longer existed. This made it more difficult to remove files from your drive since destruction would fail rather than be interpreted as unnecessary.
* We now guard against race conditions in our internal _write-queue_ library, preventing a rare occurrence of a type error triggered by unknown circumstances.
* We discovered that Firefox had enabled (by default) half of the functionality required to export sheets to an XLSX format. We interpreted the presence of this feature as sufficient cause to display XLSX as an export option, even though the export would fail if you tried to use it. The second half of the required functionality is available in Firefox, but requires specific HTTP headers to be sent by our server. We're currently testing the configuration parameters and expect to make XLSX export available on CryptPad.fr very soon, along with an update to our recommended configuration which would enable it on other instances.
* Lastly, we discovered an incompatibility betweeen our "safe links" behaviour and the process of redirecting users to log in or register to access specific functionality. Users that were redirected from pads accessed with safe links were redirected to that safe link whether or not they had imported the pad's keys into their newly created drive. This could result in a temporary loss of access to the pad, even though its credentials were still stored within their browser. We've corrected the redirect process to preserve the full document credentials for after you have logged in.

# UplandMoa's revenge (3.20.1)

Once again we've decided to follow up our last major release with a minor "revenge" release that we wanted to make available as soon as possible.
We expect to deploy and release version 3.21.0 on Tuesday, July 28th, 2020.

Features

* The _markmap_ rendering mode which was recently added to markdown preview pane implements some click event handlers which overlap with our existing handlers which open the embedded mindmap in our full screen "lightbox". You can now use _ctrl-click_ to trigger its built-in events (collapsing subtrees of the mindmap) without opening the lightbox.
* We've made a few improvement to user and team drives:
  * The _list mode_ now features a "ghost icon" which you can use to create a new pad in the current folder, matching behaviour that already existed in grid mode.
  * We've also updated the search mode to display a spinner while your search is in progress. We also display some text when no results are found.
  * Team drives now open with the sidebar collapsed.
* Our rich text, code, slide, and poll apps now intercept pasted images and prompt the user to upload them, matching the existing experience of dragging an image into the same editable area.
* We've received new contributions to our Romanian translation via [our weblate instance](https://weblate.cryptpad.fr/projects/cryptpad/app/).

Bug fixes

* We identified some race conditions in our spreadsheet app that were responsible for some corrupted data during the period leading up to our 3.20.0 release, however, we wanted to take a little more time to test before releasing the fixes. As of this release we're moving to a third version of our internal data format. This requires a client-side migration for each older sheet which will be performed by the first registered user to open a sheet in edit mode, after which a page reload will be required. Unregistered users with edit rights will only be able to view older sheets until they have been migrated by a registered user.
* We now guard against empty _mathjax_ and _markmap_ code blocks in their respective markdown preview rendering extensions, as we discovered that empty inputs resulted in the display of "undefined" in the rendered element.
* We noticed and fixed two regressions in user and team drives:
  1. drive history had stopped working since the introduction of the "restricted mode" for shared folders which were made inaccessible due to the enforcement of their access lists.
  2. users with shared folders which had been deleted or had their passwords changed were prompted to delete the folder from their drive or enter its new password. The "submit" button was affected by a style regression which we've addressed.
* We've updated to a new version of `lodash` as a dependency of the linters that we use to validate our code. Unless you were actively using those linters while developing CryptPad this should have no effect for you.
* Finally, when users open a link to a "self-destructing pad" we now check to make sure that the deletion key they possess has not been revoked before displaying a warning indicating that the pad in question will be deleted once they open it.

To update from 3.20.0 to 3.20.1:

1. Stop your server
2. Get the latest code with `git checkout 3.20.1`
3. Install the latest dependencies with `bower update` and `npm i`
4. Restart your server

# UplandMoa (3.20.0)

## Goals

We've held off on deploying any major features while we work towards deploying some documentation we've been busy organizing. This release features a wide range of minor features intended to address a number of github issues and frequent causes of support tickets.

## Update notes

This release features a modification to the recommended Content Security Policy headers as demonstrated in `./cryptpad/docs/example.nginx.conf`. CryptPad will work without making this change, however, we highly recommend updating your instance's nginx.conf as it will mitigate a variety of potential security vulnerabilities.

Otherwise, we've introduced a new client-side dependency (_Mathjax_) and changed some server-side code that will require a server restart.

To update from 3.19.1 to 3.20.0:

1. Apply the recommended changes to  your `nginx.conf`
2. Stop your server
3. Get the latest platform code with git
4. Install client-side dependencies with `bower update`
5. Reload nginx to apply the updated CSP headers
6. Restart the CryptPad API server

## Features

* As noted above, this release features a change to the Content Security Policy headers which define the types of code that can be loaded in a given context. More specifically, we've addressed a number of CKEditor's quirks which required us to set a more lax security policy for the rich text editor. With these changes in place the only remaining exceptions to our general policy are applied for the sake of our OnlyOffice integration, though we hope to address its quirks soon as well.
* On the topic of the rich text editor, we also moved the _print_ action from the CKEditor toolbar to the _File_ menu to be more consistent with our other apps.
* The Kanban board that we use to organize our own team has become rather large and complex due to a wealth of long-term ideas and a large number of tags. We started to notice some performance issues as a result, and have begun looking into some optimizations to improve its scalability. As a start, we avoid applying changes whenever the Kanban's tab is not visible.
* We finally decided to file off one of the platform's rough edges which had been confusing curious users for some time. Every registered user is identified by a randomly-generated cryptographic key (the _Public Signing Key_ found on your settings page). These identifiers are used to allocate additional storage space via our premium accounts, and we occasionally require them for other support issues like deleting accounts or debugging server issues. Unfortunately, because we occasionally receive emails asking for help with _other administrators instances_ these keys were formatted along with the host domain in the form of a URL. As such, it was very tempting to open them in the browser even though there was no functionality corresponding to the URL. We've updated all the code that parses these keys and introduced a new format which is clearly _not a URL_, so hopefully we'll get fewer messages asking us why they _don't work_.
* We've made a number of small improvements to the common functionality in our code and slide editors:
  * We've merged and built upon a pull request which implemented two new extensions to our markdown renderer for _Mathjax_ and _Markmap_. This introduces support for embedding formatted equations and markdown-based mind maps. Since these depend on new client-side code which would otherwise increase page loading time we've also implemented support for lazily loading extensions on demand, so you'll only load the extra code if the current document requires it.
  * The _slide_ editor now throttles slide redraws so that updates are only applied after 400ms of inactivity rather than on every character update.
  * We've made a number of small style tweaks for blockquotes, tables, and embedded media in rendered markdown.
* Lastly, we've made a large number of improvements to user and team drives:
  * Search results now include shared folders with matching names and have been made _sortable_ like the rest of the drive.
  * Inserting media in a document via the _Insert_ menu now updates its access time, which causes it to show up in the _Recent pads_  category of your drive.
  * Shared folders now support access lists. To apply an access list to a shared folder that you own you may right-click the shared folder in your drive, choose _Access_, then click the _List_ tab of the resulting dialog. Enabling its access list will restrict access to its owners and any other contacts that you or other owners add to its list. Note, this access applies to the folder itself (who can view it or add to its directory), its access list will not be applied recursively to all the elements contained within which might be contained in other shared folders or other users drives.
  * In the interest of removing jargon from the platform we've started to change text from "Delete from the server" to "Destroy". We plan to make more changes like this on an ongoing basis as we notice them.
  * We've made a significant change to the way that _owned files_ are treated in the user and team drives. Previously, files that you owned were implicitly deleted from the server whenever you removed them from your drive. This seemed sensible when we first introduced the concept of ownership, however, now that a variety of assets can have multiple owners it is clearly less appropriate. Rather than require users to first remove themselves as a co-owner before removing an asset from their drive in order to allow other owners to continue accessing it we now offer two distinct _Remove_ and _Destroy_ actions. _Remove_ will simply take it out of your drive so that it will no longer count against your storage limit, while _Destroy_ will cause it to stop existing _for everyone_. To clarify the two actions we've associated them with a _trash bin_ and _paper shredder_ icon, respectively.

## Bug fixes

* Remote changes in the Kanban app removed pending text in new cards, effectively making it impossible (and very frustrating) to create new cards while anyone else was editing existing content or submitting their own new cards.
* Dropping an image directly into a spreadsheet no longer puts the UI into an unrecoverable state, though we still don't support image drop. To insert images, use the "Insert" menu. This was actually fixed in our 3.19.1 release, but it wasn't documented in the release notes.
* When a user attempted to open an automatically expiring document which had passed its expiration date they were shown a general message indicating that the document had been deleted even when they had sufficient information to know that it had been marked for expiration. We now display a message indicating the more likely cause of its deletion.
* We've spent some time working on the usability of comments in our rich text app:
  * When a user started adding a first comment to a document then canceled their action it was possible for the document to get stuck in an odd layout. This extra space allocated towards comments now correctly collapses as intended when there are no comments, pending or otherwise.
  * The comments UI is now completely disabled whenever the document is in read-only mode, whether due to disconnection or insufficient permissions.
  * The _comment_ button in the app toolbar now toggles on and off to indicate the eligibility of the current selection as a new comment.
* We've fixed a number of issues with teams:
  * Users no longer send themselves a notification when they remove themself as an owner of a pad from within the _Teams_ UI.
  * The _worker_ process which is responsible for managing account rights now correctly upgrades and downgrades its internal state when its role within a team is changed by a remote user instead of requiring a complete worker reload.
  * The worker does not delete credentials to access a team when it finds that its id is not in the team's roster, since this could be triggered accidentally by some unrelated server bugs that responded incorrectly to a request for the team roster's history.
* We've fixed a number of issues in our code and slide editors:
  * The "Language" dropdown selectors in the "Theme" menu used to show "Language (Markdown)" when the page was first loaded, however, changing the setting to another language would drop the annotation and instead show only "Markdown". Now the annotation is preserved as intended.
  * A recent update to our stylesheets introduced a regression in the buttons of our "print options" dialog.
  * While polishing up the PRs which introduced the _Mathjax_ and _Markmap_ support we noticed that the client-side cache which is used to prevent unnecessary redraws of embedded media was causing only one instance of an element to be rendered when the same source was embedded in multiple sections of a document.
* The "File export" dialog featured a similar regression in the style of its buttons which has been addressed.
* We fixed a minor bug in our 3.19.0 release in which unregistered users (who do not have a "mailbox") tried to send a notification to themselves.
* We've added an additional check to the process for changing your account password in which we make sure that we are not overwriting another account with the same username and password.

# Thylacine's revenge (3.19.1)

Our upcoming 3.20.0 release is planned for July 7th, 2020, but we are once again releasing a minor version featuring some nice bug fixes and usability improvements which are ready to be deployed now. In case you missed [our announcement](https://social.weho.st/@cryptpad/104360490068671089) we are phasing out our usage of the `master` and basing our releases on the `main` branch. For best results we recommend explicitly checking out code by its tag.

New features:

* We've spent a little time making support tickets a little bit easier for both users and admins.
  * Users can now label their tickets with a set of predefined categories, making it easier for admins to sort through related reports.
  * Users and admins can both attach encrypted uploads to their messages, making it easier to demonstrate a problem with an image, video, or other example file.
* Teams now take advantage of the same "mailbox" functionality that powers user accounts' notification center. Team members with the "viewer" role can now use this feature to share documents with their team using the "share menu" as they already can with other users. Anyone with the ability to add a document to the team's drive will then be able to receive the notification and add the document to the team's drive for them. Going forward we'll use this functionality to implement more behaviour to make teams function more like shared user accounts.
* The "pad creation screen" which is displayed to registered users when they first create a pad will no longer remember the settings used when they last created a pad. While this behaviour was intended to streamline the process of creating documents, in practice it led to some user's documents getting deleted because they didn't realize they were set to automatically expire. If you prefer not to use the defaults (owned, non-expiring) then you'll have to click a few more times to create a document, but we think that's a worthwhile tradeoff to avoid data loss.

Bug fixes:

* Hitting _ctrl-A_ in the drive used to select lots of the page's elements which had no business being selected. Now it will select the contents of the directory currently being displayed.
* Due to some complications in OnlyOffice (which we use for spreadsheets) remote updates made to a sheet were not displayed for users who had opened the document in "view mode". We still don't have the means to apply these remote changes in real-time, but we now prompt users to click a button to refresh the editor (not the full page) to display the latest document state.
* A recent update set the text color of the team chat input to 'white', matching the input's background and making the text unreadable. We patched it to make it black text on a white background.
* We're slowly working on improving keyboard shortcuts for a variety of actions. This time around we fixed a bug that prevented "ESC" from closing an open "tag prompt" interface.
* We noticed that the zip file constructed in the browser when you downloaded a subtree of a shared folder in your drive contained the correct directory structure but did not contain the files that were supposed to be there. This has been fixed.
* Finally, we've tweaked our styles to use more specific CSS selectors to prevent a variety of styles from being accidentally applied to the wrong elements. This should make the platform a little easier to maintain and help us improve the visual consistency of a variety of elements on different pages.

To update from 3.19.0 to 3.19.1:

1. Stop your server
2. Get the latest code with `git checkout 3.19.1`
3. Restart your server

If you're updating from anything other than 3.19.0 you may need other clientside dependencies (available with `bower update` and `npm i`).

# Thylacine release (3.19.0)

## Goals

The intent of this release was to catch up on our backlog of bug fixes and minor usability improvements.

## Update notes

This release features an update to our clientside dependencies.

To update to 3.19.0 from 3.18.1:

1. Stop your server
2. Get the latest code with git
3. Get the latest clientside dependencies with `bower update`
4. Restart your server

## Features

* The most notable change in this release is that the use of "safe links" (introduced in our 3.11.0 release) has been made the new default for documents. This means that when you open a document that is stored in your drive your browser's address bar will not contain the encryption keys for the document, only an identifier used to look up those encryption keys which are stored in your drive. This makes it less likely that you'll leak access to your documents during video meetings, when sharing screenshots, or when using shared computers that store the history of pages you've viewed.
  * To share access to documents with links, you'll need to use the _share menu_ which has recently been made more prominent in the platform's toolbars
  * This setting is configurable, so you can still choose to disable the use of safe links via your settings page.
* We've updated the layout of the "user admin menu" which can be found in the top-right corner by clicking your avatar. It features an "About CryptPad" menu which displays the version of the instance you're using as well as some resources which are otherwise only available via the footer of static pages.
* We often receive support tickets in languages that we don't speak, which forces us to use translation services in order to answer questions. To address this issue, we've made it possible for admins to display a notice indicating which languages they speak. An example configuration is provided in `customize.dist/application_config.js`.
* We've integrated two PRs:
  1. [Only list premium features when subscriptions are enabled](https://github.com/cryptpad/cryptpad/pull/538).
  2. [Add privacy policy option](https://github.com/cryptpad/cryptpad/pull/537).
* We found it cumbersome to add new cards to the top of our Kanban columns, since we had to create a new card at the bottom and then drag it to the top. In response, we've broken up the rather large "new card" button into two buttons, one which adds a card at the top, and another which adds a new card at the bottom.
* We've made it easier to use tags for files in the drive:
  1. You can now select multiple files and apply a set of tags to all of them.
  2. Hitting "enter" in an empty tag prompt field will submit the current list of tags.
* We've also made a few tweaks to the kanban layout:
  1. The "trash bar" only appears while you are actively dragging a card.
  2. The "tag list" now takes up more of the available width, while the button to clear the currently applied tag filter has been moved to the left, replacing the "filter by tag" hint text.
* We've received requests to enable translations for a number of languages over the last few months. The following languages are enabled on [our weblate instance](https://weblate.cryptpad.fr/projects/cryptpad/app/), but have yet to be translated.
  * Arabic
  * Hindi
  * Telugu
  * Turkish
* Unregistered users were able to open up the "filepicker modal" in spreadsheets. It was already possible to embed an image which they'd already stored in their drive, but it was not clear why they were not able to upload a new image. We now display a disabled upload button with a tooltip to log in or register in order to upload images.
* Finally, we've updated the styles in our presentation editor to better match our recent toolbar redesign and the mermaidjs integration.

## Bug fixes

* We now preserve formatting in multi-line messages in team invitations.
* The slide editor exhibited some strange behaviour where the page would reload the first time you entered "present mode" after creating the document. We've also fixed some issues with printing.
* We now prevent the local resizing of images in the rich text editor while it is locked due to disconnection or the lack of edit rights.
* We've updated our marked.js dependency to the latest version in order to correct some minor rendering bugs.
* Unregistered users are now redirected to the login page when they visit the support page.
* We've removed the unsupported "rename" entry from the right-click menu in unregistered users drives.
* After a deep investigation we found and fixed the cause of a bug in which user accounts spontaneously removed themselves from teams. A flaw in the serverside cache caused clients to load an incomplete account of the team's membership which caused the team to appear to have been deleted. Unfortunately, the client responded by removing the corrupt team credentials from their account. Our fix will prevent future corruptions, but does not restore unintentionally removed teams.
* Lastly, we've added a "Hind" font to the spreadsheet editor which introduces basic support for Devanagari characters.

# Smilodon's revenge (3.18.1)

Our next major release (3.19.0) is still a few weeks away.
In the meantime we've been working on some minor improvements and bug fixes that we wanted to ship as soon as possible.

New features:

* Rich text pads can now be exported to .doc format. A few features don't translate well to the exported format (some fonts, embedded videos and pdfs), but for the most part your documents should work
* Items in the "Recent pads" section of your drive can now be dragged to other folders via the filesystem tree UI
* The user admin menu (found in the top-right corner) now includes an option to display the current version of the CryptPad instance you're using. We plan to add some more information here in the near future.
* The kanban app now offers better support for editing markdown within cards with autocompleted parentheses. We've also added support for embedded media, allowing users to drag images and other content into the card content editor.

Bug fixes:

* Account deletion via the settings page works once again
* Some small layout and usability issues in the drive have been addressed
  * dropdown menus flow in the appropriate direction when space is limited
  * changing the sorting criteria no longer causes the browser to jump to the top of the page
* Hitting enter or escape in the kanban's card tag field while it's empty now closes the modal (instead of doing nothing)
* Language preferences (as configured via the settings page) are applied when you log in (previously it would reset to English or your browser's settings)
* A performance issue triggered by hiding a closed support ticket from the admin panel has been optimized. Previously it would lock up the shared worker in cases when there were many unclosed tickets.
* We've updated the parameters of the XLSX import/export functionality to prevent an "out of memory" error that primarily affected large spreadsheets. It should now allocate more memory instead of failing silently.
* Finally, members of a team can now directly share or transfer ownership of a document owned by their team to their own account without having to go through the additional steps of offering it to themself and accepting the offer.

Updating from 3.18.0 to 3.18.1 is pretty standard:

1. Stop your server
2. Get the latest code with git
3. Restart your server

# Smilodon release (3.18.0)

## Goals

This is a big one! A lot of people are going to love it and a few are probably going to hate it.

This release introduces some major changes to our apps' appearances with the intent of making it easier to use, easier for us to support, and easier to maintain.

## Update notes

If you're using a mostly standard CryptPad installation this should be a rather easy update.

If you've customized your styles, particularly for the purpose of overriding the default colors, you may encounter some problems. **We recommend that you test this version in a staging environment** before deploying to ensure that it is compatible with your modifications.

Otherwise, update to 3.18.0 from 3.17.0 in the following manner:

1. stop your server
2. fetch the latest code with git
3. bower update
4. relaunch your server

## Features

* Obviously, there's the major redesign mentioned in our _goals_.
  * You'll immediately notice that we've changed a lot of our color scheme. Apps still have colors as accents to help differentiate them, but the colors are more subtle. The move towards a more monochrome design makes it easier for us to ensure that the UI has a sufficient amount of contrast (less eye strain for everybody!) and simplifies design issues by settling on a simpler color palette.
  * You'll probably also notice that a lot of the toolbar features have been rearranged. The chat and userlist are now at the right, while we've adopted the "File menu" layout to which users of office productivity are accustomed. A lot of the common features that were buried in our `...` menu are now under "File" ("new", "import/export", "history", "move to trash", etc.). Some apps feature their special menus ("Insert", "Tools", "Theme") depending on whether they support certain features. In general we'll use text in addition to icons in the toolbar except on very small screens where the use of space is constrained.
  * Finally, you'll find some of CryptPad's most important functionality right in the center of the toolbar. The "Share" and "Access" buttons already existed, but lots of people had trouble finding them and missed out on our fine-grained access controls by always sharing the URL directly from their browser's address bar. In case you hadn't seen it, the "Share menu" gives you the ability to generate links that let others view, edit, or delete the document in question. The "Access menu" provides an overview of the document's access settings, and lets its owner(s) add passwords, enable or disable other viewers' ability to request edit rights, restrict access to a dynamic list of users or teams, and modify ownership of the document. It will soon be even more important to know about these menus, because **we plan to enable "Safe links" as the default behaviour in our next release**. "Safe links" are URLs that contain only a document's id instead of its cryptographic secrets, making it less likely that you'll accidentally leak the ability to read your documents during screenshots or when copy-pasting URLs.
* The toolbar redesign has also affected the drive interface, but it's special enough that it deserves a separate mention:
  * You can now collapse the sidebar which contains the search button, recent pads, filesystem tree, templates, trash, and account storage quota meter. This should make navigation of the drive on mobile devices much simpler.
  * The actual "search" interface is no longer inside the sidebar. Instead, clicking search will bring you to an interface which uses the full size available to display the search bar and its results.
* By the time the toolbar was mostly redesigned we realized that our mockups hadn't included a link to the "todo" app. In fact, we'd been meaning to deprecate it in favour of Kanbans for some time, but we hadn't gotten around to it. So, now there's a migration that will be run automatically when you access your account for the first time after this release. Your todo-list will be transformed into a Kanban located in the root of your drive.
* On that note, this release also makes it much easier to drag and drop kanban cards within and between full columns thanks to an improved scrolling behaviour while you are holding a card.

## Bug fixes

* While implementing the todo-list migration we noticed that user accounts were running migrations without updating their version afterward. This resulted in redundant migrations being run at login time, so now that the version has been updated you might notice that login is marginally faster.
* We also fixed a regression in the "Print" functionality of the rich text editor, so you should be able to print correctly-formatted rich text documents once more.
* Lastly, there were some rather annoying issues with spreadsheets throughout this release that resulted in some users not being able to load their sheets or in their sheets being rendered or encoded incorrectly. We spent a lot of time solving these issues, and believe spreadsheets to be stable once more.

# RedGazelle's revenge release (3.17.1)

In recent months a growing amount of our time has been going towards answering support tickets, emails, and GitHub issues. This has made it a little more difficult to also maintain a bi-weekly release schedule, since there's some overhead involved in deploying our latest code and producing release notes.

To ease our workload, we've decided to switch to producing a full release every three weeks, with an optional patch release at some point in the middle. Patch releases may fix major issues that can't wait three weeks or may simply consist of a few minor fixes that are trivial to deploy.

This release fixes a few spreadsheet issues and introduces a more responsive layout for user drives in list mode.

Updating to 3.17.1 from 3.17.0 is pretty standard:

1. Stop your server
2. Get the latest code with git
3. Restart your server

# RedGazelle release (3.17.0)

## Goals

Our goal for this release was to introduce a first version of comments and mentions in our rich text editor as a part of a second R&D project funded by [NLnet](https://nlnet.nl/). We also received the results of an "accessibility audit" that was conducted as a part of our first NLnet PET project and so we've begun to integrate the auditor's feedback into the platform.

Otherwise we've continued with our major goal of continuing to support a growing number of users on our instance via server improvements (without introducing any regressions).

## Update notes

The most drastic change in this release is that we've removed all docker-related files from the platform's repository. These files were all added via community contributions. Having them in the main repo gave the impression that we support installation via docker (which we do not).

Docker-related files can now be found in the community-support [cryptpad-docker](https://github.com/cryptpad/cryptpad-docker/) repository.
If you have an existing instance that you've installed using docker and you'd like to update, you may review the [migration guide](https://github.com/cryptpad/cryptpad-docker/blob/master/MIGRATION.md). If you encounter any problems in the process we advise that you create an issue in the repository's issue-tracker.

Once again, this repository is **community-maintained**. If you are using this repository then _you are a part of the community_! Bug reports are useful, but fixes are even better!

Otherwise, this is a fairly standard release. We've updated two of our client-side dependencies:

1. ChainPad features a memory management optimization which is particularly relevant to editing very large documents or loading a drive with a large number of files. In one test we were able to reduce memory consumption in Chrome from 1.7GB to 20MB.
2. CKEditor (the third-party library we use for our rich-text editor) has been updated so that we could make use of some more recent APIs for the _comments_ feature.

To update from **3.16.0** to **3.17.0**:

1. Stop your server
2. Fetch the latest source with git
3. Install the latest client-side dependencies with `bower update`
4. Restart your server

## Features

* As noted above, this release introduces a first version of [comments at the right of the screen](https://github.com/cryptpad/cryptpad/issues/143) in our rich text editor. We're aware of a few usability issues under heavy concurrent usage, and we have some more improvements planned, but we figured that these issues were minor enough that people would be happy to use them in the meantime. The comments system integrates with the rest of our social functionality, so you'll have the ability to mention other users with the `@` symbol when typing within a comment.
* We've made some minor changes to the server's logging system to suppress some uninformative log statements and to include some useful information in logs to improve our ability to debug some serverside performance issues. This probably won't affect you directly, but indirectly you'll benefit from some bug fixes and performance tweaks as we get a better understanding of what the server does at runtime.
* We've received an _enormous_ amount of support tickets on CryptPad.fr (enough that if we answered them all we'd have very little time left for development). In response, we've updated the support ticket inbox available to administrators to highlight unanswered messages from non-paying users in yellow while support tickets from _premium users_ are highlighted in red. Administrators on other instances will notice that users of their instance with quotas increased via the server's `customLimits` config block will be counted as _premium_ as well.
* Finally, we've continued to receive translations in a number of languages via our [Weblate instance](https://weblate.cryptpad.fr/projects/cryptpad/app/).

## Bug fixes

* We've fixed a minor bug in our code editor in which hiding _author colors_ while they were still enabled for the document caused a tooltip containing `undefined` to be displayed when hovering over the text.
* A race condition in our server which was introduced when we started validating cryptographic signatures in child processes made it such that incoming messages could be written to the database in a different order than they were received. We implemented a per-channel queue which should now guarantee their ordering.
* It used to be that an error in the process of creating a thumbnail for an encrypted file upload would prevent the file upload from completing (and prevent future uploads in that session). We've added some guards to catch these errors and handle them appropriately, closing [#540](https://github.com/cryptpad/cryptpad/issues/540).
* CryptPad builds some CSS on the client because the source files (written in LESS) are smaller than the produced CSS. This results in faster load times for users with slow network connections. We identified and fixed bug in the loader which caused some files to be included in the compiled output multiple times, resulting in faster load times.
* We addressed a minor bug in the drive's item sorting logic which was triggered when displaying inverse sortings.
* Our last release introduced a set of custom styles for the mermaidjs integration in our code editor and featured one style which was not applied consistently across the wide variety of elements that could appear in mermaid graphs. As such, we've reverted the style (a color change in mermaid `graph` charts).
* In the process of implementing comments in our rich text editor we realized that there were some bugs in our cursor recovery code (used to maintain your cursor position when multiple people are typing in the same document). We made some small patches to address a few very specific edge cases, but it's possible the improvements will have a broader effect with cursors in other situations.
* We caught (and fixed) a few regressions in the _access_ and _properties_ modals that were introduced in the previous release.
* It came to our attention that the script `cryptpad/scripts/evict-inactive.js` was removing inactive blobs after a shorter amount of time than intended. After investigating we found that it was using `retentionTime` instead of `inactiveTime` (both of which are from the server's config file. As such, some files were being archived after 15 days of inactivity instead of 90 (in cases where the files were not stored in anyone's drive). This script must be run manually (or periodically via a `cron`), so unless you've configured your instance to do so this will not have affected you.

# Quagga release (3.16.0)

## Goals

We've continued to keep a close eye on server performance since our last release while making minimal changes. Our goal for this release has been to improve server scalability further while also addressing user needs with updates to our client code.

We were pleasantly surprised to receive a pull request implementing a basic version of [author colors](https://github.com/cryptpad/cryptpad/issues/41) in our code editor. Since it was nearly ready to go we set some time aside to polish it up a little bit to include it in this release.

## Update notes

We've updated the example nginx config in order to include an `Access-Control-Allow-Origin` header that was not included. We've also added a new configuration point in response to [this issue](https://github.com/cryptpad/cryptpad/issues/529) about the server's child processes using too many threads. Administrators may not set a maximum number of child processes via `config.js` using `maxWorkers: <number of child processes>`. We recommend using one less than the number of available cores, though one worker should be sufficient as long as your server is not under heavy load.

As usual, updating from the previous release can be accomplished by:

1. stopping your server
2. pulling the latest code with git
3. installing clientside dependencies with `bower update`
4. installing serverside dependencies with `npm i`
5. restarting your server

## Features

* As mentioned above, we've built upon a very helpful [PR](https://github.com/cryptpad/cryptpad/pull/522) from members of the Piratenpartei (German Pirate Party) to introduce author colors in our code editor. It's still experimental, but registered users can enable it on pads that they own via the "Author colors" entry in the `...` menu found beneath their user admin menu.
* Serverside performance optimizations
  * Automatically expiring pads work by creating a task to be run at the target date. This process involves a little bit of hashing, so we've changed it to be run in the worker.
  * The act of deleting a file from the server actually moves it to an archive which is not publicly accessible. These archived files are regularly cleaned up if you run `scripts/evict-inactive.js`. Unfortunately, moving files is more expensive than deletion, so we've noticed spikes in CPU when users delete many files at once (like when emptying the trash from their drive). To avoid such spikes while the server is already under load we've implemented per-user queues for deletion.
  * We've also noticed that when we restart our server while it is under heavy load some queries can time out due to many users requesting history at once. We've implemented another queue to delegate tasks to workers in the order that they are received. We need to observe how this system performs in practice, so there might be small tweaks as we get more data.
  * As noted above, we've made the number of workers configurable. At the same time we unified two types of workers into one, cutting the number of workers in half.
* We've added a new admin RPC call to request some information about the server's memory usage to help us debug what seems to be a small memory leak.
* Most of our editors were previously loaded with two more iframes on the page in addition to our main sandboxed iframe. These separate frames ensure that encryption keys are not exposed to the same iframe responsible for displaying the rest of CryptPad's UI. One was responsible for loading the "filepicker" for inserting media into your documents, the other was responsible for handling encryption keys for the share modal. Since we wanted to add two new functions using iframes in the same manner we took the opportunity to come up with a generic solution using only one iframe for these separate modals, since they all have the same level of privilege to the sensitive data we're trying to protect.
* Our mermaidjs integration has been customized to be a little easier on the eyes. We focused in particular on GANTT charts, though other charts should be more appealing as well, especially in the new "lightbox" UI introduced in our last release.
* We now prompt unregistered users to register or log in when they use the spreadsheet editor. For context, unregistered users don't benefit from all of the same features as registered users, and this makes a few performance optimizations impossible.
* Finally, we've continued to receive translations from contributors in Catalan, German, and Dutch.

## Bug fixes

* We noticed that under certain conditions clients were sending metadata queries to the server for documents that don't have metadata. We've implemented some stricter checks to prevent these useless queries.
* We've implemented a temporary fix for our rich text editor to solve [this issue](https://github.com/cryptpad/cryptpad/issues/526) related to conflicting font-size and header styles.
* We also accepted [this PR](https://github.com/cryptpad/cryptpad/pull/525) to tolerate server configurations specifying a `defaultStorageLimit` of 0.
* Finally, we noticed that embedded media occasionally stopped responding correctly to right-click events due to a problem with our in-memory cache. It has since been fixed.

# PigFootedBandicoot release (3.15.0)

## Goals

Our plan for this release was to allow our server's code to stabilize after a prologued period of major changes. The massive surge of new users on cryptpad.fr forced us to change our plans and focus instead on increasing performance and scalability of our serverside code and its supporting infrastructure. Most of this release's changes have been thoroughly tested as they've been deployed to our instance on an ongoing basis, however, we're still looking forward to stabilizing as planned.

We also ended up making significant improvements to our clientside code, since the increased load on the server seemed to exacerbate a few race conditions which occurred less frequently under the previous circumstances.

## Update notes

Updating from version 3.14.0 should follow the usual process:

1. stop your server
2. fetch the latest code with git
3. install clientside dependencies with `bower update`
4. install serverside dependencies with `npm i`
5. start your server

You may notice that the server now launches a number of child processes named `crypto-worker.js` and `db-worker.js`. These worker processes make use of however many cores your server has available to perform more CPU-intensive tasks in parallel.

## Features

* As noted above, the server uses an multi-process architecture and parallelizes more routines. This improvement will be the most noticeable when the server is run on ARM processors which validate cryptographic signatures particularly slowly.
* The admin panel available to instance administrators now displays a list of "Open files". We added this to help us diagnose a "file descriptor leak" which will be described in the _Bug fixes_ section.
* We received a large number of contributions from translators via our [weblate instance](https://weblate.cryptpad.fr/projects/cryptpad/app/). Most notably, Italian is the fourth language to be fully translated with Finnish and Spanish seemingly in line to take the fifth and sixth spots.
* We've addressed some usability issues in our whiteboard app in response to increased interest. Its canvas now automatically resizes according to the size of your screen and the content you've drawn. Unfortunately, we noticed that the "embed image" functionality was imposing some additional strain on our server, so we decided to implement an admittedly arbitrary limit of 1MB on the size of images embedded in whiteboards. We'll consider removing this restriction when we have time to design a more efficient embedding system.
* We've removed the per-user setting which previously allowed registered users to skip the "pad creation screen" which is displayed before creating a document. This setting has not been the default for some time and was not actively tested, so this "feature" is our way of guaranteeing no future regressions in its behaviour.
* As a part of our effort to improve the server's scalability we evaluated which clientside requests could be sent less often. One such request came from the "usage bar" found in users' drives, teams, and settings pages. Previously it would update every 30 seconds no matter what. Now it only updates if that tab is focused.
* Most actions that an administrator can take with regard to a user's account require the "public key" which is used to identify their account. This key is available on the user's settings page, but many users share their profile URL instead. We've added a button to profile pages which copies the user's public key to the clipboard, so now either page will be sufficient.
* We've updated our [mermaidjs](https://mermaid-js.github.io/mermaid/#/) dependency. For those that don't know, Mermaid is a powerful markup syntax for producing a variety of charts. It's integrated into our code editor. This updated version supports GANTT chart tasks with multiple dependencies, pie charts, and a variety of other useful formats.
* We found that in practice our mermaid charts and other embedded media were sufficiently detailed that they became difficult to read on some screens. In response we've added the ability to view these elements in a "lightbox UI" which is nearly full-screen. This interface is can be used to view media contained in the "preview pane" of the code editor as well as within user and team drives, as well as a few other places where Markdown is used.

## Bug fixes

This release contains fixes for a lot of bugs. We'll provide a brief overview, but in the interest of putting more time towards development I'll just put my strong recommendation that you update.

* The server process didn't always close file descriptors that it opened, resulting in an EMFILE error when the system ran out of available file descriptors. Now it closes them.
* The server also kept an unbounded amount of data in an in-memory cache under certain circumstances. Now it doesn't.
* A simple check to ignore the `premiumUploadSize` config value if it was less than `maxUploadSize` incorrectly compared against `defaultStorageLimit`. Premium upload sizes were disabled on our instance when we increased the default storage limit to 1GB. It's fixed now.
* We accepted a [PR](https://github.com/cryptpad/cryptpad/pull/513) to prevent a typeError when logging to disk was entirely disabled.
* We identified and fixed the cause of [This issue](https://github.com/cryptpad/cryptpad/issues/518) which caused spreadsheets not to load.
* Emojis at the start of users display names were not displayed correctly in the Kanban's "cursor"
* We (once again) believe we've fixed the [duplicated text bug](https://github.com/cryptpad/cryptpad/issues/352). Time will tell.
* Our existing Mermaidjs integration supported the special syntax to make elements clickable, but the resulting links don't work within CryptPad. We now remove them.
* Rather than having messages time out if they are not received by the server within a certain timeframe we now wait until the client reconnects, at which point we can check whether those messages exist in the document's history. On a related note we now detect when the realtime system is in a bad state and recreate it.
* Finally, we've fixed a variety of errors in spreadsheets.

# OrienteCaveRat release (3.14.0)

## Goals

We planned a one-week release cycle in order to finish up some major features that were already in development during our last release.

In the meantime, the reaction to the COVID-19 pandemic has resulted in a greatly increased load on our servers, so we've begun to focus on improving stability to ensure that we are able to keep up with demand.

## Update notes

We had some trouble during the week of March 9th, 2020, as the CryptPad.fr server started throwing EMFILE errors. This means that it was trying to open new files (for reading or writing) but there were too many files open already. We've added some new code to help debug the issue, but there is not yet a fix in place. The maximum number of open files on our host OS had been increased by several orders of magnitude (several years ago) but we're now aware that the systemd service file that launches the API server does not respect this global limit. As such, we've updated the example service file to indicate how you can update this limit yourself. For an example of how to update this limit at the OS level, see this page: https://docs.oracle.com/cd/E19623-01/820-6168/file-descriptor-requirements.html

Otherwise, updating from 3.13.0 to 3.14.0 is as usual:

1. stop your server
2. fetch the latest source
3. `npm i`
4. `bower update`
5. restart your server

## Features

We're very happy to announce a major update to our kanban application! We've made a lot of changes, but the most notables ones are:

* the ability to add markdown content to your cards and edit it collaboratively in real-time
* tags on cards and the ability to filter cards by tags at the top of the application
* indicators to show if a card is being modified by another user while you are editing it
* the ability to toggle between an 'overview mode' which hides everything but your cards titles and a full mode which shows everything
* vertical scrolling for very tall columns, and horizontal scrolling for columns that don't fit on your screen (intead of reflowing to the next line)
* a smaller palette of pre-chosen colors for cards and boards instead of a color-picker, to make it easier to choose matching colors for tasks
* the ability to drag cards and boards to the trash instead of having to click a small X and confirm their deletion

We've also improved message throughput for our server by splitting cryptographic signature validation into separate processes. On a quad core server this means you should be able to handle (roughly) four times the messages.

## Bug fixes

* Drive:
  * a regression in the drive for anonymous users made it impossible to delete contained pads directly from the drive (though deletion from the pad itself was working). It's now back to normal.
  * we've updated the translation key referenced in [issue 482](https://github.com/cryptpad/cryptpad/issues/482) to clarify what qualifies a pad as "recently modified".
* We noticed (and fixed) another regression that disabled our recently introduced "history trim" functionality.
* We've identified and addressed a few client networking errors that were causing clients to disconnect (and to get stuck in a reconnecting state), but we're still actively looking for more.
* Server:
  * we've added some extra checks to try to identify where our file descriptor leak is coming from, we'll release fixes as they become available.
  * we've caught a typeError that only ever happened while the server was overwhelmed with EMFILE errors.
  * [this PR](https://github.com/cryptpad/cryptpad/pull/503) fixed an incorrect conditional expression at launch-time.
* We fixed a bug in our spreadsheet editor that was causing sheets not to load. Sheets affected by this issue should be repaired. We ask that you submit a report ticket on your instance if you encounter a sheet that wasn't fixed.

# NorthernWhiteRhino release (3.13.0)

## Goals

This release cycle we prioritized the completion of "access lists", a major feature that we're excited to introduce.

## Update notes

Nearly every week (sometimes more than once) we end up taking time away from development to help administrators to configure their CryptPad instances. We're happy to see more instances popping up, but ideally we'd like to spend more of our time working on new features. With this in mind we devoted some time to simplify instance configuration and to clarify some points where people commonly have difficulty.

If you review `cryptpad/config.example.js` you'll notice it is significantly smaller than it was last release.
Old configuration files should be backwards compatible (if you copied `config.example.js` to `config.js` in order to customize it).
The example has been reorganized so that the most important parts (which people seemed to miss most of the time) are at the top.
Most of the fields which were defined within the config file now have defaults defined within the server itself.
If you supply these values they will override the default, but for the most part they can be removed.

We advise that you read the comments at the top of the example, in particular the points related to `httpUnsafeOrigin` and `httpSafeOrigin` which are used to protect users' cryptographic keys in the event of a cross-site scripting (XSS) vulnerability.
If these values are not correctly set then your users will not benefit from all the security measures we've spent lots of time implemented.

A lot of the fields that were present as modifiable defaults have been removed or commented out in the example config.
If you supply them then they will override the default behaviour, however, you probably won't need to and doing so might break important functionality.
Content-Security Policy (CSP) definitions should be safe to remove, as should `httpAddress`, `httpPort`, and `httpSafePort` (unless you need to run the nodejs API server on an address other than `localhost` or port 3000.

Up until now it's been possible for administrators to allow users to pay for accounts (on their server) via https://accounts.cryptpad.fr.
Our intent was to securely handle payment and then split the proceeds between ourselves and the instance's administrator.
In practice this just created extra work for us because we ended up having to contact admins, all of whom have opted to treat the subscription as a donation to support development.
As such we have disabled the ability of users to pay for premium subscriptions (on https://accounts.cryptpad.fr) for any instance other than our own.

Servers with premium subscriptions enabled were configured to check whether anyone had subscribed to a premium account by querying our accounts server on a daily basis.
We've left this daily check in place despite premium subscriptions being disabled because it informs us how many third-party instances exist and what versions they are running.
We don't sell or share this information with anyone, but it is useful to us because it informs us what older data structures we have to continue to support.
For instance, we retain code for migrating documents to newer data formats as long as we know that there are still instances that have not run those migrations.
We also cite the number of third-party instances when applying for grants as an indicator of the value of funding our project.
In any case, you can disable this daily check-in by setting `blockDailyCheck` to `true` in `config/config.js`.

Finally, we've implemented the ability to set a higher limit on the maximum size of uploaded files for premium users (paying users on CryptPad.fr and users with entries in `customLimits` on other instances).
Set this limit as a number (of bytes) with `premiumUploadSize` in your config file.

## Features

* It is often difficult to fix problems reported as GitHub issues because we don't have enough information. The platform's repository now includes an _issue template_ which includes a list of details that will probably be relevant to fixing bugs. Please read the list carefully, as we'll probably just close issues if information that we need was not included.
* We've made it easy to terminate all open sessions for your account. If you're logged in, you'll now see a _log out everywhere_ button in the _user admin menu_ (in the top-right corner of the screen).
  * You may still terminate only _remote sessions_ while leaving your local session intact via the pre-existing button on the settings page's _confidentiality_ tab.
* You may have noticed that it takes progressively longer to load your account as you add more files to your drive, shared folders, and teams. This is because an integrity check is run on all your files when you first launch a CryptPad session. We optimized some parts of this check to speed it up. We plan to continue searching for similar processes that we can optimize in order to decrease loading time and run-time efficiency.
* Lastly, this release introduces **access lists**, which you can use to limit who can view your documents _even if they have the keys required to decrypt them_. You can do so by using the _Access_ modal for any given document, available in the `...` dropdown menu in each app's toolbar or when right-clicking in the drive.
  * Enabling access restriction for a document will disallow anyone except its owners or allowed users from opening it. Anyone else who is currently editing or viewing the document will be disconnected from the session.

## Bug fixes

* A member of _C3Wien_ reported some strange behaviour triggered by customizing some of Firefox's anti-tracking features. The settings incorrectly identified our cross-domain sandboxing system as a tracker and interfered with its normal functionality. As a result, the user was treated as though they were not logged in, even though pads from their account's drive were displayed within the "anonymous drive" that unregistered users normally see.
  * This was simple to fix, requiring only that we adjust our method of checking whether a user is logged in.
  * If you ever notice odd behaviour we do recommend that you review any customizations you've made to your browser, as we only test CryptPad under default conditions unless prompted to investigate an issue.
* Users that take advantage of the Mermaid renderer in our markdown editor's preview pane may have noticed that the preview's scroll position was lost whenever mermaid charts were modified. We've updated our renderer such that it preserves scroll position when redrawing elements, making it easier to see the effects of your changes when editing large charts.

# Megaloceros release (3.12.0)

## Goals

As of our last release our 'history trim' functionality was almost ready to go. We took this release period to do some extensive testing and to prepare the 'allow list' functionality which will be included in our next release.

In the meantime, we also aimed to improve performance, add a few small but nice features, and fix a number of bugs.

## Update notes

This release includes updates to:

1. the server and its dependencies
2. the example nginx configuration which we recommend for production installations
3. the client code and its dependencies

Our ability to debug CryptPad's usage of shared workers (on the client) has been complicated by the fact that Firefox's shared worker debugging panel was not working for our instance. We finally traced the problem back to a Content-Security Policy setting in our configuration file. The issue can be addressed by adding a `resource:` entry in the `connect-src` header. We've updated the example nginx config to reflect this. You can deploy this version of CryptPad without this modification, but without it our ability to debug and fix issues related to shared worker will be extremely limited.

Otherwise, updating from CryptPad v3.11.0 is pretty much the same as normal:

1. stop your server
2. pull the latest code via git
3. `npm i` to get the latest server dependencies
4. `bower update` to get the latest client dependencies
5. restart your server

## Features

* The CryptPad server stores documents as a series of encrypted changes to a blank document. We have mechanisms in place that make it so clients only need the most recent changes to view the document, but the storage requirements on the server would only ever grow unless you deleted the entire document. As of this release, owners of document have the option to remove that unnecessary history. To do so: right-click a pad in a drive or shared folder and choose the properties option in the menu. The bottom of the properties popup will display the document's size. If there is any history that is eligible for removal, a button will be displayed to remove it.
  * This option is only available for the pad's owners. If it has no owners then it will not be possible to remove its history.
  * It is not yet possible to trim the history of spreadsheets, as they are based on a different system than the rest of our documents and it will take some additional work to add this functionality.
* We've also added the ability to easily make copies of documents from your drive. Right-click on documents and select "make a copy" from the menu.
  * This feature doesn't work for files. Files can't be modified anyway, so there's little value in making copies.
  * We haven't added the ability to make a copy of a spreadsheet yet for the same reasons as above.
* We've improved the way our markdown renderer handles links to better support a variety of types of URLs:
  * anchors, like `[bug fixes](#bug-fixes)`
  * relative paths, like `[cryptpad home page](/index.html)` or `[a rich text pad](/pad/#/pad/view/12151241241254123412451231231221)`
  * absolute URLs without the protocol, like `[//github.com/cryptpad/cryptpad)
* We've optimized a background process that iterates over a part of the database when you first launch the CryptPad server. It now uses less memory and should incur less load on the CPU when restarting the server. This should allow the server to spend its resources handling clients that are trying to reconnect.
* We've also optimized some client-side code to prioritize loading your drive instead of some other non-essential resources used for notifications. Pages should load faster. We're working on some related improvements to address page load time which we'll introduce on an ongoing basis.
* As noted above, we're finally able to debug shared workers in Firefox. We're investigating a few issues that were blocked by this limitation, and we hope to include a number of bug fixes in upcoming releases.
* We've continued some ongoing improvements to the instance admin panel and introduced the ability to link directly to a support ticket. The link will only be useful to users who would already be able to open the admin panel.
* The code responsible for fetching and scanning the older history of a document has also been optimized to avoid handling messages for channels multiple times.
* Finally, we've received contributions from our German and Italian translators via our weblate instance.
  * We're always looking for more help with localization. You can review the status of our translations and contribute to them [here](https://weblate.cryptpad.fr/projects/cryptpad/app/).

## Bug fixes

* After a lot of digging we believe we've identified and fixed a case of automatic text duplication in our rich text editor. We plan to wait a little longer and see if [reports of the incorrect behaviour](https://github.com/cryptpad/cryptpad/issues/352) really do stop, but we're optimistic that this problem has been solved.
* [Another GitHub issue](https://github.com/cryptpad/cryptpad/issues/497) related to upgrading access for team members has been fixed. If you continue to have issues with permissions for team members, we recommend haging the team owner demote the affected users to viewers before promoting them to the desired access level.
* We've fixed a number of small issues in our server:
  * The server did not correctly respond to unsupported commands for its SET_METADATA RPC. Instead of responding with an error it ignored the message. In practice this should not have affected any users, since our client only uses supported commands.
  * The server used to log for every entry in a document's metadata log that contained an unsupported command. As we develop we occasionally have to such logs with older versions of the code that don't support every command. To avoid filling the logs with errors, we now ignore any errors of a given type beyond the first one encountered for a given document.
* We've fixed an issue with read-only spreadsheets that was introduced in our previous release. An overlay intended to prevent users from interacting with the spreadsheet while disconnected was incorrectly applied to spreadsheets in read-only mode, preventing users from copying their data.
* Clients send "pin commands" to the server to instruct it to count a document against their quota and to preserve its data even if it's considered inactive. We realized that the client wasn't including todo-lists in its list of pads to pin and have updated the client to do so.

# LabradorDuck release (3.11.0)

## Goals

For this release we aimed to phase in two major features that we've been anticipating for a while: "history trim" and "safe links".

History trim will allow users to remove the old versions of their documents which continue to count against their storage quotas. It will be formally introduced in our next release, even though its server-side components are all ready. We had to reorganize and modify a lot of our server code, so we wanted to wait and make sure there were no regressions in our existing functionality before moving ahead.

We're introducing the concept of "safe links" in CryptPad. Users can continue to share links to documents which include the cryptographic secrets necessary to read or edit them, but whenever possible we will replace those secrets with a document id. This will make it less likely for encryption keys to be exposed to third parties through invasive browser extensions or passive behaviour like history synchronization across devices.

## Update notes

This release features a few changes to the server:

1. The "legal notice" feature which we included in the previous release turned out to be incorrect. We've since fixed it. We document this functionality [here](https://github.com/cryptpad/cryptpad/blob/e8b905282a2cde826ad9100dcad6b59a50c70e8b/www/common/application_config_internal.js#L35-L41), but you'll need to implement the recommended changes in `cryptpad/customize/application_config.js` for best effect.
2. We've dropped server-side support for the `retainData` attribute in `cryptpad/config/config.js`. Previously you could configure CryptPad to delete unpinned, inactive data immediately or to move it into an archive for a configurable retention period. We've removed the option to delete data outright, since it introduces additional complexity in the server which we don't regularly test. We also figure that administrators will appreciate this default in the event of a bug which incorrectly flags data as inactive.
3. We've fixed an incorrect line in [the example nginx configuration file](https://github.com/cryptpad/cryptpad/commit/1be01c07eee3431218d0b40a58164f60fec6df31). If you're using nginx as a reverse proxy for your CryptPad instance you should correct this line. It is used to set Content-Security Policy headers for the sandboxed-iframe which provides an additional layer of security for users in the event of a cross-site-scripting (XSS) vulnerability within CryptPad. If you find that your instance stops working after applying this change it is likely that you have not correctly configured your instance to use a secondary domain for its sandbox. See [this section of `cryptpad/config/config.example.js`](https://github.com/cryptpad/cryptpad/blob/c388641479128303363d8a4247f64230c08a7264/config/config.example.js#L94-L96) for more information.

Otherwise, deploying the new code should be fairly simple:

1. stop your server
2. fetch the latest code from the git repository
3. update your server dependencies with `npm install`
4. update your clientside dependencies with `bower update`
5. start your server

## Features

* We've slightly reorganized the _settings_ page to include a new "Confidentiality" section. It includes a checkbox to enable "safe links", which will remove the cryptographic secrets from your documents' URLs whenever possible. It is currently off by default but will most likely default to true in the near future. Otherwise, the settings page has an updated layout which is generally easier to read.
* We've remove the "Owned pads" category from the CryptDrive application. It was included to provide an overview of pads that you could delete when we first introduced that functionality, however, we've realized that it is generally not very useful.
* We implemented the ability to convert a regular folder in your drive into a _shared folder_ several months ago, but disabled it when we discovered that it had some bugs. We finally got around to fixing those bugs and so it is officially ready for public use.
* We've continued to make little changes to improve the discoverability of CryptPad's social features. Unregistered users that view another user's profile are now informed that they can send that profile's owner a contact request once they register.
* You may remember that CryptPad's contacts used to be called "friends". We've changed this terminology to reflect that you might work with people with whom you do not have a close personal relationship.
* We analyzed CryptPad for possible vectors for social abuse as a part of our _Teams_ project, sponsored by NLnet foundation. During this audit we identified that the main method for abuse was through the direct messaging/notifications system. We added the ability to mute users, but realized it could be difficult to find the profile page of the person you want to mute. As of this release, any notification triggered by a remote user's actions will include their avatar and a link to their profile. If you find any user's behaviour abusive or annoying you can go straight to their profile and mute them.
* We've made a small improvements to the admin panel's support ticket view. Tickets which have not received a response are now highlighted in red.
* The login/register pages had a minor bug where the loading screen was not correctly displayed the second time you tried to enter your password. This was because the key derivation function which unlocks the corresponding user credentials was keeping the CPU busy and preventing an animation from running. It has since been corrected.
* We've continued to make some small but important changes to various UI elements that are reused throughout the platform. The password field in the _pad properties dialog_ has been tweaked for better color contrast. Similarly, the small notice that pops up in the bottom right hand corner to prompt you to store a pad in your drive has been restyled. We've also implemented a second variation on this popup to display general information not directly related to the current pad. Both of these UI elements better match the general appearance of the rest of the platform and represent a continued effort to improve its visual consistency.
* The spreadsheet editor has received some attention in the last few weeks as well. It is now able to gracefully resume a session when you reconnect to the server after an interruption. Likewise, the locking system which prevents two users from editing a cell at the same time is now significantly faster, and completely disabled if you're editing alone. Now that it's possible for unregistered users to edit spreadsheets we've had to improve the color contrast for the toolbar message which prompts users to register in order to ensure that a spreadsheet isn't deleted due to inactivity.
* The "file upload status table" has received some attention as well, in response to [issue 496](https://github.com/cryptpad/cryptpad/issues/496). When you upload many files to CryptPad in a row you'll see them all displayed in a table which will include a scrollbar if necessary.

## Bug fixes

* [Issue 441](https://github.com/cryptpad/cryptpad/issues/441 "Other users writing in pad hiijacks chat window") has been fixed.
* We found a bug that affected encrypted files saved to your CryptDrive via the right-click menu. The files were saved in an incorrect format and were unusable. They should behave normally now.
* Finally, we identified a race condition whereby if two users sent each other contact requests at the same time the request might not be accepted correctly. This process should now be much more reliable.

# Kouprey release (3.10.0)

## Goals

For this release we aimed to finish the last major feature of our CryptPad Teams project as well as some long-awaited features that we've planned to demo at FOSDEM 2020.

## Update notes

The CryptPad repository's _docs_ directory now includes a _systemd service file_ which you can use to ensure that CryptPad stays up and running. We're working on some step-by-step documentation to describe how to make use of it, but for now you can probably find some instructions by searching the web.

We've also updated the provided example.nginx.conf to include a minor but important change to the CSP settings for our OnlyOffice spreadsheet integration.

Up until now we have not been deleting unowned encrypted files from our server. As of this release `cryptpad/scripts/evict-inactive.js` includes logic to identify inactive, unpinned files. Identified files are first moved to your instance's _archive_ directory for a configurable period, after which they are deleted. This script is not run automatically, so if you haven't configured a cron job to run periodically then inactive files will not be removed. We recommend running the script once per day at a time when you expect your server to be relatively idle, since it consumes a non-negligible amount of server resources.

Finally, in case you live in a political jurisdiction that requires web site administrators to display their legal information, we've made it easier to add a link to a custom page. See `cryptpad/www/common/application_config_internal.js` for details, particularly the comments above `config.imprint`.

To update from v3.9.0:

1. update the CSP settings in your reverse proxy's configuration file to match those in nginx.example.conf

* don't forget to reload your server to ensure that your changes are deployed

2. stop your API server
3. pull the latest server/client code with `git pull origin master`
4. install the latest clientside dependencies with `bower update`
5. relaunch your server

## Features

* Owned pads can now be shared in _self-destruct_ mode as an additional option in the _access rights_ section of the _share menu_.
  * to use self-destructing pads:
    1. select `View once and self-destruct`
    2. share the _self-destructing pad link_ directly with a contact or create and copy a link
    3. recipients who open the link will land on a warning page informing them about what is about to happen
    4. once they click through the link, they'll see the content and automatically delete it from the server
    5. opening the same link a second time will not yield any content
  * note that deletion affects the original document that you choose to share. It does not create a copy
* We no longer consider spreadsheets to be a BETA application!
  * we've been using them for some time and while there are still points to improve we consider them stable enough for regular use
  * this change in status is due to a few big updates:
    1. we've integrated a recent version of OnlyOffice in which a number of bugs were fixed
    2. we've enabled the use of spreadsheets for unregistered users, though registration is still free and will provide a better experience
    3. it's now possible to upload encrypted images into your spreadsheets, in case you're the type of person that puts images in spreadsheets
    4. you can also import and export spreadsheets between CryptPad's internal format and XLSX. This conversion is run entirely in your browser, so your documents stay private. Unfortunately it relies on some new features that are not available in all browsers. Chrome currently supports it, and we expect Firefox to enable support as of February 11th, 2020
* Finally, we've continued to receive contributions from our numerous translators (via https://weblate.cryptpad.fr) in the following languages (alphabetical order):
  * Catalan
  * Finnish
  * German
  * Italian
  * Spanish

## Bug fixes

* We found and fixed an incorrect usage of the pinned-data API in `scripts/check-account-deletion.js`.
* We also updated an incorrect client-side test in /assert/.
* A minor bug in our CSS caching system caused some content to be unnecessarily recompiled. We've implemented a fix which should speed up loading time.

# JamaicanMonkey release (3.9.0)

## Goals

Over time we've added many small configuration values to CryptPad's `config/config.js`.
As the number of possible variations grew it became increasingly difficult to test the platform and to provide clear documentation.
Ultimately this has made the platform more difficult to understand and consequently to host.

This release features relatively few bug fixes or features.
Instead, we took the calm period of the northern winter holidays to simplify the process of running a server and to begin working on some comprehensive documentation.

## Update notes

We have chosen to drop support for a number of parameters which we believe are not widely used.
Read the following list carefully before updating, as you could be relying on behaviour which no longer exists.

* Due to reasons of security and performance we have long advised that administrators make their instance available only over HTTPS provided by a reverse proxy such as nginx instead of loading TLS certificates via the node process itself. We have removed the option of serving HTTPS traffic directly from node by removing all support for HTTPS in this process.
* Over the years many administrators have had to migrate their instance from one machine to another and have had difficulty identifying which directories were responsible for storing user data. We are beginning to migrate all user-generated data from the repository's root into the `data` directory as a new default, allowing for admins to migrate content by copying this single directory.
  * for the time being we have not moved anything which is exposed directly over HTTPS since that complicates the upgrade process by requiring all configuration changes to be made simultaneously.
  * the modifications we've made only affect the _default configuration_ provided by `config/config.example.js`, existing instances which have copied this file to `config/config.js` will not be affected.
  * only the following values have been modified:
    * `pinPath`
    * `taskPath`
    * `blobStagingPath`
* We have modified the Dockerfile volume list to reflect the changes to these default paths. If you are using docker you will have to either:
  * revert their removal or
  * move the affected directories into the `data` directory and update your live config file to reflect their new location
* Please note that we do our team does not use docker, that it was included in the main repository as a community contribution, and that we are not committed to supporting its configuration since we do not test it.
  * Our official policy is to provide an up-to-date set of configuration files reflecting the state of our production installation on [CryptPad.fr](https://cryptpad.fr) using Debian, nginx, and systemd.
  * we are actively working on improving our documentation for this particular configuration and we plan to close issues for other configurations as being outside of the project's scope.
* We've updated our example nginx configuration file, located at `cryptpad/docs/example.nginx.conf`.
  * in addition to a great number of comments, it now makes use of variables configure the domains referenced by the CSP headers which are required to take advantage of all of CryptPad's security features.
* Prompted by warnings from recent nodejs versions we are updating our recommended version to v12.14.0 which is at the time of this writing the latest Long Term Support version.
  * you may need to update to successfully launch your server.
  * as always, we recommend using nvm to manage nodejs installation.
* We have dropped support for a number of experimental features:
  * replify (which allowed admins to modify their server at runtime using a REPL connected via a named socket)
  * heapdump (which provided snapshots of the server's memory if it crashed)
  * configurable RPC files as a configuration parameter
* Finally, we've replaced a number of websocket configuration values (`websocketURL`, `websocketPath`, `useExternalWebsockets`, and `useSecureWebsockets`) with one optional value (`externalWebsocketURL`) in config.js
  * if your instance is configured in the default manner you shouldn't actually need this value, as it will default to using `/cryptpad_websocket`.
  * if you have configured your instance to serve all static assets over one domain and to host your API server on another, set `externalWebsocketURL` to `wss://your-domain.tld/cryptpad_websocket` or whatever URL will be correctly forwarded to your API server.

Once you have reviewed your configuration files and ensured that they are correct, update to 3.9.0 with the following steps:

1. take your server down
2. get the latest code with `git pull origin master`
3. install some required serverside dependency with `npm update`
4. (optionally) update clientside dependencies with `bower update`
5. bring your server back up

## Features

* We made some minor improvements to the process of redeeming invitation links for teams.
  * invitation links can only be used once, so we remove the hash from the URL bar once you've landed on the redemption page so that reloading after redeeming doesn't indicate that you've used an expired link.
* [One of our Finnish-speaking contributors](https://weblate.cryptpad.fr/user/ilo/) has translated a very large amount of the platform's text in the last few weeks, making Finnish our fifth most thoroughly translated language!

## Bug fixes

* We noticed and fixed a style regression which incorrectly removed the scrollbar from some textareas
* We also found that it was possible to corrupt the href of an item in a team's drive if you first shared a pad with your team then transferred ownership, the link stored in the team's drive would have its domain concatenated together twice.
* The type value of read-only pads displayed as search results in user and team drives was incorrect but is now correctly inferred.

# IsolobodonPortoricensis release (3.8.0)

We had some trouble finding an extinct animal whose name started with "I", and we had to resort to using a scientific name.
Despite this long name, this was a very short release cycle.
It's the last release of 2019, so we hope you like it!

## Goals

During this release cycle we prioritized the mitigation of some social abuse vectors and the ability to invite users to a team via a link.
We have more improvements planned for both features, but we wanted to release what we had before the end of the year as our team is taking a little time off to recharge for 2020.

## Update notes

This is a small and simple release. We made a very minor improvement to the server which will require a restart, but everything will still work if you choose not to.

Update from 3.7.0 to 3.8.0 with the following procedure:

1. Take your server down
2. Get the latest code with `git pull origin master`
3. Bring your server back up

Or if you've set up your admin interface:

1. Pull the latest code
2. Click the admin panel's "Flush cache" button

## Features

* We updated a bunch of styles to improve the platform's visual consistency:
  * prettier buttons
  * elimination of rounded corners on buttons, text inputs, and password inputs
* We've fixed the default styles on embedded media while their content is loading
* The button to add a user as a contact on their profile page now has a more prominent position at the top of the page
* Users also have the option of muting other people via their profile page.
  * these users will not know that you've muted them.
  * you can review the complete list of all the people you've muted on your contacts page
  * you can mute or unmute from the contacts page as well as their profile
  * changes to a user's mute status propagate across pages in real-time
* Some of our Finnish-speaking users have become contributors via our weblate instance (https://weblate.cryptpad.fr/)
  * we're always looking for more translators to help more people protect their data, so don't hesitate to contact us if you want to help
* Finally, it's now possible to invite users to a team by creating and sharing a personalized one-time-use link.
  * team owners and admins can try it out via their teams' "Members" tab

## Bug fixes

* We've fixed a few subtle bugs where various contact status and our one-to-one chat functionality could get into a bad state.

# HimalayanQuail release (3.7.0)

## Goals

As we are getting closer to the end of our CryptPad Teams project we planned to spend this release addressing some of the difficulties that users have reported regarding the usage of our newer social features.

## Update notes

This release includes an upgrade to a newer version of JQuery which mitigates a minor vulnerability which could have contributed to the presence of an XSS attack. We weren't using the affected methods in the library, but there's no harm in updating as it will protect against the vulnerability affecting user data in the future.

We've also made some non-critical fixes to the server code, so you'll need to restart after pulling the latest code to take advantage of these improvements.

Update to 3.7.0 from 3.6.0 using the normal update procedure:

1. stop your server
2. pull the latest code via git
3. run `bower update`
4. restart your server

If you're using an up-to-date version of NPM you should find that running `npm update` prints a notice that one of the packages you've installed is seeking funding. Entering `npm fund` will print information about our OpenCollective funding campaign. If you're running a slightly older version of NPM and you wish to support CryptPad's development you can do so by visiting https://opencollective.com/cryptpad .

## Features

* Many users have contacted us via support tickets to ask how to add contacts on the platform. The easiest way is to share the link to your profile page. Once on that page registered users will be able to send a contact request which will appear in your notification tray. Because we believe you shouldn't have to read a manual to use CryptPad (and because we want to minimize how much time we spend answering support tickets) we've integrated this tip into the UI itself. Users that don't have any contacts on the platform will hopefully notice that the sharing menu's contacts tab now prompts them with this information, followed by a button to copy their profile page's URL to their clipboard.
* We've made a lot of other small changes that we hope will have a big impact on the usability of the sharing menu:
  * the "Link" section of the modal which includes the URL generated from your chosen access rights has been restyled so that the URL is displayed in a multiline textarea so that users can better see the URL changing as they play with the other controls
  * both the "Contacts" and "Link" section include short, unintrusive hints about how passwords interact with the different sharing methods:
    * when sharing via a URL we indicate that the recipient will need to enter a password, allowing for the URL to be sent over an insecure channel without leaking your document's content
    * when sharing directly with a contact via their encrypted mailbox the password is transferred automatically, since it is assumed that you intend for the recipient to gain access and the platform provides a secure channel through which all the relevant information can be delivered
    * this information is only included in cases when the document is protected with a password to limit the amount of information the user has to process to complete their task
  * we include brief and dismissable warning within the menu which indicates that URLs provide non-revocable access to documents so that new users of the platform understand the consequences of sharing
  * in general we've tried to make the appearance of the modal more appealing and intuitive so that users naturally discover and adopt the workflows which are the most conducive to their privacy and security
* Our premium accounts platform authenticates that you are logged in on a given CryptPad instance by loading it in an iframe and requesting that it use one of your account's cryptographic keys to sign a message. Unfortunately, this process could be quite slow as it would load your CryptDrive and other information related to account, and some users reported that their browser timed out on this process. We've addressed this by loading only the account information required to prove your identity.
* We've also included some changes to CryptPad's server to allow users to share quotas between multiple accounts, though we still have work to do to make this behaviour functional on the web client.
* Spreadsheets now support password change!
* Kanban boards now render long column titles in a much more intuitive way, wrapping the text instead of truncating it.
* Our code editor now features support for Gantt charts in markdown mode via an improved Mermaidjs integration. We've also slowed down the rendering cycle so that updates are displayed once you stop typing for 400ms instead of 150ms, and improved the rendering methods so that all mermaid-generated charts are only redrawn if they have changed since the last time they were rendered. This results in a smoother reading experience while permitting other users to continue to edit the document.
* Finally, after a review of the code responsible for sanitizing the markdown code which we render as HTML, we've decided to remove SVG tags from our sanitizer's filter. This means that you can write SVG markup in the input field and see it rendered, in case you're into that kind of thing.

## Bug fixes

* It seems our "contacts" app broke along with the 3.5.0 release and nobody reported it. The regression was introduced when we made some changes to the teams chat integration. We've addressed the issue so that you can once again use the contacts app to chat directly with friends.
* We've found and fixed a "memory puddle" (a non-critical memory leak which was automatically mopped up every now and then). The fix probably won't have much noticeable impact but the server is now a little bit more correct
* We stumbled across a bug which wiped out the contents of a Kanban board and caused the application to crash if you navigated to the affected version of the document in history mode. If you notice that one of your documents was affected please contact us and we'll write a guide instructing you how to recover your content.
* We've found a few bugs lurking in our server which could have caused the amount of data stored in users' drives to be calculated incorrectly under very unlikely circumstances. We've fixed the issue and addressed a number of similar asynchrony-related code paths which should mitigate similar issues in the future.
* Lastly, we spotted some flaws in the code responsible for encrypting pad credentials in shared folders and teams such that viewers don't automatically gain access to the editing keys of a document when they should only have view access. There weren't any access control vulnerabilities, but an error was thrown under rare circumstances which could prevent affected users' drives from loading. We've guarded against the cause and made it such that any affected users will automatically repair their damaged drives.

# GoldenFrog release (3.6.0)

## Goals

We're following up our last few releases of major core developments with an effort to improve reliability in some unstable areas and make some superficial tweaks to improve usability of some critical interfaces.

## Update notes

Update to 3.6.0 from 3.5.0 using the normal update procedure:

1. stop your server
2. pull the latest code via git
3. run `bower update`
4. restart your server

## Features

* We've introduced a word-count feature in our rich text editor.
* The "share modal" which is accessible from both the "right-click menu" in the drive and the sharing button in the toolbar has been redesigned:
  * different means of sharing access to documents have been split into different tabs to present users with less information to process
  * each sharing method has an associated icon to make their actions easier to recognize at a glance
  * various UI elements have been restyled to make their purpose and importance more obvious
    * cancel buttons have a grey border to draw less attention
    * OK buttons have a blue or grey background depending on whether they are active
    * secondary buttons like "preview" have only a thin blue border so that they don't draw attention away from the primary button
    * read-only text fields have a subtler appearance since they are shown primarily for the purpose of previewing your action
    * text input fields (such as search) have a light background to suggest that you can use them
* We've made a minor adjustment to some of our styles for small screen to detect when a screen is very short in addition to when it is very narrow. As a result it should be somewhat easier to use on-screen keyboards.

## Bug fixes

* We found and fixed a subtle race condition which caused teams' quotas to be calculated incorrectly in certain circumstances.
* A minor bug in our login process caused users with premium accounts to incorrectly see an entry in their user menu as linking to our 'pricing' page instead of their 'subscription' management tools. This has since been fixed.
* We noticed that some of the rendered messages in the history mode of the notifications panel could fail to display text for some message types. These incorrect messages will be hidden from view wherever it is impossible to decide what should be displayed. We plan to address the issue in a deeper way in the near future.
* We've become aware of some odd behaviour in long-lived sessions where tabs seem to lose their connection to the sharedWorker which is common to all tabs open in a particular browser session. As far as we can tell the bug only affects Firefox browser. Unfortunately, debugging sharedWorkers in Firefox has been broken for a number of major versions, so we haven't been able to determine the cause of the issue. Until we're able to determine the underlying cause we've added extra checks to detect when particular features become isolated from the worker, where previously we assumed that if the worker was connected to the server then everything was behaving correctly. We recommend that you reload the tab if you notice that aspects of your shared folders or drives (for users or teams) display a read-only warning while your other tabs are behaving normally.

# FalklandWolf release (3.5.0)

## Goals

This release features work that we've been planning for a long time centered around sharing collections of documents in a more granular way.

This is our first release since David Benqué joined our team, so in addition to these team-centric updates we also worked on integrating some UI/UX improvements.

## Update notes

Updating to 3.5.0 from 3.4.0 is simple.

1. stop your server
2. pull the latest code via git
3. run `bower update`
4. restart your server

## Features

* We restyled some elements throughout the platform:
  * our tooltips have a sleeker flat design
  * the quota bar which appears in the drive, teams, and settings pages has also been improved
  * we've begun improving the look and feel of various popup dialogs
* We've added support for password-change for owned uploaded files and owned shared folders:
  * changing passwords for encrypted files means that the original file will be removed from the server and a new file will be encrypted with a new key and uploaded to a new location on the server. References to the original file will be broken. This includes links, media-tags embedded within pads, and items in other users' drives or shared folders to which you do not have access.
  * the process is very similar for shared folders stored in users' CryptDrives, except that users will have the opportunity to enter the new password when they visit the platform.
* We're very happy to finally introduce the notion of _read-only shared folders_. While we've had the capacity to make shared folders read-only for some time, it was only in the same sense as pads were read-only.
  * This is to say that while a viewer cannot modify the document, any links to encrypted documents within that document would confer their natural editing rights to viewers, making it possible to accidentally leak access when a single pad was shared.
  * Our new read-only shared folders encrypt the editing keys for the documents they contain, such that only those with the ability to change the folder structure itself have the inherent capacity to edit the documents contained within. We think this is more intuitive than the alternative, but it took a lot of work to make it happen!
  * Unfortunately, older shared folders created before this release will already contain the cryptographic keys which confer editing rights. Pads which are added to shared folders from this release onward will have the keys for their editing rights encrypted. We'll offer the ability for owners to migrate these shared folders in an upcoming release once we've added the ability to selectively trim document history.
* Similarly, we've introduced the notion of _viewers_ in teams. Viewers are listed in the team roster and have the ability to view the contents of the team's drive, but not to edit them or add new documents.
  * Unfortunately, the notion of viewers is also complicated by the fact that documents added to team drives or shared folders in team drives did not have their editing keys encrypted. The first team member to open the team drive since we've deployed this release will run a migration that will encrypt the keys saved within the team drive, however, the encryption keys will remain in the drive's history until we develop a means of selectively trimming history.

## Bug fixes

* We discovered and fixed some bugs in the serverside code responsible for handling some aspects of file upload related to starting a new upload after having cancelled a previous session.
* We also identified a regression in Our _slides_ app related to the rendering of `<br>` tags, such as you might create with a `****` sequence in the corresponding markdown. This was introduced with some overly broad CSS that was intended to style our notifications page. We've since made the notifications styles more specific such that they can't interfere with other applications.
* We've become aware of some mysterious behaviour in Firefox that seems to cause some tabs or functionality to reconnect to the server after going offline while other aspects of the platform did not. Until now we've always assumed that users were connected or not, and this partial connection has revealed some bugs in our implementation. Consequently, we've begun adding some measures to detect odd behaviour if it occurs. We expect to have determined the cause of this behaviour and to have proposed a solution by our next release.

# Elasmotherium release (3.4.0)

## Goals

This is a small release, focused on bug fixes and UI improvements, while we're finalizing bigger team-centric features planned for the next release.

## Update notes

This is a pretty basic release:

1. stop your server
2. pull the latest source code
3. restart your server

## Features

* Media elements (images, videos, pdf, etc.) will now display a placeholder while they're being downloaded and decrypted.
* Media elements deleted from the server by their owner will now display a "broken/missing" image.
* The "auto-close brackets" option in the Code and Slide applications can now be disabled from the user settings.
* "Add item" and "Add board" buttons in Kanban have been moved to improve usability with small screens.
* The "transfer ownership" feature for pads has been extended to shared folders. It is now possible to offer ownership of a shared folder to a friend.
* For administrators
  * Better sorting of support tickets in the administration panel. Unanswered messages will be displayed first.
  * Add team configuration options in `customize/application_config.js`
    * `maxTeamsSlots` defines the maximum number of teams a user can join (default is 3). Teams may significantly increase the loading time of pages and we consider 3 to be a good balance between usability and performances.
    * `maxOwnedTeams` defines the number of teams a user can own (default is 1). This number prevent users to create many teams only to increase their storage limit.

## Bug fixes

* The "pad creation modal" (Ctrl+E) is now working everywhere in the drive.
* We've fixed the share button for unregistered users (https://github.com/cryptpad/cryptpad/issues/457).
* We've fixed an issue with newly created kanban items replacing existing ones.
* Transfering/offering pad ownership from a team to yourself is now working properly.

# Dodo release (v3.3.0)

## Goals

We've continued to prioritize the development of team-centric features in CryptPad. This release was focused on stabilizing the code for Teams and making them available to the users.

## Update notes

This is a pretty basic release:

1. stop your server
2. pull the latest source code
3. install the latest serverside dependencies with `npm install`
4. install the latest clientside dependencies with `bower update`
5. restart your server

Note: we've updated our Nginx configuration to fix any missing trailing slash in the URL for the newest applications: https://github.com/cryptpad/cryptpad/commit/d4e5b98c140c28417e008379ec7af7cdc235792b

## Features

* You can now create _Teams_ in CryptPad. They're available from a new _Teams_ application and provide a full CryptDrive that can be shared between multiple users.
  * Each team has a list of members. There are currently 3 different access level for team members:
    * Members: can add, delete and edit pads from the team
    * Admins: can also invite their CryptPad friends to the team, kick members and promote members as "Admin"
    * Owners: can also promote admins as "Owner", change the team name or avatar and delete the team
  * Each team has its own storage limit (50 MB by default, the same as user accounts).
  * A chat is available to all the team members
  * Pads created from the team's drive will be stored in this drive. If they are created as _owned_ pads, they will be ownedcc by the team.
  * You can share pads or folders from your drive with one of your teams and you can store pads or folders from your team to your personal drive.
  * Each user can be a member of up to 3 teams. A user can't create a new Team if they are already _Owner_ of another one.
* We've done some server improvements to save CPU usage.
* We've also improved to the messenger module to save CPU and memory in the client.
* The support panel (administrator side) now provides more debugging information about the users who ask for help
* A link to the new CryptPad survey (https://survey.cryptpad.fr/index.php/672782?lang=en) has been added to the user menu
  * This link can be changed or removed using the "surveyURL" key in `/customize/application_config.js`. An empty value will remove the link from the menu.

## Bug fixes

* We've fixed an issue preventing users to remove owned empty channels from the server
* Adding and editing new items to the kanban boards will now update the correct item from the board
* We've fixed an issue with shared folders loaded by unregistered users
* The default title is now always set in newly created polls
* Desktop notifications will now be displayed only once per connection to the server and not once per CryptPad tab in the browser
* The button to download a spreadsheet from the drive has been removed. This feature is not available yet and the button was doing nothing.

# Chilihueque release (v3.2.0)

## Goals

We've continued to prioritize the development of team-centric features in CryptPad. This release implements most of the core functionality for fully-functional teams as a core part of CryptPad, though they're not quite ready for use just yet.

Beyond teams we did a little work to standardize some serverside APIs related to storage.

## Update notes

This is a pretty basic release:

1. stop your server
2. pull the latest source code
3. install the latest clientside dependencies with `bower update`
4. restart your server

## Features

* Much of the code from CryptPad's sharedworker system and the CryptDrive's front end has been refactored to consider the existence of _Teams_ in addition to your regular user account.
  * Our next release will make it possible to use this functionality
* Blob (encrypted file uploads) can now archived instead of being deleted outright.
  * set `retainData` to false in your config if you want both channels and blobs to be deleted, or true if you prefer to have them both archived
  * the tools for restoring accidentally deleted data are limited, but if the data is gone then there will certainly be nothing you can do
  * `scripts/evict-inactive.js` expires archived blobs after `archiveRetentionTime` days, as was already the case with channel data
* We've added support for nodejs to a few more of our internal dependencies.
  * for now we're just using this for tests and to speed up development time
  * eventually we hope to be able to use these modules for more command-line tools

## Bug fixes

* Alertify logs (the little pop-ups in the bottom-left of the screen) are now set to appear in front of everything else.
  * it was possible for them to be hidden behind a variety of modals
* When using the search bar to filter friends in the share modal the returned results are now case-insensitive.
* We've fixed some thumbnail bugs related to handling different encodings gracefully.
* We've found and fixed a minor memory leak in our shared workers related to how we fetched chat messages.
* We've also found a serverside bug which could have caused otherwise valid metadata entries in channels to not be read due to how the messages were chunked when reading from the filesystem.

# Baiji release (v3.1.0)

## Goals

For CryptPad 3.1.0 we prioritized our work on team-centric features. In particular we wanted to finish some improvements to make our notifications system more private and start making use of our prior work on editable pad metadata.

## Update notes

* `config/config.example.js` has included the `inactiveTime` value for a while. It's used by our archival script (`scripts/evict-inactive.js`) to determine if a pad should be removed. This value is now shared with clients via the `/api/config` endpoint. Unregistered clients now use this value to inform users that unpinned pad will expire after that number of days of inactivity.
  * previously the value was hardcoded to "3 months"
* Changes to channel metadata logs and users' pin logs now include the time of the modification.
  * this is mostly to help with debugging, though we might use this value in the future
  * newly created metadata will also include a `created` field with a timestamp indicating when it was first created on the server
* We've removed two files from our `scripts` directory:
  * `delete-inactive.js`: because it ignored the configured values for archival
  * `pinned-data.js`: because it was only used by `delete-inactive.js` and we will soon have better ways to accomplish the same goal
* We've made some updates to the server-side components of our caching logic
  * CryptPad used to use the `version` value from `package.json` as a cache-busting string so that all assets would be reloaded and cached when you upgraded to a new version
  * in practice, lots of administrators had problems with this where they made configuration changes and restarted the server, but their client was stuck with old values cached
  * the new default is to generate a cache string at the server's launch time and use this value for the lifetime of the server
    * server administrators can still change the cache string through the instance's admin panel
    * this behaviour was previously available by launching the server with `FRESH=1 node server.js`
  * the old behaviour is still available by launching the server with `PACKAGE=1 node server.js`
* We've refactored some small functions implemented in `historyKeeper.js` which halved our server's memory usage in the previous release and reused those functions in our RPC module.
  * we hope this leads to even better performance under heavy load when doing things like
    * reading metadata
    * checking disk usage (global and for particular users)
    * loading a user's pin log

Baiji depends on updates to clientside and serverside dependencies.

To update:

1. Take down your server
2. Pull the latest code
3. `npm install`
4. `bower update`
5. Launch your server

## Features

* Messages sent to a user's encrypted mailbox are now anonymized by the server.
  * This means that clients other than the intended recipient of a message no longer have any information indicating the identity of the sender
* It is now possible to modify ownership of pads
  * use the "properties modal", available by right-clicking on the pad in your drive or from the properties entry in the "toolbar drawer" in pads
  * navigate to the "Availability tab" and click "manage owners" where you can:
    * offer ownership to friends, who will receive a notification and will be able to accept or refuse ownership
    * remove ownership from confirmed owners
    * rescind pending offers
* Amendments to the "owners" field in pad metadata will now also change the "mailbox" field, allowing users with read-only access rights to request editing rights from any of the owners
  * the current behaviour is to ask only the first owner in the list, but we'll be able to make use of the additional mailboxes in future releases
* We now consider changes to metadata to be "activity" for a channel for the purposes of deciding whether an unpinned channel should be archived.
  * this means that if you offer other users ownership of a pad and remove yourself as owner, even if nobody is pinning the document it will not be removed until the configured period of inactivity from the time when you removed yourself as owner
* The "What is CryptPad" pad which is created in a user's CryptDrive when they first register is now created as an "owned pad" which they can remove from the server
* We've begun work on a basic command-line client which we're mostly using for automated testing of our history-related APIs and our serverside RPCs (Remote Procedure Calls).
  * a stable command-line client API won't necessarily be available for the foreseeable future, but these tests should lead to fewer serverside regressions which will be better for the browser client as well
  * as we write tests we're converting more and more of our browser-only modules to work in more environments, so native and mobile apps will be easier to implement in the future
* Finally, we've begun to detect and users that try to register with their email address as their username
  * we don't prevent them from doing so, but we do warn them that their email address is not actually sent to the server, and we won't be able to use it to recover their account if they forget it or their password

## Bug fixes

* In our previous release we discovered that `config/config.example.js` did not include the configuration point which enabled the server to schedule tasks for the expiration of files.
  * even though the pads were created with the expiration time in their metadata, and the server would not serve such files to clients that requested them, they would still remain in the database
  * if these expired pads are ever requested and they should have expired over a day before, the server will now archive or delete the file immediately
* We've investigated and fixed a number of errors that were visible in the browser console even if they didn't have harmful effects on the client's behaviour
  * when reconnecting
    * "channel ready without callback"
    * network "EJOINED" error
* Changes to the metadata logs for pads are now queued so that they are always written in the same order as they were received

# Aurochs release (v3.0.0)

The move to 3.0 is mostly because we ran out of letters in the alphabet for our 2.0 release cycle.
Releases in this cycle will be named according to a theme of "extinct animals", a list which is unfortunately getting longer all the time.

## Goals

In this release, we took more time than usual to make some big changes to the way the platform works, taking great care to maintain or improve stability.

Up until now it has been necessary to create documents with the whatever settings they might require in the future, after which point it was not possible to change them. This release introduces the ability of the server to store and read amendments to document metadata. This will soon allow users of owned documents to delegate that ownership to their friends, add or modify expiration times, and make other modifications that will greatly improve their control over their data.

## Update notes

During this development period we performed an extensive audit of our existing features and discovered a few potential security issues which we've addressed. We plan to announce the details of these flaws once administrators have had sufficient time to update their instances. If you are running a CryptPad instance, we advise you to update to 3.0.0 at your earliest opportunity.

* It was brought to our attention that while expired pads were not being served beyond their expiration time, they were not being removed as intended. The cause was due to our failure to document a configuration point (`enableTaskScheduling`) that was added to make expiration optional in the example configuration file. We've removed this configuration point so that tasks like expiration will always be scheduled. Expiration of tasks was already integrated into the main server process, but we have added a new configuration point to the server in case any administrators would like to run the expiration tasks in a dedicated process for performance reasons. To disable the integration, change `disableIntegratedTasks` from `false` to `true` in the server configuration file.
* This release depends on updates to three clientside libraries (`netflux-websocket@0.1.20`, `chainpad-netflux@0.9.0`, and `chainpad-listmap@0.7.0`). These changes are **not compatible with older versions of the server**. To update:
  1. make any configuration changes you want
  2. take down your server process
  3. fetch the latest clientside and serverside code via git
  4. run `bower update` and `npm install` to ensure you have the latest dependencies
  5. update your cache-busting string if you've configured your instance to update this manually
  6. bring your server back up

## Features

* Support panel
  * Support tickets now include the "user agent" string of the user's browser to make it easier to debug issues.
  * Users that submitted support tickets will now receive notifications when their tickets are answered
* Sharing and access control
  * the "pad properties modal" now displays the name of the owner of a pad if you recognize their public key
    * this will be improved further in future releases as we introduce the notion of "acquantances" as users who you have seen in the past but who are not yet your friends
  * newly created "owned pads" will now contain an "owner" field containing the address of your "mailbox", encrypted with the same key as the pad itself
    * this allows users with view-only access rights to send you a message to request edit rights
    * the same functionality is offered for older pads if you happen to know the mailbox address for an owner listed in the "owners" field
  * it was already possible to delegate access to a friend via the "share modal", but we now support a special message type for templates so that the pad will be stored as a template in the receiving user's drive (if accepted)
  * the "availability" tab of the "properties" modal for any particalar pad now shows the display name of the pad's owner if they are your friend. Additionally we now support displaying multiple owners rather than just "yourself" or "somebody else"
* File and CryptDrive workflows
  * we now support folder upload in any browser offering the required APIs
  * it's now possible to export files and folders (as zips) directly from your CryptDrive
  * the ctrl-e and right-click menus in the drive now features an entry for uploading files and folders
  * certain plain-text file formats uploaded as static files can now be rendered within other documents or used as the basis of a new code pad
  * ~~regular folders in your CryptDrive can be converted into shared folders from the right-click menu as long as they do not contain shared folders and are not within another shared folder~~
    * nesting is complicated for a variety of technical reasons, but we're discussing whether it's worthwhile to try to find a solution
    * we found a critical bug in the implementation of this feature and disabled it for this release
  * documents and folders within your CryptDrive can now be moved to parent folders by dropping them on the file path in the toolbar
* Styles
  * the upload/download progress table has been restyled to be less invasive
  * right-click menus throughout the platform now feature icons for each entry in addition to text
  * the animation on the spinner on the loading page has been updated:
    * it no longer oscillates
    * it doesn't display a 'box' while the icon font is loading
    * it's more dynamic and stylish (depending on your tastes)
* We've renamed the "features" page "pricing" after many prospective users reported that is was difficult to find details about premium accounts
* Code editor updates
  * you can now un-indent code blocks with shift-tab while on a line or selecting multiple lines of text
  * backspace now removes the configured level of indentation
  * titles which are inferred from document content now ignore any html you might have included in your markdown

## Bug fixes

* One of our users registered `CVE-2019-15302` for a bug they discovered
  * users with edit access for rich text pads could change the URL of the document to load the same document in a code pad
  * doing so invalidated the existing stored content, making it impossible to load the same document in the rich text editor
  * doing the same steps now displays an error and does not modify the existing document
* UI and responsiveness
  * submenus in contextmenus can now be opened on mobile devices
  * the CryptDrive layout mode is now detected dynamically instead of at page load
  * contextmenus shouldn't get rendered off the page anymore
  * a non-functional ctrl-e menu could be loaded when another modal is already open, but now it is simply blocked
  * icons with thumbnails in the drive no longer flicker when the page is redrawn
  * the color picker in the settings page which chooses your cursor color now uses the same cross-platform library used in other applications (jsColor) so that it will work in all modern browsers
  * when prompted to save a pad to your CryptDrive is was possible to click multiple times, displaying multiple confirmation messages when the pad was finally stored. We now ignore successive clicks until the first request fails or is successful
  * chat messages now only render a subset of the markdown implemented elsewhere on the platform
  * your most recently used access-right settings are remembered when you delegate access directly to a friend, while previously the settings were only remembered when the other sharing methods were used
* Code editor bugs
  * indentation settings modified on the settings page are updated in real time, as intended
  * we discovered that when changes made by remote editors were applied to the document when the window was not focused, the user's cursor position would not be preserved. This has been fixed
  * when importing code without file extensions (.bashrc, .viminfo) the file name itself was used as an extension while the name was considered empty. These file names and extensions are now parsed correctly
  * language modes in the code editor are now exported with their respective file extensions
  * file extensions are reapplied when importing files
* CryptDrive
  * we offer a "debug" app which is not advertised anywhere in the UI which can be used to investigate strange behaviour in documents
    * if the app is loaded without a hash, the hash for the user's drive is used instead
    * we no longer add this document as an entry in your CryptDrive
    * we guard against deleting the history of your CryptDrive if you already have such a file and you delete it permanently or move it to your trash
  * we've fixed a number of bugs related to viewing and restoring invalid states from your CryptDrive's history
* Connectivity
  * we've fixed a bug that caused disconnection from the server to go undetected for 30 seconds
  * we discovered that leaving rejoining a real-time session would cause the reactivation of existing listeners for that session as well as the addition of a new set of handlers. We now remove the old listeners when leaving a session, preventing a memory leak and avoiding the repeated application of incoming messages
  * when we leave a session we also make sure to clean up residual data structures from the consensus engine, saving memory
  * we found that support tickets on the admin page were displayed twice when the admin disconnected and reconnected while the support ticket panel was open. This has been fixed

# Zebra release (v2.25.0)

## Goals

This release coincided with XWiki's yearly seminar, so our regular schedule was interrupted a bit. We spent the time we had working towards implementing components of "editable metadata", which will allow pad owners to add new owners or transfer ownership to friends, among other things.

Otherwise we wanted to deploy a built-in support system to improve our ability to debug issues as well as to make it easier for users to report problems. Along the way we did our best to improve usability and fix small annoying bugs.

As this is the last release in our 2.0 cycle, we're going to take some extra time to prepare some big features for our 3.0.0 release, which we expect to deploy on August 20th, 2019.

## Update notes

* We've updated some dependencies that are used to lint the CryptPad codebase to detect errors. Run `npm install` if you plan to develop for CryptPad and you want to use the linter
* This release introduces a _support_ tab within the admin panel. If you generate an asymmetric keypair and add it to your server-side configuration file then users will have the option of opening support tickets if they encounter errors. Their support tickets will include some basic information about their account which might help you to solve their issues. To set up your _"encrypted support mailbox"_:

  1. run `node ./scripts/generate-admin-keys.js`
  2. copy the "public key" and add it to your config.js file like so:

  * `supportMailboxPublicKey: "BL3kgYBM0HNw5ms8ULWU1wMTb5ePBbxAPjDZKamkuB8=",

  3. copy the private key and store it in a safe place
  4. navigate to the "support" tab in the admin panel and enter the private key
  5. share the private key with any other administrators who should be able to read the support tickets
  6. restart so that your users receive the public key stored in your configuration file

  * this will allow them to submit tickets via the support page
  * if you don't know how to fix the issue and want to open a ticket on our public tracker, include the information submitted along with their ticket

## Features

* The feature added in the previous release which displayed a preview of the theme and highlighting mode chosen for the code and slide editors has been improved to also display previews when navigating through the dropdowns using keyboard arrow keys.
* We've followed up on our initial work on notifications by adding a full notifications page which offers the ability to review older notifications that you might have accidentally dismissed.
* When you right-click on an element in the CryptDrive the resulting menu now includes icons to make it easier to find the action for which you are looking
* We now include folders in search results which used to only include files
* You can right-click to add colors to folders, in case that helps you organize your content more effectively

# Yak release (v2.24.0)

## Goals

We've recently had an intern join our team, so this release and those until the end of summer are likely to feature a lot of small usability fixes.
Otherwise, we've continued to develop team-centric features, particularly the way that registered users share pads with friends.
Finally, we prioritized the ability to archive files for a period instead of deleting them, which we've been planning for a while.

## Update notes

* There are some important steps in this release:
  * **make sure you read the full update notes before proceeding!**
* [@zimbatm](https://github.com/zimbatm) added the ability to configure the location of your configuration file via environment variables when launching the server:
  * `CRYPTPAD_CONFIG=/home/cryptpad/cryptpad/cryptpad-config/config.js /home/cryptpad/cryptpad/server.js`
* We discovered a bug in our Xenops release which resulted in the server's list of pads stored for each user to be incorrect.
  * if you're running CryptPad 2.23.0, we recommend that you disable any scripts configured to delete inactive pads
  * updating to 2.24.0 will fix the issue in the client, but each user's list of "pinned pads" won't be corrected until they visit your instance and run the latest code
* This release introduces the ability to archive some data instead of deleting it, since it can be scary to remove user data when you can't easily inspect it to see what it is
  * to take advantage of this new functionality you'll need to update your configuration file with three new configuration points:
    * set `retainData` to `true` if you want to archive channels instead of deleting them
      * either by user command or due to inactivity
      * the server will fall back to its default deletion behaviour if this value is `false` or not set at all
    * set `archiveRetentionTime` to the number of days that an archived pad should be stored in the archive directory before being deleted permanently
    * set `archivePath` to the path where you'd like archives to be stored
      * it should not be publicly accessible in order to respect the users' wishes
* We've introduced some new scripts to work with the database, some of which were needed to diagnose problems stemming from the pinning bug
  * `evict-inactive.js` identifies channels which are unpinned and inactive and archives them
    * unlike `delete-inactive.js` it only handles channels, not files or any other kind of data
    * ...but it's much safer, since nothing is removed permanently
    * in the coming releases we'll implement archival for other types of data so that we can fully remove unsafe scripts
  * `diagnose-archive-conflicts.js` checks all the files in your archive and identifies whether they can be restored safely or if they conflict with newer files in the production database
  * `restore-archived.js` restores any channels archived by the server or evict-inactive.js, excluding those which would conflict with the database
* This release depends on updates to some serverside dependencies. Run `npm update`:
  * `ws` addresses a potential vulnerability, so if possible anyone running earlier versions of CryptPad should update
  * `chainpad-server` handles users' websocket connections and we needed to make a few changes to deal with changes in the `ws` API
  * `heapdump` is no longer a default dependency, though you can install it if you want its functionality
* This release also features a **Clientside migration** which modifies users' CryptDrives. Any clients which are running both the latest code after the update as well as an older version in another browser or device risk creating conflicts in their account data. To prevent this, update in the following manner:
  1. ensure that you've added the configuration values listed above
  2. shut down the server and ensure that it doesn't restart until you've completed the following steps
  3. pull the latest clientside and serverside code via git
  4. `npm update` to get the latest serverside dependencies
  5. update the cache-busting string if you are handling the cache manually, otherwise allow the server to handle this as per its default
  6. restart the server: clients with open tabs should be prompted to reload instead of reconnecting because the server's version has changed
* We recommend that you test a local version of CryptPad before deploying this latest code, as aspects of the above-mentioned migrations are not backwards-compatible.
  * you can roll back, but users' CryptDrives might have errors coping with data introduced by newer features.

## Features

* As mentioned above, CryptPad instances can be configured to temporarily archive files instead of deleting them permanently.
  * as a user this means if you accidentally delete a file you have the option of contacting your administrator and asking them to help
  * if they're really nice and have the spare time to help you, they might actually recover your data!
* A contributor is working on translating CryptPad into the Catalan language.
  * if your preferred language isn't supported, you can do the same on https://weblate.cryptpad.fr
* We added the ability to add colors to folders in users CryptDrives, along with support for arbitrary folder metadata which we aren't using yet.
* Users with existing friends on the platform will run a migration to allow them to share pads with friends directly instead of sending them a link.
  * they'll receive a notification indicating the title of the pad and who shared it
  * if you've already added friends on the platform, you can send them pads from the usual "sharing menu"
* Our code editor already offered the ability to set their color theme and highlighting mode, but now those values will be previewed when mousing over the option in the dropdown.
  * Our slide editor now offers the same theme selection as the code editor
* It's now possible to view the history of a shared folder by clicking the history button while viewing the shared folder's contents.

## Bug fixes

* The CryptDrive received a number of usability fixes this time around:
  * better styles when hovering over interactive elements in the drive (cursors, shading, etc)
  * clicking the history button in the drive a second time will exit history mode
  * after being resized, the tree pane now correctly responds to mobile layout styles
  * the path indicator also adapts to very narrow layouts
  * the user's current location is preserved when renaming the current folder or its ancestors
  * you can right-click on elements in the tree and expand or collapse all of their children
* A user noticed that one-on-one chats did not seem to be deleted, as their messages were still available after a reload.
  * they were deleted but our usage of the sharedWorker API incorrectly preserved a local cache of those message until you closed all of your browser tabs
* We've also fixed some elements of the chat UI, notably the position of the chat's scrollbar when first loading older messages and how the interface scrolls to keep up with new messages.
* We've noticed some cases of tooltips getting stuck in the UI and implemented some measures to prevent this from happening.
* After "unfriending" another user it was possible that they would be automatically re-added as friends.

# Xenops release (v2.23.0)

## Goals

For this release we wanted to focus on releasing a small set of features built on top of some foundations established in our last release. Since we were able to complete this feature set in less than a week, we decided to bundle them together so users could take benefit from them sooner.

This work is being funded by the grant we received from NLnet foundation as a part of their PET (Privacy Enhancing Technology) fund. You can read all about this grant on our latest blog post (https://blog.cryptpad.fr/2019/05/27/Our-future-is-collaborative/).

## Update notes

* This update only uses clientside dependencies. Fetch the latest code for the core repository, and depending on when you last updated you may need to `bower update` as well.
* User data is "pinned" on CryptPad instances to keep track of what encrypted data can be safely removed. At one point this system was optional and could be disabled by setting `enablePinning = false` in `customize/application_config.js`. At some point we stopped testing whether CryptPad could actually work without pinning enabled, and at this point it is definitely broken. As such, we've decided to drop support for this configuration.

## Features

* Some of our multilingual contributors have contributed translations in the German, Russian, and Italian. The history of their contributions is available on our weblate instance (https://weblate.cryptpad.fr/projects/cryptpad/app/).
* This release introduces a practical use-case of the encrypted mailbox infrastructure which we developed in our last release. Registered users are now able to use this system to accept friend requests and review the status of friend requests that have been accepted or declined. Unlike our previous friend request system, our usage of encrypted mailboxes allows for users to send friend requests from other user's profiles whether or not they are online.
* We've also put some time towards improving user profiles as well. When you change your display name from anywhere within CryptPad the name used in your profile will be updated as well. We've also made updates to other users' profiles render in real-time, since the rest of CryptPad generally updates instantly.

## Bug fixes

* Some small components of CryptPad time out if they don't work within a set amount of time, and apparently this timeout was causing problems in the newest Tor browser version. We've drastically increased the timeout to make it less likely to cause problems when loading very large documents.
* We realized that Weblate was committing "empty strings" to our translation files. Our internationalization system was configured to fall back to the English translation if no translation was available in the user's preferred language, but these empty strings fooled the system into displaying nothing instead. We addressed the issue by checking whether a string was really present, and not just whether a value existed.

# Wolf release (v2.22.0)

## Goals

This release coincided with a little time off for the team, so we planned to include only a few things. We recognized that the "Recent pads" view in the CryptDrive was not very useful for us because it did not include documents stored in _Shared folders_, so we decided to fix that. Otherwise, we're beginning a new project which we'll announce soon, so we've started working on some of its basic features.

## Update notes

* This release does not include any serverside changes, so you'll only need to get the latest source from the core repository and update dependencies with `bower update`

## Features

* As noted above, we've updated the _Recent Pads_ view in the CryptDrive to include _Shared folders_. We've also broken the list up into categories for the last 24 hours, last 7 days, and last 4 weeks.
* Continuing the theme of taking multi-user workflows into account, we've started working on the design and implementation of "Encrypted mailboxes". This will allow for account notifications in a future release, which will then make it possible for us to improve our "friend request" process, as well as enabling users to share access to documents directly without ever having to send their links outside of the platform.
* Even though this is a fairly small release from us, we've continued to receive contributions to our German, Spanish, Italian, Romanian, and Russian translations.

## Bug fixes

* We've removed a fairly large amount of duplicated code related to our networking layer which - while not directly responsible for any bugs that we know of - increased the likelihood that there would be bugs in the future.
* We realized that very old document hashes (version 0) were being displayed as having a "read-only link", even though those document did not support read-only mode. This has been fixed.
* We've also included some new tests to make sure that those fixed bugs stay fixed.
* Finally, it was reported that templates for polls were not working. We determined that the templates had been encoded in an invalid format at creation time, so when people tried to apply theme the process failed. We've addressed the underlying issue, but those invalid templates will unfortunately have to be recreated.

# Vervet release (v2.21.0)

## Goals

For this release cycle we decided to fix some deep bugs and reduce the likelihood of regressions. This included not just errors in the code, but issues that were likely to arise from incorrect configuration. There's still some work to do, but the process of setting up a CryptPad server should be slightly easier now.

## Update notes

* First off, we've added a [Code of Conduct](https://github.com/cryptpad/cryptpad/blob/master/CODE_OF_CONDUCT.md) to this repository. This project is intended to improve people's safety, and we want to be clear that this goal extends to any medium through which the public engages with the project.
* We've made a change related to how our server handles automatically expiring pads. Our server has always refused to send users the history of channels that have expired, but the actual files were only removed if administrators had set up a cron job to call a script which removed channels that had passed their expiration date. We've integrated this script into the server so that no such script will be necessary (though the old one will continue to work).
  * We've also made the process which scans for expired files more efficient, though the optimizations require a new format. We've included a migration, but the removal process is backwards compatible, so nothing terrible will happen if you don't run it. Nevertheless, we recommend you do.
* This release features changes to our serverside and clientside dependencies. To update:
  * get the latest code:
    * `git pull`
  * update serverside dependencies
    * `npm install`
  * update clientside dependencies
    * `bower update`
  * restart your server
  * run the migration to optimize for expiring channels:
    * From your CryptPad source directory, run `node scripts/migrations/migrate-tasks-v1.js`
* Administrators who want to restrict the translation languages available on their server can do so by defining an array of available language codes.
  * In your `cryptpad/customize/application_config.js`, define an array containing the langauges you want:
    * for Example: `AppConfig.availableLanguages = ['en', 'de', 'fr']`
* Finally, some administrators requested the ability to remove any references to our crowdfunding campaign. CryptPad is open-source, so naturally this was already possible, but we've made it easier.
  * In your `cryptpad/customize/application_config.js`, set `AppConfig.disableCrowdfundingMessages = true`.

## Features

* Contributors to our translation files have been busy. This release introduces Italian and Norwegian Bokmål. There has also been significant progress with for our partially complete Romanian and Russian translations.
* Our 'history-keeper' module which is responsible for storing and fetching messages has integrated our new serverside logging API, so any errors should all end up in one log instead of printing to the console.
* Similarly, every aspect of the server which is responsible for deleting content now makes an entry in the logs for that deletion, indicating the cause of the event (automatic expiration, deletion due to inactivity, or manual action on the part of the user).
* We identified some parts of the serverside code and our scripts which duplicated logic, and refactored them to use singular implementation of the intended behaviour.
* We've configured codemirror to allow for spellcheck in our code editing applications (/code/ and /slide/)

## Bug fixes

* The admin panel already featured a function which displayed the number of active sessions on the server, but it was likely to be incorrect if the API server was behind a reverse proxy. It should now display the correct number of distinct IPs which are currently connected.
* We've fixed a regression in our rendering of highlighted code blocks in markdown.
* When you close a pad which included some chat history, we remove that history from the memory of the sharedWorker which implements some caching for when you have duplicated tabs.
* We discovered that under some conditions it was possible for tabs to lose their connection to their corresponding worker. Such tabs will now identify that they have disconnected, and will prompt the user to reload.
* Our usage of shared workers also made it possible for users to leave a pad and then reconnect with the same network id, which led to some errors in our userlist. We've addressed a number of related problems, so incorrect userlists should be less likely to reappear in the future.
* Our usage of OnlyOffice for our spreadsheet editor disabled some behaviour, but left the buttons present. We've hidden those buttons to avoid confusion.
* Finally, we've investigated a bug which users reported in our rich text editor, where text could be duplicated without any user action. Unfortunately we don't yet have a fix, but we've identified the cause of the issue deep in our realtime engine. We hope to address this issue in a coming release.

# Upupa release (v2.20.0)

## Goals

After all the features we've added over time, the root of the CryptPad repository had gotten to be something of a mess. We decided to spend a lot of this release period cleaning things up. We also prioritized some other features which make it easier to manage a CryptPad instance.

## Update notes

This release makes a number of serverside changes. Read the following notes carefully before updating from an earlier version of CryptPad!

* We realized that docker images persisted `config.js` by copying it into the `customize` volume. Since customize is exposed by the webserver, this meant that potentially private information in the configuration file would be accessible over the web. We've moved `config.js` to a `cryptpad/config/`, along with `config.example.js` and modified the docker setup so that nothing in this folder will be exposed to the web.
  * Consequently, you'll need to move your own `config.js` to the new location in order for your server to read it when you restart.
* We also noticed that the configuration values for alternate paths to various were not universally supported, and that they couldn't be deeper than one directory, in any case. We've reviewed the server's source and introduced support for arbitrary filepaths to each of the directories.
  * In the near future we plan to simplify server maintenance by moving all user data into a new `data` directory. This will make docker setups easier to maintain, as well as simplifying the task of migrating or backing up your database.
* CryptPad now features a rudimentary administration panel, accessible at the /admin/ URL. Server operators can add their **Public signing key** (found on their settings page) to their config file in the `adminKeys` array. See config.example.js for more info.
* We've also moved all our scripts out of the repository root and into a dedicated `scripts` directory. We recommend reviewing any crontabs or other scripts that might be calling them.
* After receiving a number of support requests for third-party instances due to our email being displayed on the contact page, we've decided to display the `adminEmail` from `config.js` to users.
  * If you leave the default `i.did.not.read.my.config@cryptpad.fr`, nothing will be displayed. We'd appreciate it if you did leave your own contact information, as time we spend trying to help users on your instance is time we spend _not developing new features_.
* We've introduced a basic logging API which standardizes how various messages are printed, as well as logging them to the disk.
  * If you do not specify `logPath` in your config file, it will not log to the disk.
  * Unless `logToStdout` is true, it will not print to the console either.
  * You can configure the degree of logging by setting `logLevel` to one of the supported settings. If no level is set, it will use the default `info` setting, which includes _warnings_ and _errors_. See the example config for more information.
* We've dropped support for number of configuration points:
  * `enableUploads` no longer has any effect, as the clientside code assumed the server supported uploads. This value was added when file uploads were still considered experimental, but they have been a core part of the platform for some time.
  * `restrictUploads` no longer has any effect either, for the same reason.
* We've made some small updates to `example.nginx.conf` to expose `/datastore/` over the web, as there are some scripts which depend on expect the log files to be exposed.
* Depending on when you last updated, you may need to update your clientside dependencies. Run `bower update` to get the latest code.
* Finally, we've introduced a server-side dependency (get-folder-size) and updated one of our own libraries (chainpad-server). Run `npm install` to get the updated versions. The server won't work without them.

## Features

* Our rich text editor is now configured to support the insertion of LaTeX equations via CKEditor's  _mathjax_ plugin.
* The contact page now lists our Mastodon account, which is quickly catching up to our twitter account's number of followers.
  * If configured correctly, instances will also display the contact email for the instance administrator.
* We've reorganized the home page a little bit, making more of our applications visible at a glance. It also features changes to the header and footer.
* The chat box and help text are no longer shown by default, making the interface much cleaner for new users.
* Pads which were created with an expiration date are now displayed with a clock icon in users' Drives.
* The settings page now remembers which tab you'd selected, in the event of a page reload.
* We received contributions to our [German](https://weblate.cryptpad.fr/projects/cryptpad/app/de/#history) and [Russian](https://weblate.cryptpad.fr/projects/cryptpad/app/ru/#history) translations.
* Our code and slide editors now features a first version of support for rendering [Mermaid rendering](https://mermaidjs.github.io/).

## Bug fixes

* The dialog to store a pad in your drive was hidden behind the preview panel in the slide editor. It's now back on top where it belongs.

# Tapir release (v2.19.0)

## Goals

As we're very busy wrapping up the project which has funded CryptPad's development so far, this release is very small.
We've requested assistance improving the state of our translations, and received some very helpful contributions.

## Update notes

* We discovered that `container-start.sh` erroneously made a full copy of the `customize.dist` directory. This caused issues when updating to newer versions of CryptPad, where the customize directory was out of date with the rest of the instance.
  * if you have installed using docker, and have not customized your instance, you can safely remove everything in the `customize` directory **after having backed up your config.js file**. Your instance should fall back to using the default versions of those files instead of the outdated copies.
  * if you have customized your instance, you'll need to be more careful about cleaning up. Remove the files which you haven't modified, and compare your modified files against the latest versions of the default files. Merge your changes into the updated versions, and you should have an easier time updating in the future.

## Features

* We've rearranged the example server configuration file to make it easier to read and understand
* CryptPad now features a Russian translation which is 10% complete
* Our German translation has received a few fixes
* One of our Romanian colleagues has begun updating the Romanian translation, which is currently 39% complete
* **NOTE**: we're still learning our way around using weblate. We haven't given credit to these contributions because we're unsure if their authors want to be named. Going forward we'll figure out a system for giving proper credit where it is desired.

## Bug fixes

* As noted above, we've made some small changes to `container-start.sh` so that new docker images are correctly initialized

# Sloth release (v2.18.0)

## Goals

This release was developed during a busy period, so it contains fewer features than normal.
In particular we aimed to improve some aspects of our infrastructure, including finishing our deployment of _weblate_ for translations.

## Features

* Inserting `[TOC]` into the code editor while in markdown mode will render a table of contents in the preview pane.
* The code and slide editors also features some usability improvements pertaining to how tabs are handled, as it was possible to mix tabs and spaces unintentionally.
* The search bar in users drives now displays an _x_ while displaying search results, allowing users to easily return to the default view of their drive with a click.
* We've updated our translation guide to describe our new policies and procedures for translating CryptPad.
* We've added some additional features to our debugging application to help some users that reported difficulty finding documents in the history of their CryptDrives.

## Bug fixes

* We discovered that some additional validation we'd applied to document hashes had falsely identified some old URLs as invalid, and updated the validation to correctly account for those edge cases.
* We noticed that it was not possible to use arrow keys to navigate within some inputs in the drive, and fixed the issue.
* We also realized that some values were not correctly initialized for new accounts, and restored the intended behaviour.
* We've added a clientside migration to users' accounts to remove some duplicated values, making drives take up slightly less space over time.

# Raccoon release (v2.17.0)

## Goals

For this release we planned to resolve issues discovered in our beta release of encrypted spreadsheets, work towards providing an easier experience for contributors who wish to translate CryptPad, and resolve some minor usability issues that had been bothering us.

## Update notes

* This release introduces a new clientside dependency. Run `bower update` to install `requirejs-plugins`.
* We investigated using [Weblate](https://weblate.org/) for translating CryptPad, but in order to do so we have to migrate from our current translation format (Javascript files) to JSON. Administrators running recent version of CryptPad shouldn't have any trouble using the new system as long as they have not modified their translation files directly. Extensions to the translation dictionaries present in `/customize/translations/` should continue to work as expected. Anyone experiencing difficulty upgrading from older version of CryptPad to 2.17.0 can visit our chat channel for advice on how to proceed.

## Features

* We've received some updates from some of our German-speaking contributors to our Deutsch translation.
* We now perform more strict validation for the secret values encoded after the hash, since one of our users discovered that CryptPad failed silently when provided with an invalid hash.
* As requested, the CryptDrive now displays a lock icon for password protected pads.
* When you click 'Show in folder' from the _search_ or _recent pads_ interface, the selected file will be at the top of the screen. Previously the file was selected, but we didn't scroll to its location in the resulting folder, so it could be out of view if that folder had many files.
* We've tweaked the styles of some of the rendered Markdown in both our code and slide editors.
* Finally, we've added the same _pad creation screen_ to our spreadsheet editor as is normally present within our other editors. This will allow users to mark a spreadsheet as _owned_ (allowing them to delete it at a later time) and as having a pre-set expiration time.

## Bug fixes

* Very long words and lines are now wrapped correctly in the Kanban app.
* The rest of the bug fixes for this release were all applied to the spreadsheet editor:
  * Spreadsheets with additional worksheets were prone to errors caused when some clients did not receive instructions to update the identifier for a worksheet. This caused those spreadsheets to fail to load entirely.
  * We have added two buttons to the spreadsheet editor's app toolbar:
    * a _properties_ button like those on our other editors, to provide basic information about the document
    * an _import_ button, to process exported documents. Unlike our other import buttons, the spreadsheet editor is currently limited to importing when you are the only editor present in the session.
  * We've resolved some errors in how the history of a spreadsheet was counted against user quotas. Similarly, we've made sure to delete some extraneous information associated with spreadsheets when they are deleted from users' CryptDrives.
  * In the event of a server error, the spreadsheet editor will lock itself and proceed in read-only mode

# Quokka release (v2.16.0)

## Goals

We set aside an additional week for this release in order to deploy _encrypted spreadsheets_, which we've been working toward for a long time.
This feature combines our usual focus on privacy with OnlyOffice's spreadsheet editor.

At least for this first release we're still considering this functionality to be **highly experimental**.
We've done our best to make this new application fun and easy to use, however, it will still require a lot of work before it supports all the features that you can expect from our other editors.
We welcome you to try it out and report any difficulties you encounter, though you may want to wait before you start using it for all your financial documents.

## Update notes

* OnlyOffice requires more lax Content Security Policy headers than the rest of the platform. Compare your configuration against `config.example.js`.
* If you are running a customized `application_config.js`, you may need to update `availablePadTypes` and `registeredOnlyTypes`. See [the wiki](https://github.com/cryptpad/cryptpad/wiki/Application-config) for more details.
* In addition to a few serverside changes for the new spreadsheet editor, this release fixes a bug that affected system administrators who had set custom limits for some users and disabled communication with our payment server. Restart your server after updating for these changes to take effect.

## Features

* We've implemented a feature we call _ephemeral channels_, which we use for displaying other users' cursors in our rich text, code, and slide editors. Ephemeral channels behave exactly like our regular server messaging infrastructure except that no history is stored.
* We've added additional highlighting modes in our code editor for C, C++, Java, and Objective-C
* We've imposed a limit of five items for the table which displays upload progress, in order to keep it from taking up too much space on the screen when users upload many files in one session.

## Bugfixes

* [@3n2pS3P5kG23S96yxRbUHAZajuH2F](https://github.com/3n2pS3P5kG23S96yxRbUHAZajuH2F) reported an issue shortly after our last release which threw an error if our feedback API was disabled. The fix was on our master branch, but now it will be properly tagged.
* We noticed an issue in our code editor where imported .md files were interpreted as text, instead of markdown. This caused the preview pane to stop working.
* We also discovered an issue which had broken our CryptDrive import function, but as far as we know it did not affect any users. It should be working as intended now.
* Unfortunately, we don't do a lot of testing on Internet Explorer 11, but one of our users was kind enough to report an error. We tracked down a few uses of APIs which do not exist on IE11, and replaced them with compatible functions, so now users of IE11 will be able to enjoy CryptPad once more.

# Pademelon release (v2.15.0)

## Goals

For this release we planned to improve upon last release's introduction of the display of other users' cursors in our code and slide editors by adding the same functionality to our rich text editor.

Beyond just producing software, the CryptPad team has also begun to produce peer-reviewed papers.
We have previously published [Private Document Editing with Some Trust](https://dl.acm.org/citation.cfm?doid=3209280.3209535) as a part of the 2018 proceedings of the ACM Symposium on Document Engineering.
We have recently been accepted for publication as a part of [HCI-CPT](http://2019.hci.international/hci-cpt): the first international conference on HCI (Human Computer Interaction) for cybersecurity, privacy and trust.
In preparation for this publication we've begun to collect additional usage data in order to inform the wider community of our findings regarding usability of cryptography-based collaboration systems.

## Update notes

* Updating to version 2.15.0 from 2.14.0 should only require that update to the latest clientside code via git, and update any cache-busting parameters you've set.
* Several of our third-party clientside dependencies have been updated, and you may optionally run `bower update` to receive their latest versions.
* As explained above, we have added a number of new keys to our existing feedback system. The new keys are detailed below
  * HOME_SUPPORT_CRYPTPAD informs us when users discover our opencollective campaign from the CryptPad home page
  * UPGRADE_ACCOUNT informs us when someone clicks the upgrade account button from their CryptDrive or settings page
  * SUPPORT_CRYPTPAD is not active on our CryptPad instance, since this key is only sent when clicking the _donate button_ which is shown when upgraded accounts are disabled
  * DELETE_ACCOUNT_AUTOMATIC informs us when somebody deletes their account automatically from the settings page. Automatic account deletion is only available for accounts created since version 1.29.0
  * DELETE_ACCOUNT_MANUAL informs us when a user generates the proof of their account ownership which is required for manual account deletion. This feature is available only for accounts predating version 1.29.0
  * OWNED_DRIVE_MIGRATION informs us when a user migrates their CryptDrive from our legacy format (which does not support automatic deletion) to our newer format (which does) via the settings page
  * PASSWORD_CHANGED informs us when a user changes their password from the settings page
  * NO_WEBRTC informs us when a users browser does not support WebRTC at all via a crude test which never actually runs any WebRTC-based code
  * SUBSCRIPTION_BUTTON informs us when a user navigates to our paid account administration panel from their settings page
  * LOGOUT_EVERYWHERE informs us when a user executes the command to log out of their account on all remote devices from the settings page
* We've implemented the ability to configure which applications are available on a particular CryptPad instance via `cryptpad/customize/application_config.js`. Two arrays (`config.availablePadTypes` and `config.registeredOnlyTypes`) define which applications are available to everyone, and which applications are available to registered users. Due to a bug which was discovered, this behaviour is incorrect for our encrypted file viewer, and as a result encrypted files cannot currently be disabled. This will be addressed in our next release.

## Features

* Our rich text editor now displays other users' cursors when editing with a group. Preferences for this behaviour can be defined via the settings page.
* Links in our rich text editor can now be clicked more easily, as a small tooltip with a clickable link will be displayed above the editable link in the document.
* Users who wish to be notified of spelling errors in their rich text pads can enable spellcheck via the settings page.
* As noted above, various pad types can be disabled by instance administrators via `customize/application_config.js`.
* We've enabled a feature in the settings page which will migrate users' CryptDrive from our legacy format to our latest format (which supports automatic deletion). Only users with accounts dating back to version 1.29.0 will notice any difference.
* We've worked to improve some usability issues presented by the interaction of _owned files_ and _shared folders_. Since only the owner of an owned document can delete it the owner must keep a record of that document in their CryptDrive even if they place it in a shared folder (where someone else could delete it while they are offline). As such, owned documents were always copied to shared folders instead of being moved, and this proliferation of copies made it more difficult for users to organize their CryptDrives. Duplicated owned documents which are kept in your CryptDrive can now be hidden via the settings page. If those files are removed from a shared folder by another user, the hidden duplicate will be revealed in the root of your CryptDrive's tree.
* Finally, we've implemented the ability to copy documents to multiple shared folders via an entry in the right-click menu for any such document.

## Bugfixes

* We've improved the styles for displaying other users' cursors in the code and slide editors to avoid moving your view of the text when someone else highlights it.
* We've also changed some of the logic for how often other users' cursors are updated and displayed, so as to maximize the accuracy of their position and not show incorrect placements while you are typing.
* We fixed a bug which caused errors while loading your CryptDrive after a shared folder had been deleted.

# Opossum release (v2.14.0)

## Goals

For this release we chose to focus on our in-pad chat functionality and the ability to show your cursor's position to other users in the same pad.

## Update notes

* We've released an updated version of a serverside dependency: `chainpad-server`
  * this addresses a recently introduced bug which is capable of sending more history than clients require under certain circumstances
  * to use this updated dependency, run `npm update` and restart your server

## Features

* Our code editor is now capable of displaying other user's cursors within your view of the document.
  * this is enabled by default, but you can choose not to share your own cursor, and to disable the display of other users' cursors in your document
  * your initial color is chosen randomly, but you can choose any color you like within the settings page alongside the other configuration options for cursors
* After some consideration, we have chosen to change the permissions around the chat functionality embedded within every pad.
  * previously we had allowed viewers to participate in chat, even though they could not change the document.
  * we decided that this was counter-intuitive
  * in the event of an XSS vulnerability it could be used as a vector for privilege escalation
  * as such, we have modified our embedded chat functionality to only allow editors to participate
  * this change is not backwards-compatible, and so the embedded chat boxes will have dropped their older history
    * our assumption is that this will be an improvement for the majority of our users, and that it's fairly safe to drop older history given that chat is a relatively new feature
    * if this has affected you in an adverse way, the information is still accessible, and you can contact us if you need a way to recover that information
* Finally, it is now possible to print the rendered markdown content in our code editor, thanks to a contribution from [@joldie](https://github.com/joldie)

# Numbat release (v2.13.0)

## Goals

This release features long-awaited improvements to our Rich Text Pad.
This work was done over a short period, and we're releasing it now so that users can take advantage of the improvements as soon as possible.

## Update notes

* We've fixed a bug related to chat via an update to our messaging server. To install the update, run `npm update`. This server improvement is backwards compatible, so you can update your clientside or serverside dependencies in either order. Restart your server for the changes to take effect.
* You can run `bower update` in order to take advantage of the latest clientside dependencies. Depending on when you last updated you may benefit from updates to Codemirror or some other clientside libraries.

## Features

* We've refactored a great deal of CryptPad's Remote Procedure Call mechanisms related to chat. This should simplify CryptPad and make potential bugs less likely to occur.

## Bugfixes

* The behaviour of the cursor in our rich text editor has been greatly improved. Your experience when collaboratively editing should be noticeably better.
* Characters inserted into rich text pads were sometimes dropped due to a race condition between CKEditor and ChainPad, but this asynchronous behaviour has been resolved. As such the editor should be much more reliable.
* Deleting chat history from the server now removes it from your chat interface and that of remote messengers, where it previously would require a reload of the interface to see the correct chat history.
* We now correctly set owners of a shared chat channel such that either chat participant in a one-to-one room can delete the history.
* If you request history with a `lastKnownHash` which is not in the history, the server informs you that it is not there via a direct message. Clients fall back to a classic full retreival of the history. Previously this would fail, and print a message to the server's stdout.
* Firefox users may have noticed that when they clicked the dropdown menus for styles in the CKEditor toolbar, their scrollbar would jump to the top of the document. Their scroll position is now preserved in cases where it would previously have been disrupted.

# Manatee release (v2.12.0)

## Goals

For this release we aimed to address usability concerns in our Rich Text Pad, since it's our most widely used application. During this time we also received an unexpected security disclusure which we treated as being top priority.

## Update notes

* This release addresses an XSS vulnerability in our chat interface which was discovered thanks to [cyberpunky](https://twitter.com/cyberpunkych). In older versions of CryptPad, only the /contacts/ app was affected. In newer versions which feature the embedded chat interface in pads, it is possible to leverage this vulnerability against other users in the same pad. Due to our [Sandboxed iframe technique](https://blog.cryptpad.fr/2017/08/30/CryptPad-s-new-Secure-Cross-Domain-Iframe/), this vulnerability does not permit an attacker to compromise concurrent editor's accounts, as their user keys are never accessible within the scope of the domain which was subject to exploitation. However, since the chat functionality is available to viewers as well as editors, it could be leveraged to gain access to the keys which permit modification of the document. Despite this limitation, creative attackers could leverage the front-end code to perform phishing attacks, or other forms of social engineering to trick users into handing over their credentials.  We recommend that administrators of affected CryptPad instances upgrade to this version as soon as possible. Once more, we'd like to thank _cyberpunky_ for their effort to discover the issue, and for reporting the issue to us in private so that we could fix it without putting our users at risk.
* On a lighter note, this release features a server-side dependency update which fixes a non-critical bug in our websocket protocol. New users joining a channel which had never been vacated by all its users since its creation would receive the full history instead of only the latest state. To deploy the fix, run `npm update` and restart your server.

## Bugfixes

* As noted above, this release fixes an XSS vulnerability.
* We realized that each shared-folder in your CryptDrive was using a separate websocket connection to the server instead of routing over the existing websocket connection. This has been fixed.
* We've improved our _cursor-recovery script_ in the Rich Text Pad app to make it more resilient. In cases where the text changed in two places within one node of the document, your cursor could be displaced. It should behave more predictably now.
* Another problem in the Rich Text Pad app could lead to conflicts between users when one reverted the change of another. Conflicts should now resolve in a predictable fashion.
* If you were using the Rich Text Pad in its reduced-width mode (available via your /settings/ page), it was possible to scroll down beyond the white, paper-like styles of the document into an un-styled area of the page. This has been addressed.
* We discovered that the export functionality for Rich Text Pads was not working due to a semantic difference in a conditional test in Chrome. Export within Chrome should work once more, however, there are [serious privacy risks within Chrome/Chromium](https://reddit.com/r/ProtonMail/comments/9yl94k/never_connect_to_protonmail_using_chrome/) and we recommend that you consider using a more privacy-friendly browser.

## What's new

* The home page now features a badge advertising the fact that CryptPad is now a winner of the NGI award for _Privacy and Trust-enhanced technologies_. You can follow the link to our blog post which contains more information.
* It is now possible to directly download uploaded files from your CryptDrive without opening a new tab, making your content available more quickly.

# Lemur release (v2.11.0)

## Goals

This release continued the work on better customization features for community instances. We also worked on usability improvements and UI issues.

## Update notes

* This is a simple release. Just download the latest commits and update your cache-busting string.
* Customized instances may require additionnal changes in order to make customization easier to maintain in the future.
  * The static pages content (home page, FAQ, contact, privacy, etc.) has been moved from `./customize.dist/pages.js` to a `./customize.dist/pages/` directory, containing one file per page. This new structure allows administrators to override only some pages instead of all the pages at once.
  * To override a page, just make a copy of its .js file from `./customize.dist/pages` to a `./customize/pages` and make your changes.

## Features

* We've replaced our Font Awesome application icons with new custom icons. The new icons should be closer to the goals of the apps.
* We've cancelled the Ctrl+S shortcut from the browser for saving the page. In CryptPad, the result of the browser save was not usable and the content of the pads is automatically saved.
* As explained above, we've made it easier to customize some specific static pages instead of overriding all of them.
* Our Markdown renderer should display tables in a nicer and cleaner way (*Code* and *Slide* applications).
* The font size in the code and slide editors can now be changed from the *Settings* page.
* We've added a warning text to the CryptDrive export feature from the last release.

## Bugfixes

* We've found an issue causing some deleted characters to be inserted back in the document. It could happen when a least one member of the session had the tab not focused in their browser.
* We've fixed an issue with our code for detecting small (or zoomed) screens in several part of our UI. This will hide some unnecessary elements of the interface at first load and free space for the actual content of the pad.
* The "present" mode in the Slide application will no longer display the toolbar.
* We've fixed an issue in the *Pad* application where the font could be reset to Arial when making a new paragraph.
* The full CryptDrive export no longer stops when trying to export a very old poll.

# Koala release (v2.10.0)

## Goals

This release continued to improve our _shared folder_ functionality, addressed user concerns about data portability, and implemented various features for customization for different CryptPad instances.

## Update notes

* This release features updates to client-side dependencies. Run `bower update` to update the following:
  * netflux-websocket
  * chainpad-netflux
* we've added a new field (`fileHost`) in `config.example.js`. It informs clientside code what domain they should use when fetching encrypted blobs.
* Administrators can now do more to customize their CryptPad server, most notably via the ability to override specific translations. For example, the home page now features a short message which, by default, says that the server is a community-hosted instance of the CryptPad open-source project. On CryptPad.fr, we have replaced this text to talk about our organization. You can do the same by modifying files in `cryptpad/customize/translations/`, like so:

```
define(['/common/translations/messages.js'], function (Messages) {
    // Replace the existing keys in your copied file here:
    Messages.home_host = "CryptPad.fr is the official instance of the open-source CryptPad project. It is administered by XWiki SAS, the employee-owned French company which created and maintains the product.";

    return Messages;
});
```

Simply change the text assigned to `home_host` with a blurb about your own organization. We'll update the wiki soon with more info about customization.

### Features

* We've updated our features page to indicate what users get by purchasing a premium account. You can visit our accounts page directly from this list with the click of a button.
* We've updated our home page to explain more about what CryptPad is.
* As mentioned above, we've made all of our translation files overrideable.
* We've made it easier to get your data out of CryptPad, by implementing a complete export of your CryptDrive's content as a zip file. This feature is available on the _settings page_.
* Shared folders now support password protection.

### Bugfixes

* We fixed an issue which affected users of our Kanban application, which caused the color picker to pop up and get in the way at inopportune moments.
* We found that when a CryptPad code editor tab finished loading in the background, when it was focused, the markdown preview pane would be blank. We've added a check to try to re-draw the pane in these circumstances.
* We noticed that anonymous users who used our in-pad chat app could not be distinguished when they both chatted at once. We now add a string at the end of their name which makes it possible to distinguish them.
* We've updated an internal library (cryptget) such that it correctly tears down realtime sessions after connecting and loading content from the server.
  * We also added better error handling.
* At some point in the last few releases we broke export of media-tags in rich text pads. They should be back to normal now.
* Media-Tags also use the configurable value `fileHost` to construct absolute URLs, instead of using relative URLs to the server.
* Tall dropdown menus no longer use scrollbars when they are displayed with enough space to display all options.
* Chrome browser seemed to display our rich text editor correctly, except that no cursor was visible in empty documents. Users will now be able to see where their cursor is placed.
* It was possible for disconnected users' browsers to enter a bad state after reconnecting. This resulted in that pad being inaccessible until they relaunched their browser. This bad state is now detected and mitigated.
* Tags for documents in the CryptDrive were stopped functioning correctly as of the last few releases. This release fixes this bug.

# Jerboa release (v2.9.0)

## Goals

Since last release introduced several big features, this release was allocated towards usability improvements largely related to those new features.

## Update notes

This is a simple release. Just deploy the latest source.

### Features

* At a user's request, we now highlight annotated code blocks according to their language's syntax
* Shared folders can now be viewed by unregistered users (in read-only mode)
* The authentication process that we use for handling accounts has been improved so as to tolerate very slow networks more effectively
* The chat system embedded within pads can now optionally use the browser's system notifications API

### Bugfixes

* We found and fixed a race condition when initializing two tabs at once, which could leave one of the tabs in a broken state

# Ibis release (v2.8.0)

## Goals

We've been making use of some hidden features for a while, to make sure that they were safe to deploy.
This release, we worked on making _contextual chat_ and _shared folders_ available to everyone.

## Update notes

* run `bower update` to download an updated version of _marked.js_

### Features

* Our kanban application now features a much more consistent and flexible colorpicker, thanks to @MTRNord (https://github.com/MTRNord)
* File upload dialogs now allow you to upload multiple files at once
* Updated German translations thanks to [b3yond](https://github.com/b3yond/)
* An explicit pad storage policy to better suit different privacy constraints
  * _import local pads_ at login time is no longer default
* An embedded chat room in every pad, so you can work alongside your fellow editors more easily
* Promotion of our [crowdfunding campaign](https://opencollective.com/cryptpad), including a button on the home page, and a one-time dialog for users

### Bug fixes

* Updating our markdown library resolved an issue which incorrectly rendered links containing parentheses.
* We discovered an issue logging in with _very old_ credentials which were initialized without a public key. We now regenerate your keyring if you do not have public keys stored in association with your account.
* We found another bug in our login process; under certain conditions the terminating function could be called more than once.

# Hedgehog release (v2.7.0)

## Goals

This release overlapped with the publication and presentation of a paper written about CryptPad's architecture.
As such, we didn't plan for any very ambitious new features, and instead focused on bug fixes and some new workflows.

## Update notes

This is a fairly simple release. Just download the latest commits and update your cache-busting string.

### Features

* In order to address some privacy concerns, we've changed CryptPad such that pads are not immediately stored in your CryptDrive as soon as you open them. Instead, users are presented with a prompt in the bottom-right corner which asks them whether they'd like to store it manually. Alternatively, you can use your settings page to revert to the old automatic behaviour, or choose not to store, and to never be asked.
* It was brought to our attention that it was possible to upload base64-encoded images in the rich text editor. These images had a negative performance impact on such pads. From now on, if these images are detected in a pad, users are prompted to run a migration to convert them to uploaded (and encrypted) files.
* We've added a progress bar which is displayed while you are loading a pad, as we found that it was not very clear whether large pads were loading, or if they had become unresponsive due to a bug.
* We've added an option to allow users to right-click uploaded files wherever they appear, and to store that file in their CryptDrive.
* We've improved the dialog which is used to modify the properties of encrypted media embedded within rich text pads.

### Bug fixes

* Due to a particularly disastrous bug in Chrome 68 which was unfortunately beyond our power to fix, we've added a warning for anyone affected by that bug to let them know the cause.
* We've increased the module loading timeout value used by requirejs in our sharedWorker implementation to match the value used by the rest of CryptPad.

# Gibbon release (v2.6.0)

## Goals

For this release we focused on deploying two very large changes in CryptPad.
For one, we'd worked on a large refactoring of the system we use to compile CSS from LESS, so as to make it more efficient.
Secondly, we reworked the architecture we use for implementing the CryptDrive functionality, so as to integrate support for shared folders.

## Update notes

To test the _shared folders_ functionality, users can run the following command in their browser console:

`localStorage.CryptPad_SF = "1";`

Alternatively, if the instance administrator would like to enable shared folders for all users, they can do so via their `/customize/application_config.js` file, by adding the following line:

`config.disableSharedFolders = true;`

### Features

* As mentioned in the _goals_ for this release, we've merged in the work done to drastically improve performance when compiling styles. The system features documentation for anyone interested in understanding how it works.
* We've refactored the APIs used to interact with your CryptDrive, implementing a single interface with which applications can interact, which then manages any number of sub-objects each representing a shared folder. Shared folders are still disabled by default. See the _Update notes_ section for more information.
* The home page now features the same footer which has been displayed on all other information pages until now.
* We've added a slightly nicer spinner icon on loading pages.
* We've created a custom font _cp-tools_ for our custom-designed icons

### Bug fixes

* We've accepted a pull request implementing serverside support for moving files across different drives, for system administrators hosting CryptPad on systems which segregate folders on different partitions.
* We've addressed a report of an edge case in CryptPad's user password change logic which could cause users to delete their accounts.

# Fossa release (v2.5.0)

## Goals

This release took longer than usual - three weeks instead of two - due to our plans involving a complete redesign of how login and registration function.
Any time we rework a critical system within CryptPad we're very cautious about deploying it, however, this update should bring considerable value for users.
From now on, users will be able to change their passwords without losing access to their old data, however, this is very different from _password recovery_.
While we will still be unable to help you if you have forgotten your password, this update will address our inability up until this point to change your password in the event that it has been compromised in some way.

## Update notes

* v2.5.0 uses newly released features in a clientside dependency ([chainpad-netflux](https://github.com/xwiki-labs/chainpad-netflux/releases/tag/0.7.2)). Run `bower update` to make sure you have the latest version.
* Update your server config to serve /block/ with maxAge 0d, if you are using a reverse proxy, or docker. `cryptpad/docs/example.nginx.conf` has been updated to include an example.
* Restart your server after updating.
* We have added a new feedback key, `NO_CSS_VARIABLES`, in order to diagnose how many of our clients support the CSS3 functionality.

### Features

* v2.5.0 introduces support for what we have called _modern users_.
  * New registrations will use the new APIs that we've built to facillitate the ability to change your account password.
  * _Legacy registrations_ will continue to function as they always have.
  * Changing your password (via the settings page) will migrate old user accounts to the new system.
  * We'll publish a blog post in the coming weeks to explain in depth how this functionality is implemented.
* The _kanban_ application now features support for export and import of your project data.
* This release features minor improvements to the _Deutsch_ translation

### Bug fixes

* We noticed that if you entered credentials for registration, and cancelled the displayed prompt informing you that such a user was already registered, the registration interface would not unlock for further interaction. This has been fixed.
* We found that on very slow connections, or when users opened pads in Firefox without focusing the tab, requirejs would fail to load dependencies before timing out. We've increased the timeout period by a factor of ten to address such cases.

# Echidna release (v2.4.0)

## Goals

For version 2.4.0 we chose to use our time to address difficulties that some users had, and to release some features which have been in development for some time. With the recent release of the _password-protected-pads_ feature, some users desired to be able to change the passwords that they'd already set, or to add a password to a pad retroactively. Other users wanted to recover information that had accidentally been deleted from their pads, but found that the history feature was difficult to use on networks with poor connectivity. Others still found that loading pads in general was too slow.

## Update notes

* We have released new clientside dependencies, so server administrators will need to run `bower update`
* This release also depends on new serverside dependencies, so administrators will also need to run `npm update`
* This release (optionally) takes advantage of Webworker APIs, so administrators may need to update their Content Security Headers to include worker-src (and child-src for safari)
  * see cryptpad/docs/example.nginx.conf for more details regarding configuration for nginx as a reverse proxy
  * to enable webworkers as an experimental feature, add `AppConfig.disableWorkers = false;` to your `cryptpad/customize/application-config.js`
* Finally, administrators will need to restart their servers after updating, as clients will require new functionality

## What's new

### Features

* CryptPad now takes advantage of some very modern browser APIs
  * Shared Workers allow common tasks for all CryptPad editors to be handled by a single background process which runs in the background. This results in better performance savings for anyone using multiple editors at once in different tabs
  * Webworkers are used in situations where shared workers are not supported, for most of the same tasks. They are not shared amongst different tabs, but can allow for a more responsive user experience since some heavy commands will be run in the background
  * Not all browsers feature complete support for webworkers. For cases where they are not supported at all, or where cryptographic APIs are not supported within their context (https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/7607496/), we fall back to an asynchronous context in the same thread
* Pads with no password can now be updated to include a password, and pads with a password can have their passwords changed
  * right-click on the pad in question, and see its properties. The following dialog will present the option to change its password
  * changing a pad's password will remove its history
* Accessing a pad's history used to require that clients fetch the entire history of the pad before they could view any of it. History retrieval is now done on an on-demand basis, approximately 100 versions of the pad at a time
  * this also features an updated UI with a slider
* We've refactored our whiteboard application to be compatible with our internal framework. As a result, it will be easier to maintain and will have all the same features as the other editors built with the same framework
* We've defined some new server-side features which will allow clients to change their user passwords in a coming release
* We've updated our messaging server implementation
  * the aspect of the server which stores and distributes history has been untangled from the aspect which tracks user lists and broadcasts messages
  * the server will now store the time when each message was received, so as to be able to allow users to view the time of edits in a later release

### Bug fixes

* When a user tries to register, but enters credentials which have already been used for that CryptPad instance, we prompt them to log in as that user. We discovered that the login had stopped working at some point. This has been fixed
* Server administrators may have seen warnings from npm when attempting to update. We have fixed invalid entries and added missing entries where appropriate such that there are no more warnings
* Static info pages have been restyled to be more responsive, thanks to @CatalinScr
* Support for friend requests in pads with version 0 hashes has been repaired
* We noticed a regression in how default titles for pads were suggested, and have implemented the intended behaviour

# Donkey release (v2.3.0)

## Goals

For this release we wanted to deploy some new features related to our encrypted file functionality.

## Update notes

* new clientside dependencies. run `bower update`
* new serverside APIs. Restart your server

## What's new

### Features

* When uploading files to your CryptDrive or a pad, users will now be prompted to protect the file with a password (in addition to some random data)
  * this adds an additional layer of security in case a third party gains access to the file's link, but not the password.
* Users are also able to claim an encrypted file as their own, allowing them the option to delete it from the server at a later date.
* We've refactored the Media-Tag library to be much smaller and easier to use.

### Bug fixes

* When setting a title for a pad which was created from a template, titles were not correctly inferred from the content of a document. This has been fixed.
* We discovered that users who had installed _AdBlock Plus_ and configured it to **Block social media icons tracking** were unable to use the _share menu_ to construct alternative links to the same pad, but with different attributes. We have worked around the problem.
* Admins who had configured their CryptPad instance to use custom icons for applications in the CryptDrive may have noticed that the same icons were not used on the home page. We've fixed this such that the same icons will be used everywhere
* We have also updated the icon for the Kanban app to a more appropriate symbol
* We found that the download button in the _file_ app was downloading the user's avatar, instead of the correct encrypted file embedded in the page. We've since fixed this

# Coati release (v2.2.0)

## Goals

For this release we wanted to continue our efforts towards improving CryptPad usability. We've also added a new Kanban application which was in its final stage for quite some time.

## What's new

### Features

* We've added a new kanban application!
  * You can create boards, add items to those boards and move items from one board to another.
  * It includes almost all the features seen in the other apps: templates, password protection, history, read-only, etc.
  * Kanban can be shared and used collaboratively.
  * This new app was prototyped by @ldubost, and based on [jkanban](https://github.com/riktar/jkanban) by @riktar
* We've improved our tagging feature.
  * When you want to add tags to a pad, you will see suggestions based on the tags you've already used
  * There is a new *Tags* category in CryptDrive for logged in users. It shows all the tags you've used in your pads and their number of use.
* In the Poll application, the line where your cursor is located will be highlighted so that you can see easily which option you're looking at.

### Bug fixes

* We've fixed two interface bugs in the Share menu which made it difficult to change the access rights for the link (edit or read-only) in some cases.
* A bug introduced in the previous version prevented loading of the drive if it contained some content from an alpha version of CryptPad.
* Some parts of our UI were using CSS values not supported by all browsers.
* Some pads created more than one year ago were not loading properly.

# Badger release (v2.1.0)

## Goals

This is a small release due to a surplus of holidays in France during the Month of May.
We'd been planning to implement _Password-protected Pads_ for a long time, but we had not found a good opportunity to do so within our roadmap.
After a generous donation from one of our users who considered this a critical feature, we were able to dedicate some resources towards delivering it to all of our users.

## Update notes

This release depends on new APIs in our `chainpad-crypto` module. Additionally, we have fixed a critical bug in `chainpad-listmap`.
Admins will need to update their clientside dependencies with `bower update` when deploying.

## What's new

### For Users

* Users can now protect their new pads with a password.
  * This makes it safer to share very sensitive links over email or messengers, as anyone who gains access to the link will still need the password to edit or view pads.
  * This also protects your pads against browsers which share your history across devices via the cloud.
  * We recommend that you share passwords using a different messenger tool.
  * Passwords cannot be set or changed after creation time (yet), so we also recommend you consider how secure your pad will need to be when you create it.
* Password protection coincides with an update to our URL encoding scheme. URLs are generally quite a bit shorter than before, while offering more functionality.
* Existing users will have a short delay the first time that they load this version of CryptPad, as it contains a migration of their CryptDrive's data format.
  * This migration is very tolerant of interuptions, so if you need to close your browser while it is in progress, you are free to do so.

### For Admins

* Admins can look forward to happier users!

### Bug fixes

* data loss when reconnecting in our poll app
* we've fixed a minor bug in our poll app which caused an increasing number of tooltips to be added to elements

# Alpaca release (v2.0.0)

This is the first release of our 2.0 cycle.

After careful consideration we've decided to name each release in this cycle after a cute animal, iterating through the letters of the Latin alphabet from A to Z.

## Goals

We wanted to update CryptPad's appearance once more, adopting the colors from our logo throughout more of its interface.

## Update notes

This release coincides with the introduction of new APIs in ChainPad, so we recommend that adminstrators update their clientside dependencies by running `bower update`.

As recent updates have updated serverside dependencies, we also recommend that you run `npm update` and _restart your server_.

## What's new

### For Users

* CryptPad 2.0.0 features a complete German-language translation, thanks to contributions from @polx, @kpcyrd, and @micealachman
* CryptPad has a new look!
  * we've adopted the color scheme of our logo for more UI elements throughout CryptPad, on the loading screen and various dialogs
  * we've customized our checkboxes and radio buttons to match
  * we've updated the look of our pad creation screen to feature up to four templates per page, with tab and button navigation
  * tooltips have been made to match the dialogs on our pad creation screen
  * clients now store their usage of various templates in their CryptDrive, and rank templates by popularity in the pad creation screen
  * we no longer show usage tips on the loading screen
* Users who visit pads which have been deleted or otherwise do not exist are now prompted to redirect to their home page
* Our poll and whiteboard apps now use an in-house CSS framework to help us maintain consistency with the other applications

### For Admins

* we've updated the example configuration file (`config.example.js`) to no longer require a leading space before the domain, as we found it to be a common source of confusion. This will only affect newly generated config files.
* our webserver has been configured to support HTTP access of the client datastore, to facilitate scripts which parse and decrypt history without having to go through our websocket infrastructure
* we no longer use a single image for our favicon and our loading screen icon, allowing admins to customize either feature of their instance independently
* We've also moved the rest of the styles for the loading screen from `/common/` into `/customize.dist/`,
* move loading screen implementation from `/common/` to `/customize.dist/`

## Bug fixes

* don't eat tab presses when focused on register button
* idempotent picker initialization
* CKEditor fixes
  * drag and drop text
  * media-tag movement integrated as CKEditor plugin
  * avoid media-tag flicker on updates
* set content type for the 404 page

# 1.29.0

## Goals

For this release we wanted to direct our effort towards improving user experience issues surrounding user accounts.

## Update notes

This release features breaking changes to some clientside dependencies. Administrators must make sure to deploy the
latest server with npm update before updating your clientside dependencies with bower update.

## What's new

* newly registered users are now able to delete their accounts automatically, along with any personal
  information which had been created:
  * ToDo list data is automatically deleted, along with user profiles
  * all of a user's owned pads are also removed immediately in their account deletion process
* users who predate account deletion will not benefit from automatic account deletion, since the server
  does not have sufficient knowledge to guarantee that the information they could request to have deleted is strictly
  their own. For this reason, we've started working on scripts for validating user requests, so as to enable manual
  deletion by the server administrator.
  * the script can be found in cryptpad/check-account-deletion.js, and it will be a part of an ongoing
    effort to improve administrator tooling for situations like this
* users who have not logged in, but wish to use their drive now see a ghost icon which they can use to create pads.
  We hope this makes it easier to get started as a new user.
* REGistered users who have saved templates in their drives can now use those templates at any time, rather than only
  using them to create new pads
* we've updated our file encryption code such that it does not interfere with other scripts which may be running at
  the same time (synchronous blocking, for those who are interested)
* we now validate message signatures clientside, except when they are coming from the history keeper because clients
  trust that the server has already validated those signatures

## Bug fixes

* we've removed some dependencies from our home page that were introduced when we updated to use bootstrap4
* we now import fontawesome as css, and not less, which saves processing time and saves room in our localStorage cache
* templates which do not have a 'type' attribute set are migrated such that the pads which are created with their
  content are valid
* thumbnail creation for pads is now disabled by default, due to poor performance
  * users can enable thumbnail creation in their settings page
* we've fixed a significant bug in how our server handles checkpoints (special patches in history which contain the
  entire pads content)
  * it was possible for two users to independently create checkpoints in close proximity while the document was in a
    forked state. New users joining while the session was in this state would get stuck on one side of the fork,
    and could lose data if the users on the opposing fork overrode their changes
* we've updated our tests, which have been failing for some time because their success conditions were no longer valid
* while trying to register a previously registered user, users could cancel the prompt to login as that user.
  If they did so, the registration form remained locked. This has been fixed.
