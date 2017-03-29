define([
    '/customize/application_config.js',
    '/common/cryptpad-common.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Config, Cryptpad) {
    var $ = window.$;

    var APP = window.APP = {
        Cryptpad: Cryptpad,
    };

    var Messages = Cryptpad.Messages;

    $(function () {
        var $main = $('#mainBlock');

        // Language selector
        var $sel = $('#language-selector');
        Cryptpad.createLanguageSelector(undefined, $sel);
        $sel.find('button').addClass('btn').addClass('btn-secondary');
        $sel.show();

        // User admin menu
        var $userMenu = $('#user-menu');
        var userMenuCfg = {
            $initBlock: $userMenu
        };
        var $userAdmin = Cryptpad.createUserAdminMenu(userMenuCfg);
        $userAdmin.find('button').addClass('btn').addClass('btn-secondary');

        $(window).click(function () {
            $('.cryptpad-dropdown').hide();
        });


        // main block is hidden in case javascript is disabled
        $main.removeClass('hidden');

        // Make sure we don't display non-translated content (empty button)
        $main.find('#data').removeClass('hidden');

        if (Cryptpad.isLoggedIn()) {
            var name = localStorage[Cryptpad.userNameKey] || sessionStorage[Cryptpad.userNameKey];
            var $loggedInBlock = $main.find('#loggedIn');
            var $hello = $loggedInBlock.find('#loggedInHello');
            var $logout = $loggedInBlock.find('#loggedInLogOut');

            if (name) {
                $hello.text(Messages._getKey('login_hello', [name]));
            } else {
                $hello.text(Messages.login_helloNoName);
            }
            $('#buttons').find('.nologin').hide();

            $logout.click(function () {
                Cryptpad.logout(function () {
                    window.location.reload();
                });
            });

            $loggedInBlock.removeClass('hidden');
            //return;
        } else {
            $main.find('#userForm').removeClass('hidden');
            $('#name').focus();
        }

        var displayCreateButtons = function () {
            var $parent = $('#buttons');
            var options = [];
            var $container = $('<div>', {'class': 'dropdown-bar'}).appendTo($parent);
            Config.availablePadTypes.forEach(function (el) {
                if (el === 'drive') { return; }
                options.push({
                    tag: 'a',
                    attributes: {
                        'class': 'newdoc',
                        'href': '/' + el + '/',
                        'target': '_blank'
                    },
                    content: Messages['button_new' + el] // Pretty name of the language value
                });
            });
            var dropdownConfig = {
                text: Messages.login_makeAPad, // Button initial text
                options: options, // Entries displayed in the menu
                container: $container
            };
            var $block = Cryptpad.createDropdown(dropdownConfig);
            $block.find('button').addClass('btn').addClass('btn-primary');
            $block.appendTo($parent);
        };


        /* Log in UI */
        var Login;
        // deferred execution to avoid unnecessary asset loading
        var loginReady = function (cb) {
            if (Login) {
                if (typeof(cb) === 'function') { cb(); }
                return;
            }
            require([
                '/common/login.js',
            ], function (_Login) {
                Login = Login || _Login;
                if (typeof(cb) === 'function') { cb(); }
            });
        };

        var $uname = $('#name').on('focus', loginReady);

        var $passwd = $('#password')
        // background loading of login assets
        .on('focus', loginReady)
        // enter key while on password field clicks signup
        .on('keyup', function (e) {
            if (e.which !== 13) { return; } // enter
            $('button.login').click();
        });

        $('button.login').click(function (e) {
            Cryptpad.addLoadingScreen(Messages.login_hashing);
            // We need a setTimeout(cb, 0) otherwise the loading screen is only displayed after hashing the password
            window.setTimeout(function () {
                loginReady(function () {
                    var uname = $uname.val();
                    var passwd = $passwd.val();
                    Login.loginOrRegister(uname, passwd, false, function (err, result) {
                        if (!err) {
                            var proxy = result.proxy;

                            // successful validation and user already exists
                            // set user hash in localStorage and redirect to drive
                            if (proxy && !proxy.login_name) {
                                proxy.login_name = result.userName;
                            }

                            proxy.edPrivate = result.edPrivate;
                            proxy.edPublic = result.edPublic;

                            Cryptpad.whenRealtimeSyncs(result.realtime, function () {
                                Cryptpad.login(result.userHash, result.userName, function () {
                                    document.location.href = '/drive/';
                                });
                            });
                            return;
                        }
                        switch (err) {
                            case 'NO_SUCH_USER':
                                Cryptpad.removeLoadingScreen(function () {
                                    Cryptpad.alert(Messages.login_noSuchUser);
                                });
                                break;
                            case 'INVAL_USER':
                                Cryptpad.removeLoadingScreen(function () {
                                    Cryptpad.alert(Messages.login_invalUser);
                                });
                                break;
                            case 'INVAL_PASS':
                                Cryptpad.removeLoadingScreen(function () {
                                    Cryptpad.alert(Messages.login_invalPass);
                                });
                                break;
                            default: // UNHANDLED ERROR
                                Cryptpad.errorLoadingScreen(Messages.login_unhandledError);
                        }
                    });
                });
            }, 0);
        });
        /* End Log in UI */

        var addButtonHandlers = function () {
            $('button.register').click(function (e) {
                var username = $('#name').val();
                var passwd = $('#password').val();
                var remember = $('#rememberme').is(':checked');
                sessionStorage.login_user = username;
                sessionStorage.login_pass = passwd;
                document.location.href = '/register/';
            });
            $('button.gotodrive').click(function (e) {
                document.location.href = '/drive/';
            });
        };

        displayCreateButtons();

        addButtonHandlers();
        console.log("ready");
    });
});

