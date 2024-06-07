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
    Messages.admin_onboardingNameTitle = 'Welcome to your CryptPad instance'
    Messages.admin_onboardingNameHint = 'Please choose a title and description'

    Messages.admin_onboardingAppsTitle = "Choose your applications"
    Messages.admin_onboardingAppsHint = "Choose which apps are available to users on your instance"

    Messages.admin_onboardingRegistrationTitle = "Options"
    Messages.admin_onboardingRegistrationHint = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In id tristique justo"


    Messages.admin_onboardingRegistration = "Visitors to the instance are not able to create accounts. Invitations can be created by administrators"
    Messages.admin_onboardingRegistration = "All accounts on the instance have to use 2-factor authentication"


    var AppConfigScreen = {};
    const blocks = Sidebar.blocks;

    var displayForm = function(sendAdminDecree, page) {

        var pages = [AppConfigScreen.appConfig, AppConfigScreen.mfaRegistrationScreen, AppConfigScreen.titleConfig]
        var nextPageFunction = pages[page]
        console.log('here', typeof nextPageFunction)
        var nextPageForm = nextPageFunction(sendAdminDecree)
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
    
    }

    AppConfigScreen.titleConfig = function (sendAdminDecree, sendAdminRpc) {

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

        var colorBlock = function () {
        
            let input = blocks.input({
                    type: 'color',
                    value: (Instance && Instance.color) || '#0087FF'
                });
                let label = blocks.labelledInput(Messages.admin_colorPick, input);
                let current = blocks.block([], 'cp-admin-color-current');
                let labelCurrent = blocks.labelledInput(Messages.admin_colorCurrent, current);
                let preview = blocks.block([
                    blocks.block([
                        blocks.link('CryptPad', '/admin/#customize'),
                        blocks.button('primary', 'fa-floppy-o', Messages.settings_save),
                        blocks.button('secondary', 'fa-floppy-o', Messages.settings_save)
                    ], 'cp-admin-color-preview-dark cp-sidebar-flex-block'),
                    blocks.block([
                        blocks.link('CryptPad', '/admin/#customize'),
                        blocks.button('primary', 'fa-floppy-o', Messages.settings_save),
                        blocks.button('secondary', 'fa-floppy-o', Messages.settings_save)
                    ], 'cp-admin-color-preview-light cp-sidebar-flex-block')
                ], 'cp-admin-color-preview');
                let labelPreview = blocks.labelledInput(Messages.admin_colorPreview, preview);
                let $preview = $(preview);

                let remove = blocks.button('danger', '', Messages.admin_logoRemoveButton);
                let $remove = $(remove);

                let setColor = (color, done) => {
                    sframeCommand('CHANGE_COLOR', {color}, (err, response) => {
                        if (err) {
                            UI.warn(Messages.error);
                            console.error(err, response);
                            done(false);
                            return;
                        }
                        done(true);
                        UI.log(Messages.saved);
                    });
                };

                let btn = blocks.activeButton('primary', '',
                Messages.admin_colorChange, (done) => {
                    let color = $input.val();
                    setColor(color, done);
                });

                let $input = $(input).on('change', () => {
                    require(['/lib/less.min.js'], (Less) => {
                        let color = $input.val();
                        let lColor = Less.color(color.slice(1));
                        let lighten = Less.functions.functionRegistry._data.lighten;
                        let lightColor = lighten(lColor, {value:30}).toRGB();
                        $preview.find('.btn-primary').css({
                            'background-color': color
                        });
                        $preview.find('.cp-admin-color-preview-dark .btn-secondary').css({
                            'border-color': lightColor,
                            'color': lightColor,
                        });
                        $preview.find('.cp-admin-color-preview-light .btn-secondary').css({
                            'border-color': color,
                            'color': color,
                        });
                        $preview.find('.cp-admin-color-preview-dark a').attr('style', `color: ${lightColor} !important`);
                        $preview.find('.cp-admin-color-preview-light a').attr('style', `color: ${color} !important`);
                    
                    });
                });

                UI.confirmButton($remove, {
                    classes: 'btn-danger',
                    multiple: true
                }, function () {
                    $remove.attr('disabled', 'disabled');
                    setColor('', () => {});
                });

                // let form = blocks.form([
                    var form = [labelCurrent,
                    label]
                // ], blocks.nav([btn, remove, btn.spinner]));


            return form
        
        }


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

            displayForm(sendAdminDecree, 0)
        });

        var titleInput = h('div.cp-onboardscreen-name', titleDescBlock()[0])
        var logoInput = h('div.cp-onboardscreen-logo', logoBlock(), {style:'width:20%;height:20%'})
        var descriptionInput = h('div.cp-onboardscreen-description', titleDescBlock()[1])
        var colorInput =  h('div', colorBlock()[0], colorBlock()[1], {style:'width:50%;height:20%;position:absolute;right:0;bottom:0;margin-right:17%;margin-bottom:10%'})
        // var colorInputLabel = h('div', colorBlock()[0],  {style:'width:20%;height:20%'})
        // var colorInputLabel2 = h('div', colorBlock()[1], {style:'width:20%;height:20%'})

        var screenTitleDiv = h('div.cp-onboardscreen-screentitle')
        $(screenTitleDiv).append(h('div.cp-onboardscreen-maintitle', h('span.cp-onboardscreen-title', Messages.admin_onboardingNameTitle), h('br'), h('span', Messages.admin_onboardingNameHint)))
        var nav = blocks.nav([button]);
        var form = blocks.form([
            screenTitleDiv, 
            titleInput, descriptionInput, 
            logoInput, 
            colorInput,
        ], nav);

        $(form).addClass('cp-onboardscreen-form')

        var wrapper = h('div', form,  {style:'width:100%'})

        return wrapper
    
    }

    AppConfigScreen.mfaRegistrationScreen = function(sendAdminDecree) {

        var restrict = blocks.activeCheckbox({
            key: 'registration',
            getState: function () {
                return false
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

                })
            },
        });

        var forceMFA = blocks.activeCheckbox({
            key: 'forcemfa',
            getState: function () {
                return false
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
        const allApps = [restrict, forceMFA];

        allApps.forEach(app => { 
            let appBlock = h('div.cp-bloop', {style: 'width:50%;height:20px;float:left'}, {class: 'inactive-app', id: `${app}-block`}, app)
            $(grid).append(appBlock);
        }); 


        var save = blocks.activeButton('primary', '', Messages.settings_save, function (done) {
            document.location.href = '/drive/';
            return;
        })

        var prev = blocks.activeButton('primary', '', Messages.settings_prev, function (done) {
        
            displayForm(sendAdminDecree, 2)
        })

        var screenTitleDiv = h('div.cp-onboardscreen-screentitle')
        $(screenTitleDiv).append(h('div.cp-onboardscreen-maintitle', h('span.cp-onboardscreen-title', Messages.admin_onboardingRegistrationTitle), h('br'), h('span', Messages.admin_onboardingRegistrationHint)))
        
        var form = blocks.form([
        screenTitleDiv,
        grid], 
        [prev, save])

        $(form).addClass('cp-onboardscreen-form')

        return form
    
    }


    AppConfigScreen.appConfig = function (sendAdminDecree) {

        const blocks = Sidebar.blocks;
        const grid = blocks.block([], 'cp-admin-customize-apps-grid');
        const allApps = ['pad', 'code', 'kanban', 'slide', 'sheet', 'form', 'whiteboard', 'diagram'];
        const availableApps = []
            
        function select(app, appBlock) {
            if (availableApps.indexOf(app) === -1) {
                availableApps.push(app);
                console.log(appBlock)
                console.log(appBlock.innerHTML)
                var checkMark = h('div.cp-onboardscreen-checkmark', "V", {style:'color:white'})
                appBlock.append(checkMark)
                $(`#${app}-block`).attr('class', 'active-app') 
            } else {
                availableApps.splice(availableApps.indexOf(app), 1)
                $(`#${app}-block`).attr('class', 'inactive-app')
                appBlock.remove('.cp-onboardscreen-checkmark')
            } 
        }

        allApps.forEach(app => { 
            let appBlock = h('div.cp-bloop', {style: 'width:50%;height:20px;'}, {class: 'inactive-app', id: `${app}-block`}, app.charAt(0).toUpperCase() + app.slice(1))
            $(appBlock).addClass('cp-app-drive-element-grid')
            $(appBlock).addClass('cp-app-drive-element-row')
            $(appBlock).addClass('cp-app-drive-new-doc')

            $(grid).append(appBlock);
            $(appBlock).on('click', () => select(app, $(appBlock)))
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
        Messages.settings_prev = 'Back'
        var prev = blocks.activeButton('primary', '', Messages.settings_prev, function (done) {
        
            displayForm(sendAdminDecree, 2)
        })

        var screenTitleDiv = h('div.cp-onboardscreen-screentitle')
        $(screenTitleDiv).append(h('div.cp-onboardscreen-maintitle', h('span.cp-onboardscreen-title', Messages.admin_onboardingAppsTitle), h('br'), h('span', Messages.admin_onboardingAppsHint)))
                
        let form = blocks.form([
            screenTitleDiv,
            grid 
        ], blocks.nav([prev, save]));

        $(form).addClass('cp-onboardscreen-form')
        
        return form
    }    

    return AppConfigScreen


});

