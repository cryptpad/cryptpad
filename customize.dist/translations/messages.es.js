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
        'Se perdió la conexión con el servidor, puedes reconectarte actualizando la página o revisar tu trabajo ',
        'haciendo clic por fuera de este cuadro.'
    ].join('');

    out.common_connectionLost = 'Conexión perdida con el servidor';

    out.disconnected = "Desconectado";
    out.synchronizing = "Sincronización";
    out.reconnecting = "Reconectando...";
    out.lag = "Retraso";
    out.readonly = 'Solo lectura';
    out.anonymous = 'Anónimo';
    out.yourself = "tú mismo";
    out.anonymousUsers = "usuarios anónimos";
    out.anonymousUser = "usuario anónimo";
    out.shareView = "URL de solo lectura";
    out.shareEdit = "Editar URL";
    out.users = "Usuarios";
    out.and = "y";
    out.viewer = "espectador";
    out.viewers = "espectadores";
    out.editor = "editor";
    out.editors = "editores";

    out.greenLight = "Todo funciona bién";
    out.orangeLight = "La conexión es lenta y podria impactar la experiencia";
    out.redLight = "Has sido desconectado de la sesión";

    out.importButton = 'IMPORTAR';
    out.importButtonTitle = 'Importar un documento de tus archivos locales';

    out.exportButton = 'EXPORTAR';
    out.exportButtonTitle = 'Exportar este documento a un archivo local';
    out.exportPrompt = '¿Cómo te gustaría llamar a este archivo?';

    out.back = '&#8656; Atrás';
    out.backToCryptpad = '⇐ Volver a Cryptpad';

    out.userButton = 'USUARIO';
    out.userButtonTitle = 'Cambiar tu nombre de usuario';
    out.changeNamePrompt = 'Cambiar tu nombre (dejar vacío para ser anónimo): ';

    out.renameButton = 'RENOMBRAR';
    out.renameButtonTitle = 'Cambiar el título del documento listado en la pagina de inicio';
    out.renamePrompt = '¿Cómo titulariás este documento?';
    out.renameConflict = 'Otro documenta ya tiene ese título';
    out.clickToEdit = "Haz clic para cambiar";

    out.forgetButton = 'OLVIDAR';
    out.forgetButtonTitle = 'Eliminar este documento de la lista en la pagina de inicio';
    out.forgetPrompt = 'Pulser OK eliminará este documento del almacenamiento local (localStorage), ¿estás seguro?';

    out.shareButton = 'Compartir';
    out.shareButtonTitle = "Copiar URL al portapapeles";
    out.shareSuccess = 'URL copiada al portapapeles';
    out.shareFailed = "Falló la copia del URL al portapapeles";

    out.presentButton = 'PRESENTAR';
    out.presentButtonTitle = "Entrar en el modo presentación";
    out.presentSuccess = 'ESC para salir del modo presentación';
    out.sourceButton = 'VER CÓDIGO FUENTE';
    out.sourceButtonTitle = "Abandonar modo presentación";

    out.backgroundButton = 'COLOR DE FONDO';
    out.backgroundButtonTitle = 'Cambiar el color de fondo en el modo presentación';
    out.colorButton = 'COLOR DE TEXTO';
    out.colorButtonTitle = 'Cambiar el color de texto en el modo presentación';

    out.commitButton = 'VALIDAR';

    out.getViewButton = 'URL SOLO LECTURA';
    out.getViewButtonTitle = 'Obtener URL de solo lectura para este documento';
    out.readonlyUrl = 'Documento de solo lectura';
    out.copyReadOnly = "Copiar URL al portapapeles";
    out.openReadOnly = "Abrir en nueva pestaña";
    out.editShare = "URL de edición compartida";
    out.editShareTitle = "Copiar la URL de edición al portapapeles";
    out.viewShare = "Compartir URL de solo lectura";
    out.viewShareTitle = "Copiar la URL de solo lectura al portapapeles";
    out.viewOpen = "Ver en pestaña nueva";
    out.viewOpenTitle = "Abrir el documento en solo lectura en una pestaña nueva";

    out.notifyJoined = "{0} se ha unido a la sesión de colaboración";
    out.notifyRenamed = "{0} ahora se conoce como {1}";
    out.notifyLeft = "{0} ha dejado la sesión de colaboración";

    out.disconnectAlert = '¡Conexión a la red perdida!';

    out.tryIt = '¡PROBARLO!';
    out.recentPads = 'Tus documentos recientes (almacenadas solo en el navegador)';

    out.okButton = 'OK (enter)';
    out.cancelButton = 'Cancelar (esc)';

    out.loginText = '<p>Tu nombre de usuario y contraseña son utilizados para generar una llave única que es desconocida por nuestro servidor.</p>\n' +
                    '<p>Ten cuidado a no olvidar tus credenciales, ya que son imposibles de recuperar.</p>';

    out.forget = "Olvidar";

    // Polls

    out.poll_title = "Selector de fecha Zero Knowledge";
    out.poll_subtitle = "Agenda en <em>tiempo real</em> Zero Knowledge";

    out.poll_p_save = "Tus configuraciones se actualizan instantaneamente, no es necesario guardar cambios.";
    out.poll_p_encryption = "Todos los datos entrados son cifrados, solo las personas que poseen el enlace tienen acceso. Incluso el servidor no puede ver el contenido.";
    out.poll_p_howtouse = "Ingresa tu nombre y marca tus disponibilidades";

    out.promptName = "¿Cuál es tu nombre?";

    out.wizardButton = 'ASISTENTE';
    out.wizardLog = "Presiona el boton en la parte superior izquierda para volver a la encuesta";
    out.wizardTitle = "Utiliza el asistente para crear tu encuesta";
    out.wizardConfirm = "¿Estás realmente seguro de agregar estas opciones a tu encuesta?";

    out.poll_closeWizardButton = "Cerrar el asistente";
    out.poll_closeWizardButtonTitle = "Cerrar el asistente";
    out.poll_wizardComputeButton = "Generar opciones";
    out.poll_wizardClearButton = "Limpiar tabla";
    out.poll_wizardDescription = "Automaticamente crear opciones ingresando cualquier cantidad de fechas y horas";
    out.poll_wizardAddDateButton = "+ Fechas";
    out.poll_wizardAddTimeButton = "+ Horas";

    out.poll_addUserButton = "+ Usuarios";
    out.poll_addUserButtonTitle = "Haz clic para agregar un usuario";
    out.poll_addOptionButton = "+ Opciones";
    out.poll_addOptionButtonTitle = "Haz clic para añadir una opción";
    out.poll_addOption = "Añadir una opción";
    out.poll_optionPlaceholder = "Opción";
    out.poll_addUser = "Ingresar un nombre";
    out.poll_userPlaceholder = "Tu nombre";
    out.poll_removeOption = "¿Estás seguro que quieres eliminar esta opción?";
    out.poll_removeOptionTitle = "Eliminar la fila";
    out.poll_removeUser = "¿Estás seguro que quieres eliminar este usuario?";
    out.poll_removeUserTitle = "Eliminar la columna";
    out.poll_editOption = "¿Estás seguro que quieres editar esta opción?";
    out.poll_editOptionTitle = "Editar la fila";
    out.poll_editUser = "¿Estás seguro que quieres editar este usuario?";
    out.poll_editUserTitle = "Editar la columna";

    out.poll_titleHint = "Título";
    out.poll_descriptionHint = "Descripción";

    // index.html

    out.main_p1 = 'CryptPad es un editor en tiempo real <strong>zero knowledge</strong>. El cifrado se hace en el navegador protegiendo los datos del servidor, la nube, y la NSA. La clave de cifrado es almacenada en el <a href="https://en.wikipedia.org/wiki/Fragment_identifier">identificador de fragmento</a> (página en inglés) del URL y no es enviado al servidor pero está disponible por javascript, por lo cual compartiendo la URL, tú autorizas a quienes pueden participar.';
    out.main_p2 = 'Este proyecto utiliza el editor de texto visual <a href="http://ckeditor.com/">CKEditor</a>, <a href="https://codemirror.net/">CodeMirror</a>, y el motor en tiempo real <a href="https://github.com/xwiki-contrib/chainpad">ChainPad</a>.';
    out.main_howitworks = '¿Cómo funciona?';
    out.main_howitworks_p1 = "CryptPad utiliza una variante del algoritmo de <a href='https://en.wikipedia.org/wiki/Operational_transformation'>transformación operacional</a> (página en inglés) que es capaz de encontrar un consenso distribuido usando un <a href='https://bitcoin.org/bitcoin.pdf'>Blockchain Nakamoto</a> (página en inglés), popularizado por <a href='https://es.wikipedia.org/wiki/Bitcoin'>Bitcoin</a>. De esta manera el algoritmo puede evitar la necesidad de un servidor central para resolver conflictos de edición de la transformación operacional y sin necesidad de resolver conflictos, el servidor puede mantenerse inconsciente del contenido que se está editando en el pad.";
    out.main_about = 'Acerca de';
    out.main_about_p1 = 'Puedes leer más acerca de nuestra <a href="/privacy.html" title="">política de privacidad</a> y <a href="/terms.html">condiciones de servicio</a>.';

    out.main_about_p2 = 'Si tienes preguntas o comentarios, puedes <a href="https://twitter.com/cryptpad">enviarnos un tweet</a>, abrir un issue <a href="https://github.com/xwiki-labs/cryptpad/issues/" title="nuestro issue tracker">en GitHub</a>, saludarnos en nuestro canal IRC (<a href="http://webchat.freenode.net?channels=%23cryptpad&uio=MT1mYWxzZSY5PXRydWUmMTE9Mjg3JjE1PXRydWUe7" title="freenode webchat">irc.freenode.net</a>), o <a href="mailto:research@xwiki.com">envianos un email</a>.';

    out.table_type = 'Tipo';
    out.table_link = 'Enlace';
    out.table_created = 'Creado';
    out.table_last = 'Último acceso';

    out.button_newpad = 'CREAR NUEVO PAD DE TEXTO ENRIQUECIDO';
    out.button_newcode = 'CREAR NUEVO PAD DE CÓDIGO';
    out.button_newpoll = 'CREAR NUEVA ENCUESTA';
    out.button_newslide = 'CREAR NUEVA PRESENTACIÓN';

    // privacy.html

    out.policy_title = 'Política de privacidad Cryptpad';
    out.policy_whatweknow = 'Qué sabemos sobre tí';
    out.policy_whatweknow_p1 = 'Como cualquier aplicación que está en la red, Cryptpad tiene acceso a los metadatos expuestos por el protócolo HTTP. Esto incluye tu dirección IP, y otros headers HTTP que pueden ser utilizados para identificar a tu navegador propio. Puedes ver la información que comparte tu navegador visitando <a target="_blank" rel="noopener noreferrer" href="https://www.whatismybrowser.com/detect/what-http-headers-is-my-browser-sending" title="Que headers HTTP esta compartiendo mi navegador">WhatIsMyBrowser.com</a> (página en inglés).';
    out.policy_whatweknow_p2 = 'Nosotros usamos <a href="https://piwik.org/" target="_blank" rel="noopener noreferrer" title="open source analytics platform">Piwik</a>, una plataforma de analítica de datos abierta, para mejor conocer a nuestros usuarios. Piwik nos dice como encontráste Cryptpad, en entrada manual, por un motor de busquéda, or por referal de otra página como Reddit o Twitter. También aprendemos cuándo visitas, que páginas vees en nuestra web, y cuánto tiempo te quedas en cada una.';
    out.policy_whatweknow_p3 = 'Estas herramientas de estadísticas son utilizadas solamente en las páginas de información. No recolectamos cualquier información sobre el uso de nuestra applicación zero-knowledge.';
    out.policy_howweuse = 'Cómo usamos lo que aprendemos';
    out.policy_howweuse_p1 = 'Usamos esta información para tomar mejores decisiones para promocionar Cryptpad, para evaluar cuáles de nuestros esfuerzos han sido exitosos. La información sobre tu ubicación nos permite saber si deberíamos considerar mejor soporte para idiomas diferentes al inglés.';
    out.policy_howweuse_p2 = "La información sobre tu navegador (en escritorio u movil) nos ayuda a saber qué caracteristicas que debemos mejorar. Nuestro equipo de desarrollo es pequeño, e intentamos tomar decisiones que beneficien a la experiencia de la mayoria de nuestros usuarios.";
    out.policy_whatwetell = 'Lo que decimos a otros sobre tí';
    out.policy_whatwetell_p1 = 'No suministramos la información que colectamos a terceros a menos de ser legalmente obligados a hacerlo.';
    out.policy_links = 'Enlaces a otras páginas';
    out.policy_links_p1 = 'Esta web contiene enlaces a otros sitios, incluyendo algunos producidos por otras organizaciones. No somos responsables por el tratamiento de la privacidad de los datos y el contenido de páginas externas. Como regla general, los enlaces externos se abren en una nueva pestaña del navegador, para clarificar que estás abandonando a Cryptpad.fr.';
    out.policy_ads = 'Anuncios';
    out.policy_ads_p1 = 'Nosotros no mostramos anuncios, pero podemos poner enlaces a las organizaciones que financian nuestro trabajo de investigación.';
    out.policy_choices = 'Lo que puedes hacer';
    out.policy_choices_open = 'Nuestro código fuente es abierto para que siempre tengas la opción de desplegar tu propia instancia de Cryptpad.';
    out.policy_choices_vpn = 'Si deseas utilizar nuestra instancia, pero no deseas exponer tu dirección IP, puedes protegerla utilizando <a href="https://www.torproject.org/projects/torbrowser.html.en" title="descargas Tor project" target="_blank" rel="noopener noreferrer">el navegador Tor</a>, o un <a href="https://riseup.net/en/vpn" title="VPNs por Riseup" target="_blank" rel="noopener noreferrer">VPN</a>.';
    out.policy_choices_ads = 'Si deseas no ser seguido por nuestra plataforma, puedes utilizar herramientas como <a href="https://www.eff.org/privacybadger" title="descargar a Privacy Badger" target="_blank" rel="noopener noreferrer">Privacy Badger</a>.';

    // terms.html

    out.tos_title = "Condiciones de servicio Cryptpad";
    out.tos_legal = "Por favor, no seas malicioso, abusivo o hagas algo ilegal.";
    out.tos_availability = "Esperamos que este servicio te parezca util, pero nuestra disponibilidad o rendimiento no pueden ser garantizados. Por favor, exporta tus datos regularmente.";
    out.tos_e2ee = "Los documentos Cryptpad pueden ser leidos o modificados por cualquiera que pueda adivinar o que pueda tener el enlace. Recomendamos que utilizes mensajes cifrados de punto a punto (e2ee) para compartir URLs, no asumimos ninguna responsabilidad en el evento de alguna fuga.";
    out.tos_logs = "Los metadatos entregados por el navegador al servidor pueden ser almacenados para la mantenencia del servicio.";
    out.tos_3rdparties = "No proveemos datos individualizados a terceros a menos de ser obligados por la ley.";

    // BottomBar.html

    out.bottom_france = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer">Hecho con <img class="bottom-bar-heart" src="/customize/heart.png" alt="amor" /> en <img class="bottom-bar-fr" src="/customize/fr.png" alt="Francia" /></a>';
    out.bottom_support = '<a href="http://labs.xwiki.com/" title="XWiki Labs" target="_blank" rel="noopener noreferrer">Un <img src="/customize/logo-xwiki2.png" alt="XWiki SAS" class="bottom-bar-xwiki"/>Proyecto Labs</a> con el soporte de <a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"><img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';

    // Header.html

    out.header_france = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer">Con <img class="bottom-bar-heart" src="/customize/heart.png" alt="amor" /> de <img class="bottom-bar-fr" src="/customize/fr.png" title="France" alt="Francia"/> por <img src="/customize/logo-xwiki.png" alt="XWiki SAS" class="bottom-bar-xwiki"/></a>';
    out.header_support = '<a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferre-r"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';
    out.header_logoTitle = 'Ir a la página principal';

    return out;
});
