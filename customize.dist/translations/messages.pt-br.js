define(function () {
    var out = {};

    // translations must set this key for their language to be available in
    // the language dropdowns that are shown throughout Cryptpad's interface
    out._languageName = 'Brazilian Portuguese';

    out.main_title = "Cryptpad: Zero Knowledge, Edição Colaborativa em Tempo Real";
    out.main_slogan = "União é Força - Colaboração é a Cave";

    out.type = {};
    out.type.pad = 'Notas';
    out.type.code = 'Código';
    out.type.poll = 'votação';
    out.type.slide = 'Apresentação';

    out.errorBox_errorType_disconnected = 'Coneção perdida';
    out.errorBox_errorExplanation_disconnected = [
        'Coneção perdida com o servidor, você pode se reconectar recarregando a página ou revisando seu código ',
        'clicando fora desta caixa.'
    ].join('');

    out.common_connectionLost = 'Conexão Perdida com o servidor';

    out.disconnected = 'Desconectado';
    out.synchronizing = 'Sincronizando';
    out.reconnecting = 'Reconectando...';
    out.lag = 'Lag';
    out.readonly = 'Somente leitura';
    out.anonymous = "Anonimo";
    out.yourself = "Você";
    out.anonymousUsers = "Usuários anônimos";
    out.anonymousUser = "Usuário anônimo";
    out.shareView = "Endereço Somente Leitura";
    out.shareEdit = "Editar Endereço";
    out.users = "Usuários";
    out.and = "e";
    out.viewer = "vizualizações";
    out.viewers = "leitores";
    out.editor = "editor";
    out.editors = "editores";

    out.greenLight = "Tudo está funcionando bem";
    out.orangeLight = "Sua conexão longa pode impactar sua experiência";
    out.redLight = "Você está desconectado da sua sessão";

    out.importButton = 'IMPORTAR';
    out.importButtonTitle = 'Importar um documento de um arquivo local';

    out.exportButton = 'EXPORTAR';
    out.exportButtonTitle = 'Exportar esta sesão para um arquivo local';
    out.exportPrompt = 'Como deseja nomeear seu arquivo?';

    out.back = '&#8656; Voltar';
    out.backToCryptpad = '⇐ Voltar ao Cryptpad';

    out.userButton = 'USUÁRIO';
    out.userButtonTitle = 'Mude seu usuário';
    out.changeNamePrompt = 'Mude seu nome (deixe em branco para se manter anônimo): ';

    out.renameButton = 'RENOMEAR';
    out.renameButtonTitle = 'Mudar o título no qual este documento está listado na sua página principal';
    out.renamePrompt = 'Você gostaria de nomear este blco de notas?';
    out.renameConflict = 'Outro bloco de notas já tem este título';
    out.clickToEdit = "Clique para Editar";

    out.forgetButton = 'ESQUECER';
    out.forgetButtonTitle = 'Remova este documento da listagem da sua página';
    out.forgetPrompt = 'Cliando OK você irá remover o endereço deste bloco de notas do armazenamento local, você tem certeza?';

    out.shareButton = 'Compartilhar';
    out.shareButtonTitle = "Copiar endereço do clipboard";
    out.shareSuccess = 'Endereço copiado para o clipboard';
    out.shareFailed = "Falhou ao copiar para o clipboard";

    out.presentButton = 'PRESENTE';
    out.presentButtonTitle = "Entrar no modo apresentação";
    out.presentSuccess = 'Pressione ESC para sair do modo de apresentação';
    out.sourceButton = 'VER  CÓDIGO';
    out.sourceButtonTitle = "Sair do modo apresentação";

    out.backgroundButton = 'COR DE FUNDO';
    out.backgroundButtonTitle = 'Mudar a cor de fundo da apresentação';
    out.colorButton = 'COR DO TEXTO';
    out.colorButtonTitle = 'Mudar a cor do texto no modo apresentação';

    out.commitButton = 'ENVIAR';

    out.getViewButton = 'ENDEREÇO SOMENTE LEITURA';
    out.getViewButtonTitle = 'Obter endereó somente leitura para este documento';
    out.readonlyUrl = 'Documento somente leitura';
    out.copyReadOnly = "Copiar endereço";
    out.openReadOnly = "Abrir em nova aba";
    out.editShare = "Compartilhar endereço editável";
    out.editShareTitle = "Copiar endereço editável";
    out.viewShare = "Compartilhar endereó de visualização";
    out.viewShareTitle = "Copiar o endereço somente leitura";
    out.viewOpen = "Ver em nova aba";
    out.viewOpenTitle = "Abrir o documento em modo somente leitura em nova aba";

    out.notifyJoined = "{0} entraram na sessão colaborativa";
    out.notifyRenamed = "{0} agora é conhecido como {1}";
    out.notifyLeft = "{0} deixou essa sessão colaborativa";

    out.disconnectAlert = 'Conexão de rede perdida!';

    out.tryIt = 'Tentar!';
    out.recentPads = 'Seu bloco de nota recente (armazenado em seu navegador)';

    out.okButton = 'OK (enter)';
    out.cancelButton = 'Cancelar (esc)';

    out.loginText = '<p>Seu usuário e senha são usados para gerar uma chave única que nunca será do conhecimento do nosso servidor.</p>\n' +
                    '<p>Cuidado para não esquecer suas credenciais, pois é impossível para nós restaurá-las</p>';

    out.forget = "Esquercer";

    // Polls

    out.poll_title = "Seletor de dados zero knowledge";
    out.poll_subtitle = "Zero Knowledge, agendamento <em>em tempo real</em>";

    out.poll_p_save = "Suas configurações são atualizadas instantaneamente, assim você nunca terá de salvá-las";
    out.poll_p_encryption = "Tudo que der entrada é encriptado para que apenas as pessoas com o link possam acessá-las. Nem mesmo o servidor pode ver suas mudanças.";
    out.poll_p_howtouse = "Entre com seu nome no cambo abaixo e confirme no checkbox quando você estiver disponível";

    out.promptName = "Qual é o seu nome?";

    out.wizardButton = 'ASSISTENTE';
    out.wizardLog = "Clique no botão no topo esquerdo para voltar para sua enquete";
    out.wizardTitle = "Use o assistente para criar sua enquete";
    out.wizardConfirm = "Você está realmente pronto para adicionar estas opções em sua enquete?";

    out.poll_closeWizardButton = "Fechar assistente";
    out.poll_closeWizardButtonTitle = "Fechar assistente";
    out.poll_wizardComputeButton = "Computar opções";
    out.poll_wizardClearButton = "Limpar tabela";
    out.poll_wizardDescription = "Automaticamente criar um número de opções entrando qualquer número de seguimentos de datas e horários";
    out.poll_wizardAddDateButton = "+ Datas";
    out.poll_wizardAddTimeButton = "+ Horários";

    out.poll_addUserButton = "+ Usuários";
    out.poll_addUserButtonTitle = "Clique para adicionar usuário";
    out.poll_addOptionButton = "+ Opções";
    out.poll_addOptionButtonTitle = "Clique para adicionar uma opção";
    out.poll_addOption = "Propor uma alternativa";
    out.poll_optionPlaceholder = "Alternativa";
    out.poll_addUser = "Introduza um nome";
    out.poll_userPlaceholder = "Seu nome";
    out.poll_removeOption = "Você tem certeza que quer remover essa alternativa?";
    out.poll_removeOptionTitle = "Remova a linha";
    out.poll_removeUser = "Você tem certeza que quer remover este usuário?";
    out.poll_removeUserTitle = "Remova a coluna";
    out.poll_editOption = "Você tem certeza que quer editar esta alternativa?";
    out.poll_editOptionTitle = "Editar esta linha";
    out.poll_editUser = "Você tem certeza que quer editar este usuário?";
    out.poll_editUserTitle = "Editar a coluna";

    out.poll_titleHint = "Título";
    out.poll_descriptionHint = "Descrição";

    // index.html

    out.main_p1 = 'CryptPad é um editor colaborativo baseado na metodologia <strong>zero knowledge</strong> . A encriptação do servidor impede qualquer tipo de acesso não autorizado seja de indivíduos ou da NSA.  A chave secreta de entriptação é armazenada no endereó <a href="https://en.wikipedia.org/wiki/Fragment_identifier">fragment identifier</a> que em momento algum é enviada para o servidor, porém é disponibilizada para o javascript ao compartilhar o link com outros com quem você deseja compartilhar acesso.';
    out.main_p2 = 'Este projeto utiliza o Editor visual <a href="http://ckeditor.com/">CKEditor</a>, <a href="https://codemirror.net/">CodeMirror</a>, e a engine de tempo real <a href="https://github.com/xwiki-contrib/chainpad">ChainPad</a>.';
    out.main_howitworks = 'Como funciona';
    out.main_howitworks_p1 = 'CryptPad usa uma variante do algorítmo de <a href="https://en.wikipedia.org/wiki/Operational_transformation">Operational transformation</a>, que é capaz de encontrar consenso distribuido usando o <a href="https://bitcoin.org/bitcoin.pdf">Blockchain de Nakamoto</a>, um constructo popularizado pelo <a href="https://en.wikipedia.org/wiki/Bitcoin">Bitcoin</a>. Desta forma o algorítmo pode evitar a necessidade de um servidor central para resolverconflitos de edição operacional sem a necessidade do servidor armazenar o conteúdo que está sendo editado pelos colaboradores.';
    out.main_about = 'Sobre';
    out.main_about_p1 = 'Você pode ler mais sobre em nossa <a href="/privacy.html" title="">política de privadicade</a> e nos nossos <a href="/terms.html">termos de serviço</a>.';

    out.main_about_p2 = 'Se você tem alguma questão ou comentário, você pode <a href="https://twitter.com/cryptpad">nos mandar um tweet</a>, abrir uma requisição <a href="https://github.com/xwiki-labs/cryptpad/issues/" title="no nosso tracker">no github</a>, venha nos dar ola no IRC (<a href="http://webchat.freenode.net?channels=%23cryptpad&uio=MT1mYWxzZSY5PXRydWUmMTE9Mjg3JjE1PXRydWUe7" title="freenode webchat">irc.freenode.net</a>), ou <a href="mailto:research@xwiki.com">nos envie um e-mail</a>.';

    out.table_type = 'Tipo';
    out.table_link = 'Link';
    out.table_created = 'Criado';
    out.table_last = 'Último acessado';

    out.button_newpad = 'CRIAR NOVO BLOCO DE NOTAS WYSIWYG';
    out.button_newcode = 'CRIAR UM NOVO BLOCO DE NOTAS';
    out.button_newpoll = 'CRIAR UMA ENQUETE';
    out.button_newslide = 'CREIAR UMA APRESENTAÇÃO';

    // privacy.html

    out.policy_title = 'Política de privacidade do Cryptpad';
    out.policy_whatweknow = 'O que nó sabemos sobre você';
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
