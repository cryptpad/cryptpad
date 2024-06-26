// SPDX-FileCopyrightText: 2024 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/common/inner/sidebar-layout.js',
    '/customize/messages.js',
    '/customize/application_config.js',
    '/common/hyperscript.js',
    '/common/common-interface.js',
    '/common/common-util.js',
    '/common/common-ui-elements.js',
    '/common/pad-types.js',
    '/components/nthen/index.js',

    'css!/components/bootstrap/dist/css/bootstrap.min.css',
    'css!/components/components-font-awesome/css/font-awesome.min.css',

], function(
    $,
    Sidebar,
    Messages,
    AppConfig,
    h,
    UI,
    Util,
    UIElements,
    PadTypes,
    nThen
) {

    let pages = [];
    const gotoPage = function (Env, page) {
        if (typeof(page) !== "number" || !page) { page = 0; }
        if (page > (pages.length - 1)) { page = pages.length - 1; }

        var nextPageFunction = pages[page];
        var nextPageForm = nextPageFunction(Env);
        let frame = h('div.cp-onboarding-box', nextPageForm);
        Env.overlay.empty().append(frame);
    };
    const blocks = Sidebar.blocks('admin');

    var flushCache = (Env, cb) => {
        const { sendAdminRpc } = Env;
        sendAdminRpc('FLUSH_CACHE', {}, function (e, response) {
            if (e || response.error) {
                console.error(e || response.error);
            }
            cb();
        });
    };

    var selections = {
        title: '',
        description: '',
        logoURL: '',
        color: '',
        appsToDisable: [],
        mfa: false,
        closeRegistration: false
    };

    const saveAndRedirect = (Env) => {
        const { sendAdminDecree, sendAdminRpc } = Env;

        let hasError = false;
        let error = () => {
            hasError = true;
        };
        nThen(waitFor => {
            var name = selections.title;
            if (!name) { return; }
            sendAdminDecree('SET_INSTANCE_NAME', [name], waitFor((e, response) => {
                if (e || response.error) {
                    console.error(e || response.error);
                    return void error();
                }
            }));
        }).nThen(waitFor => {
            var description = selections.description;
            if (!description) { return; }
            sendAdminDecree('SET_INSTANCE_DESCRIPTION', [
                description
            ], waitFor((e, response) => {
                if (e || response.error) {
                    console.error(e || response.error);
                    return void error();
                }

            }));
        }).nThen(waitFor => {
            var dataURL = selections.logoURL;
            if (!dataURL) { return; }
            sendAdminRpc('UPLOAD_LOGO', {dataURL}, waitFor(function (e, response) {
                if (e || response.error) {
                    console.error(e || response.error);
                    return void error();
                }
            }));
        }).nThen(waitFor => {
            var color = selections.color;
            if (!color) { return; }
            sendAdminRpc('CHANGE_COLOR', {color}, waitFor(function (e, response) {
                if (e || response.error) {
                    console.error(e || response.error);
                    return void error();
                }
            }));
        }).nThen(waitFor => {
            var apps = selections.appsToDisable;
            if (!apps.length) { return; }
            sendAdminDecree('DISABLE_APPS', apps, waitFor(function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    return;
                }
            }));
        }).nThen(waitFor => {
            if (!selections.mfa) { return; }
            sendAdminDecree('ENFORCE_MFA', [selections.mfa], waitFor((e, response) => {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    return;
                }
            }));
        }).nThen(waitFor => {
            if (!selections.closeRegistration) { return; }
            sendAdminDecree('RESTRICT_REGISTRATION', [
                selections.closeRegistration
            ], waitFor(function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    return;
                }
            }));
        }).nThen(() => {
            flushCache(Env, function () {
                if (hasError) {
                    UI.alert(Messages.onboarding_save_error, function () {
                        document.location.href = '/drive/';
                    });
                    return;
                }
                document.location.href = '/drive/';
            });
        });
    };

    const titleConfig = function (Env) {
        let titleInput = blocks.input({
            type: 'text',
            value:  selections.title,
            placeholder: Messages.admin_onboardingNamePlaceholder,
            'aria-labelledby': 'cp-admin-name'
        });
        let description = blocks.textarea({
            placeholder: Messages.admin_onboardingDescPlaceholder,
            'aria-labelledby': 'cp-admin-description'
        }, selections.description);
        $(description).addClass('cp-onboardscreen-desc');

        let dataURL = selections.logoURL;
        var getLogoBlock = function() {
            let inputLogo = blocks.input({
                type: 'file',
                accept: 'image/*',
                'aria-labelledby': 'cp-admin-logo'
            });

            var currentContainer = blocks.block([], 'cp-admin-customize-logo');

            var upload = blocks.button('secondary', '', Messages.onboarding_upload);

            let formLogo = blocks.form([
                currentContainer,
                blocks.block(inputLogo, 'cp-onboarding-logo-input'),
                blocks.nav([upload])
            ]);

            let $button = $(upload);

            let state = false;
            let redraw = () => {
                var current = h('img', {src: dataURL || '/api/logo?'+(+new Date())});
                $(currentContainer).empty().append(current);
                $button.removeAttr('disabled');
                state = !!dataURL;
                if (dataURL) {
                    $button.text(Messages.admin_logoRemoveButton);
                    $button.removeClass('btn-secondary').addClass('btn-danger-alt');
                } else {
                    $button.text(Messages.onboarding_upload);
                    $button.removeClass('btn-danger-alt').addClass('btn-secondary');
                }
            };
            redraw();

            let $input = $(inputLogo);
            $input.on('change', function () {
                let files = inputLogo.files;
                if (files.length !== 1) {
                    UI.warn(Messages.error);
                    return;
                }
                let reader = new FileReader();
                reader.onloadend = function () {
                    dataURL = this.result;
                    redraw(dataURL);
                };
                reader.readAsDataURL(files[0]);
            });
            Util.onClickEnter($button, function () {
                $button.attr('disabled', 'disabled');
                if (!state) {
                    return void $input.click();
                }
                dataURL = '';
                redraw();
            });

            return formLogo;
        };

        var getColorBlock = function () {

            // Number of accent color presets
            var colors = UIElements.makePalette(4, (color, $color) => {
                let rgb = $color.css('background-color');
                let hex = Util.rgbToHex(rgb);
                if (hex) {
                    selections.color = color ? hex : '';
                    selections.colorId = color;
                }
            });
            if (selections.colorId) {
                colors.setValue(selections.colorId);
            }
            var content = h('div.cp-onboardscreen-colorpick', [
                h('label', {for:'cp-install-color'}, Messages.kanban_color),
                colors
            ]);

            return content;
        };

        var button = blocks.activeButton('primary', '', Messages.continue, function () {
            selections.title = $(titleInput).val() || '';
            selections.description = $(description).val() || '';
            if (dataURL) {
                selections.logoURL = dataURL;
            }

            gotoPage(Env, 1);
        });

        var titleBlock = h('div.cp-onboardscreen-name', titleInput);
        var descriptionBlock = h('div', description);
        var logoBlock = h('div.cp-onboardscreen-logo', getLogoBlock());
        var colorBlock =  h('div.cp-onboardscreen-color', getColorBlock());

        var screenTitle = h('div.cp-onboardscreen-screentitle');
        $(screenTitle).append(('div.cp-onboardscreen-maintitle', [
            h('h1.cp-onboardscreen-title', Messages.admin_onboardingNameTitle),
            h('span', Messages.admin_onboardingNameHint)
        ]));
        var nav = blocks.nav([h('span'), button]);

        $(button).addClass('cp-onboardscreen-save');
        $(nav).addClass('cp-onboardscreen-nav');

        var textForm = h('div.cp-instance-text-form', [
            titleBlock,
            descriptionBlock,
            colorBlock,
        ]);

        var instanceForm = h('div.cp-instance-form', [logoBlock, textForm]);

        var form = blocks.form([
            screenTitle,
            instanceForm
        ], nav);

        $(form).addClass('cp-onboardscreen-form');

        return form;

    };

    const createAppsGrid = appsToDisable => {
        const grid = blocks.block([], 'cp-admin-customize-apps-grid');
        const $grid = $(grid);
        const allApps = PadTypes.appsToSelect;

        let select = function (app, $app) {
            if (appsToDisable.indexOf(app) === -1) {
                appsToDisable.push(app);
                $app.toggleClass('cp-inactive-app', true);
                $app.toggleClass('cp-active-app', false);
            } else {
                appsToDisable.splice(appsToDisable.indexOf(app), 1);
                $app.toggleClass('cp-inactive-app', false);
                $app.toggleClass('cp-active-app', true);
            }
        };

        allApps.forEach(app => {
            let name = Messages.type[app] || app;
            let icon = UI.getNewIcon(app);
            let appBlock = h('div.cp-appblock',
                {tabindex:0, role:"button"},
            [
                icon,
                h('span.cp-app-name', name),
                h('i.fa.fa-check.cp-on-enabled')
            ]);
            let $app = $(appBlock).appendTo($grid);
            if (appsToDisable.includes(app)) {
                $app.addClass('cp-inactive-app');
            } else {
                $app.addClass('cp-active-app');
            }
            $app.on('click', () => select(app, $app));
        });

        return grid;
    };

    const appConfig = function (Env) {
        const appsToDisable = selections.appsToDisable;
        const grid = createAppsGrid(appsToDisable);


        var save = blocks.activeButton('primary', '', Messages.continue, function () {
            gotoPage(Env, 2);
        });

        var prev = blocks.activeButton('secondary', '', Messages.form_backButton, function () {
            gotoPage(Env, 0);
        });

        var screenTitle = h('div.cp-onboardscreen-screentitle');
        $(screenTitle).append(h('div.cp-onboardscreen-maintitle', h('h1.cp-onboardscreen-title', Messages.admin_appsTitle), h('span', Messages.admin_appsHint)));
        $(save).addClass('cp-onboardscreen-save');
        $(prev).addClass('cp-onboardscreen-prev');
        var nav = blocks.nav([prev, save]);
        $(nav).addClass('cp-onboardscreen-nav');
        let form = blocks.form([
            screenTitle,
            grid
        ], nav);

        $(form).addClass('cp-onboardscreen-form');

        return form;
    };

    const mfaRegistrationScreen = function (Env) {
        var restrict = blocks.activeCheckbox({
            key: 'registration',
            getState: function () {
                return selections.closeRegistration;
            },
            label: 'registration',
            query: function (val, setState) {
                selections.closeRegistration = val;
                setState(val);
            },
        });

        var forceMFA = blocks.activeCheckbox({
            key: 'forcemfa',
            getState: function () {
                return selections.mfa;
            },
            label: 'forcemfa',
            query: function (val, setState) {
                selections.mfa = val;
                setState(val);
            },
        });


        let mfaOption = h('div.cp-optionblock', [
            forceMFA,
            h('span.cp-option-hint', Messages.admin_forcemfaHint)
        ]);
        let registrationOption = h('div.cp-optionblock', [
            restrict,
            h('span.cp-option-hint', Messages.admin_registrationHint)
        ]);
        const grid = blocks.block([
            mfaOption,
            registrationOption
        ], 'cp-admin-customize-options-grid');

        var save = blocks.activeButton('primary', '', Messages.settings_save, function () {
            saveAndRedirect(Env);
        });

        var prev = blocks.activeButton('secondary', '', Messages.form_backButton, function () {
            gotoPage(Env, 1);
        });

        var screenTitle = h('div.cp-onboardscreen-screentitle');
        $(screenTitle).append(h('div.cp-onboardscreen-maintitle', h('h1.cp-onboardscreen-title', Messages.admin_onboardingOptionsTitle), h('span', Messages.admin_onboardingOptionsHint)));
        $(save).addClass('cp-onboardscreen-save');
        $(prev).addClass('cp-onboardscreen-prev');
        var nav = blocks.nav([prev, save]);
        $(nav).addClass('cp-onboardscreen-nav');

        var form = blocks.form([
            screenTitle,
            grid], nav
        );

        $(form).addClass('cp-onboardscreen-form');

        return form;
    };

    pages = [
        titleConfig,
        appConfig,
        mfaRegistrationScreen
    ];
    const create = (sendAdminDecree, sendAdminRpc) => {
        let Env = {
            sendAdminDecree,
            sendAdminRpc
        };
        Env.overlay = $(h('div#cp-onboarding'));
        gotoPage(Env, 0);
        $('body').append(Env.overlay);
    };

    // XXX test functions to remove
    window.CP_onboarding_test = () => {
        create(() => {}, () => {});
    };
    window.CP_onboarding_test_full = () => {
        require([
            '/common/cryptpad-common.js',
            '/common/outer/local-store.js',
            '/common/outer/login-block.js',
            '/common/rpc.js',
            '/common/common-constants.js',
            '/common/cryptget.js',
        ], function (CryptPad, LocalStore, Block, Rpc, Constants, CryptGet) {
            var blockHash = LocalStore.getBlockHash();
            if (!blockHash) { return void console.error('NOT LOGGED IN'); }
            var parsed = Block.parseBlockHash(blockHash);
            var sessionToken = LocalStore.getSessionToken() || undefined;
            let userHash;
            nThen(w => {
                // Get user keys
                Util.getBlock(parsed.href, {
                    bearer: sessionToken
                }, w((err, response) => {
                    if (err) {
                        w.abort();
                        return void console.error('Please login in and try again');
                    }
                    response.arrayBuffer().then(w(arraybuffer => {
                        arraybuffer = new Uint8Array(arraybuffer);
                        var block_info = Block.decrypt(arraybuffer, parsed.keys);
                        userHash = block_info[Constants.userHashKey];
                    }));
                }));
            }).nThen(() => {
                // Make RPC
                if (!userHash) { return void console.error('AUTH FAILED'); }
                CryptPad.makeNetwork((err, network) => {
                    if (err) { return void console.error(err); }
                    CryptGet.get(userHash, (err, val) => {
                        let p = Util.tryParse(val);
                        Rpc.create(network, p.edPrivate, p.edPublic, function (e, rpc) {
                            let sendAdminDecree = function (command, data, callback) {
                                var params = ['ADMIN_DECREE', [command, data]];
                                rpc.send('ADMIN', params, callback);
                            };

                            let sendAdminRpc = function (command, data, callback) {
                                var params = [command, data];
                                rpc.send('ADMIN', params, callback);
                            };

                            create(sendAdminDecree, sendAdminRpc);
                        });
                    }, {network: network});
                });
            });
        });
    };
    return { create, createAppsGrid };

});

