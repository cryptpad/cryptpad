define(function () {
    var out = {};

    out._languageName = 'Español';

    out.main_title = "Cryptpad: Zero Knowledge, Editor Colaborativo en Tiempo Real";
    out.main_slogan = "La unidad es la fuerza - la colaboración es la clave";

    out.type = {};
    out.type.pad = 'Pad';
    out.type.code = 'Código';
    out.type.poll = 'Encuesta';
    out.type.slide = 'Presentación';

    out.errorBox_errorType_disconnected = 'Conexión perdida';
    out.errorBox_errorExplanation_disconnected = [
        'Se perdio la conexion con el servidor, tu puedes reconectarte actualizando la pagina o revisando tu trabajo ',
        'haciendo click por fuera de este cuadro.'
    ].join('');

    out.common_connectionLost = 'Conexión perdida con el servidor';

    out.disconnected = "Desconectado";
    out.synchronizing = "Sincronización";
    out.reconnecting = "Reconectando";
    out.lag = "Retraso";
    out.readOnly = 'Solo lectura';
    out.anonymous = 'Anónimo';
    out.yourself = "tú mismo";
    out.anonymousUsers = "usuarios anónimos";
    out.anonymousUser = "usuario anónimo";
    out.shareView = "URL de sólo lectura";
    out.shareEdit = "Editar URL";
    out.users = "Usuarios";
    out.and = "y";
    out.viewer = "espectador";
    out.viewers = "espectadores";
    out.editor = "editor";
    out.editors = "editores";

    out.editingAlone = 'Editar solo';
    out.editingWithOneOtherPerson = 'Editar con otra persona';
    out.editingWith = 'Editar con ';
    out.otherPeople = 'Otras personas';
    out.disconnected = 'Desconectado';
    out.synchronizing = 'Sincronizando';
    out.reconnecting = 'Reconectando...';
    out.lag = 'Retraso';
    out.readonly = 'Solo lectura';
    out.nobodyIsEditing = 'Nadie está editando';
    out.onePersonIsEditing = 'Una personas está editando';
    out.peopleAreEditing = '{0} personas están editando';
    out.oneViewer = '1 visualizando';
    out.viewers = '{0} están visualizando';
    out.anonymous = "Actualmente eres anónimo";

    out.greenLight = "Todo esta trabajando bién";
    out.orangeLight = "Tu conexion es lenta y podria impactar en el desempeño de tu experiencia";
    out.redLight = "¡Has sido desconectado de la sesión! ";

    out.importButton = 'IMPORTAR';
    out.importButtonTitle = 'Importar un documento de tus archivos locales';

    out.exportButton = 'EXPORTAR';
    out.exportButtonTitle = 'Exportar este documento a un archivo local';
    out.exportPrompt = '¿Como te gustaria nombra tu archivo ?';

    out.back = '&#8656; Atras';
    out.backToCryptpad = '⇐ Atras a Cryptpad';

    out.userButton = 'USUARIO';
    out.userButtonTitle = 'Cambiar tu nombre de usuario';
    out.changeNamePrompt = 'Cambiar tu nombre: ';

    out.renameButton = 'RENOMBRAR';
    out.renameButtonTitle = 'Cambiar el titulo del documento listado en tu pagina de inicio';
    out.renamePrompt = 'Como titularias este noja?';
    out.renameConflict = 'Otra nota tiene ya ese titulo';
    out.clickToEdit = "Haz click para editar";

    out.forgetButton = 'OLVIDAR';
    out.forgetButtonTitle = 'Eliminar este documento de la lista en la pagina de inicio';
    out.forgetPrompt = 'Presiona OK, removera la URL para esta nota desde el almacenamiento local, ¿Esta seguro?';

    out.shareButton = 'COMPARTIR';
    out.shareButtonTitle = "Copiar URL al portapapeles";
    out.shareSuccess = '¡URL Copiada al portapapeles!';
    out.shareFailed = "Fallo al copiar URL al portapapeles";

    out.presentButton = 'PRESENTAR';
    out.presentButtonTitle = "Ingresar en modo presentación";
    out.presentSuccess = 'ESC para salir del modo presentación';
    out.sourceButton = 'VER CÓDIGO FUENTE';
    out.sourceButtonTitle = "Abandonar modo presentación";

    out.backgroundButton = 'COLOR DE FONDO';
    out.backgroundButtonTitle = 'Cambiar el color de fondo en el modo presentación';
    out.colorButton = 'COLOR DE TEXTO';
    out.colorButtonTitle = 'Cambiar el color de texto en el modo presentación';

    out.commitButton = 'COMMIT';

    out.getViewButton = 'URL SOLO-LECTURA';
    out.getViewButtonTitle = 'Obtener URL de solo lectura para este documento';
    out.readonlyUrl = 'Documento de solo lectura';
    out.copyReadOnly = "Copiar URL al portapapeles";
    out.openReadOnly = "Abrir en nueva pestaña";

    // TODO VERIFY
    out.editShare = "URL de edición compartida";
    out.editShareTitle = "Copiar la URL de edición al portapapeles";
    out.viewShare = "Compartir vista URL";
    out.viewShareTitle = "Copiar la URL de solo lectura al portapapeles";
    out.viewOpen = "Ver en nueva pestaña";
    out.viewOpenTitle = "Abrir el documento en modo de sólo lectura en una nueva pestaña";

    out.notifyJoined = "{0} se ha unido a la sesión de colaboración";
    out.notifyRenamed = "{0} ahora se conoce como {1}";
    out.notifyLeft = "{0} ha dejado la sesión de colaboración";

    out.disconnectAlert = '¡Conexión de Red perdida!';

    out.tryIt = '¡PROBARLO!';
    out.recentPads = 'Tus notas recientes (están almacenadas en el navegador)';

    out.okButton = 'OK (enter)';
    out.cancelButton = 'Cancelar (esc)';

    out.loginText = '<p>Tu nombre de usuario y password son usados para generar una llave unica que es desconocida por nuestro servidor.</p>\n' +
                    '<p>Se cuidados no olvides tus credenciales, son imposibles de recuperar</p>';

    out.forget = "Olvidar";

    // Polls

    out.poll_title = "Zero Knowledge selector de fecha";
    out.poll_subtitle = "Zero Knowledge, agenda en <em>tiempo real</em> ";

    out.poll_p_save = "Tus configuraciones son actualizadas instantaneamente, no es necesario guardar cambios.";
    out.poll_p_encryption = "Todos los datos de entrada son cifrados, solo las personas que posee el link tiene acceso. Incluso desde el servidor no puede ver tus cambios.";
    out.poll_p_howtouse = "Ingresa tu nombre en el campo de entrada en la parte inferior y verificalo";

    out.promptName = "¿ Cual es tu nombre ?";

    out.wizardButton = 'ASISTENTE';
    out.wizardLog = "Presiona el boton en la parte superior izquierda para regresar a la encuesta";
    out.wizardTitle = "Utiliza el asistente para crear tu encuesta";
    out.wizardConfirm = "¿Estas realmente seguro de agregar estas opciones a tu encuesta?";

    out.poll_closeWizardButton = "Cerrar el asistente";
    out.poll_closeWizardButtonTitle = "Cerrar el asistente";
    out.poll_wizardComputeButton = "Computar opciones";
    out.poll_wizardClearButton = "Limpiar tabla";
    out.poll_wizardDescription = "Automaticamente crear un number de opciones ingresando cualquier numero de fechas y segmentos de tiempo";
    out.poll_wizardAddDateButton = "+ Fechas";
    out.poll_wizardAddTimeButton = "+ Horas";

    out.poll_addUserButton = "+ Usuarios";
    out.poll_addUserButtonTitle = "Click para adicionar usuario";
    out.poll_addOptionButton = "+ Opciones";
    out.poll_addOptionButtonTitle = "Click para adicionar una opción";
    out.poll_addOption = "Proponer una opción";
    out.poll_optionPlaceholder = "Opción";
    out.poll_addUser = "Ingresar un nombre";
    out.poll_userPlaceholder = "Tu nombre";
    out.poll_removeOption = "¿Seguro que te gustaria eliminar esta opción?";
    out.poll_removeOptionTitle = "Eliminar la fila";
    out.poll_removeUser = "¿Seguro que te gustaria eliminar este usuario?";
    out.poll_removeUserTitle = "Eliminar la columna";
    out.poll_editOption = "¿Seguro que te gustaria editar esta opción?";
    out.poll_editOptionTitle = "Editar la fila";
    out.poll_editUser = "¿Seguro que te gustaria editar este usuario?";
    out.poll_editUserTitle = "Editar la columna";

    out.poll_titleHint = "Titulo";
    out.poll_descriptionHint = "Descripción";

    // index.html

    out.main_p1 = 'CryptPad es un editor en tiempo <strong>zero knowledge</strong>.  El cifrado es llevado acabo en tu navegador protegiendo los datos de, sistemas en la nube, and la NSA. La clave cifrado privada es almacenada en la URL <a href="https://en.wikipedia.org/wiki/Fragment_identifier">fragment identifier</a> lo cual no es nunca enviado al servidor pero esta disponible para el javascript compartiendo la URL, tu autorizas a otros quienes desean participar.';
    out.main_p2 = 'Este proyecto usa <a href="http://ckeditor.com/">CKEditor</a> un editor de texto, <a href="https://codemirror.net/">CodeMirror</a>, y <a href="https://github.com/xwiki-contrib/chainpad">ChainPad</a> un motor de tiempo real.';
    out.main_howitworks = '¿Como Funciona?';

    out.main_howitworks_p1 = "CryptPad utiliza una variante del algoritmo de <a href='https://en.wikipedia.org/wiki/Operational_transformation'>transformación Operacional</a> que es capaz de encontrar el consenso distribuido usando un <a href='https://bitcoin.org/bitcoin.pdf'>Nakamoto Blockchain</a>, una construcción popularizada por <a href='https://en.wikipedia.org/wiki/Bitcoin'>Bitcoin</a> . De esta manera el algoritmo puede evitar la necesidad de un servidor central para resolver Conflictos de Edición de Transformación Operacional y sin necesidad de resolver conflictos, el servidor puede mantenerse inconsciente del contenido que se está editando en el pad.";


    out.main_about = 'Acerca de';
    out.main_about_p1 = 'Tu puedes leer mas acerca de nuestra <a href="/privacy.html" title="">politica de privacidad</a> y <a href="/terms.html">terminos de servicio</a>.';

    out.main_about_p2 = 'Si tu tienes preguntas o comentarios, tu puedes <a href="https://twitter.com/cryptpad">tweetearnos </a>,o abrir un issue <a href="https://github.com/xwiki-labs/cryptpad/issues/" title="our issue tracker">en github</a>, ven y di hola a nuestro canal de irc (<a href="http://webchat.freenode.net?channels=%23cryptpad&uio=MT1mYWxzZSY5PXRydWUmMTE9Mjg3JjE1PXRydWUe7" title="freenode webchat">irc.freenode.net</a>), o <a href="mailto:research@xwiki.com">envianos un email</a>.';

    out.table_type = 'Tipo';
    out.table_link = 'Link';
    out.table_created = 'Creado';
    out.table_last = 'Ultimo Acceso';

    out.button_newpad = 'CREAR NUEVA NOTA DE TEXTO ENRIQUECIDO';
    out.button_newcode = 'CREAR NUEVA NOTA DE CÓDIGO';
    out.button_newpoll = 'CREAR NUEVA ENCUESTA';
    out.button_newslide = 'CREAR NUEVA PRESENTACIÓN';

    // privacy.html

    out.policy_title = 'Cryptpad Política de privacidad';
    out.policy_whatweknow = 'Que sabemos sobre tí';
    out.policy_whatweknow_p1 = 'Como una aplicación que esta hospedada en la red, Cryptpad tiene acceso a los metadatos expuestos por el protocolo HTTP. Esto incluye tu direccion IP, y otros headers HTTP que puede ser usados para identificar particularmente tu navegador. Tu puedes comprar la informacion que comparte tu navegador visitando <a target="_blank" rel="noopener noreferrer" href="https://www.whatismybrowser.com/detect/what-http-headers-is-my-browser-sending" title="Que headers HTTP esta compartiendo mi navegador">WhatIsMyBrowser.com</a>.';
    out.policy_whatweknow_p2 = 'Nosotros usamos <a href="https://piwik.org/" target="_blank" rel="noopener noreferrer" title="open source analytics platform">Piwik</a>, an open source analytics platform, to learn more about our users. Piwik tells us about how you found Cryptpad, via direct entry, through a search engine, or via a referral from another web service like Reddit or Twitter. We also learn when you visit, what links you click while on our informational pages, and how long you stay on a particular page.';
    out.policy_whatweknow_p3 = 'Estas herramientas de estadística son usadas solamente para informacion local . Nosotros no recolectamos cualquier informacion sobre el uso de nuestro zero-knowledge application.';
    out.policy_howweuse = 'Como nosotros usamos lo que aprendemos';
    out.policy_howweuse_p1 = 'Nosotros usamos esta informacion para tomar mejores decisiones como promover y promocionar Cryptpad, para evaluar cual de nuestros esfuerzos pasados han sido exitosos. La informacion sobre tu ubicacion nos permite conocer si nosotros debemos considerar mejor soporte para otros idiomas diferentes al ingles.';
    out.policy_howweuse_p2 = "La informacion sobre tu navegador (si es un sistema operativo de escritorio o movil) nos ayuda a tomar medidads en las caracteristicas que debemos priorizar y mejorar. Nuestro equipo de desarrollo es pequeño, intentamos hacer elecciones que beneficien la mayoria de los usuarios' experiencia como sea posible.";
    out.policy_whatwetell = 'Lo que nosotros le decimos a otros sobre tí';
    out.policy_whatwetell_p1 = 'No suministramos información a terceros, ni la que usted nos proporciona a nosotros a menos de ser obligados legalmente a hacerlo.';
    out.policy_links = 'Links a Otros sitios';
    out.policy_links_p1 = 'Este sitio contiene links a otros sitios, incluyendo algunos producidos por otras organizaciones. Nosotros no nos responsabilisamos por el tratamiento, privacidad de los datos y contenido de sitios externos. Como regla general, los links externos son abiertos una nueva pestaña del navegador, para hacerlo claro tu estas abandonando Cryptpad.fr.';
    out.policy_ads = 'Anuncio';
    out.policy_ads_p1 = 'Nosotros no mostramos anuncios online, pensamos que podemos linkear a las personas que financian nuestra investigación.';
    out.policy_choices = 'Eleciones que tu tienes';
    out.policy_choices_open = 'Nuestro código es open source, Entonces tu siempre tienes la opcion crear tu propia estancia de Cryptpad.';
    out.policy_choices_vpn = 'Si tu deseas usar nuestra estancia, pero no deseas exponer tu dirección IP, tu puedes proteger tu dirección IP utilizando <a href="https://www.torproject.org/projects/torbrowser.html.en" title="downloads from the Tor project" target="_blank" rel="noopener noreferrer">Tor browser bundle</a>, o una  <a href="https://riseup.net/en/vpn" title="VPNs provided by Riseup" target="_blank" rel="noopener noreferrer">VPN</a>.';
    out.policy_choices_ads = 'If usted desea blockear rastreadores, y plataformas similares puedes utilizar herramientas como <a href="https://www.eff.org/privacybadger" title="download privacy badger" target="_blank" rel="noopener noreferrer">Privacy Badger</a>.';

    // terms.html

    out.tos_title = "Cryptpad Términos de Servicio";
    out.tos_legal = "Porfavor no seas malicioso, abusivo o realices prácticas ilegales.";
    out.tos_availability = "Nosotros esperamos que encuentres este servicio util, pero nuestra disponibilidad o desempeño no pueden ser garantizados. Por favor exporta tus datos regularmente.";
    out.tos_e2ee = "Cryptpad Los documentos pueden ser leidos o modificados para alguien puede ser invitado o por el contrario obtener un fragmento del documento. Nosotros recomendamos que tu uses cifrado punto a punto(e2ee) para compartir URLs, no asumimos ninguna responsabilidad en el evento de que existan fugas de URLs.";
    out.tos_logs = "Los metadatos entregados por el navegador a el servidor pueden ser logueados y almacenados para propuestas de mantener el servicio.";
    out.tos_3rdparties = "Nosotros no proveemos datos individualizados a terceros a menos que sea requerido por la ley.";

    // BottomBar.html

    out.bottom_france = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer">Made with <img class="bottom-bar-heart" src="/customize/heart.png" /> en <img class="bottom-bar-fr" src="/customize/fr.png" /></a>';
    out.bottom_support = '<a href="http://labs.xwiki.com/" title="XWiki Labs" target="_blank" rel="noopener noreferrer">An <img src="/customize/logo-xwiki2.png" alt="XWiki SAS" class="bottom-bar-xwiki"/> Labs Project </a> with the support of <a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';

    // Header.html

    out.header_france = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer">With <img class="bottom-bar-heart" src="/customize/heart.png" /> from <img class="bottom-bar-fr" src="/customize/fr.png" title="France" alt="France"/> by <img src="/customize/logo-xwiki.png" alt="XWiki SAS" class="bottom-bar-xwiki"/></a>';
    out.header_support = '<a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferre-r"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';
    out.header_logoTitle = 'Ir a la pagina principal';

    return out;
});
