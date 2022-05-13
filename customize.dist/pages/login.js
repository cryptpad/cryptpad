define([
    '/common/hyperscript.js',
    '/common/common-interface.js',
    '/customize/messages.js',
    '/customize/pages.js',
    '/api/config',
], function (h, UI, Msg, Pages, Config) {
    return function () {
        document.title = Msg.login_login;
        return [h('div#cp-main', [
            Pages.infopageTopbar(),
            h('div.container.cp-container', [
                h('div.row.cp-page-title', h('h1', Msg.login_login)),
                h('div.row', [
                    h('div.col-md-3'),
                    h('div#userForm.form-group.hidden.col-md-6', [
                        h('div.cp-login-instance', Msg._getKey('login_instance', [ Pages.Instance.name ])),
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
                            (Config.restrictRegistration?
                                undefined:
                                h('button#register.cp-secondary', Msg.login_register)
                            ),
                            h('button.login', Msg.login_login)
                        ])
                    ]),
                    h('div.col-md-3')
                ]),
                h('div.row', [
                    h('div.col-md-3'),
                    h('div.col-md-6', Msg.register_warning_note),
                    h('div.col-md-3'),
                ]),
            ]),
            Pages.infopageFooter(),
        ])];
    };
});

