define([
    'jquery',
    '/common/inner/sidebar-layout.js',
    '/customize/messages.js',
    '/common/hyperscript.js',
    '/common/common-interface.js',
    '/common/common-util.js',
    '/api/instance',

    '/common/hyperscript.js',
    'css!/components/bootstrap/dist/css/bootstrap.min.css',
    'css!/components/components-font-awesome/css/font-awesome.min.css',

    // 'less!/admin/app-admin.less',
    // 'css!/install/configscreen.css'
], function(
    $,
    Sidebar,
    Messages,
    h,
    UI,
    Util,
) {

    //XXX
    Messages.admin_onboardingNameTitle = 'Welcome to your CryptPad instance';
    Messages.admin_onboardingNameHint = 'Please choose a title and description';
    Messages.admin_onboardingAppsTitle = "Choose your applications";
    Messages.admin_onboardingAppsHint = "Choose which apps are available to users on your instance";
    Messages.admin_onboardingRegistrationTitle = "Options";
    Messages.admin_onboardingRegistrationHint = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In id tristique justo";
    Messages.admin_onboardingRegistration = "Visitors to the instance are not able to create accounts. Invitations can be created by administrators";
    Messages.admin_onboardingRegistration = "All accounts on the instance have to use 2-factor authentication";

    var AppConfigScreen = {};
    const blocks = Sidebar.blocks;

    var displayForm = function(sendAdminDecree, page) {

        var pages = [AppConfigScreen.appConfig, AppConfigScreen.mfaRegistrationScreen, AppConfigScreen.titleConfig];
        var nextPageFunction = pages[page];
        var nextPageForm = nextPageFunction(sendAdminDecree);
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

    AppConfigScreen.titleConfig = function (sendAdminDecree, sendAdminRpc) {

        const blocks = Sidebar.blocks;

        var titleDescBlock = function() {

            var input = blocks.input({
                type: 'text',
                value:  '',
                placeholder: 'Instance title',
                'aria-labelledby': 'cp-admin-name'
            });

            var desc =  blocks.textarea({
                placeholder: 'Placeholder description text',
                value:  '',
                'aria-labelledby': 'cp-admin-description'
            });

            $(desc).addClass('cp-onboardscreen-desc');

            return [input, desc];
        };

        var logoBlock = function() {

            let inputLogo = blocks.input({
                type: 'file',
                accept: 'image/*',
                'aria-labelledby': 'cp-admin-logo'
            });

            var currentContainer = blocks.block([], 'cp-admin-customize-logo');
            let redraw = () => {
                var current = h('img', {src: '/api/logo?'+(+new Date())});
                $(current).css({'max-width':'30px'});
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
                    let dataURL = this.result;
                    sendAdminRpc('UPLOAD_LOGO', {dataURL}, function (e, response) {
                        $button.removeAttr('disabled');
                        if (e || response.error) {
                            UI.warn(Messages.error);
                            $(inputLogo).val('');
                            console.error(e, response);
                            // done(false);
                            return;
                        }
                        // flushCache();
                        // done(true);
                        redraw();
                        spinner.done();
                        UI.log(Messages.saved);
                    });

                };
                reader.readAsDataURL(files[0]);
            });
            UI.confirmButton($remove, {
                classes: 'btn-danger',
                multiple: true
            }, function () {
                spinner.spin();
                $remove.attr('disabled', 'disabled');

                sendAdminRpc('REMOVE_LOGO', {dataURL}, function (e, response) {
                    $remove.removeAttr('disabled');
                    if (err) {
                        UI.warn(Messages.error);
                        console.error(err, response);
                        spinner.hide();
                        return;
                    }
                    redraw();
                    spinner.done();
                    UI.log(Messages.saved);
                });
            });

            return formLogo;
        
        };

        var colorBlock = function () {

            var colors;
            var content = h('div', [
                h('label', {for:'cp-kanban-edit-color'}, Messages.kanban_color),
                colors = h('div#cp-kanban-edit-colors'),
            ], {style: 'padding-left:50%'});

            var $colors = $(colors);
            var palette = [''];
            for (var i=1; i<=8; i++) { palette.push('color'+i); }
            var selectedColor = '';
            palette.forEach(function (color) {
                var $color = $(h('div.cp-kanban-palette.cp-kanban-palette-card.fa'), );
                $color.css({'width':'30px', 'height':'30px', 'display': 'inline-block', 'border-radius': '50%', 'text-align': 'center', 'line-height': '30px', 'margin-right':'1%'})
                $color.addClass('cp-kanban-palette-'+(color || 'nocolor'));
                $color.click(function () {
                    if (color === selectedColor) { return; }
                    selectedColor = $color.css('background-color');
                    $colors.find('.cp-kanban-palette').removeClass('fa-check');
                    var $col = $colors.find('.cp-kanban-palette-'+(color || 'nocolor'));
                    $col.addClass('fa-check');
                    sendAdminRpc('CHANGE_COLOR', {selectedColor}, function (e, response) {
                        if (e || response.error) {
                            UI.warn(Messages.error);
                            console.error(e, response);
                            // done(false);
                            return;
                        }
                        // flushCache();
                        // done(true);
                        // redraw();
                        // spinner.done();
                        UI.log(Messages.saved);
                    });
                }).appendTo($colors);
            });
        
            return content;
        
        };

        var button = blocks.activeButton('primary', '', Messages.settings_save, function (done) {

            // sendAdminDecree('SET_INSTANCE_NAME', [$(titleInput).val().trim()], function (e, response) {
            //     if (e || response.error) {
            //         UI.warn(Messages.error);
            //         $input.val('');
            //         console.error(e, response);
            //         done(false);
            //         return;
            //     }
            //     // flushCache();
            //     done(true);
            //     UI.log(Messages.saved);

            // })
            // sendAdminDecree('SET_INSTANCE_DESCRIPTION', [$(descriptionInput).val().trim()], function (e, response) {
            //     if (e || response.error) {
            //         UI.warn(Messages.error);
            //         $input.val('');
            //         console.error(e, response);
            //         done(false);
            //         return;
            //     }
            //     // flushCache();
            //     done(true);
            //     UI.log(Messages.saved);

            // })

            displayForm(sendAdminDecree, 0);
        });

        var titleInput = h('div.cp-onboardscreen-name', titleDescBlock()[0]);
        var logoInput = h('div.cp-onboardscreen-logo', logoBlock());
        var desc = h('div', titleDescBlock()[1]);
        var colorInput =  h('div.cp-onboardscreen-color', colorBlock());

        var screenTitle = h('div.cp-onboardscreen-screentitle');
        $(screenTitle).append(h('div.cp-onboardscreen-maintitle', h('span.cp-onboardscreen-title', Messages.admin_onboardingNameTitle), h('br'), h('span', Messages.admin_onboardingNameHint)));
        var nav = blocks.nav([button]);
        $(nav).addClass('cp-onboardscreen-save');
 
        var form = blocks.form([
            screenTitle, 
            titleInput, 
            desc,
            logoInput, 
            colorInput,
        ], nav);

        $(form).addClass('cp-onboardscreen-form');

        return form;

    };

    AppConfigScreen.mfaRegistrationScreen = function(sendAdminDecree) {

        var restrict = blocks.activeCheckbox({
            key: 'registration',
            getState: function () {
                return false;
            },
            query: function (val, setState) {
                sendAdminDecree('RESTRICT_REGISTRATION', [val], function (e, response) {
                    // if (e || response.error) {
                    //     UI.warn(Messages.error);
                    //     $input.val('');
                    //     console.error(e, response);
                    //     done(false);
                    //     return;
                    // }
                    // // flushCache();
                    // // done(true);
                    // UI.log(Messages.saved);

                });
            },
        });

        var forceMFA = blocks.activeCheckbox({
            key: 'forcemfa',
            getState: function () {
                return false;
            },
            query: function (val, setState) {
                // sendAdminDecree('ENFORCE_MFA', [val], function (e, response) {
                //     if (e || response.error) {
                //         UI.warn(Messages.error);
                //         $input.val('');
                //         console.error(e, response);
                //         done(false);
                //         return;
                //     }
                //     // flushCache();
                //     done(true);
                //     UI.log(Messages.saved);

                // })
            },
        });

        const grid = blocks.block([], 'cp-admin-customize-apps-grid');
        const options = [restrict, forceMFA];

        options.forEach(app => { 
            let optionBlock = h('div.cp-appblock', {class: 'inactive-app', id: `${app}-block`}, app);
            $(grid).append(optionBlock);
        }); 

        var save = blocks.activeButton('primary', '', Messages.settings_save, function () {
            document.location.href = '/drive/';
            return;
        });

        var prev = blocks.activeButton('primary', '', Messages.settings_prev, function () {
            displayForm(sendAdminDecree, 0);
        });

        var screenTitle = h('div.cp-onboardscreen-screentitle');
        $(screenTitle).append(h('div.cp-onboardscreen-maintitle', h('span.cp-onboardscreen-title', Messages.admin_onboardingRegistrationTitle), h('br'), h('span', Messages.admin_onboardingRegistrationHint)));
        var nav = blocks.nav([prev, save]);
        $(nav).addClass('cp-onboardscreen-save');

        var form = blocks.form([
            screenTitle,
            grid], 
        );

        $(form).addClass('cp-onboardscreen-form');

        return form;
    
    };


    AppConfigScreen.appConfig = function (sendAdminDecree) {

        const blocks = Sidebar.blocks;
        const grid = blocks.block([], 'cp-admin-customize-apps-grid');
        const allApps = ['pad', 'code', 'kanban', 'slide', 'sheet', 'form', 'whiteboard', 'diagram'];
        const availableApps = [];
            
        function select(app, appBlock) {
            if (availableApps.indexOf(app) === -1) {
                availableApps.push(app);
                var checkMark = h('div.cp-onboardscreen-checkmark', "V", {style:'color:white'});
                appBlock.append(checkMark);
                $(`#${app}-block`).attr('class', 'active-app') 
            } else {
                availableApps.splice(availableApps.indexOf(app), 1);
                $(`#${app}-block`).attr('class', 'inactive-app');
                appBlock.remove('.cp-onboardscreen-checkmark');
            } 
        }

        allApps.forEach(app => { 
            let appBlock = h('div.cp-bloop', {style: 'width:50%;height:20px;'}, {class: 'inactive-app', id: `${app}-block`}, app.charAt(0).toUpperCase() + app.slice(1))
            $(appBlock).addClass('cp-app-drive-element-grid')
            $(appBlock).addClass('cp-app-drive-element-row')

            $(grid).append(appBlock);
            $(appBlock).on('click', () => select(app, $(appBlock)));
        }); 

        var save = blocks.activeButton('primary', '', Messages.settings_save, function (done) {
            // sendAdminDecree('DISABLE_APPS', availableApps, function (e, response) {
            //     if (e || response.error) {
            //         UI.warn(Messages.error);
            //         $input.val('');
            //         console.error(e, response);
            //         done(false);
            //         return;
            //     }
            //     // flushCache();
            //     done(true);
            //     UI.log(Messages.saved);

            // })
            
            UI.log(Messages.saved);
            displayForm(sendAdminDecree, 1)
        });

        var prev = blocks.activeButton('primary', '', Messages.form_backButton, function () {
            displayForm(sendAdminDecree, 2);
        });

        var screenTitle = h('div.cp-onboardscreen-screentitle');
        $(screenTitle).append(h('div.cp-onboardscreen-maintitle', h('span.cp-onboardscreen-title', Messages.admin_onboardingAppsTitle), h('br'), h('span', Messages.admin_onboardingAppsHint)))
        var nav = blocks.nav([prev, save]);
        $(nav).addClass('cp-onboardscreen-save');  
        
        let form = blocks.form([
            screenTitle,
            grid 
        ], nav);

        $(form).addClass('cp-onboardscreen-form');
        
        return form;
    }    

    return AppConfigScreen;

});

