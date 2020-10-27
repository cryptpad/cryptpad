define([
    '/common/hyperscript.js',
    '/common/common-interface.js',
    '/customize/messages.js',
    '/customize/pages.js'
], function (h, UI, Msg, Pages) {
    return function () {
        return [h('div#cp-main', [
            Pages.infopageTopbar(),
            h('div.container.cp-container', [
                h('div.row.cp-page-title', h('h1', Msg.login_login)),
                h('div.row', [
                    h('div.col-md-3'),
                    h('div#userForm.form-group.hidden.col-md-6', [
                        h('input.form-control#name', {
                            name: 'name',
                            type: 'text',
                            autocomplete: 'off',
                            autocorrect: 'off',
                            autocapitalize: 'off',
                            spellcheck: false,
                            placeholder: Msg.login_username,
                            autofocus: true,
                        }),
                        h('input.form-control#password', {
                            type: 'password',
                            'name': 'password',
                            placeholder: Msg.login_password,
                        }),
                        h('div.checkbox-container', [
                            UI.createCheckbox('import-recent', Msg.register_importRecent),
                        ]),
                        h('div.extra', [
                            h('button.login', Msg.login_login),
                            h('button#register.cp-secondary', Msg.login_register)
                        ])
                    ]),
                    h('div.col-md-3')
                ]),
            ]),
            Pages.infopageFooter(),
        ])];
    };
});

