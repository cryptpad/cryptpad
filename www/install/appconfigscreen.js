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
    'less!/admin/app-admin.less',
    'css!/install/configscreen.css'
], function(
    $,
    Sidebar,
    Messages,
    h,
    UI,
    Util,
    Instance

) {

    //XXX
    Messages.admin_onboardingTitle = 'Welcome to your CryptPad instance'
    Messages.admin_onboardingDesc = 'Please choose a title and description'

    Messages.admin_appSelection = 'App configuration saved'
    Messages.admin_appsTitle = "Choose your applications"
    Messages.admin_appsHint = "Choose which apps are available to users on your instance."
    Messages.admin_cat_apps = "Apps"

    var AppConfigScreen = {};
    const blocks = Sidebar.blocks;

    AppConfigScreen.titleConfig = function (sendAdminDecree) {

        const blocks = Sidebar.blocks;

        var titleDescBlock = function() {

            var input = blocks.input({
                type: 'text',
                value:  '',
                placeholder: 'Instance title',
                'aria-labelledby': 'cp-admin-name'
            });
            var textarea = blocks.textarea({
                placeholder: 'Placeholder description text',
                value:  '',
                'aria-labelledby': 'cp-admin-description'
            });

            return [input, textarea]
        }

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
                    console.log(dataURL, 'dataulr')
                    sendAdminDecree('UPLOAD_LOGO', {dataURL}, function (e, response) {
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
                    })

                };
                reader.readAsDataURL(files[0]);
            });
            UI.confirmButton($remove, {
                classes: 'btn-danger',
                multiple: true
            }, function () {
                spinner.spin();
                $remove.attr('disabled', 'disabled');
                
                sendAdminDecree('REMOVE_LOGO', {}, function (e, response) {
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

            return formLogo
        
        }


        // var colorText = Messages.admin_colorTitle

        // let inputColor = blocks.input({
        //     type: 'color',
        //     value: (Instance && Instance.color) || '#0087FF'
        // });
        // let label = blocks.labelledInput(Messages.admin_colorPick, inputColor);
        // let current = blocks.block([], 'cp-admin-color-current');
        // let labelCurrent = blocks.labelledInput(Messages.admin_colorCurrent, current);
        // let preview = blocks.block([
        //     blocks.block([
        //         blocks.link('CryptPad', '/admin/#customize'),
        //         blocks.button('primary', 'fa-floppy-o', Messages.settings_save),
        //         blocks.button('secondary', 'fa-floppy-o', Messages.settings_save)
        //     ], 'cp-admin-color-preview-dark cp-sidebar-flex-block'),
        //     blocks.block([
        //         blocks.link('CryptPad', '/admin/#customize'),
        //         blocks.button('primary', 'fa-floppy-o', Messages.settings_save),
        //         blocks.button('secondary', 'fa-floppy-o', Messages.settings_save)
        //     ], 'cp-admin-color-preview-light cp-sidebar-flex-block')
        // ], 'cp-admin-color-preview');
        // let labelPreview = blocks.labelledInput(Messages.admin_colorPreview, preview);
        // let $preview = $(preview);

        // let removeColor = blocks.button('danger', '', Messages.admin_logoRemoveButton);
        // let $removeColor = $(removeColor);

        // let setColor = (color, done) => {
        //     sendAdminDecree('CHANGE_COLOR', {color}, function (e, response) {
        //         if (err) {
        //             UI.warn(Messages.error);
        //             console.error(err, response);
        //             done(false);
        //             return;
        //         }
        //         done(true);
        //         UI.log(Messages.saved);
        //     });
        // };

        // //color picker
        // let $inputColor = $(inputColor).on('change', () => {
        //     require(['/lib/less.min.js'], (Less) => {
        //         let color = $inputColor.val();
        //         let lColor = Less.color(color.slice(1));
        //         let lighten = Less.functions.functionRegistry._data.lighten;
        //         let lightColor = lighten(lColor, {value:30}).toRGB();
        //         $preview.find('.btn-primary').css({
        //             'background-color': color
        //         });
        //         $preview.find('.cp-admin-color-preview-dark .btn-secondary').css({
        //             'border-color': lightColor,
        //             'color': lightColor,
        //         });
        //         $preview.find('.cp-admin-color-preview-light .btn-secondary').css({
        //             'border-color': color,
        //             'color': color,
        //         });
        //         $preview.find('.cp-admin-color-preview-dark a').attr('style', `color: ${lightColor} !important`);
        //         $preview.find('.cp-admin-color-preview-light a').attr('style', `color: ${color} !important`);
        //     });
        // });

        // remove color
        // UI.confirmButton($removeColor, {
        //     classes: 'btn-danger',
        //     multiple: true
        // }, function () {
        //     $removeColor.attr('disabled', 'disabled');
        //     setColor('', () => {});
        // });

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
            //     UI.log(Messages._getKey('ui_saved', [Messages.admin_appSelection]));

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
            //     UI.log(Messages._getKey('ui_saved', [Messages.admin_appSelection]));

            // })


            // sendAdminDecree('CHANGE_COLOR', {colorPick}, function (e, response) {
            //     if (e || response.error) {
            //         UI.warn(Messages.error);
            //         console.error(e, response);
            //         done(false);
            //         return;
            //     }
            //     done(true);
            //     UI.log(Messages.saved);
            // });

            var nextPageForm = AppConfigScreen.appConfig(sendAdminDecree)
            var elem = document.createElement('div');
            elem.setAttribute('id', 'cp-loading');
            let frame = h('div.configscreen', nextPageForm)
            elem.append(frame)

            built = true;
            var intr;
            var append = function () {
                if (!document.body) { return; }
                clearInterval(intr);
                document.body.appendChild(elem);
            };
            intr = setInterval(append, 100);
            append();
        });

        var titleInput = h('div.cp-onboardscreen-name', titleDescBlock()[0])
        var logoInput = h('div.cp-onboardscreen-logo', logoBlock())
        console.log(titleInput)
        var descriptionInput = h('div.cp-onboardscreen-description', titleDescBlock()[1])
        var screenTitleDiv = h('div.cp-onboardscreen-screentitle')
        $(screenTitleDiv).append(h('div.cp-onboardscreen-maintitle', h('span.cp-onboardscreen-title', Messages.admin_onboardingTitle), h('br'), h('span', Messages.admin_onboardingDesc)))
        var nav = blocks.nav([button]);
        var form = blocks.form([
        screenTitleDiv, 
        titleInput, descriptionInput, 
        // logoInput
            // $(titleInput),descriptionInput, inputLogo
            // , label, labelCurrent
        ], nav);

        var $form = $(form).addClass('cp-onboardscreen-form')

        return form
    
    }

    AppConfigScreen.mfaRegistrationScreen = function(sendAdminDecree) {
        var restrict = blocks.activeCheckbox({
            key: 'registration',
            getState: function () {
                return false
            },
            query: function (val, setState) {
                sendAdminDecree('RESTRICT_REGISTRATION', [val], function (e, response) {
                    if (e || response.error) {
                        UI.warn(Messages.error);
                        $input.val('');
                        console.error(e, response);
                        done(false);
                        return;
                    }
                    // flushCache();
                    // done(true);
                    UI.log(Messages._getKey('ui_saved', [Messages.admin_appSelection]));

                })
            },
        });

        var forceMFA = blocks.activeCheckbox({
            key: 'forcemfa',
            getState: function () {
                return false
            },
            query: function (val, setState) {
                sendAdminDecree('ENFORCE_MFA', [val], function (e, response) {
                if (e || response.error) {
                    UI.warn(Messages.error);
                    $input.val('');
                    console.error(e, response);
                    done(false);
                    return;
                }
                // flushCache();
                done(true);
                UI.log(Messages._getKey('ui_saved', [Messages.admin_appSelection]));

            })
            },
        });

        var button = blocks.activeButton('primary', '', Messages.settings_save, function (done) {
            document.location.href = '/drive/';
            return;
        })

        var screenTitleDiv = h('div.cp-onboardscreen-screentitle')
        $(screenTitleDiv).append(h('div.cp-onboardscreen-maintitle', h('span.cp-form-setting-title', Messages.admin_onboardingTitle), h('br'), h('span', Messages.admin_onboardingDesc)))
        
        var form = blocks.form([
        screenTitleDiv,
        restrict, forceMFA], 
        [button])

        return form
    
    }


    AppConfigScreen.appConfig = function (sendAdminDecree) {

        const blocks = Sidebar.blocks;
        const grid = blocks.block([], 'cp-admin-customize-apps-grid');
        const allApps = ['pad', 'code', 'kanban', 'slide', 'sheet', 'form', 'whiteboard', 'diagram'];
        const availableApps = []
            
        function select(app) {
            if (availableApps.indexOf(app) === -1) {
                availableApps.push(app);
                $(`#${app}-block`).attr('class', 'active-app') 
            } else {
                availableApps.splice(availableApps.indexOf(app), 1)
                $(`#${app}-block`).attr('class', 'inactive-app')
            } 
        }

        allApps.forEach(app => { 
            let appBlock = h('div', {class: 'inactive-app', id: `${app}-block`}, {style: 'background-color:white'},app)
            $(appBlock).addClass('cp-app-drive-element-grid')
            $(appBlock).addClass('cp-app-drive-element-row')
            $(appBlock).addClass('cp-app-drive-new-doc')

            $(grid).append(appBlock);
            $(appBlock).on('click', () => select(app))
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
            //     UI.log(Messages._getKey('ui_saved', [Messages.admin_appSelection]));

            // })
            
            UI.log('Messages._getKey(, [Messages.admin_appSelection])');
            var nextPageForm = AppConfigScreen.mfaRegistrationScreen(sendAdminDecree)
            var elem = document.createElement('div');
            elem.setAttribute('id', 'cp-loading');
            let frame = h('div.configscreen', nextPageForm)
            elem.append(frame)

            built = true;
            var intr;
            var append = function () {
                if (!document.body) { return; }
                clearInterval(intr);
                document.body.appendChild(elem);
            };
            intr = setInterval(append, 100);
            append();
        });

        var screenTitleDiv = h('div.cp-onboardscreen-screentitle')
            $(screenTitleDiv).append(h('div.cp-onboardscreen-maintitle', h('span.cp-form-setting-title', Messages.admin_onboardingTitle), h('br'), h('span', Messages.admin_onboardingDesc)))
                
        let form = blocks.form([
            screenTitleDiv,
            grid 
        ], blocks.nav([save]));
        
        return form
    }    

    return AppConfigScreen


});

