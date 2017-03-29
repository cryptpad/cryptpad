define(function () {
    var out = {};

    out.main_title = "CryptPad: Éditeur collaboratif en temps réel, zero knowledge";
    out.main_slogan = "L'unité est la force, la collaboration est la clé";

    out.type = {};
    out.type.pad = 'Texte';
    out.type.code = 'Code';
    out.type.poll = 'Sondage';
    out.type.slide = 'Présentation';
    out.type.drive = 'Drive';
    out.type.whiteboard = "Tableau Blanc";

    out.button_newpad = 'Nouveau document texte';
    out.button_newcode = 'Nouvelle page de code';
    out.button_newpoll = 'Nouveau sondage';
    out.button_newslide = 'Nouvelle présentation';
    out.button_newwhiteboard = 'Nouveau tableau blanc';

    out.updated_0_common_connectionLost = "<b>Connexion au serveur perdue</b><br>Vous êtes désormais en mode lecture seule jusqu'au retour de la connexion.";
    out.common_connectionLost = out.updated_0_common_connectionLost;

    out.websocketError = 'Impossible de se connecter au serveur WebSocket...';
    out.typeError = "Ce pad n'est pas compatible avec l'application sélectionnée";
    out.onLogout = 'Vous êtes déconnecté de votre compte utilisateur, <a href="/" target="_blank">cliquez ici</a> pour vous authentifier<br>ou appuyez sur <em>Échap</em> pour accéder au pad en mode lecture seule.';
    out.wrongApp = "Impossible d'afficher le contenu de ce document temps-réel dans votre navigateur. Vous pouvez essayer de recharger la page.";

    out.loading = "Chargement...";
    out.error = "Erreur";
    out.saved = "Enregistré";

    out.disconnected = 'Déconnecté';
    out.synchronizing = 'Synchronisation';
    out.reconnecting = 'Reconnexion...';
    out.lag = 'Latence';
    out.readonly = 'Lecture seule';
    out.anonymous = "Anonyme";
    out.yourself = "Vous-même";
    out.anonymousUsers = "éditeurs anonymes";
    out.anonymousUser = "éditeur anonyme";
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

    out.importButtonTitle = 'Importer un pad depuis un fichier local';

    out.exportButtonTitle = 'Exporter ce pad vers un fichier local';
    out.exportPrompt = 'Comment souhaitez-vous nommer ce fichier ?';

    out.changeNamePrompt = 'Changer votre nom (laisser vide pour rester anonyme) : ';
    out.user_rename = "Changer le nom affiché";
    out.user_displayName = "Nom affiché";
    out.user_accountName = "Nom d'utilisateur";

    out.clickToEdit = 'Cliquer pour modifier';

    out.forgetButtonTitle = 'Déplacer ce pad vers la corbeille';
    out.forgetPrompt = 'Cliquer sur OK déplacera ce pad vers la corbeille de votre CryptDrive, êtes-vous sûr ?';
    out.movedToTrash = 'Ce pad a été déplacé vers la corbeille.<br><a href="/drive/">Accéder à mon Drive</a>';

    out.shareButton = 'Partager';
    out.shareSuccess = 'Lien copié dans le presse-papiers';

    out.newButton = 'Nouveau';
    out.newButtonTitle = 'Créer un nouveau pad';

    out.presentButtonTitle = "Entrer en mode présentation";
    out.presentSuccess = 'Appuyer sur Échap pour quitter le mode présentation';

    out.backgroundButtonTitle = 'Changer la couleur de fond de la présentation';
    out.colorButtonTitle = 'Changer la couleur du texte en mode présentation';

    out.printButton = "Imprimer (Entrée)";
    out.printButtonTitle = "Imprimer votre présentation ou l'enregistrer au format PDF";
    out.printOptions = "Options de mise en page";
    out.printSlideNumber = "Afficher le numéro des slides";
    out.printDate = "Afficher la date";
    out.printTitle = "Afficher le titre du pad";
    out.printCSS = "Personnaliser l'apparence (CSS):";

    out.slideOptionsTitle = "Personnaliser la présentation";
    out.slideOptionsButton = "Enregistrer (Entrée)";

    out.editShare = "Lien d'édition";
    out.editShareTitle = "Copier le lien d'édition dans le presse-papiers";
    out.editOpen = "Éditer dans un nouvel onglet";
    out.editOpenTitle = "Ouvrir le lien d'édition dans un nouvel onglet";
    out.viewShare = "Lien de lecture-seule";
    out.viewShareTitle = "Copier lien d'accès en lecture seule dans le presse-papiers";
    out.viewOpen = "Voir dans un nouvel onglet";
    out.viewOpenTitle = "Ouvrir le lien en lecture seule dans un nouvel onglet";

    out.notifyJoined = "{0} a rejoint la session collaborative";
    out.notifyRenamed = "{0} a changé son nom en {1}";
    out.notifyLeft = "{0} a quitté la session collaborative";

    out.okButton = 'OK (Entrée)';

    out.cancel = "Annuler";
    out.cancelButton = 'Annuler (Echap)';

    // Polls

    out.poll_title = "Sélecteur de date Zero Knowledge";
    out.poll_subtitle = "Planification de rendez-vous et sondages en <em>temps-réel</em> et Zero Knowledge";

    out.poll_p_save = "Vos modifications sont mises à jour instantanément, donc vous n'avez jamais besoin de sauver le contenu.";
    out.poll_p_encryption = "Tout ce que vous entrez est chiffré donc seules les personnes possédant le lien du sondage y ont accès. Même le serveur ne peut pas voir le contenu.";

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

    out.poll_optionPlaceholder = "Option";
    out.poll_userPlaceholder = "Votre nom";
    out.poll_removeOption = "Êtes-vous sûr de vouloir supprimer cette option ?";
    out.poll_removeUser = "Êtes-vous sûr de vouloir supprimer cet utilisateur ?";

    out.poll_titleHint = "Titre";
    out.poll_descriptionHint = "Description";

    // File manager

    out.fm_rootName = "Documents";
    out.fm_trashName = "Corbeille";
    out.fm_unsortedName = "Fichiers non triés";
    out.fm_filesDataName = "Tous les fichiers";
    out.fm_templateName = "Modèles";
    out.fm_searchName = "Recherche";
    out.fm_searchPlaceholder = "Rechercher...";
    out.fm_newButton = "Nouveau";
    out.fm_newButtonTitle = "Créer un nouveau pad ou un dossier";
    out.fm_newFolder = "Nouveau dossier";
    out.fm_newFile = "Nouveau pad";
    out.fm_folder = "Dossier";
    out.fm_folderName = "Nom du dossier";
    out.fm_numberOfFolders = "# de dossiers";
    out.fm_numberOfFiles = "# de fichiers";
    out.fm_fileName = "Nom du fichier";
    out.fm_title = "Titre";
    out.fm_type = "Type";
    out.fm_lastAccess = "Dernier accès";
    out.fm_creation = "Création";
    out.fm_forbidden = "Action interdite";
    out.fm_originalPath = "Chemin d'origine";
    out.fm_openParent = "Montrer dans le dossier";
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
    out.fm_categoryError = "Impossible d'afficher la catégorie sélectionnée, affichage de Documents";
    out.fm_info_root = "Créez ici autant de dossiers que vous le souhaitez pour trier vos fichiers.";
    out.fm_info_unsorted = 'Contient tous les pads que vous avez ouvert et qui ne sont pas triés dans "Documents" ou déplacés vers la "Corbeille".'; // "My Documents" should match with the "out.fm_rootName" key, and "Trash" with "out.fm_trashName"
    out.fm_info_template = "Contient tous les fichiers que vous avez sauvés en tant que modèle afin de les réutiliser lors de la création d'un nouveau pad.";
    out.fm_info_trash = 'Les fichiers supprimés dans la corbeille sont également enlevés de "Tous les fichiers" et il est impossible de les récupérer depuis l\'explorateur de fichiers.'; // Same here for "All files" and "out.fm_filesDataName"
    out.fm_info_allFiles = 'Contient tous les fichiers de "Documents", "Fichiers non triés" et "Corbeille". Vous ne pouvez pas supprimer ou déplacer des fichiers depuis cet endroit.'; // Same here
    out.fm_alert_backupUrl = "Lien de secours pour ce disque.<br>" +
                             "Il est <strong>fortement recommandé</strong> de garder ce lien pour vous-même.<br>" +
                             "Elle vous servira en cas de perte des données de votre navigateur afin de retrouver vos fichiers.<br>" +
                             "Quiconque se trouve en possession de celle-ci peut modifier ou supprimer tous les fichiers de ce gestionnaire.<br>";
    out.fm_backup_title = 'Lien de secours';
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
    out.fc_prop = "Propriétés";
    // fileObject.js (logs)
    out.fo_moveUnsortedError = "La liste des éléments non triés ne peut pas contenir de dossiers.";
    out.fo_existingNameError = "Ce nom est déjà utilisé dans ce répertoire. Veuillez en choisir un autre.";
    out.fo_moveFolderToChildError = "Vous ne pouvez pas déplacer un dossier dans un de ses descendants";
    out.fo_unableToRestore = "Impossible de restaurer ce fichier à son emplacement d'origine. Vous pouvez essayer de le déplacer à un nouvel emplacement.";
    out.fo_unavailableName = "Un fichier ou dossier avec le même nom existe déjà au nouvel emplacement. Renommez cet élément avant d'essayer à nouveau.";

    // login
    out.login_login = "Connexion";
    out.login_makeAPad = 'Créer un pad anonymement';
    out.login_nologin = "Voir les pads récents";
    out.login_register = "Inscription";
    out.logoutButton = "Déconnexion";
    out.settingsButton = "Préférences";

    out.login_username = "Nom d'utilisateur";
    out.login_password = "Mot de passe";
    out.login_confirm = "Confirmer votre mot de passe";
    out.login_remember = "Se souvenir de moi";

    out.login_hashing = "Traitement de vos identifiants, cela peut nécessiter quelques instants.";

    out.login_hello = 'Bonjour {0},'; // {0} is the username
    out.login_helloNoName = 'Bonjour,';
    out.login_accessDrive = 'Accédez à votre drive';
    out.login_orNoLogin = 'ou';

    out.login_noSuchUser = "Nom d'utilisateur ou mot de passe invalide. Veuillez vous inscrire ou réessayer.";
    out.login_invalUser = "Nom d'utilisateur requis";
    out.login_invalPass = 'Mot de passe requis';
    out.login_unhandledError = "Une erreur inattendue s'est produite :(";

    out.register_importRecent = "Importer l'historique (Recommendé)";
    out.register_acceptTerms = "J'accepte <a href='/terms.html'>les conditions d'utilisation</a>";
    out.register_passwordsDontMatch = "Les mots de passe doivent être identiques!";
    out.register_mustAcceptTerms = "Vous devez accepter les conditions d'utilisation.";
    out.register_mustRememberPass = "Nous ne pouvons pas réinitialiser votre mot de passe si vous l'oubliez. C'est important que vous vous en souveniez! Veuillez cocher la case pour confirmer.";
    out.register_writtenPassword = "J'ai bien noté mon nom d'utilisateur et mon mot de passe, continuer";
    out.register_cancel = "Retour";
    out.register_warning = "Zero Knowledge signifie que nous ne pouvons pas récupérer vos données si vous perdez vos identifiants.";
    out.register_alreadyRegistered = "Cet utilisateur existe déjà, souhaitez-vous vous connecter ?";

    out.register_header = "Bienvenue dans CryptPad";
    out.register_explanation = [
        "<p>Faisons d'abord le point sur certaines choses</p>",
        "<ul>",
            "<li>Votre mot de passe est la clé secrète de tous vos pads. Si vous le perdez, il n'y a aucun moyen de récupérer vos données.</li>",
            "<li>Vous pouvez importer les pads récents de ce navigateur pour les avoir dans votre compte utilisateur.</li>",
            "<li>Si vous utilisez un ordinateur partagé, vous devez vous déconnecter avant de partir, fermer l'onglet n'est pas suffisant.</li>",
        "</ul>"
    ];

    // Settings
    out.settings_title = "Préférences";
    out.settings_save = "Sauver";
    out.settings_backupTitle = "Créer ou restaurer une sauvegarde de vos données";
    out.settings_backup = "Créer une sauvegarde";
    out.settings_restore = "Restaurer une sauvegarde";
    out.settings_resetTitle = "Vider votre drive";
    out.settings_reset = "Supprimer tous les fichiers et dossiers de votre CryptDrive";
    out.settings_resetPrompt = "Cette action va supprimer tous les pads de votre drive.<br>"+
                               "Êtes-vous sûr de vouloir continuer ?<br>" +
                               "Tapez “<em>I love CryptPad</em>” pour confirmer.";
    out.settings_resetDone = "Votre drive est désormais vide!";
    out.settings_resetError = "Texte de vérification incorrect. Votre CryptDrive n'a pas été modifié.";
    out.settings_resetTips = "Astuces et informations dans CryptDrive";
    out.settings_resetTipsButton = "Réinitialiser les astuces visibles dans CryptDrive";
    out.settings_resetTipsDone = "Toutes les astuces sont de nouveau visibles.";

    out.settings_importTitle = "Importer les pads récents de ce navigateur dans mon CryptDrive";
    out.settings_import = "Importer";
    out.settings_importConfirm = "Êtes-vous sûr de vouloir importer les pads récents de ce navigateur dans le CryptDrive de votre compte utilisateur ?";
    out.settings_importDone = "Importation terminée";

    out.settings_userFeedbackHint1 = "CryptPad peut envoyer des retours d'expérience très limités vers le serveur, de manière à nous permettre d'améliorer l'expérience des utilisateurs.";
    out.settings_userFeedbackHint2 = "Le contenu de vos pads et les clés de déchiffrement ne seront jamais partagés avec le serveur.";
    out.settings_userFeedback = "Activer l'envoi de retours d'expérience";

    out.settings_anonymous = "Vous n'êtes pas connectés. Ces préférences seront utilisées pour ce navigateur.";
    out.settings_publicSigningKey = "Clé publique de signature";

    // index.html

    //about.html
    out.main_p2 = 'Ce projet utilise l\'éditeur visuel (WYSIWYG) <a href="http://ckeditor.com/">CKEditor</a>, l\'éditeur de code source <a href="https://codemirror.net/">CodeMirror</a>, et le moteur temps-réel <a href="https://github.com/xwiki-contrib/chainpad">ChainPad</a>.';
    out.main_howitworks_p1 = 'CryptPad utilise une variante de l\'algorithme d\'<a href="https://en.wikipedia.org/wiki/Operational_transformation">Operational transformation</a> qui est capable de trouver un consensus distribué en utilisant <a href="https://bitcoin.org/bitcoin.pdf">une chaîne de bloc Nakamoto</a>, un outil popularisé par le <a href="https://fr.wikipedia.org/wiki/Bitcoin">Bitcoin</a>. De cette manière, l\'algorithme évite la nécessité d\'utiliser un serveur central pour résoudre les conflits d\'édition de l\'Operational Transformation, et sans ce besoin de résolution des conflits le serveur peut rester ignorant du contenu qui est édité dans le pad.';
    //contact.html
    out.main_about_p2 = 'Si vous avez des questions ou commentaires, vous pouvez <a href="https://twitter.com/cryptpad">nous tweeter</a>, ouvrir une issue sur <a href="https://github.com/xwiki-labs/cryptpad/issues/" title="our issue tracker">Github</a>, venir dire bonjour sur IRC (<a href="http://webchat.freenode.net?channels=%23cryptpad&uio=MT1mYWxzZSY5PXRydWUmMTE9Mjg3JjE1PXRydWUe7" title="freenode webchat">irc.freenode.net</a>), ou <a href="mailto:research@xwiki.com">nous envoyer un email</a>.';

    out.main_info = "<h2>Collaborez avec confiance</h2><br>Développez vos idées en groupe avec des document partagés; la technologie <strong>Zero Knowledge</strong> sécurise vos données.";

    out.main_howitworks = 'Comment ça fonctionne';
    out.main_zeroKnowledge = 'Zero Knowledge';
    out.main_zeroKnowledge_p = "Vous n'avez pas besoin de croire que nous n'<em>allons</em> pas regarder vos pads. Avec la technologie Zero Knowledge de CryptPad, nous ne <em>pouvons</em> pas le faire. Apprenez-en plus sur notre manière de <a href=\"privacy.html\" title='Protection des données'>protéger vos données</a>.";
    out.main_writeItDown = 'Prenez-en note';
    out.main_writeItDown_p = "Les plus grands projets naissent des plus petites idées. Prenez note de vos moments d'inspiration et de vos idées inattendues car vous ne savez pas lesquels seront des découvertes capitales.";
    out.main_share = 'Partager le lien, partager le pad';
    out.main_share_p = "Faites croître vos idées à plusieurs : réalisez des réunions efficaes, collaborez sur vos listes de tâches et réalisez des présentations rapide avec tous vos amis sur tous vos appareils.";
    out.main_organize = 'Soyez organisés';
    out.main_organize_p = "Avec le CryptPad Drive, vous pouvez garder vos vues sur ce qui est important. Les dossiers vous permettent de garder la trace de vos projets et d'avoir une vision globale du travail effectué.";
    out.tryIt = 'Essayez-le !';
    out.main_richText = 'Éditeur de texte';
    out.main_richText_p = 'Éditez des documents texte collaborativement avec notre application <a href="http://ckeditor.com" target="_blank">CkEditor</a> temps-réel et Zero Knowledge.';
    out.main_code = 'Éditeur de code';
    out.main_code_p = 'Modifier votre code collaborativement grâce à notre application <a href="https://www.codemirror.net" target="_blank">CodeMirror</a> temps-réel et Zero Knowledge.';
    out.main_slide = 'Présentations';
    out.main_slide_p = 'Créez vos présentations en syntaxe Markdown collaborativement de manière sécurisée et affichez les dans votre navigateur.';
    out.main_poll = 'Sondages';
    out.main_poll_p = 'Plannifiez vos réunions ou évènements, ou votez pour la meilleure solution concernant votre problème.';
    out.main_drive = 'CryptDrive';

    out.footer_applications = "Applications";
    out.footer_contact = "Contact";
    out.footer_aboutUs = "À propos";

    out.about = "À propos";
    out.privacy = "Vie privée";
    out.contact = "Contact";
    out.terms = "Conditions";
    out.blog = "Blog";

    // privacy.html

    out.policy_title = 'Politique de confidentialité de CryptPad';
    out.policy_whatweknow = 'Ce que nous savons de vous';
    out.policy_whatweknow_p1 = 'En tant qu\'application hébergée sur le web, CryptPad a accès aux meta-données exposées par le protocole HTTP. Ceci inclus votre adresse IP et d\'autres en-têtes HTTP qui peuvent être utilisées pour identifier votre propre navigateur. Vous pouvez voir quelles informations votre navigateur partage en visitant <a target="_blank" rel="noopener noreferrer" href="https://www.whatismybrowser.com/detect/what-http-headers-is-my-browser-sending" title="what http headers is my browser sending">WhatIsMyBrowser.com</a>.';
    out.policy_whatweknow_p2 = 'Nous utilisons <a href="https://piwik.org/" target="_blank" rel="noopener noreferrer" title="open source analytics platform">Piwik</a>, une plateforme open source d\'analytique, afin d\'en apprendre plus sur nos utilisateurs. Piwik nous indique comment vous avez trouvé CryptPad, que ce soit par une entrée directe, par un moteur de recherche ou depuis un lien provenant d\'un autre site web tel que Reddit ou Twitter. Nous savons également quand vous visitez le site, sur quels liens vous cliquez dans les pages informatives et combien de temps vous restez sur une page donnée.';
    out.policy_howweuse = 'Comment nous utilisons ce que nous apprenons';
    out.policy_howweuse_p1 = 'Nous utilisons ces informations pour prendre de meilleures décisions concernant la communication autour de CryptPad, en évaluant le succès de ce qui a été realisé par le passé. Les informations concernant votre localisation nous permettent de savoir si nous devons considérer l\'ajout de traductions de CryptPad dans d\'autres langues que l\'anglais.';
    out.policy_howweuse_p2 = "Les informations concernant votre navigateur (que ce soit un système d\'exploitation de bureau ou d\'appareil portable) nous aident à prendre des décisions lors de la priorisation des ajouts et améliorations de fonctionnalités. Notre équipe de développement est petite, et nous essayons de prendre des décisions qui amélioreront l\'expérience du plus grand nombre d\'utilisateurs possible.";
    out.policy_whatwetell = 'Ce que nous dévoilons à d\'autres à propos de vous';
    out.policy_whatwetell_p1 = 'Nous ne fournissons aucune information que nous récoltons ou que vous nous fournissez à des tierces parties à moins d\'y être contraints par la loi.';
    out.policy_links = 'Liens vers d\'autres sites';
    out.policy_links_p1 = 'Ce site contient des liens vers d\'autres sites, certains étant produits par d\'autres organisations. Nous ne sommes responsables des pratiques de confidentialité ou du contenu d\'aucun site externe. De manière générale, les liens vers des sites externes sont lancés dans une nouvelle fenêtre (ou onglet) du navigateur, pour rendre clair le fait que vous quittez CryptpPad.fr.';
    out.policy_ads = 'Publicité';
    out.policy_ads_p1 = 'Nous n\'affichons pas de publicité en ligne, bien que nous puissions afficher des liens vers les sites des organisations qui financent nos recherches.';
    out.policy_choices = 'Vos choix';
    out.policy_choices_open = 'Notre code est open source, ce qui signifie que vous avez toujours la possibilité d\'héberger votre propre instance de CryptPad.';
    out.policy_choices_vpn = 'Si vous souhaitez utiliser notre instance hébergée (cryptpad.fr) mais que vous ne souhaitez pas exposer votre adresse IP, vous pouvez la protéger en utilisant le <a href="https://www.torproject.org/projects/torbrowser.html.en" title="téléchargements du projet Tor" target="_blank" rel="noopener noreferrer">navigateur Tor</a>, ou un <a href="https://riseup.net/fr/vpn" title="VPNs fournis par Riseup" target="_blank" rel="noopener noreferrer">VPN</a>.';
    out.policy_choices_ads = 'Si vous souhaitez uniquement bloquer notre plateforme d\'analytique, vous pouvez utiliser un bloqueur de publicités tel que <a href="https://www.eff.org/fr/privacybadger" title="télécharger privacy badger" target="_blank" rel="noopener noreferrer">Privacy Badger</a>.';

    // terms.html

    out.tos_title = "Conditions d'utilisation de CryptPad";
    out.tos_legal = "Veuillez ne pas être malveillant, abusif, ou faire quoi que ce soit d'illégal.";
    out.tos_availability = "Nous espérons que vous trouvez ce service utile, mais nous ne pouvons garantir ses performances et disponibilités. Nous vous recommandons d'exporter vos données régurlièrement.";
    out.tos_e2ee = "Le contenu sur CryptPad peuvent être lus et modifiés par quiconque est en mesure de deviner ou d'obtenir de quelque manière que ce soit l'identificateur de fragment du pad. Nous vous recommandons d'utiliser des technologies de messagerie chiffrées de bout à bout (end-to-end encryption ou e2ee) pour partager les liens, et déclinons toute responsabilité dans le cas ou un tel lien serait divulgué.";
    out.tos_logs = "Les meta-données fournies par votre navigateur au serveur peuvent être enregistrées dans le but de maintenir le service.";
    out.tos_3rdparties = "Nous ne fournissons aucune donnée individuelle à des tierces parties à moins d'y être contraints par la loi.";

    // BottomBar.html

    out.bottom_france = '<a href="http://www.xwiki.com/fr" target="_blank" rel="noopener noreferrer">Fait avec <img class="bottom-bar-heart" src="/customize/heart.png" alt="amour" /> en <img class="bottom-bar-fr" src="/customize/fr.png" alt="France" /></a>';
    out.bottom_support = '<a href="http://labs.xwiki.com/" title="XWiki Labs" target="_blank" rel="noopener noreferrer">Un projet <img src="/customize/logo-xwiki2.png" alt="XWiki SAS" class="bottom-bar-xwiki"/> Labs</a> avec le soutien de <a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';

    // Header.html

    out.header_france = '<a href="http://www.xwiki.com/fr" target="_blank" rel="noopener noreferrer">Fait avec <img class="bottom-bar-heart" src="/customize/heart.png" alt="amour" /> en <img class="bottom-bar-fr" title="France" alt="France" src="/customize/fr.png" /> par <img src="/customize/logo-xwiki.png" alt="XWiki SAS" class="bottom-bar-xwiki"/></a>';
    out.header_support = '<a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';
    out.header_logoTitle = "Aller vers la page d'accueil";

    // Initial states

    out.initialState = [
        '<span style="font-size:18px;"><p>',
        'Voici <strong>CryptPad</strong>, l\'éditeur collaboratif en temps-réel Zero Knowledge. Tout est sauvegardé dés que vous le tapez.',
        '<br>',
        'Partagez le lien vers ce pad avec des amis ou utilisez le bouton <span style="background-color:#449d44;color:#ffffff;">&nbsp;Partager&nbsp;</span> pour obtenir le <em>lien de lecture-seule</em>, qui permet la lecture mais non la modification.',
        '</p>',
        '<p><span style="color:#808080; font-size: 18px;">',
        '<em>',
        'Lancez-vous, commencez à taper...',
        '</em></span></p></span>',
        '<p>&nbsp;<br></p>'
    ].join('');

    out.codeInitialState = [
        '/*\n',
        '   Voici l\'éditeur de code collaboratif et Zero Knowledge de CryptPad.\n',
        '   Ce que vous tapez ici est chiffré de manière que seules les personnes avec le lien peuvent y accéder.\n',
        '   Vous pouvez choisir le langage de programmation pour la coloration syntaxique, ainsi que le thème de couleurs, dans le coin supérieur droit.\n',
        '*/'
    ].join('');

    out.slideInitialState = [
        '# CryptSlide\n',
        '* Voici CryptPad, l\'éditeur collaboratif en temps-réel Zero Knowledge.\n',
        '* Ce que vous tapez ici est chiffré de manière que seules les personnes avec le lien peuvent y accéder.\n',
        '* Même le serveur est incapable de voir ce que vous tapez.\n',
        '* Ce que vous voyez ici, ce que vous entendez, quand vous partez, ça reste ici.\n',
        '\n',
        '---',
        '\n',
        '# Comment l\'utiliser\n',
        '1. Écrivez le contenu de votre présentation avec la syntaxe Markdown\n',
        '  - Apprenez à utiliser markdown en cliquant [ici](http://www.markdowntutorial.com/)\n',
        '2. Séparez vos slides avec ---\n',
        '3. Cliquez sur la bouton "lecture" pour afficher le résultat en mode présentation',
        '  - La présentation est mise à jour en temps-réel'
    ].join('');

    out.driveReadmeTitle = "Qu'est-ce que CryptDrive ?";
    out.readme_welcome = "Bienvenue dans CryptPad !";
    out.readme_p1 = "Bienvenue dans CryptPad, le lieu où vous pouvez prendre des notes seul ou avec des amis.";
    out.readme_p2 = "Ce pad va vous donner un aperçu de la manière dont vous pouvez utiliser CryptPad pour prendre des notes, les organiser et travailler en groupe sur celles-ci.";
    out.readme_cat1 = "Découvrez votre CryptDrive";
    out.readme_cat1_l1 = "Créer un pad : Dans votre CryptDrive, cliquez sur {0} puis {1} et vous obtenez un nouveau pad."; // 0: New, 1: Rich Text
    out.readme_cat1_l2 = "Ouvrir des pads depuis votre CryptDrive : Double-cliquez sur l'icone d'un pad pour l'ouvrir.";
    out.readme_cat1_l3 = "Organiser vos pads : Quand vous êtes connectés, tous les pads auquel vous accédez sont ajoutés dans la section {0} de votre CryptDrive."; // 0: Unsorted files
    out.readme_cat1_l3_l1 = "Vous pouvez cliquer et faire glisser des fichiers dans des dossiers dans la section {0} de votre CryptDrive, et créer de nouveaux dossiers."; // 0: Documents
    out.readme_cat1_l3_l2 = "N'hésitez pas à utiliser le clic droit sur les icones puisque des menus sont souvent disponibles.";
    out.readme_cat1_l4 = "Déplacer des pads vers la corbeille : Vous pouvez cliquer et faire glisser vos pads dans la {0} de la même manière que vous pouvez les déposer dans des dossiers."; // 0: Trash
    out.readme_cat2 = "Créer des pads comme un pro";
    out.edit = "éditer";
    out.view = "voir";
    out.readme_cat2_l1 = "Le bouton {0} dans votre pad vous permet de donner l'accès à vos collaborateurs que ce soit pour l'{1} ou pour le {2}."; // 0: Share, 1: edit, 2: view
    out.readme_cat2_l2 = "Vous pouvez changer le titre d'un pad en cliquant sur le crayon";
    out.readme_cat3 = "Découvrez les autres applications CryptPad";
    out.readme_cat3_l1 = "Avec l'éditeur de code de CryptPad, vous pouvez collaborer sur du code comme Javascript ou des langages comme HTML ou Markdown.";
    out.readme_cat3_l2 = "Avec l'éditeur de présentations de CryptPad, vous pouvez réaliser des présentations rapides en utilisant Markdown";
    out.readme_cat3_l3 = "Avec CryptPoll vous pouvez créer rapidement des sondages, et en particulier plannifier des meetings qui rentrent dans l'agenda de tout ceux qui souhaitent participer.";

    // Tips
    out.tips = {};
    out.tips.lag = "L'icône verte dans le coin supérieur droit montre la qualité de votre connexion Internet vers le serveur CryptPad.";
    out.tips.shortcuts = "`ctrl+b`, `ctrl+i` et `ctrl+u` sont des raccourcis rapides pour mettre en gras, en italique ou souligner.";
    out.tips.indent = "Dans les listes à puces ou numérotées, vous pouvez utiliser `Tab` ou `Maj+Tab` pour augmenter ou réduire rapidement l'indentation.";
    out.tips.title = "Vous pouvez changer le titre de votre pad en cliquant au centre en haut de la page.";
    out.tips.store = "Dés que vous ouvrez un nouveau pad, il est automatiquement stocké dans votre CryptDrive si vous êtes connectés.";
    out.tips.marker = "Vous pouvez surligner du texte dans un pad en utilisant l'option \"marker\" dans le menu déroulant des styles.";

    out.feedback_about = "Si vous lisez ceci, vous vous demandez probablement pourquoi CryptPad envoie des requêtes vers des pages web quand vous realisez certaines actions.";
    out.feedback_privacy = "Nous prenons au sérieux le respect de votre vie privée, et en même temps nous souhaitons rendre CryptPad très simple à utiliser. Nous utilisons cette page pour comprendre quelles foncitonnalités dans l'interface comptent le plus pour les utilisateurs, en l'appelant avec un paramètre spécifiant quelle action a été réalisée.";
    out.feedback_optout = "Si vous le souhaitez, vous pouvez désactiver ces requêtes en vous rendant dans <a href='/settings/'>votre page de préférences</a>, où vous trouverez une case à cocher pour désactiver le retour d'expérience.";

    return out;
});
