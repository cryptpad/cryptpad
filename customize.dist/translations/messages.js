define(function () {
    var out = {};

    // translations must set this key for their language to be available in
    // the language dropdowns that are shown throughout Cryptpad's interface
    out._languageName = 'English';

    out.main_title = "Cryptpad: Zero Knowledge, Collaborative Real Time Editing";
    out.main_slogan = "Unity is Strength - Collaboration is Key";

    out.type = {};
    out.type.pad = 'Pad';
    out.type.code = 'Code';
    out.type.poll = 'Poll';
    out.type.slide = 'Presentation';

    out.errorBox_errorType_disconnected = 'Connection Lost';
    out.errorBox_errorExplanation_disconnected = [
        'Lost connection to server, you may reconnect by reloading the page or review your work ',
        'by clicking outside of this box.'
    ].join('');

    out.common_connectionLost = 'Server Connection Lost';

    out.disconnected = 'Disconnected';
    out.synchronizing = 'Synchronizing';
    out.reconnecting = 'Reconnecting...';
    out.lag = 'Lag';
    out.readonly = 'Read only';
    out.anonymous = "Anonymous";
    out.yourself = "Yourself";
    out.anonymousUsers = "anonymous users";
    out.anonymousUser = "anonymous user";
    out.shareView = "Read-only URL";
    out.shareEdit = "Edit URL";
    out.users = "Users";
    out.and = "And";
    out.viewer = "viewer";
    out.viewers = "viewers";
    out.editor = "editor";
    out.editors = "editors";

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

    out.tryIt = 'Try it out!';
    out.recentPads = 'Your recent pads (stored only in your browser)';

    out.okButton = 'OK (enter)';
    out.cancelButton = 'Cancel (esc)';

    out.loginText = '<p>Your username and password are used to generate a unique key which is never known by our server.</p>\n' +
                    '<p>Be careful not to forget your credentials, as they are impossible to recover</p>';

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
    out.poll_descriptionHint = "Description";

    // File manager

    out.fm_rootName = "My documents";
    out.fm_trashName = "Trash";
    out.fm_unsortedName = "Unsorted files";
    out.fm_filesDataName = "All files";
    out.fm_newFolder = "New folder";
    out.fm_newFolderButton = "NEW FOLDER";
    out.fm_folderName = "Folder name";
    out.fm_numberOfFolders = "# of folders";
    out.fm_numberOfFiles = "# of files";
    out.fm_fileName = "File name";
    out.fm_title = "Title";
    out.fm_lastAccess = "Last access";
    out.fm_creation = "Creation";
    out.fm_forbidden = "Forbidden action";
    out.fm_originalPath = "Original path";
    out.fm_emptyTrashDialog = "Are you sure you want to empty the trash?";
    out.fm_removeSeveralPermanentlyDialog = "Are you sure you want to remove these {0} elements from the trash permanently?";
    out.fm_removePermanentlyDialog = "Are you sure you want to remove {0} from the trash permanently?";
    out.fm_removeSeveralDialog = "Are you sure you want to move these {0} elements to the trash?";
    out.fm_removeDialog = "Are you sure you want to move {0} to the trash?";
    out.fm_restoreDialog = "Are you sure you want to restore {0} to its previous location?";
    out.fm_unknownFolderError = "The selected or last visited directory no longer exist. Opening the parent folder...";
    out.fm_contextMenuError = "Unable to open the context menu for that element. If the problem persist, try to reload the page.";
    out.fm_selectError = "Unable to select the targetted element. If the problem persist, try to reload the page.";
    // File - Context menu
    out.fc_newfolder = "New folder";
    out.fc_rename = "Rename";
    out.fc_open = "Open";
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

    // index.html

    out.main_p1 = 'CryptPad is the <strong>zero knowledge</strong> realtime collaborative editor.  Encryption carried out in your web browser protects the data from the server, the cloud, and the NSA.  The secret encryption key is stored in the URL <a href="https://en.wikipedia.org/wiki/Fragment_identifier">fragment identifier</a> which is never sent to the server but is available to javascript so by sharing the URL, you give authorization to others who want to participate.';
    out.main_p2 = 'This project uses the <a href="http://ckeditor.com/">CKEditor</a> Visual Editor, <a href="https://codemirror.net/">CodeMirror</a>, and the <a href="https://github.com/xwiki-contrib/chainpad">ChainPad</a> realtime engine.';
    out.main_howitworks = 'How It Works';
    out.main_howitworks_p1 = 'CryptPad uses a variant of the <a href="https://en.wikipedia.org/wiki/Operational_transformation">Operational transformation</a> algorithm which is able to find distributed consensus using a <a href="https://bitcoin.org/bitcoin.pdf">Nakamoto Blockchain</a>, a construct popularized by <a href="https://en.wikipedia.org/wiki/Bitcoin">Bitcoin</a>. This way the algorithm can avoid the need for a central server to resolve Operational Transform Edit Conflicts and without the need for resolving conflicts, the server can be kept unaware of the content which is being edited on the pad.';
    out.main_about = 'About';
    out.main_about_p1 = 'You can read more about our <a href="/privacy.html" title="">privacy policy</a> and <a href="/terms.html">terms of service</a>.';

    out.main_about_p2 = 'If you have any questions or comments, you can <a href="https://twitter.com/cryptpad">tweet us</a>, open an issue <a href="https://github.com/xwiki-labs/cryptpad/issues/" title="our issue tracker">on github</a>, come say hi on irc (<a href="http://webchat.freenode.net?channels=%23cryptpad&uio=MT1mYWxzZSY5PXRydWUmMTE9Mjg3JjE1PXRydWUe7" title="freenode webchat">irc.freenode.net</a>), or <a href="mailto:research@xwiki.com">send us an email</a>.';

    out.table_type = 'Type';
    out.table_link = 'Link';
    out.table_created = 'Created';
    out.table_last = 'Last Accessed';

    out.button_newpad = 'CREATE NEW WYSIWYG PAD';
    out.button_newcode = 'CREATE NEW CODE PAD';
    out.button_newpoll = 'CREATE NEW POLL';
    out.button_newslide = 'CREATE NEW PRESENTATION';

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

    out.bottom_france = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer">Made with <img class="bottom-bar-heart" src="/customize/heart.png" /> in <img class="bottom-bar-fr" src="/customize/fr.png" /></a>';
    out.bottom_support = '<a href="http://labs.xwiki.com/" title="XWiki Labs" target="_blank" rel="noopener noreferrer">An <img src="/customize/logo-xwiki2.png" alt="XWiki SAS" class="bottom-bar-xwiki"/> Labs Project </a> with the support of <a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';

    // Header.html

    out.header_france = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer">With <img class="bottom-bar-heart" src="/customize/heart.png" /> from <img class="bottom-bar-fr" src="/customize/fr.png" title="France" alt="France"/> by <img src="/customize/logo-xwiki.png" alt="XWiki SAS" class="bottom-bar-xwiki"/></a>';


    // TODO Hardcode cause YOLO
    //out.header_xwiki = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer"><img src="/customize/logo-xwiki.png" alt="XWiki SAS" class="bottom-bar-xwiki"/></a>';
    out.header_support = '<a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';
    out.header_logoTitle = 'Go to the main page';

    return out;
});
