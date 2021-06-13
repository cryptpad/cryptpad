define([
    '/api/sso',
    '/common/hyperscript.js',
    '/common/common-interface.js',
    '/customize/messages.js',
    '/customize/pages.js'
], function (ssoHeaders, h, UI, Msg, Pages) {
    return function () {
        return [h('div#cp-main', [
            Pages.infopageTopbar(),
            h('div.container.cp-container', [
                h('div.row.cp-page-title', [
                    h('h1', Msg.login_login),
                    h('p', Msg.login_ssoTooltip),
                ]),
                h('div.row', [
                    h('div.col-md-3'),
                    h('div#userForm.form-group.hidden.col-md-6', [
                        h('input.form-control#name', {
                            name: 'name',
                            value: ssoHeaders.preferred_username,
                            type: 'hidden',
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
                        h('div.checkbox-container', { style: 'display: none' }, [
                            UI.createCheckbox('import-recent', Msg.register_importRecent),
                        ]),
                        h('div.extra', [
                            h('button.login', Msg.login_login),
                        ])
                    ]),
                    h('div.col-md-3')
                ]),
            ]),
            Pages.infopageFooter(),
        ])];
    };
});

