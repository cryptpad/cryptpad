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

    // When an iframe is ready to receive messages
    'EV_RPC_READY': true,

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
    // Called when the server returns an error in a pad (EEXPIRED, EDELETED).
    'EV_RT_ERROR': true,
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
    // It also sets the page (tab) title to the selected title, unles it is overridden by
    // the EV_SET_TAB_TITLE event.
    'Q_SET_PAD_TITLE_IN_DRIVE': true,
    // Set the page title (tab title) to the selected value which will override the pad title.
    // The new title value can contain {title}, which will be replaced by the pad title when it
    // is set or modified.
    'EV_SET_TAB_TITLE': true,

    // Update the user's display-name which will be shown to contacts and people in the same pads.
    'Q_SETTINGS_SET_DISPLAY_NAME': true,

    // Log the user out in all the tabs
    'Q_LOGOUT': true,
    // Tell the user that he has been logged out from outside (probably from another tab)
    'EV_LOGOUT': true,

    // When moving to the login or register page from a pad, we need to redirect to that pad at the
    // end of the login process. This query set the current href to the sessionStorage.
    'Q_SET_LOGIN_REDIRECT': true,

    // Store the editing or readonly link of the current pad to the clipboard (share button).
    'Q_STORE_LINK_TO_CLIPBOARD': true,

    // Use anonymous rpc from inside the iframe (for avatars & pin usage).
    'Q_ANON_RPC_MESSAGE': true,

    // Get the user's pin limit, usage and plan
    'Q_PIN_GET_USAGE': true,

    // Write/update the login block when the account password is changed
    'Q_WRITE_LOGIN_BLOCK': true,

    // Remove login blocks
    'Q_REMOVE_LOGIN_BLOCK': true,

    // Check the pin limit to determine if we can store the pad in the drive or if we should.
    // display a warning
    'Q_GET_PIN_LIMIT_STATUS': true,

    // Move a pad to the trash when using the forget button.
    'Q_MOVE_TO_TRASH': true,

    // Request the full history from the server when the users clicks on the history button.
    // Callback is called when the FULL_HISTORY_END message is received in the outside.
    'Q_GET_FULL_HISTORY': true,
    'Q_GET_HISTORY_RANGE': true,
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

    // Get and set (pad) attributes stored in the drive from the inner iframe
    'Q_GET_ATTRIBUTE': true,
    'Q_SET_ATTRIBUTE': true,
    'Q_GET_PAD_ATTRIBUTE': true,
    'Q_SET_PAD_ATTRIBUTE': true,

    // Check if a pad is only in a shared folder or (also) in the main drive.
    // This allows us to change the behavior of some buttons (trash icon...)
    'Q_IS_ONLY_IN_SHARED_FOLDER': true,

    // Open/close the File picker (sent from the iframe to the outside)
    'EV_FILE_PICKER_OPEN': true,
    'EV_FILE_PICKER_CLOSE': true,
    'EV_FILE_PICKER_REFRESH': true,
    // File selected in the file picker: sent from the filepicker iframe to the outside
    // and then send to the inner iframe
    'EV_FILE_PICKED': true,

    // Get all the files from the drive to display them in a file picker secure app
    'Q_GET_FILES_LIST': true,

    // Template picked, replace the content of the pad
    'Q_TEMPLATE_USE': true,
    // Check if we have template(s) for the selected pad type
    'Q_TEMPLATE_EXIST': true,

    // File upload queries and events
    'Q_UPLOAD_FILE': true,
    'EV_FILE_UPLOAD_STATE': true,
    'Q_CANCEL_PENDING_FILE_UPLOAD': true,

    // Make the browser window navigate to a given URL, if no URL is passed then it will reload.
    'EV_GOTO_URL': true,
    // Make the parent window open a given URL in a new tab. It allows us to keep sessionStorage
    // form the parent window.
    'EV_OPEN_URL': true,

    // Present mode URL
    'Q_PRESENT_URL_GET_VALUE': true,
    'EV_PRESENT_URL_SET_VALUE': true,

    // Put one or more entries to the cache which will go in localStorage.
    // Cache is wiped after each new release
    'EV_CACHE_PUT': true,

    // Chat
    'EV_CHAT_EVENT': true,
    'Q_CHAT_COMMAND': true,
    'Q_CHAT_OPENPADCHAT': true,

    // Cursor
    'EV_CURSOR_EVENT': true,
    'Q_CURSOR_COMMAND': true,
    'Q_CURSOR_OPENCHANNEL': true,

    // Put one or more entries to the localStore which will go in localStorage.
    'EV_LOCALSTORE_PUT': true,
    // Put one entry in the parent sessionStorage
    'Q_SESSIONSTORAGE_PUT': true,

    // Merge the anonymous drive (FS_hash) into the current logged in user's drive, to keep the pads
    // in the drive at registration.
    'Q_MERGE_ANON_DRIVE': true,

    // Add or remove the avatar from the profile.
    // We have to pin/unpin the avatar and store/remove the value from the user object
    'Q_PROFILE_AVATAR_ADD': true,
    'Q_PROFILE_AVATAR_REMOVE': true,

    // Store outside and get thumbnails inside (stored with localForage (indexedDB) outside)
    'Q_THUMBNAIL_SET': true,
    'Q_THUMBNAIL_GET': true,

    // Settings app only
    // Clear all thumbnails
    'Q_THUMBNAIL_CLEAR': true,
    // Backup and restore a drive
    'Q_SETTINGS_DRIVE_GET': true,
    'Q_SETTINGS_DRIVE_SET': true,
    'Q_SETTINGS_DRIVE_RESET': true,
    // Logout from all the devices where the account is logged in
    'Q_SETTINGS_LOGOUT': true,
    // Import pads from this computer's anon session into the current user account
    'Q_SETTINGS_IMPORT_LOCAL': true,
    'Q_SETTINGS_DELETE_ACCOUNT': true,

    // Store the language selected in the iframe into localStorage outside
    'Q_LANGUAGE_SET': true,

    // Anonymous users can empty their drive and remove FS_hash from localStorage
    'EV_BURN_ANON_DRIVE': true,
    // Inner drive needs to send command and receive updates from the async store
    'Q_DRIVE_USEROBJECT': true,
    'Q_DRIVE_GETOBJECT': true,
    'Q_DRIVE_RESTORE': true,
    // Get the pads deleted from the server by other users to remove them from the drive
    'Q_DRIVE_GETDELETED': true,
    // Store's userObject need to send log messages to inner to display them in the UI
    'EV_DRIVE_LOG': true,
    // Refresh the drive when the drive has changed ('change' or 'remove' events)
    'EV_DRIVE_CHANGE': true,
    'EV_DRIVE_REMOVE': true,
    // Set shared folder hash in the address bar
    'EV_DRIVE_SET_HASH': true,

    // Remove an owned pad from the server
    'Q_REMOVE_OWNED_CHANNEL': true,
    // Clear an owned pad from the server (preserve metadata)
    'Q_CLEAR_OWNED_CHANNEL': true,

    // Notifications about connection and disconnection from the network
    'EV_NETWORK_DISCONNECT': true,
    'EV_NETWORK_RECONNECT': true,
    // Reload on new version
    'EV_NEW_VERSION': true,

    // Pad creation screen: create a pad with the selected attributes (owned, expire)
    'Q_CREATE_PAD': true,
    // Get the available templates
    'Q_CREATE_TEMPLATES': true,

    // This is for sending data out of the iframe when we are in testing mode
    // The exact protocol is defined in common/test.js
    'EV_TESTDATA': true,

    // OnlyOffice: save a new version
    'Q_OO_SAVE': true,

    // Ask for the pad password when a pad is protected
    'EV_PAD_PASSWORD': true,
    'Q_PAD_PASSWORD_VALUE': true,
    // Change pad password
    'Q_PAD_PASSWORD_CHANGE': true,

    // Migrate drive to owned drive
    'Q_CHANGE_USER_PASSWORD': true,

    // Loading events to display in the loading screen
    'EV_LOADING_INFO': true,
    // Critical error outside the iframe during loading screen
    'EV_LOADING_ERROR': true,

    // Chrome 68 bug...
    'EV_CHROME_68': true,

    // Get all existing tags
    'Q_GET_ALL_TAGS': true,

    // Store pads in the drive
    'EV_AUTOSTORE_DISPLAY_POPUP': true,
    'Q_AUTOSTORE_STORE': true,
    'Q_IS_PAD_STORED': true,

    // Import mediatag from a pad
    'Q_IMPORT_MEDIATAG': true,

    // Ability to get a pad's content from its hash
    'Q_CRYPTGET': true,
    'EV_CRYPTGET_DISCONNECT': true,

});
