define(function () {
    var out = {};

    // translations must set this key for their language to be available in
    // the language dropdowns that are shown throughout Cryptpad's interface
    // NOTE: translate that name in your language ("Français" and not "French")
    out._languageName = 'English';

    out.main_title = "Cryptpad: Zero Knowledge, Collaborative Real Time Editing";
    out.main_slogan = "Unity is Strength - Collaboration is Key";

    out.type = {};
    out.type.pad = 'Rich text';
    out.type.code = 'Code';
    out.type.poll = 'Poll';
    out.type.slide = 'Presentation';
    out.type.drive = 'Drive';

    out.errorBox_errorType_disconnected = 'Connection Lost';
    out.errorBox_errorExplanation_disconnected = [
        'Lost connection to server, you may reconnect by reloading the page or review your work ',
        'by clicking outside of this box.'
    ].join('');

    // NOTE: We want to update the 'common_connectionLost' key.
    // Please do not add a new 'updated_common_connectionLostAndInfo' but change directly the value of 'common_connectionLost'
    out.updated_common_connectionLostAndInfo = "<b>Server Connection Lost</b><br>You're now in read-only mode until the connection is back.";
    out.common_connectionLost = out.updated_common_connectionLostAndInfo;

    out.websocketError = 'Unable to connect to the websocket server...';
    out.typeError = "That realtime document is not compatible with the selected application";
    out.onLogout = 'You are logged out, <a href="/" target="_blank">click here</a> to log in<br>or press <em>Escape</em> to access your pad in read-only mode.';

    out.loading = "Loading...";
    out.error = "Error";

    out.disconnected = 'Disconnected';
    out.synchronizing = 'Synchronizing';
    out.reconnecting = 'Reconnecting...';
    out.lag = 'Lag';
    out.readonly = 'Read only';
    out.anonymous = "Anonymous";
    out.yourself = "Yourself";
    out.anonymousUsers = "anonymous editors";
    out.anonymousUser = "anonymous editor";
    out.shareView = "Read-only URL";
    out.shareEdit = "Edit URL";
    out.users = "Users";
    out.and = "And";
    out.viewer = "viewer";
    out.viewers = "viewers";
    out.editor = "editor";
    out.editors = "editors";

    out.language = "Language";

    out.greenLight = "Everything is working fine";
    out.orangeLight = "Your slow connection may impact your experience";
    out.redLight = "You are disconnected from the session";

    out.importButton = 'IMPORT';
    out.importButtonTitle = 'Import a document from a local file';

    out.exportButton = 'EXPORT';
    out.exportButtonTitle = 'Export this document to a local file';
    out.exportPrompt = 'What would you like to name your file?';

    out.back = '&#8656; Back';
    out.backToCryptpad = '⇐ Back to Cryptpad';

    out.userButton = 'USER';
    out.userButtonTitle = 'Change your username';
    out.changeNamePrompt = 'Change your name (leave empty to be anonymous): ';
    out.user_rename = "Change display name";
    out.user_displayName = "Display name";
    out.user_accountName = "Account name";

    out.renameButton = 'RENAME';
    out.renameButtonTitle = 'Change the title under which this document is listed on your home page';
    out.renamePrompt = 'How would you like to title this pad?';
    out.renameConflict = 'Another pad already has that title';
    out.clickToEdit = "Click to edit";

    out.forgetButton = 'FORGET';
    out.forgetButtonTitle = 'Remove this document from your home page listings';
    out.forgetPrompt = 'Clicking OK will remove the URL for this pad from localStorage, are you sure?';

    out.shareButton = 'Share';
    out.shareButtonTitle = "Copy URL to clipboard";
    out.shareSuccess = 'Copied URL to clipboard';
    out.shareFailed = "Failed to copy URL to clipboard";

    out.newButton = 'New';
    out.newButtonTitle = 'Create a new document';

    out.presentButton = 'PRESENT';
    out.presentButtonTitle = "Enter presentation mode";
    out.presentSuccess = 'Hit ESC to exit presentation mode';
    out.sourceButton = 'VIEW SOURCE';
    out.sourceButtonTitle = "Leave presentation mode";

    out.backgroundButton = 'BACKGROUND COLOR';
    out.backgroundButtonTitle = 'Change the background color in the presentation';
    out.colorButton = 'TEXT COLOR';
    out.colorButtonTitle = 'Change the text color in presentation mode';

    out.commitButton = 'COMMIT';

    out.getViewButton = 'READ-ONLY URL';
    out.getViewButtonTitle = 'Get the read-only URL for this document';
    out.readonlyUrl = 'Read only document';
    out.copyReadOnly = "Copy URL to clipboard";
    out.openReadOnly = "Open in a new tab";
    out.editShare = "Share edit URL";
    out.editShareTitle = "Copy the edit URL to clipboard";
    out.viewShare = "Share view URL";
    out.viewShareTitle = "Copy the read-only URL to clipboard";
    out.viewOpen = "View in new tab";
    out.viewOpenTitle = "Open the document in read-only mode in a new tab";

    out.notifyJoined = "{0} has joined the collaborative session";
    out.notifyRenamed = "{0} is now known as {1}";
    out.notifyLeft = "{0} has left the collaborative session";

    out.disconnectAlert = 'Network connection lost!';

    out.okButton = 'OK (enter)';

    out.cancel = "Cancel";
    out.cancelButton = 'Cancel (esc)';

    out.forget = "Forget";

    // Polls

    out.poll_title = "Zero Knowledge Date Picker";
    out.poll_subtitle = "Zero Knowledge, <em>realtime</em> scheduling";

    out.poll_p_save = "Your settings are updated instantly, so you never need to save.";
    out.poll_p_encryption = "All your input is encrypted so only people who have the link can access it. Even the server cannot see what you change.";
    out.poll_p_howtouse = "Enter your name in the input field below and check the box for times when you are available";

    out.promptName = "What is you name ?";

    out.wizardButton = 'WIZARD';
    out.wizardLog = "Click the button in the top left to return to your poll";
    out.wizardTitle = "Use the wizard to create your poll";
    out.wizardConfirm = "Are you really ready to add these options to your poll?";

    out.poll_publish_button = "Publish";
    out.poll_admin_button = "Admin";
    out.poll_create_user = "Add a new user";
    out.poll_create_option = "Add a new option";
    out.poll_commit = "Commit";

    out.poll_closeWizardButton = "Close wizard";
    out.poll_closeWizardButtonTitle = "Close wizard";
    out.poll_wizardComputeButton = "Compute Options";
    out.poll_wizardClearButton = "Clear Table";
    out.poll_wizardDescription = "Automatically create a number of options by entering any number of dates and times segments";
    out.poll_wizardAddDateButton = "+ Dates";
    out.poll_wizardAddTimeButton = "+ Times";

    out.poll_addUserButton = "+ Users";
    out.poll_addUserButtonTitle = "Click to add a user";
    out.poll_addOptionButton = "+ Options";
    out.poll_addOptionButtonTitle = "Click to add an option";
    out.poll_addOption = "Propose an option";
    out.poll_optionPlaceholder = "Option";
    out.poll_addUser = "Enter a name";
    out.poll_userPlaceholder = "Your name";
    out.poll_removeOption = "Are you sure you'd like to remove this option?";
    out.poll_removeOptionTitle = "Remove the row";
    out.poll_removeUser = "Are you sure you'd like to remove this user?";
    out.poll_removeUserTitle = "Remove the column";
    out.poll_editOption = "Are you sure you'd like to edit this option?";
    out.poll_editOptionTitle = "Edit the row";
    out.poll_editUser = "Are you sure you'd like to edit this user?";
    out.poll_editUserTitle = "Edit the column";

    out.poll_titleHint = "Title";
    out.poll_descriptionHint = "Describe your poll, and use the 'publish' button when you're done. Anyone with the link can change the description, but this is discouraged.";

    // File manager

    out.fm_rootName = "Documents";
    out.fm_trashName = "Trash";
    out.fm_unsortedName = "Unsorted files";
    out.fm_filesDataName = "All files";
    out.fm_templateName = "Templates";
    out.fm_newButton = "New";
    out.fm_newFolder = "New folder";
    out.fm_folder = "Folder";
    out.fm_folderName = "Folder name";
    out.fm_numberOfFolders = "# of folders";
    out.fm_numberOfFiles = "# of files";
    out.fm_fileName = "File name";
    out.fm_title = "Title";
    out.fm_lastAccess = "Last access";
    out.fm_creation = "Creation";
    out.fm_forbidden = "Forbidden action";
    out.fm_originalPath = "Original path";
    out.fm_noname = "Untitled Document";
    out.fm_emptyTrashDialog = "Are you sure you want to empty the trash?";
    out.fm_removeSeveralPermanentlyDialog = "Are you sure you want to remove these {0} elements from the trash permanently?";
    out.fm_removePermanentlyDialog = "Are you sure you want to remove that element permanently?";
    out.fm_removeSeveralDialog = "Are you sure you want to move these {0} elements to the trash?";
    out.fm_removeDialog = "Are you sure you want to move {0} to the trash?";
    out.fm_restoreDialog = "Are you sure you want to restore {0} to its previous location?";
    out.fm_unknownFolderError = "The selected or last visited directory no longer exist. Opening the parent folder...";
    out.fm_contextMenuError = "Unable to open the context menu for that element. If the problem persist, try to reload the page.";
    out.fm_selectError = "Unable to select the targetted element. If the problem persist, try to reload the page.";
    out.fm_info_root = "Create as many nested folders here as you want to sort your files.";
    out.fm_info_unsorted = 'Contains all the files you\'ve visited that are not yet sorted in "Documents" or moved to the "Trash".'; // "My Documents" should match with the "out.fm_rootName" key, and "Trash" with "out.fm_trashName"
    out.fm_info_template = 'Contains all the pads stored as templates and that you can re-use when you create a new document.';
    out.fm_info_trash = 'Files deleted from the trash are also removed from "All files" and it is impossible to recover them from the file manager.'; // Same here for "All files" and "out.fm_filesDataName"
    out.fm_info_allFiles = 'Contains all the files from "Documents", "Unsorted" and "Trash". You can\'t move or remove files from here.'; // Same here
    out.fm_alert_backupUrl = "Backup URL for this drive.<br>" +
                             "It is <strong>highly recommended</strong> that you keep ip for yourself only.<br>" +
                             "You can use it to retrieve all your files in case your browser memory got erased.<br>" +
                             "Anybody with that URL can edit or remove all the files in your file manager.<br>" +
                             '<input type="text" id="fm_backupUrl" value="{0}"/>';
    out.fm_backup_title = 'Backup URL';
    out.fm_nameFile = 'How would you like to name that file?';
    // File - Context menu
    out.fc_newfolder = "New folder";
    out.fc_rename = "Rename";
    out.fc_open = "Open";
    out.fc_open_ro = "Open (read-only)";
    out.fc_delete = "Delete";
    out.fc_restore = "Restore";
    out.fc_remove = "Delete permanently";
    out.fc_empty = "Empty the trash";
    out.fc_newpad = "New text pad";
    out.fc_newcode = "New code pad";
    out.fc_newslide = "New presentation";
    out.fc_newpoll = "New poll";
    out.fc_prop = "Properties";
    // fileObject.js (logs)
    out.fo_moveUnsortedError = "You can't move a folder to the list of unsorted pads";
    out.fo_existingNameError = "Name already used in that directory. Please choose another one.";
    out.fo_moveFolderToChildError = "You can't move a folder into one of its descendants";
    out.fo_unableToRestore = "Unable to restore that file to its original location. You can try to move it to a new location.";
    out.fo_unavailableName = "A file or a folder with the same name already exist at the new location. Rename the element and try again.";

    // login
    out.login_login = "Log in";
    out.login_nologin = "Your browser's recent pads";
    out.login_register = "Sign up";
    out.logoutButton = "Log out";

    out.login_migrate = "Would you like to migrate existing data from your anonymous session?";

    out.username_label = "Username: ";
    out.displayname_label = "Display name: ";

    out.login_username = "your username";
    out.login_password = "your password";
    out.login_confirm = "confirm your password";
    out.login_remember = "Remember me";

    out.login_cancel_prompt = "...or if you may have entered the wrong username or password, cancel to try again.";

    out.login_registerSuccess = "registered successfully. Make sure you don't forget your password!";
    out.login_passwordMismatch = "The two passwords you entered do not match. Try again";

    out.login_warning = [
        '<h1 id="warning">WARNING</h1>',
        '<p>Cryptpad stores your personal information in an encrypted realtime document, as it does with all other types of realtime documents.</p>',
        '<p>Your username and password are never sent to the server in an unencrypted form.</p>',
        '<p>As such, if you forget your username or password, there is absolutely nothing that we can do to recover your lost information.</p>',
        '<p><strong>Make sure you do not forget your username and password!</strong></p>',
    ].join('\n');

    out.login_hashing = "Hashing your password, this might take some time.";

    out.login_no_user = "There is no user associated with the username and password that you entered.";
    out.login_confirm_password = "Re-enter your password to register...";

    out.loginText = '<p>Your username and password are used to generate a unique key which is never known by our server.</p>\n' +
                    '<p>Be careful not to forget your credentials, as they are impossible to recover</p>';
    out.login_hello = 'Hello {0},'; // {0} is the username
    out.login_helloNoName = 'Hello,';
    out.login_accessDrive = 'Access your drive';

    // index.html

    //out.main_p1 = 'CryptPad is the <strong>zero knowledge</strong> realtime collaborative editor.  Encryption carried out in your web browser protects the data from the server, the cloud, and the NSA.  The secret encryption key is stored in the URL <a href="https://en.wikipedia.org/wiki/Fragment_identifier">fragment identifier</a> which is never sent to the server but is available to javascript so by sharing the URL, you give authorization to others who want to participate.';
    //out.main_p1 = "Type quick documents with friends and colleagues.<br>With <strong>Zero Knowledge</strong> technology, the server doesn't know what you're doing.";
    out.main_p1 = "<h1>Collaborate in Confidence</h1><br> Grow your ideas together with shared documents while <strong>Zero Knowledge</strong> technology secures your privacy; even from us.";

    out.main_p2 = 'This project uses the <a href="http://ckeditor.com/">CKEditor</a> Visual Editor, <a href="https://codemirror.net/">CodeMirror</a>, and the <a href="https://github.com/xwiki-contrib/chainpad">ChainPad</a> realtime engine.';
    out.main_howitworks_p1 = 'CryptPad uses a variant of the <a href="https://en.wikipedia.org/wiki/Operational_transformation">Operational transformation</a> algorithm which is able to find distributed consensus using a <a href="https://bitcoin.org/bitcoin.pdf">Nakamoto Blockchain</a>, a construct popularized by <a href="https://en.wikipedia.org/wiki/Bitcoin">Bitcoin</a>. This way the algorithm can avoid the need for a central server to resolve Operational Transform Edit Conflicts and without the need for resolving conflicts, the server can be kept unaware of the content which is being edited on the pad.';
    out.main_about = 'About';
    out.main_about_p1 = 'You can read more about <a href="/about.html">how CryptPad works</a>, our <a href="/privacy.html" title="">privacy policy</a> and <a href="/terms.html">terms of service</a>.';
    out.main_about_p2 = 'If you have any questions or comments, you can <a href="https://twitter.com/cryptpad">tweet us</a>, open an issue <a href="https://github.com/xwiki-labs/cryptpad/issues/" title="our issue tracker">on github</a>, come say hi on irc (<a href="http://webchat.freenode.net?channels=%23cryptpad&uio=MT1mYWxzZSY5PXRydWUmMTE9Mjg3JjE1PXRydWUe7" title="freenode webchat">irc.freenode.net</a>), or <a href="mailto:research@xwiki.com">send us an email</a>.';
    out.main_openFileManager = 'Open in a new tab';

    out.main_howitworks = 'How It Works';
    out.main_zeroKnowledge = 'Zero Knowledge';
    out.main_zeroKnowledge_p = "You don't have to trust that we <em>won't</em> look at your pads, with CryptPad's revolutionary Zero Knowledge Technology we <em>can't</em>. Learn more about how we protect your Privacy and Security.";
    out.main_writeItDown = 'Write it down';
    out.main_writeItDown_p = "The greatest projects come from the smallest ideas. Take down the moments of inspiration and unexpected ideas because you never know which one might be a breakthrough.";
    out.main_share = 'Share the link, share the pad';
    out.main_share_p = "Grow your ideas together: conduct efficient meetings, collaborate on TODO lists and make quick presentations with all your friends and all your devices.";
    out.main_organize = 'Get organized';
    out.main_organize_p = "With CryptPad Drive, you can keep your sights on what's important. Folders allow you to keep track of your projects and have a global vision of where things are going.";
    out.tryIt = 'Try it out!';
    out.main_richText = 'Rich Text editor';
    out.main_richText_p = 'Edit rich text documents collaboratively with our realtime Zero Knowledge <a href="http://ckeditor.com" target="_blank">CkEditor</a> application.';
    out.main_code = 'Code editor';
    out.main_code_p = 'Edit code from your software collaboratively with our realtime Zero Knowledge <a href="https://www.codemirror.net" target="_blank">CodeMirror</a> application.';
    out.main_slide = 'Slide editor';
    out.main_slide_p = 'Create your presentations using the Markdown syntax, and display them in your browser.';
    out.main_poll = 'Polls';
    out.main_poll_p = 'Plan your meeting or your event, or vote for the best solution regarding your problem.';
    out.main_drive = 'CryptDrive';

    out.footer_applications = "Applications";
    out.footer_contact = "Contact";
    out.footer_aboutUs = "About us";

    out.table_type = 'Type';
    out.table_link = 'Link';
    out.table_created = 'Created';
    out.table_last = 'Last Accessed';

    out.makeAPad = 'Make a pad right now';
    out.button_newpad = 'New Rich Text pad';
    out.button_newcode = 'New Code pad';
    out.button_newpoll = 'New Poll';
    out.button_newslide = 'New Presentation';

    out.form_title = "All your pads, everywhere!";
    out.form_username = "Username";
    out.form_password = "Password";

    out.about = "About";
    out.privacy = "Privacy";
    out.contact = "Contact";
    out.terms = "ToS";

    // privacy.html

    out.policy_title = 'Cryptpad Privacy Policy';
    out.policy_whatweknow = 'What we know about you';
    out.policy_whatweknow_p1 = 'As an application that is hosted on the web, Cryptpad has access to metadata exposed by the HTTP protocol. This includes your IP address, and various other HTTP headers that can be used to identify your particular browser. You can see what information your browser is sharing by visiting <a target="_blank" rel="noopener noreferrer" href="https://www.whatismybrowser.com/detect/what-http-headers-is-my-browser-sending" title="what http headers is my browser sending">WhatIsMyBrowser.com</a>.';
    out.policy_whatweknow_p2 = 'We use <a href="https://piwik.org/" target="_blank" rel="noopener noreferrer" title="open source analytics platform">Piwik</a>, an open source analytics platform, to learn more about our users. Piwik tells us about how you found Cryptpad, via direct entry, through a search engine, or via a referral from another web service like Reddit or Twitter. We also learn when you visit, what links you click while on our informational pages, and how long you stay on a particular page.';
    out.policy_whatweknow_p3 = 'These analytics tools are only used on informational pages. We do not collect any information about your usage of our zero-knowledge applications.';
    out.policy_howweuse = 'How we use what we learn';
    out.policy_howweuse_p1 = 'We use this information to make better decisions about promoting Cryptpad, by evaluating which of our past efforts were successful. Information about your location lets us know whether we should consider providing better support for languages other than English.';
    out.policy_howweuse_p2 = "Information about your browser (whether it's a desktop or mobile operating system) helps us make decisions when prioritizing feature improvements. Our development team is small, and we try to make choices that will improve as many users' experience as possible.";
    out.policy_whatwetell = 'What we tell others about you';
    out.policy_whatwetell_p1 = 'We do not furnish to third parties the information that we gather or that you provide to us unless we are legally required to do so.';
    out.policy_links = 'Links to other sites';
    out.policy_links_p1 = 'This site contains links to other sites, including those produced by other organizations. We are not responsible for the privacy practices or the contents of any outside sites. As a general rule, links to outside sites are launched in a new browser window, to make clear that you are leaving Cryptpad.fr.';
    out.policy_ads = 'Advertisement';
    out.policy_ads_p1 = 'We do not display any online advertising, though we may link to the bodies which are financing our research.';
    out.policy_choices = 'Choices you have';
    out.policy_choices_open = 'Our code is open source, so you always have the option of hosting your own instance of Cryptpad.';
    out.policy_choices_vpn = 'If you want to use our hosted instance, but don\'t want to expose your IP address, you can protect your IP using the <a href="https://www.torproject.org/projects/torbrowser.html.en" title="downloads from the Tor project" target="_blank" rel="noopener noreferrer">Tor browser bundle</a>, or a <a href="https://riseup.net/en/vpn" title="VPNs provided by Riseup" target="_blank" rel="noopener noreferrer">VPN</a>.';
    out.policy_choices_ads = 'If you just want to block our analytics platform, you can use adblocking tools like <a href="https://www.eff.org/privacybadger" title="download privacy badger" target="_blank" rel="noopener noreferrer">Privacy Badger</a>.';

    // terms.html

    out.tos_title = "Cryptpad Terms of Service";
    out.tos_legal = "Please don't be malicious, abusive, or do anything illegal.";
    out.tos_availability = "We hope you find this service useful, but availability or performance cannot be guaranteed. Please export your data regularly.";
    out.tos_e2ee = "Cryptpad documents can be read or modified by anyone who can guess or otherwise obtain the document's fragment identifier. We recommend that you use end-to-end-encrypted (e2ee) messaging technology to share URLs, and assume no liability in the event that such a URL is leaked.";
    out.tos_logs = "Metadata provided by your browser to the server may be logged for the purpose of maintaining the service.";
    out.tos_3rdparties = "We do not provide individualized data to third parties unless required to by law.";

    // BottomBar.html

    out.bottom_france = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer">Made with <img class="bottom-bar-heart" src="/customize/heart.png" alt="love" /> in <img class="bottom-bar-fr" src="/customize/fr.png" alt="France" /></a>';
    out.bottom_support = '<a href="http://labs.xwiki.com/" title="XWiki Labs" target="_blank" rel="noopener noreferrer">An <img src="/customize/logo-xwiki2.png" alt="XWiki SAS" class="bottom-bar-xwiki"/> Labs Project </a> with the support of <a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';

    // Header.html

    out.header_france = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer">With <img class="bottom-bar-heart" src="/customize/heart.png" alt="love" /> from <img class="bottom-bar-fr" src="/customize/fr.png" title="France" alt="France"/> by <img src="/customize/logo-xwiki.png" alt="XWiki SAS" class="bottom-bar-xwiki"/></a>';


    // TODO Hardcode cause YOLO
    //out.header_xwiki = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer"><img src="/customize/logo-xwiki.png" alt="XWiki SAS" class="bottom-bar-xwiki"/></a>';
    out.header_support = '<a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';
    out.header_logoTitle = 'Go to the main page';

    // Initial states

    out.codeInitialState = [
        '/*\n',
        '   This is CryptPad, the zero knowledge realtime collaborative editor.\n',
        '   What you type here is encrypted so only people who have the link can access it.\n',
        '   Even the server cannot see what you type.\n',
        '   What you see here, what you hear here, when you leave here, let it stay here.\n',
        '*/'
    ].join('');

    out.slideInitialState = [
        '# CryptSlide\n',
        '* This is a zero knowledge realtime collaborative editor.\n',
        '* What you type here is encrypted so only people who have the link can access it.\n',
        '* Even the server cannot see what you type.\n',
        '* What you see here, what you hear here, when you leave here, let it stay here.\n',
        '\n',
        '---',
        '\n',
        '# How to use\n',
        '1. Write your slides content using markdown syntax\n',
        '  - Learn more about markdown syntax [here](http://www.markdowntutorial.com/)\n',
        '2. Separate your slides with ---\n',
        '3. Click on the "Play" button to see the result',
        '  - Your slides are updated in realtime'
    ].join('');

    return out;
});
