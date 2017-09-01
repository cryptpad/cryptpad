// This file defines all of the RPC calls which are used between the inner and outer iframe.
// Define *querys* (which expect a response) using Q_<query name>
// Define *events* (which expect no response) using EV_<event name>
// Please document the queries and events you create, and please please avoid making generic
// "do stuff" events/queries which are used for many different things because it makes the
// protocol unclear.
//
// WARNING: At this point, this protocol is still EXPERIMENTAL. This is not it's final form.
//   We need to define protocol one piece at a time and then when we are satisfied that we
//   fully understand the problem, we will define the *right* protocol and this file will be dynomited.
//
define({
    // When the iframe first launches, this query is sent repeatedly by the controller
    // to wait for it to awake and give it the requirejs config to use.
    'Q_INIT': true,

    // When either the outside or inside registers a query handler, this is sent.
    'EV_REGISTER_HANDLER': true,

    // Realtime events called from the outside.
    // When someone joins the pad, argument is a string with their netflux id.
    'EV_RT_JOIN': true,
    // When someone leaves the pad, argument is a string with their netflux id.
    'EV_RT_LEAVE': true,
    // When you have been disconnected, no arguments.
    'EV_RT_DISCONNECT': true,
    // When you have connected, argument is an object with myID: string, members: list, readOnly: boolean.
    'EV_RT_CONNECT': true,
    // Called after the history is finished synchronizing, no arguments.
    'EV_RT_READY': true,
    // Called from both outside and inside, argument is a (string) chainpad message.
    'Q_RT_MESSAGE': true,

    // Called from the outside, this informs the inside whenever the user's data has been changed.
    // The argument is the object representing the content of the user profile minus the netfluxID
    // which changes per-reconnect.
    'EV_METADATA_UPDATE': true,

    // Takes one argument only, the title to set for the CURRENT pad which the user is looking at.
    // This changes the pad title in drive ONLY, the pad title needs to be changed inside of the
    // iframe and synchronized with the other users. This will not trigger a EV_METADATA_UPDATE
    // because the metadata contained in EV_METADATA_UPDATE does not contain the pad title.
    'Q_SET_PAD_TITLE_IN_DRIVE': true,

    // Update the user's display-name which will be shown to contacts and people in the same pads.
    'Q_SETTINGS_SET_DISPLAY_NAME': true,

    // Log the user out in all the tabs
    'Q_LOGOUT': true,

    // When moving to the login or register page from a pad, we need to redirect to that pad at the
    // end of the login process. This query set the current href to the sessionStorage.
    'Q_SET_LOGIN_REDIRECT': true,

    // Store the editing or readonly link of the current pad to the clipboard (share button).
    'Q_STORE_LINK_TO_CLIPBOARD': true,

    // Use anonymous rpc from inside the iframe (for avatars & pin usage).
    'Q_ANON_RPC_MESSAGE': true,

    // Check the pin limit to determine if we can store the pad in the drive or if we should.
    // display a warning
    'Q_GET_PIN_LIMIT_STATUS': true,

    // Move a pad to the trash when using the forget button.
    'Q_MOVE_TO_TRASH': true,

    // Request the full history from the server when the users clicks on the history button.
    // Callback is called when the FULL_HISTORY_END message is received in the outside.
    'Q_GET_FULL_HISTORY': true,
    // When a (full) history message is received from the server.
    'EV_RT_HIST_MESSAGE': true,

    // Save a pad as a template using the toolbar button
    'Q_SAVE_AS_TEMPLATE': true,

    // Friend requests from the userlist
    'Q_SEND_FRIEND_REQUEST': true, // Up query
    'Q_INCOMING_FRIEND_REQUEST': true, // Down query
    'EV_FRIEND_REQUEST': true, // Down event when the request is complete

    // Set the tab notification when the content of the pad changes
    'EV_NOTIFY': true,

    // Send the new settings to the inner iframe when they are changed in the proxy
    'EV_SETTINGS_UPDATE': true,

    // Get and set pad attributes stored in the drive from the inner iframe
    'Q_GET_PAD_ATTRIBUTE': true,
    'Q_SET_PAD_ATTRIBUTE': true,

    // Open/close the File picker (sent from the iframe to the outside)
    'EV_FILE_PICKER_OPEN': true,
    'EV_FILE_PICKER_CLOSE': true,
    'EV_FILE_PICKER_REFRESH': true,
    // File selected in the file picker: sent from the filepicker iframe to the outside
    // and then send to the inner iframe
    'EV_FILE_PICKED': true,

    // Get all the files from the drive to display them in a file picker secure app
    'Q_GET_FILES_LIST': true,

    // File upload queries and events
    'Q_UPLOAD_FILE': true,
    'EV_FILE_UPLOAD_STATE': true,
    'Q_CANCEL_PENDING_FILE_UPLOAD': true,
});
