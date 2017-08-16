// Tradução para protuguês brasileiro efetuada por Gustavo Henrique Machado da Silva (www.linkedin.com/in/gustavohmsilva)
// Embora o software original possa não possuir as mesmas licenças, a tradução produzida por mim é protegida sob termos
// Creative Commons, Attribution-ShareAlike 4.0 International
// Contate-me via email no endereço gustavohmsilva@member.fsf.org
// Translation to brazilian portuguese done by Gustavo Henrique Machado da Silva (www.linkedin.com/in/gustavohmsilva)
// Even though this software may not share the same licenses, the translation produced by me is protected under
// Creative commons, Attribution-ShareAlike 4.0 International
// You can contact me over email on gustavohmsilva@member.fsf.org
define(function () {
    var out = {};

    out._languageName = 'Brazilian Portuguese';

    out.main_title = "Cryptpad: Zero Knowledge, Edição Colaborativa em Tempo Real";
    out.main_slogan = "União é Força - Colaboração é a Chave";

    out.type = {};
    out.type.pad = 'Notas';
    out.type.code = 'Código';
    out.type.poll = 'votação';
    out.type.slide = 'Apresentação';

    out.type.drive = 'Drive';
    out.type.whiteboard = 'Whiteboard';
    out.type.file = 'File';
    out.type.media = 'Media';

    out.button_newpad = 'Novo bloco RTF';
    out.button_newcode = 'Novo bloco de código';
    out.button_newpoll = 'Novo questionário';
    out.button_newslide = 'Nova apresentação';
    out.button_newwhiteboard = 'Novo quadro branco';

    // NOTE: We want to update the 'common_connectionLost' key.
    // Please do not add a new 'updated_common_connectionLostAndInfo' but change directly the value of 'common_connectionLost'
    out.updated_0_common_connectionLost = "<b>Conexão com o Servidor Perdida</b><br>Você agora está em modo somente leitura até a conexão ser restaurada.";
    out.common_connectionLost = out.updated_0_common_connectionLost;

    out.websocketError = 'Incapaz de se conectar com o servidor websocket...';
    out.typeError = "Este bloco não é compatível com a aplicação selecionada";
    out.onLogout = 'você foi desconectado, <a href="/" target="_blank">clique aqui</a> para se conectar, <br>ou pressione <em>ESC</em> para acessar seu bloco em modo somente leitura.';
    out.wrongApp = "Incapaz de mostrar o conteúdo em tempo real no seu navegador. Por favor tente recarregar a página.";

    out.loading = "Carregando...";
    out.error = "Erro";
    out.saved = "Salvo";
    out.synced = "Tudo foi salvo";
    out.deleted = "Bloco deletado do seu CryptDrive";


    out.disconnected = 'Desconectado';
    out.synchronizing = 'Sincronizando';
    out.reconnecting = 'Reconectando...';
    out.lag = 'Lag';
    out.readonly = 'Somente leitura';
    out.anonymous = "Anonimo";
    out.yourself = "Você";
    out.anonymousUsers = "Usuários anônimos";
    out.anonymousUser = "Usuário anônimo";
    out.users = "Usuários";
    out.and = "e";
    out.viewer = "vizualizações";
    out.viewers = "leitores";
    out.editor = "editor";
    out.editors = "editores";

    out.language = "Lingua";

    out.comingSoon = "Em breve...";

    out.newVersion = '<b>O CryptPad foi atualizado!</b><br>' +
                     'Cheque as novidades na última versão:<br>'+
                     '<a href="https://github.com/xwiki-labs/cryptpad/releases/tag/{0}" target="_blank">Notas da atualização do CryptPad {0}</a>';

    out.upgrade = "Upgrade";
    out.upgradeTitle = "Faça um upgrade na sua conta para aumentar o limite de armazenamento";
    out.MB = "MB";
    out.GB = "GB";
    out.KB = "KB";

    out.formattedMB = "{0} MB";
    out.formattedGB = "{0} GB";
    out.formattedKB = "{0} KB";

    out.greenLight = "Tudo está funcionando bem";
    out.orangeLight = "Sua conexão lenta pode impactar sua experiência";
    out.redLight = "Você está desconectado da sua sessão";


    out.pinLimitReached = "Você alcançou o limite de armazenamento";
    out.updated_0_pinLimitReachedAlert = "Você alcançou o limite de armazenamento. Novos blocos não serão mais salvos no seu CryptDrive.<br>" +
        'Você pode deletar blocos do seu CryptDrive ou <a href="https://accounts.cryptpad.fr/#!on={0}" target="_blank">se inscrever como premium</a> para aumentar o limite de espaço.';
    out.pinLimitReachedAlert = out.updated_0_pinLimitReachedAlert;
    out.pinAboveLimitAlert = 'A partir desta atualização, nós estamos impondo um limite de 50MB no armazenamento gratuito. Você está atualmente usando {0}. Você irá precisar deletar alguns blocos ou se inscrever no <a href="https://accounts.cryptpad.fr/#!on={1}" target="_blank">accounts.cryptpad.fr</a>. Sua contribuição irá nos ajudar a melhorar o CryptPad e expandir a metodologia Zero Knowledge. Por favor contacte o <a href="https://accounts.cryptpad.fr/#/support" target="_blank">suporte</a> se você possui outras dúvidas.';
    out.pinLimitNotPinned = "Você alcançou o limite de armazenamento.<br>"+
                            "Este bloco não está armazenado no seu CryptDrive.";
    out.pinLimitDrive = "Você alcançou o limite de armazenamento.<br>" +
                        "Você não pode criar novos blocos.";

    out.importButtonTitle = 'Importar um documento de um arquivo local';

    out.exportButtonTitle = 'Exportar esta sesão para um arquivo local';
    out.exportPrompt = 'Como deseja nomear seu arquivo?';


    out.changeNamePrompt = 'Mude seu nome (deixe em branco para se manter anônimo): ';
    out.user_rename = "Mudar nome de exibição";
    out.user_displayName = "Nome visível";
    out.user_accountName = "Nome da Conta";

    out.clickToEdit = "Clique para Editar";

    out.forgetButtonTitle = 'Remova este documento da listagem da sua página';
    out.forgetPrompt = 'Clicando OK você irá remover o endereço deste bloco de notas do armazenamento local, você tem certeza?';
    out.movedToTrash = 'That pad has been moved to the trash.<br><a href="/drive/">Access my Drive</a>';

    out.shareButton = 'Compartilhar';
    out.shareSuccess = 'Endereço copiado para o clipboard';

    out.newButton = 'Novo';
    out.newButtonTitle = 'Criar um novo bloco';

    out.saveTemplateButton = "Salvar como modelo";
    out.saveTemplatePrompt = "Escolha o nome do modelo";
    out.templateSaved = "Modelo salvo!";
    out.selectTemplate = "Selecione um modelo ou pressione ESC";

    out.previewButtonTitle = "Mostrar ou esconder o modo de visualização markdown";

    out.presentButtonTitle = "Entrar no modo apresentação";
    out.presentSuccess = 'Pressione ESC para sair do modo de apresentação';

    out.backgroundButtonTitle = 'Mudar cor do fundo da apresentação';
    out.colorButtonTitle = 'Mudar a cor do texto no modo apresentação';

    out.printButton = "Imprimir (Enter)";
    out.printButtonTitle = "Imprimir seus slides ou exportá-los como PDF";
    out.printOptions = "Opções de leiaute";
    out.printSlideNumber = "Mostrar o número do slide";
    out.printDate = "Mostrar a data";
    out.printTitle = "Mostrar título do bloco";
    out.printCSS = "Custom style rules (CSS):";
    out.printTransition = "Ativar animações de transição";

    out.slideOptionsTitle = "Personalizar seus slides";
    out.slideOptionsButton = "Salvar (Enter)";


    out.editShare = "Compartilhar endereço editável";
    out.editShareTitle = "Copiar endereço editável";
    out.editOpen = "Abrir endereço editável em nova aba";
    out.editOpenTitle = "Abrir este bloco em modo editável em nova aba";
    out.viewShare = "Compartilhar endereço de visualização";
    out.viewShareTitle = "Copiar o endereço somente leitura";

    out.notifyJoined = "{0} entraram na sessão colaborativa";
    out.notifyRenamed = "{0} agora é conhecido como {1}";
    out.notifyLeft = "{0} deixou essa sessão colaborativa";


    out.okButton = 'OK (Enter)';

    out.cancel = "Cancelar";
    out.cancelButton = 'Cancelar (ESC)';

    out.historyButton = "Exibir histórico do documento";
    out.history_next = "Ir para próxima versão";
    out.history_prev = "Ir para versão anterior";
    out.history_goTo = "Ir para versão selecionada";
    out.history_close = "Voltar";
    out.history_closeTitle = "Fechar o histórico";
    out.history_restore = "Restaurar";
    out.history_restoreTitle = "Restaurar a versão selecionada do documento";
    out.history_restorePrompt = "Você tem certeza que deseja substituir a versão atual do documento pela que está sendo exibida agora?";
    out.history_restoreDone = "Documento restaurado";
    out.history_version = "Versão:";
    out.tryIt = 'Experimente!';

    // Polls

    out.poll_title = "Seletor de dados zero knowledge";
    out.poll_subtitle = "Zero Knowledge, agendamento <em>em tempo real</em>";

    out.poll_p_save = "Suas configurações são atualizadas instantaneamente, assim você nunca terá de salvá-las";
    out.poll_p_encryption = "Tudo que der entrada é encriptado para que apenas as pessoas com o link possam acessá-las. Nem mesmo o servidor pode ver suas mudanças.";

    out.wizardLog = "Clique no botão no topo esquerdo para voltar para sua enquete";
    out.wizardTitle = "Use o assistente para criar sua enquete";
    out.wizardConfirm = "Você está realmente pronto para adicionar estas opções em sua enquete?";

    out.poll_publish_button = "Publicar";
    out.poll_admin_button = "Admin";
    out.poll_create_user = "Adicionar novo usuário";
    out.poll_create_option = "Adicionar nova opção";
    out.poll_commit = "Submeter";

    out.poll_closeWizardButton = "Fechar assistente";
    out.poll_closeWizardButtonTitle = "Fechar assistente";
    out.poll_wizardComputeButton = "Computar opções";
    out.poll_wizardClearButton = "Limpar tabela";
    out.poll_wizardDescription = "Automaticamente criar um número de opções entrando qualquer número de seguimentos de datas e horários";
    out.poll_wizardAddDateButton = "+ Datas";
    out.poll_wizardAddTimeButton = "+ Horários";

    out.poll_optionPlaceholder = "Alternativa";
    out.poll_userPlaceholder = "Seu nome";

    out.poll_removeOption = "Você tem certeza que deseja remover esta opção?";

    out.poll_removeUser = "Você tem certeza que quer remover este usuário?";

    out.poll_titleHint = "Título";
    out.poll_descriptionHint = "Descrição";


    // Canvas
    out.canvas_clear = "Limpar";
    out.canvas_delete = "Deletar seleção";
    out.canvas_disable = "Desabilitar desenho";
    out.canvas_enable = "Habilitar desenho";
    out.canvas_width = "Largura";
    out.canvas_opacity = "Opacidade";

    // File manager

    out.fm_rootName = "Documentos";
    out.fm_trashName = "Lixeira";
    out.fm_unsortedName = "Arquivos não organizados";
    out.fm_filesDataName = "Todos os Arquivos";
    out.fm_templateName = "Temas";
    out.fm_searchName = "Busca";
    out.fm_searchPlaceholder = "Buscar...";
    out.fm_newButton = "Novo";
    out.fm_newButtonTitle = "Criar um novo bloco ou diretório";
    out.fm_newFolder = "Novo diretório";
    out.fm_newFile = "Novo bloco";
    out.fm_folder = "Diretório";
    out.fm_folderName = "Nome do diretório";
    out.fm_numberOfFolders = "# de diretórios";
    out.fm_numberOfFiles = "# de arquivos";
    out.fm_fileName = "Nome do arquivo";
    out.fm_title = "Título";
    out.fm_type = "Tipo";
    out.fm_lastAccess = "Último acesso";
    out.fm_creation = "Criação";
    out.fm_forbidden = "Ação não permitida";
    out.fm_originalPath = "Caminho original";
    out.fm_openParent = "Exibir no diretório";
    out.fm_noname = "Documento sem título";
    out.fm_emptyTrashDialog = "Você tem certeza que deseja limpar a lixeira??";
    out.fm_removeSeveralPermanentlyDialog = "Você tem certeza que deseja deletar estes {0} elementos da lixeira permanentemente?";
    out.fm_removePermanentlyDialog = "Você tem certeza que deseja deletar este elemento da lixeira permanentemente?";
    out.fm_removeSeveralDialog = "Você tem certeza que deseja mover estes {0} elementos para a lixeira?";
    out.fm_removeDialog = "Você tem certeza que deseja mover {0} para a lixeira?";
    out.fm_restoreDialog = "Você tem certeza que deseja restaurar {0} de volta para seu diretório original?";
    out.fm_unknownFolderError = "O diretório selecionado ou visitado por último não existe mais. Abrindo diretório superior...";
    out.fm_contextMenuError = "Incapaz de abrir o menu de contextualização para este elementos. Se o problema persistir, tente recarregar a página.";
    out.fm_selectError = "Incapaz de selecionar o elemento marcado. Se o problema persistir, tente recarregar a página.";
    out.fm_categoryError = "Incapaz de abrir a categoria selecionada, Exibindo diretório raiz";
    out.fm_info_root = "Crie quantos diretórios aninhados aqui desejar para organizar seus arquivos..";
    out.fm_info_unsorted = "Contém todos os arquivos que você visitou e não estão ainda organizados na pasta Documentos ou foram movidos para a pasta lixeira"; // "My Documents" should match with the "out.fm_rootName" key, and "Trash" with "out.fm_trashName"    out.fm_info_template = 'Contains all the pads stored as templates and that you can re-use when you create a new pad.';
    out.updated_0_fm_info_trash = 'Empty your trash to free space in your CryptDrive.';
    out.fm_info_trash = out.updated_0_fm_info_trash;
    out.fm_info_allFiles = 'Contém todos os arquivos de "Documentos", "Não organizados" e "Lixeira". Não é possível mover ou remover arquivos daqui.'; // Same here
    out.fm_info_anonymous = 'Você não está logado, então estes blocos podem ser deletados! (<a href="https://blog.cryptpad.fr/2017/05/17/You-gotta-log-in/" target="_blank">Descubra o porque</a>). ' +
                            '<a href="/register/">Cadastre-se</a> or <a href="/login/">Entre</a> Para deixá-los salvos.';
    out.fm_alert_backupUrl = "Link de backup desta conta.<br>" +
                             "É <strong>fortemente recomendado</strong> que você deixe para você e somente você.<br>" +
                             "Você pode usá-lo para resgatar os seus dados caso a memória do seu navegador se perca.<br>" +
                             "Qualquer um com este link pode editar ou apagar todos os arquivos no gerenciador da conta.<br>";
    out.fm_alert_anonymous = "Ola! Você está utilizando o CryptPad anonimamente, isto é ok, mas seus blocos podem ser apagados " +
                             "se ficarem muito tempo inativo. Nós desativamos as funções avançadas nas contas anônimas para que isto fique claro para você " +
                             'Este não é um bom lugar apra salvar senhas! Entenda: <a href="https://blog.cryptpad.fr/2017/05/17/You-gotta-log-in/" target="_blank">Clicando aqui!</a>  ' +
                             'Porque estamos fazendo isso e porque você deveria criar uma onta? <a href="/register/">Sign up</a> and <a href="/login/">Clique e entenda!</a>.';
    out.fm_backup_title = 'Link de restauração';
    out.fm_nameFile = 'Como deseja nomear este arquivo?';
    out.fm_error_cantPin = "Erro interno do servidor. Por favor recarregue a página e tente novamente.";
    // File - Context menu
    out.fc_newfolder = "Nova pasta";
    out.fc_rename = "Renomear";
    out.fc_open = "Abrir";
    out.fc_open_ro = "Abrir (somente leitura)";
    out.fc_delete = "Deletar";
    out.fc_restore = "Restaurar";
    out.fc_remove = "Deletar permanentemente";
    out.fc_empty = "Esvaziar lixeira";
    out.fc_prop = "Propriedades";
    out.fc_sizeInKilobytes = "tamanho em Kilobytes";
    // fileObject.js (logs)
    out.fo_moveUnsortedError = "Você não pode mover uma pasta na lista de notas não organizadas";
    out.fo_existingNameError = "Nome já em uso neste diretório. Por favor escolha outro.";
    out.fo_moveFolderToChildError = "Você não pode mover uma sub-diretório para dentro de um de seus sub-diretórios";
    out.fo_unableToRestore = "Fomos incapazes de restaurar este arquivo para sua posição original. Você pode tentar move-lo para o local de destino porém.";
    out.fo_unavailableName = "Um arquivo ou diretório com o mesmo nome já existe no novo locao. Renomeie-o e tente novamente.";

    // login
    out.login_login = "Entrar";
    out.login_makeAPad = 'Criar bloco anonimamente';
    out.login_nologin = "Navegar nos blocos locais";
    out.login_register = "Cadastro";
    out.logoutButton = "Sair";
    out.settingsButton = "Configurações";

    out.login_username = "Usuário";
    out.login_password = "Senha";
    out.login_confirm = "Confirme sua senha";
    out.login_remember = "Memorize-me";

    out.login_hashing = "Encriptando sua senha, isto pode tomar algum tempo.";

    out.login_hello = 'Ola {0},'; // {0} is the username
    out.login_helloNoName = 'Ola,';
    out.login_accessDrive = 'Acesse seu diretório';
    out.login_orNoLogin = 'ou';

    out.login_noSuchUser = 'Usuário ou senha inválido. Tente nocamente ou cadastre-se';
    out.login_invalUser = 'É necessário um usuário';
    out.login_invalPass = 'É necessário uma senha';
    out.login_unhandledError = 'Um erro não esperado ocorreu :(';

    out.register_importRecent = "Importar histórico de blocos (Recomendado)";
    out.register_acceptTerms = "Eu aceito <a href='/terms.html'>os termos de serviço</a>";
    out.register_passwordsDontMatch = "Senhas não coincidem!";
    out.register_mustAcceptTerms = "Você precisa aceitar os termos de serviço.";
    out.register_mustRememberPass = "Nós não podemos restaurar sua senha caso você a esqueça. É muito importante que você lembre-se dela! Clique nesta caixa de seleção para confirmar que você compreendeu isto.";

    out.register_header = "Bem vindo ao CryptPad";
    out.register_explanation = [
        "<p>Lets go over a couple things first</p>",
        "<ul>",
            "<li>Your password is your secret key which encrypts all of your pads. If you lose it there is no way we can recover your data.</li>",
            "<li>You can import pads which were recently viewed in your browser so you have them in your account.</li>",
            "<li>If you are using a shared computer, you need to log out when you are done, closing the tab is not enough.</li>",
        "</ul>"
    ].join('');


    out.register_writtenPassword = "I have written down my username and password, proceed";
    out.register_cancel = "Go back";

    out.register_warning = "Zero Knowledge means that we can't recover your data if you lose your password.";

    out.register_alreadyRegistered = "This user already exists, do you want to log in?";

    // Settings
    out.settings_title = "Settings";
    out.settings_save = "Save";
    out.settings_backupTitle = "Backup or restore all your data";
    out.settings_backup = "Backup";
    out.settings_restore = "Restore";
    out.settings_resetTitle = "Clean your drive";
    out.settings_reset = "Remove all the files and folders from your CryptDrive";
    out.settings_resetPrompt = "This action will remove all the pads from your drive.<br>"+
                               "Are you sure you want to continue?<br>" +
                               "Type “<em>I love CryptPad</em>” to confirm.";
    out.settings_resetDone = "Your drive is now empty!";
    out.settings_resetError = "Incorrect verification text. Your CryptDrive has not been changed.";
    out.settings_resetTips = "Tips in CryptDrive";
    out.settings_resetTipsButton = "Reset the available tips in CryptDrive";
    out.settings_resetTipsDone = "All the tips are now visible again.";

    out.settings_importTitle = "Import this browser's recent pads in my CryptDrive";
    out.settings_import = "Import";
    out.settings_importConfirm = "Are you sure you want to import recent pads from this browser to your user account's CryptDrive?";
    out.settings_importDone = "Import completed";

    out.settings_userFeedbackHint1 = "CryptPad provides some very basic feedback to the server, to let us know how to improve your experience.";
    out.settings_userFeedbackHint2 = "Your pad's content will never be shared with the server.";
    out.settings_userFeedback = "Enable user feedback";

    out.settings_anonymous = "You are not logged in. Settings here are specific to this browser.";
    out.settings_publicSigningKey = "Public Signing Key";

    out.settings_usage = "Usage";
    out.settings_usageTitle = "See the total size of your pinned pads in MB";
    out.settings_pinningNotAvailable = "Pinned pads are only available to registered users.";
    out.settings_pinningError = "Something went wrong";
    out.settings_usageAmount = "Your pinned pads occupy {0}MB";

    out.settings_logoutEverywhereTitle = "Log out everywhere";
    out.settings_logoutEverywhere = "Log out of all other web sessions";
    out.settings_logoutEverywhereConfirm = "Are you sure? You will need to log in with all your devices.";

    out.upload_serverError = "Server Error: unable to upload your file at this time.";
    out.upload_uploadPending = "You already have an upload in progress. Cancel it and upload your new file?";
    out.upload_success = "Your file ({0}) has been successfully uploaded and added to your drive.";
    out.upload_notEnoughSpace = "There is not enough space for this file in your CryptDrive.";
    out.upload_tooLarge = "This file exceeds the maximum upload size.";
    out.upload_choose = "Choose a file";
    out.upload_pending = "Pending";
    out.upload_cancelled = "Cancelled";
    out.upload_name = "File name";
    out.upload_size = "Size";
    out.upload_progress = "Progress";
    out.download_button = "Decrypt & Download";

    // general warnings
    out.warn_notPinned = "This pad is not in anyone's CryptDrive. It will expire after 3 months. <a href='/about.html#pinning'>Learn more...</a>";


    // index.html

    //about.html
    out.main_p2 = 'This project uses the <a href="http://ckeditor.com/">CKEditor</a> Visual Editor, <a href="https://codemirror.net/">CodeMirror</a>, and the <a href="https://github.com/xwiki-contrib/chainpad">ChainPad</a> realtime engine.';
    out.main_howitworks_p1 = 'CryptPad uses a variant of the <a href="https://en.wikipedia.org/wiki/Operational_transformation">Operational transformation</a> algorithm which is able to find distributed consensus using a <a href="https://bitcoin.org/bitcoin.pdf">Nakamoto Blockchain</a>, a construct popularized by <a href="https://en.wikipedia.org/wiki/Bitcoin">Bitcoin</a>. This way the algorithm can avoid the need for a central server to resolve Operational Transform Edit Conflicts and without the need for resolving conflicts, the server can be kept unaware of the content which is being edited on the pad.';

    // contact.html
    out.main_about_p2 = 'If you have any questions or comments, you can <a href="https://twitter.com/cryptpad">tweet us</a>, open an issue <a href="https://github.com/xwiki-labs/cryptpad/issues/" title="our issue tracker">on github</a>, come say hi on irc (<a href="http://webchat.freenode.net?channels=%23cryptpad&uio=MT1mYWxzZSY5PXRydWUmMTE9Mjg3JjE1PXRydWUe7" title="freenode webchat">irc.freenode.net</a>), or <a href="mailto:research@xwiki.com">send us an email</a>.';

    out.main_info = "<h1>Collaborate in Confidence</h1><br> Grow your ideas together with shared documents while <strong>Zero Knowledge</strong> technology secures your privacy; even from us.";

    out.main_howitworks = 'How It Works';
    out.main_zeroKnowledge = 'Zero Knowledge';
    out.main_zeroKnowledge_p = "You don't have to trust that we <em>won't</em> look at your pads, with CryptPad's revolutionary Zero Knowledge Technology we <em>can't</em>. Learn more about how we protect your <a href=\"/privacy.html\" title='Privacy'>Privacy and Security</a>.";
    out.main_writeItDown = 'Write it down';
    out.main_writeItDown_p = "The greatest projects come from the smallest ideas. Take down the moments of inspiration and unexpected ideas because you never know which one might be a breakthrough.";
    out.main_share = 'Share the link, share the pad';
    out.main_share_p = "Grow your ideas together: conduct efficient meetings, collaborate on TODO lists and make quick presentations with all your friends and all your devices.";
    out.main_organize = 'Get organized';
    out.main_organize_p = "With CryptPad Drive, you can keep your sights on what's important. Folders allow you to keep track of your projects and have a global vision of where things are going.";
    out.tryIt = 'Try it out!';
    out.main_richText = 'Rich Text editor';
    out.main_richText_p = 'Edit rich text pads collaboratively with our realtime Zero Knowledge <a href="http://ckeditor.com" target="_blank">CkEditor</a> application.';
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

    out.about = "About";
    out.privacy = "Privacy";
    out.contact = "Contact";
    out.terms = "ToS";
    out.blog = "Blog";


    // privacy.html

    out.policy_title = 'Política de privacidade do Cryptpad';
    out.policy_whatweknow = 'O que nós sabemos sobre você';
    out.policy_whatweknow_p1 = 'Por ser uma aplicação hospedada na web, O Cryptpad tem acesso aos metadados expostos pelo protocolo HTTP. Isso inclui seu endereço IP, e vários cabeçalhos  do HTTP que podem ser usados para identificar seu browser particular. Você pode ver que informações seu navegador está compartilhando ao visitar <a target="_blank" rel="noopener noreferrer" href="https://www.whatismybrowser.com/detect/what-http-headers-is-my-browser-sending" title="Que cabeçalhos meu navegador está disponibilizando">WhatIsMyBrowser.com</a>.';
    out.policy_whatweknow_p2 = 'Nós usamos a plataforma de análise <a href="https://piwik.org/" target="_blank" rel="noopener noreferrer" title="plataforma analítica open source">Piwik</a>, uma plataforma analítica open source, para aprender mais sobre nossos usos. Piwik nos informa como você encontrou o Cryptpad, via digitação direta, através de mecanismos de busca, ou via link de outro serviço web como o Reddit ou o Twitter. Nós também aprendemos com suas visitas, que links você clica enquanto está em nossas páginas de informações, e quanto tempo você fica nestas páginas.';
    out.policy_howweuse = 'Como utilizamos o que nós aprendemos';
    out.policy_howweuse_p1 = 'Nos utilizamos estas informações para tomar melhores decisões sobre como promover o Cryptpad, ao avaliar quais dos nosso esforços passados foram mais bem sucedidos. Informações sobre sua localização nos ajudam a decidir se nós devemos considerar prover melhor suporte para idiomas além do inglês.';
    out.policy_howweuse_p2 = "As informações sobre o seu navegador de internet (não importando se é um desktop ou um equipamento móvel) nos ajudam a tomar melhores decisões ao priorizar melhorias futuras. Nossa equipe de desenvolvimento é pequena, e nós tentamos fazer as melhores escolhas em pró de auxiliar a experiência de utilização do máximo de nossos usuários possíveis.";
    out.policy_whatwetell = 'O que contamos a terceiros sobre você';
    out.policy_whatwetell_p1 = 'Nós não informamos terceiros a informação que armazenamos ou que provemos a você, salvo caso sejamos legalmente requisitados a faze-lo.';
    out.policy_links = 'Links para outros sites';
    out.policy_links_p1 = 'Este site contém ligações para outros sites, incluindo aqueles produzidos por terceiros. Nós não nos responsabilizamos pelas práticas de privacidade ou o conteúdo destes sites. Como regra geral, links para páginas fora de nosso domínio são lançadas em novas janelas ou abas, para deixar claro a todos os visitantes que eles estão deixando o site Cryptpad.fr.';
    out.policy_ads = 'Publicidade';
    out.policy_ads_p1 = 'Nós não disponibilizamos publicidade online, porém podemos prover links de acesso para obtenção de financiamento para auxiliar em nossa pesquisa e desenvolvimento.';
    out.policy_choices = 'As escolhas que você tem';
    out.policy_choices_open = 'Nosso código fonte é open source, portanto você sempre tem a opção de hospedar sua própria instância do Cryptpad.';
    out.policy_choices_vpn = 'Se você deseja usar nosso site principal, porém não deseja expor seu endereço IP, Você pode se proteger utilizando o <a href="https://www.torproject.org/projects/torbrowser.html.en" title="Baixe o tor" target="_blank" rel="noopener noreferrer">Navegador seguro Tor</a>, ou uma <a href="https://riseup.net/en/vpn" title="VPNs providas pelo Riseup" target="_blank" rel="noopener noreferrer">VPN</a>.';
    out.policy_choices_ads = 'Se você deseja apenas bloquear nossa plataforma analítica, você pode utilizar ferramentas de bloqueio de propagandas como o <a href="https://www.eff.org/privacybadger" title="baixe o privacy badger" target="_blank" rel="noopener noreferrer">Privacy Badger</a>.';

    // terms.html

    out.tos_title = "Termos de serviço doCryptpad";
    out.tos_legal = "Pedimos encarecidamente que, como usuário desta plataforma, você evite a prática de quaisquer atos ilegais e que evite a utilização maliciosa e/ou abusiva desta plataforma.";
    out.tos_availability = "Nós esperamos que você ache este serviço útil, porém nós não podemos garantir a disponibilidade constante ou a alta performance do mesmo. Por favor, mantenha um backup dos seus dados como forma de segurança adicional.";
    out.tos_e2ee = "Os documentos do CryptPad podem ser modificados por qualquer um que conseguir adivinhar ou obter de qualquer forma o seu identificador único. Nós recomendamos que você utilize criptografia ponto a ponto de mensagens (e2ee) sempre que possível para compartilhar suas URL's. Nós não assumimos qualquer responsabilidade sobre chaves e/ou URL’s e seus respectivos conteúdos vazadas para o público.";
    out.tos_logs = "Os Metadados providos pelo seu navegador para nosso servidor podem ser armazenados com o propósito de manter o serviço em funcionamento";
    out.tos_3rdparties = "Nós não disponibilizamos dados individuais para terceiros, salvo quando requisitado legalmente.";

    // BottomBar.html

    out.bottom_france = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer">Feito com <img class="bottom-bar-heart" src="/customize/heart.png" /> na <img class="bottom-bar-fr" src="/customize/fr.png" /></a>';
    out.bottom_support = '<a href="http://labs.xwiki.com/" title="XWiki Labs" target="_blank" rel="noopener noreferrer">Um projeto do laboratório <img src="/customize/logo-xwiki2.png" alt="XWiki SAS" class="bottom-bar-xwiki"/></a> com o suporte da <a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';

    // Header.html

    out.header_france = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer">Com <img class="bottom-bar-heart" src="/customize/heart.png" /> da <img class="bottom-bar-fr" src="/customize/fr.png" title="France" alt="France"/> por <img src="/customize/logo-xwiki.png" alt="XWiki SAS" class="bottom-bar-xwiki"/></a>';

    out.header_support = '<a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';
    out.header_logoTitle = 'Go to the main page';

    // Initial states

    out.initialState = [
        '<p>',
        'This is&nbsp;<strong>CryptPad</strong>, the Zero Knowledge realtime collaborative editor. Everything is saved as you type.',
        '<br>',
        'Share the link to this pad to edit with friends or use the <span style="background-color:#5cb85c;color:#ffffff;">&nbsp;Share&nbsp;</span> button to share a <em>read-only link</em>&nbsp;which allows viewing but not editing.',
        '</p>',

        '<p><span style="color:#808080;"><em>',
        'Go ahead, just start typing...',
        '</em></span></p>',
        '<p>&nbsp;<br></p>'
    ].join('');

    out.codeInitialState = [
        '# CryptPad\'s Zero Knowledge collaborative code editor\n',
        '\n',
        '* What you type here is encrypted so only people who have the link can access it.\n',
        '* You can choose the programming language to highlight and the UI color scheme in the upper right.'
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

    // Readme

    out.driveReadmeTitle = "What is CryptPad?";
    out.readme_welcome = "Welcome to CryptPad !";
    out.readme_p1 = "Welcome to CryptPad, this is where you can take note of things alone and with friends.";
    out.readme_p2 = "This pad will give you a quick walk through of how you can use CryptPad to take notes, keep them organized and work together on them.";
    out.readme_cat1 = "Get to know your CryptDrive";
    out.readme_cat1_l1 = "Make a pad: In your CryptDrive, click {0} then {1} and you can make a pad."; // 0: New, 1: Rich Text
    out.readme_cat1_l2 = "Open Pads from your CryptDrive: double-click on a pad icon to open it.";
    out.readme_cat1_l3 = "Organize your pads: When you are logged in, every pad you access will be shown as in the {0} section of your drive."; // 0: Unsorted files
    out.readme_cat1_l3_l1 = "You can click and drag files into folders in the {0} section of your drive and make new folders."; // 0: Documents
    out.readme_cat1_l3_l2 = "Remember to try right clicking on icons because there are often additional menus.";
    out.readme_cat1_l4 = "Put old pads in the trash: You can click and drag your pads into the {0} the same way you drag them into folders."; // 0: Trash
    out.readme_cat2 = "Make pads like a pro";
    out.edit = "edit";
    out.view = "view";
    out.readme_cat2_l1 = "The {0} button in your pad allows you to give access to collaborators to either {1} or to {2} the pad."; // 0: Share, 1: edit, 2: view
    out.readme_cat2_l2 = "Change the title of the pad by clicking on the pencil";
    out.readme_cat3 = "Discover CryptPad apps";
    out.readme_cat3_l1 = "With CryptPad code editor, you can collaborate on code like Javascript and markdown like HTML and Markdown";
    out.readme_cat3_l2 = "With CryptPad slide editor, you can make quick presentations using Markdown";
    out.readme_cat3_l3 = "With CryptPoll you can take quick votes, especially for scheduling meetings which fit with everybody's calendar";

    // Tips
    out.tips = {};
    out.tips.lag = "The green icon in the upper right shows the quality of your internet connection to the CryptPad server.";
    out.tips.shortcuts = "`ctrl+b`, `ctrl+i` and `ctrl+u` are quick shortcuts for bold, italic and underline.";
    out.tips.indent = "In numbered and bulleted lists, you can use tab or shift+tab to quickly increase or decrease indentation.";
    out.tips.title = "You can set the title of your pad by clicking the top center.";
    out.tips.store = "Every time you visit a pad, if you're logged in it will be saved to your CryptDrive.";
    out.tips.marker = "You can highlight text in a pad using the \"marker\" item in the styles dropdown menu.";

    out.feedback_about = "If you're reading this, you were probably curious why CryptPad is requesting web pages when you perform certain actions";
    out.feedback_privacy = "We care about your privacy, and at the same time we want CryptPad to be very easy to use.  We use this file to figure out which UI features matter to our users, by requesting it along with a parameter specifying which action was taken.";
    out.feedback_optout = "If you would like to opt out, visit <a href='/settings/'>your user settings page</a>, where you'll find a checkbox to enable or disable user feedback";

    return out;
});
