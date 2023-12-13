define([
    '/api/config',
    'jquery',
    '/common/hyperscript.js',
    '/common/common-interface.js',
    '/customize/messages.js',
    '/customize/pages.js'
], function (Config, $, h, UI, Msg, Pages) {

    Msg.ssoauth_header = "SSO authentication"; // XXX
    Msg.ssoauth_form_hint_register = "Add a CryptPad password for extra security or leave empty and continue";
    Msg.ssoauth_form_hint_login = "Please enter your CryptPad password";
    Msg.continue = "Continue";

    return function () {
        document.title = Msg.ssoauth_header;

        var frame = function (content) {
            return [
                h('div#cp-main', [
                    Pages.infopageTopbar(),
                    h('div.container.cp-container', [
                        h('div.row.cp-page-title', h('h1', Msg.ssoauth_header)),
                    ].concat(content)),
                    Pages.infopageFooter(),
                ]),
            ];
        };

        return frame([
            h('div.row', [
                h('div.hidden.col-md-3'),
                h('div#userForm.form-group.col-md-6.cp-ssoauth-pw', [
                    h('p.cp-isregister.cp-login-instance', Msg.ssoauth_form_hint_register),
                    h('p.cp-islogin.cp-login-instance', Msg.ssoauth_form_hint_login),
                    h('input.form-control#password', {
                        type: 'password',
                        placeholder: Msg.login_password,
                    }),
                    h('input.form-control.cp-isregister#passwordconfirm', {
                        type: 'password',
                        placeholder: Msg.login_confirm,
                    }),
                    h('div.cp-ssoauth-button.extra',
                        h('div'),
                        h('button.login#cp-ssoauth-button', Msg.continue)
                    )
                ]),
                h('div.hidden.col-md-3'),
            ])
        ]);
    };

});


