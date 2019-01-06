/*
 * This is an internal language file.
 * If you want to change some translations in your CryptPad instance, use the '/customize/translations/messages.{LANG}.js'
 * file (make a copy from /customize.dist/translations/messages.{LANG}.js)
 */
define(function () {
    var out = {};

    // translations must set this key for their language to be available in
    // the language dropdowns that are shown throughout Cryptpad's interface
    out._languageName = 'German';

    out.main_title = "Cryptpad: Echtzeitzusammenarbeit ohne Preisgabe von Informationen";
    out.main_slogan = "Einigkeit ist Stärke - Zusammenarbeit der Schlüssel";

    out.type = {};
    out.type.pad = 'Pad';
    out.type.code = 'Code';
    out.type.poll = 'Umfrage';
    out.type.kanban = 'Kanban'; 
    out.type.slide = 'Präsentation';
    out.type.drive = 'CryptDrive';
    out.type.whiteboard = 'Whiteboard';
    out.type.file = 'Datei';
    out.type.media = 'Medien';
    out.type.todo = 'Aufgabe';
    out.type.contacts = 'Kontakte';

    out.button_newpad = 'Neues Pad';
    out.button_newcode = 'Neues Code Pad';
    out.button_newpoll = 'Neue Umfrage';
    out.button_newslide = 'Neue Präsentation';
    out.button_newwhiteboard = 'Neues Whiteboard';
    out.button_newkanban = 'Neues Kanban';  

    // NOTE: Remove updated_0_ if we need an updated_1_
    out.updated_0_common_connectionLost = "<b>Die Verbindung zum Server ist abgebrochen</b><br>Du verwendest jetzt das Dokument schreibgeschützt, bis die Verbindung wieder funktioniert.";
    out.common_connectionLost = out.updated_0_common_connectionLost;

    out.websocketError = 'Verbindung zum Websocket fehlgeschlagen...';
    out.typeError = "Dieses Dokument ist nicht mit dem Programm kompatibel";
    out.onLogout = 'Du bist ausgeloggt. {0}Klicke hier{1}, um wieder einzuloggen,<br>oder drücke die <em>Escape</em>taste, um dein Dokument schreibgeschützt zu benutzen.';
    out.wrongApp = "Der Inhalt dieser Echtzeitsitzung kann nicht in Deinem Browser angezeigt werden. Bitte lade die Seite neu.";
    out.padNotPinned = 'Dieses Dokument wird nach 3 Monaten ohne Zugang auslaufen, {0}logge dich ein{1} or {2}registriere dich{3}, um das Auslaufen zu verhindern.';
    out.anonymousStoreDisabled = "Der Webmaster dieses CryptPad Server hat die anonyme Verwendung deaktiviert. Du muss dich einloggen, um CryptDrive zu verwenden.";
    out.expiredError = 'Dieses Dokument ist abgelaufen und ist nicht mehr verfügbar.';
    out.deletedError = 'Dieses Dokument wurde von seinem Besitzer gelöscht und ist nicht mehr verfügbar.';
    out.inactiveError = 'Dieses Dokument ist wegen Inaktivität gelöscht worden. Drücke auf die Esc-Taste, um ein neues Dokument zu erstellen.';
    out.chainpadError = 'Ein kritischer Fehler ist beim Aktualisieren deines Dokuments aufgetreten. Dieses Dokument ist schreibgeschützt, damit du sicherstellen kannst, dass kein Inhalt verloren geht.<br>'+
                        'Drücke auf <em>Esc</em>, um das Dokument schreibgeschützt zu lesen, oder lade es neu, um das Editierien wieder aufzunehmen.';
    out.errorCopy = ' Du kannst noch den Inhalt woanders hin kopieren, nachdem du <em>Esc</em> gedrückt hast.<br>Wenn du die Seite verlässt, verschwindet der Inhalt für immer!';
    out.errorRedirectToHome = 'Drücke <em>Esc</em> um zu deinem CryptDrive zurückzukehren.';
    out.newVersionError = "Eine neue Version von CryptPad ist verfügbar.<br>" +    
                          "<a href='#'>Lade die Seite neu</a> um die neue version zu benutzen, oder drücke Esc um im <b>Offline-Modus</b> weiterzuarbeiten.";

    out.loading = "Laden...";
    out.error = "Fehler";
    out.saved = "Gespeichert";
    out.synced = "Alles gespeichert";
    out.deleted = "Dokumente, die von deinem CryptDrive gelöscht wurden";
    out.deletedFromServer = "Dokumente, die vom Server gelöscht wurden";

    out.realtime_unrecoverableError = "Es ist ein nicht reparierbarer Fehler aufgetreten.. Klicke auf OK, um neuzuladen.";

    out.disconnected = 'Getrennt';
    out.synchronizing = 'Synchronisieren';
    out.reconnecting = 'Verbindung wird aufgebaut';
    out.typing = "Es wird getippt";
    out.initializing = "Starten...";
    out.forgotten = 'Zum Papierkorb verschoben';
    out.errorState = 'Kritischer Fehler: {0}';
    out.lag = 'Verspätung';
    out.readonly = 'schreibgeschützt';
    out.anonymous = "Anonym";
    out.yourself = "Du";
    out.anonymousUsers = "anonyme Nutzer*innen";
    out.anonymousUser = "anonyme Nutzer*in";
    out.users = "Nutzer*innen";
    out.and = "Und";
    out.viewer = "Betrachter*in";
    out.viewers = "Betrachter*innen";
    out.editor = "Bearbeiter*in";
    out.editors = "Bearbeiter*innen";
    out.userlist_offline = "Du bist aktuell offline, die Benutzerliste ist nicht verfügbar.";

    out.language = "Sprache";

    out.comingSoon = "Kommt bald...";

    out.newVersion = '<b>CryptPad wurde aktualisiert!</b><br>' +
                     'Entdecke, was neu in dieser Version ist:<br>'+
                     '<a href="https://github.com/xwiki-labs/cryptpad/releases/tag/{0}" target="_blank">Release notes for CryptPad {0}</a>';

    out.upgrade = "aufrüsten";
    out.upgradeTitle = "Rüste dein Konto auf, um mehr Speicherplatz zu haben";

    out.upgradeAccount = "Konto aufrüsten";
    out.MB = "MB";
    out.GB = "GB";
    out.KB = "KB";

    out.supportCryptpad = "CryptPad unterstützen";

    out.formattedMB = "{0} MB";
    out.formattedGB = "{0} GB";
    out.formattedKB = "{0} KB";

    out.greenLight = "Alles funktioniert bestens";
    out.orangeLight = "Deine langsame Verbindung kann die Nutzung beeinträchtigen";
    out.redLight = "Du wurdest von dieser Sitzung getrennt";

    out.pinLimitReached = "Du hast Deine Speicherplatzgrenze erreicht";
    out.updated_0_pinLimitReachedAlert = "Du hast Deine Speicherplatzgrenze erreicht. Neue Dokumente werden nicht mehr in Deinem CryptDrive gespeichert.<br>" +
        'Du kannst entweder ein Dokument von deinem CryptDrive entfernen oder <a href="https://accounts.cryptpad.fr/#!on={0}" target="_blank">ein Premiumangebot anfordern</a>, damit deine Grenze erhöht wird.';
    out.pinLimitReachedAlert = out.updated_0_pinLimitReachedAlert;
    out.pinLimitReachedAlertNoAccounts = out.pinLimitReached;
    out.pinLimitNotPinned = "Du hast deine Speicherplatzgrenze erreicht.<br>"+
                            "Dieses Dokument ist nicht in deinem CryptDrive gespeichert.";
    out.pinLimitDrive = "Du hast deine Speicherplatzgrenze erreicht.<br>" +
                        "Du kannst keine neue Dokumente gestalten.";

    out.moreActions = "Mehr Aktionen";

    out.importButton = "Importieren";
    out.importButtonTitle = 'Importiere eine lokale Datei in dieses Dokument';

    out.exportButton = "Exportieren";
    out.exportButtonTitle = 'Exportiere dieses Dokument in eine lokale Datei';
    out.exportPrompt = 'Wie möchtest du die Datei nennen?';

      out.changeNamePrompt = 'Ändere deinen Namen (oder lasse dieses Feld leer, um anonym mitzuarbeiten): ';
    out.user_rename = "Bearbeite deinen Name";
    out.user_displayName = "Name";
    out.user_accountName = "Kontoname";

    out.clickToEdit = "Zum Bearbeiten klicken";
    out.saveTitle = "Bitte gib den Titel ein (Enter)";

    out.forgetButton = "Entfernen";
    out.forgetButtonTitle = 'Entferne dieses Dokument von deiner Startseitenliste';
    out.forgetButtonTitle = 'Dieses Dokument zum Papierkorb verschieben';
    out.forgetPrompt = 'Mit dem Klick auf OK wird das Dokument aus deinem lokalen Speicher gelöscht. Fortfahren?';
    out.movedToTrash = 'Dieses Dokument liegt im Papierkorb.<br>Du kannst <a href="/drive/">zum CryptDrive</a> navigieren';

    out.shareButton = 'Teilen';
    out.shareSuccess = 'Die URL wurde in die Zwischenablage kopiert';

    out.userListButton = "Benutzerliste";
       
    out.chatButton = "Chat";

    out.userAccountButton = "Dein Konto";

    out.newButton = 'Neu';
    out.newButtonTitle = 'Neues Dokument gestalten';
    out.uploadButton = 'Hochladen';
    out.uploadButtonTitle = 'Eine neue Datei in den aktuelle Ordner hochladen';

    out.saveTemplateButton = "Als Vorlage speichern";
    out.saveTemplatePrompt = "Bitte gib einen Titel für die Vorlage ein";
    out.templateSaved = "Vorlage gespeichert!";
    out.selectTemplate = "Bitte wähle eine Vorlage oder drucke die Esc Taste";
    out.useTemplate = "Mit einer Vorlage starten?"; //Would you like to "You have available templates for this type of pad. Do you want to use one?";
    out.useTemplateOK = 'Wähle eine Vorlage (Enter)';
    out.useTemplateCancel = 'Frisch starten (Esc)';
    out.template_import = "Eine Vorlage importieren";
    out.template_empty = "Keine Vorlage verfügbar";

    out.previewButtonTitle = "Die Markdownvorschau (un)sichtbar machen";

    out.presentButtonTitle = "Zum Präsentationsmodus wechseln";

    out.backgroundButtonTitle = 'Hintergrundfarbe';
    out.colorButtonTitle = 'Die Hintergrundfarbe des Präsentationsmodus bearbeiten';

    out.propertiesButton = "Eigenschaften";
    out.propertiesButtonTitle = 'Die Eigenschaften des Dokuments ansehen';

    out.printText = "Drucken";
    out.printButton = "Drucken (enter)";
    out.printButtonTitle = "Deine Präsentation ausdrucken oder als PDF Dateien exportieren";
    out.printOptions = "Druckeinstellungen";
    out.printSlideNumber = "Foliennummer anzeigen";
    out.printDate = "Datum anzeigen";
    out.printTitle = "Titel der Präsentation anzeigen";
    out.printCSS = "Custom CSS Regeln (CSS):";
    out.printTransition = "Animierte Übergänge aktivieren";
    out.printBackground = "Ein Hintergrundbild verwenden";
    out.printBackgroundButton = "Bitte ein Bild wählen";
    out.printBackgroundValue = "<b>Aktueller Hintergrund:</b> <em>{0}</em>";
    out.printBackgroundNoValue = "<em>Kein Hintergrundbild gewählt</em>";
    out.printBackgroundRemove = "Das Hintergrundbild wählen";

    out.filePickerButton = "Eine Datei deines CryptDrives einbetten";
    out.filePicker_close = "Schliessen";
    out.filePicker_description = "Bitte wähle eine Datei aus deinem CryptDrive oder lade eine neue hoch";
    out.filePicker_filter = "Namensfilter";
    out.or = 'oder';

    out.tags_title = "Tags (nur für dich)";
    out.tags_add = "Die Tags dieser Seite bearbeiten";
    out.tags_searchHint = "Dateien mit Tags in deinem CryptDrive suchen";
    out.tags_searchHint = "Die Suche mit dem Tag # in deinem CryptDrive starten.";
    out.tags_notShared = "Deine Tags sind nicht mit anderen Benutzern geteilt";
    out.tags_duplicate = "Doppeltes Tag: {0}";
    out.tags_noentry = "Du kannst kein Tag bei einem gelöschten Dokument hinzufügen!";

    out.slideOptionsText = "Einstellungen";
    out.slideOptionsTitle = "Präsentationseinstellungen";
    out.slideOptionsButton = "Speichern (enter)";
    out.slide_invalidLess = "Ungültiges Custom-Stil";

    out.languageButton = "Sprache";
    out.languageButtonTitle = "Bitte wähle die Sprache für die Syntaxhervorhebung";
    out.themeButton = "Farbschema";
    out.themeButtonTitle = "Wähle das Farbschema für Code und Folieneditor";

    out.editShare = "Mitarbeits-URL teilen";
    out.editShareTitle = "Mitarbeit-URL in die Zwischenablage kopieren";
    out.editOpen = "Die Mitarbeits-URL in einem neuen Tab öffnen";
    out.editOpenTitle = "Öffne dieses Dokument im Mitarbeitmodus in einem neuen Tab";
    out.viewShare = "Schreibgeschützte URL teilen";
    out.viewShareTitle = "Schreibgeschützte URL in die Zwischenablage kopieren";
    out.viewOpen = "In neuem Tab anzeigen";
    out.viewOpenTitle = "Dokument schreibgeschützt in neuem Tab öffnen.";
    out.fileShare = "Link kopieren";
    out.getEmbedCode = "Einbettungscode anzeigen";
    out.viewEmbedTitle = "Das Dokument in eine externe Webseite einbetten";
    out.viewEmbedTag = "Um dieses Dokument einzubetten, platziere dieses iframe an der gewünschten Stelle Deiner HTML-Seite. Du kannst es mit CSS oder HTML Attributen gestalten";
    out.fileEmbedTitle = "Die Datei in einer externen Seite einbetten";
    out.fileEmbedScript = "Um diese Datei einzubetten, füge dieses Skript einmal in Deiner Webseite ein, damit das Media-Tag geladen wird:";
    out.fileEmbedTag = "Dann platziere das Media-Tag an der gewünschten Stelle der Seite:";

    out.notifyJoined = "{0} ist in der Mitarbeits-Sitzung ";
    out.notifyRenamed = "{0} ist jetzt als {1} bekannt";
    out.notifyLeft = "{0} hat die Mitarbeits-Sitzung verlassen";

    out.ok = 'OK';
    out.okButton = 'OK (enter)';

    out.cancel = "Abbrechen";
    out.cancelButton = 'Abbrechen (esc)';
    out.doNotAskAgain = "Nicht mehr fragen (Esc)";

    out.show_help_button = "Hilfe anzeigen";
    out.hide_help_button = "Hilfe verbergen";
    out.help_button = "Hilfe";

    out.historyText = "Verlauf";
    out.historyButton = "Den Dokumentverlauf anzeigen";
    out.history_next = "früher";
    out.history_prev = "Zur früheren Version wechseln";
    out.history_loadMore = "Weiteren Verlauf laden";
    out.history_closeTitle = "Verlauf schliessen";
    out.history_restoreTitle = "Die gewählte Version des Dokuments wiederherstellen";
    out.history_restorePrompt = "Bist du sicher, dass du die aktuelle Version mit der angezeigten ersetzen möchtest?";
    out.history_restoreDone = "Version wiederhergestellt";
    out.history_version = "Version:";

    // Ckeditor
    out.openLinkInNewTab = "Link im neuen Tab öffnen";
    out.pad_mediatagTitle = "Media-Tag Einstellungen";
    out.pad_mediatagWidth = "Breite (px)";
    out.pad_mediatagHeight = "Höhe (px)";
    out.pad_mediatagRatio = "proportional";
    out.pad_mediatagBorder = "Randdicke (px)";
    out.pad_mediatagPreview = "Vorschau";
    out.pad_mediatagImport = 'In deinem CryptDrive speichern';
    out.pad_mediatagOptions = 'Bildeigenschaften';

    // Kanban
    out.kanban_newBoard = "Neues Kanban-Bord";
    out.kanban_item = "Item {0}"; // Item number for initial content
    out.kanban_todo = "Zu bearbeiten";
    out.kanban_done = "Erledigt";
    out.kanban_working = "In Bearbeitung";
    out.kanban_deleteBoard = "Bist du sicher, dass du dieses Bord löschen möchtest?";
    out.kanban_addBoard = "Ein Bord hinzufügen";
    out.kanban_removeItem = "Dieses Item entfernen";
    out.kanban_removeItemConfirm = "Bist du sicher, dass du dieses Item löschen möchtest?";   

    // Polls
    out.poll_title = "Terminplaner ohne Preisgabe von Daten";
    out.poll_subtitle = "<em>Echtzeit</em>-planen ohne Preisgabe von Daten";

    out.poll_p_save = "Deine Einstellungen werden sofort automatisch gesichert.";
    out.poll_p_encryption = "Alle Eingaben sind verschlüsselt, deshalb haben nur Leute Zugriff, die den Link kennen. Selbst der Server sieht nicht was Du änderst.";

    out.wizardLog = "Klicke auf den Button links oben um zur Umfrage zurückzukehren.";
    out.wizardTitle = "Nutze den Assistenten um deine Umfrage zu erstellen.";
    out.wizardConfirm = "Bist du wirklich bereit, die angegebenen Optionen bereits zu deiner Umfrage hinzuzufügen?";

    out.poll_publish_button = "Veröffentlichen";
    out.poll_admin_button = "Admin";
    out.poll_create_user = "Neuen Benutzer hinzufügen";
    out.poll_create_option = "Neue Option hinzufügen";
    out.poll_commit = "Einchecken";

    out.poll_closeWizardButton = "Assistent schließen";
    out.poll_closeWizardButtonTitle = "Assistent schließen";
    out.poll_wizardComputeButton = "Optionen übernehmen";
    out.poll_wizardClearButton = "Tabelle leeren";
    out.poll_wizardDescription = "Erstelle die Optionen automatisch, indem du eine beliebige Anzahl von Daten und Zeiten eingibst.";
    out.poll_wizardAddDateButton = "+ Daten";
    out.poll_wizardAddTimeButton = "+ Zeiten";

    out.poll_optionPlaceholder = "Option";
    out.poll_userPlaceholder = "Dein Name";
      out.poll_removeOption = "Bist du sicher, dass du diese Option entfernen möchtest?";
      out.poll_removeUser = "Bist du sicher, dass du diese(n) Nutzer*in entfernen möchtest?";

    out.poll_titleHint = "Titel";
    out.poll_descriptionHint = "Beschreibe deine Abstimmung und publiziere sie mit dem 'Veröffentlichen'-Knopf wenn du fertig bist."+
            " Die Beschreibung kann mit Markdown Syntax geschrieben werden und Du kannst Media-Elemente von deinem CryptPad einbetten." +
            "Jeder, der den Link kennt, kann die Beschreibung ändern, aber es ist keine gute Praxis.";

    out.poll_remove = "Entfernen";
    out.poll_edit = "Bearbeiten";
    out.poll_locked = "Gesperrt";
    out.poll_unlocked = "Editierbar";

    out.poll_bookmark_col = 'Setze ein Lesezeichen auf dieser Spalte, damit sie immer gleich editierbar und links angezeigt wird.';
    out.poll_bookmarked_col = 'Dieses ist die Spalte mit Lesezeichen für dich. Sie wird immer editierbar und links angezeigt.';
    out.poll_total = 'SUMME';

    out.poll_comment_list = "Komentare";
    out.poll_comment_add = "Einen Kommentar hinzufügen";
    out.poll_comment_submit = "Schicken";
    out.poll_comment_remove = "Diesen Kommentar entfernen";
    out.poll_comment_placeholder = "Dein Kommentar";

    out.poll_comment_disabled = "Diese Umfrage mit dem ✓ Knopf veröffentlichen, damit Kommentare möglich sind.";

    // Canvas
    out.canvas_clear = "Löschen";
    out.canvas_delete = "Abschnitt entfernen";
    out.canvas_disable = "Zeichnung deaktivieren";
    out.canvas_enable = "Zeichnung aktivieren";
    out.canvas_width = "Breite";
    out.canvas_opacity = "Deckkraft";
    out.canvas_opacityLabel = "Deckkraft: {0}";
    out.canvas_widthLabel = "Breite: {0}";
    out.canvas_saveToDrive = "Dieses Bild in deinem CryptDrive speichern";
    out.canvas_currentBrush = "Aktueller Pinsel";
    out.canvas_chooseColor = "Eine Farbe wählen";
    out.canvas_imageEmbed = "Ein Bild aus deinem Rechner einbetten";

    // Profile
    out.profileButton = "Profil"; // dropdown menu
    out.profile_urlPlaceholder = 'URL';
    out.profile_namePlaceholder = 'Angezeigter Name';
    out.profile_avatar = "Avatar";
    out.profile_upload = " Einen neuen Avatar hochladen";
    out.profile_uploadSizeError = "Fehler: Dein Avatar muss kleiner als {0} sein";
    out.profile_uploadTypeError = "Fehler: Der Typ dieses Bildes wird nicht unterstützt. Unterstütze Typen sind: {0}";
    out.profile_error = "Fehler bei der Erstellung deines Profils: {0}";
    out.profile_register = "Du muss dich einloggen, um ein Profil zu erstellen!";
    out.profile_create = "Ein Profil erstellen";
    out.profile_description = "Beschreibung";
    out.profile_fieldSaved = 'Neuer Wert gespeichert: {0}';

    out.profile_inviteButton = "Sich in Verbindung setzen";
    out.profile_inviteButtonTitle ='Ein Link erstellen, damit dieser Benutzer sich mit dir in Verbindung setzt.';
    out.profile_inviteExplanation = "Ein Klick auf  <strong>OK</strong> wird einen Link erstellen, der eine sichere Chatsession nur mit {0} erlaubt.<br></br>Dieser Link kann öffentlich gepostet werden.";
    out.profile_viewMyProfile = "Mein Profil anzeigen";

    // contacts/userlist
    out.userlist_addAsFriendTitle = 'Benutzer "{0}" als Kontakt hinzufügen';
    out.userlist_thisIsYou = 'Das bist du ("{0}")';
    out.userlist_pending = "Warte...";
    out.contacts_title = "Kontakte";
    out.contacts_addError = 'Fehler bei dem Hinzufügen des Kontakts in die Liste';
    out.contacts_added = 'Verbindungseinladung angenommen.';
    out.contacts_rejected = 'Verbindungseinladung abgelehnt';
    out.contacts_request = 'Benutzer <em>{0}</em> möchtet dich als Kontakt hinzufügen. <b>Annehmen<b>?';
    out.contacts_send = 'Schicken';
    out.contacts_remove = 'Diesen Kontakt entfernen';
    out.contacts_confirmRemove = 'Bist du sicher, dass du <em>{0}</em> von der Kontaktliste entfernen möchtest?';
    out.contacts_typeHere = "Gib eine Nachricht ein...";
    out.contacts_warning = "Alles, was du hier eingibst, wird bleiben und ersichtlich zu allen aktuellen und zukünftigen Benutzern. Sei sorgfältig mit sensible Information!";
    out.contacts_padTitle = "Chat";

    out.contacts_info1 = "Diese ist deine Kontaktliste. Ab hier, kannst du:";
    out.contacts_info2 = "Auf den Avatar eines Kontakts klicken, um mit diesem Benutzer zu chatten";
    out.contacts_info3 = "Den Avatar doppelklicken, um sein Profil anzuzeigen";
    out.contacts_info4 = "Jeder Teilnehmer kann den Chatverlauf löschen";

    out.contacts_removeHistoryTitle = 'Den Chatverlauf löschen';
    out.contacts_confirmRemoveHistory = 'Bist du sicher, dass du den Chatverlauf komplett löschen willst? Die Daten sind dann weg.';
    out.contacts_removeHistoryServerError = 'Es gab einen Fehler bei dem Löschen des Chatverlaufs. Versuche es später noch einmal';
    out.contacts_fetchHistory = "Den früheren Verlauf laden";

    out.contacts_friends = "Kontakte";
    out.contacts_rooms = "Chaträume";
    out.contacts_leaveRoom = "Dieses Chatraum verlassen";
       
    out.contacts_online = "Ein anderer Benutzer dieses Raumes ist online";

    // File manager
    out.fm_rootName = "Dokumente";
    out.fm_trashName = "Papierkorb";
    out.fm_unsortedName = "Dateien (ohne Ordnung)";
    out.fm_filesDataName = "Alle Dateien";
    out.fm_templateName = "Vorlagen";
    out.fm_searchName = "Suchen";
    out.fm_recentPadsName = "Zuletzt geöffnete Dokumente";
    out.fm_ownedPadsName = "Eigene";
    out.fm_tagsName = "Tags"; 
    out.fm_sharedFolderName = "Verteilter Ordner";
    out.fm_searchPlaceholder = "Suchen...";
    out.fm_newButton = "Neu";
    out.fm_newButtonTitle = "Ein neues Dokument oder Ordner erstellen, oder eine Datei in den aktuellen Ordner importieren";
    out.fm_newFolder = "Neuer Ordner";
    out.fm_newFile = "Neues Dokument";
    out.fm_folder = "Ordner";
    out.fm_folderName = "Ordnername";
    out.fm_numberOfFolders = "# von Ordnern";
    out.fm_numberOfFiles = "# von Dateien";
    out.fm_fileName = "Dateiname";
    out.fm_title = "Titel";
    out.fm_type = "Typ";
    out.fm_lastAccess = "Zuletzt besucht";
    out.fm_creation = "Erstellung";
    out.fm_forbidden = "Verbotene Aktion";
    out.fm_originalPath = "Herkunft Pfad";
    out.fm_openParent = "Im Ordner zeigen";
    out.fm_noname = "Dokument ohne Titel";
    out.fm_emptyTrashDialog = "Soll der Papierkorb wirklich gelöscht werden?";
    out.fm_removeSeveralPermanentlyDialog = "Bist du sicher, dass du diese {0} Elemente dauerhaft aus deinem CryptDrive entfernen willst?";
    out.fm_removePermanentlyNote = "Wenn Sie fortfahren, werden eigene Pads von dem Server entfernt.";
    out.fm_removePermanentlyDialog = "Bist du sicher, dass du dieses Element dauerhaft aus deinem CryptDrive entfernen willst?";
    out.fm_removeSeveralDialog = "Bist Du sicher, dasss du diese {0} Elemente aus dem Papierkorb entfernen willst?";
    out.fm_removeDialog = "Bist du sicher, dass du {0} zum Papierkorb zu verschieben?";
    out.fm_deleteOwnedPad = "Bist du sicher, dass du dieses Dokument aus dem Server dauerhaft löschen willst?";
    out.fm_deleteOwnedPads = "Bist du sicher, dass du diese Dokumente dauerhaft aus dem Server entfernen möchtest?";
    out.fm_restoreDialog = "Bist du sicher, dass du {0} zurück zum originalen Ordner verschieben möchtests?";
    out.fm_unknownFolderError = "Der Ordner, der gerade gewählt oder letzlich besucht wurde, existiert nicht mehr. Der übergeordnete Ordner wird geöffnet...";
    out.fm_contextMenuError = "Fehler bei der Öfnnung des Kontextmenü für dieses Element. Wenn dieses Problem wieder erscheint, versuche die Seite neu zu laden.";
    out.fm_selectError = "Fehler bei der Selektierung des Zielelements. Wenn dieses Problem wieder erscheint, versuche die Seite neu zu laden.";
    out.fm_categoryError = "Fehler beim Öffnen der selektierten Kategorie. Der Stamm-Ordner wird angezeigt.";
    out.fm_info_root = "Erstelle hier so viele Ordner, wie du willst, um deine Dateien und Dokumente zu organisieren.";
    out.fm_info_unsorted = 'Hier sind alle Dateien, die Du besucht hast, die noch nicht in "Dokumente" sortiert sind oder zum Papierkorb verschoben wurden.';
    out.fm_info_template = 'Hier sind alle Dokumente, die als Vorlage gespeichert wurden und die du wiederverwenden kannst, um ein neues Dokument zu erstellen.';
    out.fm_info_recent = "Liste der zuletzt geöffneten Dokumente.";
    out.updated_0_fm_info_trash = 'Leere den Papierkorb, um mehr freien Platz in deinem CryptDrive zu erhalten.';
    out.fm_info_trash = out.updated_0_fm_info_trash;
    out.fm_info_allFiles = 'Beinhaltet alle Dateien von "Dokumente", "Unklassifiziert" und "Papierkorb". Dateien können hier nicht verschoben werden.';
    out.fm_info_anonymous = 'Du bist nicht eingeloggt, daher laufen die Dokumente nach 3 Monaten aus (<a href="https://blog.cryptpad.fr/2017/05/17/You-gotta-log-in/" target="_blank">mehr dazu lesen</a>). ' +
                            'Der Zugang zu den Dokumenten ist in deinem Browser gespeichert, daher wird das Löschen des Browserverlaufs auch die Dokumente verschwinden lassen.<br>' +
                            '<a href="/register/">Registriere dich</a> oder <a href="/login/">logge dich ein</a>, um sie dauerhaft zu machen.<br>';
    out.fm_info_owned = "Diese Dokumente sind deine eigenen. Das heisst, dass du sie vom Server entfernen kannst, wann Du willst. Wenn du das machst, dann wird es auch keinen Zugriff zu diesem für andere Benutzer geben.";
    out.fm_alert_backupUrl = "Backuplink für dieses CryptDrive.<br>" +
                             "Es ist <strong>hoch empfohlen</strong> diesen Link geheim zu halten.<br>" +
                             "Du kannst es benutzen, um deine gesamten Dateien abzurufen, wenn dein Browserspeicher gelöscht wurde.<br>" +
                             "Jede Person, die diesen Link hat, kann die Dateien in deinem CryptDrive bearbeiten oder löschen.<br>";
    out.fm_alert_anonymous = "Hallo, du benutzt CryptPad anonym. Das ist in Ordnung aber Dokumente können nach einer Inaktivitätsperiode gelöscht werden. " +
                             "Wir haben fortgeschrittene Aktionen aus dem anonymen CryptDrive entfernt, weil wir klar machen wollen, dass es kein sicherer Platz ist, Dinge zu lagern." + 
                             'Du kannst <a href="https://blog.cryptpad.fr/2017/05/17/You-gotta-log-in/" target="_blank">lesen</a>, weshalb wir das machen und weshalb du wirklich ' +
                             '<a href="/register/">registrieren</a> oder <a href="/login/">einloggen</a> solltest.';
    out.fm_info_sharedFolder = 'Dieser Ordner ist verteilt. Da du aber nicht eingeloggt bist, hast du nur einen schreibgeschützen Zugang.<br>' +
                               '<a href="/register/">Registriere</a> oder <a href="/login/">logge ich ein</a>, damit du dieses Ordner in dein CryptDrive importieren und bearbeiten kannst.';
    out.fm_backup_title = 'Backup link';
    out.fm_nameFile = 'Wie soll diese Datei heissen?';
    out.fm_error_cantPin = "Interner Serverfehler. Bitte lade die Seite neu und versuche es wieder.";
    out.fm_viewListButton = "Listenansicht";
    out.fm_viewGridButton = "Kachelansicht";
    out.fm_renamedPad = "Du hast einen speziellen Name für dieses Dokument gesetzt. Seine geteilter Titel ist:<br><b>{0}</b>";
    out.fm_prop_tagsList = "Tags";
    out.fm_burnThisDriveButton = "Alle Informationen löschen, die CryptPad in deinem Browser hält";
    out.fm_burnThisDrive = "Bist Du sicher, dass du alles, was CryptPad in deinem Browser gespeichert hat, löschen möchtest?<br>" +
                                                      "Das wird dein CryptDrive und seinen Verlauf in deinem Browser löschen, Dokumente werden noch (verschlüsselt) auf unserem Server bleiben.";
    out.fm_padIsOwned = "Dieses Dokument ist dein Eigenes";
    out.fm_padIsOwnedOther = "Dieses Dokument ist von einem anderen Benutzer";
    out.fm_deletedPads = "Dieses Dokument existiert nicht mehr auf dem Server, es wurde von Deinem CryptDrive gelöscht: {0}";
    out.fm_tags_name = "Tag Bezeichnung";
    out.fm_tags_used = "Anzahl";
    out.fm_restoreDrive = "Dein Drive wird zu einem früheren Zustand zurückgebracht. Damit es funktioniert, solltest du keine Veränderungen zum Drive während dieses Vorgangs machen.";
    out.fm_moveNestedSF = "Du kannst keinen verteilten Ordner in einem anderen verteilten Ordner stellen. Der Ordner {0} wurde nicht verschoben.";
    
    // File - Context menu
    out.fc_newfolder = "Neuer Ordner";
    out.fc_rename = "Umbenennen";
    out.fc_open = "Öffnen";
    out.fc_open_ro = "Öffnen (schreibgeschützt)";
    out.fc_delete = "Zum Papierkorb verschieben";
    out.fc_delete_owned = "Vom Server löschen";
    out.fc_restore = "Restaurieren";
    out.fc_remove = "Von deinem CryptDrive entfernen";
    out.fc_remove_sharedfolder = "Entfernen";
    out.fc_empty = "Den Papierkorb leeren";
    out.fc_prop = "Eigenschaften";
    out.fc_hashtag = "Tags";
    out.fc_sizeInKilobytes = "Grösse in Kilobytes";

    // fileObject.js (logs)
    out.fo_moveUnsortedError = "Du kannst einen Ordner nicht in die Liste von allen Pads verschieben";
    out.fo_existingNameError = "Dieser Dokumentname existiert schon in diesem Verzeichnis. Bitte wähle einen Anderen.";
    out.fo_moveFolderToChildError = "Du kannst einen Ordner nicht in einen seiner Nachfolger verschieben";
    out.fo_unableToRestore = "Es hat nicht funktioniert, diese Datei an ihrem Herkunftort wiederherzustellen. Du kannst versuchen, sie an einen anderen Ort zu verschieben.";
    out.fo_unavailableName = "Ein Dokument oder Ordner mit diesem Namen existiert in diesem Ordner schon. Bitte benenne sie zuerst um, und versuche es dann erneut.";

    out.fs_migration = "Dein CryptDrive wird gerade zu einer neueren Version aktualisiert. Daher muss die Seite neugeladen werden.<br><strong>Bitte lade die Seite neu, um sie weiter zu verwenden.</strong>";

    // login
    out.login_login = "Einloggen";
    out.login_makeAPad = 'Ein Dokument anonym erstellen';
    out.login_nologin = "Lokale Dokumente ansehen";
    out.login_register = "Registrieren";
    out.logoutButton = "Ausloggen";
    out.settingsButton = "Einstellungen";

    out.login_username = "Benutzername";
    out.login_password = "Passwort";
    out.login_confirm = "Passwort bestätigen";
    out.login_remember = "Mein Login speichern";

    out.login_hashing = "Dein Passwort wird gerade durchgerechnet, das kann etwas dauern.";

    out.login_hello = 'Hallo {0},'; // {0} is the username
    out.login_helloNoName = 'Hallo,';
    out.login_accessDrive = 'Dein CryptDrive ansehen';
    out.login_orNoLogin = 'oder';

    out.login_noSuchUser = 'Ungültiger Benutzername oder Passwort. Versuche es erneut oder registriere dich';
    out.login_invalUser = 'Der Benutzername kann nicht leer sein';
    out.login_invalPass = 'Der Passwort kann nicht leer sein';
    out.login_unhandledError = 'Ein Fehler ist aufgetreten:(';

    out.register_importRecent = "Die Dokumente aus deiner anonymen Sitzung importieren";
    out.register_acceptTerms = "Ich bin mit den <a href='/terms.html' tabindex='-1'>Nutzungsbedingungen</a> einverstanden";
    out.register_passwordsDontMatch = "Passwörter sind nicht gleich!";
    out.register_passwordTooShort = "Passwörter müssen mindestens {0} Zeichen haben.";

    out.register_mustAcceptTerms = "Du musst mit den Nutzungsbedingungen einverstanden sein.";
    out.register_mustRememberPass = "Wir können dein Passwort nicht zurücksetzen, falls du es vergisst. Es ist äusserst wichtig, dass du es dir merkst! Bitte markiere das Kästchen.";

    out.register_whyRegister = "Wieso solltest Du dich registrieren?";
    out.register_header = "Willkommen zu CryptPad";
    out.register_explanation = [
        "<h3>Lass uns ein Paar Punkte überprüfen:</h3>",
        "<ul class='list-unstyled'>",
            "<li><i class='fa fa-info-circle'> </i> Dein Passwort ist dein Geheimnis, um alle deine Dokumente zu verschlüsseln. Wenn du es verlierst, gibt es keine Methode, die Daten wiederzufinden.</li>",
            "<li><i class='fa fa-info-circle'> </i> Du kannst die Dokumente, die du zuletzt angesehen hast, importieren, damit sie in deinem CryptDrive sind.</li>",
            "<li><i class='fa fa-info-circle'> </i> Wenn du den Rechner mit anderen teilst, musst du ausloggen, wenn du fertig bist. Es ist nicht ausreichend, das Browserfensters oder den Browser zu schliessen.</li>",
        "</ul>"
    ].join('');

    out.register_writtenPassword = "Ich habe meinen Benutzername und Passwort notiert. Weiter geht's.";
    out.register_cancel = "Zurück";

    out.register_warning = "\"Ohne Preisgabe von Daten\" heisst, dass niemand deine Daten wiederherstellen kann, wenn du dein Passwort verlierst.";

    out.register_alreadyRegistered = "Dieser Benutzer existiert schon, willst du dich einloggen?";

    // Settings
    out.settings_cat_account = "Konto";
    out.settings_cat_drive = "CryptDrive";
    out.settings_cat_code = "Code";
    out.settings_cat_pad = "Rich text";
    out.settings_cat_creation = "Neues Dokument";
    out.settings_cat_subscription = "Registrierung";
    out.settings_title = "Einstellungen";
    out.settings_save = "Speichern";

    out.settings_backupCategory = "Backup";
    out.settings_backupHint = "Eine Backup erstellen oder die Daten wiederherstellen";
    out.settings_backup = "Backup";
    out.settings_restore = "Wiederherstellen";

    out.settings_backupHint2 = "Der Inhalte ihrer Dokumente runterladen. Die runtergeladene Dateien werden in einem lesbaren Format geladen, wenn verfügbar.";
    out.settings_backup2 = "Mein CryptDrive runterladen";
    out.settings_backup2Confirm = "Das wird den gesamten Inhalt ihrer Dokumente und Dateien runterladen. Wenn du weiterfahren möchstest, wähle ein Name und drucke OK.";
    out.settings_exportTitle = "Dein CryptDrive exportieren";
    out.settings_exportDescription = "Bitte warte während wir deine Dokumente runterläden und entschlüsseln Es wird ein Paar Minuten dauern. Wenn der Browsertab geschlossen wird, wird der Vorgang unterbrochen";
    out.settings_exportWarning = "Um eine erhöhte Leistung zu erhalten, empfehlen wir dieses Browsertab im Fokus zu halten.";
    out.settings_exportCancel = "Bist du sicher, dass du der Exportvorgang unterbrechen möchtest? Der Vorgang wird das nächste Mal neustarten müssen.";
    out.settings_export_reading = "Dein CryptDrive wird gelesen...";
    out.settings_export_download = "Deine Dokumente werden runtergeladen und entschlüsselt...";
    out.settings_export_compressing = "Komprimiereung...";
    out.settings_export_done = "Das Export ist bereit!";
    out.settings_exportError = "Fehlermeldungen ansehen";
    out.settings_exportErrorDescription = "Wir waren nicht in der Lage, die folgende Dokumente zu exportieren:";
    out.settings_exportErrorEmpty = "Dieses Dokument kann nicht exportiert werden (leeres oder ungültiges Inhalt).";
    out.settings_exportErrorMissing = "Dieses Dokument fehlt auf dem Server (es ist ausgelaufen oder von seinem Eigentümer gelöscht worden)";
    out.settings_exportErrorOther = "Es ist einf Fehler beim Export vom Dokument \"{0}\" aufgetreten. ";
       
    out.settings_resetNewTitle = "CryptDrive säubern";
    out.settings_resetButton = "Löschen";
    out.settings_reset = "Alle Dateien und Ordnern aus deinem CryptDrive löschen";
    out.settings_resetPrompt = "Diese Aktion wird alle Dokumente deines CryptDrives entfernen.<br>"+
                               "Bist du sicher, dass du das tun möchtest?<br>" +
                               "Gib <em>I love CryptPad</em> ein, um zu bestätigen."; // TODO: I love CryptPad should be localized
    out.settings_resetDone = "Dein CryptDrive ist jetzt leer!";
    out.settings_resetError = "Prüftext inkorrekt. Dein CryptDrive wurde nicht verändert.";

    out.settings_resetTipsAction = "Zurücksetzen";
    out.settings_resetTips = "Tipps";
    out.settings_resetTipsButton = "Die Tipps für CryptDrive zurücksetzen";
    out.settings_resetTipsDone = "Alle Tipps sind wieder sichtbar.";

    out.settings_thumbnails = "Vorschaubilder";
    out.settings_disableThumbnailsAction = "Die Erstellung von Vorschaubilder in deinem CryptPad deaktivieren";
    out.settings_disableThumbnailsDescription = "Vorschaubilder werden automatisch erstellt und in deinem Browser gespeichert, wenn du ein Dokument besuchst. Du kannst dieses Feature hier deaktivieren.";
    out.settings_resetThumbnailsAction = "Entfernen";
    out.settings_resetThumbnailsDescription = "Alle Vorschaubilder entfernen, die in Deinem Browser gespeichert sind.";
    out.settings_resetThumbnailsDone = "Alle Vorschaubilder sind entfernt worden.";

    out.settings_importTitle = "Importiere die kürzlich besuchte Dokumente in Deinem CryptDrive";
    out.settings_import = "Importieren";
    out.settings_importConfirm = "Bist Du sicher, dass Du die kürzlich besuchte Dokumente in Deinem Konto importieren möchtest??";
    out.settings_importDone = "Import erledigt";

    out.settings_autostoreTitle = "Automatisches Speichern im CryptDrive";
    out.settings_autostoreHint = "<b>Automatisch:</b> Alle Pads werden in deinem CryptDrive gespeichert.<br>" +
	                         "<b>Manuell (immer nachfragen):</b> Wenn du ein Pad noch nicht gespeichert hast, wirst du gefragt, ob du es im CryptDrive speichern willst.<br>" +
	                         "<b>Manuell (nie nachfragen):</b> Pads werden nicht automatisch im CryptDrive gespeichert. Die Option, sie trotzdem zu speichern, ist versteckt.<br>";
    out.settings_autostoreYes = "Automatisch";
    out.settings_autostoreNo = "Manuell (nie nachfragen)";
    out.settings_autostoreMaybe = "Manual (immer nachfragen)";

    out.settings_userFeedbackTitle = "Rückmeldung";
    out.settings_userFeedbackHint1 = "CryptPad gibt grundlegende Rückmeldungen zum Server, um die Benutzer-Erfahrung zu verbessern können.";
    out.settings_userFeedbackHint2 = "Der Inhalt deiner Dokumente wird nie mit dem Server geteilt.";
    out.settings_userFeedback = "Rückmeldungen aktivieren";

    out.settings_deleteTitle = "Löschung des Kontos";
    out.settings_deleteHint = "Die Löschung eines Kontos ist dauerhaft. Dein CryptDrive und eigene Dokumente werden alle von dem Server gelöscht. Die restliche Dokumente werden nach 90 Tage gelöscht, wenn niemand anderes diese bei sich gelagert hat.";
    out.settings_deleteButton = "Dein Konto löschen";
    out.settings_deleteModal = "Gib die folgende Information deinem CryptPad Adminstrator, damit er die Daten vom Server löschen kann.";
    out.settings_deleteConfirm = "Wenn du OK klickst, wird dein Konto dauerhaft löschen. Bist Du sicher?";
    out.settings_deleted = "Dein Konto ist jetzt gelöscht. Drucke OK, um zum Homepage zu gelangen.";

    out.settings_anonymous = "Du bist nicht eingeloggt. Die Einstellungen hier gelten nur für diesem Browser.";
    out.settings_publicSigningKey = "Öffentliche Schlüssel zum Unterschreiben";

    out.settings_usage = "Verbrauch";
    out.settings_usageTitle = "Die Gesamtgrösse deiner Dokumente in MB"; // TODO: pinned ??
    out.settings_pinningNotAvailable = "Gepinnte Dokumente sind nur für angemeldete Benutzer verfügbar.";
    out.settings_pinningError = "Etwas ging schief";
    out.settings_usageAmount = "Deine gepinnten Dokumente verwenden {0}MB";

    out.settings_logoutEverywhereButton = "Ausloggen";
    out.settings_logoutEverywhereTitle = "Überall ausloggen";
    out.settings_logoutEverywhere = "Das Ausloggen in allen andere Websitzungen erzwingen";
    out.settings_logoutEverywhereConfirm = "Bist du sicher? Du wirst dich auf allen deinen Geräten wieder einloggen müssen.";

    out.settings_codeIndentation = 'Einrücken für den Code-Editor (Leerzeichen)';
    out.settings_codeUseTabs = "Mit Tabs einrücken (anstatt mit Leerzeichen)";

    out.settings_padWidth = "Maximalgrösse des Editors";
    out.settings_padWidthHint = "Rich-text Dokumente benutzen normalerweise die grösste verfügbare Zeilenbreite, das kann manchmal schwer lesbar sein. Du kannst die Breite des Editors hier reduzieren.";
    out.settings_padWidthLabel = "Die Breite des Editors reduzieren";

    out.settings_creationSkip = "Den Erstellungsdialg für neue Dokumente überspringen";
    out.settings_creationSkipHint = "Dieser Erstellungsdialog erlaubt Einstellungen für mehr Kontrolle und Sicherheit bei deinen Dokumenten. Aber der zusätzliche Dialog verlangsamt die Arbeit. Mit dieser Option kannst du diese Dialog überspringen und die Standard-Einstellungen wählen.";
    out.settings_creationSkipTrue = "Überspringen";
    out.settings_creationSkipFalse = "Anzeigen";

    out.settings_templateSkip = "Die Wahl der Vorlage überspringen";
    out.settings_templateSkipHint = "Wenn du ein neues Dokument erstellst und Vorlagen vorhanden sind, erscheint ein Dialog, wo du die Vorlage wählen kannst. Hier kannst du diesen Dialog überspringen und somit keine Vorlage verwenden.";

       
    out.settings_ownDriveTitle = "Migrations des CryptDrives";
    out.settings_ownDriveHint = "Wir sind dabei dein CryptDrive zur neuen Version zu migrieren, damit du Zugang zu den neuen Features hast...";
    out.settings_ownDriveButton = "Migrieren";
    out.settings_ownDriveConfirm = "Bis du sicher?";

    out.settings_changePasswordTitle = "Ändere dein Passwort";
    out.settings_changePasswordHint = "Ändere das Passwort deines Kontos ohne deine Daten zu verlieren. Du mußt einmal das jetzige Passwort eintragen und dann das gewünschte neue Passwort zweimal.<br>" +
                                      "<b>Wir können das Passwort nicht zurücksetzen, wenn du es vergisst, also sei besonders sorgfältig!</b>";
    out.settings_changePasswordButton = "Passwort ändern";
    out.settings_changePasswordCurrent = "Jetziges Passwort";
    out.settings_changePasswordNew = "Neues Passwort";
    out.settings_changePasswordNewConfirm = "Neues Passwort bestätigen";
    out.settings_changePasswordConfirm = "Bist du sicher?";
    out.settings_changePasswordError = "Ein Fehler ist aufgetreten. Wenn du nicht mehr einloggen oder dein Passwort ändern kannst, solltest du die Administratoren des CryptPad Servers kontaktieren.";
    out.settings_changePasswordPending = "Dein Passwort wird geändert. Bitte schliesse nicht und lade diese Seite nicht neu, bis dieser Vorgang erledigt ist.";
    out.settings_changePasswordNewPasswordSameAsOld = "Dein neues Passwort muss anders als dein aktuelles Passwort sein.";

    out.upload_title = "Datei hochladen";
    out.upload_modal_title = "Uploadeinstellungen";
    out.upload_modal_filename = "Dateiname (die Dateierweiterung <em>{0}</em> wird automatisch hinzugefügt)";
    out.upload_modal_owner = "Eigene Datei";
    out.upload_rename = "Willst du einen neuen Name für <b>{0}</b> geben, bevor es zum Server hochgeladen wird?<br>" +
                        "<em>Die Dateieendung ({1}) wird automatisch hinzugefügt. "+
                        "Dieser Name bleibt für immer und wird für die andere Benutzer sichtbar.</em>";
    out.upload_serverError = "Serverfehler: Die Datei kann aktuell nicht hochgeladen werden. ";
    out.upload_uploadPending = "Ein anderes Hochlade-Vorgang läuft gerade. Willst du den abbrechen und deine neue Datei hochladen?";
    out.upload_success = "Deine Datei ({0}) wurde erfolgreich hochgeladen und in deinem CryptDrive hinzugefügt.";
    out.upload_notEnoughSpace = "Der verfügbare Speicherplatz auf deinem CryptDrive reicht leider nicht für diese Datei.";
    out.upload_notEnoughSpaceBrief = "Unzureichender Speicherplatz";
    out.upload_tooLarge = "Diese Datei ist zu gross, um hochgeladen zu werden.";
    out.upload_tooLargeBrief = 'Datei zu gross';
    out.upload_choose = "Eine Datei wählen";
    out.upload_pending = "In der Warteschlange";
    out.upload_cancelled = "Abgebrochen";
    out.upload_name = "Dateiname";
    out.upload_size = "Grösse";
    out.upload_progress = "Fortschritt";
    out.upload_mustLogin = "Du muss eingeloggt sein, um Dateien hochzuladen";
    out.download_button = "Entschlüsseln und runterladen";
    out.download_mt_button = "Runterladen";
    out.download_resourceNotAvailable = "Diese Ressource war nicht verfügbar..";

    out.todo_title = "CryptTodo";
    out.todo_newTodoNamePlaceholder = "Die Aufgabe prüfen...";
    out.todo_newTodoNameTitle = "Diese Aufgabe zu deiner ToDo-Liste hinzufügen";
    out.todo_markAsCompleteTitle = "Diese Aufgabe als erledigt markieren";
    out.todo_markAsIncompleteTitle = "Diese Aufgabe als nicht erledigt markieren";
    out.todo_removeTaskTitle = "Diese Aufgabe aus deiner ToDo-Liste entfernen";

    // pad
    out.pad_showToolbar = "Werkzeugsleiste anzeigen";
    out.pad_hideToolbar = "Werkzeugsleiste verbergen";

    // markdown toolbar
    out.mdToolbar_button = "Die Markdown-Werkzeugsleiste anzeigen oder verbergen";
    out.mdToolbar_defaultText = "Dein Text hier";
    out.mdToolbar_help = "Hilfe";
    out.mdToolbar_tutorial = "http://www.markdowntutorial.com/";
    out.mdToolbar_bold = "Fett";
    out.mdToolbar_italic = "Kursiv";
    out.mdToolbar_strikethrough = "Durchgestrichen";
    out.mdToolbar_heading = "Kopfzeile";
    out.mdToolbar_link = "Link";
    out.mdToolbar_quote = "Zitat";
    out.mdToolbar_nlist = "Nummerierte Liste";
    out.mdToolbar_list = "Aufzählung";
    out.mdToolbar_check = "Aufgabenliste";
    out.mdToolbar_code = "Code";

    // index.html
    out.home_product = "CryptPad ist eine alternative zu verbreiteten Office- und Clouddienste mit eingebauten Datenschutz. Mit CryptPad, der gesamten Inhalt ist verschlüsselt, bevor es geschickt wird. Das heisst, dass keiner hat Zugang zum Inhalt, ausser du gibst den Schlüssel aus. Selbst die Softwarehersteller haben diesen Zugang nicht.";
    out.home_host = "Dieses CryptPad Server ist eine unabhängige Installation des Communitysoftwares. Das Quellcode ist <a href=\"https://github.com/xwiki-labs/cryptpad\" target=\"_blank\" rel=\"noreferrer noopener\">auf GitHub</a> verfügbar.";
    out.home_host_agpl = "CryptPad kann durch die Lizenz AGPL3 verbreitet werden";


    //about.html
    out.about_intro = 'CryptPad wurde erstellt im Research Team von <a href="http://xwiki.com">XWiki SAS</a>, einem kleinen Unternehmen in Paris, Frankreich, und Iasi, Rumänien. Das kernteam hat 3 Mitglieder, die an CryptPad arbeiten, sowie einige Mitwirkende innerhalb von XWiki SAS und außerhalb.';
    out.about_core = 'Core Developers';
    out.about_contributors = 'Key Contributors';

    // contact.html
    out.main_about_p22 = 'Uns antweeten';
    out.main_about_p23 = 'Eine Issue auf GitHub erstellen';
    out.main_about_p24 = 'Hallo sagen (Matrix)';
    out.main_about_p25 = 'uns ein Email schicken';
    out.main_about_p26 = 'Wenn Du Fragen oder Kommentare hast, freuen wir uns, von dir zu hören!';

    out.main_info = "<h2>Vertrauenswürdige Kollaboration</h2> Lass deine Ideen gemeinsam wachsen, während die <strong>ohne Preisgabe deiner Daten</strong>-Technologie deinen Datenschutz <strong>sogar uns gegenüber</strong> sichert.";
    out.main_catch_phrase = "Die Cloud ohne Preisgabe deiner Daten";

    out.main_richText = 'Text-Editor';
    out.main_code = 'Code-Editor';
    out.main_slide = 'Präsentations-Editor';
    out.main_poll = 'Umfragen';
    out.main_drive = 'CryptDrive';

    out.main_richTextPad = 'Rich Text Dokument';
    out.main_codePad = 'Markdown/Code Dokument';
    out.main_slidePad = 'Markdown Präsentation';
    out.main_pollPad = 'Umfrage oder Terminabstimmung';
    out.main_whiteboardPad = 'Whiteboard';
    out.main_kanbanPad = 'Kanban-Board';
    out.main_localPads = 'Lokale Dokumente';
    out.main_yourCryptDrive = 'Dein CryptDrive';
    out.main_footerText = "Mit CryptPad kannst du schnell kollaborative Dokumente erstellen, um Notizen oder Ideen zusammen mit anderen zu bearbeiten.";

    out.footer_applications = "Apps";
    out.footer_contact = "Kontakt";
    out.footer_aboutUs = "Über uns";

    out.about = "Über uns";
    out.privacy = "Datenschutz";
    out.contact = "Kontakt";
    out.terms = "Nutzungsbedingungen";
    out.blog = "Blog";

    out.topbar_whatIsCryptpad = "Was ist CryptPad";

    // what-is-cryptpad.html
    out.whatis_title = 'Was ist CryptPad';
    out.whatis_collaboration = 'Effektive und und leichte Zusammenarbeit';
    out.whatis_collaboration_p1 = 'Mit CryptPad kannst Du kollaborative Dokumente erstellen, um Notizen und Ideen gemeinsam zu bearbeiten. Wenn du dich registrierst und dich einloggst, bekommst du die Möglichkeit, Dateien hochzuladen und Ordner einzurichten, um alle deine Dokumente zu organisieren.';
    out.whatis_collaboration_p2 = 'Du kannst Zugang zu einem CryptPad teilen, indem du den Link teilst. Du kannst auch einen <em>schreibgeschützten</em> Zugang erstellen, um die Ergebnisse deiner Arbeit zu teilen, während du sie noch bearbeitest.';
    out.whatis_collaboration_p3 = 'Du kannst Rich-Text Dokumente mit dem <a href="http://ckeditor.com/">CKEditor</a> sowie Markdown Dokumente erstellen, die in Echtzeit angezeigt werden, während du tippst. Du kannst auch die Umfrage-App verwenden, um Termine unter mehrere Teilnehmern zu abzustimmen.';
    out.whatis_zeroknowledge = 'Zero Knowledge - Ohne Preisgabe deiner Daten';
    out.whatis_zeroknowledge_p1 = "Wir wollen nicht wissen, was Du gerade tippst. Und mit moderner Verschlüsselungstechnologie, kannst du sicher sein, dass wir es auch nicht können. CryptPad verwendet <strong>100% Clientseitige Verschlüsselung</strong>, um den Inhalt vor uns, den Hostern dieser Website, zu schützen.";
    out.whatis_zeroknowledge_p2 = 'Wenn du dich registrierst und dich einloggst, werden dein Benutzername und Passwort in einen Schlüssel umgerechnet mit einer <a href="https://en.wikipedia.org/wiki/Scrypt">Scrypt Schlüssel-Ableitungsfunktion</a>. Weder dieser Schlüssel noch der Benutzername oder das Passwort werden zum Server geschickt. Stattdessen werden sie clientseitig benutzt, um den Inhalt deines CryptDrives zu entschlüsseln. Dieses beinhaltet alle Dokumente, die dir zugänglich sind.';
    out.whatis_zeroknowledge_p3 = 'Wenn du ein Dokument teilst, teilst du auch den kryptografischen Schlüssel, der Zugang zu diesem Dokument gibt. Da dieser Schlüssel im <a href="https://en.wikipedia.org/wiki/Fragment_identifier">fragment identifier</a> liegt, wird er nie direkt zum Server geschickt. Bitte lese unsere <a href="https://blog.cryptpad.fr/2017/07/07/cryptpad-analytics-what-we-cant-know-what-we-must-know-what-we-want-to-know/">Blogeintrag über Datenschutz</a> um mehr zu erfahren, welche Typen von Kontextinformation wir zugänglich und nicht zugänglich haben.';
    out.whatis_drive = 'Organisieren mit CryptDrive';
    out.whatis_drive_p1 = 'Sobald auf ein Dokument mit CryptPad zugegriffen wird, wird deses automatisch zu deinem CryptDrive hinzugefügt, im Stamm-Ordner. Später kannst du diese Dokumente in eigenen Ordnern organisieren oder du kannst es in den Papierkorb verschieben. CryptDrive erlaubt die Suche durch deine Dokumente, wie und wann Du willst.';
    out.whatis_drive_p2 = 'Mit dem einfachem Ziehen und Ablegen kannst Du die Dokumente auf deinem CryptDrive umplatzieren. Die Links zu diesen Dokumenten bleiben erhalten, damit Kollaboratoren nie Zugang verlieren.';
    out.whatis_drive_p3 = 'Du kannst auch Dateien in dein CryptDrive hochladen und mit deinen Kollegen teilen. Hochgeladene Dateien können genau so wie kollaborative Dokumente organisiert werden.';
    out.whatis_business = 'CryptPad im Business';
    out.whatis_business_p1 = 'Die Verschlüsselung ohne Preisgabe der Daten von CryptPad ist ausgezeichnet, um die Effektivität von existierenden Sicherheitsverfahren zu verbessern, indem die Zugangsberechtigungen des Unternehmens in der Kryptografie gespiegelt werden. Weil hochsensible Medien nur mit Angestelltenzugang entschlüsselt werden können, kann CryptPad das Jackpot der Hackers wegnehmen, was in der Natur von tradioneller IT liegt. Lese das <a href="https://blog.cryptpad.fr/images/CryptPad-Whitepaper-v1.0.pdf">CryptPad Whitepaper</a>, um mehr zu erfahren, wie CryptPad deinem Unternehmen helfen kann.';
    out.whatis_business_p2 = 'CryptPad kann auf eigenen Rechnern installiert werden. <a href="https://cryptpad.fr/about.html">CryptPad\'s Entwickler</a> von XWiki SAS können kommerzielle Unterstützung, Customisierung und Entwicklung anbieten. Bitte schicke eine Email an <a href="mailto:sales@cryptpad.fr">sales@cryptpad.fr</a>, um mehr zu erfahren.';

    // privacy.html
    out.policy_title = 'Cryptpad Datenschutzbestimmungen';
    out.policy_whatweknow = 'Was wir über dich wissen';
    out.policy_whatweknow_p1 = 'Als Programm, das im Web gehostet wird, hat Cryptpad Zugriff auf die Metadaten, die vom HTTP-Protokoll übertragen werden. Inbegriffen ist deine IP-Adresse und diverse andere HTTP-Header, die es ermöglichen deinen Browser zu identifizieren. Um zu sehen welche Daten dein Browser preisgibt, kannst du die Seite <a target="_blank" rel="noopener noreferrer" href="https://www.whatismybrowser.com/detect/what-http-headers-is-my-browser-sending" title="what http headers is my browser sending">WhatIsMyBrowser.com</a> besuchen.';
    out.policy_whatweknow_p2 = 'Wir nutzen <a href="https://piwik.org/" target="_blank" rel="noopener noreferrer" title="open source analytics platform">Piwik</a>, eine Open-Source Analyseplattform, um mehr über unsere Nutzer*innen zu erfahren. Piwik teilt uns mit, wie du Cryptpad gefunden hast &mdash; durch direkten Zugriff, mit Hilfe einer Suchmaschine oder über einen Link auf einer anderen Seite wie z.B. Reddit oder Twitter. Außerdem lernen wir mehr über deinen Besuch, welchen Link Du auf den Informationsseiten klickst und wie lange du auf diesen Seiten verweilst.';
    out.policy_howweuse = 'Wie wir das Wissen anwenden';
    out.policy_howweuse_p1 = 'Wir nutzen diese Informationen um besser entscheiden zu können, wie Cryptpad beworben werden kann und um derzeit genutzte Strategien zu evaluieren. Informationen über deinen Standort helfen uns, abzuschätzen welche Sprachen wir besser unterstützen sollten.';
    out.policy_howweuse_p2 = "Informationen zu Deinem Browser (ob Du auf einem Desktop oder Smartphone arbeitest) helfen uns außerdem dabei, zu entscheiden, welche Features priorisiert werden sollen. Unser Entwicklerteam ist klein, deshalb ist es uns wichtig, Entscheidungen derart zu treffen, dass möglichst viele Nutzer*innen davon profitieren.";
    out.policy_whatwetell = 'Was wir anderen über dich (nicht) erzählen';
    out.policy_whatwetell_p1 = 'Wir reichen keine von uns gesammelten Daten weiter, außer im Falle einer gerichtlichen Anordnung.';
    out.policy_links = 'Links zu anderen Seiten';
    out.policy_links_p1 = 'Diese Seite beinhaltet Links zu anderen Seiten, teilweise werden diese von anderen Organisationen verwaltet. Wir sind nicht für den Umgang mit der Privatsphäre und die Inhalte der anderen Seiten verantwortlich. Generell werden Links zu externen Seiten in einem neuem Fenster geöffnet, um zu verdeutlichen, dass du Cryptpad.fr verlässt.';
    out.policy_ads = 'Werbung';
    out.policy_ads_p1 = 'Wir zeigen keine Onlinewerbung, können aber zu Organisationen verlinken, die unsere Forschung finanzieren.';
    out.policy_choices = 'Deine Möglichkeiten';
    out.policy_choices_open = 'Unser Code ist frei und offengelegt, deshalb kannst du jederzeit deine eigene Cryptpad-Instanz hosten.';
    out.policy_choices_vpn = 'Wenn du unsere gehostete Instanz nutzen möchtest ohne deine IP-Adresse zu offenbaren, bitten wir dich darum, deine IP-Adresse zu verschleiern, das geht zum Beispiel mit dem <a href="https://www.torproject.org/projects/torbrowser.html.en" title="downloads vor Torproject" target="_blank" rel="noopener noreferrer">Tor browser bundle</a>, oder einem <a href="https://riseup.net/en/vpn" title="VPNs provided by Riseup" target="_blank" rel="noopener noreferrer">VPN-Zugang</a>.';
    out.policy_choices_ads = 'Wenn du unsere Analysesoftware blockieren möchtest kannst du Block-Software wie <a href="https://www.eff.org/privacybadger" title="download privacy badger" target="_blank" rel="noopener noreferrer">Privacy Badger</a> verwenden.';

    // features.html
    out.features = "Funktionen";
    out.features_title = "Tabelle der Funktionen";
    out.features_feature = "Funktion";
    out.features_anon = "Anonymer Benutzer";
    out.features_registered = "Angemeldete Benutzer";
    out.features_notes = "Notizzen";
    out.features_f_apps = "Zugang zu den wichtige Anwendungen";
    out.features_f_core = "Gemeinsame Funktionen der Anwendungen";
    out.features_f_core_note = "Bearbeiten, Importieren & Exportieren, Verlauf, Benutzerliste, Chat";
    out.features_f_file0 = "Dateien öffnen";
    out.features_f_file0_note = "Dateien, die anderen verteilt haben, ansehen und runterladen";
    out.features_f_cryptdrive0 = "Begrenzter Zugang zu CryptDrive";
    out.features_f_cryptdrive0_note = "Du kannst besuchte Dokumente in deinem Browser referenzieren, damit du sie später öffnen kannst";
    out.features_f_storage0 = "Speicherung für eine begrenzte Zeit";
    out.features_f_storage0_note = "Neue Dokumente könnten nach drei Monaten ohne Aktivität gelöscht werden";
       
    out.features_f_anon = "Alle Funktionen der anonymen Benutzern";
    out.features_f_anon_note = "Mit eine besser Benutzberakeit und mehr Kontrolle über deine Dokumente";
    out.features_f_cryptdrive1 = "Gesamt Funktionen von CryptDrive";
    out.features_f_cryptdrive1_note = "Ordnern, verteilte Ordnern, Vorlagen, Tags";
    out.features_f_devices = "Deine Dokumente auf deine gesamte Geräten";
    out.features_f_devices_note = "Zugang zu deinem CryptPad überall mit deinem Benutzer";
    out.features_f_social = "Soziale Anwendungen";
    out.features_f_social_note = "Ein Profil Gestalten, ein Profilbild verwenden, mit Konktakte chatten";
    out.features_f_file1 = "Dateien hochladen und teilen";
    out.features_f_file1_note = "Dateien mit Freunde teilen, oder sie in Dokumenten einbetten";
    out.features_f_storage1 = "Langfristige Speicherung (50MB)";
    out.features_f_storage1_note = "Dateien in deinem CryptDrive sind nicht wegen Aktivitätsmangel gelöscht";
    out.features_f_register = "Registrieren (kostenlos)";
    out.features_f_register_note = "Keine Email oder persönliche Information nötig";
       
    out.features_f_reg = "Alle Funktionen eines gemeldeten Benutzer";
    out.features_f_reg_note = "Du hilfst die Entwicklung von CryptPad";
    out.features_f_storage2 = "Grössere Speicherungraum";
    out.features_f_storage2_note = "Zwischen 5GB und 50GB, abhängig vom selektierten Plan";
    out.features_f_support = "Schnelleres Support";
    out.features_f_support_note = "Professionnelles Emailsupport, mit dem Team Plan";
    out.features_f_supporter = "Werde ein Unterstützer des Datenschutzes";
    out.features_f_supporter_note = "Hilfe uns beweisen, dass Software mit eingebauten Datenschutz die Normalität sein sollten";
    out.features_f_subscribe = "Premium kaufen";
    out.features_f_subscribe_note = "Du muss zuerst in CryptPad eingeloggt sein";

    // faq.html
    out.faq_link = "FAQ";
    out.faq_title = "Häufige Fragen";
    out.faq_whatis = "Was ist <span class='cp-brand-font'>CryptPad</span>?";
    out.faq = {};
    out.faq.keywords = {
        title: 'Schlüsselkonzepte',
        pad: {
            q: "Was ist ein CryptPad Dokument?",
            a: "Ein CryptPad Dokument wird manchmal einfach <em>Pad</em> genannt, übernommen von  <a href='http://etherpad.org/' target='_blank'>Etherpad</a>, einem kollaborativen Echtzeit-Editor\n"+
			"Es beschreibt ein Dokument, das du in deinem Browser bearbeiten kannst, normalerweise mit der Möglichkeit für andere Personen, die Veränderungen gleichzeitig direkt zu sehen."
        },
        owned: {
            q: "What ist ein eigenes Dokument?",
            a: "Ein <em>eigenes Dokument</em> ist ein Dokument mit einem definierten Eigentümer, der anhand einer <em>Unterschrift mit öffentlichen Schlüssel</em> erkannt wird." +
				"Der Eigentümer eines Dokuments kann entscheiden, das Dokument zu löschen. In diesem Fall macht er das Dokument unverfügbar für weitere Kollaboration, egal ob das Dokument in deinem CryptDrive war oder nicht."
        },
        expiring: {
            q: "Was ist das Ablaufsdatum eines Dokuments?",
            a: "Ein Dokument kann mit einem <em>Ablaufsdatum</em> versehen werden. Nach diesem Datum wird es automatisch vom Server gelöscht" +
                " Das Ablaufdatum kann sowohl sehr nah (ein Paar Stunden) als sehr weit sein (hunderte Monate)." +
                " Das Dokument und sein gesamter Verlauf wird nach dem Ablaufdatum dauerhauft unverfügbar, auch wenn es gerade noch bearbeitet wird.<br><br>" +
                " Wenn ein Dokument ein Ablaufsadtum hat, kann mann dieses Datum in den <em>Eigenschaften</em> sehen: Entweder mit einem Rechtklick in CryptDrive oder mit der Eigenschaften-Ansicht, wenn das Dokument geöffnet ist."
        },
        tag: {
            q: "Wie kann ich Tags verwenden?",
            a: "Du kannst Dokumente und auf CryptDrive hochgeladene Dateien <em>taggen</em>, das heisst mit einem Stichwort (Tag) versehen. Während der  Bearbeitung gibt es dafür den <em>Tag</em> Knopf (<span class='fa fa-hashtag'></span>)" +
			"   Wenn du die Dokumente und Dateien in deinem CryptDrive nach einem Tag durchsuchen willst, beginne den Suchbegriff mit einem Hashtag, zB  <em>#crypto</em>."
        },
        template: {
            q: "Was ist eine Vorlage?",
            a: "Eine Vorlage ist ein Dokument, dass du benutzen kannst, um den Anfangsinhalt für zukünftige Dokumente zu definieren." +
            " Jedes existes existierende Dokument kann eine Vorlage werden, indem es in den <em>Vorlagen</em> Abschnitt des CryptDrives geschoben wird." +
            " Du kannst auch eine Kopie eines Dokuments erstellen, die zur Vorlage wird, indem du auf der Vorlagen-Knopf (<span class='fa fa-bookmark'></span>) der Werkzeugleiste des Editors drückst."
        },
    };
    out.faq.privacy = {
        title: 'Privacy',
        different: {
            q: "Wie unterscheidet sich CryptPad von anderen online kollaborativen Editoren?",
            a: "CryptPad verschlüsselt Veränderungen deiner Dokumente, bevor diese Information zum Server geschickt wird. Somit können wir nicht lesen, was du getippt hast." 
        },
        me: {
            q: "Welche Informationen erhält der Server über mich?",
            a: "Die Administratoren des Servers können die IP-Adresse der Personen sehen, die CryptPad besuchen."  +
            " Wir speichern nicht, welche Adresse welches Dokument besucht, aber wir könnten es tun, aber immer nur ohne den Inhalt des Dokuments zu kennen." +
            " Wenn Du besorgt bist, dass wir diese Information analysieren, ist es am sichersten davon auszugehen, dass wir es tun, da wir nicht beweisen können, dass wir es nicht tun.<br><br>" +

			" Wir sammeln elementare technische Informationen darüber, wie CryptPad benutzt wird, wie die Grösse des Bildschirms auf dem Gerät und welche Knöpfe am meisten geklickt werden." +
			" Das hilft uns, unsere Software besser zu machen. Aber diese Sammlung unterbleibt, solange Du bei <em>Rückmeldung aktivieren</em> keinen Haken setzt.<br><br>" + 

            " Die Speicherungsgrössen und deren Grenzen sind mit dem öffentlichen Schlüssel eines Benutzers verbunden, aber wir verbinden nicht Namen oder Emailadressen mit diesen öffentlichen Schlüsseln.<br><br>" +

			" Du kannst mehr Informationen darüber in diesem <a href='https://blog.cryptpad.fr/2017/07/07/cryptpad-analytics-what-we-cant-know-what-we-must-know-what-we-want-to-know/' target='_blank'>Blogeintrag</a> lesen."
        },
        register: {
            q: "Weisst der Server mehr über mich, wenn ich registriere?",
            a: "Wir verlangen nicht Deine Emailadresse und der Server kennt Benutzername und Passwort auch dann nicht, wenn du dich registrierst. " +
			   " Statt dessen generiert das Registrierungs- und Anmeldeformular ein Schlüsselpaar mit deiner Eingabe. Nur der öffentliche Schlüssel dieses Schlüsselpaars wird zum Server geschickt." +
               " Mit diesem öffentlichen Schlüssel könenn wir z.B. die Menge der Daten, die du benutzt, kontrollieren, denn jeder Benutzer hat eine beschränkte Quota.<br><br>" +

			   " Wir benutzen die <em>Rückmeldung</em>s-Funktion, um den Server zu informieren, dass jemand mit deiner IP ein Konto registriert hat." +
			   " Damit können wir messen, wie viele Benutzer CryptPad Konten registrieren, und aus welchen Regionen. Somit können wir erfahren, welche Sprache besseren Support braucht.<br><br>" +
				
			   " Wenn Du registrierst, erstellst Du einen öffentlichen Schlüssel, der benutzt wird, um den Server zu informieren, dass er Dokumente auch dann nicht löschen sollte, wenn sie nicht aktiv benutzt werden." + 
               " Diese Information zeigt dem Server, wie Du CryptPad benutzt, und dieses System erlaubt uns, die Dokumente zu löschen, wofür sich keiner mehr interessiert."
        },
        other: {
            q: "Was können andere Benutzer über micht erfahren?",
            a: "Wenn du ein Dokument von jemand anderen bearbeitest, kommunizierst Du mit dem Server. Nur wir kennen Deine IP-Adresse. " +
			   " Andere Benutzern sehen deinen Benutzernamen, dein Benutzerbild, das Link deines Profils (wenn du eins hast), und deinen <em>öffentlichen Schlüssel</em> (um die Nachrichten zu diesen Benutzern zu verschlüsseln)."
        },
        anonymous: {
            q: "Macht mich CryptPad anonym?",
            a: "Auch wenn CryptPad so konzipiert wurde, dass es so wenig wie möglich über dich kennt, es liefert keine strenge Anonymität" +
 		       " Unsere Server haben einen Zugang zu deiner IP-Adresse, allerdings kannst du diese Information verbergen, indem du Tor verwendest." +
			   " Einfach Tor zu verwenden, ohne dein Verhalten zu ändern, garantiert auch keine Anonymität, da der Server Benutzer noch mit deren öffentlichen Schlüsseln identifizeren kann." +
               " Wenn du denselben Schlüssel mit und ohne Tor benutzt, wird es möglich, deine Sitzung zu de-anonimisieren.<br><br>" +
 
			   " Für Benutzer, die Datenschutz im normalen Umfang brauchen, ist wichtig, daß CryptPad, im Gegenteil zu anderen Onlinediensten, nicht verlangt, daß der Benutzer sich mit Namen, Telefonnummer oder Emailadressen identifiziert."
        },
        policy: {
            q: "Habt ihr eine Datenschutzerklärung?",
            a: "Ja! Sie ist <a href='/privacy.html' target='_blank'>hier</a> verfügbar."
        }
    };
    out.faq.security = {
        title: 'Sicherheit',
        proof: {
            q: "Wie benutzt ihr <em>Zero Knowledge</em> Beweise?",
            a: "Wir benutzen den Begriff <em>Ohne Preisgabe von Daten</em> (<em>Zero Knowledge</em>) nicht im Sinn eines <em>Zero Knowledge Beweises</em> aber im Sinn eines <em>Zero Knowledge Webdienstes</em> " +
            " Ein <em>Zero Knowledge Webdienst</em> verschlüsselt die Benutzerdaten im Browser, ohne dass der Server je Zugang zu den unverschlüsselten Daten oder zu den Verschlüsselungschlüsseln hat. <br><br>" +
            " Wir haben <a href='https://blog.cryptpad.fr/2017/02/20/Time-to-Encrypt-the-Cloud/#Other-Zero-Knowledge-Services'>hier</a> eine kurze Liste von Zero-Knowledge Webdiensten erstellt."
        },
        why: {
            q: "Wieso sollte ich CryptPad verwenden?",
            a: "Unsere Position ist, dass Clouddienste nicht Zugang zu deinen Daten verlangen sollten, damit du sie mit deinen Kontakten und Mitarbeitern teilen kannst. " +
            " Wenn du einen Webdienst benutzt, der nicht explizit eine Ankündigung macht, dass die keinen Zugang zu Deinen Information haben, ist es sehr wahrscheinlich, dass sie diese Information für andere Zwecke verwerten."
        },
        compromised: {
            q: "Liefert mir CryptPad einen Schutz, wenn auf mein Gerät zugegriffen wird?",
            a: "Für den Fall, dass ein Gerät gestohlen wird, ermöglicht CryptPad, das Ausloggen aller Geräte - ausser dem, wo du gerade eingeloggt bist, zu erzwingen. " +
            " Dafür gehe auf die Seite mit Deinen <strong>Einstellungen</strong> and drücke <strong>Überall ausloggen</strong>." +    
            " Alle andere Geräte, die mit diesem Konto verbunden sind, werden dann ausgeloggt. " +
            " Alle früher verbundenen Geräte werden ausgeloggt, sobald sie CryptPad besuchen.<br><br> " +
        
            " Die <em>Fernlogout</em> Funktion, wie oben beschrieben, ist im Browser implementiert und nicht im Server. " +
            " Somit schützt diese nicht von Regierungsagenturen. Aber es sollte ausreichend sein, wenn Du ein Logout vergessen hast, wenn Du auf einem mit anderen Benutzern geteilten Rechner warst."
        },
        crypto: {
            q: "Welche Kryptografie benutzt ihr?",
            a: "CryptPad basiert auf zwei quelloffenen Kryptografiebibliotheken: " +
			   " <a href='https://github.com/dchest/tweetnacl-js' target='_blank'>tweetnacl.js</a> und <a href='https://github.com/dchest/scrypt-async-js' target='_blank'>scrypt-async.js</a>.<br><br>" +
			   " Scrypt ist ein <em>Passwort-basierter Schlüsselableitungsalgorithmus</em>. Wir benutzen es, um Deinen Benutzernamen und Kennwort in einem Schlüsselpaar umzuwandeln, das Deinen Zugang zum CryptDrive, und daher Deine gesamten Dokumente, sichert.<br><br>" +  
		
               " Wir verwenden  die Verschlüsselung <em>xsalsa20-poly1305</em> und <em>x25519-xsalsa20-poly1305</em> von tweetnacl, um Dokumente und Chat-Historie zu verschlüsseln."
        }
    };
    out.faq.usability = {
        title: 'Usability',
        register: {
            q: "Was kriege ich, wenn ich registriere?",
            a: "Registrierte Benutzer können eine Menge Funktionen verwenden, die unregistrierte nicht nutzen können. Es gibt <a href='/features.html' target='_blank'>hier</a> eine Tabelle."
        },
        share: {
            q: "Wie kann ich den Zugang zu einem verschlüsselten Dokument mit Freunden teilen?",
            a: "CryptPad legt den Verschlüsselungsschlüssel zu deinem Pad nach dem <em>#</em> Buchstabe in dem URL." +
			   " Alles was nach diesem Buchstaben kommt, wird nicht zum Server geschickt; also haben wir nie Zugang zu deinem Verschlüsselungsschlüssel." +
			   " Wenn du den Link deines Dokuments teilst, teilst Du auch die Fähigkeit zum Lesen und zum Bearbeiten."
        },
        remove: {
            q: "Ich habe ein Dokument aus meinem CryptDrive gelöscht, aber der Inhalt ist noch verfügbar. Wie kann ich es entfernen?",
			a: "Nur <em>eigene Dokumente</em>, die erst in Februar 2018 eingeführt wurden, können gelöscht werden und zwar nur von deren Eigentümer" +
			   " (der Benutzer, der das Dokument original gestaltet hat). Wenn Du nicht der Eigentümer eines Dokuments bist, musst du den Eigentümer bitten, dass er dieses löscht." +
			   " Für ein Dokument, dessen Eigentümer du bist, kannst du auf dem Dokument <strong>in CryptDrive rechtsklicken</em> und <strong>Vom Server löschen</strong> wählen. "
        },
        forget: {
            q: "Was passiert, wenn ich mein Passwort vergesse?",
            a: " Leider: Wenn wir dein Passwort zurückerstellen könnten, könnten wir auch Zugang zu deinen Daten selber haben. " +
               " Wenn du dein Passwort nicht aufgeschrieben und vergessen hast, kannst Du vielleicht die vergangenen Dokumente aus deinem Browserverlauf zurückgewinnen. "
        },
        change: {
            q: "Was ist, wenn ich mein Passwort wechseln möchte?",
            a: "Es ist aktuell nicht möglich, dein CryptPad Passwort zu wechseln, obwohl wir diese Funktion bald planen."
        },
        devices: {
            q: "Ich bin auf zwei Geräten eingeloggt und sehe zwei unterschiedliche CryptDrives. Wie ist das möglich?",
            a: "Es ist möglich, dass Du zweimal denselben Namen registriert hast, mit unterschiedlichen Passwörtern." +
            " Weil der CyrptPad Server dich mit deiner kryptografischen Unterschrift und nicht mit deinem Namen identifiziert, kann er nicht verhindern, daß derselbe Name von mehreren verwendet wird." +
            " Somit hat jede Benutzerkonto eine einzigartige Beutzername- und Passwortkombination. " +
            " Angemeldete Benutzer können ihren Benutzernamen im oberen Teil der Einstellungsseite sehen."
        },
        folder: {
            q: "Kann ich ganze Ordner in CryptDrive teilen?",
            a: "Wir arbeiten daran, eine <em>Arbeitgruppenfunktion</em> anzubieten, die Mitgliedern erlauben würde, ganze Ordnern sowie alle Dokumente darin  zu teilen."
        },
        feature: {
            q: "Könnt ihr diese eine Funktion hinzufügen, die ich brauche?",
            a: "Viele Funktionen existieren in CryptPad, weil Benutzern darum gebeten haben." +
            " Unsere <a href='https://cryptpad.fr/contact.html' target='_blank'>Kontaktseite</a> hat eine Liste der Möglichkeiten, wie man mit uns in Kontakt treten kann.<br><br>" +

            "Leider können wir aber nicht garantieren, dass wir alle Funktionen entwickeln, um die Benutzer bitten." +
            " Wenn eine Funktion kritisch für deine Organisation ist, kannst du Sponsor der Entwicklung dieser Funktion werden, und somit deren Realisierung sichern." +
            " Bitte kontaktiere <a href='mailto:sales@cryptpad.fr' target='_blank'>sales@cryptpad.fr</a> für mehr Informationen.<br><br>" +

            "Auch wenn du nicht die Entwicklung einer Funktion sponsoren kannst, sind wir an Rückmeldungen interessiert, damit es uns hilft CryptPad zu verbessern." +
            " Kontaktiere uns jederzeit mit einer der oben angegebenen Methoden."
        }
    };

    out.faq.other = {
        title: "Andere Fragen?",
        pay: {
            q: "Wieso soll ich zahlen, wenn so viele Funktionen sowieso kostenfrei sind?",
            a: "Wir geben Sponsoren zusätzlichen Speicherplatz sowie die Möglichkeit, die Speicherplatzgrenzen ihrer Freunde zu erhöhen (<a href='https://accounts.cryptpad.fr/#/faq' target='_blank'>lese mehr</a>).<br><br>" +

            " Über diese diese kurzfristigen Vorteile hinaus kannst Du, wenn Du ein Premiumangebot annimmst, die aktive Weiterentwicklung von CryptPad fördern. Dieses beinhaltet Fehler zu beseitigen, neue Funktionen zu gestalten, und es erleichtern, CryptPad auf eigenen Servern zu installieren." +
            " Zusätzlich hilfst du, anderen Anbiertern zu beweisen, dass Leute datenschutzschonende Technologien unterstützen. Wir hoffen, dass am Ende Geschäftmodelle, die auf dem Verkauf von Benutzerdaten basieren, Vergangenheit werden.<br><br>" +

            " Außerdem glauben wir, dass es gut ist, die Funktionen von CryptPad kostenfrei anzubieten, weil jeder persönlichen Datenschutz braucht, nicht nur diejenige mit Extraeinkommen." +
            " Durch deine Unterstützung hilfst Du uns, zu ermöglichen, dass auch Menschen mit weniger Einkommen diese grundlegenden Funktionen geniessen können, ohne dass ein Preisetikett daran klebt."
        },
        goal: {
            q: "Was ist euer Ziel?",
            a: "Durch die Verbesserung von datenschutzschonenden Technologien möchten wir die Erwartungen der Benutzer an den Datenschutz auf Cloudplattformen erhöhen." + 
            "Wir hoffen, dass unsere Arbeit andere Dienstanbieter in allen Bereichen anspornt, ähnliche oder bessere Dienste anzubieten. " + 
            "Trotz unser Optimismus wissen wir, dass ein grosser Teil des Netztes durch gezielte Werbung finanziert wird. " +
            "Es gibt viel mehr Arbeit in der Richtung, als wir jemals schaffen können, und wir freuen uns über die Förderung, Unterstützung und Beiträge aus unserer Community."
        },
        jobs: {
            q: "Sucht Ihr Mitarbeiter*innen?",
            a: "Ja! Bitte schicke eine kurze Vorstellung an <a href='mailto:jobs@xwiki.com' target='_blank'>jobs@xwiki.com</a>."
        },
        host: {
            q: "Könnt ihr mir helfen, meine eigene Installation von CryptPad aufzubauen?",
            a: "Wir bieten gerne Support für das Aufsetzen eines internen CryptPads für deine Organisation. Setze dich bitte mit <a href='mailto:sales@cryptpad.fr' target='_blank'>sales@cryptpad.fr</a> in Kontakt für mehr Information.",
        },
        revenue: {
            q: "Wie kann ich meine Einnahmen mit den Entwicklern teilen?",
            a:  " Wenn du deine eigene Installation von CrytPad betreibst und die Einnahmen für deine bezahlten Konten mit Entwicklern teilen möchtest, muß dein Server als Partnerservice konfiguriert werden.<br><br>" +

            "In Deinem CryptPad Verzeichnis befindet sich <em>config.example.js</em>, die erklärt, wie du deinen Server dafür konfigurieren musst. "+
            "Danach solltest du  <a href='mailto:sales@cryptpad.fr'>sales@cryptpad.fr</a> kontaktieren, damit geprüft wird, dass dein Server richtig mit HTTPS konfiguriert ist und die Bezahlungsmethoden abgesprochen werden können. "
        },
    };
  
    // terms.html 995
    out.tos_title = "Cryptpad Nutzungsbedingungen";
    out.tos_legal = "Sei nicht bösartig oder missbrauchend und mach nichts illegales.";
    out.tos_availability = "Wir hoffen, dass dir dieser Service nützt, aber Erreichbarkeit und Performanz können nicht garantiert werden. Bitte exportiere  deine Daten regelmäßig.";
    out.tos_e2ee = "Cryptpad Dokumente können von allen gelesen oder bearbeitet werden, die den \"fragment identifier\" des Dokuments erraten oder auf eine andere Art davon erfahren. Wir empfehlen dir Ende-Zu-Ende verschlüsselte Nachrichtentechnik (e2ee) zum Versenden der URLs zu nutzen. Wir übernehmen keine Haftung, falls eine URL erschlichen oder abgegriffen wird.";
    out.tos_logs = "Metadaten, die dein Browser übermittelt, können geloggt werden, um den Service aufrechtzuerhalten.";
    out.tos_3rdparties = "Wir geben keine Individualdaten an Dritte Weiter, außer auf richterliche Anordnung.";

    // 404 page
    out.four04_pageNotFound = "Wir konnten die Seite, die du angefordert hast, nicht finden.";

      // BottomBar.html
      // out.bottom_france = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer">Mit <img class="bottom-bar-heart" src="/customize/heart.png" /> in <img class="bottom-bar-fr" src="/customize/fr.png" /> gemacht</a>';
      // out.bottom_support = '<a href="http://labs.xwiki.com/" title="XWiki Labs" target="_blank" rel="noopener noreferrer">Ein <img src="/customize/logo-xwiki2.png" alt="XWiki SAS" class="bottom-bar-xwiki"/> Labs Project </a> mit Hilfe von <a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';

    // Header.html

    out.updated_0_header_logoTitle = 'Zu deinem CryptDrive';
    out.header_logoTitle = out.updated_0_header_logoTitle;
    out.header_homeTitle = 'Zu der CryptPad Homeseite';

    // Initial states

    out.help = {};

    out.help.title = "Mit CryptPad anfangen";
    out.help.generic = {
        more: 'Erfahre mehr wie CryptPad für dich arbeiten kann, indem du unsere <a href="/faq.html" target="_blank">FAQ</a> liest.',
        share: 'Benutze das Teilen-Menü (<span class="fa fa-share-alt"></span>), um Links zu schicken, die zur Mitarbeit beim Lesen oder Bearbeiten einladen.',
        stored: 'Jedes Dokument, dass du besuchst, ist automatisch in deinem  <a href="/drive/" target="_blank">CryptDrive</a> gespeichert.',
    };

    out.help.text = {
        formatting: 'Du kannst die Werkzeugleiste anzeigen oder verbergen indem du auf <span class="fa fa-caret-down"></span> oder <span class="fa fa-caret-up"></span> klickst.',
        embed: 'Registrierte Benutzer können mit <span class="fa fa-image"></span> Bilder oder Dateien einbetten, die in deren CryptDrive gespeichert sind.',
        history: 'Du kannst das Menü <em>Verlauf</em> <span class="fa fa-history"></span> benutzen, um frühere Version anzusehen oder zurückbringen.',
    };

    out.help.pad = {
        export: 'Du kannst den Export als PDF benutzen, indem Du auf dem Knopf <span class="fa fa-print"></span> in dem Formatierungs-Werkzeugleiste drückst.',
    };

    out.help.code = {
        modes: 'Benutze das Dropdown Menü im Untermenü <span class="fa fa-ellipsis-h"></span>, um die Syntaxhervorhebung oder das Farbschema zu wechseln.',
    };

    out.help.slide = {
        markdown: 'Schreibe Folien in <a href="http://www.markdowntutorial.com/">Markdown</a> and separiere sie mit der Zeile <code>---</code>.',
        present: 'Starte die Präsentation mit dem Knopf <span class="fa fa-play-circle"></span>.',
        settings: 'Verändere die Präsentationseinstellungen (Hintergrund, Transition, Anzeige der Seitenummer, etc) mit dem Knopf <span class="fa fa-cog"></span> in dem Submenü <span class="fa fa-ellipsis-h"></span>.',
        colors: 'Verändere Text- und Hintergrundfarbe mit den Knöpfen <span class="fa fa-i-cursor"></span> und <span class="fa fa-square"></span>.',
    };

    out.help.poll = {
        decisions: 'Treffe Entscheidungen gemeinsam mit deinen Bekannten',
        options: 'Mache Vorschläge und teile deine Präferenzen mit',
        choices: 'Klicke die Zellen in deiner Spalte, um zwischen ja (<strong>✔</strong>), viellecht (<strong>~</strong>), oder nein (<strong>✖</strong>) zu wählen',
        submit: 'Klicke auf <strong>Schicken</strong>, damit deine Entscheidung für andere sichtbar wird',
    };

    out.help.whiteboard = {
        colors: 'Ein Doppelklick auf Farben erlaubt, die Palette zu verändern',
        mode: 'Deaktiviere den Zeichenmodus, um die vorhandenen Striche zu ziehen und zu verlängern',
        embed: 'Bette Bilder von deiner Festplatte ein <span class="fa fa-file-image-o"></span> oder von deinem CryptDrive <span class="fa fa-image"></span> und exportiere sie als PNG zu deiner Festplatte <span class="fa fa-download"></span> oder zu deinem CryptDrive <span class="fa fa-cloud-upload'
    };

    out.help.kanban = {
        add: 'Füge ein neues Bord hinzu mit dem <span class="fa fa-plus"></span> Knopf in der rechten oberen Ecke',
        task: 'Verschiebe Items von einem Bord zum anderen durch Ziehen und Ablegen',
        color: 'Ändere die Farben durch Klicken auf den farbigen Teil neben dem Bordtitel',
    };

    out.initialState = [
        '<p>',
        'Dies ist is&nbsp;<strong>CryptPad</strong>, der Echtzeit-Kollaborativ-Editor ohne Preisgabe deiner Daten. Alles wird beim Tippen direkt gespeichert.',
        '<br>',
        'Teile den Link zu diesem Pad, um mit Bekannten zusammen zu arbeiten, oder verwende den Knopf <span class="fa fa-share-alt"></span>, um einen <em>schreibgeschützten Link</em>&nbsp; zu teilen, der die Ansicht, aber nicht die Bearbeitung erlaubt.',
        '</p>',
    ].join('');

    out.codeInitialState = [
        '# CryptPad\'s Zero Knowledge Kollaborativer Code Editor ohne Preisgabe deiner Daten\n',
        '\n',
        '* Was du hier tippst, ist verschlüsselt. Nur wer den kompletten Link kennt, kann darauf zugreifen.\n',
        '* Du kannst die Programmierungsprache für die Syntaxhervorhebung sowie das Farbschema oben rechts wählen.'
    ].join('');

    out.slideInitialState = [
        '# CryptSlide\n',
        '1. Schreibe deine Präsentation mit der Markdown Syntax\n',
        '  - Mehr über Markdown [hier](http://www.markdowntutorial.com/) erfahren\n',
        '2. Trenne deine Folien mit ---\n',
        '3. Klicke auf den "Abspielen" Knopf, um das Ergebnis zu sehen.',
        '  - Deine Folien werden in Echtzeit aktualisiert'
    ].join('');

    // Readme
    out.driveReadmeTitle = "Was ist CryptPad?";
    out.readme_welcome = "Willkommen zu CryptPad !";
    out.readme_p1 = "Willkommen zu CryptPad, hier kannst du deine Notizen aufschreiben, allein oder mit Bekannten.";
    out.readme_p2 = "Dieses Dokument gibt dir einen kurzen Überblick, wie du CryptPad verwenden kann, um Notizen zu schreiben und und mit anderen zusammen zu arbeiten.";
    out.readme_cat1 = "Lerne CryptDrive kennen";
    out.readme_cat1_l1 = "Ein Dokument erstellen: Klicke in Deinem CryptDrive {0}, dann {1} und Du kannst ein Dokument erstellen."; // 0: New, 1: Rich Text
    out.readme_cat1_l2 = "Ein Dokument Deines CryptDrives öffnen: Doppelklicke auf das Symbol eines Dokument, um es zu öffnen.";
    out.readme_cat1_l3 = "Deine Dokumente organisieren: Wenn du eingeloggst bist, wird jedes Dokument, das du besuchst, im {0} Bereich deines CryptDrives angezeigt";
    out.readme_cat1_l3_l1 = "Im Abschnitt {0} deines CryptDrives kannst du Dateien zwischen Ordnern ziehen und ablegen oder neue Ordner anlegen."; // 0: Documents
    out.readme_cat1_l3_l2 = "Ein Rechtsklick auf Symbole zeigt zusätzliche Menüfunktionen.";
    out.readme_cat1_l4 = "Verschiebe deine alten Dokumente in den Papierkorb: Du kannst Deine Dokumente zu {0} verschieben, genauso, wie du es zu einem Ordner machst."; // 0: Trash
    out.readme_cat2 = "Dokumente wie ein Profi gestalten";
    out.edit = "bearbeiten";
    out.view = "ansehen";
    out.readme_cat2_l1 = "Der Knopf {0} in deinem Dokument erlaubt dir, anderen einen Mitbearbeitungszugang zu geben (entweder zu {1} oder {2}).";
    out.readme_cat2_l2 = "Der Titel eines Dokuments kann mit einem Klick auf den Stift geändert werden.";
    out.readme_cat3 = "Entdecke CryptPad Apps";
    out.readme_cat3_l1 = "Mit dem CryptPad-Codeeditor kannst du Code wie JavaScript, Markdown, oder HTML bearbeiten";
    out.readme_cat3_l2 = "Mit dem CryptPad-Präsentationseditor kannst du schnell Vorträge mit Hilfe von Markdown gestalten";
    out.readme_cat3_l3 = "Mit der CryptPad-Umfrage kannst du schnell Abstimmungen durchführen, insbesondere, um Meetings zu planen, die in den Kalender von allen passen.";

    // Tips
    out.tips = {};
    out.tips.shortcuts = "Mit den Tastenkürzeln `ctrl+b`, `ctrl+i` and `ctrl+u` formatierst du Text fett, kursiv, oder unterstrichen.";
    out.tips.indent = "In bezifferten oder einfachen Listen kannst du mit TAB und SHIFT-TAB den Einzug erhöhen oder reduzieren.";
    out.tips.store = "Jedes Mal, wenn du ein Dokument besuchst und eingeloggt bist, wird es in deinem CryptDrive gespeichert.";
    out.tips.marker = "Du kannst Text in einem Dokument mit \"Marker\" Menü in dem Stilmenü markieren.";
    out.tips.driveUpload = "Registrierte Benutzer können verschlüsselte Dateien aus ihrer Festplatte hochladen, indem sie sie einfach verschieben und in ihrem CryptDrive ablegen.";
    out.tips.filenames = "Du kannst Dateien in deinem CryptDrive neubenennen. Dieser Name ist nur für dich.";
    out.tips.drive = "Eingeloggte Benutzern können ihre Dateien in ihrem CryptDrive organisieren. Dieses ist mit einem Klick auf das CryptPad Symbol oben links erreichbar, wenn man in einem Dokument ist.";
    out.tips.profile = "Registrierte Benutzer können ihr Profil im Benutzer-Menü oben rechts bearbeiten.";
    out.tips.avatars = "Du kannst ein Benutzerbild in dein Profil hochladen. Andere sehen es, wenn sie in einem Dokument zusammenarbeiten.";
    out.tips.tags = "Bringe Tags auf deinen Dokumenten an und starte eine Suche-nach-Tags mit dem # Zeichen in der CryptDrive-Suche.";

    out.feedback_about = "Wenn Du das liest, fragst du dich, weshalb dein Browser Anfragen an Webseiten schickt, wenn manche Aktionen ausgeführt werden.";
    out.feedback_privacy = "Wir kümmern uns um deinen Datenschutz, aber gleichzeitig wollen wir, dass die Benutzung von CryptPad sehr leicht ist. Deshalb wollen wir erfahren, welche UI-Funktion am wichtigsten für unsere Benutzer ist, indem wir diese mit einer genauen Parameterbeschreibung anfordern.";
    out.feedback_optout = "Wenn du das nicht möchtest, kannst du es in <a href='/settings/'>deinen Einstellungen</a> deaktivieren.";

    // Creation page
    out.creation_404 = "Dieses Dokument existiert nicht mehr. Benutze das folgende Formular, um ein neues Dokument zu gestalten.";
    out.creation_ownedTitle = "Dokumenttyp";
    out.creation_owned = "Eigenes Dokument"; // Creation page
    out.creation_ownedTrue = "Eigenes Dokument"; // Settings
    out.creation_ownedFalse = "Dokument von jemand anderem";
    out.creation_owned1 = "Ein <b>eigenes Dokument</b> kann vom Server gelöscht werden, wenn der Eigentümer so entscheidet. Die Löschung eines eigenes Dokuments bewirkt die Löschung aus allen anderen CryptDrives. ";
    out.creation_owned2 = "Ein offenes Dokument hat keinen Eigentümer, also kann es nicht gelöscht werden, ausser es hat sein Ablaufdatum erreicht.";
    out.creation_expireTitle = "Ablaufdatum";
    out.creation_expire = "Auslaufendes Dokument";
    out.creation_expireTrue = "Ein Ablaufdatum hinzufügen";
    out.creation_expireFalse = "Unbegrenzt";
    out.creation_expireHours = "Stunde(n)";
    out.creation_expireDays = "Tag(e)";
    out.creation_expireMonths = "Monat(e)";
    out.creation_expire1 = "Ein <b>unbegrenztes</b> Dokument wird nicht vom Server entfernt solange der Eigentümer es nicht löscht.";
    out.creation_expire2 = "Ein <b>auslaufendes</b> Dokument hat eine begrenzte lebensdauer, nach der es automatisch vom Server und aus den CryptDrives anderer Leute entfernt wird.";
    out.creation_password = "Passwort hinzufügen"; 
    out.creation_noTemplate = "Keine Vorlage";
    out.creation_newTemplate = "Neue Vorlage";
    out.creation_create = "Erstellen";
    out.creation_saveSettings = "Dieses Dialog nicht mehr anzeigen";
    out.creation_settings = "Mehr Einstellungen zeigen";
    out.creation_rememberHelp = "Geh zu deiner Einstellungen, um diese Einstellung wieder vorzunehmen";
    // Properties about creation data
    out.creation_owners = "Eigentümer";
    out.creation_ownedByOther = "Eigentum eines anderen Benutzer";
    out.creation_noOwner = "Kein Eigentümer";
    out.creation_expiration = "Auslaufdatum";
    out.creation_passwordValue = "Passwort"; 
    out.creation_propertiesTitle = "Verfügbarkeit";
    out.creation_appMenuName = "Fortgeschrittenes Modus (Ctrl + E)";
    out.creation_newPadModalDescription = "Klicke auf einen Padtyp, um es zu erstellen. Du kannst auch die <b>Tab</b>-Taste benutzen, um zu navigieren, und die <b>Enter</b>-Taste zum Bestätigen. ";
    out.creation_newPadModalDescriptionAdvanced = "Du kannst das Kästchen markieren (oder auf die Leertaste drücken, um den Wert zu ändern), um den Einstellungsdialog bei der Dokumenterstellung anzuzeigen (für eigene oder auslaufende Dokumente).";
    out.creation_newPadModalAdvanced = "Den Einstellungdialog bei der Dokumenterstellung anzeigen";

    // Password prompt on the loading screen
    out.password_info = "Das Pad, das du öffnen möchtest, ist mit einem Passowrt geschützt. Gib das richtige Passwort ein, um den Inhalt anzuzeigen.";
    out.password_error = "Pad nicht gefunden!<br>Dieser Fehler kann zwei Ursachen haben: entweder ist das Passwort ungültig oder das Pad wurde vom Server gelöscht.";
    out.password_placeholder = "Gib das Passwort hier ein...";
    out.password_submit = "Abschicken";
    out.password_show = "Anzeigen";

    // Change password in pad properties
    out.properties_addPassword = "Passwort hinzufügen";
    out.properties_changePassword = "Passwort ändern";
    out.properties_confirmNew = "Bist du sicher? Das Hinzufügen eines Passworts wird die URL dieses Pads ändern und die Chronik entfernen. Benutzer ohne Passwort werden den Zugang zu diesem Pad verlieren.";
    out.properties_confirmChange = "Bist du sicher? Das Ändern des Passworts wird die Chronik entfernen. Benutzer ohne das neue Passwort werden den Zugang zu diesem Pad verlieren.";
    out.properties_passwordError = "Ein Fehler ist aufgetreten beim Versuch das Passwort zu ändern. Bitte versuche es nochmal.";
    out.properties_passwordWarning = "Das Password wurde erfolgreich geändert, aber dein CryptDrive konnte nicht aktualisiert werden. Du mußt möglicherweise die alte Version des Pads manuell entfernen.<br>Bitte klicke OK um die Seite neu zu laden und die Zugeriffsrechte zu aktualisieren.";
    out.properties_passwordSuccess = "Das Password wurde erfolgreich geändert.<br>Bitte klicke OK um die Seite neu zu laden und die Zugeriffsrechte zu aktualisieren.";
    out.properties_changePasswordButton = "Abschicken";

    // New share modal
    out.share_linkCategory = "Link teilen";
    out.share_linkAccess = "Zugangsrechte";
    out.share_linkEdit = "Bearbeiten";
    out.share_linkView = "Ansehen";
    out.share_linkOptions = "Linkoptionen";
    out.share_linkEmbed = "Einbettungsmodus (Werkzeugleiste und Benutzerliste sind verborgen)";
    out.share_linkPresent = "Anzeigemodus (Bearbeitbare Abschnittte sind verborgen)";
    out.share_linkOpen = "In einem neuen Tab öffnen";
    out.share_linkCopy = "In die Zwischenablage kopieren.";
    out.share_embedCategory = "Einbetten";
    out.share_mediatagCopy = "Mediatag in die Zwischenablage kopieren";

    // Loading info
    out.loading_pad_1 = "Initialisiere Pad";
    out.loading_pad_2 = "Lade Padinhalt";
    out.loading_drive_1 = "Lade Daten";
    out.loading_drive_2 = "Aktualisiere Datenformat";
    out.loading_drive_3 = "Verifiziere Datenintegrität";

    // Shared folders
    out.sharedFolders_forget = "Dieses Pad wird nur in einem geteilten Ordner gespeichert, du kannst es nicht in den Papierkorb verschieben. Du kannst es in deinem CryptDrive löschen.";
    out.sharedFolders_duplicate = "Einige der Pads, die du versucht hast zu verschieben, waren schon im Zielordner geteilt.";
    out.sharedFolders_create = "Erstelle einen geteilten Ordner";
    out.sharedFolders_create_name = "Neuer Ordner";
    out.sharedFolders_create_owned = "Eigener Ordner";
    out.sharedFolders_create_password = "Ordnerpasswort";
    out.sharedFolders_share = "Teile diese URL mit anderen registrierten Benutzern, um ihnen Zugriff auf den geteilten Ordner zu geben. Sobald sie diese URL öffnen, wird der geteilte Ordner zu ihrem CryptDrive hinzugefügt.";

    out.chrome68 = "Anscheinend benutzt du Chrome oder Chromium version 68. Darin ist ein bug, der dafür sorgt, dass nach ein paar Sekunden die Seite komplett weiß ist oder nicht mehr auf Klicks reagiert. Um das Problem zu beheben, wechsle den Tab und komme wieder, oder versuche zu scrollen. Dieser Bug sollte in der nächsten Version deines Browsers gefixt sein.";

    // Manual pad storage popup
    out.autostore_file = "Diese Datei";
    out.autostore_sf = "Dieser Ordner";
    out.autostore_pad = "Dieses Dokument";
    out.autostore_notstored = "{0} ist nicht in deinem CryptDrive. Willst du es dort speichern?";
    out.autostore_settings = "Du kannst automatisches Speichern im CryptDrive in deinen <a href=\"/settings/\">Einstellungen</a> aktivieren!";
    out.autostore_store = "Speichern";
    out.autostore_hide = "Nicht speichern";
    out.autostore_error = "Unerwarteter Fehler: wir konnten das Pad nicht speichern, bitte versuche es nochmal.";
    out.autostore_saved = "Das Pad wurde erfolgreich in deinem CryptDrive gespeichert!";
    out.autostore_forceSave = "Speicher die Datei in deinem CryptDrive"; // File upload modal
    out.autostore_notAvailable = "Du musst dieses Pad in deinem CryptDrive speichern, bevor du dieses Feature benutzen kannst."; // Properties/tags/move to trash

    // Crowdfunding messages
    out.crowdfunding_home1 = "CryptPad braucht deine Hilfe!";
    out.crowdfunding_home2 = "Klicke auf dem Knopf, um über die Crowdfunding-Kampagne zu erfahren.";
    out.crowdfunding_button = "Unterstütze CryptPad";

    out.crowdfunding_popup_text = "<h3>Wir brauchen deine Hilfe!</h3>" +
                                  "Um sicherzustellen, dass CryptPad weiter aktiv entwickelt wird, unterstütze bitte das Projekt durch die " +
                                  '<a href="https://opencollective.com/cryptpad">OpenCollective Seite</a>, wo du unsere <b>Roadmap</b> und <b>Funding-Ziele</b> lesen kannst.';
    out.crowdfunding_popup_yes = "OpenCollective besuchen";
    out.crowdfunding_popup_no = "Nicht jetzt";
    out.crowdfunding_popup_never = "Nicht mehr darum bitten.";

    return out;
  });
  
