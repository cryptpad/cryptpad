define(function () {
    var out = {};



    out.main_title = "CryptPad: Zero Knowledge, συνεργατική επεξεργασία σε πραγματικό χρόνο";
    out.main_slogan = "Ισχύς εν τη ενώσει - Η συνεργασία είναι η λύση"; // TODO remove?

    out.type = {};
    out.type.pad = 'Εμπλουτισμένο κείμενο';
    out.type.code = 'Κώδικας';
    out.type.poll = 'Δημοσκόπηση';
    out.type.slide = 'Παρουσίαση';
    out.type.drive = 'Αποθηκευτικός χώρος';
    out.type.whiteboard = 'Πίνακας σχεδιασμού';
    out.type.file = 'Αρχείο';
    out.type.media = 'Πολυμέσα';
    out.type.todo = "Εργασίες";
    out.type.contacts = 'Επαφές';

    out.button_newpad = 'Νέο pad εμπλουτισμένου κειμένου';
    out.button_newcode = 'Νέο pad κώδικα';
    out.button_newpoll = 'Νέα δημοσκόπηση';
    out.button_newslide = 'Νέα παρουσίαση';
    out.button_newwhiteboard = 'Νέος πίνακας';

    // NOTE: We want to update the 'common_connectionLost' key.
    // Please do not add a new 'updated_common_connectionLostAndInfo' but change directly the value of 'common_connectionLost'
    out.updated_0_common_connectionLost = "<b>Η σύνδεση με τον διακομιστή χάθηκε</b><br>Βρίσκεστε σε λειτουργία ανάγνωσης μόνο μέχρι να επανέλθει η σύνδεση.";
    out.common_connectionLost = out.updated_0_common_connectionLost;

    out.websocketError = 'Αδυναμία σύνδεσης στον διακομιστή...';
    out.typeError = "Αυτό το pad δεν είναι συμβατό με την επιλεγμένη εφαρμογή";
    out.onLogout = 'Έχετε αποσυνδεθεί, <a href="/" target="_blank">κάντε "κλικ" εδώ</a> για να συνδεθείτε<br>ή πατήστε <em>Escape</em> για να προσπελάσετε το έγγραφο σε λειτουργία ανάγνωσης μόνο.';
    out.wrongApp = "Αδυναμία προβολής του περιεχομένου αυτής της συνεδρίας στον περιηγητή σας. Παρακαλώ δοκιμάστε επαναφόρτωση της σελίδας.";

    out.loading = "Φόρτωση...";
    out.error = "Σφάλμα";
    out.saved = "Αποθηκεύτηκε";
    out.synced = "Όλα έχουν αποθηκευτεί";
    out.deleted = "Το έγγραφο διαγράφηκε από τον αποθηκευτικό σας χώρο";

    out.realtime_unrecoverableError = "Η μηχανή πραγματικού χρόνου αντιμετώπισε κάποιο ανεπανόρθωτο σφάλμα. Πατήστε OK για επαναφόρτωση.";

    out.disconnected = 'Έγινε αποσύνδεση';
    out.synchronizing = 'Γίνεται συγχρονισμός';
    out.reconnecting = 'Γίνεται επανασύνδεση...';
    out.typing = "Γίνεται επεξεργασία";
    out.initializing = "Γίνεται προετοιμασία...";
    out.forgotten = 'Μετακινήθηκε στον κάδο ανακύκλωσης';
    out.errorState = 'Κρίσιμο σφάλμα: {0}';
    out.lag = 'Αργή σύνδεση';
    out.readonly = 'Λειτουργία ανάγνωσης μόνο';
    out.anonymous = "Ανώνυμος/η";
    out.yourself = "Ο εαυτός σας";
    out.anonymousUsers = "Ανώνυμοι συντάκτες";
    out.anonymousUser = "Ανώνυμος συντάκτης";
    out.users = "Χρήστες";
    out.and = "Και";
    out.viewer = "Θεατής";
    out.viewers = "Θεατές";
    out.editor = "Συντάκτης";
    out.editors = "Συντάκτες";
    out.userlist_offline = "Είσαστε προς το παρόν εκτός σύνδεσης, η λίστα χρηστών δεν είναι διαθέσιμη.";

    out.language = "Γλώσσα";

    out.comingSoon = "Έρχεται σύντομα...";

    out.newVersion = '<b>To CryptPad αναβαθμίστηκε!</b><br>' +
                     'Δείτε τι καινούριο υπάρχει στην πιο πρόσφατη έκδοση:<br>'+
                     '<a href="https://github.com/xwiki-labs/cryptpad/releases/tag/{0}" target="_blank">Σημειώσεις κυκλοφορίας του CryptPad {0}</a>';

    out.upgrade = "Αναβάθμιση";
    out.upgradeTitle = "Αναβαθμίστε τον λογαριασμό σας για να αυξήσετε το όριο αποθηκευτικού χώρου";

    out.upgradeAccount = "Αναβάθμιση λογαριασμού";
    out.MB = "MB";
    out.GB = "GB";
    out.KB = "KB";

    out.supportCryptpad = "Υποστηρίξτε το CryptPad";

    out.formattedMB = "{0} MB";
    out.formattedGB = "{0} GB";
    out.formattedKB = "{0} KB";

    out.greenLight = "Όλα λειτουργούν σωστά";
    out.orangeLight = "Η αργή σύνδεση ίσως έχει αντίκτυπο στην διάδραση";
    out.redLight = "Έχετε αποσυνδεθεί από τη συνεδρία";

    out.pinLimitReached = "Έχετε φτάσει το όριο αποθηκευτικού χώρου";
    out.updated_0_pinLimitReachedAlert = "Έχετε φτάσει το όριο αποθηκευτικού χώρου. Τα νέα pads δεν θα αποθηκευτούν στο CryptDrive σας.<br>" +
        'Μπορείτε είτε να διαγράψετε αρχεία από το CryptDrive σας, είτε να <a href="https://accounts.cryptpad.fr/#!on={0}" target="_blank">αναβαθμισετε τον λογαριασμό σας</a> για να αυξήσετε το όριο αποθήκευσης.';
    out.pinLimitReachedAlert = out.updated_0_pinLimitReachedAlert;
    out.pinLimitReachedAlertNoAccounts = out.pinLimitReached;
    out.pinLimitNotPinned = "Έχετε φτάσει το όριο αποθηκευτικού χώρου.<br>"+
                            "Αυτό το pad δεν θα αποθηκευτεί στο CryptDrive σας.";
    out.pinLimitDrive = "Έχετε φτάσει το όριο αποθηκευτικού χώρου.<br>" +
                        "Δεν μπορείτε να δημιουργήσετε νέα pads.";

    out.moreActions = "Περισσότερες επιλογές";

    out.importButton = "Εισαγωγή";
    out.importButtonTitle = 'Εισάγετε ένα pad από τοπικό αρχείο';

    out.exportButton = "Εξαγωγή";
    out.exportButtonTitle = 'Εξάγετε αυτό το pad σε τοπικό αρχείο';
    out.exportPrompt = 'Πως θα θέλατε να ονομάσετε το αρχείο σας;';

    out.changeNamePrompt = 'Αλλάξτε το όνομα σας (αφήστε το κενό για ανωνυμία): ';
    out.user_rename = "Αλλαγή εμφανιζόμενου ονόματος";
    out.user_displayName = "Εμφανιζόμενο όνομα";
    out.user_accountName = "Όνομα χρήστη";

    out.clickToEdit = "Κάντε \"κλικ\" για επεξεργασία";
    out.saveTitle = "Αποθήκευση τίτλου (enter)";

    out.forgetButton = "Διαγραφή";
    out.forgetButtonTitle = 'Μετακίνηση αυτού του pad στον κάδο';
    out.forgetPrompt = 'Πατώντας OK θα μετακινηθεί αυτό το pad στον κάδο ανακύκλωσης. Είστε σίγουρος;';
    out.movedToTrash = 'Το pad μετακινήθηκε στον κάδο.<br><a href="/drive/">Μεταφερθείτε στο CryptDrive σας</a>';

    out.shareButton = 'Διαμοιρασμός';
    out.shareSuccess = 'Ο σύνδεσμος αντιγράφηκε στην προσωρινή μνήμη';

    out.userListButton = "Λίστα χρηστών";

    out.userAccountButton = "Ο λογαριασμός σας";

    out.newButton = 'Νέο';
    out.newButtonTitle = 'Δημιουργία νέου pad';
    out.uploadButton = 'Μεταφόρτωση αρχείου';
    out.uploadButtonTitle = 'Μεταφόρτωση νέου αρχείου στον τρέχοντα φάκελο';

    out.saveTemplateButton = "Αποθήκευση ως πρότυπο";
    out.saveTemplatePrompt = "Επιλέξτε τίτλο για αυτό το πρότυπο";
    out.templateSaved = "Το πρότυπο αποθηκεύτηκε!";
    out.selectTemplate = "Επιλέξτε ένα πρότυπο ή πατήστε escape";
    out.useTemplate = "Έχετε διαθέσιμα πρότυπα για αυτό το είδος pad. Θα θέλετε να χρησιμοποιήσετε κάποιο;"; //Would you like to "You have available templates for this type of pad. Do you want to use one?";
    out.useTemplateOK = 'Επιλέξτε ένα πρότυπο (Enter)';
    out.useTemplateCancel = 'Ξεκινήστε από το μηδέν (Esc)';

    out.previewButtonTitle = "Προβολή ή απόκρυψη προεπισκόπησης της μορφοποίησης Markdown";

    out.presentButtonTitle = "Είσοδος σε λειτουργία παρουσίασης";

    out.backgroundButtonTitle = 'Αλλάξτε το χρώμα παρασκηνίου στην παρουσίαση';
    out.colorButtonTitle = 'Αλλάξτε το χρώμα κειμένου στην λειτουργία παρουσίασης';

    out.printText = "Εκτύπωση";
    out.printButton = "Εκτύπωση (enter)";
    out.printButtonTitle = "Εκτυπώστε τις διαφάνειές σας ή εξάγετε τες ως αρχείο PDF";
    out.printOptions = "Επιλογές διάταξης";
    out.printSlideNumber = "Εμφάνιση του αριθμού διαφάνειας";
    out.printDate = "Εμφάνιση της ημερομηνίας";
    out.printTitle = "Εμφάνιση του τίτλου του pad";
    out.printCSS = "Προσαρμοσμένες ρυθμίσεις εμφάνισης (CSS):";
    out.printTransition = "Ενεργοποίηση κινούμενων μεταβάσεων";

    out.filePickerButton = "Ενσωμάτωση αρχείου από το CryptDrive σας";
    out.filePicker_close = "Κλείσιμο";
    out.filePicker_description = "Επιλέξτε ένα αρχείο από το CryptDrive σας για ενσωμάτωση ή μεταφορτώστε ένα καινούριο";
    out.filePicker_filter = "Προβολή αρχείων κατά όνομα";
    out.or = 'ή';

    out.tags_title = "Ετικέτες (για εσάς μόνο)";
    out.tags_add = "Ενημερώστε τις ετικέτες αυτής της σελίδας";
    out.tags_searchHint = "Βρείτε αρχεία από τις ετικέτες τους ψάχνωντας στο CryptDrive σας";
    out.tags_searchHint = "Ξεκινήστε μια αναζήτηση με το σύμβολο # στο CryptDrive σας για να βρείτε pads με ετικέτες.";
    out.tags_notShared = "Οι ετικέτες σας δεν μοιράζονται με άλλους χρήστες";
    out.tags_duplicate = "Διπλή ετικέτα: {0}";
    out.tags_noentry = "Δεν μπορείτε να βάλετε ετικέτα σε διεγραμένο pad!";

    out.slideOptionsText = "Επιλογές";
    out.slideOptionsTitle = "Προσαρμόστε τις διαφάνειες σας";
    out.slideOptionsButton = "Αποθήκευση (enter)";
    out.slide_invalidLess = "Μη έγκυρη προσαρμογή";

    out.languageButton = "Γλώσσα";
    out.languageButtonTitle = "Επιλέξτε τη γλώσσα που θα χρησιμοποιήσετε για την επισήμανση σύνταξης";
    out.themeButton = "Θέμα";
    out.themeButtonTitle = "Επιλέξτε το θέμα που θα χρησιμοποιήσετε για την επεξεργασία κώδικα και διαφανειών";

    out.editShare = "Σύνδεσμος επεξεργασίας";
    out.editShareTitle = "Αντιγραφή του συνδέσμου επεξεργασίας στην προσωρινή μνήμη";
    out.editOpen = "Άνοιγμα του συνδέσμου επεξεργασίας σε νέα καρτέλα";
    out.editOpenTitle = "Άνοιγμα αυτού του pad για επεξεργασία σε νέα καρτέλα";
    out.viewShare = "Σύνδεσμος μόνο για ανάγνωση";
    out.viewShareTitle = "Αντιγραφή του συνδέσμου μόνο για ανάγνωση στην προσωρινή μνήμη";
    out.viewOpen = "Άνοιγμα του συνδέσμου μόνο για ανάγνωση σε νέα καρτέλα";
    out.viewOpenTitle = "Άνοιγμα αυτού του pad μόνο για ανάγνωση σε νέα καρτέλα";
    out.fileShare = "Αντιγραφή συνδέσμου";
    out.getEmbedCode = "Κώδικας ενσωμάτωσης";
    out.viewEmbedTitle = "Ενσωματώστε αυτό το pad σε μία εξωτερική σελίδα";
    out.viewEmbedTag = "Για να ενσωματώσετε αυτό το pad, συμπεριλάβετε αυτό το iframe στη σελίδα σας, στο σημείο που θέλετε. Μπορείτε να το διαμορφώσετε χρησιμοποιώντας CSS η HTML παραμέτρους.";
    out.fileEmbedTitle = "Ενσωματώστε το αρχείο σε μια εξωτερική σελίδα";
    out.fileEmbedScript = "Για να ενσωματώσετε αυτό το αρχείο, συμπεριλάβετε αυτό το script στη σελίδα σας για να φορτωθεί το Media Tag:";
    out.fileEmbedTag = "Έπειτα τοποθετήστε αυτό το Media Tag στο σημείο της σελίδας που επιθυμείτε να γίνει ενσωμάτωση:";

    out.notifyJoined = "Ο/Η {0} εισήλθε στη συνεργατική συνεδρία";
    out.notifyRenamed = "Ο/Η {0} είναι τώρα γνωστός/η ως {1}";
    out.notifyLeft = "Ο/Η {0} αποχώρησε από τη συνεργατική συνεδρία";

    out.okButton = 'OK (enter)';

    out.cancel = "Ακύρωση";
    out.cancelButton = 'Ακύρωση (esc)';
	out.doNotAskAgain = "Να μην ρωτηθώ ξανά (Esc)";

    out.historyText = "Ιστορικό";
    out.historyButton = "Εμφάνιση ιστορικού του εγγράφου";
    out.history_next = "Μετάβαση στην επόμενη έκδοση";
    out.history_prev = "Μετάβαση στην προηγούμενη έκδοση";
    out.history_goTo = "Μετάβαση στην επιλεγμένη έκδοση";
    out.history_close = "Επιστροφή";
    out.history_closeTitle = "Κλείσιμο ιστορικού";
    out.history_restore = "Επαναφορά";
    out.history_restoreTitle = "Επαναφορά της επιλεγμένης έκδοσης του εγγράφου";
    out.history_restorePrompt = "Είστε σίγουροι πως θέλετε να αντικαταστήσετε την τρέχουσα έκδοση του εγγράφου με την επιλεγμένη;";
    out.history_restoreDone = "Έγινε επαναφορά του εγγράφου";
    out.history_version = "Έκδοση:";

    // Ckeditor
    out.openLinkInNewTab = "Άνοιγμα συνδέσμου σε νέα καρτέλα";
    out.pad_mediatagTitle = "Ρυθμίσεις Media-Tag";
    out.pad_mediatagWidth = "Πλάτος (px)";
    out.pad_mediatagHeight = "Ύψος (px)";

    // Polls

    out.poll_title = "Zero Knowledge επιλογή ημερομηνίας";
    out.poll_subtitle = "Zero Knowledge, <em>πραγματικού χρόνου</em> οργάνωση";

    out.poll_p_save = "Οι ρυθμίσεις σας ενημερώνονται άμεσα, έτσι δεν χρειάζεται ποτέ να αποθηκεύσετε.";
    out.poll_p_encryption = "Όλο το περιεχόμενο είναι κρυπτογραφημένο και έτσι μόνο τα άτομα που έχουν τον σύνδεσμο μπορούν να έχουν πρόσβαση σε αυτό. Ούτε ο διακομιστής δεν μπορεί να δει τι γράφετε.";

    out.wizardLog = "Πατήστε το κουμπί πάνω αριστερά για να επιστρέψετε στη δημοσκόπηση σας";
    out.wizardTitle = "Χρησιμοποιήστε τον οδηγό για να δημιουργήσετε τη δημοσκόπηση σας";
    out.wizardConfirm = "Είσαστε έτοιμοι να προσθέσετε αυτές τις επιλογές στη δημοσκόπηση σας;";

    out.poll_publish_button = "Δημοσίευση";
    out.poll_admin_button = "Διαχείριση";
    out.poll_create_user = "Προσθέστε έναν νέο χρήστη";
    out.poll_create_option = "Προσθέστε μια νέα επιλογή";
    out.poll_commit = "Υποβολή";

    out.poll_closeWizardButton = "Κλείσιμο οδηγού";
    out.poll_closeWizardButtonTitle = "Κλείσιμο οδηγού";
    out.poll_wizardComputeButton = "Υπολογισμός επιλογών";
    out.poll_wizardClearButton = "Εκκαθάριση πεδίων";
    out.poll_wizardDescription = "Αυτόματα δημιουργήστε έναν αριθμό επιλογών εισάγοντας όσες ημερομηνίες και χρόνους θέλετε";
    out.poll_wizardAddDateButton = "+ Ημερομηνίες";
    out.poll_wizardAddTimeButton = "+ Χρόνους";

    out.poll_optionPlaceholder = "Επιλογή";
    out.poll_userPlaceholder = "Το όνομα σας";
    out.poll_removeOption = "Είστε σίγουροι πως θέλετε να αφαιρέσετε αυτή την επιλογή;";
    out.poll_removeUser = "Είστε σίγουροι πως θέλετε να αφαιρέσετε αυτόν τον χρήστη;";

    out.poll_titleHint = "Τίτλος";
    out.poll_descriptionHint = "Περιγράψτε τη δημοσκόπηση σας και χρησιμοποιήστε το κουμπί ✓ (δημοσίευση) όταν έχετε τελειώσει.\n" +
                               "Η περιγραφή μπορεί να γραφτεί χρησιμοποιώντας μορφοποίηση markdown και μπορείτε να ενσωματώσετε γραφικά στοιχεία από το CryptDrive σας.\n" +
                               "Οποιοσδήποτε με τον σύνδεσμο της δημοσκόπησης μπορεί να αλλάξει την περιγραφή, αλλά αυτό δεν συνίσταται.";

    out.poll_remove = "Αφαίρεση";
    out.poll_edit = "Επεξεργασία";
    out.poll_locked = "Κλείδωμα";
    out.poll_unlocked = "Ξεκλείδωμα";

    out.poll_show_help_button = "Εμφάνιση βοήθειας";
    out.poll_hide_help_button = "Απόκρυψη βοήθειας";

    out.poll_bookmark_col = 'Αποθηκεύστε αυτή τη στήλη ώστε να είναι πάντα ξεκλείδωτη και εμφανής κατά την εκκίνηση για εσάς';
    out.poll_bookmarked_col = 'Αυτή είναι η στήλη σελιδοδεικτών σας. Θα είναι πάντα ξεκλείδωτη και εμφανής κατά την εκκίνηση για εσάς.';
    out.poll_total = 'Σύνολο';

    out.poll_comment_list = "Σχόλια";
    out.poll_comment_add = "Κάντε ένα σχόλιο";
    out.poll_comment_submit = "Αποστολή";
    out.poll_comment_remove = "Διαγράψτε αυτό το σχόλιο";
    out.poll_comment_placeholder = "Το σχόλιό σας";

    out.poll_comment_disabled = "Δημοσιεύστε αυτή τη δημοσκόπηση χρησημοποιώντας το κουμπί ✓ για να ενεργοποιηθεί ο σχολιασμός.";

    // Canvas
    out.canvas_clear = "Εκκαθάριση";
    out.canvas_delete = "Διαγραφή επιλογής";
    out.canvas_disable = "Απενεργοποίηση σχεδιασμού";
    out.canvas_enable = "Ενεργοποίηση σχεδιασμού";
    out.canvas_width = "Πλάτος";
    out.canvas_opacity = "Αδιαφάνεια";
    out.canvas_opacityLabel = "Αδιαφάνεια: {0}";
    out.canvas_widthLabel = "Πλάτος: {0}";
    out.canvas_saveToDrive = "Αποθηκεύστε αυτή την εικόνα ως αρχείο στο CryptDrive σας";
    out.canvas_currentBrush = "Τρέχων πινέλο";
    out.canvas_chooseColor = "Επιλογή χρώματος";
    out.canvas_imageEmbed = "Εισάγετε μια εικόνα από τον υπολογιστή σας";

    // Profile
    out.profileButton = "Προφίλ"; // dropdown menu
    out.profile_urlPlaceholder = 'Διεύθυνση';
    out.profile_namePlaceholder = 'Το όνομα που θα εμφανίζετε στο προφίλ σας';
    out.profile_avatar = "Αβατάρ";
    out.profile_upload = " Μεταφορτώστε ένα νέο αβατάρ";
	out.profile_uploadSizeError = "Σφάλμα: το αβατάρ σας πρέπει να είναι μικρότερο από {0}";
    out.profile_uploadTypeError = "Σφάλμα: αυτό το είδος αρχείου δεν επιτρέπεται. Επιτρεπόμενα αρχεία: {0}";
    out.profile_error = "Σφάλμα κατά τη δημιουργία του προφίλ σας: {0}";
    out.profile_register = "Πρέπει να εγγραφείτε για να δημιουργήσετε προφίλ!";
    out.profile_create = "Δημιουργήστε προφίλ";
    out.profile_description = "Περιγραφή";
    out.profile_fieldSaved = 'Η καινούρια καταχώρηση αποθηκεύτηκε: {0}';

    out.profile_inviteButton = "Σύνδεση";
    out.profile_inviteButtonTitle ='Δημιουργήστε έναν σύνδεσμο για να προσκαλέσετε αυτόν το χρήστη να συνδεθεί μαζί σας.';
    out.profile_inviteExplanation = "Πατώντας <strong>OK</strong> θα δημιουργηθεί ένας σύνδεσμος προς μια ασφαλή συνεδρία επικοινωνίας όπου <em>μόνο ο/η {0} θα μπορεί να ανοίξει.</em><br><br>Ο σύνδεσμος θα αντιγραφεί στην προσωρινή μνήμη και μπορεί να διαμοιραστεί δημόσια.";
    out.profile_viewMyProfile = "Προβολή του προφίλ μου";

    // contacts/userlist
    out.userlist_addAsFriendTitle = 'Προσθήκη του/της "{0}" ως επαφή';
    out.userlist_thisIsYou = 'Αυτός είστε εσείς ("{0}")';
    out.userlist_pending = "Εκρεμμεί...";
    out.contacts_title = "Επαφές";
    out.contacts_addError = 'Σφάλμα κατά την προσθήκη αυτής της επαφής στη λίστα';
    out.contacts_added = 'Η επαφή αποδέχτηκε την πρόσκληση.';
    out.contacts_rejected = 'Η επαφή απέρριψε την πρόσκληση';
    out.contacts_request = 'Ο/Η <em>{0}</em> Θα ήθελε να σας προσθέσει ως επαφή. <b>Αποδοχή<b>;';
    out.contacts_send = 'Αποστολή';
    out.contacts_remove = 'Αφαίρεση αυτής της επαφής';
    out.contacts_confirmRemove = 'Είσαστε σίγουροι πως θέλετε να αφαιρέσετε τον/την <em>{0}</em> από τις επαφές σας;';
    out.contacts_typeHere = "Πληκτρολογήστε ένα μήνυμα εδώ...";

    out.contacts_info1 = "Αυτές είναι οι επαφές σας. Από εδώ, μπορείτε να:";
    out.contacts_info2 = "Πατήσετε στο εικονίδιο της επαφής για να συνομιλήσετε μαζί τους";
    out.contacts_info3 = "Κάνετε \"διπλό κλικ\" στο εικονίδιο για να δείτε το προφίλ τους";
    out.contacts_info4 = "Ο κάθε συμμετέχων μπορεί να διαγράψει μόνιμα το ιστορικό μιας συνομιλίας";

    out.contacts_removeHistoryTitle = 'Εκκαθάριση του ιστορικού συνομιλίας';
    out.contacts_confirmRemoveHistory = 'Είστε σίγουροι πως θέλετε να διαγράψετε μόνιμα το ιστορικό; Τα δεδομένα δεν μπορούν να επαναφερθούν';
    out.contacts_removeHistoryServerError = 'Προέκυψε ένα σφάλμα κατά της εκκαθάριση του ιστορικού. Δοκιμάστε ξανά αργότερα';
    out.contacts_fetchHistory = "Ανάκτηση παλαιότερου ιστορικού";

    // File manager

    out.fm_rootName = "Έγγραφα";
    out.fm_trashName = "Σκουπίδια";
    out.fm_unsortedName = "Αταξινόμητα";
    out.fm_filesDataName = "Όλα τα αρχεία";
    out.fm_templateName = "Πρότυπα";
    out.fm_searchName = "Αναζήτηση";
    out.fm_recentPadsName = "Πρόσφατα pads";
    out.fm_searchPlaceholder = "Αναζήτηση...";
    out.fm_newButton = "Νέο";
    out.fm_newButtonTitle = "Δημιουργήστε ένα νέο pad ή φάκελο, εισάγετε ένα αρχείο στον τρέχοντα φάκελο";
    out.fm_newFolder = "Νέος φάκελος";
    out.fm_newFile = "Νέο pad";
    out.fm_folder = "Φάκελος";
    out.fm_folderName = "Όνομα φακέλου";
    out.fm_numberOfFolders = "# φακέλων";
    out.fm_numberOfFiles = "# αρχείων";
    out.fm_fileName = "Όνομα αρχείου";
    out.fm_title = "Τίτλος";
    out.fm_type = "Τύπος";
    out.fm_lastAccess = "Τελευταία προσπέλαση";
    out.fm_creation = "Δημιουργία";
    out.fm_forbidden = "Απαγορευμένη ενέργεια";
    out.fm_originalPath = "Πρωτότυπη διαδρομή";
    out.fm_openParent = "Προβολή στον φάκελο";
    out.fm_noname = "Έγγραφο χωρίς τίτλο";
    out.fm_emptyTrashDialog = "Θέλετε σίγουρα να αδειάσετε τον κάδο;";
    out.fm_removeSeveralPermanentlyDialog = "Θέλετε σίγουρα να αφαιρέσετε αυτά τα {0} αντικείμενα από το CryptDrive σας μόνιμα;";
    out.fm_removePermanentlyDialog = "Θέλετε σίγουρα να αφαιρέσετε αυτό το αντικείμενο από το CryptDrive σας μόνιμα;";
    out.fm_removeSeveralDialog = "Θέλετε σίγουρα να μετακινήσετε αυτά τα {0} αντικείμενα στον κάδο;";
    out.fm_removeDialog = "Θέλετε σίγουρα να μετακινήσετε το {0} στον κάδο;";
    out.fm_restoreDialog = "Θέλετε σίγουρα να επαναφέρετε το {0} στην προηγούμενη τοποθεσία του;";
    out.fm_unknownFolderError = "Η επιλεγμένη ή πιο πρόσφατη τοποθεσία δεν υπάρχει πλέον. Γίνεται άνοιγμα του τρέχοντα φακέλου...";
    out.fm_contextMenuError = "Αδυναμία ανοίγματος μενού για αυτό το αντικείμενο. Αν το πρόβλημα επιμείνει, δοκιμάστε να επαναφορτώσετε τη σελίδα.";
    out.fm_selectError = "Αδυναμία επιλογής του συγκεκριμένου αντικειμένου. Αν το πρόβλημα επιμείνει, δοκιμάστε να επαναφορτώσετε τη σελίδα.";
    out.fm_categoryError = "Αδυναμία ανοίγματος της επιλεγμένης κατηγορίας, γίνεται προβολή του γονικού φακέλου.";
    out.fm_info_root = "Δημιουργήστε εδώ όσους υποφακέλους θέλετε για να ταξινομήσετε τα αρχεία σας.";
    out.fm_info_unsorted = 'Περιέχει όλα τα αρχεία που έχετε επισκεφτεί αλλά δεν έχουν ταξινομηθεί στα "Έγγραφα", ούτε έχουν μετακινηθεί στα "Σκουπίδια".'; // "My Documents" should match with the "out.fm_rootName" key, and "Trash" with "out.fm_trashName"
    out.fm_info_template = 'Περιέχει όλα τα pads που έχουν αποθηκευτεί ως πρότυπα και μπορείτε να ξαναχρησιμοποιήσετε όταν δημιουργείτε ένα νέο pad.';
    out.fm_info_recent = "Λίστα των πρόσφατα τροποποιημένων ή ανοιγμένων pads.";
    out.updated_0_fm_info_trash = 'Αδειάστε τον κάδο σας για να απελευθερώσετε χώρο στο CryptDrive σας.';
    out.fm_info_trash = out.updated_0_fm_info_trash;
    out.fm_info_allFiles = 'Περιέχει όλα τα αρχεία από τα "Έγγραφα", "Αταξινόμητα" και "Σκουπίδια". Δεν μπορείτε να μετακινήσετε ή να αφαιρέσετε αρχεία από εδώ.'; // Same here
    out.fm_info_anonymous = 'Δεν έχετε συνδεθεί, οπότε τα pads σας θα διαγραφούν μετά από 3 μήνες (<a href="https://blog.cryptpad.fr/2017/05/17/You-gotta-log-in/" target="_blank">μάθετε περισσότερα</a>). ' +
                            '<a href="/register/">Εγγραφείτε</a> ή <a href="/login/">Συνδεθείτε</a> για να τα κρατήσετε επ\' αόριστον.';
    out.fm_alert_backupUrl = "Σύνδεσμος ασφαλείας για αυτόν τον αποθηκευτικό χώρο.<br>" +
                             "Συνίσταται <strong>ιδιαιτέρως</strong> να τον κρατήσετε μυστικό.<br>" +
                             "Μπορείτε να τον χρησιμοποιήσετε για να ανακτήσετε όλα σας τα αρχεία σε περίπτωση που διαγραφεί η μνήμη του περιηγητή σας.<br>" +
                             "Οποιοσδήποτε με αυτόν τον σύνδεσμο μπορεί να επεξεργαστεί ή να αφαιρέσει όλα τα αρχεία σας στον διαχειριστή αρχείων.<br>";
    out.fm_alert_anonymous = "Γεια σας! Αυτή τη στιγμή χρησιμοποιείτε το CryptPad ανώνυμα, αυτό είναι ok αλλά τα pads σας ίσως διαγραφούν μετά από ένα διάστημα " +
                             "αδράνειας. Έχουμε απενεργοποιήσει προηγμένες λειτουργίες του αποθηκευτικού χώρου για τους ανώνυμους χρήστες επειδή θέλουμε να καταστήσουμε ξεκάθαρο πως " +
                             'δεν είναι ένα ασφαλές μέρος για να αποθηκεύετε πράγματα. Μπορείτε να <a href="https://blog.cryptpad.fr/2017/05/17/You-gotta-log-in/" target="_blank">διαβάσετε περισσότερα</a> σχετικά ' +
                             'με το γιατί το κάνουμε αυτό και γιατί θα έπρεπε να <a href="/register/">Εγγραφείτε</a> ή να <a href="/login/">Συνδεθείτε</a>.';
    out.fm_backup_title = 'Σύνδεσμος ασφαλείας';
    out.fm_nameFile = 'Πως θα θέλατε να ονομάσετε αυτό το αρχείο;';
    out.fm_error_cantPin = "Εσωτερικό σφάλμα διακομιστή. Παρακαλούμε επαναφορτώστε τη σελίδα και προσπαθήστε ξανά.";
    out.fm_viewListButton = "Προβολή λίστας";
    out.fm_viewGridButton = "Προβολή πλέγματος";
    out.fm_renamedPad = "Έχετε ορίσει ένα προσαρμοσμένο όνομα για αυτό το pad. Ο διαμοιραζόμενος τίτλος του είναι:<br><b>{0}</b>";
    out.fm_prop_tagsList = "Ετικέτες";
	out.fm_burnThisDriveButton = "Διαγραφή όλων των πληροφοριών που έχουν αποθηκευτεί από το CryptPad στον περιηγητή σας";
    out.fm_burnThisDrive = "Είστε σίγουροι πως θέλετε να διαγράψετε όλα όσα έχουν αποθηκευτεί από το CryptPad στον περιηγητή σας;<br>" +
                           "Αυτό θα αφαιρέσει το CryptDrive σας και το ιστορικό του από τον περιηγητή σας, αλλά τα pads σας θα εξακολουθήσουν να υπάρχουν (κρυπτογραφημένα) στον διακομιστή μας.";
    // File - Context menu
    out.fc_newfolder = "Νέος φάκελος";
    out.fc_rename = "Μετονομασία";
    out.fc_open = "Άνοιγμα";
    out.fc_open_ro = "Άνοιγμα για προβολή μόνο";
    out.fc_delete = "Μετακίνηση στον κάδο";
    out.fc_restore = "Επαναφορά";
    out.fc_remove = "Αφαίρεση από το CryptDrive σας";
    out.fc_empty = "Άδειασμα του κάδου";
    out.fc_prop = "Ιδιότητες";
    out.fc_hashtag = "Ετικέτες";
    out.fc_sizeInKilobytes = "Μέγεθος σε Kilobytes";
    // fileObject.js (logs)
    out.fo_moveUnsortedError = "Δεν μπορείτε να μετακινήσετε έναν φάκελο στη λίστα των αταξινόμητων pads";
    out.fo_existingNameError = "Το όνομα χρησμοποιείται ήδη σε αυτή την τοποθεσία. Παρακαλώ επιλέξτε ένα άλλο.";
    out.fo_moveFolderToChildError = "Δεν μπορείτε να μετακινήσετε έναν φάκελο μέσα σε κάποιο από τα περιεχόμενα του";
    out.fo_unableToRestore = "Αδυναμία επαναφοράς αυτού του αρχείο στην αρχική τοποθεσία του. Μπορείτε να δοκιμάσετε να το μετακινήσετε σε μια νέα τοποθεσία.";
    out.fo_unavailableName = "Ένα αρχείο ή ένας φάκελος με το ίδιο όνομα υπάρχει ήδη στη νέα τοποθεσία. Μετονομάστε το αρχείο και προσπαθήστε ξανά.";

    out.fs_migration = "Το CryptDrive σας αναβαθμίστηκε σε μια νεότερη έκδοση. Ως αποτέλεσμα, η τρέχουσα σελίδα θα πρέπει να επαναφορτωθεί.<br><strong>Παρακαλούμε επαναφορτώστε τη σελίδα για να συνεχίσετε να την χρησιμοποιείτε.</strong>";

    // login
    out.login_login = "Σύνδεση";
    out.login_makeAPad = 'Δημιουργήστε ένα pad ανώνυμα';
    out.login_nologin = "Περιηγηθείτε στα τοπικά pads";
    out.login_register = "Εγγραφή";
    out.logoutButton = "Αποσύνδεση";
    out.settingsButton = "Ρυθμίσεις";

    out.login_username = "Όνομα χρήστη";
    out.login_password = "Κωδικός";
    out.login_confirm = "Επιβεβαίωση κωδικού";
    out.login_remember = "Απομνημόνευση";

    out.login_hashing = "Κρυπτογραφούμε τον κωδικό σας, αυτό μπορεί να πάρει λίγη ώρα.";

    out.login_hello = 'Καλησπέρα {0},'; // {0} is the username
    out.login_helloNoName = 'Καλησπέρα,';
    out.login_accessDrive = 'Περιηγήθείτε στον αποθηκευτικό σας χώρο';
    out.login_orNoLogin = 'ή';

    out.login_noSuchUser = 'Μη έγκυρο όνομα χρήστη ή λάθος κωδικός. Προσπαθήστε ξανά, ή εγγραφείτε';
    out.login_invalUser = 'Απαιτείται όνομα χρήστη';
    out.login_invalPass = 'Απαιτείται κωδικός';
    out.login_unhandledError = 'Προέκυψε ένα μη αναμενόμενο σφάλμα :(';

    out.register_importRecent = "Εισαγωγή ιστορικού (Συνίσταται)";
    out.register_acceptTerms = "Αποδέχομαι <a href='/terms.html' tabindex='-1'>τους όρους χρήσης</a> της υπηρεσίας";
    out.register_passwordsDontMatch = "Οι κωδικοί δεν ταιριάζουν!";
    out.register_passwordTooShort = "Οι κωδικοί πρέπει να αποτελούνται από τουλάχιστον {0} χαρακτήρες.";

    out.register_mustAcceptTerms = "Πρέπει να αποδεχτείτε τους όρους της υπηρεσίας.";
    out.register_mustRememberPass = "Δεν μπορούμε να επαναφέρουμε τον κωδικό σας αν τον ξεχάσετε. Είναι πολύ σημαντικό να τον θυμάστε! Παρακαλούμε πατήστε στο κουτάκι για επιβεβαίωση.";

    out.register_header = "Καλώς ήρθατε στο CryptPad";
    out.register_explanation = [
        "<h3>Ας δούμε κάνα-δυο πράγματα πρώτα:</h3>",
        "<ul class='list-unstyled'>",
            "<li><i class='fa fa-info-circle'> </i> Ο κωδικός σας είναι το μυστικό κλειδί που κρυπτογραφεί όλα τα pads σας. Αν το χάσετε, δεν υπάρχει τρόπος να επαναφέρουμε τα δεδομένα σας.</li>",
            "<li><i class='fa fa-info-circle'> </i> Μπορείτε να εισάγετε τα pads που ανοίξατε πρόσφατα στον περιηγητή σας ώστε να τα έχετε στον λογαριασμό σας.</li>",
            "<li><i class='fa fa-info-circle'> </i> Αν χρησιμοποιείτε έναν κοινόχρηστο υπολογιστή, θα πρέπει να αποσυνδεθείτε όταν τελειώσετε, το να κλείσετε την καρτέλα δεν είναι αρκετό.</li>",
        "</ul>"
    ].join('');

    out.register_writtenPassword = "Έχω σημειώσει το όνομα χρήστη και τον κωδικό μου, συνέχεια";
    out.register_cancel = "Επιστροφή";

    out.register_warning = "Zero Knowledge σημαίνει πως δεν μπορούμε να επαναφέρουμε τον λογαριασμό σας αν χάσετε τον κωδικό σας.";

    out.register_alreadyRegistered = "Αυτός ο χρήστης υπάρχει ήδη, μήπως θέλετε να συνδεθείτε;";

    // Settings
    out.settings_cat_account = "Λογαριασμός";
    out.settings_cat_drive = "CryptDrive";
    out.settings_cat_code = "Κώδικας";
    out.settings_title = "Ρυθμίσεις";
    out.settings_save = "Αποθήκευση";

    out.settings_backupCategory = "Αντίγραφο ασφαλείας";
    out.settings_backupTitle = "Αποθηκεύστε ή επαναφέρετε όλα σας τα δεδομένα";
    out.settings_backup = "Δημιουργία αντιγράφου ασφαλείας";
    out.settings_restore = "Επαναφορά από αντίγραφο ασφαλείας";

    out.settings_resetNewTitle = "Εκκαθάριση του CryptDrive";
    out.settings_resetButton = "Αφαίρεση";
    out.settings_reset = "Αφαίρεση όλων των αρχείων και φακέλων από το CryptDrive σας";
    out.settings_resetPrompt = "Αυτή η ενέργεια θα αφαιρέσει όλα τα pads από τον αποθηκευτικό σας χώρο.<br>"+
                               "Θέλετε σίγουρα να συνεχίσετε;<br>" +
                               "Πληκτρολογήστε “<em>I love CryptPad</em>” για επιβεβαίωση.";
    out.settings_resetDone = "Ο αποθηκευτικός σας χώρος είναι πλέον άδειος!";
    out.settings_resetError = "Λάθος κείμενο επιβεβαίωσης. Το CryptDrive σας δεν έχει αλλαχθεί.";

    out.settings_resetTipsAction = "Επαναφορά";
    out.settings_resetTips = "Συμβουλές";
    out.settings_resetTipsButton = "Επαναφέρετε όλες τις διαθέσιμες συμβουλές για το CryptDrive";
    out.settings_resetTipsDone = "Όλες οι συμβουλές είναι πάλι ορατές.";

    out.settings_thumbnails = "Μικρογραφίες";
    out.settings_disableThumbnailsAction = "Απενεργοποίηση μικρογραφιών στο CryptDrive σας";
    out.settings_disableThumbnailsDescription = "Οι μικρογραφίες δημιουργούνται αυτόματα και αποθηκεύονται στον περιηγητή σας όταν επισκέπτεστε ένα νέο pad. Μπορείτε να απενεργοποιήσετε αυτό το χαρακτηριστικό εδώ.";
    out.settings_resetThumbnailsAction = "Εκκαθάριση";
    out.settings_resetThumbnailsDescription = "Εκκαθάριση όλων των μικρογραφιών που έχουν αποθηκευτεί στον περιηγητή σας.";
    out.settings_resetThumbnailsDone = "Όλες οι μικρογραφίες έχουν διαγραφεί.";

    out.settings_importTitle = "Εισάγετε τα πρόσφατα pads αυτού του περιηγητή στο CryptDrive σας";
    out.settings_import = "Εισαγωγή";
    out.settings_importConfirm = "Είσαστε σίγουρος ότι θέλετε να εισάγετε τα πρόσφατα pads από αυτόν τον περιηγητή στον λογαριασμό χρήστη σας στο CryptDrive?";
    out.settings_importDone = "Εισαγωγή ολοκληρώθηκε";

    out.settings_userFeedbackTitle = "Αναπληροφόρηση";
    out.settings_userFeedbackHint1 = "Το CryptPad αποστέλλει κάποιες πολύ βασικές πληροφορίες σ' εμάς, ώστε να μας ενημερώσει για το πως μπορούμε να βελτιώσουμε την εμπειρία σας.";
    out.settings_userFeedbackHint2 = "Το περιεχόμενο των pads σας δεν διαμοιράζεται ποτέ μαζί μας.";
    out.settings_userFeedback = "Ενεργοποίηση αναπληροφόρησης χρήστη";

    out.settings_anonymous = "Δεν είσαστε συνδεδεμένος. Οι τρέχουσες ρυθμίσεις ισχύουν μόνο για τον συγκεκριμένο περιηγητή.";
    out.settings_publicSigningKey = "Δημόσιο κλειδί κρυπτογράφησης";

    out.settings_usage = "Χρήση";
    out.settings_usageTitle = "Δείτε ολόκληρο το μέγεθος των καρφιτσωμένων pads σας σε MB";
    out.settings_pinningNotAvailable = "Τα καρφιτσωμένα pads είναι διαθέσιμα μόνο σε εγγεγραμένους χρήστες.";
    out.settings_pinningError = "Κάτι πήγε στραβά";
    out.settings_usageAmount = "Τα καρφιτσωμένα pads σας καταναλώνουν σε χώρο {0}MB";

    out.settings_logoutEverywhereButton = "Αποσύνδεση";
    out.settings_logoutEverywhereTitle = "Αποσύνδεση παντού";
    out.settings_logoutEverywhere = "Εξαναγκασμός αποσύνδεσης όλων των άλλων διαδικτυακών συνεδριών.";
    out.settings_logoutEverywhereConfirm = "Είσαστε σίγουροι; Θα χρειαστεί να επανασυνδεθείτε σε όλες σας τις συσκευές.";

    out.settings_codeIndentation = 'Εσοχές στον επεξεργαστή κώδικα (κενά)';
    out.settings_codeUseTabs = "Εισαγωγή εσoχών με χρήση του πλήκτρου tab, αντί κενών";

    out.upload_title = "Μεταφόρτωση αρχείου";
	out.upload_rename = "Θέλετε να μετονομάσετε το <b>{0}</b> πριν το μεταφορτώσετε στον διακομιστή;<br>" +
                        "<em>Η κατάληξη του αρχείου ({1}) θα προστεθεί αυτόματα. "+
                        "Αυτό το όνομα θα είναι μόνιμο και ορατό σε άλλους χρήστες.</em>";
    out.upload_serverError = "Λάθος Διακομιστή: δεν μπορούμε να μεταφορτώσουμε το αρχείο σας αυτή την στιγμή.";
    out.upload_uploadPending = "Προσπαθείτε ήδη να μεταφορτώσετε κάτι αυτή την στιγμή. Ακύρωση και μεταφόρτωση του κανούριου σας αρχείου;";
    out.upload_success = "Το αρχείο σας ({0}) έχει μεταφορτωθεί επιτυχώς κι έχει προστεθεί στον αποθηκευτικό σας χώρο.";
    out.upload_notEnoughSpace = "Δεν υπάρχει αρκετός αποθηκευτικός χώρος γι' αυτό το αρχείο στο CryptDrive σας.";
    out.upload_tooLarge = "Αυτό το αρχείο ξεπερνάει το μέγιστο μέγεθος μεταφόρτωσης.";
    out.upload_choose = "Επιλέξτε ένα αρχείο";
    out.upload_pending = "Εκρεμμεί";
    out.upload_cancelled = "Ακυρώθηκε";
    out.upload_name = "Όνομα αρχείου";
    out.upload_size = "Μέγεθος";
    out.upload_progress = "Εξέλιξη";
    out.upload_mustLogin = "Πρέπει να είσαστε συνδεδεμένος για να μεταφορτώσετε ένα αρχείο";
    out.download_button = " Αποκρυπτογράφηση & Κατέβασμα";
    out.download_mt_button = "Λήψη";

    out.todo_title = "CryptTodo";
    out.todo_newTodoNamePlaceholder = "Περιγράψτε την εργασία σας...";
    out.todo_newTodoNameTitle = "Προσθέστε την εργασία σας στη λίστα εργασιών";
    out.todo_markAsCompleteTitle = "Σημειώστε αυτή την εργασία ως ολοκληρωμένη";
    out.todo_markAsIncompleteTitle = "Σημειώστε αυτή την εργασία ως ανολοκλήρωτη";
    out.todo_removeTaskTitle = "Αφαιρέστε αυτή την εργασία από την λίστα εργασιών σας";

    // pad
    out.pad_showToolbar = "Εμφάνιση γραμμής εργαλείων";
    out.pad_hideToolbar = "Απόκρυψη γραμμής εργαλείων";

    // general warnings
    out.warn_notPinned = "Αυτό το pad δεν είναι αποθηκευμένο σε κάποιο CryptDrive. Θα διαγραφεί σε 3 μήνες. <a href='/about.html#pinning'>Μάθετε περισσότερα...</a>";

    // markdown toolbar
    out.mdToolbar_button = "Εμφάνιση ή απόκρυψη της γραμμής εργαλείων Markdown";
    out.mdToolbar_defaultText = "Το κείμενο σας εδώ";
    out.mdToolbar_help = "Βοήθεια";
    out.mdToolbar_tutorial = "http://www.markdowntutorial.com/";
    out.mdToolbar_bold = "Έντονα";
    out.mdToolbar_italic = "Πλάγια";
    out.mdToolbar_strikethrough = "Διεγραμμένα";
    out.mdToolbar_heading = "Επικεφαλίδα";
    out.mdToolbar_link = "Σύνδεσμος";
    out.mdToolbar_quote = "Παράθεση";
    out.mdToolbar_nlist = "Λίστα με αριθμούς";
    out.mdToolbar_list = "Λίστα με σημεία";
    out.mdToolbar_check = "Λίστα εργασιών";
    out.mdToolbar_code = "Κώδικας";

    // index.html


    //about.html
    out.main_p2 = 'Αυτό το εγχείρημα χρησιμοποιεί τον γραφικό επεξεργαστή <a href="http://ckeditor.com/">CKEditor</a>, <a href="https://codemirror.net/">CodeMirror</a>, και την μηχανή πραγματικού χρόνου <a href="https://github.com/xwiki-contrib/chainpad">ChainPad</a>.';
    out.main_howitworks_p1 = 'Το CryptPad χρησιμοποιεί μια παραλλαγή του αλγόριθμου <a href="https://en.wikipedia.org/wiki/Operational_transformation">Operational transformation</a> με τον οποίο καταφέρνει να πετύχει κατανεμημένη συναίνεση χρησιμοποιώντας <a href="https://bitcoin.org/bitcoin.pdf">Blockchain</a>, μια δομή που έγινε δημοφιλής μέσω του <a href="https://en.wikipedia.org/wiki/Bitcoin">Bitcoin</a>. Με αυτό τον τρόπο ο αλγόριθμος αποφεύγει την ανάγκη ύπαρξης ενός κεντρικού διακομιστή για να επιλύσει συγκρούσεις ταυτόχρονης επεξεργασίας και χωρίς την ανάγκη επίλυσης αυτών των συγκρούσεων, ο διακομιστής δεν χρειάζεται να έχει γνώση του περιεχομένου που υπάρχει στο pad.';

    // contact.html
    out.main_about_p2 = 'Αν έχετε απορίες ή σχόλια, επικοινωνήστε μαζί μας!<br/>Μπορείτε να στείλετε <a href="https://twitter.com/cryptpad"><i class="fa fa-twitter"></i>ένα tweet</a>, να δημιουργήσετε ένα θέμα <a href="https://github.com/xwiki-labs/cryptpad/issues/" title="our issue tracker">στο <i class="fa fa-github"></i>GitHub</a>. Ελάτε να πείτε "γεια" <a href="https://riot.im/app/#/room/#cryptpad:matrix.org" title="Matrix">στο <i class="fa fa-comment"></i>Matrix κανάλι μας</a> ή στο IRC (#cryptpad on irc.freenode.net), ή <a href="mailto:research@xwiki.com"><i class="fa fa-envelope"></i>στείλτε μας ένα email</a>.';
    out.main_about_p22 = 'Στείλτε μας ένα tweet';
    out.main_about_p23 = 'Δημιουργήστε ένα θέμα στο GitHub';
    out.main_about_p24 = 'Πείτε "γεια" στο Matrix';
    out.main_about_p25 = 'Στείλτε μας ένα email';
    out.main_about_p26 = 'Αν έχετε απορίες ή σχόλια, επικοινωνήστε μαζί μας!';

    out.main_info = "<h2>Συνεργαστείτε με ασφάλεια</h2> Αναπτύξτε τις ιδέες σας μαζί με κοινά αρχεία όσο η τεχνολογία <strong>Zero Knowledge</strong> εξασφαλίζει την ιδιωτικότητά σας; <strong>ακόμη κι από εμάς</strong>.";
    out.main_catch_phrase = "Το Zero Knowledge σύννεφο";

    out.main_howitworks = 'Πως Λειτουργεί';
    out.main_zeroKnowledge = 'Πρωτόκολλο Zero Knowledge';
    out.main_zeroKnowledge_p = "Δεν χρειάζεται να μας εμπιστευθείτε όταν σας λέμε πως <em>δεν θα κοιτάξουμε</em> τα pads σας, διότι με την επαναστατική τεχνολογία Zero Knowledge του CryptPad <em>δεν μπορούμε</em> να τα κοιτάξουμε. Μάθετε περισσότερα για το πως προστατεύουμε την <a href=\"/privacy.html\" title='Privacy'>Ασφάλεια και Ιδιωτικότητά</a> σας.";
    out.main_writeItDown = 'Σημειώστε το';

    out.main_writeItDown_p = "Τα μεγαλύτερα έργα προέρχονται από τις μικρότερες ιδέες. Καταγράψτε τις στιγμές έμπνευσης και τις απροσδόκητες ιδέες σας διότι ποτέ δεν ξέρετε ποια από αυτές μπορεί να είναι η επόμενη μεγάλη ανακάλυψη.";
    out.main_share = 'Μοιραστείτε τον σύνδεσμο, μοιραστείτε το pad';
    out.main_share_p = "Αναπτύξτε τις ιδέες σας μαζί: πραγματοποιήστε αποτελεσματικές συναντήσεις, συνεργαστείτε στις λίστες εργασιών και κάντε γρήγορες παρουσιάσεις με όλους τους φίλους σας και από όλες τις συσκευές σας.";
    out.main_organize = 'Οργανωθείτε';
    out.main_organize_p = "Με το CryptPad Drive, μπορείτε να συγκεντρωθείτε στο τι είναι σημαντικό. Οι φάκελοι σας επιτρέπουν να ελέγχετε τα έργα σας και να έχετε μία συνολική εικόνα για το πως προχωράνε τα πράγματα.";
    out.tryIt = 'Δοκιμάστε το!';
    out.main_richText = 'Επεξεργαστής Εμπλουτισμένου Κειμένου';
    out.main_richText_p = 'Επεξεργαστείτε pads εμπλουτισμένου κειμένου συνεργατικά με την πραγματικού χρόνου Zero Knowledge εφαρμογή μας <a href="http://ckeditor.com" target="_blank">CkEditor</a>.';
    out.main_code = 'Επεξεργαστής κώδικα';
    out.main_code_p = 'Επεξεργαστείτε κώδικα συνεργατικά με την πραγματικού χρόνου Zero Knowledge εφαρμογή μας <a href="https://www.codemirror.net" target="_blank">CodeMirror</a>.';
    out.main_slide = 'Επεξεργαστής Slide';
    out.main_slide_p = 'Δημιουργείστε τις παρουσιάσεις σας χρησιμοποιώντας μορφοποίηση Markdown και προβάλλετέ τις στον περιηγητή σας.';
    out.main_poll = 'Δημοσκοπήσεις';
    out.main_poll_p = 'Προγραμματίστε την συνάντησή σας ή την δραστηριότητά σας, ή ψηφίστε την καλύτερη λύση σχετικά με το πρόβλημά σας.';
    out.main_drive = 'CryptDrive';

    out.main_richTextPad = 'Pad εμπλουτισμένου κειμένου';
    out.main_codePad = 'Pad κώδικα';
    out.main_slidePad = 'Markdown παρουσίαση';
    out.main_pollPad = 'Δημοσκόπηση ή Χρονοδιάγραμμα';
    out.main_whiteboardPad = 'Πίνακας σχεδιασμού';
    out.main_localPads = 'Τοπικά pads';
    out.main_yourCryptDrive = 'Το CryptDrive σας';
    out.main_footerText = "Με το CryptPad, μπορείτε να δημιουργήσετε γρήγορα συνεργατικά έγγραφα για κοινόχρηστες σημειώσεις και καταγραφή ιδεών.";

    out.footer_applications = "Εφαρμογές";
    out.footer_contact = "Επικοινωνία";
    out.footer_aboutUs = "Σχετικά με εμάς";

    out.about = "Σχετικά";
    out.privacy = "Ιδιωτικότητα";
    out.contact = "Επικοινωνία";
    out.terms = "Όροι χρήσης";
    out.blog = "Ιστολόγιο";

    out.topbar_whatIsCryptpad = "Τι είναι το CryptPad";

    // what-is-cryptpad.html

    out.whatis_title = 'Τι είναι το CryptPad';
    out.whatis_collaboration = 'Γρήγορη, εύκολη συνεργασία';
    out.whatis_collaboration_p1 = 'Με το CryptPad, μπορείτε να δημιουργείτε όλοι μαζί γρήγορα συνεργατικά έγγραφα για τις σημειώσεις σας και τις ιδέες που καταγράφετε. Όταν εγγραφείτε και συνδεθείτε, σας δίνεται άμεσα η δυνατότητα \'ανεβάσματος\' κι έναν \'αποθηκευτικό χώρο\' CryptDrive όπου μπορείτε να οργανώσετε όλα σας τα pads. Ως εγγεγραμένος χρήστης παίρνετε 50MB δωρεάν.';
    out.whatis_collaboration_p2 = 'Μπορείτε να μοιραστείτε την πρόσβαση σε ένα έγγραφο του CryptPad απλά δίνοντας τον σύνδεσμο σε κάποιον άλλο. Μπορείτε επίσης να μοιραστείτε ένα σύνδεσμο ο οποίος παρέχει πρόσβαση <em>μόνο για ανάγνωση</em> σε ένα pad, επιτρέποντάς σας να κοινοποιήσετε την συλλογική σας δουλειά ενώ ταυτόχρονα έχετε ακόμα τη δυνατότητα να το επεξεργαστείτε.';
    out.whatis_collaboration_p3 = 'Μπορείτε να δημιουργήσετε απλά εμπλουτισμένα κείμενα με το <a href="http://ckeditor.com/">CKEditor</a> όπως επίσης κείμενα με γλώσσα προγραμματισμού Markdown τα οποία τροποποιούνται σε πραγματικό χρόνο καθώς πληκτρολογείτε. Μπορείτε επίσης να χρησιμοποιήσετε την εφαρμογή δημοσκόπησης για να προγραμματίσετε δραστηριότητες με πολλαπλούς συμμετέχοντες.';
    out.whatis_zeroknowledge = 'Zero Knowledge';
    out.whatis_zeroknowledge_p1 = "Δεν θέλουμε να ξέρουμε τι πληκτρολογείτε και με τον σύγχρονο τρόπο κρυπτογράφησης μπορείτε να είσαστε σίγουροι ότι δεν μπορούμε να ξέρουμε. Το CryptPad χρησιμοποιεί <strong>100% κρυπτογράφηση client side</strong> για να προστατεύσει το περιεχόμενο που πληκτρολογείτε από εμάς, τους ανθρώπους που φιλοξενούν τον διακομιστή.";
    out.whatis_zeroknowledge_p2 = 'Όταν κάνετε εγγραφή και συνδέεστε, το όνομα χρήστη σας κι ο κωδικός σας μετατρέπονται σε ένα κρυπτογραφημένο κλειδί χρησιμοποιώντας το <a href="https://en.wikipedia.org/wiki/Scrypt">scrypt key derivation function</a>. Το συγκεκριμένο κλειδί, το όνομα χρήστη κι ο κωδικός χρήστη δεν στέλνονται καν στον διακομιστή. Αντιθέτως χρησιμοποιούνται από το client side για να αποκρυπτογραφήσουν το περιεχόμενο του CryptDrive σας, το οποίο περιέχει όλα τα κλειδιά για όλα τα pads στα οποία μπορείτε να έχετε πρόσβαση.';
    out.whatis_zeroknowledge_p3 = 'Όταν μοιράζεστε έναν σύνδεσμο προς ένα έγγραφο, μοιράζεστε το κρυπτογραφημένο κλειδί για το συγκεκριμένο έγγραφο αλλά εφόσον το κλειδί είναι στο <a href="https://en.wikipedia.org/wiki/Fragment_identifier">fragment identifier</a>, δεν στέλνεται ποτέ απευθείας στον διακομιστή. Επισκεφθείτε το <a href="https://blog.cryptpad.fr/2017/07/07/cryptpad-analytics-what-we-cant-know-what-we-must-know-what-we-want-to-know/">privacy blog post</a> για να μάθετε περισσότερα σχετικά με το σε ποια μεταδεδομένα έχουμε πρόσβαση και σε ποια όχι.';
    out.whatis_drive = 'Οργάνωση με το CryptDrive';
    out.whatis_drive_p1 = 'Κάθε φορά που επισκέπτεσθε ένα pad στο CryptPad, το pad προστίθεται αυτόματα στο CryptDrive στον κυρίως φάκελο. Αργότερα μπορείτε να οργανώσετε αυτά τα pad σε φακέλους ή μπορείτε να τα μετακινήσετε στον κάδο ανακύκλωσης. Το CryptDrive σας επιτρέπει να περιηγηθείτε ανάμεσα στα pads σας και να τα οργανώνετε όποτε κι όπως θέλετε.';
    out.whatis_drive_p2 = 'Με το κλασικό drag-and-drop,  μπορείτε να μεταφέρετε pads μέσα στον αποθηκευτικό σας χώρο και ο σύνδεσμος αυτών των pads θα παραμείνει ο ίδιος ώστε οι συνεργάτες σας να μην σταματήσουν ποτέ να έχουν πρόσβαση.';
    out.whatis_drive_p3 = 'Μπορείτε επίσης να ανεβάσετε αρχεία στο CryptDrive σας και να τα μοιραστείτε με συνεργάτες. Τα ανεβασμένα αρχεία μπορούν να οργανωθούν ακριβώς όπως τα συνεργατικά pads.';
    out.whatis_business = 'Το CryptPad για επιχειρήσεις';
    out.whatis_business_p1 = 'Το πρωτόκολλο κρυπτογράφησης Zero Knowledge του CryptPad είναι ιδανικό για να πολλαπλασιαστεί η αποτελεσματικότητα των ήδη υπάρχοντων πρωτοκόλλων ασφαλείας προστατεύοντας τα εταιρικά στοιχεία πρόσβασης με ισχυρή κρυπτογράφηση. Επειδή τα ευαίσθητα δεδομένα μπορούν να αποκρυπτογραφηθούν μόνο με την χρήση των στοιχείων των υπαλλήλων, το CryptPad εξαλείφει τον παράγοντα hacker ο οποίος ενυπάρχει σε παραδοσιακούς εταιρικούς διακομιστές. Διαβάστε το <a href="https://blog.cryptpad.fr/images/CryptPad-Whitepaper-v1.0.pdf">CryptPad Whitepaper</a> για να μάθετε περισσότερα σχετικά με το πως μπορεί να βοηθήσει την επιχείρησή σας.';
    out.whatis_business_p2 = 'To CryptPad μπορεί να εγκατασταθεί τοπικά και οι <a href="https://cryptpad.fr/about.html">προγραμματιστές του</a> στην XWiki SAS είναι σε θέση να προσφέρουν εμπορική υποστήριξη, τροποποιήσεις και περαιτέρω ανάπτυξη. Επικοινωνήστε στο <a href="mailto:sales@cryptpad.fr">sales@cryptpad.fr</a> για περισσότερες πληροφορίες.';

    // privacy.html

    out.policy_title = 'Πολιτική απορρήτου του CryptPad';
    out.policy_whatweknow = 'Τι γνωρίζουμε για εσάς';
    out.policy_whatweknow_p1 = 'Ως εφαρμογή η οποία φιλοξενείται στο διαδίκτυο, το CryptPad έχει πρόσβαση στα μεταδεδομένα που είναι εκτεθειμένα από το πρωτόκολλο HTTP. Αυτό συμπεριλαμβάνει την διεύθυνση IP σας και ποικίλες HTTP κεφαλίδες που μπορούν να χρησιμοποιηθούν για να ταυτοποιήσουν τον συγκεκριμένο περιηγητή. Μπορείτε να δείτε τι πληροφορίες μοιράζεται ο περιηγητής σας με το να επισκεφθείτε <a target="_blank" rel="noopener noreferrer" href="https://www.whatismybrowser.com/detect/what-http-headers-is-my-browser-sending" title="what http headers is my browser sending">WhatIsMyBrowser.com</a>.';
    out.policy_whatweknow_p2 = 'Χρησιμοποιούμε το <a href="https://www.elastic.co/products/kibana" target="_blank" rel="noopener noreferrer" title="open source analytics platform">Kibana</a>, μια πλατφόρμα ανάλυσης ανοιχτού κώδικα, για να μάθουμε περισσότερα για τους χρήστες μας. Το Κibana μας ενημερώνει για το πως βρήκατε το CryptPad, μέσω απευθείας σύνδεσης, μέσω μηχανής αναζήτησης, ή μέσω αναφοράς από άλλη διαδυκτιακή υπηρεσία όπως το Reddit ή το Twitter.';
    out.policy_howweuse = 'Πώς χρησιμοποιούμε αυτά που μαθαίνουμε';
    out.policy_howweuse_p1 = 'Χρησιμοποιούμε αυτές τις πληροφορίες για να παίρνουμε καλύτερες αποφάσεις σχετικά με την προώθηση του CryptPad, εξετάζοντας ποιες από τις προηγούμενες προσπάθειές μας υπήρξαν επιτυχείς. Οι πληροφορίες σχετικά με την τοποθεσία σας μας βοηθούν στο να σκεφτούμε αν θα έπρεπε να παρέχουμε καλύτερη υποστήριξη για γλώσσες εκτός των Αγγλικών.';
    out.policy_howweuse_p2 = "Οι πληροφορίες σχετικά με τον περιηγητή σας (είτε είναι επιτραπέζιου είτε φορητού λειτουργικού συστήματος) μας βοηθάνε να παίρνουμε αποφάσεις στο θέμα προτεραιοτήτων βελτίωσης χαρακτηριστικών. Η ομάδα προγραμματισμού μας είναι μικρή και προσπαθούμε να κάνουμε επιλογές οι οποίες θα βελτιώσουν την εμπειρία όσων το δυνατό περισσότερων χρηστών.";
    out.policy_whatwetell = 'Τι λέμε σε άλλους για εσάς';
    out.policy_whatwetell_p1 = 'Δεν παρέχουμε σε τρίτους τις πληροφορίες που συλλέγουμε ή τις πληροφορίες που μας δίνετε εκτός κι αν είμαστε υποχρεωμένοι νομικά.';
    out.policy_links = 'Σύνδεσμοι σε άλλες σελίδες';
    out.policy_links_p1 = 'Αυτή η ιστοσελίδα περιέχει συνδέσμους προς άλλες σελίδες, συμπεριλαμβανομένων αυτών που δημιουργήθηκαν από άλλους οργανισμούς. Δεν είμαστε υπεύθυνοι για την πολιτική απορρήτου ή το περιεχόμενο μιας εξωτερικής σελίδας. Ως γενικό κανόνα έχουμε πως οι σύνδεσμοι σε διαφορετικές σελίδες ανοίγουν σε καινούριο παράθυρο για να είναι ξεκάθαρο ότι φεύγετε από το CryptPad.fr.';
    out.policy_ads_p1 = 'Δεν προβάλουμε διαφημίσεις εντός της υπηρεσίας, όμως μπορεί να παρέχουμε συνδέσμους στους ανθρώπους που ενισχύουν οικονομικά την έρευνά μας.';
    out.policy_choices = 'Οι επιλογές που έχετε';
    out.policy_choices_open = 'Ο κώδικάς μας διατίθεται ελεύθερα, οπότε έχετε πάντα την επιλογή να φιλοξενήσετε το Cryptpad σε δικό σας διακομιστή.';
    out.policy_choices_vpn = 'Εάν θέλετε να χρησιμοποιήσετε τη δική μας εκδοχή του Cryptpad, αλλά δεν θέλετε να φαίνεται η IP διεύθυνσή σας, μπορείτε να προστατέψετε την IP σας χρησιμοποιώντας το <a href="https://www.torproject.org/projects/torbrowser.html.en" title="downloads from the Tor project" target="_blank" rel="noopener noreferrer">Tor browser bundle</a>, ή ένα <a href="https://riseup.net/en/vpn" title="VPNs provided by Riseup" target="_blank" rel="noopener noreferrer">VPN</a>.';
    out.policy_choices_ads = 'Εάν θα θέλατε απλά να εμποδίσετε την πλατφόρμα ανάλυσής μας, μπορείτε να χρησιμοποιήσετε εργαλεία απόκρυψης διαφημίσεων όπως το <a href="https://www.eff.org/privacybadger" title="download privacy badger" target="_blank" rel="noopener noreferrer">Privacy Badger</a>.';

    // terms.html

    out.tos_title = " Όροι και Προϋποθέσεις του CryptPad";
    out.tos_legal = "Παρακαλούμε μην κάνετε κακή χρήση ή/και κατάχρηση της υπηρεσίας ή οτιδήποτε παράνομο.";
    out.tos_availability = "Ελπίζουμε να βρείτε χρήσιμη αυτή την υπηρεσία, αλλά η προσβασιμότητα κι η απόδοση δεν μπορούν να εγγυηθούν. Παρακαλούμε κάνετε εξαγωγή των δεδομένων σας συχνά.";
    out.tos_e2ee = "Τα περιεχόμενα του CryptPad μπορούν να διαβαστούν ή να αλλαχθούν από οποιονδήποτε μπορεί να μαντέψει ή να αποκτήσει την ηλεκτρονική διεύθυνση του pad. Προτείνουμε να χρησιμοποιείτε τεχνολογία κρυπτογραφημένων μηνυμάτων από άκρη σε άκρη (e2ee) για να μοιράζεστε συνδέσμους και να μην αναλάβετε καμία ευθύνη σε περίπτωση που διαρρέυσει κάποιος τέτοιος σύνδεσμος.";
    out.tos_logs = "Τα μεταδεδομένα που παρέχονται από τον περιηγητή σας στον διακομιστή μπορεί να καταγράφονται με σκοπό τη συντήρηση της υπηρεσίας.";
    out.tos_3rdparties = "Δεν παρέχουμε προσωπικά δεδομένα σε τρίτους παρά μόνο εάν ζητηθεί από το νόμο.";
    
	// 404 page
    out.four04_pageNotFound = "Η σελίδα που ψάχνετε, δεν βρέθηκε!";

    // BottomBar.html

    //out.bottom_france = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer">Δημιουργήθηκε με <img class="bottom-bar-heart" src="/customize/heart.png" alt="love" /> στην <img class="bottom-bar-fr" src="/customize/fr.png" alt="Γαλλία" /></a>';
    //out.bottom_support = '<a href="http://labs.xwiki.com/" title="XWiki Labs" target="_blank" rel="noopener noreferrer">Ένα <img src="/customize/logo-xwiki2.png" alt="XWiki SAS" class="bottom-bar-xwiki"/> Labs Project </a> με την υποστήριξη του <a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';

    // Header.html

    out.header_france = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer">Με <img class="bottom-bar-heart" src="/customize/heart.png" alt="love" /> στην <img class="bottom-bar-fr" src="/customize/fr.png" title="Γαλλία" alt="Γαλλία"/> από την <img src="/customize/logo-xwiki.png" alt="XWiki SAS" class="bottom-bar-xwiki"/></a>';

    out.header_support = '<a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';
    out.updated_0_header_logoTitle = 'Μετάβαση στο CryptDrive σας';
    out.header_logoTitle = out.updated_0_header_logoTitle;
    out.header_homeTitle = 'Μετάβαση στην αρχική σελίδα του CryptPad';

    // Initial states

    out.initialState = [
        '<p>',
        'Αυτό είναι&nbsp;<strong>CryptPad</strong>, ο συνεργατικός επεξεργαστής πραγματικού χρόνου Zero Knowledge. Τα πάντα αποθηκεύονται καθώς πληκτρολογείτε.',
        '<br>',
        'Μοιραστείτε τον σύνδεσμο σε αυτό το pad για να το επεξεργαστείτε με φίλους ή χρησιμοποιήστε το κουμπί <span class="fa fa-share-alt" style="border: 1px solid black;color:#000;">&nbsp;Share&nbsp;</span> για να μοιραστείτε ένα κείμενο με δικαιώματα <em>read-only link</em>&nbsp;το οποίο επιτρέπει να το αναγνώσει κάποιος αλλά όχι να το επεξεργαστεί.',
        '</p>',

        '<p><em>',
        'Εμπρός, απλά ξεκινήστε να πληκτρολογείτε...',
        '</em></p>',
        '<p>&nbsp;<br></p>'
    ].join('');

    out.codeInitialState = [
        '# Ο συνεργατικός επεξεργαστής Zero Knowledge του CryptPad\n',
        '\n',
        '* Ό,τι πληκτρολογείτε εδώ είναι κρυπτογραφημένο έτσι ώστε μόνο οι άνθρωποι που έχουν τον σύνδεσμο να μπορούν να έχουν πρόσβαση.\n',
        '* Μπορείτε να επιλέξετε την γλώσσα προγραμματισμού για να υπογραμμίζετε και το χρώμα του θέματος UI πάνω δεξιά.'
    ].join('');

    out.slideInitialState = [
        '# CryptSlide\n',
        '* Αυτός είναι ένας συνεργατικός επεξεργαστής πραγματικού χρόνου με τεχνολογία zero knowledge.\n',
        '* Ό,τι πληκτρολογείτε εδώ είναι κρυπτογραφημένο έτσι ώστε μόνο οι άνθρωποι που έχουν τον σύνδεσμο να μπορούν να έχουν πρόσβαση.\n',
        '* Ακόμη κι ο διακομιστής δεν μπορεί να δει τι πληκτρολογείτε.\n',
        '* Ό,τι δείτε εδώ, ό,τι ακούσετε εδώ, όταν φύγετε από εδώ, θα παραμείνει εδώ.\n',
        '\n',
        '---',
        '\n',
        '# Πως να το χρησιμοποιήσετε\n',
        '1. Γράψτε τα περιεχόμενα των slides σας χρησιμοποιώντας σύνταξη markdown\n',
        '  - Μάθετε περισσότερα για την σύνταξη markdown [εδώ](http://www.markdowntutorial.com/)\n',
        '2. Διαχωρίστε τα slides σας με ---\n',
        '3. Πατήστε το κουμπάκι "Play" για να δείτε το αποτέλεσμα',
        '  - Τα slides σας ενημερώνονται σε πραγματικό χρόνο'
    ].join('');

    // Readme

    out.driveReadmeTitle = "Τι είναι το CryptPad;";
    out.readme_welcome = "Καλωσήρθατε στο CryptPad!";
    out.readme_p1 = "Καλωσήρθατε στο CryptPad, όπου μπορείτε να έχετε τις σημειώσεις σας μόνοι σας ή με φίλους.";
    out.readme_p2 = "Αυτό το pad έχει έναν γρήγορο οδηγό χρήσης του πως να χρησιμοποιήσετε το CryptPad για να κρατάτε σημειώσεις, να τις έχετε οργανωμένες και να δουλέψετε πάνω τους συνεργατικά.";
    out.readme_cat1 = "Μάθετε το CryptDrive σας";
    out.readme_cat1_l1 = "Δημιούργηστε ένα pad: Στο CryptDrive σας, κάντε \"κλικ\" στο {0} και έπειτα στο {1} και μπορείτε να δημιουργήσετε ένα pad."; // 0: New, 1: Rich Text
    out.readme_cat1_l2 = "Ανοίξτε pads από το CryptDrive σας: κάντε διπλό \"κλικ\" σε ένα εικονίδιο pad για να το ανοίξετε.";
    out.readme_cat1_l3 = "Οργάνωστε τα pads σας: Όταν είσαστε συνδεδεμένοι, κάθε pad στο οποίο έχετε πρόσβαση θα εμφανίζεται ως {0} στο τμήμα του δίσκου σας."; // 0: Unsorted files
    out.readme_cat1_l3_l1 = "Μπορείτε να κάνετε \"κλικ\" και να σύρετε αρχεία μέσα σε φακέλους στον τομέα {0} του δίσκου σας και να δημιουργήσετε καινούρια αρχεία."; // 0: Documents
    out.readme_cat1_l3_l2 = "Θυμηθείτε να δοκιμάζετε το δεξί \"κλικ\" στα εικονίδια διότι συχνά υπάρχουν επιπρόσθετα μενού.";
    out.readme_cat1_l4 = "Πετάξτε τα παλιά pads στα σκουπίδια: Μπορείτε να κάνετε \"κλικ\" και να σύρετε τα pads μέσα στα {0} με τον ίδιο τρόπο που τα σύρετε μέσα στους φακέλους."; // 0: Trash
    out.readme_cat2 = "Δημιουργείστε pads σαν επαγγελματίας";
    out.edit = "επεξεργασία";
    out.view = "προβολή";
    out.readme_cat2_l1 = "Το κουμπί {0} στο pad σας επιτρέπει να δίνετε πρόσβαση στους συνεργάτες σας είτε να κάνουν {1} είτε να κάνουν {2} το pad."; // 0: Share, 1: edit, 2: view
    out.readme_cat2_l2 = "Αλλάξτε τον τίτλο του pad κάνοντας \"κλικ\" στο μολύβι";
    out.readme_cat3 = "Ανακαλύψτε CryptPad εφαρμογές";
    out.readme_cat3_l1 = "Με το CryptPad code editor, μπορείτε να συνεργαστείτε σε κώδικα όπως οι γλώσσες προγραμματισμού Javascript και markdown ή HTML και Markdown";
    out.readme_cat3_l2 = "Με το CryptPad slide editor, μπορείτε να κάνετε γρήγορες παρουσιάσεις χρησιμοποιώντας γλώσσα Markdown";
    out.readme_cat3_l3 = "Με το CryptPoll μπορείτε να ψηφίζετε γρήγορα, ειδικά για να ορίζετε συναντήσεις σε ημερομηνίες που ταιριάζουν με το πρόγραμμα όλων";

    // Tips
    out.tips = {};
    out.tips.shortcuts = "`ctrl+b`, `ctrl+i` και `ctrl+u` είναι γρήγορες συντομεύσεις για έντονα, πλάγια και υπογραμμισμένα γράμματα.";
    out.tips.indent = "Σε αριθμημένες λίστες όπως και λίστες με τελείες, μπορείτε να χρησιμοποιήσετε tab ή shift+tab για να αυξήσετε ή να μειώσετε τις εσοχές με γρήγορο τρόπο.";
    out.tips.store = "Κάθε φορά που επισκέπτεστε ένα pad, εάν είσαστε συνδεδεμένοι, θα σώζεται αυτόματα στο CryptDrive σας.";
    out.tips.marker = "Μπορείτε να υπογραμμίσετε κείμενο σε ένα pad χρησιμοποιώντας τον \"μαρκαδόρο\" από το μενού μορφoποίησης.";
    out.tips.driveUpload = "Οι εγγεγραμένοι χρήστες μπορούν να ανεβάσουν κρυπτογραφημένα αρχεία σύροντάς τα και πετώντας τα στο CryptDrive τους.";
    out.tips.filenames = "Μπορείτε να μετονομάσετε αρχεία στο CryptDrive σας. Το όνομα που θα δώσετε είναι μόνο για εσάς.";
    out.tips.drive = "Οι συνδεδεμένοι χρήστες μπορούν να οργανώσουν τα αρχεία τους στο CryptDrive τους, τα οποία είναι προσβάσιμα από το εικονίδιο CryptPad που είναι πάνω αριστερά σε όλα τα pads.";
    out.tips.profile = "Οι εγγεγραμένοι χρήστες μπορούν να δημιουργήσουν ένα προφίλ από το μενού χρήστη πάνω δεξιά.";
    out.tips.avatars = "Μπορείτε να ανεβάσετε ένα άβαταρ στο προφίλ σας. Θα το βλέπουν οι άλλοι όταν συνεργάζεστε σε ένα pad.";
    out.tips.tags = "Βάλτε ετικέτες στα pads σας και ψάξτε με # στο CryptDrive σας για να τα βρείτε";

    out.feedback_about = "Εάν το διαβάζετε αυτό, πιθανότατα ήσασταν περίεργοι για ποιο λόγο το CryptPad ζητά ιστοσελίδες όταν κάνετε συγκεκριμένες ενέργειες";
    out.feedback_privacy = "Ενδιαφερόμαστε για την ιδιωτικότητά σας και ταυτόχρονα θέλουμε το CryptPad να είναι πολύ εύκολο στην χρήση. Χρησιμοποιούμε αυτό το αρχείο για να καταλάβουμε ποια χαρακτηριστικά του περιβάλλοντος διάδρασης ενδιαφέρουν τους χρήστες μας, με το να το ζητήσουμε σε συνδυασμό με μια παράμετρο η οποία μας δείχνει συγκεκριμένα ποια ενέργεια έγινε.";
    out.feedback_optout = "Εάν θα θέλατε να απέχετε, επισκεφθείτε <a href='/settings/'>τη σελίδα ρυθμίσεων</a> του λογαριασμού σας, όπου θα βρείτε ένα κουτί στο οποίο μπορείτε να ενεργοποιήσετε ή να απενεργοποιήσετε την αναπληροφόρηση";

    return out;
});
