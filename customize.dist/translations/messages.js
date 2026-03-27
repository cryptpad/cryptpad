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
  
    Messages.form_maxResponses_setting = "Maximum responses";
    Messages.form_maxResponses_placeholder = "No limit";
    Messages.form_maxResponsesStr = "Limit: {0} responses";
    Messages.form_maxResponses_remove = "Unset limit";
    Messages.form_maxResponsesReached = "This form has reached the maximum number of responses and is now closed.";

    return Messages;
});

