  define(function () {
      var out = {};

      // translations must set this key for their language to be available in
      // the language dropdowns that are shown throughout Cryptpad's interface
      out._languageName = 'German';

      out.main_title = "Cryptpad: Echtzeitzusammenarbeit ohne Preisgabe von Informationen";
      out.main_slogan = "Einigkeit ist Stärke - Zusammenarbeit der Schlüssel"; // Der Slogan sollte evtl. besser englisch bleiben.

      out.type = {};
      out.type.pad = 'Pad';
      out.type.code = 'Code';
    out.type.poll = 'Umfrage';
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

    // NOTE: Remove updated_0_ if we need an updated_1_
    out.updated_0_common_connectionLost = "<b>Die Verbindung zum Server ist abgebrochen</b><br>Sie verwenden jetzt das Dokument schreibgeschützt, bis die Verbindung wieder funktioniert.";
    out.common_connectionLost = out.updated_0_common_connectionLost;

    out.websocketError = 'Verbindung zum Websocket fehlgeschlagen...';
    out.typeError = "Dieses Dokument ist nicht mit dem Programm kompatibel";
    out.onLogout = 'Sie sind ausgeloggt. {0}Klicken Sie hier{1}, um wieder einzuloggen,<br>oder drucken Sie die <em>Escape</em>taste, um ihr Dokument schreibgeschützt zu benutzen.';
    out.wrongApp = "Der Inhalt dieser Echtzeitsitzung kann nicht in ihrem Browser angezeigt werden. Bitte laden Sie die Seite neu.";
    out.padNotPinned = 'Dieses Dokument wird nach 3 Monaten ohne Zugang auslaufen, {0}loggen Sie sich ein{1} or {2}registrieren Sie sich{3}, um das Auslaufen zu verhindern.';
    out.anonymousStoreDisabled = "Der Webmaster dieses CryptPad Server hat die anonyme Verwendung deaktiviert. Sie müssen sich einloggen, um CryptDrive zu verwenden.";
    out.expiredError = 'Dieses Dokument ist abgelaufen und ist nicht mehr verfügbar.';
    out.deletedError = 'Dieses Dokument wurde von seinem Besitzer gelöscht ust nicht mehr verfügbar.';
    out.inactiveError = 'Dieses Dokument ist gelöscht wegen Inaktivität gelöscht worden. Drucken Sie auf die Esc-Taste, um ein neues Dokument zu gestalten.';
    out.chainpadError = 'Ein kritischer Fehler hat stattgefunden, bei den Updates ihres Dokuments. Dieses Dokument ist schreibgeschützt, damit Sie sicher machen können, dass keine Inhalt verloren geht.<br>'+
                        'Drucken Sie auf <em>Esc</em>, um das Dokument schreibgeschützt zu lesen , oder laden Sie neu, um das Editierien wiederanzufangen.';
    out.errorCopy = ' Sie können noch den Inhalt woanders kopieren, nachdem Sie <em>Esc</em> drucken.<br>Wenn Sie die Seite verlassen, verschwindet der Inhalt für immer!';

    out.loading = "Laden...";
    out.error = "Fehler";
    out.saved = "Gespeichert";
    out.synced = "Alles gespeichert";
    out.deleted = "Dokumente, die von ihrem CryptDrive gelöscht wurden";
    out.deletedFromServer = "Dokumente, die vom Server gelöscht wurden";

    out.realtime_unrecoverableError = "Das Echtzeitengine hat ein nicht-reparierbaren Fehler getroffen. Klicken Sie OK, um neuzuladen.";

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
    out.userlist_offline = "Sie sind aktuell offline, die Benutzerliste ist nicht verfügbar.";

    out.language = "Sprache";

    out.comingSoon = "Kommt bald...";

    out.newVersion = '<b>CryptPad wurde aktualisiert!</b><br>' +
                     'Entdecken Sie, was neu in dieser Version ist:<br>'+
                     '<a href="https://github.com/xwiki-labs/cryptpad/releases/tag/{0}" target="_blank">Release notes for CryptPad {0}</a>';

    out.upgrade = "aufrüsten";
    out.upgradeTitle = "Rüsten Sie ihr Konto auf, um mehr Speicherplatz zu haben";

    out.upgradeAccount = "Konto aufrüsten";
    out.MB = "MB";
    out.GB = "GB";
    out.KB = "KB";

    out.supportCryptpad = "CryptPad unterstützen";

    out.formattedMB = "{0} MB";
    out.formattedGB = "{0} GB";
    out.formattedKB = "{0} KB";

      out.greenLight = "Alles funktioniert bestens";
      out.orangeLight = "Deine langsame Verbindung kann die Nutzung beinträchtigen";
      out.redLight = "Du wurdest von dieser Sitzung getrennt";

    out.pinLimitReached = "Sie haben ihre Speicherplatzgrenze erreicht";
    out.updated_0_pinLimitReachedAlert = "Sie haben ihre Speicherplatzgrenze erreicht. Neue Dokumente werden nicht mehr in ihrem CryptDrive gespeichert.<br>" +
        'Sie können entweder Dokument von ihrem CryptDrive wegnehmen oder <a href="https://accounts.cryptpad.fr/#!on={0}" target="_blank">ein Premiumagenbot anfordern</a>, damit ihre Grenze erhöht wird.';
    out.pinLimitReachedAlert = out.updated_0_pinLimitReachedAlert;
    out.pinLimitReachedAlertNoAccounts = out.pinLimitReached;
    out.pinLimitNotPinned = "Sie haben ihre Speicherplatzgrenze erreicht.<br>"+
                            "Dieses Dokument ist nicht in ihrem CryptDrive gespeichert.";
    out.pinLimitDrive = "Sie haben ihre Speicherplatzgrenze erreicht.<br>" +
                        "Sie können keine neue Dokumente gestalten.";

    out.moreActions = "Mehr Aktionen";

    out.importButton = "Importieren";
      out.importButtonTitle = 'Importiere eine lokale Datei in dieses Dokument';

    out.exportButton = "Exportieren";
      out.exportButtonTitle = 'Exportiere dieses Dokument in eine lokale Datei';
      out.exportPrompt = 'Wie möchtest du die Datei nennen?';

      out.changeNamePrompt = 'Ändere deinen Namen (oder lasse dieses Feld leer um anonym mitzuarbeiten): ';
    out.user_rename = "Bearbeite dein Name";
    out.user_displayName = "Name";
    out.user_accountName = "Kontoname";

      out.clickToEdit = "Zum Bearbeiten klicken";
    out.saveTitle = "Bitte gebe das Titel ein (enter)";

      out.forgetButtonTitle = 'Entferne dieses Dokument von deiner Startseitenliste';
    out.forgetButtonTitle = 'Dieses Dokument zum Papierkorb verschieben';
      out.forgetPrompt = 'Mit dem Klick auf OK wird das Dokument aus deinem lokalen Speicher gelöscht. Fortfahren?';
    out.movedToTrash = 'Dieses Dokument liegt im Papierkorb.<br><a href="/drive/">Zum CryptDrive</a>';

      out.shareButton = 'Teilen';
      out.shareSuccess = 'Die URL wurde in die Zwischenablage kopiert';

    out.userListButton = "Benutzerliste";

    out.userAccountButton = "Ihr Konto";

    out.newButton = 'Neu';
    out.newButtonTitle = 'Neues Dokument gestalten';
    out.uploadButton = 'Hochladen';
    out.uploadButtonTitle = 'Eine neue Datei ins aktuelle Ordner hochladen';

    out.saveTemplateButton = "Als Vorlage speichern";
    out.saveTemplatePrompt = "Bitte gib ein Titel für die Vorlag ein";
    out.templateSaved = "Vorlage gespeichert!";
    out.selectTemplate = "Bitte wähle eine Vorlage oder drucke die Esc Taste";
    out.useTemplate = "Mit einer Vorlage starten?"; //Would you like to "You have available templates for this type of pad. Do you want to use one?";
    out.useTemplateOK = 'Wähle ein Template (Enter)';
    out.useTemplateCancel = 'Frisch starten (Esc)';
    out.template_import = "Eine Vorlage importieren";
    out.template_empty = "Keine Vorlage verfügbar";

    out.previewButtonTitle = "Der Markdownvorschau (un)sichtbar machen";

    out.presentButtonTitle = "Zum Präsentationsmodus wechseln";

    out.backgroundButtonTitle = 'Hintergrundfarbe';
    out.colorButtonTitle = 'Die Hintergrundfrabe des Präsentationsmodus bearbeiten';

    out.propertiesButton = "Eigenschaften";
    out.propertiesButtonTitle = 'Die Eigenschaften des Dokuments ansehen';

    out.printText = "Drucken";
    out.printButton = "Drucken (enter)";
    out.printButtonTitle = "Deine Folien ausdrucken oder sie als PDF Dateien exportieren";
    out.printOptions = "Druckeinstellungen";
    out.printSlideNumber = "Foliennummer anzeigen";
    out.printDate = "Datum anzeigen";
    out.printTitle = "Titel der Präsentation anzeigen";
    out.printCSS = "Custom CSS Regeln (CSS):";
    out.printTransition = "Animierte Transitionen aktivieren";
    out.printBackground = "Ein Hintergrundbild verwenden";
    out.printBackgroundButton = "Bitte ein Bild wählen";
    out.printBackgroundValue = "<b>Aktueller Hintergrund:</b> <em>{0}</em>";
    out.printBackgroundNoValue = "<em>Kein Hintergrundbild gewählt</em>";
    out.printBackgroundRemove = "Das Hintergrundbild wählen";

    out.filePickerButton = "Eine Datei ihres CryptDrives einbetten";
    out.filePicker_close = "Schliessen";
    out.filePicker_description = "Bitte wähle eine Datei aus ihrem CryptDrive oder lade eine neue hoch";
    out.filePicker_filter = "Namensfilter";
    out.or = 'oder';

    out.tags_title = "Tags (for you only)";
    out.tags_add = "Die Tags dieser Seite bearbeiten";
    out.tags_searchHint = "Dateien mit Tags in ihrem CryptDrive suchen";
    out.tags_searchHint = "Die Suche mit dem Tag # in ihrem CryptDrive starten.";
    out.tags_notShared = "Ihre Tags sind nicht mit anderen Benutzern geteilt";
    out.tags_duplicate = "Doppeltes Tag: {0}";
    out.tags_noentry = "Du kannst ein Tag auf einem gelöschten Dokument nicht hinzufügen!";

    out.slideOptionsText = "Einstellungen";
    out.slideOptionsTitle = "Präsentationseinstellungen";
    out.slideOptionsButton = "Speichern (enter)";
    out.slide_invalidLess = "Ungültiges Custom-Stil";

    out.languageButton = "Sprache";
    out.languageButtonTitle = "Bitte wähle die Sprache für die Syntaxhervorhebung";
    out.themeButton = "Farbschema";
    out.themeButtonTitle = "Wähle das Farbschema um Kode und Folieneditor darzustellen";

      out.editShare = "Mitarbeits-URL teilen";
      out.editShareTitle = "Mitarbeits-URL in die Zwischenablage kopieren";
    out.editOpen = "Die Mitarbeit-RUL in ein neues Tab öffnen";
    out.editOpenTitle = "Öffne dieses Dokument in Mitarbeitmodus in einem neuem Tab";
      out.viewShare = "Schreibgeschützt-URL teilen";
      out.viewShareTitle = "Schreibgeschützt-URL in die Zwischenablage kopieren";
      out.viewOpen = "In neuem Tab anzeigen";
      out.viewOpenTitle = "Dokument schreibgeschützt in neuem Tab öffnen.";
    out.fileShare = "Link kopieren";
    out.getEmbedCode = "Einbettungscode anzeigen";
    out.viewEmbedTitle = "Das Dokument in einer externe Webseite einbetten";
    out.viewEmbedTag = "Um dieses Dokument einzubetten, benutzen Sie dieses iframe in ihrer HTML Seite, wie Sie es wollen. Sie können mit CSS oder HTML Attributen das Still erweitern";
    out.fileEmbedTitle = "Die Datei in einer externen Seite einbetten";
    out.fileEmbedScript = "Um diese Datei einzubetten, bringen Sie dieses Skript einmal in ihrer Webseite, damit das Media-Tag geladen wird:";
    out.fileEmbedTag = "Dann könnnen Sie das Media-Tag, wo Sie wollen auf ihrer Seite platzieren:";

    out.notifyJoined = "{0} ist in der Mitarbeit-Sitzung ";
    out.notifyRenamed = "{0} ist jetzt als {1} bekannt";
    out.notifyLeft = "{0} hat die Mitarbeit-Sitzung verlassen";

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
    out.history_goTo = "Zur genannten Version wechseln";
    out.history_close = "Zurück";
    out.history_closeTitle = "Verlauf schliessen";
    out.history_restore = "wiederherstellen";
    out.history_restoreTitle = "Die gewählte Version des Dokuments wiederherstellen";
    out.history_restorePrompt = "Bist du sicher, dass du die aktuelle Version mit der angezeigten ersetzen möchtest?";
    out.history_restoreDone = "Version wiederhergestellt";
    out.history_version = "Version:";

    // Ckeditor
    out.openLinkInNewTab = "Link im neuen Tab öffnen";
    out.pad_mediatagTitle = "Media-Tag Einstellungen";
    out.pad_mediatagWidth = "Breite (px)";
    out.pad_mediatagHeight = "Höhe (px)";

      // Polls

      out.poll_title = "Datumsplaner ohne Preisgabe von Infos";
      out.poll_subtitle = "<em>Echtzeit</em>-planen ohne Preisgabe von Infos";

      out.poll_p_save = "Deine Einstellungen werden sofort automatisch gesichert.";
      out.poll_p_encryption = "Alle Eingaben sind verschlüsselt, deshalb haben nur Leute im Besitz des Links Zugriff. Selbst der Server sieht nicht was du änderst.";

      out.wizardLog = "Klicke auf den Button links oben um zur Umfrage zurückzukehren.";
      out.wizardTitle = "Nutze den Assistenten um deine Umfrage zu erstellen.";
      out.wizardConfirm = "Bist du wirklich bereit die angegebenen Optionen bereits zu deiner Umfrage hinzuzufügen?";


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
      out.poll_descriptionHint = "Beschreibe deine Abstimmung und publiziere sie mit dem 'Veröffentlichen'-Knopf wenn du fertig bis."+
			" Die Beschreibung kann mit dem Markdown Syntax geschrieben werden und du kannst Media-Elemente von deinem CryptPad einbetten." +
			"Jeder mit dem Link kann die Beschreibung ändern, aber es iet kine gute Praxis.";

    out.poll_remove = "Entfernen";
    out.poll_edit = "Bearbeiten";
    out.poll_locked = "Gesperrt";
    out.poll_unlocked = "Editierbar";

    out.poll_bookmark_col = 'Setze ein Lesezeichen auf dieser Spalte, damit sie immer editierbar und links immer für dich erscheint.';
    out.poll_bookmarked_col = 'Dieses ist die Splate mit Lesezeichen für  dich. Es wird immer editierbar und links für dich angezeigt.';
    out.poll_total = 'SUMME';

    out.poll_comment_list = "Komentare";
    out.poll_comment_add = "Ein Kommentar hinzufügen";
    out.poll_comment_submit = "Schicken";
    out.poll_comment_remove = "Dieses Kommentar entfernen";
    out.poll_comment_placeholder = "Dein Kommentar";

    out.poll_comment_disabled = "Diese Umfrage mit dem ✓ Knopf veröffentlichen, damit die Kommentare möglich sind.";

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
    out.profile_namePlaceholder = 'Angezeigte name';
    out.profile_avatar = "Avatar";
    out.profile_upload = " Ein neues Avatar hochladen";
    out.profile_uploadSizeError = "Fehler: Dein Avatar muss kleiner als {0} sein";
    out.profile_uploadTypeError = "Fehler: Das Typ dieses Bild ist nicht unterestützt. Unterstütze Typen sind: {0}";
    out.profile_error = "Fehler bei der Erstellung ihres Profils: {0}";
    out.profile_register = "Du muss dich einloggen, um ein Profil zu erstellen!";
    out.profile_create = "Ein Profil erstellen";
    out.profile_description = "Beschreibung";
    out.profile_fieldSaved = 'Neuer Wert gespeichert: {0}';

    out.profile_inviteButton = "Sich in Verbindung setzen";
    out.profile_inviteButtonTitle ='Ein Link erstellen, damit dieser Benutzer sich mit dir in Verbindung setzt.';
    out.profile_inviteExplanation = "Ein Klick auf  <strong>OK</strong> wird ein Link erstellen, dass eine sichere Chatsession nur mit {0} erlaubt.<br></br>Dieses Link kann öffentlich gepostet werden."; 
    out.profile_viewMyProfile = "Mein Profil anzeigen";

    // contacts/userlist
    out.userlist_addAsFriendTitle = 'Benutzer "{0}" als Kontakt hinzufügen';
    out.userlist_thisIsYou = 'Das bist du ("{0}")';
    out.userlist_pending = "Wartet...";
    out.contacts_title = "Kontakte";
    out.contacts_addError = 'Fehler bei dem Hinzufügen des Kontakts in die Liste';
    out.contacts_added = 'Verbindungeinladung angenommen.';
    out.contacts_rejected = 'Verbindungeinladung abgelehnt';
    out.contacts_request = 'Benutzer <em>{0}</em> möchtet dich als Kontakt hinzufügen. <b>Annehmen<b>?';
    out.contacts_send = 'Schicken';
    out.contacts_remove = 'Dieses Kontakt entfernen';
    out.contacts_confirmRemove = 'Bist du sicher, dass du <em>{0}</em> von der Kontaktliste entfernen möchtest?';
    out.contacts_typeHere = "Gebe eine Nachricht ein...";

    out.contacts_info1 = "Diese ist deine Kontaktliste. Ab hier, kannst du:";
    out.contacts_info2 = "Auf dem Avatar eines Kontakts, um mit diesem Benutzer zu chatten";
    out.contacts_info3 = "Das Avatar doppelklicken, um sein Profil zu sichten";
    out.contacts_info4 = "Jede Teilnehmer, kann den Chatverlauf löschen";

    out.contacts_removeHistoryTitle = 'Den Chatverlauf löschen';
    out.contacts_confirmRemoveHistory = 'Bist du sicher, den Chatverlauf komplett zu löschen? Die Daten sind dann weg.';
    out.contacts_removeHistoryServerError = 'Es gab ein Fehler bei dem Löschen des Chatverlaufs. Versuche es noch einmal später';
    out.contacts_fetchHistory = "Den früheren Verlauf laden";

    // File manager

    out.fm_rootName = "Dokumente";
    out.fm_trashName = "Papierkorb";
    out.fm_unsortedName = "Dateien (ohne Ordnung)";
    out.fm_filesDataName = "Alle Dateien";
    out.fm_templateName = "Vorlagen";
    out.fm_searchName = "Suchen";
    out.fm_recentPadsName = "Zuletzt geöffnete Dokumente";
    out.fm_ownedPadsName = "Eigene";
    out.fm_searchPlaceholder = "Suchen...";
    out.fm_newButton = "Neu";
    out.fm_newButtonTitle = "Ein neues Dokument oder Ordner gestalten, oder eine Datei in dem aktuellen Ordner importiere";
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
    out.fm_removeSeveralPermanentlyDialog = "Bist sicher, diese {0} Elemente dauerhaft aus deinem CryptDrive zu entfernen?";
    out.fm_removePermanentlyDialog = "Bist sicher, dieses Element dauerhaft aus deinem CryptDrive zu entfernen?";
    out.fm_removeSeveralDialog = "Bist du sicher, diese {0} Element aus dem Papierkorb zu entfernen?";
    out.fm_removeDialog = "Bist sicher, {0} zum Papierkorb zu verschieben?";
    out.fm_deleteOwnedPad = "Bist du sicher, dieses Dokument aus dem Server dauerhaft zu löschen?";
    out.fm_deleteOwnedPads = "Bist du sicher, dass du diese Dokumente dauerhaft aus dem Server entfernen möchtests?";
    out.fm_restoreDialog = "Bist du sicher, dass du {0} zurück zum originalen Ordner verschieben möchtests?";
    out.fm_unknownFolderError = "Der Ordner, der gerade gewählt oder letzlich besucht wurde, existiert nicht mehr. Der Parentordner wird geöffnet...";
    out.fm_contextMenuError = "Fehler bei der Öfnnung des Kontextmenü für dieses Element. Wenn dieses Problem wieder kommt, versuche die Seite neuzuladen.";
    out.fm_selectError = "Fehler bei der Selektierung des Zielelements. Wenn dieses Problem wieder kommt, versuche die Seite neuzuladen.";
    out.fm_categoryError = "Fehler bei dem Öffnen der selektierten Kategorie. Der Wurzel wird angezeigt.";
    out.fm_info_root = "Gestalte hier soviele Ordnern, wie du willst, um deine Dateien und Dokumente zu organisieren.";
    out.fm_info_unsorted = 'Hier sind alle Dateien, die du besucht hast, noch nicht in "Dokumente" sortiert sind oder zum Papierkorb verschoben wurden.';
    out.fm_info_template = 'Hier sind alle Dokumente, die als Vorlage gespeichert wurden und die du wiederverwenden kannst, um ein neues Dokument zu erstellen.';
    out.fm_info_recent = "Liste der zuletzt geöffnete Dokumente.";
    out.updated_0_fm_info_trash = 'Leere den Papierkorb, um mehr freien Platz in deinem CryptDrive zu erhalten.';
    out.fm_info_trash = out.updated_0_fm_info_trash;
    out.fm_info_allFiles = 'Beinhaltet alle Dateien von "Dokumente", "Unklassifiziert" und "Papierkorb". Dateien können hier nicht verschoben werden.';
    out.fm_info_anonymous = 'Du bist nicht eingeloggt, daher laufen die Dokumente nach 3 Monaten aus (<a href="https://blog.cryptpad.fr/2017/05/17/You-gotta-log-in/" target="_blank">mehr dazu lesen</a>). ' +
                            'Zugang zu den Dokumenten ist in deinem Browser gespeichert, daher wir das Löschen des Browserverlaufs auch die Dokumente verschwinden lassen.<br>' +
                            '<a href="/register/">Registriere dich</a> oder <a href="/login/">logge dich ein</a>, um sie dauerhaft zu machen.<br>';
    out.fm_info_owned = "Diese Dokumente sind deine eigene. Das heisst, dass du sie vom Server entfernen kannst, wann du willst. Wenn du das machst, dann werden auch andere Benutzer diese Dokumente nicht mehr erreichen.";
    out.fm_alert_backupUrl = "Backuplink für dieses CryptDrive.<br>" +
                             "Es ist <strong>hoch empfohlen</strong> dieses Link geheim zu halten.<br>" +
                             "Du kannst es benutzen, um deine gesamte Dateien abzurufen, wenn dein Browserspeicher gelöscht wurde.<br>" +
                             "Jede Person, die dieses Link hat, kann die Dateien in deinem CryptDrive bearbeiten oder löschen.<br>";
    out.fm_alert_anonymous = "Hallo, du benutzt CryptPad anonym. Das ist in Ordnung aber Dokumente können nach einer Inaktivitätsperiode gelöscht werden. " +
 							 "Wir haben fortgeschrittene Aktionen aus dem anonymen CryptDrive entfern, weil wir klar machen wollen, dass es kein sicherer Platz ist, Dinge zu lagern." + 
							 'Du kannst <a href="https://blog.cryptpad.fr/2017/05/17/You-gotta-log-in/" target="_blank">lesen</a>, weshalb wir das machen und weshable du wirklich ' +
						     '<a href="/register/">registrieren</a> oder <a href="/login/">eingloggen</a> solltest.';
    out.fm_backup_title = 'Backup link';
    out.fm_nameFile = 'Wie soll diese Datei heissen?';
    out.fm_error_cantPin = "Interner Serverfehler. Bitte lade die Seite neu und versuche es wieder.";
    out.fm_viewListButton = "Listeansicht";
    out.fm_viewGridButton = "Kachelnansicht";
    out.fm_renamedPad = "Du hast ein spezielle Name für dieses Dokument gesetzt. Seine geteiltes Titel ist:<br><b>{0}</b>";
    out.fm_prop_tagsList = "Tags";
    out.fm_burnThisDriveButton = "Alle Informationen löschen , die CryptPad in deinem Browser hält";
    out.fm_burnThisDrive = "Bist du sicher, dass du alles, was CryptPad in deinem Browser hält löschen möchtest?<br>" +
                           "Das wird dein CryptDrive und seinen Verlauf von deinem Browser löschen, Dokumente werden noch auf unseres Server (verschlüsselt) bleiben.";
    out.fm_padIsOwned = "Dieses Dokument ist dein Eigenes";
    out.fm_padIsOwnedOther = "Dieses Dokument ist von einem anderen Benutzer";
    out.fm_deletedPads = "Dieses Dokument existiert nicht mehr auf dem Server, es wurde von deinem CryptDrive gelöscht: {0}";
    // File - Context menu
    out.fc_newfolder = "Neuer Ordner";
    out.fc_rename = "Unbenennen";
    out.fc_open = "Öffnen";
    out.fc_open_ro = "Öffnen (schreibgeschützt)";
    out.fc_delete = "Zum Papierkorb verschieben";
    out.fc_delete_owned = "Vom Server löschen";
    out.fc_restore = "Restaurieren";
    out.fc_remove = "Von deinem CryptDrive entfernen";
    out.fc_empty = "Den Papierkorb leeren";
    out.fc_prop = "Eigenschaften";
    out.fc_hashtag = "Tags";
    out.fc_sizeInKilobytes = "Grösse in Kilobytes";
    // fileObject.js (logs)
    out.fo_moveUnsortedError = "Du kannst, ein Ordner nicht in die Liste von allen Pads verschieben";
    out.fo_existingNameError = "Dieser Dokumentname ist in diesem Verzeichnis schon da. Bitte wähle einen Anderen.";
    out.fo_moveFolderToChildError = "Du kannst ein Ordner nicht in eine seine Nachfolgern verchieben";
    out.fo_unableToRestore = "Ein Fehler ist aufgetreten, um diese Datei zu seinem Herkunftordner zu verschieben. Du kannst probieren, diese zu einem anderen Ordner zu verschieben.";
    out.fo_unavailableName = "Ein Dokument oder Ordner mit dem selben Name existiert in diesem Ordner schon. Bitte benenne zuerst um, und versucht wieder zu verschieben.";

    out.fs_migration = "Dein CryptDrive wird gerade zu einer neueren Version aktualisiert. Daher muss die Seite neugeladen werden.<br><strong>Bite lade die Seite neu, um sie weiter zu verwenden.</strong>";

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

    out.login_hashing = "Dein Passwort wird gerade durchgerechnet, das kann etwas dauert.";

    out.login_hello = 'Hallo {0},'; // {0} is the username
    out.login_helloNoName = 'Hallo,';
    out.login_accessDrive = 'Dein CryptDrive ansehen';
    out.login_orNoLogin = 'oder';

    out.login_noSuchUser = 'Ungültiger Benutzername oder Passwort. Versuche es erneute oder registriere';
    out.login_invalUser = 'Der Benutzername kann nicht leer sein';
    out.login_invalPass = 'Der Passwort kann nicht leer sein';
    out.login_unhandledError = 'Ein Fehler ist aufgetreten:(';

    out.register_importRecent = "Die Dokumente aus deiner anonymen Sitzung importieren";
    out.register_acceptTerms = "Ich bin mit den <a href='/terms.html' tabindex='-1'>Servicebedingungen</a> einverstanden";
    out.register_passwordsDontMatch = "Passwörter sind nicht gleich!";
    out.register_passwordTooShort = "Passwörter müssen mindestens {0} Buchstaben haben.";

    out.register_mustAcceptTerms = "Du musst mit den Servicebedingungen einverstanden sein.";
    out.register_mustRememberPass = "Wir können dein Passwort nicht zurücksetzen, im Fall dass du dieses vergisst. Es ist äusserst wichtig, dass du dieses erinnerst! Bitte ticke das Kästchen ein.";

    out.register_whyRegister = "Wieso sollst du dich registrieren?";
    out.register_header = "Willkommen zu CryptPad";
    out.register_explanation = [
        "<h3>Lass uns ein Paar Punkte überprüfen:</h3>",
        "<ul class='list-unstyled'>",
            "<li><i class='fa fa-info-circle'> </i> Dein Passwort ist dein Geheimnis, um alle deine Dokumente zu verschlüsseln. Wenn du es verlierst, gibt es keine Methode die Daten zurückzufinden.</li>",
            "<li><i class='fa fa-info-circle'> </i> Du kannst die Dokumente, die du letzlich angesehen hast importieren, damit sind sie in deinem CryptDrive.</li>",
            "<li><i class='fa fa-info-circle'> </i> Wenn du auf einem geteilten Rechner bist, muss du ausloggen, wenn du fertig bist. Es ist nicht ausreichend, die Browserfensters (oder das Browser) zu schliessen.</li>",
        "</ul>"
    ].join('');

    out.register_writtenPassword = "Ich habe meinen Benutzername und Passwort notiert. Weiter geht's.";
    out.register_cancel = "Zurück";

    out.register_warning = "\"Ohne Preisgabe von Information\" heisst, dass wir keine Methode haben, wenn du dein Passwort verlierst.";

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
    out.settings_backupTitle = "Eine Backup erstellen oder die Daten restaurieren";
    out.settings_backup = "Backup";
    out.settings_restore = "Restaurieren";

    out.settings_resetNewTitle = "CryptDrive säubern";
    out.settings_resetButton = "Löschen";
    out.settings_reset = "Alle Dateien und Ordnern aus ihrem CryptDrive löschen";
    out.settings_resetPrompt = "Diese Aktion wird alle Dokumente deines CryptDrives entfernen.<br>"+
                               "Bist du sicher, dass du es tun möchtest?<br>" +
                               "Gebe <em>I love CryptPad</em> ein, um zu bestätigen."; // TODO: I love CryptPad should be localized
    out.settings_resetDone = "Dein CryptDrive ist jetzt leer!";
    out.settings_resetError = "Prüftext inkorrekt. Dein CryptDrive wurde nicht verändert.";

    out.settings_resetTipsAction = "Zurücksetzen";
    out.settings_resetTips = "Tipps";
    out.settings_resetTipsButton = "Die Tipps für CryptDrive zurücksetzen";
    out.settings_resetTipsDone = "Alle Tipps sind wieder sichtbar.";

    out.settings_thumbnails = "Vorschaubilder";
    out.settings_disableThumbnailsAction = "Die Gestaltung von Vorschaubilder in deinem CryptPad deaktivieren";
    out.settings_disableThumbnailsDescription = "Vorschaubilder sind automatisch erstellt und gespeichert in deinem Browser, wenn du ein Dokument besuchst. Du kannst dieses Feature hier deaktivieren.";
    out.settings_resetThumbnailsAction = "Entfernen";
    out.settings_resetThumbnailsDescription = "Alle Vorschaubilder entfernen, die in deinem Browser gespeichert sind.";
    out.settings_resetThumbnailsDone = "Alle Vorschaubilder sind entfern worden.";

    out.settings_importTitle = "Importierie die neulich besuchte Dokumente in deinem CryptDrive";
    out.settings_import = "Importieren";
    out.settings_importConfirm = "Bist du sicher, dass du die neulich besuchte Dokumente in deinem Konto importieren möchtest??";
    out.settings_importDone = "Import erledigt";

    out.settings_userFeedbackTitle = "Rückmeldung";
    out.settings_userFeedbackHint1 = "CryptPad gibt grundlegende Rückmeldungen zum Server. Es erlaubt uns, wie wir ihre Erfahrung verbessern können.";
    out.settings_userFeedbackHint2 = "Der Inhalt deiner Dokumente wird nie mit dem Server geteilt.";
    out.settings_userFeedback = "Rückmeldungen aktivieren";

    out.settings_deleteTitle = "Löschung des Kontos";
    out.settings_deleteHint = "Die Löschung eines Kontos ist dauerhaft. Dein CryptDrive und eigene Dokmente werden alle von dem Server gelöscht. Die restliche Dokumente werden nach 90 Tage gelöscht, wenn keine andere diese bei sich gelagert haben.";
    out.settings_deleteButton = "Dein Konto löschen";
    out.settings_deleteModal = "Gebe die folgende Information zu deinem CryptPad Adminstrator, damit er die Daten vom Server löschen kann.";
    out.settings_deleteConfirm = "OK klicken wird dein Konto dauerhaft löschen. Bist du sicher?";
    out.settings_deleted = "Dein Konto ist jetzt gelöscht. Drucke OK, um zum Homepage zu gelingen.";

    out.settings_anonymous = "Du bist nicht eingeloggt. Die Einstellungen hier sind spezifisch zu deinem Browser.";
    out.settings_publicSigningKey = "Öffentliche Schlüssel zum Unterschreiben";

    out.settings_usage = "Verbrauch";
    out.settings_usageTitle = "Die Gesamtgrösse deiner Dokumente in MB"; // TODO: pinned ??
    out.settings_pinningNotAvailable = "Genagelte Dokumente sind nur für angemeldete Benutzer verfügbar.";
    out.settings_pinningError = "Etwas ging schief";
    out.settings_usageAmount = "Ihre genagelte Dokumente verwenden {0}MB";

    out.settings_logoutEverywhereButton = "Ausloggen";
    out.settings_logoutEverywhereTitle = "Von jeden Browsers ausloggen";
    out.settings_logoutEverywhere = "Das Ausloggen in alle andere Websitzungen erzwingen";
    out.settings_logoutEverywhereConfirm = "Bist du sicher? Du wirdst auf allen deinen Geräten dich wieder einloggen müssen.";

    out.settings_codeIndentation = 'Einrücken für das Codeeditor (Leerzeichen)';
    out.settings_codeUseTabs = "Mit Tabs einrücken (anstatt mit Leerzeichen)";

    out.settings_padWidth = "Maximumgrösse des Editors";
    out.settings_padWidthHint = "Rich-text Dokumente benutzen normalerweise die grösste verfügbare Breite und es kann manchmal schwer lesebar sein. Du kannst die Breite des Editors hier reduzieren.";
    out.settings_padWidthLabel = "Die Breite des Editors reduzieren";

    out.settings_creationSkip = "Das Erstellungsdialg für neue Dokumente vermeiden";
    out.settings_creationSkipHint = "Dieses Erstellungsdialog erlaubt Einstellungen vorzunehmen, um mehr Sicherheit und Kontroll für deine Dokumente zu geben. Aber es kann manchaml dir verlangsam, da es eine zusätzliche Stufe verlange. Mit dieser Option kannst du die dieses Dialog vermeiden und die default-Einstellungen wählen.";
    out.settings_creationSkipTrue = "vermeiden";
    out.settings_creationSkipFalse = "anzeigen";

    out.settings_templateSkip = "Die Wahl der Template vermeiden";
    out.settings_templateSkipHint = "Wenn du ein neues Dokument erstellt, und wenn Vorlagen da sind, erscheint ein Dialog, wo du die Vorlage wählen kannst. Hier kannst du dieses Dialog vermeiden und somit keine Vorlage verwenden." 

    out.upload_title = "Datei hochladen";
    out.upload_rename = "Willst du einen neuen Name für <b>{0}</b> geben, bevor es zum Server hochgeladen wird?<br>" +
                        "<em>Die Dateieendung ({1}) wird automatisch hinzugefügt. "+
                        "Dieser Name bleibt für immer und wird für die andere Benutzer sichtbar.</em>";
    out.upload_serverError = "Serverfehler: Die Datei kann nicht aktuell hochgeladen werden. ";
    out.upload_uploadPending = "Ein anderes Hochladen passiert gerade. Willst du es abbrechen und deine neue Datei hochladen?";
    out.upload_success = "Deine Datei ({0}) wurde erfolgreich hochgeladen und in deinem CryptDrive hinzugefügt.";
    out.upload_notEnoughSpace = "Der verfügbare Volum auf deinem CryptDrive ist leider reicht nicht für diese Datei ausreichend.";
    out.upload_notEnoughSpaceBrief = "Unsaureichende Volum";
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
    out.mdToolbar_button = "Die Markdown Werkzeugsleiste anzeigen oder verbergen";
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
    out.mdToolbar_list = "Aufählung";
    out.mdToolbar_check = "Aufgabenliste";
    out.mdToolbar_code = "Code";

      // index.html


    //about.html
    out.main_about_p2 = 'Dieses Projekt verwendet <a href="http://ckeditor.com/">CKEditor</a> WYSIWYG Editor, <a href="https://codemirror.net/">CodeMirror</a>, sowie das <a href="https://github.com/xwiki-contrib/chainpad">ChainPad</a> echtzeit Engine.';

    out.main_howitworks_p1 = 'CryptPad verwendet ein alternative  <a href="https://en.wikipedia.org/wiki/Operational_transformation">Operational transformation</a> Algorithmus, der verteilt Konsens mit einem <a href="https://bitcoin.org/bitcoin.pdf">Nakamoto Blockchain</a> erreicht, eine Informationskonstrukt, was für <a href="https://en.wikipedia.org/wiki/Bitcoin">Bitcoin</a> bekannt wurde. Damit kann der Algorithmus ohne die Mitarbeit eines zentrales Server die Konflikte von Operational Transform lösen; dadurch kann der Server auch ohne Kenntnisse des Inhalts der Dokumente bleiben.';

    // contact.html
    out.main_about_p2 = 'Wenn du Fragen oder Kommentare hast, hören wir sie gern!<br/>Du kannst <a href="https://twitter.com/cryptpad"><i class="fa fa-twitter"></i>uns antweeten</a>, ein Issue öffnen <a href="https://github.com/xwiki-labs/cryptpad/issues/" title="Unser Issue-System">on <i class="fa fa-github"></i>GitHub</a>. Komm und sag hallo auf <a href="https://riot.im/app/#/room/#cryptpad:matrix.org" title="Matrix">our <i class="fa fa-comment"></i>der Matrix Kanal</a> or IRC (#cryptpad on irc.freenode.net), or <a href="mailto:research@xwiki.com"><i class="fa fa-envelope"></i>schick uns ein Email</a>.';
    out.main_about_p22 = 'Uns antweeten';
    out.main_about_p23 = 'ein Issue auf GitHub aufnehmen';
    out.main_about_p24 = 'Hallo sagen (Matrix)';
    out.main_about_p25 = 'uns ein Email schicken';
    out.main_about_p26 = 'Wenn du Fragen oder Kommentare hast, freuen wir davon zu hören!';

    out.main_info = "<h2>Vertrauenswürdige Kollaboration</h2> Lass deine Ideen wachsen während die <strong>ohne Preisangabe deiner Informationen</strong> Technologie deinen Datenschutz <strong>sogar gegenüber uns</strong> sichert.";
    out.main_catch_phrase = "Das Cloud ohne Preisangabe deiner Informationen";

    out.main_howitworks = 'Wie fukntioniert es';
    out.main_zeroKnowledge = 'Ohne Preisangebe deiner Informationen';
    out.main_zeroKnowledge_p = "Du brauchst nicht uns dein Vertrauen geben, dass wir deine Dokumente <em>nicht angucken werden</em>: Mit der Technologie können wir das einfach nicht. Erfahre mehr, wie wir <a href=\"\" title=\"Datenschutz\">dein Datenschutz und Sicherheit</a> sichern.";

    out.main_writeItDown = 'Runterschreiben';

    out.main_writeItDown_p = "Die grösste Projekte stammen aus den kleinsten Ideen. Schreibe runter deine Inspirationsmomente und unerwartete Ideen, da du nie weisst, welche ein Durchbruch sein wird.";
    out.main_share = 'Teile das Link, teile das Dokument';
    out.main_share_p = "Lasse deine Ideen gemeinsam wachsen: Führe effektive Treffen, kooperiere auf ToDo-Listen und mache kurze Vorträge mit alle deinen Bekannten und mit alle deinen Geräten.";
    out.main_organize = 'Organisiere dich';
    out.main_organize_p = "Mit CryptPad Drive kannst du deinen Übersicht auf das Wichtiges behalten. Ordnern erlauben, deine Projekte zu organisieren und einen Übersicht behalten, über was geht wo.";
    out.tryIt = 'Versuche es!';
    out.main_richText = 'Rich Text Editor';
    out.main_richText_p = 'Bearbeite Rich-Text kollaborativ mit unserem echtzeit <a href="http://ckeditor.com" target="_blank">CkEditor</a> ohne Preisangabe deiner Informationen app.';
    out.main_code = 'Code Editor';
    out.main_code_p = 'Bearbeite Code kollaborativ mit unseren echtzeit <a href="https://www.codemirror.net" target="_blank">CodeMirror</a> app ohne Preisangabe deiner Informationen.';
    out.main_slide = 'Präsentationeneditor';
    out.main_slide_p = 'Gestalte Präsentationen mit der Markdown Syntax und zeige sid im Browser an.';
    out.main_poll = 'Umfragen';
    out.main_poll_p = 'Plane ein Treffen oder ein Event, und lass die beste Wahl online treffen.';
    out.main_drive = 'CryptDrive';

    out.main_richTextPad = 'Rich Text Dokument';
    out.main_codePad = 'Markdown/Code Dokument';
    out.main_slidePad = 'Markdown Präsentation';
    out.main_pollPad = 'Umfrage oder Terminabstimmung';
    out.main_whiteboardPad = 'Whiteboard';
    out.main_localPads = 'Lokale Dokumente';
    out.main_yourCryptDrive = 'Dein CryptDrive';
    out.main_footerText = "Mit CryptPad, du kannst schnell kollaborative Dokumente erstellen, um Notizzen oder Ideen zusammen runterzuschreiben.";

    out.footer_applications = "Apps";
    out.footer_contact = "Kontakt";
    out.footer_aboutUs = "Über uns";

    out.about = "Über uns";
    out.privacy = "Datenschutz";
    out.contact = "Kontact";
    out.terms = "Servicebendingungen";
    out.blog = "Blog";

    out.topbar_whatIsCryptpad = "Was ist CryptPad";

    // what-is-cryptpad.html

    out.whatis_title = 'Was ist CryptPad';
    out.whatis_collaboration = 'Effektive und und leichte Kollaboration';
    out.whatis_collaboration_p1 = 'Mit CryptPad kannst du kollaborative Dokumente erstellen, um Notizzen und Ideen zusammen runterzuschreiben. Wenn du dich registrierst und loggst dich ein, kriegst die Möglichkeit Dateien hochzuladen, und Ordnern um alle deine Dokumente zu organisieren.';
    out.whatis_collaboration_p2 = 'Du kannst Zugang zu einem CryptPad teilen, indem du das Link teilst. Du kannst auch einen <em>schreibgeschützten</em> Zugang, um die Ergebnisse deiner kollaborativen Arbeit zu veröffentlichen, während du sie noch bearbeiten kannst.';
    out.whatis_collaboration_p3 = 'Du kannst Rich-Text Dokumente mit dem <a href="http://ckeditor.com/">CKEditor</a> sowie Markdown Dokumente, die in Echtzeit angezeigt werden, während du tipps. Du kannst auch die Umfrage App verwenden, um Ereignisse unter mehrere Teilnehmern zu synchroniseren.';
    out.whatis_zeroknowledge = 'Ohne Preisgabe von Informationen';
    out.whatis_zeroknowledge_p1 = "Wir wollen nicht wissen, was du gerade tippst. Und mit modernen Verschlüsselungstechnologie, du kannst sicher sein, dass wir nicht es nicht können. CryptPad verwendet <strong>100% Clientseitige Verschlüsselung</strong>, um den Inhalt von uns zu schützen, wir die Personen die das Website hosten.";
    out.whatis_zeroknowledge_p2 = 'Wenn du dich registrierst und logge dich ein, dein Benutzername und Passwort sind in einem Schlüssel umgerechnet mit einer <a href="https://en.wikipedia.org/wiki/Scrypt">Scrypt Ableitungsfunktion</a>. Weder ist dieser Schlüssel noch der Benutzername oder Passwort sind zum Server geschickt. Anstatt dessen sind sie benutzt clientseitig, um den Inhalt deinese CryptDrives zu entschlüsseln. Dieses beinhaltet alle Dokumente, die die zugänglich sind.';
    out.whatis_zeroknowledge_p3 = 'Wenn du ein Dokument teilst, teilst auch den kryptografischen Schlüssel, der Zugang zu diesem Dokument gibt. Da dieser Schlüssel im <a href="https://en.wikipedia.org/wiki/Fragment_identifier">fragment identifier</a> ist, ist das nie direkt zum Server geschickt. Bitte lese unsere <a href="https://blog.cryptpad.fr/2017/07/07/cryptpad-analytics-what-we-cant-know-what-we-must-know-what-we-want-to-know/">Blogeintrag über Datenschutz</a> um mehr zu erfahren, welche Typen von Kontextinformation wir zugänglich und nicht zugänglich haben.';
    out.whatis_drive = 'Organisieren mit CryptDrive';
    out.whatis_drive_p1 = 'Sobald ein Dokument mit CryptPad zugegriffen wird, ist deses automatisch zu deinem CryptDrive hinzugefügt, im Stamm Ordner. Später kannst du diese Dokumente in Ordnern organisieren oder du kannst es im Papierkorb verschieben. CryptDrive erlaubt die Suche durch deine Dokumente, wie und wann du willst.';
    out.whatis_drive_p2 = 'Mit dem einfachsten Ziehen und Schieben Gesten kannst du die Dokumente herum von deinem Drive umplatzieren. Die Links zu diesen Dokumenten bleiben erhalten damit Kollaboratoren nie Zugang verlieren.';
    out.whatis_drive_p3 = 'Du kannst auch Dateien in dein CryptDrive hochladen und mit deinen Kollegen teilen. Hochgeladene Dateien können genau so wie kollaborative Dokumente organisiert werden.';
    out.whatis_business = 'CryptPad im Business';
    out.whatis_business_p1 = 'Der Grundprinzip von CryptPad (_Verschlüsselung ohne Preisangabe der Information_) ist ausgezeichnet, um die Effektivität von existierenden Protokolle, indem die Zugangsberechtigungen des Unternehmens in die Kryptografie umgesetzt werden. Weil hochsensible Medien nur mit Angestelltenzugang entschlüsselt werden kann, kann CryptPad das Jackpot der Hackers wegnehmen, was in der Natur von tradionellen IT Servers liegt. Lese das <a href="https://blog.cryptpad.fr/images/CryptPad-Whitepaper-v1.0.pdf">CryptPad Whitepaper</a>, um mehr zu erfahren, wir CryptPad dein Unternehmen helfen kann.'
    out.whatis_business_p2 = 'CryptPad kann auf eigenen Rechnern installiert werden. <a href="https://cryptpad.fr/about.html">CryptPad Entwicklers</a> at XWiki SAS können kommerzielle Unterstützung, Customisierung und Entwicklung anbieten. Bitte schicke ein Email zu <a href="mailto:sales@cryptpad.fr">sales@cryptpad.fr</a>, um mehr zu erfahren.';

      // privacy.html

      out.policy_title = 'Cryptpad Datenschutzbestimmungen';
      out.policy_whatweknow = 'Was wir über dich wissen';
      out.policy_whatweknow_p1 = 'Als Programm, das im Web gehostet wird, hat Cryptpad Zugriff auf die Metadaten, die vom HTTP-Protokoll exponiert werden. Inbegriffen ist deine IP-Adresse und diverse andere HTTP-Header, die es ermöglichen deinen Browser zu identifizieren. Um zu sehen welche Daten dein Browser preis gibt kanst du die Seite <a target="_blank" rel="noopener noreferrer" href="https://www.whatismybrowser.com/detect/what-http-headers-is-my-browser-sending" title="what http headers is my browser sending">WhatIsMyBrowser.com</a> besuchen.';
      out.policy_whatweknow_p2 = 'Wir nutzen <a href="https://piwik.org/" target="_blank" rel="noopener noreferrer" title="open source analytics platform">Piwik</a>, eine open source Analyseplatform um mehr über unsere Nutzer*innen zu lernen. Piwik teilt uns mit, wie du Cryptpad gefunden hast &mdash; durch direkten Zugriff, mit Hilfe eine Suchmaschine oder über einen Link auf einer anderen Seite wie z.B. Reddit oder Twitter. Außerdem lernen wir mehr über deinen Besuch, welchen Link du auf den Informationsseiten klickst und wie lange du auf diesen Seiten verweilst.';
      out.policy_howweuse = 'Wie wir das Wissen anwenden';
      out.policy_howweuse_p1 = 'Wir nutzen diese Informationen um besser entscheiden zu können wie Cryptpad beworben werden kann und um genutzte Strategien zu evaluieren. Informationen über deinen Standort helfen uns abzuschätzen welche Sprachen wir besser unterstützen sollten.';
      out.policy_howweuse_p2 = "Informationen zu deinem Browser (ob du auf einem Desktop oder Smartphone arbeitest) hilft uns außerdem dabei zu entscheiden, welche Features priorisiert werden sollen. Unser Entwicklerteam ist klein, deshalb ist es uns wichtig Entscheidungen derart zu treffen, dass die Erfahrung der größten Zahl von Nutzer*innen verbessert wird.";
      out.policy_whatwetell = 'Was wir anderen über die erzählen';
      out.policy_whatwetell_p1 = 'Wir reichen keine von uns gesammelten Daten weiter, außer im Falle einer gerichtlichen Anordnung.';
      out.policy_links = 'Links zu anderen Seiten';
      out.policy_links_p1 = 'Diese Seite beinhaltet Links zu anderen Seiten, teilweise werden diese von anderen Organisationen verwaltet. Wir sind nicht für den Umgang mit der Privatsphäre und die Inhalte der anderen Seiten verantwortlich. Generell werden Links zu externen Seiten in einem neuem Fenster geöffnet, um zu verdeutlichen, dass du Cryptpad.fr verlässt.';
      out.policy_ads = 'Werbung';
      out.policy_ads_p1 = 'Wir zeigen keine Onlinewerbung, können aber zu Organisationen verlinken, die unsere Forschung finanzieren.';
      out.policy_choices = 'Deine Möglichkeiten';
      out.policy_choices_open = 'Unser Code ist open source, deshalb kannst du jederzeit deine eigene Cryptpad-Instanz hosten.';
      out.policy_choices_vpn = 'Wenn du unsere gehostete Instanz nutzen möchtest bitten wir dich darum IP-Adresse zu verschleiern, das geht zum Beispiel mit dem <a href="https://www.torproject.org/projects/torbrowser.html.en" title="downloads vor Torproject" target="_blank" rel="noopener noreferrer">Tor browser bundle</a>, oder einem <a href="https://riseup.net/en/vpn" title="VPNs provided by Riseup" target="_blank" rel="noopener noreferrer">VPN-Zugang</a>.';
      out.policy_choices_ads = 'Wenn du unsere Analysesoftware blockieren möchtest kannst du Adblock-Software wie <a href="https://www.eff.org/privacybadger" title="download privacy badger" target="_blank" rel="noopener noreferrer">Privacy Badger</a> verwenden.';

    // features.html

    out.features = "Funktionen";
    out.features_title = "Tabelle der Funktionen";
    out.features_feature = "Funktion";
    out.features_anon = "Anonymer Benutzer";
    out.features_registered = "Angemeldete Benutzer";
    out.features_notes = "Notizzen";
    out.features_f_pad = "Ein Dokument erstellen/bearbeiten/ansehen";
    out.features_f_pad_notes = "Rich Text, Code, Präsentation, Umfrage und Whiteboard Apps";
    out.features_f_history = "Verlauf";
    out.features_f_history_notes = "Jegliche Version ihres Dokuments ansehen und zurückbringen";
    out.features_f_todo = "Eine ToDo-Liste erstellen";
    out.features_f_drive = "CryptDrive";
    out.features_f_drive_notes = "Einfache Funktionen für anonyme Benutzer";
    out.features_f_export = "Export/Import";
    out.features_f_export_notes = "Für Dokumente und CryptDrive";
    out.features_f_viewFiles = "Dateien ansehen";
    out.features_f_uploadFiles = "Dateien hochladen";
    out.features_f_embedFiles = "Dateien einbetten";
    out.features_f_embedFiles_notes = "Eine Datei in ein Dokument einbetten, die im CryptDrive steht";
    out.features_f_multiple = "Verwendung auf mehrere Geräte";
    out.features_f_multiple_notes = "Eine leichte Methode, deine Dokumente von jeglichem Gerät zu verwenden";
    out.features_f_logoutEverywhere = "Auf allen Geräten ausloggen";
    out.features_f_logoutEverywhere_notes = ""; // Used in the French translation to explain
    out.features_f_templates = "Vorlagen verwenden";
    out.features_f_templates_notes = "Neue Vorlagen erstellen und neue Dokumente aus den Vorlagen erstellen";
    out.features_f_profile = "Ein Profil erstellen";
    out.features_f_profile_notes = "Persönliche Seite, mit ein Benutzerbild und eine Beschreibung";
    out.features_f_tags = "Tags anwenden";
    out.features_f_tags_notes = "Erlaubt dich in CryptDrive anhand Tags zu suchen";
    out.features_f_contacts = "Kontakte App";
    out.features_f_contacts_notes = "Kontakte hinzufügen und mit den in einer verschlüsselte Sitzung chatten";
    out.features_f_storage = "Speicherplatz";
    out.features_f_storage_anon = "Dokumente sind nach 3 Monate gelöscht";
    out.features_f_storage_registered = "Frei: 50MB<br>Premium: 5GB/20GB/50GB";

    // faq.html

    out.faq_link = "FAQ";
    out.faq_title = "Häufigste Fragen";
    out.faq_whatis = "Was ist CryptPad?";
    out.faq = {};
    out.faq.keywords = {
        title: 'Schlüsselkonzepte',
        pad: {
            q: "Was ist ein CryptPad Dokument?",
            a: "Ein CryptPad Dokument ist manchmal als <em>Pad</em> genannt. Diese Bennung wurde von  <a href='http://etherpad.org/' target='_blank'>Etherpad</a> bekannt gemacht, ein kollaboratives Editor in Echtzeit\n"+
			"Es beschreibt ein Dokument, das du in deinem Browser bearbeiten kannst, normalerweise mit der Möglichkeit für  andere Personen, die Veränderungen nah zu direkt zu sehen."
        },
        owned: {
            q: "What ist ein eigenes Dokument?",
            a: "Ein <em>eigenes Dokument</em> ist ein Dokument mit einem definierten Eigentümer, der anhand ein <em>einer Unterschrift mit öffentlichen Schlüssel</em> erkannt wird." +
				"Der Eigentümer eines Dokuments kann entscheiden, das Dokument zu löschen. In diesem Fall macht er das Dokument unverfügbar für weitere Kollaboration, egal ob das Dokument in ihrem CryptDrive war oder nicht."
        },
        expiring: {
            q: "What is der Ablaufsdatum eines Dokuments?",
            a: "Ein Dokument kann mit einem <em>Ablaufsdatum</em> versehen werden. Nach diesem Datum wird es automatisch vom Server gelöscht" +
                " Das Ablaufdatum kann sowohl sehr nah (ein Paar Stunden) als sehr weit sein (hunterte Monate)." +
                " Das Dokument und sein gesamter Verlauf wird dauerhaut unverfügbar werden, auch wenn er gerade noch bearbeitet wird.<br><br>" +
                " Wenn ein Dokument ein Ablaufsadtum hat, kann mann dieses Datum in der <em>Eigenschaften</em> lesen: Entweder mit einem Recht-klick in CryptDrive oder mit der Properties Ansicht, wenn das Dokument geöffnet ist."
        },
        tag: {
            q: "Wie kann ich Tags verwenden?",
            a: "Du kannst Dokumente und CryptDrive-hochgeladene Dateien <em>taggen</em>. Das heisst mit einem Tag zu versehen. In Bearbeitung ist es durch das <em>tag</em> Knopf (<span class='fa fa-hashtag'></span>" +
			"   Suche die Dokumente und Dateien in deinem CryptDrive mithilfe der Suchfunktion mit Suchterme, die mit einem Hashtag starten, zB  <em>#crypto</em>."
        },
        template: {
            q: "Was ist eine Vorlage?",
            a: "Eine Vorlage ist ein Dokument, dass du benutzen kannst, um der Anfangsinhalt für zukünftige Dokumente zu definieren." +
            " Jedes existes existierende Dokument kan eine Vorlage werden, indem es zum <em>Vorlagen</em> Abschnitt des CryptDrives geschoben wird." +
            " Du kannst auch eine Kopie eines Dokuments erstellen, die ales Vorlage wird, indem du auf der Vorlagen Knop (<span class='fa fa-bookmark'></span>) des Toolbars des Editors druckst."
        },
    };
    out.faq.privacy = {
        title: 'Privacy',
        different: {
            q: "Wie unterscheidet sich CryptPad von anderen online kollaborative Editoren?",
            a: "CryptPad verschlüsselt Veränderungen deiner Dokumente, bevor diese Information zum Server geschickt wird. Somit können wir nicht lesen, was du getippt hast." 
        },
        me: {
            q: "Welche Information kennt der Server über mich?",
            a: "Die Administratoren des Servers können die IP-Adresse der Personen sehen, die CryptPad besuchen."  +
            " Wir speichern nicht welche Adresse besucht welches Dokument, aber wir konnten es tun, auch ohne Zugang zu den Inhalt des Dokuments zu kennen." +
            " Wenn du besorgt bist, dass wir diese Information analysieren, ist es am sichersten davon auszugehen, dass wir es tun, da wir nicht beweisen können, dass wir es nicht tun.<br><br>" +

			" Wir sammeln elementare technische Informationen über wie CryptPad benutzt wird, wie die Grösse des Bildschirms auf der Gerät und welche Knöpfe werden meist geklickt." +
			" Das hilft uns, unser Software besser zu machen. Aber du kannst die diese Sammlung für dich vermeiden, in dem du  <em>Rückmeldung aktivieren</em> kein Haken setzt.<br><br>" + 

            " Die Speicherungsgrössen und deren Grenzen sind mit dem öffentlichen Schlüssel eines Benutzers verbunden, aber wir verbinden nicht Namen oder Emailadressen mit dieser öffentlichen Schlüsseln.<br><br>" +

			" Du kannst mehr Informationen darüber auf diesem <a href='https://blog.cryptpad.fr/2017/07/07/cryptpad-analytics-what-we-cant-know-what-we-must-know-what-we-want-to-know/' target='_blank'>Blogeintrag</a> lesen."
        },
        register: {
            q: "Weisst der Server mehr über mich, wenn ich registriere?",
            a: "Wir verlangen nicht deine Emailadresse zu bestätigen und der Server kennt der Benutzername und Passwort nicht, wenn du dich regstriests. " +
			   " Anstatt dessen, der Registrierungs- und Anmeldeformular generiert ein Schlüsselpaar mit deiner Eingabe. Nur der öffentliche Schlüssel dieses Schlüsselpaars wird zum Server geschickt." +
               " Mit diesem öffentlichen Schlüssel könenn wir Informationen kontrollieren wie die Menge der Daten, die du benutzt; damit können wir den Verbrauch von jedem Benutzer im Quota beschränken.<br><br>" +

			   " Wir benutzen die <em>Rückmeldung</em> Funktion, um den Server zu informieren, dass jemand mit deinem IP ein Konto registriert hat." +
			   " Damit können wir messen, wie viele Benutzer CryptPad Konten registrieren registrieren, und von welchen Regionen. Somit können wir wissen, welche Sprache braucht ein besseres Support.<br><br>" +
				
			   " Wenn du registrierst, du erstellest einen öffentlichen Schlüssel, das benutzt wird, um den Server zu informieren, dass die Dokumente nicht löschen sollte, wenn sie nicht aktiv benutzt werden." + 
               " Diese Information zeigt mehr zum Server, über wie du CryptPad benutzt, aber das System erlaubt uns, die Dokumente zu löschen, wofür keine sich die Mühe gegeben hat, was zu tun, um sie zu behalten."
        },
        other: {
            q: "Was können andere Benutzer über micht erfahren?",
            a: "Wenn die ein Dokument jemanden anderen bearbeitest, du kommunizierst mit dem Server. Nur wir kennen deine IP-Adresse. " +
			   " Andere Benutzern können dein Benutzername, dein Benutzerbild, das Link deines Profils (wenn du ein hast), und deinen <em>öffentlichen Schlüssel</em> (um die Nachrichten zu den Benutzern zu verschlüsseln)."
        },
        anonymous: {
            q: "Macht mich CryptPad anonym?",
            a: "Auch wenn CryptPad so konzipiert wurde, dass es so wenig wie möglich über dicht kenn, es liefert keine strenge Anonymität" +
 		       " Unsere Servers haben einen Zugang zu deiner IP-Adresse, allerdings kannst du diese Information verbergen, indem du Tor verwendets." +
			   " Einfach Tor zu verwenden, ohne dein Verhältnis zu ändern, garnatiert auch nicht deine Anonymität, da der Server Benutzern noch mit deren einzige öffentlichen Schlüsseln identifizeren kann." +
               " Wenn du denselben Schlüssel benutzt, wenn du nicht Tor benutzt. Es wird möglich, deine Sitzung zu de-anonimisieren.<br><br>" +
 
			   " Für Benutzer die einen niedrigeren Grad Datenschutz brauchen, CryptPad, im Gegenteil zu anderen Onlinservers, verlangt sein Benutzer nicht, sich mit Namen, Telefonnummer oder Emailadressen zu identifizieren."
        },
        policy: {
            q: "Habt ihr eine Datenschutzerklärung?",
            a: "Ja! Es ist <a href='/privacy.html' target='_blank'>hier</a> verfügbar."
        }
    };
    out.faq.security = {
        title: 'Sicherheit',
        proof: {
            q: "Wie benutzt ihr <em>Zero Knowledge</em> Beweise?",
            a: "Wir benutzen das Term <em>Ohne Preisgabe von Informationen</em> (<em>Zero knowledge</em>) nicht im Sinn eines <em>Zero knowledge Beweis</em> aber im Sinn eines <em>Zero Knowledge Webdienst</em> " +
			   " <em>Zero Knowledge Webdienst</em> verschlüsseln die Benutzerdaten im Browser, ohne dass der Server je Zugang zu den unverschlüsselten Daten oder zu dem Verschlüsselungschlüsseln hat. <br><br>" +
			   " Wir haben eine kurze Liste von Zero-Knowledge Webdienste <a href='https://blog.cryptpad.fr/2017/02/20/Time-to-Encrypt-the-Cloud/#Other-Zero-Knowledge-Services'>hier</a> gesammelt."
        },
        why: {
            q: "Wieso soll ich CryptPad verwenden?",
            a: "Unsere Position ist, dass Clouddienst nicht Zugang zu deinen Daten verlangen sollten, damit du sie zu deinen Kontakten und Mitarbeitern teilen kannst. " +
			   " Wenn du ein Webdienst benutzt, der nicht explizit eine Ankündigung macht, dass die keinen Zugang zu deinen Information haben, ist es sehr wahrscheinlich, dass sie diese Information für andere Zwecke verwerten."
        },
        compromised: {
            q: "Liefert mich CryptPad einen Schutz, wenn mein Gerät zugegriffen wird?",
            a: "Im Fall, dass dein Gerät gestolen wird, erlaubt CryptPad ein Knopf zu drucken, damit alle Geräte, ausser das wo du gerade geloggt bist, ausgeloggt wird. " +
			   " Alle andere Geräten, die mit diesem Konto verbunden sind, werden auch ausgeloggt. " +
               " Alle früher verbundene Geräte, werden ausgeloggt, sobald sie CryptPad besuchen.<br><br> " +
				
			   " Die <em>Fernlogout</em> Funktion, wie oben beschrieben, ist im Browser implementiert und nicht im Server. " +
               " Somit schützt diese nicht von Regierungsagenturen. Aber es sollte ausreichend sein, wenn du ein Logout vergessen hast, wenn du auf einem geteiltes Rechner warst."
        },
        crypto: {
            q: "Welche Kryptografie benutzt ihr?",
            a: "CryptPad basiert auf zwei open-source Kryptografiebibliotheken: " +
			   " <a href='https://github.com/dchest/tweetnacl-js' target='_blank'>tweetnacl.js</a> und <a href='https://github.com/dchest/scrypt-async-js' target='_blank'>scrypt-async.js</a>.<br><br>" +
			   " Scrypt ist ein <em>Passwort-basiert Schlüsselableitungsalgorithmus</em>. Wir benutzen es, um dein Benutzername und Kennwort in einem Schlüsselpaar umzuwandeln, das deinen Zugang zum CryptDrive, und daher deine gesamte Dokumente, sichert.<br><br>" +  
		
               " Wir verwenden  die Verschlüsselung <em>xsalsa20-poly1305</em> und <em>x25519-xsalsa20-poly1305</em> von tweetnacl, um, bzw, Dokumente und Chat-Historie zu verschlüsseln."
        }
    };
    out.faq.usability = {
        title: 'Usability',
        register: {
            q: "Was kriege ich, wenn ich registriere?",
            a: "Registrierte Benutzer können eine Menge Funktionen verwenden, die unregistrierten nicht verwenden können. Es gibt eine Tabelle <a href='/features.html' target='_blank'>hier</a>."
        },
        share: {
            q: "Wie kann ich Zugang zu einem verschlüsselten Dokument mit Freunden teilen?",
            a: "CryptPad macht den Verschlüsselungsschlüssel zu deinem Pad nach dem <em>#</em> Buchstabe in dem URL." +
			   " Alles was nach diesem Buchstabe kommt, ist nicht zum Server geschickt; also haben wir nie Zugang zu deinem Verschlüsselungsschlüssel." +
			   " Wenn du das Link deines Dokuments teilst, teilst du auch die Fähigkeit zum Lesen und zum Bearbeiten."
        },
        remove: {
            q: "Ich habe ein Dokument aus meinem CryptDrive gelöst, aber den Inhalt ist noch verfügbar. Wie kann ich es entfernen?",
			a: "Nur <em>eigene Dokumente</em>, die erst in Februar 2018 eingeführt wurden, können gelöscht werden. Dazu können diese Dokument nur von deren Eigentümer gelöscht werden" +
			   " (der Benutzer, der das Dokument original gestaltet hat). Wenn du nicht der Eigentümer eines Dokuments bist, musst du noch den Eigentümer bitten, dass er dieses löscht." +
			   " Für ein Dokument, wovon du den Eigentümer bist, kannst du auf dem Dokument <strong>in CryptDrive rechtsklicken</em> und <strong>Vom Server löschen</strong> wählen. "
        },
        forget: {
            q: "Was passiert, wenn ich mein Passwort vergesse?",
            a: " Leider: Wenn wir dein Passwort zurückerstellen könnten, könnten wir auch Zugang zu deinen Daten selber haben. " +
               " Wenn du dein Passwort nicht registriert hast, und kann es auch nicht erinnern, kannst du vielleicht die vergangene Dokumente von deinem Browserverlauf zurück gewinnen. "
        },
        change: {
            q: "Was ist, wenn ich mein Passwort wechseln möchte?",
            a: "Es ist aktuell nicht möglich, dein CryptPad Passwort zu wechseln, obwohl wir diese Funktion bald planen."
        },
        devices: {
            q: "Ich bin auf zwei Geräte eingeloggt und sehe zwei unterschiedliche CryptDrives. Wie ist das möglich?",
            a: "Es ist möglich, dass du zweimal derselben Name registriert hast, mit unterschiedlichen Passwörter." +
            " Weil der CyrptPad Server dicht mit deinem kryptografische Unterschrift identifiziert, es kann nicht dich verhindern, mit demselben Name einzuloggen." +
            " Somit hat jede Benutzerkonto ein einzigartiges Beutzername und Passwortkombination. " +
            " Angemeldete Benutzer können ihre Benutzername im oberen Teil der Einstellungsseite sehen."
        },
        folder: {
            q: "Kann ich meine ganze Ordnern in CryptDrive teilen?",
            a: "Wir arbeiten daran, <em>eine Arbeitgruppenfunktion</em> anzubieten, die Mitglieder erlauben würde, ganze Ordnern sowie alle Dokumente darin, zu teilen."
        },
        feature: {
            q: "Könnt ihr diese Funktion hinzufügen, das ich brauche?",
            a: "Viele Funktionen existieren in CryptPad, weil Benutzern haben dafür gebeten." +
            " Unsere <a href='https://cryptpad.fr/contact.html' target='_blank'>Kontaktseite</a> gibt eine Liste de Methoden, um mit uns in Kontakt zu treten.<br><br>" +

            "Leider können wir aber nicht garantieren, dass wir alle Funktionen entwickeln, die Benutzern bitten." +
            " Wenn eine Funktion kritisch für ihre Organisation ist, kannst du Sponsor der Entwicklung dieser Funktion werden, und somit deren Realisierung sichern." +
            " Bitte kontaktiere <a href='mailto:sales@cryptpad.fr' target='_blank'>sales@cryptpad.fr</a> für mehr Informationen.<br><br>" +

            "Auch wenn du nicht die Entwicklung einer Funktion sponsorieren kannst, sind wir zu Rückmeldungen interessiert, damit es uns hilft CryptPad zu verbessern." +
            " Du bist willkommen, mit uns in Kontakt zu treten, mit eine der Methoden oben."
        }
    };

    out.faq.other = {
        title: "Andere Fragen?",
        pay: {
            q: "Wieso soll ich zahlen, wenn so viele Funktionen sowieso kostenfrei sind?",
            a: "Wir geben Sponsoren zusätzliche Speicherplatzmöglichkeiten sowie die Möglichkeit, die Speicherplatzgrenzen ihrer Freunde zu erhören (<a href='https://accounts.cryptpad.fr/#/faq' target='_blank'>lese mehr</a>).<br><br>" +

			" Weiter als diese kurzfristige Vorteile kannst du, wenn du ein Premiumangebot annimmst, die aktive Weiterentwicklung von CryptPad. Dieses beinhaltet Bugs reparieren, neue Funktionen gestalten, und es leichter für andere zu machen, dass sie CryptPad auf eigenen Servers installieren." +
			" Zusätzlich hilfst du das den Anderen zu beweisen, dass Leute datenschutzschonende Technologien verbessern wollen. Wir hoffen, dass am Ende Geschäftmodelle ein Aspekt der vergangene Geschichte ist.<br><br>" +

		    " Am Ende glauben wir, dass es gut ist, die Funktionen von CryptPad kostenfrei anzubieten, weil jeder persönlichen Datenschutz braucht, nicht nur diejenige mit Extraeinkommen." +
            " Durch ihre Unterstützung hilfst du uns, zu ermöglichen, dass Bevölkerung mit weniger Einkommen diese grundlegende Funktionen geniessen können, ohne dass ein Preisetikette daran klebt."
        },
        goal: {
            q: "Was ist ihr Ziel?",
            a: "Durch die Verbesserung von Datenschutzschonende Technologie möchten wir die Erwartungen der Benutzern erhöhen, was der Datenschutz auf Cloudplattformen angeht." + 
			   "Wir hoffen, dass unsere Arbeit andere Dienstanbietern in allen Domänen ähnliche oder bessere Dienste anbieten können. " + 
			   "Trotz unser Optimismu wissen wir, dass vieles vom Web aus gezielte Werbung gesponsert wird. " +
               "Es gibt viel mehr Arbeit in der Richtung zu tun, als wir selber schaffen, und wir erkennen die Unterstützung der Gemeinschaft für Promotion, Support und andere Beiträge für dieses Zweck."
        },
        jobs: {
            q: "Stellt ihr an?",
            a: "Ja! Bitte schicke eine kurze Einführung zu dir auf <a href='mailto:jobs@xwiki.com' target='_blank'>jobs@xwiki.com</a>."
        },
        host: {
            q: "Könnt ihr mich helfen, meine eigene Installation von CryptPad zu erledigen?",
            a: "Wir sind froh, dich zu unterstützen, das interne CryptPad deiner Firma zu installieren. Setze dich bitte mit <a href='mailto:sales@cryptpad.fr' target='_blank'>sales@cryptpad.fr</a> in Kontakt für mehr Information.",
        },
        revenue: {
            q: "Wie kann ich ein geteilttes Einkommen Modell erreichen?",
            a:  " Wenn du deine eigene Installation von CrytPad betreibst, und du möchtests die Einkommen für deine bezahlte Konten mit Entwicklern teilen, wird dein Server als Partnerservice konfugriert werden müssen.<br><br>" +

            "In deinem CryptPad Verzeichnis befinden sich <em>config.example.js</em>, die eine Erklärung liefert, wie du dein Server dafür konfigurieren muss. "+
			"Danakch solltest du  <a href='mailto:sales@cryptpad.fr'>sales@cryptpad.fr</a> ein Email schicken, damit es geprüft wird, dass dein Server richtig mit HTTPS konfiguriert wird und damit die Bezahlungsmethoden diskutiert werden. "
        },
    };
    
    

      // terms.html

      out.tos_title = "Cryptpad Nutzungsbedingungen";
      out.tos_legal = "Sei nicht bösartig, missbrauchend und mach nichts illegales.";
      out.tos_availability = "Wir hoffen, dass dir dieser Service nützt, aber Erreichbarkeit und Performanz können nicht garantiert werden. Bitte exportiere deine Daten regelmäßig.";
      out.tos_e2ee = "Cryptpad Dokumente können von allen gelesen oder bearbeitet werden, die den \"fragment identifier\" des Dokuments erraten oder auf eine andere Art davon erfahren. Wir empfehlen dir Ende-Zu-Ende verschlüsselte Nachrichtentechnik (e2ee) zum Versenden der URLs zu nutzen. Wir übernehmen keine Haftung falls eine URL erschlichen oder abgegriffen wird.";
      out.tos_logs = "Metadaten, die dein Browser bereitstellt, können geloggt werden, um den Service aufrechtzuerahlten.";
      out.tos_3rdparties = "Wir geben keine Individualdaten an dritte Weiter, außer auf richterliche Anordnung.";

    // 404 page
    out.four04_pageNotFound = "Wir konnten nicht die Seite finden, die du angefordert hast.";

      // BottomBar.html

      // out.bottom_france = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer">Mit <img class="bottom-bar-heart" src="/customize/heart.png" /> in <img class="bottom-bar-fr" src="/customize/fr.png" /> gemacht</a>';
      // out.bottom_support = '<a href="http://labs.xwiki.com/" title="XWiki Labs" target="_blank" rel="noopener noreferrer">Ein <img src="/customize/logo-xwiki2.png" alt="XWiki SAS" class="bottom-bar-xwiki"/> Labs Project </a> mit Hilfe von <a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';

      // Header.html

    out.updated_0_header_logoTitle = 'Zu deinem CryptDrive';
    out.header_logoTitle = out.updated_0_header_logoTitle;
    out.header_homeTitle = 'Zu der CryptPad Homeseite';

    // Initial states

    out.help = {};

    out.help.title = "Mit CryptPad anfängen";
    out.help.generic = {
        more: 'Erfahre mehr wie CryptPad für dich arbeiten kann, indem du unsere <a href="/faq.html" target="_blank">FAQ</a> liest.',
        share: 'Benutze das Teilen Menü (<span class="fa fa-share-alt"></span>), um Links zu schicken, die zu Kooperationen im Lesen oder Bearbeiten einladen.',
        stored: 'Jedes Dokument, dass du besuchst, ist automatisch in deinem  <a href="/drive/" target="_blank">CryptDrive</a> gespeichert.',
    };

    out.help.text = {
        formatting: 'Du kannst das Toolbar anzeigen oder verbergen indem du auf <span class="fa fa-caret-down"></span> oder <span class="fa fa-caret-up"></span> klickst.',
        embed: 'Registrierte Benutzern können mit <span class="fa fa-image"></span> Bilder oder Dateien einbetten, die in deren CryptDrive gespeichert sind.',
        history: 'Du kannst das Menü <em>Verlauf</em> <span class="fa fa-history"></span> benutzen, um frühere Version anzusehen oder zurückbringen.',
    };

    out.help.pad = {
        export: 'Du kannst export als PDF benutzen, indem du auf dem Knopf <span class="fa fa-print"></span> in dem Formattierungstoolbar druckst.',
    };

    out.help.code = {
        modes: 'Benutze das Dropdown Menü im Submenü <span class="fa fa-ellipsis-h"></span>, um die Syntaxherhorhebung oder das Farbschema zu wechseln.',
    };

    out.help.slide = {
        markdown: 'Schreibe Folien in <a href="http://www.markdowntutorial.com/">Markdown</a> and separiere sie mit der Zeile <code>---</code>.',
        present: 'Starte die Präsentation mit  dem Knopf <span class="fa fa-play-circle"></span>.',
        settings: 'Verändere die Präsentationseinstellung (Hintergrund, Transition, Anzeige der Seitenummer, etc) mit dem Knopf <span class="fa fa-cog"></span> in dem Submenü <span class="fa fa-ellipsis-h"></span>.',
        colors: 'Verändere Text- und Hintergrundfarbe mit den Knöpfen <span class="fa fa-i-cursor"></span> und <span class="fa fa-square"></span>.',
    };

    out.help.poll = {
        decisions: 'Treffen Entscheidung privat, unter Bekannte',
        options: 'Schlage zuätzliche Optionen, und mache deine bevorzugte Optionen laut',
        choices: 'Klicke Zellen in deiner Spalte, um zwischen ja (<strong>✔</strong>), viellecht (<strong>~</strong>), oder nein (<strong>✖</strong>) zu wählen',
        submit: 'Klicke auf <strong>schicken</strong>, damit deine Wahlen anderen Sichtbar wird',
    };

    out.help.whiteboard = {
        colors: 'Ein Doppelklick auf Farben erlaubt die Palette zu verändern',
        mode: 'Deaktiviere das Zeichenmodus, um die Strichen zu ziehen und verlängern',
        embed: 'Einbette Bilder von deiner Festplatte <span class="fa fa-file-image-o"></span> oder von deinem CryptDrive <span class="fa fa-image"></span> und exportiere sie als PNG zu deiner Festplatte <span class="fa fa-download"></span> oder zu deinem CryptDrive <span class="fa fa-cloud-upload'
    };


    out.initialState = [
        '<p>',
        'Hier ist is&nbsp;<strong>CryptPad</strong>, das Echtzeit kollaboratives Editor ohne Preisangabe deiner Informationen. Alles wird beim Tippen direkt gespeichert.',
        '<br>',
        'Teile das Link zu diesem, um mit Bekannten zu kooperieren, oder verwende den Knopf <span class="fa fa-share-alt"></span>, um ein <em>schreibgeschütztes Link</em>&nbsp; zu teilen. Es erlaubt der Ansicht ohne die Bearbeitung.',
        '</p>',
    ].join('');

    out.codeInitialState = [
        '# CryptPad: Kollaboratives Code Editor ohne Preisangabe deiner Information\n',
        '\n',
        '* Was du hier tippst, ist Verschlüsselt. Nur Personen die das vollen Link haben können es zugreifen.\n',
        '* Du kannst die Programmierungsprache für die Syntaxhervorhebung sowie das Farbschema oben rechts wählen.'
    ].join('');

    out.slideInitialState = [
        '# CryptSlide\n',
        '1. SChreibe deine Präsentation mit der Markdown Syntax\n',
        '  - Mehr über Markdwon [hier](http://www.markdowntutorial.com/) erfahren\n',
        '2. Trenne deine Folien mit ---\n',
        '3. Klicke auf dem "Abspielen" Knopf, um das Ergebnis zu sehen.',
        '  - Deine Folien sind in Echtzeit aktualisiert'
    ].join('');

    // Readme

    out.driveReadmeTitle = "Was ist CryptPad?";
    out.readme_welcome = "Willkommen zu CryptPad !";
    out.readme_p1 = "Willkommen zu CryptPad, hier kannst du deine Notizzen runterschreiben, allein oder mit Bekannten.";
    out.readme_p2 = "Dieses Dokument gibt dir einen kurzen Durchblick, wie du CryptPad verwenden kann, um Notizzen zu schreiben und zusammen zu arbeiten.";
    out.readme_cat1 = "Kenne CryptDrive lernen";
    out.readme_cat1_l1 = "Ein Dokument erstellen: In deinem CryptDrive, klicke {0} dann {1} und kannst ein ein Dokuemnt erstellen."; // 0: New, 1: Rich Text
    out.readme_cat1_l2 = "Ein Dokument deines CryptDrives öffnen: Doppelklick auf der Ikone eines Dokument, um es zu öffnen.";
    out.readme_cat1_l3 = "Deine Dokumente organisieren: Wenn du eingeloggst bist, wird jedes Dokument, das du beuuchst in {0} Abschnitt deines CryptDrive";
    out.readme_cat1_l3_l1 = "Du kannst Dateien zwischen Ordnern Ziehen und Schieben in dem Abschnitt {0} deines CryptDrives oder neue Ordnern gestalten."; // 0: Documents
    out.readme_cat1_l3_l2 = "Erinnere dich daran, ein Rechtklick auf Ikonen zu geben, da es zusätzlichen Menüfunktionen gibt.";
    out.readme_cat1_l4 = "Verschiebe deine alte Dokumente zum Papierkorb:  Du kannst deine Dokumente zu {0} verschieben, genauso, wie du es zu einem Ordner machst."; // 0: Trash
    out.readme_cat2 = "Dokumente wie ein Profi gestalten";
    out.edit = "bearbeiten";
    out.view = "ansehen";
    out.readme_cat2_l1 = "Der Knopf {0} in deinem Dokument erlaubt dich, anderen eine Mitarbeitzugang zu geben (entweder zu {1} oder {2}).";
    out.readme_cat2_l2 = "Der Titel eines Dokuments kann mit einem Klick auf dem Stift verändert werden.";
    out.readme_cat3 = "Entdecke CryptPad apps";
    out.readme_cat3_l1 = "Mit dem CryptPad Codeeditor kannst du auf Code wie JavaScript, Markdown, oder HTML";
    out.readme_cat3_l2 = "Mit dem CryptPad Präsentationseditor kannst du schnelle Vorträge mithilfe von Markdwon gestalten";
    out.readme_cat3_l3 = "Mit der CryptPad Umfrage kannst du schnell Abstrimmungen treffen, insbesonders, um Meetings zu planen, die dem Kalender von allen passen.";

    // Tips
    out.tips = {};
    out.tips.shortcuts = "`ctrl+b`, `ctrl+i` and `ctrl+u` sind Tatstenkürzeln um fett, kurziv, oder unterschrieben zu markieren.";
    out.tips.indent = "In gezifferten oder einfache Listen kannst du TAB und SHIFT-TAB benutzen, um die Identierung zu erhöhen oder reduzieren.";
    out.tips.store = "Jedes Mal, dass du ein Dokument besuchsts, und eingeloggt bist, wird es in deinem CryptDrive gespeichert.";
    out.tips.marker = "Du kannst Text in einem Dokument mit \"Marker\" Menü in dem Stilmenü markieren.";
    out.tips.driveUpload = "Registrierte Benutzer können verschlüsselte Dateien aus ihrer Festplatten hochladen, indem sie einfach Schieben und in ihrem CryptDrive ablegen.";
    out.tips.filenames = "Du kannst Dateien in deinem CryptDrive neubenennen. Dieser Name ist nur für dich.";
    out.tips.drive = "Eingeloggte Benutzern können ihre Dateien in ihrem CryptDrive organisieren. Dieses ist mit einem Klick auf der CryptPad Ikone oben links erreichbar, wenn mann in einem Dokument ist.";
    out.tips.profile = "Registrierte Benuzter können ein Profil gestalten mit dem Benutzer Menü oben rechts.";
    out.tips.avatars = "Du kannst ein Benutzerbild in deinem Profil hochladen. Andere sehen es, wenn die in einem Dokument zusammenarbeiten.";
    out.tips.tags = "Bringe Tags auf deinen Dokumenten und starte eine Suche-bei-Tags mit dem # Zeichen in dem CryptDrive Suche.";

    out.feedback_about = "Wenn du das liest, fragst du dich weshalb Anfragen an Webseiten schickt, wenn manche Aktionen geführt werden.";
    out.feedback_privacy = "Wir wollen deinen Datenschutz schonen, aber gleichzeitig wollen wir, dass die Benutzung von CryptPad sehr leicht ist, zB indem wir erfahren, welche UI-Funktion am wichtigsten für unsere Benutzen ist. Dieses wird nachgefragt mit einer genauen Parameterbeschreibung, welche Aktion war gemacht."
    out.feedback_optout = "Wenn du es aber nicht möchtest. besuche <a href='/settings/'>deine Einstellungen</a>, dort findest du ein Haken, wo du es deaktivieren kannst.";

    // Creation page
    out.creation_404 = "Dieses Dokument existiert nicht mehr. Benutze das folgende Formular, um ein neues Dokument zu gestalten.";
    out.creation_ownedTitle = "Dokumenttyp";
    out.creation_owned = "Eigenes Dokument"; // Creation page
    out.creation_ownedTrue = "Eigenes Dokument"; // Settings
    out.creation_ownedFalse = "Dokument von jemanden anders";
    out.creation_owned1 = "Ein <b>eigenes Dokument</b> kann vom Server gelöscht werden, wenn der Eigentümer es entscheidet. Die Löschung eines eigenes Dokuments verursacht die Löschung aus allen anderen CryptDrives. ";
    out.creation_owned2 = "Ein offenes Dokument hat kein Eigentümer, also kann es nicht löschen, ausser es hat sein Auslaufdatum erreicht.";
    out.creation_expireTitle = "Lebenszyklus";
    out.creation_expire = "Auslaufende Dokument";
    out.creation_expireTrue = "Ein Lebenszyklus hinzufügen";
    out.creation_expireFalse = "Unbegrenz";
    out.creation_expireHours = "Stunde(n)";
    out.creation_expireDays = "Tag(en)";
    out.creation_expireMonths = "Monat(e)";
    out.creation_expire1 = "An <b>unlimited</b> pad will not be removed from the server until its owner deletes it.";
    out.creation_expire2 = "An <b>expiring</b> pad has a set lifetime, after which it will be automatically removed from the server and other users' CryptDrives.";
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
    out.creation_propertiesTitle = "Verfügbarkeit";
    out.creation_appMenuName = "Fortgeschrittenes Modus (Ctrl + E)";
    out.creation_newPadModalDescription = "Klicke auf einem Padtyp, um es zu erstellen. Du kannst auch die <b>Tab</b>-Taste benutzen, um zu navigieren, und die <b>Enter</b>-Taste zu bestätigen. ";
    out.creation_newPadModalDescriptionAdvanced = "Du kannst das Kästchen ticken (oder auf der Leertaste drucken um den Wert zu ändern), um das Einstellungsdialog bei der Dokumenterstellung anzuzeigen (für eigene oder auslaufende Dokumente).";
    out.creation_newPadModalAdvanced = "Das Einstellungdialog bei der Dokumenterstellung anzeigen";

    // New share modal
    out.share_linkCategory = "Link teilen";
    out.share_linkAccess = "Zugangsrechte";
    out.share_linkEdit = "Bearbeiten";
    out.share_linkView = "Ansehen";
    out.share_linkOptions = "Linkoptionen";
    out.share_linkEmbed = "Einbettungsmodus (Toolbar und Benutzerliste sind verborgen)";
    out.share_linkPresent = "Anzeigemodus (Bearbeitbare Abschnuttte sind verborgen)";
    out.share_linkOpen = "In einem neuen Tab öffnen";
    out.share_linkCopy = "Zur Zwischenablage kopieren.";
    out.share_embedCategory = "Einbetten";
    out.share_mediatagCopy = "Mediatag zur Zwischenablage kopieren";

      return out;
  });
