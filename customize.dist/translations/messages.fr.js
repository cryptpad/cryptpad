define(function () {
    var out = {};

    out.errorBox_errorType_disconnected = 'Connexion perdue';
    out.errorBox_errorExplanation_disconnected = [
        'La connexion au serveur a été perdue. Vous pouvez essayer de vous reconnecter en rechargeant la page',
        'ou vous pouvez revoir votre travail en fermant cette boîte de dialogue.',
    ].join('');

    out.editingAlone = 'Edition seul(e)';
    out.editingWithOneOtherPerson = 'Edition avec une autre personne';
    out.editingWith = 'Edition avec';
    out.otherPeople = 'autres personnes';
    out.disconnected = 'Déconnecté';
    out.synchronizing = 'Synchronisation';
    out.reconnecting = 'Reconnexion...';
    out.lag = 'Latence';

    out.importButton = 'IMPORTER';
    out.importButtonTitle = 'Importer un document depuis un fichir local';

    out.exportButton = 'EXPORTER';
    out.exportButtonTitle = 'Exporter ce document vers un fichier local';
    out.exportPrompt = 'Comment souhaitez-vous nommer ce fichier ?';

    out.back = '&#8656; Retour';
    out.backToCryptpad = '&#8656; Retour vers Cryptpad';

    out.changeNameButton = 'Changer de nom';
    out.changeNamePrompt = 'Changer votre nom : ';

    out.renameButton = 'RENOMMER';
    out.renameButtonTitle = 'Changer le titre utilisé par ce document dans la page d\'accueil de Cryptpad';
    out.renamePrompt = 'Quel titre souhaitez-vous utiliser pour ce document ?';
    out.renameConflict = 'Un autre document existe déjà avec le même titre';

    out.forgetButton = 'OUBLIER';
    out.forgetButtonTitle = 'Enlever ce document de la liste en page d\'accueil';
    out.forgetPrompt = 'Cliquer sur OK supprimera l\'URL de ce document de la mémoire de votre navigateur (localStorage), êtes-vous sûr ?';

    out.disconnectAlert = 'Perte de la connexion au réseau !';

    out.tryIt = 'Essayez-le !';
    out.recentPads = 'Vos documents récents (stockés uniquement dans votre navigateur)';

    out.okButton = 'OK (Entrée)';
    out.cancelButton = 'Annuler (Echap)';

    out.initialState = [
        '<p>',
        'Voici <strong>CryptPad</strong>, l\'éditeur collaboratif en temps-réel "zero knowledge".',
        '<br>',
        'Ce que vous tapez ici est crypté et donc seules les personnes possédant l\'adresse de la page y ont accès.',
        '<br>',
        'Même le serveur ne peut pas voir ce que vous tapez.',
        '</p>',
        '<p>',
        '<small>',
        '<i>Ce que vous voyez ici, ce que vous entendez ici, quand vous quittez, ça reste ici</i>',
        '</small>',
        '</p>',
    ].join('');

    out.codeInitialState = [
        '/*\n',
        '   Voici Cryptpad, l\'éditeur collaboratif en temps-réel "zero knowledge".\n',
        '   Ce que vous tapez ici est crypté et donc seules les personnes possédant l\'adresse de la page y ont accès.\n',
        '   Même le serveur ne peut pas voir ce que vous tape.\n',
        '   Ce que vous voyez ici, ce que vous entendez ici, quand vous quittez, ça reste ici.\n',
        '*/'
    ].join('');

    return out;
});
