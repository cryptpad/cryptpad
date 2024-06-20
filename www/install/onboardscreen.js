define([
    'jquery',
    '/common/inner/sidebar-layout.js',
    '/customize/messages.js',
    '/common/hyperscript.js',
    '/common/common-interface.js',
    '/common/common-util.js',
    '/common/common-ui-elements.js',
    '/common/pad-types.js',
    '/api/instance',

    'css!/components/bootstrap/dist/css/bootstrap.min.css',
    'css!/components/components-font-awesome/css/font-awesome.min.css',

], function(
    $,
    Sidebar,
    Messages,
    h,
    UI,
    Util,
    UIElements,
    PadTypes
) {

    //XXX
    Messages.admin_onboardingNameTitle = 'Welcome to your CryptPad instance';
    Messages.admin_onboardingNameHint = 'Please choose a title and description';
    Messages.admin_onboardingAppsTitle = "Choose your applications";
    Messages.admin_onboardingAppsHint = "Choose which apps to disable on your instance";
    Messages.admin_onboardingRegistrationTitle = "Options";
    Messages.admin_onboardingRegistrationHint = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In id tristique justo";
    Messages.admin_onboardingRegistration = "Visitors to the instance are not able to create accounts. Invitations can be created by administrators";
    Messages.admin_onboardingMfa = "All accounts on the instance have to use 2-factor authentication";
    Messages.admin_onboardingNamePlaceholder = 'Instance title'
    Messages.admin_onboardingDescPlaceholder = 'Placeholder description text'

    var OnboardScreen = {};

    var displayForm = function(sendAdminDecree, sendAdminRpc, page) {

        var pages = [OnboardScreen.appConfig, OnboardScreen.mfaRegistrationScreen, OnboardScreen.titleConfig];
        var nextPageFunction = pages[page];
        var nextPageForm = nextPageFunction(sendAdminDecree, sendAdminRpc);
        var elem = document.createElement('div');
        elem.setAttribute('id', 'cp-loading');
        let frame = h('div.configscreen', nextPageForm);
        elem.append(frame);
        var intr;
        var append = function () {
            if (!document.body) { return; }
            clearInterval(intr);
            document.body.appendChild(elem);
        };
        intr = setInterval(append, 100);
        append();
    
    };

    //TODO: fix EXPECTED_FUNCTION error
    var flushCache = () => {
            console.log('flushcashe')
            // sendAdminDecree('FLUSH_CACHE', function (e, response) {
            //     if (e || response.error) {
            //         UI.warn(Messages.error);
            //         console.error(e, response);
            //         return;
            //     }

            // })
    };

    var selections = {title: '', description: '', logoURL: '', color: '', appsToDisable: [], mfa: false, closeRegistration: false}

    OnboardScreen.titleConfig = function (sendAdminDecree, sendAdminRpc) {

        const blocks = Sidebar.blocks('admin');

        var titleDescBlock = function() {

            var input = blocks.input({
                type: 'text',
                value:  '',
                placeholder: selections.title || Messages.admin_onboardingNamePlaceholder,
                'aria-labelledby': 'cp-admin-name'
            });

            var desc =  blocks.textarea({
                placeholder: selections.description || Messages.admin_onboardingDescPlaceholder,
                value:  '',
                'aria-labelledby': 'cp-admin-description'
            });

            $(desc).addClass('cp-onboardscreen-desc');

            return [input, desc];
        };

        let dataURL = ''
        var logoBlock = function() {

            let inputLogo = blocks.input({
                type: 'file',
                accept: 'image/*',
                'aria-labelledby': 'cp-admin-logo'
            });

            var currentContainer = blocks.block([], 'cp-admin-customize-logo');
            let redraw = () => {
                var current = h('img', {src: '/api/logo?'+(+new Date())});
                $(currentContainer).empty().append(current);
            };
            redraw();

            var upload = blocks.button('primary', '', Messages.admin_logoButton);
            var remove = blocks.button('danger', '', Messages.admin_logoRemoveButton);

            let spinnerBlock = blocks.inline();
            let spinner = UI.makeSpinner($(spinnerBlock));
            let formLogo = blocks.form([
                currentContainer,
                blocks.block(inputLogo),
                blocks.nav([upload, remove, spinnerBlock])
            ]);

            let $button = $(upload);
            let $remove = $(remove);

            //TODO: update preview
            Util.onClickEnter($button, function () {
                let files = inputLogo.files;
                if (files.length !== 1) {
                    UI.warn(Messages.error);
                    return;
                }
                spinner.spin();
                $button.attr('disabled', 'disabled');
                let reader = new FileReader();
                reader.onloadend = function () {
                    dataURL = this.result;
                };
                reader.readAsDataURL(files[0]);
            });
            UI.confirmButton($remove, {
                classes: 'btn-danger',
                multiple: true
            }, function () {
                spinner.spin();
                $remove.attr('disabled', 'disabled');
                selections.logoURL = ''
            });

            return formLogo;
        };

        var colorBlock = function () {

            let selectorColor = '';
            // XXX Number of accent color presets
            var colors = UIElements.makePalette(5, (color, $color) => {
                let rgb = $color.css('background-color');
                let hex = Util.rgbToHex(rgb);
                selectorColor = hex;
                if (hex) {
                    selections.color = hex
                }
            });
            var $colors = $(colors).attr('id', 'cp-install-color');
            var content = h('div.cp-onboardscreen-colorpick', [
                h('label', {for:'cp-install-color'}, Messages.kanban_color),
                colors
            ]);

            return content;
        };

        var button = blocks.activeButton('primary', '', Messages.settings_save, function (done) {
            if ($($(titleInput).children()[0]).val() !== '') {
                selections.title = $($(titleInput).children()[0]).val()
            }
            if ($($(desc).children()[0]).val() !== '') {
                selections.description = $($(desc).children()[0]).val()
            } 
            if (dataURL) {
                selections.logoURL = dataURL
            } 

            displayForm(sendAdminDecree, sendAdminRpc, 0);
        });

        var titleInput = h('div.cp-onboardscreen-name', titleDescBlock()[0]);
        var logoInput = h('div.cp-onboardscreen-logo', logoBlock());
        var desc = h('div', titleDescBlock()[1]);
        var colorInput =  h('div.cp-onboardscreen-color', colorBlock());

        var screenTitle = h('div.cp-onboardscreen-screentitle');
        $(screenTitle).append(h('div.cp-onboardscreen-maintitle', h('h1.cp-onboardscreen-title', Messages.install_onboardingNameTitle), h('span', Messages.install_onboardingNameHint)));
        var nav = blocks.nav([button]);

        $(button).addClass('cp-onboardscreen-save');
        $(nav).addClass('cp-onboardscreen-nav')

        var textForm= h('div.cp-instance-text-form',[
            titleInput,
            desc,
            colorInput,
        ]);

        var instanceForm = h('div.cp-instance-form', [logoInput, textForm]);

        var form = blocks.form([
            screenTitle,
            instanceForm
        ], nav);

        $(form).addClass('cp-onboardscreen-form');

        return form;

    };

    OnboardScreen.appConfig = function (sendAdminDecree, sendAdminRpc) {

        const blocks = Sidebar.blocks('admin');
        const grid = blocks.block([], 'cp-admin-customize-apps-grid');
        const allApps = PadTypes.appsToSelect;
        const appsToDisable = [];
            
        function select(app, appBlock) {
            if (appsToDisable.indexOf(app) === -1) {
                appsToDisable.push(app);
                var checkMark = h('div.cp-onboardscreen-checkmark');
                $(checkMark).addClass('fa-check');
                appBlock.append(checkMark);
                $(`#${app}-block`).addClass('cp-active-app') 
            } else {
                appsToDisable.splice(appsToDisable.indexOf(app), 1);
                $(`#${app}-block`).addClass('cp-inactive-app') 
                appBlock.find('.cp-onboardscreen-checkmark').remove();
            } 
        }

        allApps.forEach(app => { 
            let appBlock = h('div.cp-appblock.cp-inactive-app', {id: `${app.toString()}-block`}, app.charAt(0).toUpperCase() + app.slice(1))
            $(grid).append(appBlock);
            $(appBlock).on('click', () => select(app, $(appBlock)));
        }); 

        var save = blocks.activeButton('primary', '', Messages.settings_save, function (done) {
            selections.appsToDisable = appsToDisable
            UI.log(Messages.saved);
            displayForm(sendAdminDecree, sendAdminRpc, 1)
        });

        var prev = blocks.activeButton('primary', '', Messages.form_backButton, function () {
            displayForm(sendAdminDecree, sendAdminRpc, 2);
        });

        var screenTitle = h('div.cp-onboardscreen-screentitle');
        $(screenTitle).append(h('div.cp-onboardscreen-maintitle', h('h1.cp-onboardscreen-title', Messages.install_onboardingAppsTitle), h('span', Messages.install_onboardingAppsHint)))
        $(save).addClass('cp-onboardscreen-save');
        $(prev).addClass('cp-onboardscreen-prev');
        var nav = blocks.nav([prev, save])
        $(nav).addClass('cp-onboardscreen-nav');
        let form = blocks.form([
            screenTitle,
            grid 
        ], nav);

        $(form).addClass('cp-onboardscreen-form');
        
        return form;
    }    

    OnboardScreen.mfaRegistrationScreen = function(sendAdminDecree, sendAdminRpc) {
        const blocks = Sidebar.blocks('admin');

        var restrict = blocks.activeCheckbox({
            key: 'registration',
            getState: function () {
                return false;
            },
            label: 'registration',
            query: function (val) {
                selections.closeRegistration = val
            },
        });

        var forceMFA = blocks.activeCheckbox({
            key: 'forcemfa',
            getState: function () {
                return false;
            },
            label: 'forcemfa',
            query: function (val) {
                selections.mfa = val
            },
        });

        const grid = blocks.block([], 'cp-admin-customize-options-grid');
        const options = [restrict, forceMFA];

        let mfaOption = h('div.cp-appblock.cp-inactive-app', forceMFA, h('br'), Messages.admin_onboardingMfa);
        $(grid).append(mfaOption);
        let registrationOption = h('div.cp-appblock.cp-inactive-app', restrict, h('br'), Messages.admin_onboardingRegistration);
        $(grid).append(registrationOption);

        var save = blocks.activeButton('primary', '', Messages.settings_save, function () {

            var name = selections.title
            sendAdminDecree('SET_INSTANCE_NAME', [name], function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                    return;
                }
                UI.log(Messages.saved);

            })

            var description = selections.title
            sendAdminDecree('SET_INSTANCE_DESCRIPTION', [description], function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                    return;
                }
                UI.log(Messages.saved);

            })
            
            var logoURL = selections.logoURL
            sendAdminRpc('UPLOAD_LOGO', {logoURL}, function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                    return;
                }
            });

            var color = selections.color
            sendAdminRpc('CHANGE_COLOR', {color}, function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                    return;
                }
            });

            var apps = selections.appsToDisable
            sendAdminDecree('DISABLE_APPS', apps, function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                    return;
                }
            })

            sendAdminDecree('ENFORCE_MFA', [selections.mfa], function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    console.error(e, response);
                    return;
                }
                UI.log(Messages.saved);

            })

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
            displayForm(sendAdminDecree, sendAdminRpc, 0);
        });

        var screenTitle = h('div.cp-onboardscreen-screentitle');
        $(screenTitle).append(h('div.cp-onboardscreen-maintitle', h('h1.cp-onboardscreen-title', Messages.install_onboardingRegistrationTitle), h('span', Messages.install_onboardingRegistrationHint)));
        $(save).addClass('cp-onboardscreen-save');
        $(prev).addClass('cp-onboardscreen-prev');
        var nav = blocks.nav([prev, save])
        $(nav).addClass('cp-onboardscreen-nav');

        var form = blocks.form([
            screenTitle,
            grid], nav
        );

        $(form).addClass('cp-onboardscreen-form');

        return form;
    
    };

    return OnboardScreen;

});

