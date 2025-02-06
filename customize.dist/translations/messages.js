// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/*
 * You can override the translation text using this file.
 * The recommended method is to make a copy of this file (/customize.dist/translations/messages.{LANG}.js)
   in a 'customize' directory (/customize/translations/messages.{LANG}.js).
 * If you want to check all the existing translation keys, you can open the internal language file
   but you should not change it directly (/common/translations/messages.{LANG}.js)
*/
define(['/common/translations/messages.js'], function (Messages) {
    // Replace the existing keys in your copied file here:
    // Messages.button_newpad = "New Rich Text Document";

    //NOTE: these keys are also added to the Kanban mobile UI PR #1727
    Messages.moveItemUp = 'Move item up'; // XXX
    Messages.moveItemDown = 'Move item down'; // XXX
    Messages.toggleArrows = 'Switch to arrow view'; // XXX
    Messages.toggleDrag = 'Switch to drag view'; // XXX

    return Messages;
});

