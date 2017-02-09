// Tradução para protuguês brasileiro efetuada por Gustavo Henrique Machado da Silva (www.linkedin.com/in/gustavohmsilva)
// Embora o software original possa não possuir as mesmas licenças, a tradução produzida por mim is protected under 
// Creative Commons, Attribution-ShareAlike 4.0 International
// Contate-me via email no endereço gustavohmsilva@member.fsf.org
// Translation to brazilian portuguese done by Gustavo Henrique Machado da Silva (www.linkedin.com/in/gustavohmsilva)
// Even though this software may not share the same licenses, the translation produced by me is protected under
// Creative commons, Attribution-ShareAlike 4.0 International
// You can contact me over email on gustavohmsilva@member.fsf.orgs
define(function () {
    var out = {};

    // translations must set this key for their language to be available in
    // the language dropdowns that are shown throughout Cryptpad's interface
    out._languageName = 'Brazilian Portuguese';

    out.main_title = "Cryptpad: Zero Knowledge, Edição Colaborativa em Tempo Real";
    out.main_slogan = "União é Força - Colaboração é a Chave";

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
    out.forgetPrompt = 'Clicando OK você irá remover o endereço deste bloco de notas do armazenamento local, você tem certeza?';

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

    out.tryIt = 'Experimente!';
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

    out.main_p1 = 'CryptPad é um editor colaborativo baseado na metodologia <strong>zero knowledge</strong>. A encriptação do servidor impede qualquer tipo de acesso não autorizado seja de indivíduos ou da NSA.  A chave secreta de entriptação é armazenada no <a href="https://en.wikipedia.org/wiki/Fragment_identifier">fragmento identificador</a> do endereço, que em momento algum é enviado para o servidor, porém é disponibilizada para o javascript ao compartilhar o link com outros com quem você deseja compartilhar acesso.';
    out.main_p2 = 'Este projeto utiliza os Editores visuais <a href="http://ckeditor.com/">CKEditor</a> e <a href="https://codemirror.net/">CodeMirror</a>, e a engine de tempo real <a href="https://github.com/xwiki-contrib/chainpad">ChainPad</a>.';
    out.main_howitworks = 'Como funciona';
    out.main_howitworks_p1 = 'CryptPad usa uma variante do algorítmo de <a href="https://en.wikipedia.org/wiki/Operational_transformation">Transformação Operacional</a>, que é capaz de encontrar consenso distribuido usando o <a href="https://bitcoin.org/bitcoin.pdf">Blockchain de Nakamoto</a>, um constructo popularizado pela <a href="https://en.wikipedia.org/wiki/Bitcoin">Criptomoeda Bitcoin</a>. Desta forma o algorítmo pode evitar a necessidade de um servidor central para resolver conflitos de edição operacional sem a necessidade do servidor armazenar o conteúdo que está sendo editado pelos colaboradores.';
    out.main_about = 'Sobre';
    out.main_about_p1 = 'Você pode ler mais sobre em nossa <a href="/privacy.html" title="">política de privacidade</a> e nos nossos <a href="/terms.html">termos de serviço</a>.';

    out.main_about_p2 = 'Se você tem alguma questão ou comentário, você pode <a href="https://twitter.com/cryptpad">nos mandar um tweet</a> ou abrir uma requisição <a href="https://github.com/xwiki-labs/cryptpad/issues/" title="no nosso tracker">no github</a>. Venha também nos dar um Oi no IRC (<a href="http://webchat.freenode.net?channels=%23cryptpad&uio=MT1mYWxzZSY5PXRydWUmMTE9Mjg3JjE1PXRydWUe7" title="freenode webchat">irc.freenode.net</a>), ou até mesmo via <a href="mailto:research@xwiki.com">e-mail</a>.';

    out.table_type = 'Tipo';
    out.table_link = 'Link';
    out.table_created = 'Criado';
    out.table_last = 'Último acesso';

    out.button_newpad = 'NOVO BLOCO WYSIWYG';
    out.button_newcode = 'NOVO BLOCO DE NOTAS';
    out.button_newpoll = 'NOVA ENQUETE';
    out.button_newslide = 'NOVA APRESENTAÇÃO';

    // privacy.html

    out.policy_title = 'Política de privacidade do Cryptpad';
    out.policy_whatweknow = 'O que nós sabemos sobre você';
    out.policy_whatweknow_p1 = 'Por ser uma aplicação hospedada na web, O Cryptpad tem acesso aos metadados expostos pelo protocolo HTTP. Isso inclui seu endereço IP, e vários cabeçalhos  do HTTP que podem ser usados para identificar seu browser particular. Você pode ver que informações seu navegador está compartilhando ao visitar <a target="_blank" rel="noopener noreferrer" href="https://www.whatismybrowser.com/detect/what-http-headers-is-my-browser-sending" title="Que cabeçalhos meu navegador está disponibilizando">WhatIsMyBrowser.com</a>.';
    out.policy_whatweknow_p2 = 'Nós usamos a plataforma de análise <a href="https://piwik.org/" target="_blank" rel="noopener noreferrer" title="plataforma analítica open source">Piwik</a>, uma plataforma analítica open source, para aprender mais sobre nossos usos. Piwik nos informa como você encontrou o Cryptpad, via digitação direta, através de mecanismos de busca, ou via link de outro serviço web como o Reddit ou o Twitter. Nós também aprendemos com suas visitas, que links você clica enquanto está em nossas páginas de informações, e quanto tempo você fica nestas páginas.';
    out.policy_whatweknow_p3 = 'Estas ferramentas de análise são utilizadas apenas com fins de informação. Nós não coletamos nenhuma informação sobre sua utilização em nossas aplicações de zero-knowledge.';
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


    // TODO Hardcode cause YOLO
    //out.header_xwiki = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer"><img src="/customize/logo-xwiki.png" alt="XWiki SAS" class="bottom-bar-xwiki"/></a>';
    out.header_support = '<a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';
    out.header_logoTitle = 'Ir para página principal';

    return out;
});
