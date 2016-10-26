define(function () {
    var out = {};

    out._languageName = "Français";

    out.main_title = "Cryptpad: Editeur collaboratif en temps réel, zero knowledge";

    out.type = {};
    out.type.pad = 'Pad';
    out.type.code = 'Code';
    out.type.poll = 'Sondage';
    out.type.slide = 'Présentation';

    out.errorBox_errorType_disconnected = 'Connexion perdue';
    out.errorBox_errorExplanation_disconnected = [
        'La connexion au serveur a été perdue. Vous pouvez essayer de vous reconnecter en rechargeant la page',
        'ou vous pouvez revoir votre travail en fermant cette boîte de dialogue.',
    ].join('');

    out.common_connectionLost = 'Connexion au serveur perdue';

    out.disconnected = 'Déconnecté';
    out.synchronizing = 'Synchronisation';
    out.reconnecting = 'Reconnexion...';
    out.lag = 'Latence';
    out.readonly = 'Lecture seule';
    out.anonymous = "Anonyme";
    out.yourself = "Vous-même";
    out.anonymousUsers = "utilisateurs anonymes";
    out.anonymousUser = "utilisateur anonyme";
    out.shareView = "URL de lecture seule";
    out.shareEdit = "URL d'édition";
    out.users = "Utilisateurs";
    out.and = "Et";
    out.viewer = "lecteur";
    out.viewers = "lecteurs";
    out.editor = "éditeur";
    out.editors = "éditeurs";

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

    out.okButton = 'OK (Entrée)';
    out.cancelButton = 'Annuler (Echap)';

    out.loginText = '<p>Votre nom d\'utilisateur et votre mot de passe sont utilisés pour générer une clé unique qui reste inconnue de notre serveur.</p>\n' +
                    '<p>Faites attention de ne pas oublier vos identifiants puisqu\'ils seront impossible à récupérer.</p>';

    out.forget = "Oublier";

    // Polls

    out.poll_title = "Sélecteur de date Zero Knowledge";
    out.poll_subtitle = "Planification de rendez-vous et sondages en <em>temps-réel</em> et Zero Knowledge";

    out.poll_p_save = "Vos modifications sont mises à jour instantanément, donc vous n'avez jamais besoin de sauver le contenu.";
    out.poll_p_encryption = "Tout ce que vous entrez est crypté donc seules les personnes possédant le lien du sondage y ont accès. Même le serveur ne peut pas voir le contenu.";
    out.poll_p_howtouse = "Entrez votre nom dans le champ ci-dessous et cochez les cases lorsque les options vous conviennent.";

    out.promptName = "Quel est votre nom ?";

    out.wizardButton = 'ASSISTANT';
    out.wizardLog = "Cliquez sur le bouton dans le coin supérieur gauche pour retourner au sondage";
    out.wizardTitle = "Utiliser l'assistant pour créer votre sondage";
    out.wizardConfirm = "Êtes-vous vraiment prêt à ajouter ces options au sondage ?";

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

    // index.html

    out.main_p1 = 'CryptPad est l\'éditeur collaboratif en temps réel <strong>zero knowledge</strong>. Le chiffrement est effectué depuis votre navigateur, ce qui protège les données contre le serveur, le cloud, et la NSA. La clé de chiffrement est stockée dans l\'<a href="https://fr.wikipedia.org/wiki/Identificateur_de_fragment">identifieur de fragment</a> de l\'URL qui n\'est jamais envoyée au serveur mais est accessible depuis javascript, de sorte qu\'en partageant l\'URL, vous donnez l\'accès au pad à ceux qui souhaitent participer.';
    out.main_p2 = 'Ce projet utilise l\'éditeur visuel (WYSIWYG) <a href="http://ckeditor.com/">CKEditor</a>, l\'éditeur de code source <a href="https://codemirror.net/">CodeMirror</a>, et le moteur temps-réel <a href="https://github.com/xwiki-contrib/chainpad">ChainPad</a>.';
    out.main_howitworks = 'Comment ça fonctionne';
    out.main_howitworks_p1 = 'CryptPad utilise une variante de l\'algorithme d\'<a href="https://en.wikipedia.org/wiki/Operational_transformation">Operational transformation</a> qui est capable de trouver un consensus distribué en utilisant une chaîne de bloc Nakamoto, un outil popularisé par le <a href="https://fr.wikipedia.org/wiki/Bitcoin">Bitcoin</a>. De cette manière, l\'algorithme évite la nécessité d\'utiliser un serveur central pour résoudre les conflits d\'édition de l\'Operational Transformation, et sans ce besoin de résolution des conflits le serveur peut rester ignorant du contenu qui est édité dans le pad.';
    out.main_about = 'À propos';
    out.main_about_p1 = 'Vous pouvez en apprendre davantage sur notre <a href="/privacy.html" title="">politique de confidentialité</a> et nos <a href="/terms.html">conditions d\'utilisation</a>.';
    out.main_about_p2 = 'Si vous avez des questions ou commentaires, vous pouvez <a href="https://twitter.com/cryptpad">nous tweeter</a>, ouvrir une issue sur <a href="https://github.com/xwiki-labs/cryptpad/issues/" title="our issue tracker">Github</a>, venir dire bonjour sur IRC (<a href="http://webchat.freenode.net?channels=%23cryptpad&uio=MT1mYWxzZSY5PXRydWUmMTE9Mjg3JjE1PXRydWUe7" title="freenode webchat">irc.freenode.net</a>), ou <a href="mailto:research@xwiki.com">nous envoyer un email</a>.';

    out.table_type = 'Type';
    out.table_link = 'Lien';
    out.table_created = 'Créé le';
    out.table_last = 'Dernier accès';

    out.button_newpad = 'CRÉER UN PAD WYSIWYG';
    out.button_newcode = 'CRÉER UN PAD DE CODE';
    out.button_newpoll = 'CRÉER UN SONDAGE';
    out.button_newslide = 'CRÉER UNE PRÉSENTATION';

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
    out.policy_choices_vpn = 'Si vous souhaitez utiliser notre instance hébergée (cryptpad.fr) mais que vous ne souhaitez pas exposer votre adresse IP, vous pouvez la protéger en utilisant le <a href="https://www.torproject.org/projects/torbrowser.html.en" title="downloads from the Tor project" target="_blank" rel="noopener noreferrer">navigateur Tor</a>, ou un <a href="https://riseup.net/fr/vpn" title="VPNs provided by Riseup" target="_blank" rel="noopener noreferrer">VPN</a>.';
    out.policy_choices_ads = 'Si vous souhaitez uniquement bloquer notre plateforme d\'analytique, vous pouvez utiliser un bloqueur de publicités tel que <a href="https://www.eff.org/fr/privacybadger" title="download privacy badger" target="_blank" rel="noopener noreferrer">Privacy Badger</a>.';

    // terms.html

    out.tos_title = "Conditions d'utilisation de Cryptpad";
    out.tos_legal = "Veuillez ne pas être malveillant, abusif, ou faire quoi que ce soit d'illégal.";
    out.tos_availability = "Nous espérons que vous trouvez ce service utile, mais nous ne pouvons garantir ses performances et disponibilités. Nous vous recommandons d'exporter vos données régurlièrement.";
    out.tos_e2ee = "Les document sur Cryptpad peuvent être lus et modifiés par quiconque est en mesure de deviner ou d'obtenir de quelque manière que ce soit l'identificateur de fragment (hash) du document. Nous vous recommandons d'utiliser des technologies de messagerie chiffrées de bout à bout (end-to-end encryption ou e2ee) pour partager les URLs, et déclinons toute responsabilité dans le cas ou une telle URL serait divulguée.";
    out.tos_logs = "Les meta-données fournies par votre navigateur au serveur peuvent être enregistrées dans le but de maintenir le service.";
    out.tos_3rdparties = "Nous ne fournissons aucune donnée individuelle à des tierces parties à moins d'y être contraints par la loi.";

    // BottomBar.html

    out.bottom_france = '<a href="http://www.xwiki.com/fr" target="_blank" rel="noopener noreferrer">Fait avec <img class="bottom-bar-heart" src="/customize/heart.png" /> en <img class="bottom-bar-fr" src="/customize/fr.png" /></a>';
    out.bottom_support = '<a href="http://labs.xwiki.com/" title="XWiki Labs" target="_blank" rel="noopener noreferrer">Un projet <img src="/customize/logo-xwiki2.png" alt="XWiki SAS" class="bottom-bar-xwiki"/> Labs</a> avec le soutien de <a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';

    // Header.html

    out.header_france = '<a href="http://www.xwiki.com/fr" target="_blank" rel="noopener noreferrer">Fait avec <img class="bottom-bar-heart" src="/customize/heart.png" /> en <img class="bottom-bar-fr" title="France" alt="France" src="/customize/fr.png" /> par <img src="/customize/logo-xwiki.png" alt="XWiki SAS" class="bottom-bar-xwiki"/></a>';
    out.header_xwiki = '<a href="http://www.xwiki.com/fr" target="_blank" rel="noopener noreferrer"><img src="/customize/logo-xwiki.png" alt="XWiki SAS" class="bottom-bar-xwiki"/></a>';
    out.header_support = '<a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';
    out.header_logoTitle = "Aller vers la page d'accueil";

    return out;
});
