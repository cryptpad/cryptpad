define(function () {
    var out = {};

    // translations must set this key for their language to be available in
    // the language dropdowns that are shown throughout Cryptpad's interface
    out._languageName = "Français";

    out.main_title = "Cryptpad: Éditeur collaboratif en temps réel, zero knowledge";
    out.main_slogan = "L'unité est la force, la collaboration est la clé";

    out.type = {};
    out.type.pad = 'Texte';
    out.type.code = 'Code';
    out.type.poll = 'Sondage';
    out.type.slide = 'Présentation';

    out.errorBox_errorType_disconnected = 'Connexion perdue';
    out.errorBox_errorExplanation_disconnected = [
        'La connexion au serveur a été perdue. Vous pouvez essayer de vous reconnecter en rechargeant la page',
        'ou vous pouvez revoir votre travail en fermant cette boîte de dialogue.',
    ].join('');

    out.common_connectionLost = "<b>Connexion au serveur perdue</b><br>Vous êtes désormais en mode lecture seule jusqu'au retour de la connexion.";
    out.websocketError = 'Impossible de se connecter au serveur WebSocket...';

    out.loading = "Chargement...";
    out.error = "Erreur";

    out.disconnected = 'Déconnecté';
    out.synchronizing = 'Synchronisation';
    out.reconnecting = 'Reconnexion...';
    out.lag = 'Latence';
    out.readonly = 'Lecture seule';
    out.anonymous = "Anonyme";
    out.yourself = "Vous-même";
    out.anonymousUsers = "éditeurs anonymes";
    out.anonymousUser = "éditeur anonyme";
    out.shareView = "URL de lecture seule";
    out.shareEdit = "URL d'édition";
    out.users = "Utilisateurs";
    out.and = "Et";
    out.viewer = "lecteur";
    out.viewers = "lecteurs";
    out.editor = "éditeur";
    out.editors = "éditeurs";

    out.language = "Langue";

    out.greenLight = "Tout fonctionne bien";
    out.orangeLight = "Votre connexion est lente, ce qui réduit la qualité de l'éditeur";
    out.redLight = "Vous êtes déconnectés de la session";

    out.importButton = 'IMPORTER';
    out.importButtonTitle = 'Importer un document depuis un fichier local';

    out.exportButton = 'EXPORTER';
    out.exportButtonTitle = 'Exporter ce document vers un fichier local';
    out.exportPrompt = 'Comment souhaitez-vous nommer ce fichier ?';

    out.back = '&#8656; Retour';
    out.backToCryptpad = '⇐ Retour vers Cryptpad';

    out.userButton = 'UTILISATEUR';
    out.userButtonTitle = "Changer votre nom d'utilisateur";
    out.changeNamePrompt = 'Changer votre nom (laisser vide pour rester anonyme) : ';
    out.user_rename = "Changer le nom affiché";
    out.user_displayName = "Nom affiché";
    out.user_accountName = "Nom d'utilisateur";

    out.renameButton = 'RENOMMER';
    out.renameButtonTitle = 'Changer le titre utilisé par ce document dans la page d\'accueil de Cryptpad';
    out.renamePrompt = 'Quel titre souhaitez-vous utiliser pour ce document ?';
    out.renameConflict = 'Un autre document existe déjà avec le même titre';
    out.clickToEdit = 'Cliquer pour modifier';

    out.forgetButton = 'OUBLIER';
    out.forgetButtonTitle = 'Enlever ce document de la liste en page d\'accueil';
    out.forgetPrompt = 'Cliquer sur OK supprimera l\'URL de ce document de la mémoire de votre navigateur (localStorage), êtes-vous sûr ?';

    out.shareButton = 'Partager';
    out.shareButtonTitle = "Copier l'URL dans le presse-papiers";
    out.shareSuccess = 'URL copiée dans le presse-papiers';
    out.shareFailed = "Échec de la copie de l'URL dans le presse-papiers";

    out.newPadButton = 'Nouveau';
    out.newPadButtonTitle = 'Créer un nouveau document';

    out.presentButton = 'PRÉSENTER';
    out.presentButtonTitle = "Entrer en mode présentation";
    out.presentSuccess = 'Appuyer sur Échap pour quitter le mode présentation';
    out.sourceButton = 'VOIR LA SOURCE';
    out.sourceButtonTitle = "Quitter le mode présentation";

    out.backgroundButton = 'COULEUR DE FOND';
    out.backgroundButtonTitle = 'Changer la couleur de fond de la présentation';
    out.colorButton = 'COULEUR DU TEXTE';
    out.colorButtonTitle = 'Changer la couleur du texte en mode présentation';

    out.commitButton = 'VALIDER';

    out.getViewButton = 'LECTURE SEULE';
    out.getViewButtonTitle = "Obtenir l'adresse d'accès à ce document en lecture seule";
    out.readonlyUrl = 'Document en lecture seule';
    out.copyReadOnly = "Copier l'URL dans le presse-papiers";
    out.openReadOnly = "Ouvrir dans un nouvel onglet";
    out.editShare = "Partager l'URL d'édition";
    out.editShareTitle = "Copier l'URL d'édition dans le presse-papiers";
    out.viewShare = "Partager l'URL de lecture";
    out.viewShareTitle = "Copier l'URL d'accès en lecture seule dans le presse-papiers";
    out.viewOpen = "Voir dans un nouvel onglet";
    out.viewOpenTitle = "Ouvrir le document en lecture seule dans un nouvel onglet";

    out.notifyJoined = "{0} a rejoint la session collaborative";
    out.notifyRenamed = "{0} a changé son nom en {1}";
    out.notifyLeft = "{0} a quitté la session collaborative";

    out.disconnectAlert = 'Perte de la connexion au réseau !';

    out.tryIt = 'Essayez-le !';
    out.recentPads = 'Vos documents récents (stockés uniquement dans votre navigateur)';
    out.recentPadsIframe = 'Vos documents récents';

    out.okButton = 'OK (Entrée)';

    out.cancel = "Annuler";
    out.cancelButton = 'Annuler (Echap)';

    out.loginText = '<p>Votre nom d\'utilisateur et votre mot de passe sont utilisés pour générer une clé unique qui reste inconnue de notre serveur.</p>\n' +
                    '<p>Faites attention de ne pas oublier vos identifiants puisqu\'ils seront impossible à récupérer.</p>'; //TODO

    out.forget = "Oublier";

    // Polls

    out.poll_title = "Sélecteur de date Zero Knowledge";
    out.poll_subtitle = "Planification de rendez-vous et sondages en <em>temps-réel</em> et Zero Knowledge";

    out.poll_p_save = "Vos modifications sont mises à jour instantanément, donc vous n'avez jamais besoin de sauver le contenu.";
    out.poll_p_encryption = "Tout ce que vous entrez est chiffré donc seules les personnes possédant le lien du sondage y ont accès. Même le serveur ne peut pas voir le contenu.";
    out.poll_p_howtouse = "Entrez votre nom dans le champ ci-dessous et cochez les cases lorsque les options vous conviennent.";

    out.promptName = "Quel est votre nom ?";

    out.wizardButton = 'ASSISTANT';
    out.wizardLog = "Cliquez sur le bouton dans le coin supérieur gauche pour retourner au sondage";
    out.wizardTitle = "Utiliser l'assistant pour créer votre sondage";
    out.wizardConfirm = "Êtes-vous vraiment prêt à ajouter ces options au sondage ?";

    out.poll_publish_button = "Publier";
    out.poll_admin_button = "Administrer";
    out.poll_create_user = "Ajouter un utilisateur";
    out.poll_create_option = "Ajouter une option";
    out.poll_commit = "Valider";

    out.poll_closeWizardButton = "Fermer l'assistant";
    out.poll_closeWizardButtonTitle = "Fermer l'assistant";
    out.poll_wizardComputeButton = "Générer les options";
    out.poll_wizardClearButton = "Vider le tableau";
    out.poll_wizardDescription = "Créer automatiquement des options en entrant des dates et des horaires correspondant";
    out.poll_wizardAddDateButton = "+ Dates";
    out.poll_wizardAddTimeButton = "+ Horaires";

    out.poll_addUserButton = "+ Utilisateurs";
    out.poll_addUserButtonTitle = "Cliquer pour ajouter un utilisateur";
    out.poll_addOptionButton = "+ Options";
    out.poll_addOptionButtonTitle = "Cliquer pour ajouter une option";
    out.poll_addOption = "Indiquer la nouvelle option";
    out.poll_optionPlaceholder = "Option";
    out.poll_addUser = "Entrer un nom";
    out.poll_userPlaceholder = "Votre nom";
    out.poll_removeOption = "Êtes-vous sûr de vouloir supprimer cette option ?";
    out.poll_removeOptionTitle = "Supprimer la ligne";
    out.poll_removeUser = "Êtes-vous sûr de vouloir supprimer cet utilisateur ?";
    out.poll_removeUserTitle = "Supprimer la colonne";
    out.poll_editOption = "Êtes-vous sûr de vouloir éditer cette option ?";
    out.poll_editOptionTitle = "Éditer la ligne";
    out.poll_editUser = "Êtes-vous sûr de vouloir éditer les choix de cet utilisateur ?";
    out.poll_editUserTitle = "Éditer la colonne";

    out.poll_titleHint = "Titre";
    out.poll_descriptionHint = "Description";

    // File manager

    out.fm_rootName = "Documents";
    out.fm_trashName = "Corbeille";
    out.fm_unsortedName = "Fichiers non triés";
    out.fm_filesDataName = "Tous les fichiers";
    out.fm_templateName = "Modèles";
    out.fm_newButton = "Nouveau";
    out.fm_newFolder = "Nouveau dossier";
    out.fm_folder = "Dossier";
    out.fm_folderName = "Nom du dossier";
    out.fm_numberOfFolders = "# de dossiers";
    out.fm_numberOfFiles = "# de fichiers";
    out.fm_fileName = "Nom du fichier";
    out.fm_title = "Titre";
    out.fm_lastAccess = "Dernier accès";
    out.fm_creation = "Création";
    out.fm_forbidden = "Action interdite";
    out.fm_originalPath = "Chemin d'origine";
    out.fm_noname = "Document sans titre";
    out.fm_emptyTrashDialog = "Êtes-vous sûr de vouloir vider la corbeille ?";
    out.fm_removeSeveralPermanentlyDialog = "Êtes-vous sûr de vouloir supprimer ces {0} éléments de manière permanente ?";
    out.fm_removePermanentlyDialog = "Êtes-vous sûr de vouloir supprimer cet élément de manière permanente ?";
    out.fm_restoreDialog = "Êtes-vous sûr de vouloir restaurer {0} à son emplacement précédent ?";
    out.fm_removeSeveralDialog = "Êtes-vous sûr de vouloir déplacer ces {0} éléments vers la corbeille ?";
    out.fm_removeDialog = "Êtes-vous sûr de vouloir déplacer {0} vers la corbeille ?";
    out.fm_unknownFolderError = "Le dossier sélectionné ou le dernier dossier visité n'existe plus. Ouverture du dossier parent...";
    out.fm_contextMenuError = "Impossible d'ouvrir le menu contextuel pour cet élément. Si le problème persiste, essayez de rechercher la page.";
    out.fm_selectError = "Impossible de sélectionner l'élément ciblé. Si le problème persiste, essayez de recharger la page.";
    out.fm_info_root = "Créez ici autant de dossiers que vous le souhaitez pour trier vos fichiers.";
    out.fm_info_unsorted = 'Contient tous les documents que vous avez ouvert et qui ne sont pas triés dans "Documents" ou déplacés vers la "Corbeille".'; // "My Documents" should match with the "out.fm_rootName" key, and "Trash" with "out.fm_trashName"
    out.fm_info_template = "Contient tous les fichiers que vous avez sauvés en tant que modèle afin de les réutiliser lors de la création d'un nouveau document.";
    out.fm_info_trash = 'Les fichiers supprimés dans la corbeille sont également enlevés de "Tous les fichiers" et il est impossible de les récupérer depuis l\'explorateur de fichiers.'; // Same here for "All files" and "out.fm_filesDataName"
    out.fm_info_allFiles = 'Contient tous les fichiers de "Documents", "Fichiers non triés" et "Corbeille". Vous ne pouvez pas supprimer ou déplacer des fichiers depuis cet endroit.'; // Same here
    out.fm_alert_backupUrl = "URL de secours pour ce disque.<br>" +
                             "Il est <strong>fortement recommandé</strong> de garder cette URL pour vous-même.<br>" +
                             "Elle vous servira en cas de perte des données de votre navigateur afin de retrouver vos fichiers.<br>" +
                             "Quiconque se trouve en possession de celle-ci peut modifier ou supprimer tous les fichiers de ce gestionnaire.<br>" +
                             '<input type="text" id="fm_backupUrl" value="{0}"/>';
    out.fm_backup_title = 'URL de secours';
    out.fm_nameFile = 'Comment souhaitez-vous nommer ce fichier ?';
    // File - Context menu
    out.fc_newfolder = "Nouveau dossier";
    out.fc_rename = "Renommer";
    out.fc_open = "Ouvrir";
    out.fc_open_ro = "Ouvrir (lecture seule)";
    out.fc_delete = "Supprimer";
    out.fc_restore = "Restaurer";
    out.fc_remove = "Supprimer définitivement";
    out.fc_empty = "Vider la corbeille";
    out.fc_newpad = "Nouveau pad de texte";
    out.fc_newcode = "Nouveau pad de code";
    out.fc_newslide = "Nouvelle présentation";
    out.fc_newpoll = "Nouveau sondage";
    out.fc_prop = "Propriétés";
    // fileObject.js (logs)
    out.fo_moveUnsortedError = "La liste des éléments non triés ne peut pas contenir de dossiers.";
    out.fo_existingNameError = "Ce nom est déjà utilisé dans ce répertoire. Veuillez en choisir un autre.";
    out.fo_moveFolderToChildError = "Vous ne pouvez pas déplacer un dossier dans un de ses descendants";
    out.fo_unableToRestore = "Impossible de restaurer ce fichier à son emplacement d'origine. Vous pouvez essayer de le déplacer à un nouvel emplacement.";
    out.fo_unavailableName = "Un fichier ou dossier avec le même nom existe déjà au nouvel emplacement. Renommez cet élément avant d'essayer à nouveau.";

    // login
    out.login_login = "Connexion";
    out.login_nologin = "Documents récents de ce navigateur";
    out.login_register = "Inscription";
    out.logoutButton = "Déconnexion";

    out.login_migrate = "Souhaitez-vous importer les données existantes de votre session anonyme ?";

    out.username_label = "Nom d'utilisateur : ";
    out.displayname_label = "Nom affiché : ";

    out.login_username = "votre nom d'utilisateur";
    out.login_password = "votre mot de passe";
    out.login_confirm = "confirmer votre mot de passe";
    out.login_remember = "Se souvenir de moi";

    out.login_cancel_prompt = "...ou si vous avez entré le mauvais nom d'utilisateur ou mot de passe, annulez pour essayer à nouveau.";

    out.login_registerSuccess = "Inscription réalisée avec succès. Prenez soin de ne pas oublier votre mot de passe !";
    out.login_passwordMismatch = "Les deux mots de passe entrés sont différents. Essayez à nouveau.";

    out.login_warning = [
        '<h1 id="warning">ATTENTION</h1>',
        '<p>Cryptpad sauve vos données personnelles dans un document temps-réel chiffré, comme pour tous les autres types de documents temps-réel.</p>',
        '<p>Votre nom d\'utilisateur et votre mot de passe ne sont jamais envoyés au serveur de manière non-chiffré.</p>',
        '<p>Ainsi, si vous oubliez votre nom d\'utilisateur ou votre mot de passe, il n\'y a absolument rien que nous puissions faire pour retrouver vos informations perdues.</p>',
        '<p><strong>Prenez soin de ne surtout pas oublier votre nom d\'utilisateur OU votre mot de passe !</strong></p>',
    ].join('\n');

    out.login_hashing = "Traitement de vos identifiants, cela peut nécessiter quelques instants.";

    out.login_no_user = "Il n'y a aucun utilisateur associé au nom et au mot de passe que vous avez entré.";
    out.login_confirm_password = "Veuillez taper de nouveau votre mot de passe pour vous inscrire...";

    out.loginText = '<p>Votre nom d\'utilisateur et votre mot d epasse sont utilisés pour générer une clé unique qui reste inconnue de notre serveur.</p>\n' +
                    '<p>Faîtes attention de ne pas perdre vos identifiants, puisqu\'il est impossible de les récupérer</p>';

    // index.html

    //out.main_p1 = 'CryptPad est l\'éditeur collaboratif en temps réel <strong>zero knowledge</strong>. Le chiffrement est effectué depuis votre navigateur, ce qui protège les données contre le serveur, le cloud, et la NSA. La clé de chiffrement est stockée dans l\'<a href="https://fr.wikipedia.org/wiki/Identificateur_de_fragment">identifieur de fragment</a> de l\'URL qui n\'est jamais envoyée au serveur mais est accessible depuis javascript, de sorte qu\'en partageant l\'URL, vous donnez l\'accès au pad à ceux qui souhaitent participer.';
    out.main_p1 = "<h2>Collaborez en tout confiance</h2><br>Développez vos idées collaborativement grâce à des documents partagés en temps-réel, tout en gardant vos données personnelles invisibles, même pour nous, avec la technologie <strong>Zero Knowledge</strong>.";
    out.main_p2 = 'Ce projet utilise l\'éditeur visuel (WYSIWYG) <a href="http://ckeditor.com/">CKEditor</a>, l\'éditeur de code source <a href="https://codemirror.net/">CodeMirror</a>, et le moteur temps-réel <a href="https://github.com/xwiki-contrib/chainpad">ChainPad</a>.';
    out.main_howitworks = 'Comment ça fonctionne';
    out.main_howitworks_p1 = 'CryptPad utilise une variante de l\'algorithme d\'<a href="https://en.wikipedia.org/wiki/Operational_transformation">Operational transformation</a> qui est capable de trouver un consensus distribué en utilisant <a href="https://bitcoin.org/bitcoin.pdf">une chaîne de bloc Nakamoto</a>, un outil popularisé par le <a href="https://fr.wikipedia.org/wiki/Bitcoin">Bitcoin</a>. De cette manière, l\'algorithme évite la nécessité d\'utiliser un serveur central pour résoudre les conflits d\'édition de l\'Operational Transformation, et sans ce besoin de résolution des conflits le serveur peut rester ignorant du contenu qui est édité dans le pad.';
    out.main_about = 'À propos';
    out.main_about_p1 = 'Vous pouvez en apprendre davantage sur notre <a href="/privacy.html" title="">politique de confidentialité</a> et nos <a href="/terms.html">conditions d\'utilisation</a>.';
    out.main_about_p2 = 'Si vous avez des questions ou commentaires, vous pouvez <a href="https://twitter.com/cryptpad">nous tweeter</a>, ouvrir une issue sur <a href="https://github.com/xwiki-labs/cryptpad/issues/" title="our issue tracker">Github</a>, venir dire bonjour sur IRC (<a href="http://webchat.freenode.net?channels=%23cryptpad&uio=MT1mYWxzZSY5PXRydWUmMTE9Mjg3JjE1PXRydWUe7" title="freenode webchat">irc.freenode.net</a>), ou <a href="mailto:research@xwiki.com">nous envoyer un email</a>.';
    out.main_openFileManager = 'Ouvrir dans un nouvel onglet';

    out.table_type = 'Type';
    out.table_link = 'Lien';
    out.table_created = 'Créé le';
    out.table_last = 'Dernier accès';

    out.makeAPad = 'Créer un document';
    out.button_newpad = 'Nouveau document texte';
    out.button_newcode = 'Nouvelle page de code';
    out.button_newpoll = 'Nouveau sondage';
    out.button_newslide = 'Nouvelle présentation';

    out.form_title = "Tous vos pads, partout où vous allez !";
    out.form_username = "Nom d'utilisateur";
    out.form_password = "Mot de passe";

    out.about = "À propos";
    out.privacy = "Vie privée";
    out.contact = "Contact";
    out.terms = "Conditions";

    // privacy.html

    out.policy_title = 'Politique de confidentialité de Cryptpad';
    out.policy_whatweknow = 'Ce que nous savons de vous';
    out.policy_whatweknow_p1 = 'En tant qu\'application hébergée sur le web, Cryptpad a accès aux meta-données exposées par le protocole HTTP. Ceci inclus votre adresse IP et d\'autres en-têtes HTTP qui peuvent être utilisées pour identifier votre propre navigateur. Vous pouvez voir quelles informations votre navigateur partage en visitant <a target="_blank" rel="noopener noreferrer" href="https://www.whatismybrowser.com/detect/what-http-headers-is-my-browser-sending" title="what http headers is my browser sending">WhatIsMyBrowser.com</a>.';
    out.policy_whatweknow_p2 = 'Nous utilisons <a href="https://piwik.org/" target="_blank" rel="noopener noreferrer" title="open source analytics platform">Piwik</a>, une plateforme open source d\'analytique, afin d\'en apprendre plus sur nos utilisateurs. Piwik nous indique comment vous avez trouvé Cryptpad, que ce soit par une entrée directe, par un moteur de recherche ou depuis un lien provenant d\'un autre site web tel que Reddit ou Twitter. Nous savons également quand vous visitez le site, sur quels liens vous cliquez dans les pages informatives et combien de temps vous restez sur une page donnée.';
    out.policy_whatweknow_p3 = 'Ces outils d\'analytique sont utilisés uniquement sur les pages informatives. Nous ne collectons aucune information concernant votre utilisation de nos applications "zero knowledge".';
    out.policy_howweuse = 'Comment nous utilisons ce que nous apprenons';
    out.policy_howweuse_p1 = 'Nous utilisons ces informations pour prendre de meilleures décisions concernant la communication autour de Cryptpad, en évaluant le succès de ce qui a été realisé par le passé. Les informations concernant votre localisation nous permettent de savoir si nous devons considérer l\'ajout de traductions de Cryptpad dans d\'autres langues que l\'anglais.';
    out.policy_howweuse_p2 = "Les informations concernant votre navigateur (que ce soit un système d\'exploitation de bureau ou d\'appareil portable) nous aident à prendre des décisions lors de la priorisation des ajouts et améliorations de fonctionnalités. Notre équipe de développement est petite, et nous essayons de prendre des décisions qui amélioreront l\'expérience du plus grand nombre d\'utilisateurs possible.";
    out.policy_whatwetell = 'Ce que nous dévoilons à d\'autres à propos de vous';
    out.policy_whatwetell_p1 = 'Nous ne fournissons aucune information que nous récoltons ou que vous nous fournissez à des tierces parties à moins d\'y être contraints par la loi.';
    out.policy_links = 'Liens vers d\'autres sites';
    out.policy_links_p1 = 'Ce site contient des liens vers d\'autres sites, certains étant produits par d\'autres organisations. Nous ne sommes responsables des pratiques de confidentialité ou du contenu d\'aucun site externe. De manière générale, les liens vers des sites externes sont lancés dans une nouvelle fenêtre (ou onglet) du navigateur, pour rendre clair le fait que vous quittez Cryptpad.fr.';
    out.policy_ads = 'Publicité';
    out.policy_ads_p1 = 'Nous n\'affichons pas de publicité en ligne, bien que nous puissions afficher des liens vers les sites des organisations qui financent nos recherches.';
    out.policy_choices = 'Vos choix';
    out.policy_choices_open = 'Notre code est open source, ce qui signifie que vous avez toujours la possibilité d\'héberger votre propre instance de Cryptpad.';
    out.policy_choices_vpn = 'Si vous souhaitez utiliser notre instance hébergée (cryptpad.fr) mais que vous ne souhaitez pas exposer votre adresse IP, vous pouvez la protéger en utilisant le <a href="https://www.torproject.org/projects/torbrowser.html.en" title="téléchargements du projet Tor" target="_blank" rel="noopener noreferrer">navigateur Tor</a>, ou un <a href="https://riseup.net/fr/vpn" title="VPNs fournis par Riseup" target="_blank" rel="noopener noreferrer">VPN</a>.';
    out.policy_choices_ads = 'Si vous souhaitez uniquement bloquer notre plateforme d\'analytique, vous pouvez utiliser un bloqueur de publicités tel que <a href="https://www.eff.org/fr/privacybadger" title="télécharger privacy badger" target="_blank" rel="noopener noreferrer">Privacy Badger</a>.';

    // terms.html

    out.tos_title = "Conditions d'utilisation de Cryptpad";
    out.tos_legal = "Veuillez ne pas être malveillant, abusif, ou faire quoi que ce soit d'illégal.";
    out.tos_availability = "Nous espérons que vous trouvez ce service utile, mais nous ne pouvons garantir ses performances et disponibilités. Nous vous recommandons d'exporter vos données régurlièrement.";
    out.tos_e2ee = "Les documents sur Cryptpad peuvent être lus et modifiés par quiconque est en mesure de deviner ou d'obtenir de quelque manière que ce soit l'identificateur de fragment du document. Nous vous recommandons d'utiliser des technologies de messagerie chiffrées de bout à bout (end-to-end encryption ou e2ee) pour partager les URLs, et déclinons toute responsabilité dans le cas ou une telle URL serait divulguée.";
    out.tos_logs = "Les meta-données fournies par votre navigateur au serveur peuvent être enregistrées dans le but de maintenir le service.";
    out.tos_3rdparties = "Nous ne fournissons aucune donnée individuelle à des tierces parties à moins d'y être contraints par la loi.";

    // BottomBar.html

    out.bottom_france = '<a href="http://www.xwiki.com/fr" target="_blank" rel="noopener noreferrer">Fait avec <img class="bottom-bar-heart" src="/customize/heart.png" alt="amour" /> en <img class="bottom-bar-fr" src="/customize/fr.png" alt="France" /></a>';
    out.bottom_support = '<a href="http://labs.xwiki.com/" title="XWiki Labs" target="_blank" rel="noopener noreferrer">Un projet <img src="/customize/logo-xwiki2.png" alt="XWiki SAS" class="bottom-bar-xwiki"/> Labs</a> avec le soutien de <a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';

    // Header.html

    out.header_france = '<a href="http://www.xwiki.com/fr" target="_blank" rel="noopener noreferrer">Fait avec <img class="bottom-bar-heart" src="/customize/heart.png" alt="amour" /> en <img class="bottom-bar-fr" title="France" alt="France" src="/customize/fr.png" /> par <img src="/customize/logo-xwiki.png" alt="XWiki SAS" class="bottom-bar-xwiki"/></a>';
    out.header_support = '<a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';
    out.header_logoTitle = "Aller vers la page d'accueil";

    return out;
});
