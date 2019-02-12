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

    out.main_title = "CryptPad: Zusammenarbeit in Echtzeit ohne Preisgabe von Informationen";

    out.type = {};
    out.type.pad = 'Rich Text';
    out.type.code = 'Code';
    out.type.poll = 'Umfrage';
    out.type.kanban = 'Kanban';
    out.type.slide = 'Präsentation';
    out.type.drive = 'CryptDrive';
    out.type.whiteboard = 'Whiteboard';
    out.type.file = 'Datei';
    out.type.media = 'Medien';
    out.type.todo = 'Aufgaben';
    out.type.contacts = 'Kontakte';
    out.type.sheet = 'Tabelle (Beta)';

    out.button_newpad = 'Neues Rich-Text-Pad';
    out.button_newcode = 'Neues Code-Pad';
    out.button_newpoll = 'Neue Umfrage';
    out.button_newslide = 'Neue Präsentation';
    out.button_newwhiteboard = 'Neues Whiteboard';
    out.button_newkanban = 'Neues Kanban';

    // NOTE: Remove updated_0_ if we need an updated_1_
    out.updated_0_common_connectionLost = "<b>Die Verbindung zum Server ist abgebrochen</b><br>Du verwendest jetzt das Dokument schreibgeschützt, bis die Verbindung wieder funktioniert.";
    out.common_connectionLost = out.updated_0_common_connectionLost;

    out.websocketError = 'Verbindung zum Websocket fehlgeschlagen...';
    out.typeError = "Dieses Dokument ist nicht mit der ausgewählten Anwendung kompatibel";
    out.onLogout = 'Du bist ausgeloggt. {0}Klicke hier{1}, um dich wieder einzuloggen,<br>oder drücke <em>Escape</em>, um dein Pad schreibgeschützt zu benutzen.';
    out.wrongApp = "Der Inhalt dieser Echtzeitsitzung kann nicht in deinem Browser angezeigt werden. Bitte lade die Seite neu.";
    out.padNotPinned = 'Dieses Pad wird nach 3 Monaten ohne Aktivität auslaufen, {0}logge dich ein{1} oder {2}registriere dich{3}, um das Auslaufen zu verhindern.';
    out.anonymousStoreDisabled = "Der Webmaster dieses CryptPad-Servers hat die anonyme Verwendung des Speichers deaktiviert. Du musst dich einloggen, um CryptDrive zu verwenden.";
    out.expiredError = 'Dieses Pad ist abgelaufen und ist nicht mehr verfügbar.';
    out.deletedError = 'Dieses Pad wurde von seinem Besitzer gelöscht und ist nicht mehr verfügbar.';
    out.inactiveError = 'Dieses Pad ist wegen Inaktivität gelöscht worden. Drücke Esc, um ein neues Pad zu erstellen.';
    out.chainpadError = 'Ein kritischer Fehler ist beim Aktualisieren deines Inhalts aufgetreten. Diese Seite ist schreibgeschützt, damit du sicherstellen kannst, dass kein Inhalt verloren geht.<br>'+
                        'Drücke <em>Esc</em>, um das Pad schreibgeschützt zu lesen oder lade es neu, um die Bearbeitung fortzusetzen.';
    out.errorCopy = ' Du kannst noch den Inhalt woanders hin kopieren, nachdem du <em>Esc</em> gedrückt hast.<br>Wenn du die Seite verlässt, verschwindet der Inhalt für immer!';
    out.errorRedirectToHome = 'Drücke <em>Esc</em>, um zu deinem CryptDrive zurückzukehren.';
    out.newVersionError = "Eine neue Version von CryptPad ist verfügbar.<br>" +
                          "<a href='#'>Lade die Seite neu</a>, um die neue Version zu benutzen. Drücke Esc, um im <b>Offline-Modus</b> weiterzuarbeiten.";

    out.loading = "Laden...";
    out.error = "Fehler";
    out.saved = "Gespeichert";
    out.synced = "Alles gespeichert";
    out.deleted = "Pad wurde aus deinem CryptDrive gelöscht";
    out.deletedFromServer = "Pad wurde vom Server gelöscht";

    out.mustLogin = "Du musst angemeldet sein, um auf diese Seite zuzugreifen";
    out.disabledApp = "Diese Anwendung wurde deaktiviert. Kontaktiere den Administrator dieses CryptPads, um mehr Informationen zu erhalten.";

    out.realtime_unrecoverableError = "Es ist ein nicht reparierbarer Fehler aufgetreten. Klicke auf OK, um neu zu laden.";

    out.disconnected = 'Getrennt';
    out.synchronizing = 'Synchronisieren';
    out.reconnecting = 'Verbindung wird aufgebaut';
    out.typing = "Es wird getippt";
    out.initializing = "Starten...";
    out.forgotten = 'In den Papierkorb verschoben';
    out.errorState = 'Kritischer Fehler: {0}';
    out.lag = 'Verzögerung';
    out.readonly = 'schreibgeschützt';
    out.anonymous = "Anonym";
    out.yourself = "Du";
    out.anonymousUsers = "anonyme Nutzer";
    out.anonymousUser = "anonyme Nutzer";
    out.users = "Nutzer";
    out.and = "Und";
    out.viewer = "Betrachter";
    out.viewers = "Betrachter";
    out.editor = "Bearbeiter";
    out.editors = "Bearbeiter";
    out.userlist_offline = "Du bist aktuell offline, die Benutzerliste ist nicht verfügbar.";

    out.language = "Sprache";

    out.comingSoon = "Kommt bald...";

    out.newVersion = '<b>CryptPad wurde aktualisiert!</b><br>' +
                     'Entdecke, was neu in dieser Version ist:<br>'+
                     '<a href="https://github.com/xwiki-labs/cryptpad/releases/tag/{0}" target="_blank">Versionshinweise für CryptPad {0}</a>';

    out.upgrade = "Upgrade";
    out.upgradeTitle = "Dein Konto upgraden, um mehr Speicherplatz zu haben";

    out.upgradeAccount = "Konto upgraden";
    out.MB = "MB";
    out.GB = "GB";
    out.KB = "KB";

    out.supportCryptpad = "CryptPad unterstützen";

    out.formattedMB = "{0} MB";
    out.formattedGB = "{0} GB";
    out.formattedKB = "{0} KB";

    out.greenLight = "Alles funktioniert bestens!";
    out.orangeLight = "Deine langsame Verbindung kann die Nutzung beeinträchtigen.";
    out.redLight = "Du wurdest von dieser Sitzung getrennt.";

    out.pinLimitReached = "Du hast deine Speicherplatzbegrenzung erreicht";
    out.updated_0_pinLimitReachedAlert = "Du hast deine Speicherplatzbegrenzung erreicht. Neue Pads werden nicht mehr in deinem CryptDrive gespeichert.<br>" +
        'Du kannst entweder ein Pad von deinem CryptDrive entfernen oder <a href="https://accounts.cryptpad.fr/#!on={0}" target="_blank">ein Premiumangebot anfordern</a>, damit deine Begrenzung erhöht wird.';
    out.pinLimitReachedAlert = out.updated_0_pinLimitReachedAlert;
    out.pinLimitReachedAlertNoAccounts = out.pinLimitReached;
    out.pinLimitNotPinned = "Du hast deine Speicherplatzbegrenzung erreicht.<br>"+
                            "Dieses Pad ist nicht in deinem CryptDrive gespeichert.";
    out.pinLimitDrive = "Du hast deine Speicherplatzbegrenzung erreicht.<br>" +
                        "Du kannst keine neuen Pads erstellen.";

    out.moreActions = "Mehr Aktionen";

    out.importButton = "Importieren";
    out.importButtonTitle = 'Importiere eine lokale Pad-Datei';

    out.exportButton = "Exportieren";
    out.exportButtonTitle = 'Exportiere dieses Pad in eine lokale Datei';
    out.exportPrompt = 'Wie möchtest du die Datei nennen?';

    out.changeNamePrompt = 'Ändere deinen Namen (oder lasse dieses Feld leer, um anonym zu bleiben): ';
    out.user_rename = "Bearbeite deinen Anzeigename";
    out.user_displayName = "Anzeigename";
    out.user_accountName = "Kontoname";

    out.clickToEdit = "Zum Bearbeiten klicken";
    out.saveTitle = "Den Titel speichern (Enter)";

    out.forgetButton = "Entfernen";
    out.forgetButtonTitle = 'Dieses Pad in den Papierkorb verschieben';
    out.forgetPrompt = 'Mit dem Klick auf OK wird das Pad in den Papierkorb verschoben. Bist du sicher?';
    out.movedToTrash = 'Dieses Dokument liegt im Papierkorb.<br>Du kannst <a href="/drive/">zum CryptDrive</a> navigieren.';

    out.shareButton = 'Teilen';
    out.shareSuccess = 'Die URL wurde in die Zwischenablage kopiert';

    out.userListButton = "Benutzerliste";

    out.chatButton = "Chat";

    out.userAccountButton = "Dein Konto";

    out.newButton = 'Neu';
    out.newButtonTitle = 'Neues Pad erstellen';
    out.uploadButton = 'Hochladen';
    out.uploadButtonTitle = 'Eine neue Datei in den aktuellen Ordner hochladen';

    out.saveTemplateButton = "Als Vorlage speichern";
    out.saveTemplatePrompt = "Bitte gib einen Titel für die Vorlage ein";
    out.templateSaved = "Vorlage gespeichert!";
    out.selectTemplate = "Bitte wähle eine Vorlage oder drücke Esc";
    out.useTemplate = "Mit einer Vorlage starten?"; //Would you like to "You have available templates for this type of pad. Do you want to use one?";
    out.useTemplateOK = 'Wähle eine Vorlage (Enter)';
    out.useTemplateCancel = 'Neu starten (Esc)';
    out.template_import = "Eine Vorlage importieren";
    out.template_empty = "Keine Vorlagen verfügbar";

    out.previewButtonTitle = "Die Markdown-Vorschau anzeigen oder verbergen";

    out.presentButtonTitle = "Zum Präsentationsmodus wechseln";

    out.backgroundButtonTitle = 'Hintergrundfarbe der Präsentation ändern';
    out.colorButtonTitle = 'Textfarbe des Präsentationsmodus bearbeiten';

    out.propertiesButton = "Eigenschaften";
    out.propertiesButtonTitle = 'Die Eigenschaften des Pads ansehen';

    out.printText = "Drucken";
    out.printButton = "Drucken (Enter)";
    out.printButtonTitle2 = "Dein Pad ausdrucken oder als PDF-Datei exportieren";
    out.printOptions = "Layouteinstellungen";
    out.printSlideNumber = "Foliennummer anzeigen";
    out.printDate = "Datum anzeigen";
    out.printTitle = "Titel der Präsentation anzeigen";
    out.printCSS = "Benutzerdefinierte Stil-Regeln (CSS):";
    out.printTransition = "Animierte Übergänge aktivieren";
    out.printBackground = "Ein Hintergrundbild verwenden";
    out.printBackgroundButton = "Bitte ein Bild wählen";
    out.printBackgroundValue = "<b>Aktueller Hintergrund:</b> <em>{0}</em>";
    out.printBackgroundNoValue = "<em>Kein Hintergrundbild gewählt</em>";
    out.printBackgroundRemove = "Das Hintergrundbild entfernen";

    out.filePickerButton = "Eine Datei aus deinem CryptDrive einbetten";
    out.filePicker_close = "Schließen";
    out.filePicker_description = "Bitte wähle eine Datei aus deinem CryptDrive oder lade eine neue hoch";
    out.filePicker_filter = "Dateien nach Namen filtern";
    out.or = 'oder';

    out.tags_title = "Tags (nur für dich)";
    out.tags_add = "Die Tags dieser Seite bearbeiten";
    out.tags_searchHint = "Dateien anhand ihrer Tags in deinem CryptDrive suchen";
    out.tags_searchHint = "Beginne die Suche in deinem CryptDrive mit #, um getaggte Dokumente zu finden.";
    out.tags_notShared = "Deine Tags werden nicht mit anderen Benutzern geteilt";
    out.tags_duplicate = "Doppeltes Tag: {0}";
    out.tags_noentry = "Du kannst keine Tags zu einem gelöschten Pad hinzufügen!";

    out.slideOptionsText = "Einstellungen";
    out.slideOptionsTitle = "Deine Folien anpassen";
    out.slideOptionsButton = "Speichern (Enter)";
    out.slide_invalidLess = "Benutzerdefinierter Stil ist ungültig";

    out.languageButton = "Sprache";
    out.languageButtonTitle = "Wähle die Sprache für die Syntaxhervorhebung";
    out.themeButton = "Farbschema";
    out.themeButtonTitle = "Wähle das Farbschema für den Code- und Folieneditor";

    out.editShare = "Link zum Bearbeiten teilen";
    out.editShareTitle = "Link zum Bearbeiten in die Zwischenablage kopieren";
    out.editOpen = "Den Link zum Bearbeiten in einem neuen Tab öffnen";
    out.editOpenTitle = "Öffne dieses Pad zum Bearbeiten in einem neuen Tab";
    out.viewShare = "Link zum schreibgeschützten Pad teilen";
    out.viewShareTitle = "Link zum schreibgeschützten Pad in die Zwischenablage kopieren";
    out.viewOpen = "In neuem Tab anzeigen";
    out.viewOpenTitle = "Pad schreibgeschützt in neuem Tab öffnen";
    out.fileShare = "Link kopieren";
    out.getEmbedCode = "Einbettungscode anzeigen";
    out.viewEmbedTitle = "Das Pad in eine externe Webseite einbetten";
    out.viewEmbedTag = "Um dieses Pad einzubetten, platziere diesen iframe an der gewünschten Stelle deiner HTML-Seite. Du kannst es mit CSS oder HTML-Attributen gestalten.";
    out.fileEmbedTitle = "Die Datei in einer externen Seite einbetten";
    out.fileEmbedScript = "Um diese Datei einzubetten, füge dieses Skript einmal in deiner Webseite ein, damit das Media-Tag geladen wird:";
    out.fileEmbedTag = "Dann platziere das Media-Tag an der gewünschten Stelle der Seite:";

    out.notifyJoined = "{0} ist in der Mitarbeitssitzung ";
    out.notifyRenamed = "{0} ist jetzt als {1} bekannt";
    out.notifyLeft = "{0} hat die Mitarbeitssitzung verlassen";

    out.ok = 'OK';
    out.okButton = 'OK (Enter)';

    out.cancel = "Abbrechen";
    out.cancelButton = 'Abbrechen (Esc)';
    out.doNotAskAgain = "Nicht mehr fragen (Esc)";

    out.show_help_button = "Hilfe anzeigen";
    out.hide_help_button = "Hilfe verbergen";
    out.help_button = "Hilfe";

    out.historyText = "Verlauf";
    out.historyButton = "Den Dokumentverlauf anzeigen";
    out.history_next = "Neuere Version";
    out.history_prev = "Ältere Version";
    out.history_loadMore = "Weiteren Verlauf laden";
    out.history_closeTitle = "Verlauf schließen";
    out.history_restoreTitle = "Die gewählte Version des Dokuments wiederherstellen";
    out.history_restorePrompt = "Bist du sicher, dass du die aktuelle Version des Dokuments mit der angezeigten Version ersetzen möchtest?";
    out.history_restoreDone = "Version wiederhergestellt";
    out.history_version = "Version:";

    // Ckeditor
    out.openLinkInNewTab = "Link im neuen Tab öffnen";
    out.pad_mediatagTitle = "Einstellungen für Media-Tag";
    out.pad_mediatagWidth = "Breite (px)";
    out.pad_mediatagHeight = "Höhe (px)";
    out.pad_mediatagRatio = "Seitenverhältnis beibehalten";
    out.pad_mediatagBorder = "Rahmenbreite (px)";
    out.pad_mediatagPreview = "Vorschau";
    out.pad_mediatagImport = 'In deinem CryptDrive speichern';
    out.pad_mediatagOptions = 'Bildeigenschaften';

    // Kanban
    out.kanban_newBoard = "Neues Board";
    out.kanban_item = "Eintrag {0}"; // Item number for initial content
    out.kanban_todo = "Zu erledigen";
    out.kanban_done = "Erledigt";
    out.kanban_working = "In Bearbeitung";
    out.kanban_deleteBoard = "Bist du sicher, dass du dieses Board löschen möchtest?";
    out.kanban_addBoard = "Ein Board hinzufügen";
    out.kanban_removeItem = "Diesen Eintrag entfernen";
    out.kanban_removeItemConfirm = "Bist du sicher, dass du diesen Eintrag löschen möchtest?";   

    // Polls

    out.poll_title = "Terminplaner ohne Preisgabe von Daten";
    out.poll_subtitle = "Planung <em>in Echtzeit</em> ohne Preisgabe von Daten";

    out.poll_p_save = "Deine Einstellungen werden sofort aktualisiert. Du musst sie also nicht speichern.";
    out.poll_p_encryption = "Alle Eingaben sind verschlüsselt, deshalb können nur Leute darauf zugreifen, die den Link kennen. Selbst der Server sieht nicht, was du änderst.";

    out.wizardLog = "Klicke auf die Schaltfläche links oben, um zu deiner Umfrage zurückzukehren.";
    out.wizardTitle = "Nutze den Assistenten, um deine Umfrage zu erstellen.";
    out.wizardConfirm = "Bist du wirklich bereit, die angegebenen Optionen zu deiner Umfrage hinzuzufügen?";

    out.poll_publish_button = "Veröffentlichen";
    out.poll_admin_button = "Admin";
    out.poll_create_user = "Neuen Benutzer hinzufügen";
    out.poll_create_option = "Neue Option hinzufügen";
    out.poll_commit = "Einchecken";

    out.poll_closeWizardButton = "Assistenten schließen";
    out.poll_closeWizardButtonTitle = "Assistenten schließen";
    out.poll_wizardComputeButton = "Optionen übernehmen";
    out.poll_wizardClearButton = "Tabelle leeren";
    out.poll_wizardDescription = "Erstelle die Optionen automatisch, indem du eine beliebige Anzahl von Daten und Zeiten eingibst.";
    out.poll_wizardAddDateButton = "+ Daten";
    out.poll_wizardAddTimeButton = "+ Zeiten";

    out.poll_optionPlaceholder = "Option";
    out.poll_userPlaceholder = "Dein Name";
    out.poll_removeOption = "Bist du sicher, dass du diese Option entfernen möchtest?";
    out.poll_removeUser = "Bist du sicher, dass du diesen Nutzer entfernen möchtest?";

    out.poll_titleHint = "Titel";
    out.poll_descriptionHint = "Beschreibe deine Abstimmung und publiziere sie mit der Schaltfläche ✓ (Veröffentlichen), wenn du fertig bist."+
                               " Bei der Beschreibung kann Markdown-Syntax verwendet werden und du kannst Medien-Elemente von deinem CryptDrive einbetten." +
                               " Jeder, der den Link kennt, kann die Beschreibung ändern. Dies wird aber nicht empfohlen.";

    out.poll_remove = "Entfernen";
    out.poll_edit = "Bearbeiten";
    out.poll_locked = "Gesperrt";
    out.poll_unlocked = "Editierbar";

    out.poll_bookmark_col = 'Setze ein Lesezeichen auf diese Spalte, damit sie immer editierbar und ganz links angezeigt wird.';
    out.poll_bookmarked_col = 'Dies ist die Spalte mit deinem Lesezeichen. Sie wird immer editierbar und ganz links angezeigt.';
    out.poll_total = 'SUMME';

    out.poll_comment_list = "Kommentare";
    out.poll_comment_add = "Einen Kommentar hinzufügen";
    out.poll_comment_submit = "Senden";
    out.poll_comment_remove = "Diesen Kommentar entfernen";
    out.poll_comment_placeholder = "Dein Kommentar";

    out.poll_comment_disabled = "Diese Umfrage mit der Schaltfläche ✓ veröffentlichen, damit Kommentare möglich sind.";

    // OnlyOffice
    out.oo_reconnect = "Die Serververbindung wurde wiederhergestellt. Klicke auf OK, um neu zu laden und die Bearbeitung fortzusetzen.";

    // Canvas
    out.canvas_clear = "Löschen";
    out.canvas_delete = "Auswahl entfernen";
    out.canvas_disable = "Zeichnung deaktivieren";
    out.canvas_enable = "Zeichnung aktivieren";
    out.canvas_width = "Breite";
    out.canvas_opacity = "Deckkraft";
    out.canvas_opacityLabel = "Deckkraft: {0}";
    out.canvas_widthLabel = "Breite: {0}";
    out.canvas_saveToDrive = "Dieses Bild in deinem CryptDrive speichern";
    out.canvas_currentBrush = "Aktueller Pinsel";
    out.canvas_chooseColor = "Eine Farbe wählen";
    out.canvas_imageEmbed = "Ein Bild von deinem Computer einbetten";

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
    out.profile_inviteButtonTitle ='Einen Link erstellen, mit dem du diesen Benutzer einladen kannst, sich mit dir in Verbindung zu setzen.';
    out.profile_inviteExplanation = "Ein Klick auf <strong>OK</strong> wird einen Link erstellen, der eine sichere Chatsitzung <em>nur mit {0}</em> erlaubt.<br></br>Dieser Link kann öffentlich geteilt werden.";
    out.profile_viewMyProfile = "Mein Profil anzeigen";

    // contacts/userlist
    out.userlist_addAsFriendTitle = 'Benutzer "{0}" als Kontakt hinzufügen';
    out.userlist_thisIsYou = 'Das bist du ("{0}")';
    out.userlist_pending = "Warte...";
    out.contacts_title = "Kontakte";
    out.contacts_addError = 'Fehler bei dem Hinzufügen des Kontakts zur Liste';
    out.contacts_added = 'Verbindungseinladung angenommen.';
    out.contacts_rejected = 'Verbindungseinladung abgelehnt';
    out.contacts_request = 'Benutzer <em>{0}</em> möchte dich als Kontakt hinzufügen. <b>Annehmen<b>?';
    out.contacts_send = 'Senden';
    out.contacts_remove = 'Diesen Kontakt entfernen';
    out.contacts_confirmRemove = 'Bist du sicher, dass du <em>{0}</em> von der Kontaktliste entfernen möchtest?';
    out.contacts_typeHere = "Gib eine Nachricht ein...";
    out.contacts_warning = "Alles, was du hier eingibst, wird dauerhaft gespeichert und für alle aktuellen und zukünftigen Benutzer dieses Pads sichtbar sein. Sei sorgfältig mit sensiblen Informationen!";
    out.contacts_padTitle = "Chat";

    out.contacts_info1 = "Dies sind deine Kontakte. Hier kannst du:";
    out.contacts_info2 = "Auf den Avatar eines Kontakts klicken, um mit diesem Benutzer zu chatten";
    out.contacts_info3 = "Auf den Avatar doppelklicken, um das entsprechende Profil anzuzeigen";
    out.contacts_info4 = "Jeder Teilnehmer kann den Chatverlauf endgültig löschen";

    out.contacts_removeHistoryTitle = 'Den Chatverlauf löschen';
    out.contacts_confirmRemoveHistory = 'Bist du sicher, dass du den Chatverlauf endgültig löschen willst? Die Daten sind dann weg.';
    out.contacts_removeHistoryServerError = 'Es gab einen Fehler bei dem Löschen des Chatverlaufs. Versuche es später noch einmal';
    out.contacts_fetchHistory = "Den früheren Verlauf laden";

    out.contacts_friends = "Kontakte";
    out.contacts_rooms = "Chaträume";
    out.contacts_leaveRoom = "Diesen Chatraum verlassen";
    out.contacts_online = "Ein anderer Benutzer dieses Raumes ist online";

    // File manager

    out.fm_rootName = "Dokumente";
    out.fm_trashName = "Papierkorb";
    out.fm_unsortedName = "Unsortierte Dateien";
    out.fm_filesDataName = "Alle Dateien";
    out.fm_templateName = "Vorlagen";
    out.fm_searchName = "Suchen";
    out.fm_recentPadsName = "Zuletzt geöffnete Pads";
    out.fm_ownedPadsName = "Eigene";
    out.fm_tagsName = "Tags"; 
    out.fm_sharedFolderName = "Geteilter Ordner";
    out.fm_searchPlaceholder = "Suchen...";
    out.fm_newButton = "Neu";
    out.fm_newButtonTitle = "Ein neues Pad oder Ordner erstellen, oder eine Datei in den aktuellen Ordner importieren";
    out.fm_newFolder = "Neuer Ordner";
    out.fm_newFile = "Neues Pad";
    out.fm_folder = "Ordner";
    out.fm_sharedFolder = "Geteilter Ordner";
    out.fm_folderName = "Ordnername";
    out.fm_numberOfFolders = "# Ordner";
    out.fm_numberOfFiles = "# Dateien";
    out.fm_fileName = "Dateiname";
    out.fm_title = "Titel";
    out.fm_type = "Typ";
    out.fm_lastAccess = "Letzter Zugriff";
    out.fm_creation = "Erstellung";
    out.fm_forbidden = "Verbotene Aktion";
    out.fm_originalPath = "Ursprünglicher Pfad";
    out.fm_openParent = "Im Ordner zeigen";
    out.fm_noname = "Dokument ohne Titel";
    out.fm_emptyTrashDialog = "Soll der Papierkorb wirklich geleert werden?";
    out.fm_removeSeveralPermanentlyDialog = "Bist du sicher, dass du diese {0} Elemente endgültig aus deinem CryptDrive entfernen möchtest?";
    out.fm_removePermanentlyNote = "Wenn du fortfährst, werden deine eigenen Pads vom Server entfernt.";
    out.fm_removePermanentlyDialog = "Bist du sicher, dass du dieses Element endgültig aus deinem CryptDrive entfernen möchtest?";
    out.fm_removeSeveralDialog = "Bist du sicher, dass du diese {0} Elemente in den Papierkorb verschieben möchtest?";
    out.fm_removeDialog = "Bist du sicher, dass du {0} in den Papierkorb verschieben möchtest?";
    out.fm_deleteOwnedPad = "Bist du sicher, dass du dieses Pad endgültig vom Server löschen möchtest?";
    out.fm_deleteOwnedPads = "Bist du sicher, dass du diese Pads endgültig vom Server entfernen möchtest?";
    out.fm_restoreDialog = "Bist du sicher, dass du {0} zurück in den ursprünglichen Ordner verschieben möchtest?";
    out.fm_unknownFolderError = "Der Ordner, der gerade gewählt oder zuletzt besucht wurde, existiert nicht mehr. Der übergeordnete Ordner wird geöffnet...";
    out.fm_contextMenuError = "Fehler beim Öffnen des Kontextmenü für dieses Element. Wenn dieses Problem wieder auftritt, versuche die Seite neu zu laden.";
    out.fm_selectError = "Fehler bei der Auswahl des gewünschten Elements. Wenn dieses Problem wieder auftritt, versuche die Seite neu zu laden.";
    out.fm_categoryError = "Fehler beim Öffnen der gewählten Kategorie. Der Stamm-Ordner wird angezeigt.";
    out.fm_info_root = "Erstelle hier so viele Ordner, wie du willst, um deine Dateien und Dokumente zu organisieren.";
    out.fm_info_unsorted = 'Hier sind alle besuchte Dateien enthalten, die noch nicht in "Dokumente" einsortiert oder in den Papierkorb verschoben wurden.';
    out.fm_info_template = 'Hier sind alle Dokumente enthalten, die als Vorlage gespeichert wurden und die du wiederverwenden kannst, um ein neues Pad zu erstellen.';
    out.fm_info_recent = "Hier werden die zuletzt geöffneten Dokumente aufgelistet.";
    out.updated_0_fm_info_trash = 'Leere den Papierkorb, um mehr freien Platz in deinem CryptDrive zu erhalten.';
    out.fm_info_trash = out.updated_0_fm_info_trash;
    out.fm_info_allFiles = 'Beinhaltet alle Dateien von "Dokumente", "Unsortierte Dateien" und "Papierkorb". Dateien können hier nicht verschoben oder entfernt werden.';
    out.fm_info_anonymous = 'Du bist nicht eingeloggt, daher laufen die Pads nach 3 Monaten aus (<a href="https://blog.cryptpad.fr/2017/05/17/You-gotta-log-in/" target="_blank">mehr dazu lesen</a>). ' +
                            'Der Zugang zu den Pads ist in deinem Browser gespeichert, daher wird das Löschen des Browserverlaufs sie möglicherweise verschwinden lassen.<br>' +
                            '<a href="/register/">Registriere dich</a> oder <a href="/login/">logge dich ein</a>, um sie dauerhaft zugänglich zu machen.<br>';
    out.fm_info_sharedFolder = 'Dieser Ordner ist geteilt. Da du aber nicht eingeloggt bist, hast du nur einen schreibgeschützen Zugriff.<br>' +
                            '<a href="/register/">Registriere</a> oder <a href="/login/">logge ich ein</a>, damit du diesen Ordner in dein CryptDrive importieren und bearbeiten kannst.';
    out.fm_info_owned = "Diese Pads sind deine eigenen. Das heißt, dass du sie jederzeit vom Server entfernen kannst. Wenn du das machst, dann sind sie auch für andere Nutzer nicht mehr zugänglich.";
    out.fm_alert_backupUrl = "Backup-Link für dieses CryptDrive.<br>" +
                             "Es wird <strong>dringend empfohlen</strong>, diesen Link geheim zu halten.<br>" +
                             "Du kannst ihn benutzen, um deine gesamten Dateien abzurufen, wenn dein Browserspeicher gelöscht wurde.<br>" +
                             "Jede Person, die diesen Link hat, kann die Dateien in deinem CryptDrive bearbeiten oder löschen.<br>";
    out.fm_alert_anonymous = "Hallo, du benutzt CryptPad anonym. Das ist in Ordnung, aber Dokumente können nach einer längerer Inaktivität gelöscht werden. " +
                             "Wir haben fortgeschrittene Funktionen in anonymen CryptDrives deaktiviert, weil wir deutlich machen wollen, dass es kein sicherer Platz zur Ablage von Daten ist." + 
                             'Du kannst <a href="https://blog.cryptpad.fr/2017/05/17/You-gotta-log-in/" target="_blank">lesen</a>, weshalb wir das machen und weshalb du dich wirklich ' +
                             '<a href="/register/">registrieren</a> oder <a href="/login/">einloggen</a> solltest.';
    out.fm_backup_title = 'Backup-Link';
    out.fm_nameFile = 'Wie soll diese Datei heißen?';
    out.fm_error_cantPin = "Interner Serverfehler. Bitte lade die Seite neu und versuche es erneut.";
    out.fm_viewListButton = "Listenansicht";
    out.fm_viewGridButton = "Kachelansicht";
    out.fm_renamedPad = "Du hast einen benutzerdefinierten Name für dieses Pad gesetzt. Seine geteilter Titel ist:<br><b>{0}</b>";
    out.fm_canBeShared = "Dieser Ordner kann geteilt werden";
    out.fm_prop_tagsList = "Tags";
    out.fm_burnThisDriveButton = "Alle Informationen löschen, die CryptPad in deinem Browser speichert";
    out.fm_burnThisDrive = "Bist du sicher, dass du alles, was CryptPad in deinem Browser gespeichert hat, löschen möchtest?<br>" +
                           "Das wird dein CryptDrive und seinen Verlauf in deinem Browser löschen, Pads werden weiterhin (verschlüsselt) auf unserem Server bleiben.";
    out.fm_padIsOwned = "Du bist der Eigentümer dieses Pads";
    out.fm_padIsOwnedOther = "Dieses Pad gehört einem anderen Benutzer";
    out.fm_deletedPads = "Dieses Dokument existiert nicht mehr auf dem Server, es wurde von deinem CryptDrive gelöscht: {0}";
    out.fm_tags_name = "Name des Tags";
    out.fm_tags_used = "Anzahl der Dokumente";
    out.fm_restoreDrive = "Dein CryptDrive wird in einen früheren Zustand zurückversetzt. Damit es funktioniert, solltest du keine Änderungen während dieses Vorgangs machen.";
    out.fm_moveNestedSF = "Du kannst keinen geteilten Ordner in einem anderen geteilten Ordner platzieren. Der Ordner {0} wurde nicht verschoben.";
    
    // File - Context menu
    out.fc_newfolder = "Neuer Ordner";
    out.fc_newsharedfolder = "Neuer geteilter Ordner";
    out.fc_rename = "Umbenennen";
    out.fc_open = "Öffnen";
    out.fc_open_ro = "Öffnen (schreibgeschützt)";
    out.fc_delete = "In den Papierkorb verschieben";
    out.fc_delete_owned = "Vom Server löschen";
    out.fc_restore = "Wiederherstellen";
    out.fc_remove = "Aus deinem CryptDrive entfernen";
    out.fc_remove_sharedfolder = "Entfernen";
    out.fc_empty = "Den Papierkorb leeren";
    out.fc_prop = "Eigenschaften";
    out.fc_hashtag = "Tags";
    out.fc_sizeInKilobytes = "Größe in Kilobyte";
    // fileObject.js (logs)
    out.fo_moveUnsortedError = "Du kannst einen Ordner nicht in die Liste der Vorlagen verschieben";
    out.fo_existingNameError = "Der Name wird in diesem Ordner bereits verwendet. Bitte wähle einen anderen Namen.";
    out.fo_moveFolderToChildError = "Du kannst einen Ordner nicht in einen seiner Unterordner verschieben";
    out.fo_unableToRestore = "Die Datei konnte nicht an ihrem ursprünglichen Ort wiederhergestellt werden. Du kannst versuchen, sie an einen anderen Ort zu verschieben.";
    out.fo_unavailableName = "Eine Datei oder ein Ordner mit diesem Namen existiert bereits in diesem Ordner. Bitte benenne das Element zuerst um und versuche es dann erneut.";

    out.fs_migration = "Dein CryptDrive wird gerade zu einer neueren Version aktualisiert. Daher muss die Seite neu geladen werden.<br><strong>Bitte lade die Seite neu, um sie weiter zu verwenden.</strong>";

    // login
    out.login_login = "Einloggen";
    out.login_makeAPad = 'Ein Pad anonym erstellen';
    out.login_nologin = "Lokale Dokumente ansehen";
    out.login_register = "Registrieren";
    out.logoutButton = "Ausloggen";
    out.settingsButton = "Einstellungen";

    out.login_username = "Benutzername";
    out.login_password = "Passwort";
    out.login_confirm = "Passwort bestätigen";
    out.login_remember = "Eingeloggt bleiben";

    out.login_hashing = "Dein Passwort wird gerade durchgerechnet, das kann etwas dauern.";

    out.login_hello = 'Hallo {0},'; // {0} is the username
    out.login_helloNoName = 'Hallo,';
    out.login_accessDrive = 'Dein CryptDrive ansehen';
    out.login_orNoLogin = 'oder';

    out.login_noSuchUser = 'Ungültiger Benutzername oder Passwort. Versuche es erneut oder registriere dich';
    out.login_invalUser = 'Der Benutzername kann nicht leer sein';
    out.login_invalPass = 'Der Passwort kann nicht leer sein';
    out.login_unhandledError = 'Ein unerwarteter Fehler ist aufgetreten :(';

    out.register_importRecent = "Die Pads aus deiner anonymen Sitzung importieren";
    out.register_acceptTerms = "Ich bin mit den <a href='/terms.html' tabindex='-1'>Nutzungsbedingungen</a> einverstanden";
    out.register_passwordsDontMatch = "Passwörter stimmen nicht überein!";
    out.register_passwordTooShort = "Passwörter müssen mindestens {0} Zeichen haben.";

    out.register_mustAcceptTerms = "Du musst mit den Nutzungsbedingungen einverstanden sein.";
    out.register_mustRememberPass = "Wir können dein Passwort nicht zurücksetzen, falls du es vergisst. Es ist sehr wichtig, dass du es dir merkst! Bitte markiere das Kästchen, um dies zu bestätigen.";

    out.register_whyRegister = "Wieso solltest du dich registrieren?";
    out.register_header = "Willkommen zu CryptPad";
    out.register_explanation = [
        "<h3>Lass uns ein paar Punkte überprüfen:</h3>",
        "<ul class='list-unstyled'>",
            "<li><i class='fa fa-info-circle'> </i> Dein Passwort ist dein Geheimnis, um alle deine Dokumente zu verschlüsseln. Wenn du es verlierst, können deine Daten nicht wiederhergestellt werden.</li>",
            "<li><i class='fa fa-info-circle'> </i> Du kannst die Pads, die du zuletzt angesehen hast, importieren. Sie sind dann in deinem CryptDrive.</li>",
            "<li><i class='fa fa-info-circle'> </i> Wenn du den Rechner mit anderen teilst, musst du dich ausloggen, wenn du fertig bist. Es ist nicht ausreichend, das Browserfenster oder den Browser zu schließen.</li>",
        "</ul>"
    ].join('');

    out.register_writtenPassword = "Ich habe meinen Benutzername und mein Passwort notiert. Weiter geht's.";
    out.register_cancel = "Zurück";

    out.register_warning = "\"Ohne Preisgabe von Daten\" bedeutet, dass niemand deine Daten wiederherstellen kann, wenn du dein Passwort verlierst.";

    out.register_alreadyRegistered = "Dieser Benutzer existiert bereits, möchtest du dich einloggen?";

    // Settings
    out.settings_cat_account = "Konto";
    out.settings_cat_drive = "CryptDrive";
    out.settings_cat_cursor = "Cursor";
    out.settings_cat_code = "Code";
    out.settings_cat_pad = "Rich Text";
    out.settings_cat_creation = "Neues Pad";
    out.settings_cat_subscription = "Abonnement";
    out.settings_title = "Einstellungen";
    out.settings_save = "Speichern";

    out.settings_backupCategory = "Backup";
    out.settings_backupHint = "Erstelle ein Backup deiner Daten im CryptDrive oder stelle die Daten wieder her. Es wird nicht den Inhalt der Pads beinhalten, sondern nur die Schlüssel für den Zugriff.";
    out.settings_backup = "Backup";
    out.settings_restore = "Wiederherstellen";

    out.settings_backupHint2 = "Lade den Inhalt aller Pads herunter. Die Pads werden in einem lesbaren Format heruntergeladen, wenn dies möglich ist.";
    out.settings_backup2 = "Mein CryptDrive herunterladen";
    out.settings_backup2Confirm = "Dies wird alle Pads und Dateien von deinem CryptDrive herunterladen. Wenn du fortfahren möchtest, wähle einen Namen und klicke auf OK.";
    out.settings_exportTitle = "Dein CryptDrive exportieren";
    out.settings_exportDescription = "Bitte warte, während wir deine Dokumente herunterladen und entschlüsseln. Dies kann ein paar Minuten dauern. Wenn das Browserfenster geschlossen wird, wird der Vorgang unterbrochen.";
    out.settings_exportFailed = "Wenn der Download eines Pads länger als 1 Minute dauert, wird dieses Pad nicht im Export enthalten sein. Für jedes nicht exportierte Pad wird der entsprechende Link angezeigt.";
    out.settings_exportWarning = "Um eine erhöhte Leistung zu erhalten, empfehlen wir dieses Browserfenster im Vordergrund zu halten.";
    out.settings_exportCancel = "Bist du sicher, dass du den Exportvorgang abbrechen möchtest? Der Vorgang muss das nächste Mal wieder von vorn beginnen.";
    out.settings_export_reading = "Dein CryptDrive wird gelesen...";
    out.settings_export_download = "Deine Dokumente werden heruntergeladen und entschlüsselt...";
    out.settings_export_compressing = "Daten werden komprimiert...";
    out.settings_export_done = "Der Export ist bereit!";
    out.settings_exportError = "Fehlermeldungen ansehen";
    out.settings_exportErrorDescription = "Wir waren nicht in der Lage, die folgende Dokumente zu exportieren:";
    out.settings_exportErrorEmpty = "Dieses Dokument kann nicht exportiert werden (leerer oder ungültiger Inhalt).";
    out.settings_exportErrorMissing = "Dieses Dokument fehlt auf dem Server (es ist ausgelaufen oder von seinem Eigentümer gelöscht worden)";
    out.settings_exportErrorOther = "Es ist ein Fehler beim Export des folgenden Dokuments aufgetreten: {0}";
       
    out.settings_resetNewTitle = "CryptDrive säubern";
    out.settings_resetButton = "Löschen";
    out.settings_reset = "Alle Dateien und Ordnern aus deinem CryptDrive löschen";
    out.settings_resetPrompt = "Diese Aktion wird alle Dokumente deines CryptDrives entfernen.<br>"+
                               "Bist du sicher, dass du das tun möchtest?<br>" +
                               "Gib <em>I love CryptPad</em> ein, um zu bestätigen."; // TODO: I love CryptPad should be localized
    out.settings_resetDone = "Dein CryptDrive ist jetzt leer!";
    out.settings_resetError = "Prüftext ist nicht korrekt. Dein CryptDrive wurde nicht verändert.";

    out.settings_resetTipsAction = "Zurücksetzen";
    out.settings_resetTips = "Tipps";
    out.settings_resetTipsButton = "Die Tipps für CryptDrive zurücksetzen";
    out.settings_resetTipsDone = "Alle Tipps sind wieder sichtbar.";

    out.settings_thumbnails = "Vorschaubilder";
    out.settings_disableThumbnailsAction = "Die Erstellung von Vorschaubildern in deinem CryptDrive deaktivieren";
    out.settings_disableThumbnailsDescription = "Vorschaubilder werden automatisch erstellt und in deinem Browser gespeichert, wenn du ein Pad besuchst. Du kannst diese Funktion hier deaktivieren.";
    out.settings_resetThumbnailsAction = "Entfernen";
    out.settings_resetThumbnailsDescription = "Alle Vorschaubilder entfernen, die in deinem Browser gespeichert sind.";
    out.settings_resetThumbnailsDone = "Alle Vorschaubilder wurden entfernt.";

    out.settings_importTitle = "Importiere die kürzlich besuchten Dokumente in dein CryptDrive";
    out.settings_import = "Importieren";
    out.settings_importConfirm = "Bist du sicher, dass du die kürzlich besuchten Pads in das CryptDrive deines Kontos importieren möchtest??";
    out.settings_importDone = "Import abgeschlossen";

    out.settings_autostoreTitle = "Speichern von Pads im CryptDrive";
    out.settings_autostoreHint = "<b>Automatisch:</b> Alle Pads werden in deinem CryptDrive gespeichert.<br>" +
                                 "<b>Manuell (immer nachfragen):</b> Wenn du ein Pad noch nicht gespeichert hast, wirst du gefragt, ob du es im CryptDrive speichern willst.<br>" +
                                 "<b>Manuell (nie nachfragen):</b> Pads werden nicht automatisch im CryptDrive gespeichert. Die Option zum Speichern wird versteckt.<br>";
    out.settings_autostoreYes = "Automatisch";
    out.settings_autostoreNo = "Manuell (nie nachfragen)";
    out.settings_autostoreMaybe = "Manuell (immer nachfragen)";

    out.settings_userFeedbackTitle = "Rückmeldung";
    out.settings_userFeedbackHint1 = "CryptPad sendet grundlegende Rückmeldungen zum Server, um die Benutzererfahrung verbessern zu können.";
    out.settings_userFeedbackHint2 = "Der Inhalt deiner Pads wird nie mit dem Server geteilt.";
    out.settings_userFeedback = "Rückmeldungen aktivieren";

    out.settings_deleteTitle = "Löschung des Kontos";
    out.settings_deleteHint = "Die Löschung eines Kontos ist endgültig. Dein CryptDrive und die Liste deiner Pads werden vom Server gelöscht. Deine restlichen Pads werden nach 90 Tage gelöscht, wenn niemand anderes sie in seinem CryptDrive gespeichert hat.";
    out.settings_deleteButton = "Dein Konto löschen";
    out.settings_deleteModal = "Gib die folgenden Informationen an deinen CryptPad-Administrator weiter, damit er die Daten vom Server löschen kann.";
    out.settings_deleteConfirm = "Wenn du auf OK klickst, wird dein Konto dauerhaft gelöscht. Bist du sicher?";
    out.settings_deleted = "Dein Konto ist jetzt gelöscht. Klicke auf OK, um zur Hauptseite zu gelangen.";

    out.settings_anonymous = "Du bist nicht eingeloggt. Die Einstellungen hier gelten nur für diesen Browser.";
    out.settings_publicSigningKey = "Öffentlicher Schlüssel zum Unterschreiben";

    out.settings_usage = "Verbrauch";
    out.settings_usageTitle = "Die Gesamtgröße deiner Pads in MB"; // TODO: pinned ??
    out.settings_pinningNotAvailable = "Gepinnte Pads sind nur für angemeldete Benutzer verfügbar.";
    out.settings_pinningError = "Etwas ging schief";
    out.settings_usageAmount = "Deine gepinnten Pads belegen {0} MB";

    out.settings_logoutEverywhereButton = "Ausloggen";
    out.settings_logoutEverywhereTitle = "Überall ausloggen";
    out.settings_logoutEverywhere = "Das Ausloggen in allen andere Websitzungen erzwingen";
    out.settings_logoutEverywhereConfirm = "Bist du sicher? Du wirst dich auf allen deinen Geräten wieder einloggen müssen.";

    out.settings_driveDuplicateTitle = "Duplizierte eigene Pads";
    out.settings_driveDuplicateHint = "Wenn du ein eigenes Pad in einem geteilten Ordner verschiebst, wird eine Kopie in deinem CryptDrive behalten, damit du die Kontrolle des Dokuments nicht verlierst. Du kannst duplizierte Dateien verbergen. Nur die Version in dem geteilten Ordner wird dann angezeigt, außer sie wurde gelöscht. In diesem Fall, wird sie wieder angezeigt.";
    out.settings_driveDuplicateLabel = "Duplizierte Pads verbergen";

    out.settings_codeIndentation = 'Einrückung im Code-Editor (Leerzeichen)';
    out.settings_codeUseTabs = "Mit Tabs einrücken (anstatt mit Leerzeichen)";
    out.settings_codeFontSize = "Schriftgröße im Code-Editor";

    out.settings_padWidth = "Maximalgröße des Editors";
    out.settings_padWidthHint = "Rich-Text-Pads benutzen normalerweise die größte verfügbare Zeilenbreite, das kann manchmal schwer lesbar sein. Du kannst die Breite des Editors hier reduzieren.";
    out.settings_padWidthLabel = "Die Breite des Editors reduzieren";
    out.settings_padSpellcheckTitle = "Rechtschreibprüfung";
    out.settings_padSpellcheckHint = "Mit dieser Option kann die Rechtschreibprüfung in Rich-Text-Pads aktiviert werden. Rechtschreibfehler werden rot unterstrichen. Halte die Strg- oder Meta-Taste gedrückt, um Verbesserungsvorschläge anzuzeigen.";
    out.settings_padSpellcheckLabel = "Rechtschreibprüfung in Rich-Text-Pads aktivieren";

    out.settings_creationSkip = "Dialog bei Erstellung neuer Pads überspringen";
    out.settings_creationSkipHint = "Dieser Dialog erlaubt Einstellungen für mehr Kontrolle und Sicherheit bei deinen Pads. Aber der zusätzliche Dialog verlangsamt die Arbeit. Mit dieser Option kannst du diesen Dialog überspringen und die Standard-Einstellungen wählen.";
    out.settings_creationSkipTrue = "Überspringen";
    out.settings_creationSkipFalse = "Anzeigen";

    out.settings_templateSkip = "Wahl der Vorlage überspringen";
    out.settings_templateSkipHint = "Wenn du ein neues Pad erstellst und passende Vorlagen vorhanden sind, erscheint ein Dialog zur Auswahl einer Vorlage. Hier kannst du diesen Dialog überspringen und somit keine Vorlage verwenden.";

    out.settings_ownDriveTitle = "Aktiviere die neuesten Funktionen für dein Konto";
    out.settings_ownDriveHint = "Aus technischen Gründen sind nicht alle neue Funktionen für ältere Konten verfügbar. Ein kostenloses Upgrade wird dein CryptDrive für zukünftige Funktionen vorbereiten, ohne deine Arbeit zu stören.";
    out.settings_ownDriveButton = "Upgrade deines Kontos";
    out.settings_ownDriveConfirm = "Das Upgrade deines Kontos kann einige Zeit dauern. Du wirst dich auf allen Geräten neu einloggen müssen. Bist du sicher?";
    out.settings_ownDrivePending = "Das Upgrade deines Kontos läuft. Bitte schließe die Seite nicht und lade sie nicht neu, bis dieser Vorgang abgeschlossen ist.";

    out.settings_changePasswordTitle = "Dein Passwort ändern";
    out.settings_changePasswordHint = "Ändere das Passwort deines Kontos, ohne deine Daten zu verlieren. Du musst einmal das aktuelle Passwort eingeben und dann das gewünschte neue Passwort zweimal.<br>" +
                                      "<b>Wir können das Passwort nicht zurücksetzen, wenn du es vergisst. Sei also besonders sorgfältig!</b>";
    out.settings_changePasswordButton = "Passwort ändern";
    out.settings_changePasswordCurrent = "Aktuelles Passwort";
    out.settings_changePasswordNew = "Neues Passwort";
    out.settings_changePasswordNewConfirm = "Neues Passwort bestätigen";
    out.settings_changePasswordConfirm = "Bist du sicher? Du wirst dich auf allen Geräten neu einloggen müssen.";
    out.settings_changePasswordError = "Ein Fehler ist aufgetreten. Wenn du dich nicht mehr einloggen oder dein Passwort ändern kannst, solltest du die Administratoren des CryptPad-Servers kontaktieren.";
    out.settings_changePasswordPending = "Dein Passwort wird geändert. Bitte schließe die Seite nicht und lade sie nicht neu, bis dieser Vorgang abgeschlossen ist.";
    out.settings_changePasswordNewPasswordSameAsOld = "Dein neues Passwort muss sich von deinem aktuellen Passwort unterscheiden.";
   
    out.settings_cursorColorTitle = "Cursorfarbe";
    out.settings_cursorColorHint = "Die Farbe deines Cursors in gemeinsam bearbeiteten Dokumente ändern.";
    out.settings_cursorShareTitle = "Meine Cursorposition teilen";
    out.settings_cursorShareHint = "Du kannst wählen, ob andere Benutzer deinen Cursor in gemeinsam bearbeiteten Dokumenten sehen können.";
    out.settings_cursorShareLabel = "Position teilen";
    out.settings_cursorShowTitle = "Position des Cursors von anderen Nutzern anzeigen";
    out.settings_cursorShowHint = "Du kannst wählen, ob die Cursor von anderen Nutzern in gemeinsam bearbeiteten Dokumenten sichtbar sind.";
    out.settings_cursorShowLabel = "Cursor anzeigen";

    out.upload_title = "Datei hochladen";
    out.upload_type = "Typ";
    out.upload_modal_title = "Uploadeinstellungen";
    out.upload_modal_filename = "Dateiname (die Dateierweiterung <em>{0}</em> wird automatisch hinzugefügt)";
    out.upload_modal_owner = "Eigene Datei";
    out.upload_serverError = "Serverfehler: Die Datei kann aktuell nicht hochgeladen werden.";
    out.upload_uploadPending = "Ein anderer Hochladevorgang läuft gerade. Möchtest du diesen abbrechen und deine neue Datei hochladen?";
    out.upload_success = "Deine Datei ({0}) wurde erfolgreich hochgeladen und zu deinem CryptDrive hinzugefügt.";
    out.upload_notEnoughSpace = "Der verfügbare Speicherplatz in deinem CryptDrive reicht leider nicht für diese Datei.";
    out.upload_notEnoughSpaceBrief = "Unzureichender Speicherplatz";
    out.upload_tooLarge = "Diese Datei ist zu groß, um hochgeladen zu werden.";
    out.upload_tooLargeBrief = 'Datei zu groß';
    out.upload_choose = "Eine Datei wählen";
    out.upload_pending = "In der Warteschlange";
    out.upload_cancelled = "Abgebrochen";
    out.upload_name = "Dateiname";
    out.upload_size = "Größe";
    out.upload_progress = "Fortschritt";
    out.upload_mustLogin = "Du muss eingeloggt sein, um Dateien hochzuladen";
    out.upload_up = "Hochladen";
    out.download_button = "Entschlüsseln und herunterladen";
    out.download_mt_button = "Herunterladen";
    out.download_resourceNotAvailable = "Diese Ressource war nicht verfügbar... Drücke Esc, um fortzufahren.";
    out.download_dl = "Herunterladen";
    out.download_step1 = "Laden...";
    out.download_step2 = "Entschlüsselung...";

    out.todo_title = "CryptTodo";
    out.todo_newTodoNamePlaceholder = "Die Aufgabe prüfen...";
    out.todo_newTodoNameTitle = "Diese Aufgabe zu deiner ToDo-Liste hinzufügen";
    out.todo_markAsCompleteTitle = "Diese Aufgabe als erledigt markieren";
    out.todo_markAsIncompleteTitle = "Diese Aufgabe als nicht erledigt markieren";
    out.todo_removeTaskTitle = "Diese Aufgabe aus deiner ToDo-Liste entfernen";

    // pad
    out.pad_showToolbar = "Werkzeugleiste anzeigen";
    out.pad_hideToolbar = "Werkzeugleiste verbergen";
    out.pad_base64 = "Dieses Pad enthält Bilder die nicht ressourcenschonend gespeichert sind. Sie werden die Größe des Pads im CryptDrive belasten und den Ladevorgang verlangsamen. Du kannst diese Bilder zum neuen Format migrieren. Sie werden dann separat in deinem CryptDrive gespeichert. Möchtest du die Bilder jetzt migrieren?";
       
    // markdown toolbar
    out.mdToolbar_button = "Die Markdown-Werkzeugleiste anzeigen oder verbergen";
    out.mdToolbar_defaultText = "Dein Text hier";
    out.mdToolbar_help = "Hilfe";
    out.mdToolbar_tutorial = "http://www.markdowntutorial.com/";
    out.mdToolbar_bold = "Fett";
    out.mdToolbar_italic = "Kursiv";
    out.mdToolbar_strikethrough = "Durchgestrichen";
    out.mdToolbar_heading = "Überschrift";
    out.mdToolbar_link = "Link";
    out.mdToolbar_quote = "Zitat";
    out.mdToolbar_nlist = "Nummerierte Liste";
    out.mdToolbar_list = "Aufzählung";
    out.mdToolbar_check = "Aufgabenliste";
    out.mdToolbar_code = "Code";

    // index.html

    out.home_product = "CryptPad ist eine Alternative mit eingebautem Datenschutz zu verbreiteten Office- und Clouddiensten. Mit CryptPad wird der gesamte Inhalt verschlüsselt, bevor er an den Server gesendet wird. Das bedeutet, dass keiner auf den Inhalt zugreifen kann, es sei denn du gibst die Schlüssel weiter. Selbst wir haben diesen Zugriff nicht.";
    out.home_host = "Dies ist eine unabhängige Installation der CrypPad-Software. Der Quellcode ist <a href=\"https://github.com/xwiki-labs/cryptpad\" target=\"_blank\" rel=\"noreferrer noopener\">auf GitHub</a> verfügbar.";
    out.home_host_agpl = "CryptPad kann unter der Lizenz AGPL3 verbreitet werden";
    out.home_ngi = "Gewinner beim NGI Award";

    //about.html
    out.about_intro = 'CryptPad wurde erstellt im Forschungsteam von <a href="http://xwiki.com">XWiki SAS</a>, einem kleinen Unternehmen in Paris (Frankreich) und Iasi (Rumänien). Im Kernteam arbeiten 3 Mitglieder an CryptPad, außerdem gibt es einige Mitwirkende innerhalb und außerhalb von XWiki SAS.';
    out.about_core = 'Kernentwickler';
    out.about_contributors = 'Wichtige Mitwirkende';

    // contact.html
    out.main_about_p22 = 'Uns antweeten';
    out.main_about_p23 = 'Einen Fehlerbericht auf GitHub erstellen';
    out.main_about_p24 = 'Hallo sagen (Matrix)';
    out.main_about_p25 = 'Uns eine E-Mail schicken';
    out.main_about_p26 = 'Wenn du Fragen oder Kommentare hast, freuen wir uns, von dir zu hören!';

    out.main_info = "<h2>Vertrauenswürdige Zusammenarbeit</h2> Lass deine Ideen gemeinsam wachsen, während die <strong>Zero-Knowledge</strong>-Technologie den Schutz deiner Daten <strong>sogar uns gegenüber</strong> sichert.";
    out.main_catch_phrase = "Die Cloud ohne Preisgabe deiner Daten";

    out.main_richText = 'Rich-Text-Editor';
    out.main_code = 'Code-Editor';
    out.main_slide = 'Folien-Editor';
    out.main_poll = 'Umfragen';
    out.main_drive = 'CryptDrive';

    out.main_richTextPad = 'Rich-Text-Pad';
    out.main_codePad = 'Markdown/Code-Pad';
    out.main_sheetPad = 'Tabellen (Beta)';
    out.main_slidePad = 'Markdown-Präsentation';
    out.main_pollPad = 'Umfrage oder Terminabstimmung';
    out.main_whiteboardPad = 'Whiteboard';
    out.main_kanbanPad = 'Kanban-Board';
    out.main_localPads = 'Lokale Dokumente';
    out.main_yourCryptDrive = 'Dein CryptDrive';
    out.main_footerText = "Mit CryptPad kannst du schnell kollaborative Dokumente erstellen, um Notizen oder Ideen zusammen mit anderen zu bearbeiten.";

    out.footer_applications = "Anwendungen";
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
    out.whatis_collaboration_p1 = 'Mit CryptPad kannst du kollaborative Dokumente erstellen, um Notizen und Ideen gemeinsam zu bearbeiten. Wenn du dich registrierst und einloggst, bekommst du die Möglichkeit, Dateien hochzuladen und Ordner einzurichten, um alle deine Dokumente zu organisieren. Als registrierter Nutzer erhältst du kostenlos 50 MB Speicherplatz.';
    out.whatis_collaboration_p2 = 'Du kannst den Zugang zu einem CryptPad-Dokument teilen, indem du einfach den entsprechenden Link teilst. Du kannst auch einen <em>schreibgeschützten</em> Zugang erstellen, um die Ergebnisse deiner Arbeit zu teilen, während du sie noch bearbeitest.';
    out.whatis_collaboration_p3 = 'Du kannst Rich-Text Dokumente mit dem <a href="http://ckeditor.com/">CKEditor</a> erstellen. Außerdem kannst du Markdown-Dokumente erstellen, die in Echtzeit formatiert angezeigt werden, während du tippst. Du kannst auch die Umfrage-Anwendung verwenden, um Termine unter mehrere Teilnehmern zu abzustimmen.';
    out.whatis_zeroknowledge = 'Zero Knowledge - Ohne Preisgabe deiner Daten';
    out.whatis_zeroknowledge_p1 = "Wir wollen nicht wissen, was du gerade tippst. Und mit moderner Verschlüsselungstechnologie, kannst du sicher sein, dass wir es auch nicht können. CryptPad verwendet <strong>100% clientseitige Verschlüsselung</strong>, um den Inhalt vor uns, den Hostern dieser Website, zu schützen.";
    out.whatis_zeroknowledge_p2 = 'Wenn du dich registrierst und einloggst, werden dein Benutzername und dein Passwort in einen Schlüssel mit einer <a href="https://de.wikipedia.org/wiki/Scrypt">Scrypt Schlüssel-Ableitungsfunktion</a> umgerechnet. Weder dieser Schlüssel noch der Benutzername oder das Passwort werden zum Server geschickt. Stattdessen werden sie clientseitig benutzt, um den Inhalt deines CryptDrives zu entschlüsseln. Dieses beinhaltet alle Dokumente, die dir zugänglich sind.';
    out.whatis_zeroknowledge_p3 = 'Wenn du Link zu einem Dokument teilst, teilst du auch den kryptografischen Schlüssel, der Zugang zu diesem Dokument gibt. Da dieser Schlüssel im <a href="https://de.wikipedia.org/wiki/Fragmentbezeichner">Fragmentbezeichner</a> liegt, wird er nie direkt zum Server geschickt. Bitte lies unsere <a href="https://blog.cryptpad.fr/2017/07/07/cryptpad-analytics-what-we-cant-know-what-we-must-know-what-we-want-to-know/">Blogeintrag über Datenschutz</a>, um mehr darüber zu erfahren, auf welche Typen von Metadaten wir zugreifen können und auf welche nicht.';
    out.whatis_drive = 'Organisieren mit CryptDrive';
    out.whatis_drive_p1 = 'Sobald auf ein Dokument mit CryptPad zugegriffen wird, wird es automatisch zum Stamm-Ordner deines CryptDrives hinzugefügt. Später kannst du diese Dokumente in eigenen Ordnern organisieren oder du kannst es in den Papierkorb verschieben. CryptDrive erlaubt die Suche nach deinen Dokumenten, wie und wann du willst.';
    out.whatis_drive_p2 = 'Mit einfachem Drag & Drop kannst du die Pads in deinem CryptDrive verschieben. Die Links zu diesen Pads bleiben erhalten, damit Mitarbeiter nie ihren Zugang verlieren.';
    out.whatis_drive_p3 = 'Du kannst auch Dateien in dein CryptDrive hochladen und mit deinen Kollegen teilen. Hochgeladene Dateien können genau so wie kollaborative Pads organisiert werden.';
    out.whatis_business = 'CryptPad im Business';
    out.whatis_business_p1 = 'Die Zero-Knowledge-Verschlüsselung von CryptPad multipliziert die Effektivität existierender Sicherheitsprotokolle durch Spiegelung der Zugangskontrollen von Organisationen in Kryptografie. Weil sensible Daten nur mit den Zugangsdaten des Nutzers entschlüsselt werden können, ist CryptPad ein weniger lohnendes Ziel verglichen mit traditionellen Cloud-Diensten. Lies das <a href="https://blog.cryptpad.fr/images/CryptPad-Whitepaper-v1.0.pdf">CryptPad-Whitepaper</a>, um mehr darüber zu erfahren, wie CryptPad deinem Unternehmen helfen kann.';
    out.whatis_business_p2 = 'CryptPad kann auf eigenen Rechnern installiert werden. <a href="https://cryptpad.fr/about.html">Entwickler der CryptPad-Software</a> von XWiki SAS können kommerzielle Unterstützung, Anpassung und Entwicklung anbieten. Bitte schicke eine E-Mail an <a href="mailto:sales@cryptpad.fr">sales@cryptpad.fr</a>, um mehr zu erfahren.';

    // privacy.html

    out.policy_title = 'Datenschutzbestimmungen für CryptPad';
    out.policy_whatweknow = 'Was wir über dich wissen';
    out.policy_whatweknow_p1 = 'Als im Web gehostete Anwendung hat CryptPad Zugriff auf die Metadaten, die vom HTTP-Protokoll übertragen werden. Dies umfasst deine IP-Adresse und diverse andere HTTP-Header, die es ermöglichen, deinen Browser zu identifizieren. Um zu sehen, welche Daten dein Browser preisgibt, kannst du die Seite <a target="_blank" rel="noopener noreferrer" href="https://www.whatismybrowser.com/detect/what-http-headers-is-my-browser-sending" title="Welche HTTP-Header sendet mein Browser">WhatIsMyBrowser.com</a> besuchen.';
    out.policy_whatweknow_p2 = 'Wir nutzen <a href="https://www.elastic.co/products/kibana" target="_blank" rel="noopener noreferrer" title="Open-Source-Analyseplattform">Kibana</a>, eine Open-Source-Analyseplattform, um mehr über unsere Nutzer zu erfahren. Kibana teilt uns mit, wie du Cryptpad gefunden hast &mdash; durch direkten Zugriff, mit Hilfe einer Suchmaschine oder über einen Link auf einer anderen Seite wie beispielsweise Reddit oder Twitter.';
    out.policy_howweuse = 'Wie wir das Wissen anwenden';
    out.policy_howweuse_p1 = 'Wir nutzen diese Informationen, um besser entscheiden zu können, wie CryptPad beworben werden kann und um derzeit genutzte Strategien zu evaluieren. Informationen über deinen Standort helfen uns bei der Abschätzung, welche Sprachen wir besser unterstützen sollten.';
    out.policy_howweuse_p2 = "Informationen zu deinem Browser (ob du auf einem Desktop oder Smartphone arbeitest) helfen uns bei der Entscheidung, welche Funktionen priorisiert werden sollen. Unser Entwicklerteam ist klein, deshalb ist es uns wichtig, Entscheidungen derart zu treffen, dass möglichst viele Nutzer davon profitieren.";
    out.policy_whatwetell = 'Was wir anderen über dich (nicht) erzählen';
    out.policy_whatwetell_p1 = 'Wir reichen keine von uns gesammelten Daten weiter, außer im Falle einer gerichtlichen Anordnung.';
    out.policy_links = 'Links zu anderen Seiten';
    out.policy_links_p1 = 'Diese Seite beinhaltet Links zu anderen Seiten, teilweise werden diese von anderen Organisationen verwaltet. Wir sind nicht für den Umgang mit der Privatsphäre und die Inhalte der anderen Seiten verantwortlich. Generell werden Links zu externen Seiten in einem neuem Fenster geöffnet, um zu verdeutlichen, dass du CryptPad.fr verlässt.';
    out.policy_ads = 'Werbung';
    out.policy_ads_p1 = 'Wir zeigen keine Onlinewerbung, können aber zu Organisationen verlinken, die unsere Forschung finanzieren.';
    out.policy_choices = 'Deine Möglichkeiten';
    out.policy_choices_open = 'Unser Code ist frei, deshalb kannst du jederzeit deine eigene CryptPad-Instanz hosten.';
    out.policy_choices_vpn = 'Wenn du unsere gehostete Instanz nutzen möchtest, ohne deine IP-Adresse zu offenbaren, bitten wir dich darum, deine IP-Adresse zu verschleiern. Das ist zum Beispiel mit dem <a href="https://www.torproject.org/projects/torbrowser.html.en" title="Downloads des Tor-Projekts" target="_blank" rel="noopener noreferrer">Tor Browser</a> oder einem <a href="https://riseup.net/en/vpn" title="Von Riseup bereitgestellte VPN-Dienste" target="_blank" rel="noopener noreferrer">VPN-Zugang</a> möglich.';
    out.policy_choices_ads = 'Wenn du unsere Analysesoftware blockieren möchtest, kannst du Blocker-Software wie <a href="https://www.eff.org/privacybadger" title="Privacy Badger herunterladen" target="_blank" rel="noopener noreferrer">Privacy Badger</a> verwenden.';

    // features.html

    out.features = "Funktionen";
    out.features_title = "Vergleich der Funktionen";
    out.features_feature = "Funktion";
    out.features_anon = "Anonymer Benutzer";
    out.features_registered = "Angemeldete Benutzer";
    out.features_premium = "Premium-Benutzer";
    out.features_notes = "Hinweise";

    out.features_f_apps = "Zugang zu den wichtigsten Anwendungen";
    out.features_f_core = "Gemeinsame Funktionen der Anwendungen";
    out.features_f_core_note = "Bearbeiten, Importieren & Exportieren, Verlauf, Benutzerliste, Chat";
    out.features_f_file0 = "Dateien öffnen";
    out.features_f_file0_note = "Von anderen geteilte Dateien ansehen und herunterladen";
    out.features_f_cryptdrive0 = "Begrenzter Zugang zu CryptDrive";
    out.features_f_cryptdrive0_note = "Du kannst besuchte Dokumente in deinem Browser speichern, damit du sie später öffnen kannst";
    out.features_f_storage0 = "Speicherung für eine begrenzte Zeit";
    out.features_f_storage0_note = "Neue Dokumente könnten nach drei Monaten ohne Aktivität gelöscht werden";

    out.features_f_anon = "Alle Funktionen für anonyme Benutzer";
    out.features_f_anon_note = "Mit einer besseren Benutzbarkeit und mehr Kontrolle über deine Dokumente";
    out.features_f_cryptdrive1 = "Alle Funktionen des CryptDrives";
    out.features_f_cryptdrive1_note = "Ordner, geteilte Ordner, Vorlagen, Tags";
    out.features_f_devices = "Deine Dokumente auf allen deinen Geräten";
    out.features_f_devices_note = "Überall Zugang zu deinem CryptDrive mit deinem Benutzerkonto";
    out.features_f_social = "Soziale Anwendungen";
    out.features_f_social_note = "Ein Profil erstellen, ein Profilbild verwenden, mit Kontakten chatten";
    out.features_f_file1 = "Dateien hochladen und teilen";
    out.features_f_file1_note = "Dateien mit Freunden teilen oder sie in Dokumenten einbetten";
    out.features_f_storage1 = "Langfristige Speicherung (50 MB)";
    out.features_f_storage1_note = "Dateien in deinem CryptDrive werden nicht wegen Inaktivität gelöscht";
    out.features_f_register = "Registrieren (kostenlos)";
    out.features_f_register_note = "Keine E-Mail-Adresse oder persönliche Informationen notwendig";

    out.features_f_reg = "Alle Funktionen für angemeldete Benutzer";
    out.features_f_reg_note = "Du unterstützt die Entwicklung von CryptPad";
    out.features_f_storage2 = "Mehr Speicherplatz";
    out.features_f_storage2_note = "Zwischen 5 GB und 50 GB, abhängig vom gewählten Tarif";
    out.features_f_support = "Schnellerer Support";
    out.features_f_support_note = "Professioneller Support via E-Mail mit dem Team-Tarif";
    out.features_f_supporter = "Werde ein Unterstützer des Datenschutzes";
    out.features_f_supporter_note = "Hilf uns beweisen, dass Software mit eingebauten Datenschutz die Normalität sein sollte";
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
            q: "Was ist ein Pad?",
            a: "Ein CryptPad-Dokument wird meist einfach <em>Pad</em> genannt. Dies wurde von <a href='http://etherpad.org/' target='_blank'>Etherpad</a> übernommen, einem kollaborativen Echtzeit-Editor.\n"+
            "Es beschreibt ein Dokument, das du in deinem Browser bearbeiten kannst, normalerweise mit der Möglichkeit für andere Personen, die Veränderungen nahezu in Echtzeit zu sehen."
        },
        owned: {
            q: "Was ist ein eigenes Pad?",
            a: "Ein <em>eigenes Pad</em> ist ein Pad mit einem definierten Eigentümer, der anhand seiner <em>Unterschrift mit öffentlichen Schlüssel</em> erkannt wird." +
            "Der Eigentümer eines Pads kann entscheiden, das Pad zu löschen. In diesem Fall ist das Pad auch für andere Nutzer nicht mehr verfügbar. Dabei spielt es keine Rolle, ob das Pad im CryptDrive der anderen Nutzer gespeichert war oder nicht."
        },
        expiring: {
            q: "Was sind ablaufende Pads?",
            a: "Ein Pad kann mit einem <em>Ablaufdatum</em> versehen werden. Nach diesem Datum wird es automatisch vom Server gelöscht." +
                " Das Ablaufdatum kann sowohl sehr bald sein (in ein paar Stunden) oder in weiter Zukunft liegen (in hunderten Monaten)." +
                " Das Pad und sein gesamter Verlauf wird nach dem Ablaufdatum endgültig gelöscht, auch wenn es gerade noch bearbeitet wird.<br><br>" +
                "Wenn ein Dokument ein Ablaufdatum hat, kann man dieses Datum in den <em>Eigenschaften</em> sehen: entweder mit einem Rechtsklick im CryptDrive oder mit der Eigenschaften-Ansicht im geöffneten Pad."
        },
        tag: {
            q: "Wie kann ich Tags verwenden?",
            a: "Du kannst Pads und im CryptDrive hochgeladene Dateien <em>taggen</em>. Dies bedeutet, sie mit einem Stichwort (Tag) zu versehen. Während der Bearbeitung gibt es dafür die Schaltfläche <em>Tag</em> (<span class='fa fa-hashtag'></span>) in der Werkzeugleiste." +
            " Wenn du die Pads und Dateien in deinem CryptDrive nach einem Tag durchsuchen möchtest, beginne den Suchbegriff mit einem Hashtag, also beispielsweise <em>#crypto</em>."
        },
        template: {
            q: "Was ist eine Vorlage?",
            a: "Eine Vorlage ist ein Pad, das dazu verwendet werden kann, um den Inhalt für neu erstellte Pads zu definieren." +
            " Jedes existierende Pad kann in eine Vorlage umgewandelt werden, indem es in den Bereich <em>Vorlagen</em> des CryptDrives verschoben wird." +
            " Du kannst auch eine Kopie eines Dokuments erstellen, die zur Vorlage wird, indem du auf die Vorlagen-Schaltfläche (<span class='fa fa-bookmark'></span>) der Werkzeugleiste des Editors klickst."
        },
        abandoned: {
            q: "Was ist ein verlassenes Pad?",
            a: "Ein <em>verlassenes Pad</em> ist ein Pad, das kein registrierter Benutzer in seinem CryptDrive gespeichert hat und in den letzten sechs Monaten nicht bearbeitet wurde. Verlassene Pads werden automatisch vom Server gelöscht."
        },
    };
    out.faq.privacy = {
        title: 'Privatsphäre',
        different: {
            q: "Wie unterscheidet sich CryptPad von anderen Pad-Diensten?",
            a: "CryptPad verschlüsselt Veränderungen deiner Dokumente, bevor diese Information zum Server gesendet wird. Somit können wir nicht lesen, was du getippt hast." 
        },
        me: {
            q: "Welche Informationen hat der Server über mich?",
            a: "Die Administratoren des Servers können die IP-Adresse der Personen sehen, die CryptPad besuchen."  +
            " Wir speichern nicht, welche Adresse welches Pad besucht, aber wir könnten es tun. Wir haben aber keinen Zugriff auf den entschlüsselten Inhalt der Pads." +
            " Wenn du besorgt bist, dass wir diese Informationen auswerten, solltest du davon auszugehen, dass wir es tun. Denn wir können nicht beweisen, dass wir es nicht tun.<br><br>" +

            " Wir sammeln grundlegende technische Informationen darüber, wie CryptPad benutzt wird. Dies umfasst beispielsweise die Größe des Bildschirms und welche Schaltflächen am häufigsten angeklickt werden." +
            " Das hilft uns dabei, unsere Software besser zu machen. Aber diese Sammlung unterbleibt, wenn du den Haken bei <em>Rückmeldung aktivieren</em> entfernst.<br><br>" +

            "Wir verfolgen, welche Pads im CryptDrive eines Nutzers gespeichert werden. Dies ist notwendig, um die Speicherbegrenzungen umzusetzen. Den Inhalt der Pads kennen wir nicht." +
            " Die Speicherbegrenzungen sind mit dem öffentlichen Schlüssel eines Benutzers verbunden. Aber wir verbinden Namen oder E-Mail-Adressen nicht mit diesen öffentlichen Schlüsseln.<br><br>" +

            " Du kannst mehr darüber in diesem <a href='https://blog.cryptpad.fr/2017/07/07/cryptpad-analytics-what-we-cant-know-what-we-must-know-what-we-want-to-know/' target='_blank'>Blogeintrag</a> lesen."
        },
        register: {
            q: "Weisst der Server mehr über mich, wenn ich registriere?",
            a: "Wir verlangen nicht Deine Emailadresse und der Server kennt Benutzername und Passwort auch dann nicht, wenn du dich registrierst. " +
			   " Statt dessen generiert das Registrierungs- und Anmeldeformular ein Schlüsselpaar mit deiner Eingabe. Nur der öffentliche Schlüssel dieses Schlüsselpaars wird zum Server geschickt." +
               " Mit diesem öffentlichen Schlüssel könenn wir z.B. die Menge der Daten, die du benutzt, kontrollieren, denn jeder Benutzer hat eine beschränkte Quota.<br><br>" +

			   " Wir benutzen die <em>Rückmeldung</em>s-Funktion, um den Server zu informieren, dass jemand mit deiner IP ein Konto registriert hat." +
			   " Damit können wir messen, wie viele Benutzer CryptPad Konten registrieren und aus welchen Regionen. Somit können wir erfahren, welche Sprache besseren Support braucht.<br><br>" +
				
			   " Wenn Du registrierst, erstellst Du einen öffentlichen Schlüssel, der benutzt wird, um den Server zu informieren, dass er Dokumente auch dann nicht löschen sollte, wenn sie nicht aktiv benutzt werden." + 
               " Diese Information zeigt dem Server, wie Du CryptPad benutzt und dieses System erlaubt uns, die Dokumente zu löschen, wofür sich keiner mehr interessiert."
        },
        other: {
            q: "Was können andere Benutzer über mich erfahren?",
            a: "Wenn du ein Pad mit jemand anderen bearbeitest, kommunizierst du mit dem Server. Nur wir kennen deine IP-Adresse." +
            " Andere Benutzer sehen deinen Benutzernamen, dein Benutzerbild, den Link zu deinem Profils (wenn du eins hast) und deinen <em>öffentlichen Schlüssel</em> (um die Nachrichten zu diesen Benutzern zu verschlüsseln)."
        },
        anonymous: {
            q: "Macht mich CryptPad anonym?",
            a: "Auch wenn CryptPad so konzipiert wurde, dass es so wenig wie möglich über dich weiß, liefert es keine strenge Anonymität." +
            " Unsere Server kennen deine IP-Adresse, allerdings kannst du diese Information verbergen, indem du Tor verwendest." +
            " Tor zu verwenden, ohne dein Verhalten zu ändern, garantiert auch keine Anonymität, da der Server Benutzer anhand ihrer einzigartigen öffentlichen Schlüssel identifizieren kann." +
            " Wenn du denselben Schlüssel mit und ohne Tor benutzt, kann deine Sitzung de-anonymisiert werden.<br><br>" +

            " Für Benutzer mit niedrigeren Ansprüchen an ihre Privatsphäre erfordert CryptPad im Gegenteil zu anderen Onlinediensten keine Identifikation mit Namen, Telefonnummer oder E-Mail-Adressen."
        },
        policy: {
            q: "Habt ihr eine Datenschutzerklärung?",
            a: "Ja! Sie ist <a href='/privacy.html' target='_blank'>hier</a> verfügbar."
        }
    };
    out.faq.security = {
        title: 'Sicherheit',
        proof: {
            q: "Wie benutzt ihr Zero-Knowledge-Beweise?",
            a: "Wir benutzen den Begriff <em>Ohne Preisgabe von Daten</em> (<em>Zero Knowledge</em>) nicht im Sinn eines <em>Zero-Knowledge-Beweises</em>, sondern im Sinn eines <em>Zero-Knowledge-Webdienstes</em>." +
            " Ein <em>Zero-Knowledge-Webdienst</em> verschlüsselt die Benutzerdaten im Browser, ohne dass der Server je Zugang zu den unverschlüsselten Daten oder zu den Schlüsseln hat. <br><br>" +
            " Wir haben <a href='https://blog.cryptpad.fr/2017/02/20/Time-to-Encrypt-the-Cloud/#Other-Zero-Knowledge-Services'>hier</a> eine kurze Liste von Zero-Knowledge-Webdiensten erstellt."
        },
        why: {
            q: "Wieso sollte ich CryptPad verwenden?",
            a: "Unsere Position ist, dass Clouddienste nicht Zugang zu deinen Daten verlangen sollten, damit du sie mit deinen Kontakten und Mitarbeitern teilen kannst." +
            " Wenn du einen Webdienst benutzt, der nicht explizit angibt, dass kein Zugang zu deinen Information möglich ist, ist es sehr wahrscheinlich, dass deine Information für andere Zwecke verwertet werden."
        },
        compromised: {
            q: "Liefert mir CryptPad einen Schutz, wenn mein Gerät kompromittiert wird?",
            a: "Für den Fall, dass dein Gerät gestohlen wird, ermöglicht CryptPad, das Ausloggen aller Geräte zu erzwingen - außer dem, das du gerade verwendest." +
            " Gehe dazu zur Seite mit deinen <strong>Einstellungen</strong> und klicke auf <strong>Überall ausloggen</strong>." +    
            " Alle anderen Geräte, die mit diesem Konto verbunden sind, werden dann ausgeloggt. " +
            " Alle früher verbundenen Geräte werden ausgeloggt, sobald sie CryptPad besuchen.<br><br> " +

            "Die beschriebene Funktion ist derzeit im Browser implementiert und nicht im Server." +
            " Somit schützt sie nicht vor staatlichen Akteuren. Aber sie sollte ausreichend sein, wenn du nach Verwendung eines öffentlichen Computers vergessen hast dich auszuloggen."
        },
        crypto: {
            q: "Welche Kryptografie benutzt ihr?",
            a: "CryptPad basiert auf zwei quelloffenen Kryptografiebibliotheken: " +
            "<a href='https://github.com/dchest/tweetnacl-js' target='_blank'>tweetnacl.js</a> und <a href='https://github.com/dchest/scrypt-async-js' target='_blank'>scrypt-async.js</a>.<br><br>" +

            "Scrypt ist eine <em>Passwort-basierte Schlüsselableitungsfunktion</em>. Wir werden sie, um deinen Benutzernamen und dein Passwort in ein einzigartiges Schlüsselpaar umzuwandeln. Dieses sichert den Zugang zu deinem CryptDrive, so dass nur du auf die Liste deiner Pads zugreifen kannst.<br><br>" +

            " Wir verwenden die Verschlüsselung <em>xsalsa20-poly1305</em> und <em>x25519-xsalsa20-poly1305</em> von tweetnacl, um Dokumente und den Chatverlauf zu verschlüsseln."
        }
    };
    out.faq.usability = {
        title: 'Bedienung',
        register: {
            q: "Was kriege ich, wenn ich mich registriere?",
            a: "Registrierte Benutzer können Funktionen verwenden, die anonyme Nutzer nicht verwenden können. Es gibt <a href='/features.html' target='_blank'>hier</a> eine entsprechende Übersicht."
        },
        share: {
            q: "Wie kann ich den Zugang zu einem verschlüsselten Pad mit Freunden teilen?",
            a: "CryptPad fügt den geheimen Schlüssel deines Pad nach dem Zeichen <em>#</em> zur URL hinzu." +
            " Alles, was nach diesem Zeichen kommt, wird nicht zum Server gesendet. Also haben wir nie Zugang zu deinen Schlüsseln." +
            " Wenn du den Link zu einem Pad teilst, teilst du auch die Fähigkeit zum Lesen und zum Bearbeiten."
        },
        remove: {
            q: "Ich habe ein Dokument aus meinem CryptDrive gelöscht, aber der Inhalt ist noch verfügbar. Wie kann ich es entfernen?",
            a: "Nur <em>eigene Pads</em>, die im Februar 2018 eingeführt wurden, können gelöscht werden und zwar nur von deren Eigentümer " +
            " (der Benutzer, der das Dokument ursprünglich erstellt hat). Wenn du nicht der Eigentümer des Pads bist, musst du den Eigentümer bitten, dass er dieses für dich löscht." +
            " Bei Pads, deren Eigentümer du bist, kannst du <strong>auf das Pad in deinem CryptDrive rechtsklicken</em> und <strong>Vom Server löschen</strong> wählen."
        },
        forget: {
            q: "Was passiert, wenn ich mein Passwort vergesse?",
            a: " Wenn wir dein Passwort zurücksetzen könnten, könnten wir auch auf deine Daten zugreifen." +
            " Wenn du dein Passwort nicht aufgeschrieben hast und dich auch nicht daran erinnern kannst, kannst du vielleicht deine Pads aus deinem Browserverlauf zurückgewinnen."
        },
        change: {
            q: "Was ist, wenn ich mein Passwort ändern möchte?",
            a: "Du kannst dein CrypPad-Passwort in den Einstellungen ändern."
        },
        devices: {
            q: "Ich bin auf zwei Geräten eingeloggt und sehe zwei unterschiedliche CryptDrives. Wie ist das möglich?",
            a: "Es ist möglich, dass du zweimal mit dem gleichen Benutzernamen registriert bist, aber mit unterschiedlichen Passwörtern." +
            " Weil der CyrptPad-Server dich anhand deiner kryptografischen Unterschrift und nicht anhand deines Namens identifiziert, kann er nicht verhindern, dass der gleiche Name mehrmals verwendet wird." +
            " Somit hat jedes Benutzerkonto eine einzigartige Kombination aus Benutzername und Passwort." +
            " Angemeldete Benutzer können ihren Benutzernamen im oberen Teil der Einstellungsseite sehen."
        },
        folder: {
            q: "Kann ich ganze Ordner in CryptDrive teilen?",
            a: "Ja, du kannst ganze Ordner und alle Pads darin teilen."
        },
        feature: {
            q: "Könnt ihr diese eine Funktion hinzufügen, die ich brauche?",
            a: "Viele Funktionen wurden in CryptPad umgesetzt, weil Benutzer darum gebeten haben." +
            " Auf unserer <a href='https://cryptpad.fr/contact.html' target='_blank'>Kontaktseite</a> haben wir die Möglichkeiten aufgelistet, wie man mit uns in Kontakt treten kann.<br><br>" +

            "Leider können wir aber nicht garantieren, dass wir alle Funktionen umsetzen, um die Benutzer bitten." +
            " Wenn eine Funktion kritisch für deine Organisation ist, kannst du die Entwicklung dieser Funktion sponsern und somit deren Realisierung sichern." +
            " Bitte kontaktiere <a href='mailto:sales@cryptpad.fr' target='_blank'>sales@cryptpad.fr</a> für mehr Informationen.<br><br>" +

            "Auch wenn du nicht die Entwicklung einer Funktion sponsorn kannst, sind wir an Rückmeldungen interessiert. Diese helfen uns dabei, CryptPad zu verbessern." +
            " Kontaktiere uns jederzeit über einen der oben angegebenen Wege."
        },
    };
    out.faq.other = {
        title: "Andere Fragen",
        pay: {
            q: "Wieso soll ich zahlen, wenn so viele Funktionen sowieso kostenfrei sind?",
            a: "Wir geben Unterstützern zusätzlichen Speicherplatz sowie die Möglichkeit, die Speicherplatzbegrenzung ihrer Freunde zu erhöhen (<a href='https://accounts.cryptpad.fr/#/faq' target='_blank'>erfahre mehr</a>).<br><br>" +

            " Über diese diese kurzfristigen Vorteile hinaus kannst du, wenn du ein Premiumangebot annimmst, die aktive Weiterentwicklung von CryptPad fördern. Das beinhaltet, Fehler zu beseitigen, neue Funktionen zu umzusetzen und Installationen von CryptPad auf eigenen Servern zu erleichtern." +
            " Zusätzlich hilfst du, anderen Anbietern zu beweisen, dass Leute datenschutzfreundliche Technologien unterstützen. Wir hoffen, dass Geschäftsmodelle, die auf dem Verkauf von Benutzerdaten basieren, letztendlich der Vergangenheit angehören werden.<br><br>" +

            "Außerdem glauben wir, dass es gut ist, die Funktionen von CryptPad kostenfrei anzubieten. Denn jeder verdient persönlichen Datenschutz und nicht nur Personen mit hohem Einkommen." +
            " Durch deine Unterstützung hilfst du uns, zu ermöglichen, dass auch Menschen mit geringerem Einkommen diese grundlegenden Funktionen genießen können, ohne dass ein Preisetikett daran klebt."
        },
        goal: {
            q: "Was ist euer Ziel?",
            a: "Durch die Verbesserung von Technologien, die die Privatsphäre der Nutzer respektieren, möchten wir die Erwartungen der Benutzer an den Datenschutz auf Cloudplattformen erhöhen." +
            " Wir hoffen, dass unsere Arbeit andere Dienstanbieter in allen Bereichen anspornt, ähnliche oder bessere Dienste anzubieten." +
            " Wir wissen, dass ein großer Teil des Internets durch gezielte Werbung finanziert wird." +
            " Es gibt in dieser Hinsicht viel mehr zu tun als wir jemals schaffen können. Wir freuen uns über die Förderung, Unterstützung und Beiträge aus unserer Community, um diesem Ziel näher zu kommen."
        },
        jobs: {
            q: "Sucht Ihr Mitarbeiter?",
            a: "Ja! Bitte schicke eine kurze Vorstellung an <a href='mailto:jobs@xwiki.com' target='_blank'>jobs@xwiki.com</a>."
        },
        host: {
            q: "Könnt ihr mir helfen, meine eigene Installation von CryptPad aufzubauen?",
            a: "Wir bieten gerne Support für das Aufsetzen eines internen CryptPads in deiner Organisation. Setze dich bitte mit <a href='mailto:sales@cryptpad.fr' target='_blank'>sales@cryptpad.fr</a> in Verbindung für mehr Information.",
        },
        revenue: {
            q: "Wie kann ich meine Einnahmen mit den Entwicklern teilen?",
            a:  " Wenn du deine eigene Installation von CrytPad betreibst und die Einnahmen für deine bezahlten Konten mit Entwicklern teilen möchtest, muss dein Server als Partnerservice konfiguriert werden.<br><br>" +

            "In deinem CryptPad-Verzeichnis befindet sich <em>config.example.js</em>. Darin wird erklärt, wie du deinen Server dafür konfigurieren musst. "+
            "Danach solltest du  <a href='mailto:sales@cryptpad.fr'>sales@cryptpad.fr</a> kontaktieren, damit geprüft wird, dass dein Server richtig mit HTTPS konfiguriert ist, und die Zahlungsmethoden abgesprochen werden können. "
        },
    };
  
    // terms.html

    out.tos_title = "Nutzungsbedingungen für CryptPad";
    out.tos_legal = "Sei nicht bösartig oder missbrauchend und mache nichts illegales.";
    out.tos_availability = "Wir hoffen, dass dir dieser Dienst nützt, aber Erreichbarkeit und Performanz können nicht garantiert werden. Bitte exportiere deine Daten regelmäßig.";
    out.tos_e2ee = "CryptPad-Inhalte können von allen gelesen oder bearbeitet werden, die den Fragmentbezeichner des Dokuments erraten oder auf eine andere Art davon erfahren. Wir empfehlen dir Ende-Zu-Ende verschlüsselte Nachrichtentechnik (e2ee) zum Versenden der URLs zu nutzen. Wir übernehmen keine Haftung, falls eine URL erschlichen oder abgegriffen wird.";
    out.tos_logs = "Metadaten, die dein Browser übermittelt, können geloggt werden, um den Dienst aufrechtzuerhalten.";
    out.tos_3rdparties = "Wir geben keine persönlichen Daten an Dritte weiter, außer auf richterliche Anordnung.";

    // 404 page
    out.four04_pageNotFound = "Wir konnten die Seite, die du angefordert hast, nicht finden.";

    // BottomBar.html

    //out.bottom_france = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer">Hergestellt mit <img class="bottom-bar-heart" src="/customize/heart.png" alt="Liebe" /> in <img class="bottom-bar-fr" src="/customize/fr.png" alt="Frankreich" /></a>';
    //out.bottom_support = '<a href="http://labs.xwiki.com/" title="XWiki Labs" target="_blank" rel="noopener noreferrer">Ein Projekt von <img src="/customize/logo-xwiki2.png" alt="XWiki SAS" class="bottom-bar-xwiki"/> Labs Project </a> mit der Unterstützung von <a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';

    // Header.html

    out.updated_0_header_logoTitle = 'Zu deinem CryptDrive';
    out.header_logoTitle = out.updated_0_header_logoTitle;
    out.header_homeTitle = 'Zur CryptPad-Hauptseite';

    // Initial states

    out.help = {};

    out.help.title = "Mit CryptPad anfangen";
    out.help.generic = {
        more: 'Erfahre mehr über die Nutzung von CryptPad, indem du unsere <a href="/faq.html" target="_blank">FAQ</a> liest.',
        share: 'Benutze das Teilen-Menü (<span class="fa fa-share-alt"></span>), um Links zu generieren, die Mitarbeiter zum Lesen oder Bearbeiten einladen.',
        //stored: 'Jedes Dokument, das du besuchst, wird automatisch in deinem <a href="/drive/" target="_blank">CryptDrive</a> gespeichert.',
        save: "Alle Änderungen werden automatisch synchronisiert. Du misst sie also nicht speichern."
    };

    out.help.text = {
        formatting: 'Du kannst die Werkzeugleiste anzeigen oder verbergen, indem du auf <span class="fa fa-caret-down"></span> oder <span class="fa fa-caret-up"></span> klickst.',
        embed: 'Registrierte Benutzer können mit <span class="fa fa-image"></span> Bilder oder Dateien einbetten, die in ihrem CryptDrive gespeichert sind.',
        history: 'Du kannst das Menü <em>Verlauf</em> <span class="fa fa-history"></span> benutzen, um frühere Versionen anzusehen oder wiederherzustellen.',
    };

    out.help.pad = {
        export: 'Du kannst Pads als PDF exportieren, indem du auf die Schaltfläche <span class="fa fa-print"></span> in der Werkzeugleiste klickst.',
    };

    out.help.code = {
        modes: 'Benutze das Dropdown-Menü im Untermenü <span class="fa fa-ellipsis-h"></span>, um die Syntaxhervorhebung oder das Farbschema zu ändern.',
    };

    out.help.beta = {
        warning: 'Dieser Editor ist noch <strong>experimentell</strong>, du kannst Fehler <a href="https://github.com/xwiki-labs/cryptpad/issues/" target="_blank">hier</a> melden'
    };
    out.help.oo = {
        access: "Zugriff ist auf registrierte Nutzer beschränkt, Mitarbeiter werden sich einloggen müssen",
    };

    out.help.slide = {
        markdown: 'Schreibe Folien in <a href="http://www.markdowntutorial.com/">Markdown</a> and trenne sie mit <code>---</code> in einer Zeile.',
        present: 'Starte die Präsentation mit der Schaltfläche <span class="fa fa-play-circle"></span>.',
        settings: 'Ändere die Einstellungen der Präsentation (Hintergrund, Übergang, Anzeige der Foliennummer etc.) über die Schaltfläche <span class="fa fa-cog"></span> im Untermenü <span class="fa fa-ellipsis-h"></span>.',
        colors: 'Ändere Text- und Hintergrundfarbe mit den Schaltflächen <span class="fa fa-i-cursor"></span> und <span class="fa fa-square"></span>.',
    };

    out.help.poll = {
        decisions: 'Treffe Entscheidungen gemeinsam mit deinen Bekannten',
        options: 'Mache Vorschläge und teile deine Präferenzen mit',
        choices: 'Klicke in die Zellen in deiner Spalte, um zwischen ja (<strong>✔</strong>), viellecht (<strong>~</strong>), oder nein (<strong>✖</strong>) zu wählen.',
        submit: 'Klicke auf <strong>Senden</strong>, damit deine Auswahl für andere sichtbar wird.',
    };

    out.help.whiteboard = {
        colors: 'Ein Doppelklick auf Farben erlaubt, die Palette zu verändern.',
        mode: 'Deaktiviere den Zeichenmodus, um die vorhandenen Striche zu verschieben und zu verlängern.',
        embed: 'Bette Bilder von deiner Festplatte <span class="fa fa-file-image-o"></span> oder von deinem CryptDrive <span class="fa fa-image"></span> ein und exportiere sie als PNG zu deiner Festplatte <span class="fa fa-download"></span> oder zu deinem CryptDrive <span class="fa fa-cloud-upload"></span>.'
    };

    out.help.kanban = {
        add: 'Füge ein neues Board hinzu mit der Schaltfläche <span class="fa fa-plus"></span> in der rechten oberen Ecke.',
        task: 'Verschiebe Einträge von einem Board zum anderen per Drag & Drop.',
        color: 'Ändere die Farben durch Klicken auf den farbigen Teil neben den Boardtiteln.',
    };

    // Readme

    out.driveReadmeTitle = "Was ist CryptPad?";
    out.readme_welcome = "Willkommen zu CryptPad!";
    out.readme_p1 = "Willkommen zu CryptPad, hier kannst du deine Notizen aufschreiben, allein oder mit Bekannten.";
    out.readme_p2 = "Dieses Dokument gibt dir einen kurzen Überblick, wie du CryptPad verwenden kannst, um Notizen zu schreiben, sie zu organisieren und mit anderen zusammen zu arbeiten.";
    out.readme_cat1 = "Lerne dein CryptDrive kennen";
    out.readme_cat1_l1 = "Ein Pad erstellen: Klicke in deinem CryptDrive auf {0} und dann auf {1}."; // 0: New, 1: Rich Text
    out.readme_cat1_l2 = "Ein Pad deines CryptDrives öffnen: Doppelklicke auf das Symbol eines Pads, um es zu öffnen.";
    out.readme_cat1_l3 = "Deine Pads organisieren: Wenn du eingeloggt bist, wird jedes geöffnete Pad im Bereich {0} deines CryptDrives angezeigt.";
    out.readme_cat1_l3_l1 = "Im Bereich {0} deines CryptDrives kannst du Dateien zwischen Ordnern verschieben oder neue Ordner anlegen."; // 0: Documents
    out.readme_cat1_l3_l2 = "Ein Rechtsklick auf die Symbole zeigt zusätzliche Menüfunktionen.";
    out.readme_cat1_l4 = "Verschiebe deine alten Pads in den Papierkorb: Du kannst deine Pads in den {0} verschieben, genauso wie du es bei einem Ordner machst."; // 0: Trash
    out.readme_cat2 = "Pads wie ein Profi gestalten";
    out.edit = "Bearbeiten";
    out.view = "Ansehen";
    out.readme_cat2_l1 = "Die Schaltfläche {0} in deinem Pad erlaubt dir, anderen einen Zugang für die Mitarbeit zu geben (entweder zum {1} oder zum {2}).";
    out.readme_cat2_l2 = "Der Titel eines Pads kann mit einem Klick auf den Stift geändert werden.";
    out.readme_cat3 = "Entdecke CryptPad-Anwendungen";

    out.readme_cat3_l1 = "Mit dem CryptPad Codeeditor kannst du Code wie JavaScript, Markdown oder HTML bearbeiten";
    out.readme_cat3_l2 = "Mit dem CryptPad Präsentationseditor kannst du schnell Vorträge mit Hilfe von Markdown gestalten";
    out.readme_cat3_l3 = "Mit der CryptPad Umfrage kannst du schnell Abstimmungen durchführen, insbesondere, um Meetings zu planen, die in den Kalender von allen passen.";

    // Tips
    out.tips = {};
    out.tips.store = "Jedes Mal, wenn du ein Dokument besuchst und eingeloggt bist, wird es in deinem CryptDrive gespeichert.";
    out.tips.marker = "Du kannst Text in einem Dokument mit \"Marker\" Menü in dem Stilmenü markieren.";
    out.tips.driveUpload = "Registrierte Benutzer können verschlüsselte Dateien aus ihrer Festplatte hochladen, indem sie sie einfach verschieben und in ihrem CryptDrive ablegen.";
    out.tips.filenames = "Du kannst Dateien in deinem CryptDrive neubenennen. Dieser Name ist nur für dich.";
    out.tips.drive = "Eingeloggte Benutzern können ihre Dateien in ihrem CryptDrive organisieren. Dieses ist mit einem Klick auf das CryptPad Symbol oben links erreichbar, wenn man in einem Dokument ist.";
    out.tips.profile = "Registrierte Benutzer können ihr Profil im Benutzer-Menü oben rechts bearbeiten.";
    out.tips.avatars = "Du kannst ein Benutzerbild in dein Profil hochladen. Andere sehen es, wenn sie in einem Dokument zusammenarbeiten.";
    out.tips.tags = "Bringe Tags auf deinen Dokumenten an und starte eine Suche-nach-Tags mit dem # Zeichen in der CryptDrive-Suche.";
    out.tips.shortcuts = "Mit den Tastenkürzeln `Strg+b`, `Strg+i` und `Strg+u` formatierst du Text fett, kursiv oder unterstrichen.";
    out.tips.indent = "In nummerierten Listen oder Aufzählungen kannst du mit Tab und Umschalt+Tab den Einzug erhöhen oder reduzieren.";
    out.tips.store = "Jedes Mal, wenn du ein Pad besuchst und eingeloggt bist, wird es in deinem CryptDrive gespeichert.";
    out.tips.marker = "Du kannst Text in einem Pad markieren, in dem du den Eintrag \"Marker\" aus dem Stil-Menü auswählst.";
    out.tips.driveUpload = "Registrierte Benutzer können verschlüsselte Dateien von ihrer Festplatte hochladen, indem sie diese einfach per Drag & Drop in ihrem CryptDrive ablegen.";
    out.tips.filenames = "Du kannst Dateien in deinem CryptDrive umbenennen. Dieser Name ist nur für dich.";
    out.tips.drive = "Eingeloggte Benutzer können ihre Dateien in ihrem CryptDrive organisieren. Das CryptDrive ist in allen Pads mit einem Klick auf das CryptPad-Symbol oben links erreichbar.";
    out.tips.profile = "Registrierte Benutzer können ihr Profil über das Benutzer-Menü oben rechts bearbeiten.";
    out.tips.avatars = "Du kannst ein Profilbild hochladen. Andere Nutzer sehen es, wenn sie mit dir in einem Pad zusammenarbeiten.";
    out.tips.tags = "Füge Tags zu deinen Pads hinzu und starte in deinem CryptDrive eine Suche mit dem Zeichen #, um sie zu finden.";

    out.feedback_about = "Wenn du das liest, fragst du dich wahrscheinlich, weshalb dein Browser bei der der Ausführung mancher Aktionen Anfragen an Webseiten sendet.";
    out.feedback_privacy = "Wir respektieren deine Datenschutz, aber gleichzeitig wollen wir, dass die Benutzung von CryptPad sehr leicht ist. Deshalb wollen wir erfahren, welche Funktion am wichtigsten für unsere Benutzer ist, indem wir diese mit einer genauen Parameterbeschreibung anfordern.";
    out.feedback_optout = "Wenn du das nicht möchtest, kannst du es in <a href='/settings/'>deinen Einstellungen</a> deaktivieren.";

    // Creation page
    out.creation_404 = "Dieses Pad existiert nicht mehr. Benutze das folgende Formular, um ein neues Pad zu gestalten.";
    out.creation_ownedTitle = "Pad-Typ";
    out.creation_owned = "Eigenes Pad"; // Creation page
    out.creation_ownedTrue = "Eigenes Pad"; // Settings
    out.creation_ownedFalse = "Offenes Pad";
    out.creation_owned1 = "Ein <b>eigenes</b> Pad kann vom Server gelöscht werden, wenn der Eigentümer so entscheidet. Die Löschung eines eigenen Pads bewirkt die Löschung aus allen anderen CryptDrives.";
    out.creation_owned2 = "Ein <b>offenes</b> Pad hat keinen Eigentümer. Es kann also nicht vom Server gelöscht werden, es sei denn es hat sein Ablaufdatum erreicht.";
    out.creation_expireTitle = "Ablaufdatum";
    out.creation_expire = "Auslaufendes Pad";
    out.creation_expireTrue = "Ein Ablaufdatum hinzufügen";
    out.creation_expireFalse = "Unbegrenzt";
    out.creation_expireHours = "Stunde(n)";
    out.creation_expireDays = "Tag(e)";
    out.creation_expireMonths = "Monat(e)";
    out.creation_expire1 = "Ein <b>unbegrenztes</b> Pad wird nicht vom Server entfernt, solange der Eigentümer es nicht löscht.";
    out.creation_expire2 = "Ein <b>auslaufendes</b> Pad hat eine begrenzte Lebensdauer, nach der es automatisch vom Server und aus den CryptDrives anderer Nutzer entfernt wird.";
    out.creation_password = "Passwort hinzufügen"; 
    out.creation_noTemplate = "Keine Vorlage";
    out.creation_newTemplate = "Neue Vorlage";
    out.creation_create = "Erstellen";
    out.creation_saveSettings = "Dieses Dialog nicht mehr anzeigen";
    out.creation_settings = "Mehr Einstellungen anzeigen";
    out.creation_rememberHelp = "Gehe zu deinen Einstellungen, um diese Auswahl zurückzusetzen";
    // Properties about creation data
    out.creation_owners = "Eigentümer";
    out.creation_ownedByOther = "Eigentum eines anderen Benutzers";
    out.creation_noOwner = "Kein Eigentümer";
    out.creation_expiration = "Ablaufdatum";
    out.creation_passwordValue = "Passwort"; 
    out.creation_propertiesTitle = "Verfügbarkeit";
    out.creation_appMenuName = "Fortgeschrittener Modus (Strg + E)";
    out.creation_newPadModalDescription = "Klicke auf einen Pad-Typ, um das entsprechende Pad zu erstellen. Du kannst auch die <b>Tab</b>-Taste für die Auswahl und die <b>Enter</b>-Taste zum Bestätigen benutzen.";
    out.creation_newPadModalDescriptionAdvanced = "Du kannst das Kästchen markieren (oder den Wert mit der Leertaste ändern), um den Dialog bei der Pad-Erstellung anzuzeigen (für eigene oder auslaufende Dokumente etc.).";
    out.creation_newPadModalAdvanced = "Dialog bei der Pad-Erstellung anzeigen";

    // Password prompt on the loading screen
    out.password_info = "Das Pad, das du öffnen möchtest, ist mit einem Passwort geschützt. Gib das richtige Passwort ein, um den Inhalt anzuzeigen.";
    out.password_error = "Pad nicht gefunden!<br>Dieser Fehler kann zwei Ursachen haben: Entweder ist das Passwort ungültig oder das Pad wurde vom Server gelöscht.";
    out.password_placeholder = "Gib das Passwort hier ein...";
    out.password_submit = "Abschicken";
    out.password_show = "Anzeigen";

    // Change password in pad properties
    out.properties_addPassword = "Passwort hinzufügen";
    out.properties_changePassword = "Passwort ändern";
    out.properties_confirmNew = "Bist du sicher? Das Hinzufügen eines Passworts wird die URL dieses Pads ändern und den Verlauf löschen. Benutzer ohne das Passwort werden den Zugang zu diesem Pad verlieren.";
    out.properties_confirmChange = "Bist du sicher? Das Ändern des Passworts wird den Verlauf löschen. Benutzer ohne das neue Passwort werden den Zugang zu diesem Pad verlieren.";
    out.properties_passwordSame = "Das neue Passwort muss sich von dem alten Passwort unterscheiden.";
    out.properties_passwordError = "Beim Versuch das Passwort zu ändern ist ein Fehler aufgetreten. Bitte versuche es nochmal.";
    out.properties_passwordWarning = "Das Passwort wurde erfolgreich geändert, aber dein CryptDrive konnte nicht aktualisiert werden. Du musst möglicherweise die alte Version des Pads manuell entfernen.<br>Klicke auf OK, um die Seite neu zu laden und die Zugriffsrechte zu aktualisieren.";
    out.properties_passwordSuccess = "Das Passwort wurde erfolgreich geändert.<br>Klicke auf OK, um die Seite neu zu laden und die Zugriffsrechte zu aktualisieren.";
    out.properties_changePasswordButton = "Absenden";

    // New share modal
    out.share_linkCategory = "Link teilen";
    out.share_linkAccess = "Zugriffsrechte";
    out.share_linkEdit = "Bearbeiten";
    out.share_linkView = "Ansehen";
    out.share_linkOptions = "Linkoptionen";
    out.share_linkEmbed = "Einbettungsmodus (Werkzeugleiste und Benutzerliste sind verborgen)";
    out.share_linkPresent = "Anzeigemodus (Bearbeitbare Abschnitte sind verborgen)";
    out.share_linkOpen = "In einem neuen Tab öffnen";
    out.share_linkCopy = "In die Zwischenablage kopieren";
    out.share_embedCategory = "Einbetten";
    out.share_mediatagCopy = "Media-Tag in die Zwischenablage kopieren";

    // Loading info
    out.loading_pad_1 = "Initialisiere Pad";
    out.loading_pad_2 = "Lade Pad-Inhalt";
    out.loading_drive_1 = "Lade Daten";
    out.loading_drive_2 = "Aktualisiere Datenformat";
    out.loading_drive_3 = "Verifiziere Datenintegrität";

    // Shared folders
    out.sharedFolders_forget = "Dieses Pad ist nur in einem geteilten Ordner gespeichert. Du kannst es nicht in den Papierkorb verschieben. Aber du kannst es in deinem CryptDrive löschen.";
    out.sharedFolders_duplicate = "Einige zu verschiebende Pads waren schon im Zielordner geteilt.";
    out.sharedFolders_create = "Erstelle einen geteilten Ordner";
    out.sharedFolders_create_name = "Neuer Ordner";
    out.sharedFolders_create_owned = "Eigener Ordner";
    out.sharedFolders_create_password = "Ordnerpasswort";
    out.sharedFolders_share = "Teile diese URL mit anderen registrierten Benutzern, um ihnen Zugriff auf den geteilten Ordner zu geben. Sobald sie diese URL öffnen, wird der geteilte Ordner zu ihrem CryptDrive hinzugefügt.";

    out.chrome68 = "Anscheinend benutzt du Chrome oder Chromium in Version 68. Ein darin enthaltener Fehler führt dazu, dass nach ein paar Sekunden die Seite komplett weiß wird oder nicht mehr auf Klicks reagiert. Um das Problem zu beheben, wechsle den Tab und kehre zu CryptPad zurück, oder versuche zu scrollen. Dieser Fehler sollte in der nächsten Version deines Browsers behoben sein.";

    // Manual pad storage popup
    out.autostore_file = "Diese Datei";
    out.autostore_sf = "Dieser Ordner";
    out.autostore_pad = "Dieses Dokument";
    out.autostore_notstored = "{0} ist nicht in deinem CryptDrive. Möchtest du es jetzt dort speichern?";
    out.autostore_settings = "Du kannst die automatische Speicherung in deinen <a href=\"/settings/\">Einstellungen</a> aktivieren!";
    out.autostore_store = "Speichern";
    out.autostore_hide = "Nicht speichern";
    out.autostore_error = "Unerwarteter Fehler: Wir konnten das Pad nicht speichern, bitte versuche es nochmal.";
    out.autostore_saved = "Das Pad wurde erfolgreich in deinem CryptDrive gespeichert!";
    out.autostore_forceSave = "Speichere die Datei in deinem CryptDrive"; // File upload modal
    out.autostore_notAvailable = "Du musst dieses Pad in deinem CryptDrive speichern, bevor du diese Funktion benutzen kannst."; // Properties/tags/move to trash

    // Crowdfunding messages
    out.crowdfunding_home1 = "CryptPad braucht deine Hilfe!";
    out.crowdfunding_home2 = "Klicke auf die Schaltfläche, um mehr über die Crowdfunding-Kampagne zu erfahren.";
    out.crowdfunding_button = "Unterstütze CryptPad";

    out.crowdfunding_popup_text = "<h3>Wir brauchen deine Hilfe!</h3>" +
                                  "Um sicherzustellen, dass CryptPad weiter aktiv entwickelt wird, unterstütze bitte das Projekt über die " +
                                  '<a href="https://opencollective.com/cryptpad">OpenCollective Seite</a>, wo du unsere <b>Roadmap</b> und <b>Funding-Ziele</b> lesen kannst.';
    out.crowdfunding_popup_yes = "OpenCollective besuchen";
    out.crowdfunding_popup_no = "Nicht jetzt";
    out.crowdfunding_popup_never = "Nicht mehr darum bitten.";

    return out;
});
