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
    Messages.home_host = "This instance is an alpha instance of CryptPad Meet, a version of CryptPad featuring a Zero Knowledge audio and video conferencing pad.";
    Messages.meet_home = "This service features an experimental end-to-end encrypted video and audio conferencing service";
    Messages.meet_warning = "WARNING ! While the plan is to have the same security features as for pads, the experimental conferencing service is not yet secure. The current transport is end-to-end encrypted but uses the same key for all conferences. All accounts and data on this server can be deleted at any time";
    Messages.main_catch_phrase = "CryptPad Meet - Alpha";
    Messages.meet = "Meet";
    Messages.button_newmeet = "New Meeting";
    return Messages;
});

