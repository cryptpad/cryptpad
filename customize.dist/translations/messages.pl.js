define(function () {
    var out = {};

    // translations must set this key for their language to be available in
    // the language dropdowns that are shown throughout Cryptpad's interface
    out._languageName = 'Polish';

    out.main_title = "Cryptpad: Wspólne edytowanie w czasie rzeczywistym, bez wiedzy specjalistycznej";
    out.main_slogan = "Jedność siłą - Współpraca kluczem";

    out.type = {};
    out.type.pad = 'Pad';
    out.type.code = 'Kod';
    out.type.poll = 'Balot';
    out.type.slide = 'Prezentacja';

    out.errorBox_errorType_disconnected = 'Utracono połączenie';
    out.errorBox_errorExplanation_disconnected = [
        'Połączenie z serwerem zostało zerwane, możesz odświeżyć połączenie przeładowując stronę lub kontynuować przeglądanie dokumentu ',
        'klikając poza obszar komunikatu.'
    ].join('');

    out.common_connectionLost = 'Przerwano połączenie z serwerem';

    out.disconnected = 'Rozłączony';
    out.synchronizing = 'Synchronizacja';
    out.reconnecting = 'Wznawianie połączenia...';
    out.lag = 'Lag';
    out.readonly = 'Tylko do odczytu';
    out.anonymous = "Anonimowy";
    out.yourself = "Ty";
    out.anonymousUsers = "użytkownicy anonimowi";
    out.anonymousUser = "użytkownik anonimowy";
    out.shareView = "URL tylko do odczytu";
    out.shareEdit = "URL do edycji";
    out.users = "Użytkownicy";
    out.and = "i";
    out.viewer = "czytający";
    out.viewers = "czytających";
    out.editor = "edytujący";
    out.editors = "edytujących";

    out.greenLight = "Wszystkie systemy działają poprawnie";
    out.orangeLight = "Słabe łącze może wpłynąć na działanie aplikacji";
    out.redLight = "Zostałeś rozłączony z sesją";

    out.importButton = 'IMPORTUJ';
    out.importButtonTitle = 'Importuj dokument z pliku lokalnego';

    out.exportButton = 'EXPORTUJ';
    out.exportButtonTitle = 'Zapisz ten dokument do pliku';
    out.exportPrompt = 'Jak chciałbyś nazwać swój plik?';

    out.back = '&#8656; Wróć';
    out.backToCryptpad = '⇐ Wróć do Cryptpad';

    out.userButton = 'UŻYTKOWNIK';
    out.userButtonTitle = 'Zmień swoją nazwę użytkownika';
    out.changeNamePrompt = 'Zmień swoją nazwę (Pozostaw puste, by być anonimowym): ';

    out.renameButton = 'PRZEMIANUJ'; //Can be changed to "Zmień nazwę"
    out.renameButtonTitle = 'Zmień nazwę pod którą plik wyświetli się na stronie głównej';
    out.renamePrompt = 'Jak chciałbyś nazwać ten pad?';
    out.renameConflict = 'Inny pad już ma taką nazwę';
    out.clickToEdit = "Naciśnij by edytować";

    out.forgetButton = 'ZAPOMNIJ';
    out.forgetButtonTitle = 'Usuń ten dokument z listy wyświetlanej na stronie głównej';
    out.forgetPrompt = 'Wciskając OK usuniesz ten URL z pamięci lokalnej, jesteś tego pewien?';

    out.shareButton = 'Udostępnij';
    out.shareButtonTitle = "Kopiuj URL do schowka";
    out.shareSuccess = 'Pomyślnie skopiowano URL';
    out.shareFailed = "Wystąpił błąd przy kopiowaniu";

    out.presentButton = 'PREZENTUJ';
    out.presentButtonTitle = "Otwórz tryb prezentacji";
    out.presentSuccess = 'Naciśnij ESC aby wyjść z trybu prezentacji';
    out.sourceButton = 'POKAŻ ŹRÓDŁO';
    out.sourceButtonTitle = "Opuść tryb prezentacji";

    out.backgroundButton = 'KOLOR TŁA';
    out.backgroundButtonTitle = 'Zmień kolor tła dla tej prezentacji';
    out.colorButton = 'KOLOR TEKSTU';
    out.colorButtonTitle = 'Zmień kolor tekstu dla tej prezentacji';

    out.commitButton = 'ZAPISZ'; //Can be discussed

    out.getViewButton = 'URL tylko do odczytu';
    out.getViewButtonTitle = 'Kopiuj URL dokumentu tylko do odczytu';
    out.readonlyUrl = 'Dokument tylko do odczytu';
    out.copyReadOnly = "Kopiuj URL do schowka";
    out.openReadOnly = "Otwórz w nowej karcie";
    out.editShare = "Udostępnij URL do edycji";
    out.editShareTitle = "Zapisz URL do edycji w schowku";
    out.viewShare = "Udostępnij URL tylko do odczytu";
    out.viewShareTitle = "Zapisz URL tylko do odczytu w schowku";
    out.viewOpen = "Otwórz podgląd w nowej karcie";
    out.viewOpenTitle = "Otwórz ten dokument w nowej karcie, tylko do odczytu";

    out.notifyJoined = "{0} dołączył do sesji współpracy";
    out.notifyRenamed = "{0} jest teraz znany jako {1}";
    out.notifyLeft = "{0} opuścił sesję współpracy";

    out.tryIt = 'Wypróbuj!';
    out.recentPads = 'Ostatnio otwarte dokumenty (przechowywane jedynie w twojej przeglądarce)';

    out.okButton = 'OK (enter)';
    out.cancelButton = 'Anuluj (esc)';

    out.loginText = '<p>Twoja nazwa użytkownika i hasło są użyte do wygenerowania unikalnego klucza nie zapisanego na serwerze.</p>\n' +
                    '<p>Uważaj by nie zapomnieć swoich danych, odzyskanie ich jest niemożliwe.</p>';

    out.forget = "Zapomnij";

    // Polls

    out.poll_title = "Prosty koordynator spotkań"; // Choice of "Koordynator" can be discussed
    out.poll_subtitle = "Proste planowanie spotkań, <em>w czasie rzeczywistym</em>";

    out.poll_p_save = "Twoje ustawienia aktualizowane są na bieżąco. Nie martw się zapisywaniem.";
    out.poll_p_encryption = "Wszystko co robisz jest szyfrowane, więc tylko osoby z linkiem mają tu dostęp. Nawet serwer nie widzi co kombinujesz.";
    out.poll_p_howtouse = "Wpisz swoje imię w polu poniżej i zaznacz kiedy będziesz dostępny.";

    out.promptName = "Jak się nazywasz?";

    out.wizardButton = 'KREATOR';
    out.wizardLog = "Naciśnij przycisk w lewym-górnym rogu by wrócić do planu";
    out.wizardTitle = "Uzyj kreatora by stworzyć opcje do głosowania";
    out.wizardConfirm = "Jesteś pewny, że chcesz dodać te opcje do głosowania?";

    out.poll_closeWizardButton = "Zamknij kreator";
    out.poll_closeWizardButtonTitle = "Zamyka kreator";
    out.poll_wizardComputeButton = "Ustawienia kalkulacji";
    out.poll_wizardClearButton = "Wyczyść tabelę";
    out.poll_wizardDescription = "Automatycznie stwórz część opcji poprzez wpisanie ilości dat i godzin";
    out.poll_wizardAddDateButton = "+ Daty";
    out.poll_wizardAddTimeButton = "+ Godziny";

    out.poll_addUserButton = "+ Użytkownik";
    out.poll_addUserButtonTitle = "Naciśnij, by dodać użytkownika";
    out.poll_addOptionButton = "+ Opcja";
    out.poll_addOptionButtonTitle = "Naciśnij, by dodać opcję";
    out.poll_addOption = "Zaproponuj opcję";
    out.poll_optionPlaceholder = "Opcja";
    out.poll_addUser = "Podaj imię";
    out.poll_userPlaceholder = "Twoje imię";
    out.poll_removeOption = "Jesteś pewien, że chcesz usunąć tę opcję?";
    out.poll_removeOptionTitle = "Usuń wiersz";
    out.poll_removeUser = "Jesteś pewien, że chcesz usunąć tego użytkownika?";
    out.poll_removeUserTitle = "Usuń kolumnę";
    out.poll_editOption = "Jesteś pewien, że chcesz edytować tę opcję?";
    out.poll_editOptionTitle = "Edytuj wiersz";
    out.poll_editUser = "Jesteś pewien, że chcesz edytować tego uzytkownika?";
    out.poll_editUserTitle = "Edytuj kolumnę";

    out.poll_titleHint = "Tytuł";
    out.poll_descriptionHint = "Opis";

    // index.html

    out.main_p1 = 'CryptPad to edytor czasu rzeczywistego stawiający na współpracę i <strong>prostotę użytkowania</strong>. Szyfrowanie w twojej przeglądarce chroni twoje dane przed serwerem, chmurą i ABW. Tajny klucz szyfrujący jest przechowywany we <a href="https://pl.wikipedia.org/wiki/Uniform_Resource_Identifier#Pe.C5.82ny_wz.C3.B3r_URI_hierarchicznych.5B2.5D">fragmencie URI</a> adresu strony, który nigdy nie jest przekazany serwerowi, a dostępny jest dla javascript. Udostępniając URL (link), przekazujesz innym upoważnienie do uczestnictwa.';
    out.main_p2 = 'Ten projekt wykorzystuje wizualny edytor <a href="http://ckeditor.com/">CKEditor</a> , <a href="https://codemirror.net/">CodeMirror</a>, oraz silnik czasu rzeczywistego <a href="https://github.com/xwiki-contrib/chainpad">ChainPad</a>.';
    out.main_howitworks = 'Jak to działa';
    out.main_howitworks_p1 = 'CryptPad wykorzystuje wariant algorytmu <a href="https://en.wikipedia.org/wiki/Operational_transformation">Transformacji operacyjnej</a> który jest wstanie odnaleźć rozdzielony konsensus wprowadzanych danych. Używa do tego <a href="https://bitcoin.org/bitcoin.pdf">Łańcuch blokowy Nakamoto</a>, twór zpopularyzowany przez <a href="https://en.wikipedia.org/wiki/Bitcoin">Bitcoin</a>. W ten sposób algorytm może pominąć potrzebę centralnego serwera do rozwiązywania Konfliktów Operacji Przekształcania poprzez Edycję. Bez potrzeby rozwiązywania konfliktów, serwer może pozostać w niewiedzy o zawartości która jest edytowana w dokumencie.';
    out.main_about = 'O projekcie';
    out.main_about_p1 = 'Możesz przeczytać więcej o naszej <a href="/privacy.html" title="">polityce prywatności</a> oraz <a href="/terms.html">warunkach korzystania z usług</a>.';

    out.main_about_p2 = 'Jeżeli masz jakieś pytania lub komentarze, możesz napisać na <a href="https://twitter.com/cryptpad">tweeterze</a>, otworzyć problem na <a href="https://github.com/xwiki-labs/cryptpad/issues/" title="our issue tracker">githubie</a>, przywitać się na ircu (<a href="http://webchat.freenode.net?channels=%23cryptpad&uio=MT1mYWxzZSY5PXRydWUmMTE9Mjg3JjE1PXRydWUe7" title="freenode webchat">irc.freenode.net</a>), lub wysłać nam <a href="mailto:research@xwiki.com">email</a>.';

    out.table_type = 'Typ';
    out.table_link = 'Link';
    out.table_created = 'Stworzone';
    out.table_last = 'Ostatnio otwarte';

    out.button_newpad = 'STWÓRZ PAD WYSIWYG';
    out.button_newcode = 'STWÓRZ PAD DO KODU';
    out.button_newpoll = 'STWÓRZ GŁOSOWANIE';
    out.button_newslide = 'STWÓRZ PREZENTACJĘ';

    // privacy.html

    out.policy_title = 'Polityka prywatności CryptPad';
    out.policy_whatweknow = 'Co o tobie wiemy';
    out.policy_whatweknow_p1 = 'Jako aplikacja udostępniana w internecie, CryptPad ma dostęp do metadanych wystawianych przez protokół HTTP. W skład tych danych wchodzi adres IP oraz różne inne nagłówki HTTP które pozwalają na identyfikację twojej przeglądarki. Możesz podejrzeć jakie informacje udostępnia twoja przeglądarka odwiedzając <a target="_blank" rel="noopener noreferrer" href="https://www.whatismybrowser.com/detect/what-http-headers-is-my-browser-sending" title="what http headers is my browser sending">WhatIsMyBrowser.com</a>.';
    out.policy_whatweknow_p2 = 'Używamy <a href="https://piwik.org/" target="_blank" rel="noopener noreferrer" title="open source analytics platform">Piwik</a>, Open Sourcowej platformy analitycznej, aby dowiedzieć się czegoś o naszych użytkownikach. Piwik mówi nam, skąd dowiedziałeś się o Cryptpad. Bezpośrednio przez adres, silnik wyszukiwany, czy z polecenia innej usługi internetowej jak Reddit czy Twitter. Uczymy się również gdy nas odwiedzasz, jakie linki odwiedzasz z naszej strony informacyjnej i jak długo pozostajesz na konkretnych stronach.';
    out.policy_whatweknow_p3 = 'Te narzędzia analityczne wykorzystywane są wyłącznie na strona informacyjncyh. Nie zbieramy informacji o twoim użytkowaniu naszej aplikacji.';
    out.policy_howweuse = 'Jak wykorzystujemy zebraną wiedzę';
    out.policy_howweuse_p1 = 'Dzieki tym informacjom możemy podejmować lepsze decyzje przy promocji CryptPad, poprzez ocenę które z podjętych przez nas prób okazały się udane. Informacja o twojej lokalizacji daje nam znać, czy powinniśmy zapewnić lepsze wsparcie dla języków poza Angielskim.';
    out.policy_howweuse_p2 = "Informacje o twojej przeglądarce (czy jest to aplikacja desktopowa, czy działająca na systemie mobilnym) pozwalają nam na decydowanie przy priorytezowaniu ulepszeń funkcji. Nasz zespół deweloperski jest mały, a my staramy się dokonywać wyborów które poprawią doświadczenia jak największej liczby użytkowników.";
    out.policy_whatwetell = 'Jakie dane przekazujemy innym';
    out.policy_whatwetell_p1 = 'Nie dostarczamy osobom trzecim żadnych danych które udało się nam zebrać, lub tych które nam przekazałeś sam, dopóki nie jesteśmy do tego zobligowani prawnie.';
    out.policy_links = 'Adresy innych stron';
    out.policy_links_p1 = 'Ta witryna zawiera łącza do innych stron, włączając w to te stworzone przez inne organizacje. Nie jesteśmy odpowiedzialni za praktyki dotyczące prywatności oraz zawartość usługodawców poza tą witryną. Jako główną zasadę przyjmujemy, że łącza do stron zewnętrznych uruchamiane są w nowej karcie lub oknie, aby upewnić cię iż opuszczasz Cryptpad.';
    out.policy_ads = 'Promocja i reklama';
    out.policy_ads_p1 = 'Nie wyświetlamy żadnej zawartości promocyjnej online, choć możemy udostępniać łącza do podmiotów finansujących nasze badania.';
    out.policy_choices = 'Co możesz zrobić';
    out.policy_choices_open = 'Nasz kod jest open source, więc zawsze masz możliwość hostowania swojej własnej wersji Cryptpad.';
    out.policy_choices_vpn = 'Jeżeli chcesz korzystać z wersji udostępnianej przez nas, lecz nie chcesz pokazywać swojego adresu IP, możesz chronić swój adres wykorzystując <a href="https://www.torproject.org/projects/torbrowser.html.en" title="downloads from the Tor project" target="_blank" rel="noopener noreferrer">przeglądarki Tor</a>, lub <a href="https://riseup.net/en/vpn" title="VPNs provided by Riseup" target="_blank" rel="noopener noreferrer">VPN</a>.';
    out.policy_choices_ads = 'Masz również możliwość blokady naszej platformy analitycznej wykorzystując narzędzia adblock, takie jak <a href="https://www.eff.org/privacybadger" title="download privacy badger" target="_blank" rel="noopener noreferrer">Privacy Badger</a>.';

    // terms.html

    out.tos_title = "Warunki korzystania z usług Cryptpad";
    out.tos_legal = "Prosimy abyś nie był złośliwy, obelżywy i nie wykorzystywał tego oprogramowania do celow niezgodnych z prawem.";
    out.tos_availability = "Mamy nadzieję iż uznasz tę usługę za przydatną, lecz dostępność i wydajność nie mogą być przez nas gwarantowane. Prosimy, abyś eksportował swoje dane regularnie.";
    out.tos_e2ee = "Dokumenty Cryptpad mogą być odczytywane i modyfikowane przez każdego kto może zgadnąć lub w inny sposób uzyskać identyfikator dokumentu. Polecamy korzystania z oprogramowania szyfrującego end-to-end (e2ee) do udostępniania linków URL. Nie będziesz rościł sobie żadnych wierzytelności w wypadku gdy taki URL dostanie się w niepowołane ręce.";
    out.tos_logs = "Metadane dostarczane przez twoją przeglądarkę do serwera mogą być zapisywane i przechowywane w celu utrzymywania serwisu.";
    out.tos_3rdparties = "Nie dostarczamy indywidualizowanych danych do osób trzecich, poza sytuacjami dyktowanymi prawnie.";

    // BottomBar.html

    out.bottom_france = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer">Stworzone z <img class="bottom-bar-heart" src="/customize/heart.png" /> we <img class="bottom-bar-fr" src="/customize/fr.png" /></a>';
    out.bottom_support = '<a href="http://labs.xwiki.com/" title="XWiki Labs" target="_blank" rel="noopener noreferrer">Projekt <img src="/customize/logo-xwiki2.png" alt="XWiki SAS" class="bottom-bar-xwiki"/> Labs </a> we wspolpracy z <a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';

    // Header.html

    out.header_france = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer">Pełne <img class="bottom-bar-heart" src="/customize/heart.png" /> z <img class="bottom-bar-fr" src="/customize/fr.png" title="France" alt="France"/> od <img src="/customize/logo-xwiki.png" alt="XWiki SAS" class="bottom-bar-xwiki"/></a>';


    // TODO Hardcode cause YOLO
    //out.header_xwiki = '<a href="http://www.xwiki.com/" target="_blank" rel="noopener noreferrer"><img src="/customize/logo-xwiki.png" alt="XWiki SAS" class="bottom-bar-xwiki"/></a>';
    out.header_support = '<a href="http://ng.open-paas.org/" title="OpenPaaS::ng" target="_blank" rel="noopener noreferrer"> <img src="/customize/openpaasng.png" alt="OpenPaaS-ng" class="bottom-bar-openpaas" /></a>';
    out.header_logoTitle = 'Przejdź na stronę główną';

    return out;
});
