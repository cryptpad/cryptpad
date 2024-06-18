// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/common/hyperscript.js',
    '/common/common-interface.js',
    '/customize/messages.js',
    '/customize/pages.js',
    '/api/config',
], function (h, UI, Msg, Pages, Config) {
    return function () {
        document.title = Msg.login_login;

        var ssoEnabled = (Config.sso && Config.sso.list && Config.sso.list.length) ?'': '.cp-hidden';
        var ssoEnforced = (Config.sso && Config.sso.force) ? '.cp-hidden' : '';

        return [h('div#cp-main', [
            Pages.infopageTopbar(),
            h('div.container.cp-container', [
                h('div.row.cp-page-title', h('h1', Msg.login_login)),
                h('div.row', [
                    h('div.col-md-3'+ssoEnforced),
                    h('div#userForm.form-group.col-md-6'+ssoEnforced, [
                        h('div.cp-login-instance', Msg._getKey('login_instance', [ Pages.Instance.name ])),
                        h('div.big-container', [
                            h('div.input-container', [
                                h('label.cp-default-label', { for: 'name' }, Msg.login_username),
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
                            ]),
                            h('div.input-container', [
                                h('label.cp-default-label', { for: 'password' }, Msg.login_password),
                                h('input.form-control#password', {
                                    type: 'password',
                                    'name': 'password',
                                    placeholder: Msg.login_password,
                                    autocomplete: "current-password"
                                }),
                            ]),
                        ]),
                        h('div.checkbox-container', [
                            UI.createCheckbox('import-recent', Msg.register_importRecent),
                        ]),
                        h('div.extra', [
                            (Config.restrictRegistration?
                                h('div'):
                                h('a#register', {
                                    href: "/register/",
                                }, Msg.login_register)
                            ),
                            h('button.login', Msg.login_login),
                        ]),
                    ]),
                    h('div.col-md-3'+ssoEnforced),
                    h('div.col-md-3'+ssoEnabled),
                    h('div#ssoForm.form-group.col-md-6'+ssoEnabled, [
                        h('div.cp-login-sso', Msg.sso_login_description)
                    ]),
                    h('div.col-md-3'+ssoEnabled),
                ]),
                h('div.row.cp-login-encryption', [
                    h('div.col-md-3'),
                    h('div.col-md-6', Msg.register_warning_note),
                    h('div.col-md-3'),
                ]),
            ]),
            Pages.infopageFooter(),
        ])];
    };
});
