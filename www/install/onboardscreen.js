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
    PadTypes
) {

    //XXX
    Messages.onboarding_upload = "Select logo";
    Messages.admin_onboardingNameTitle = 'Welcome to your CryptPad instance';
    Messages.admin_onboardingNameHint = 'Please choose a title and description';
    Messages.admin_onboardingAppsTitle = "Choose your applications";
    Messages.admin_onboardingAppsHint = "Choose which apps to disable on your instance";
    Messages.admin_onboardingRegistrationTitle = "Options";
    Messages.admin_onboardingRegistrationHint = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In id tristique justo";
    Messages.admin_onboardingRegistration = "Visitors to the instance are not able to create accounts. Invitations can be created by administrators";
    Messages.admin_onboardingMfa = "All accounts on the instance have to use 2-factor authentication";
    Messages.admin_onboardingNamePlaceholder = 'Instance title';
    Messages.admin_onboardingDescPlaceholder = 'Placeholder description text';

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

    //TODO: fix EXPECTED_FUNCTION error
    var flushCache = () => {
            console.log('flushcashe');
            // sendAdminDecree('FLUSH_CACHE', function (e, response) {
            //     if (e || response.error) {
            //         UI.warn(Messages.error);
            //         console.error(e, response);
            //         return;
            //     }

            // })
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

    const titleConfig = function (Env) {
        const { sendAdminDecree, sendAdminRpc } = Env;

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

            // XXX Number of accent color presets
            var colors = UIElements.makePalette(5, (color, $color) => {
                let rgb = $color.css('background-color');
                let hex = Util.rgbToHex(rgb);
                if (hex) {
                    selections.color = hex;
                    selections.colorId = color;
                }
            });
            if (selections.colorId) {
                colors.setValue(selections.colorId);
            }
            var $colors = $(colors).attr('id', 'cp-install-color');
            var content = h('div.cp-onboardscreen-colorpick', [
                h('label', {for:'cp-install-color'}, Messages.kanban_color),
                colors
            ]);

            return content;
        };

        var button = blocks.activeButton('primary', '', Messages.settings_save, function (done) {
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
                var checkMark = h('i.cp-onboardscreen-checkmark.fa');
                $(checkMark).addClass('fa-check');
                appBlock.append(checkMark);
                $(`#${app}-block`).addClass('cp-active-app');
            } else {
                appsToDisable.splice(appsToDisable.indexOf(app), 1);
                $app.toggleClass('cp-inactive-app', false);
                $app.toggleClass('cp-active-app', true);
            }
        };

        allApps.forEach(app => {
            let name = Messages.type[app] || app;
            let icon = UI.getNewIcon(app);
            let appBlock = h('div.cp-appblock', [
                icon,
                h('span', name),
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
        const { sendAdminDecree, sendAdminRpc } = Env;

        const appsToDisable = selections.appsToDisable;
        const grid = createAppsGrid(appsToDisable);


        var save = blocks.activeButton('primary', '', Messages.settings_save, function (done) {
            gotoPage(Env, 2);
        });

        var prev = blocks.activeButton('primary', '', Messages.form_backButton, function () {
            gotoPage(Env, 0);
        });

        var screenTitle = h('div.cp-onboardscreen-screentitle');
        $(screenTitle).append(h('div.cp-onboardscreen-maintitle', h('h1.cp-onboardscreen-title', Messages.admin_onboardingAppsTitle), h('span', Messages.admin_onboardingAppsHint)));
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
        const { sendAdminDecree, sendAdminRpc } = Env;

        var restrict = blocks.activeCheckbox({
            key: 'registration',
            getState: function () {
                return false;
            },
            label: 'registration',
            query: function (val) {
                selections.closeRegistration = val;
            },
        });

        var forceMFA = blocks.activeCheckbox({
            key: 'forcemfa',
            getState: function () {
                return false;
            },
            label: 'forcemfa',
            query: function (val) {
                selections.mfa = val;
            },
        });

        const grid = blocks.block([], 'cp-admin-customize-options-grid');
        const options = [restrict, forceMFA];

        let mfaOption = h('div.cp-appblock.cp-inactive-app', forceMFA, h('br'), Messages.admin_onboardingMfa);
        $(grid).append(mfaOption);
        let registrationOption = h('div.cp-appblock.cp-inactive-app', restrict, h('br'), Messages.admin_onboardingRegistration);
        $(grid).append(registrationOption);

        var save = blocks.activeButton('primary', '', Messages.settings_save, function () {

            var name = selections.title;
            sendAdminDecree('SET_INSTANCE_NAME', [name], function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                    return;
                }
                UI.log(Messages.saved);

            });

            var description = selections.title;
            sendAdminDecree('SET_INSTANCE_DESCRIPTION', [description], function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                    return;
                }
                UI.log(Messages.saved);

            });

            var logoURL = selections.logoURL;
            sendAdminRpc('UPLOAD_LOGO', {logoURL}, function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                    return;
                }
            });

            var color = selections.color;
            sendAdminRpc('CHANGE_COLOR', {color}, function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                    return;
                }
            });

            var apps = selections.appsToDisable;
            sendAdminDecree('DISABLE_APPS', apps, function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                    return;
                }
            });

            sendAdminDecree('ENFORCE_MFA', [selections.mfa], function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                    return;
                }
                UI.log(Messages.saved);

            });

            sendAdminDecree('RESTRICT_REGISTRATION', [selections.closeRegistration], function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                    return;
                }
                UI.log(Messages.saved);

            });

            flushCache();

            document.location.href = '/drive/';
            return;
        });

        var prev = blocks.activeButton('primary', '', Messages.form_backButton, function () {
            gotoPage(Env, 1);
        });

        var screenTitle = h('div.cp-onboardscreen-screentitle');
        $(screenTitle).append(h('div.cp-onboardscreen-maintitle', h('h1.cp-onboardscreen-title', Messages.admin_onboardingRegistrationTitle), h('span', Messages.admin_onboardingRegistrationHint)));
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

    window.CP_onboarding_test = () => {
        create(() => {}, () => {});
    };
    return { create, createAppsGrid };

});

