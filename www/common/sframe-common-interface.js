define([
    'jquery',
    '/common/cryptpad-common.js'
], function ($, Cryptpad) {
    var UI = {};
    var Messages = Cryptpad.Messages;

    UI.createUserAdminMenu = function (config) {
        var Common = config.Common;
        var metadataMgr = config.metadataMgr;

        var displayNameCls = config.displayNameCls || 'displayName';
        var $displayedName = $('<span>', {'class': displayNameCls});

        var accountName = metadataMgr.getPrivateData().accountName;
        var origin = metadataMgr.getPrivateData().origin;
        var padType = metadataMgr.getMetadata().type;

        var $userName = $('<span>', {'class': 'userDisplayName'});
        var options = [];
        if (config.displayNameCls) {
            var $userAdminContent = $('<p>');
            if (accountName) {
                var $userAccount = $('<span>', {'class': 'userAccount'}).append(Messages.user_accountName + ': ' + Cryptpad.fixHTML(accountName));
                $userAdminContent.append($userAccount);
                $userAdminContent.append($('<br>'));
            }
            if (config.displayName) {
                // Hide "Display name:" in read only mode
                $userName.append(Messages.user_displayName + ': ');
                $userName.append($displayedName);
            }
            $userAdminContent.append($userName);
            options.push({
                tag: 'p',
                attributes: {'class': 'accountData'},
                content: $userAdminContent.html()
            });
        }
        if (padType !== 'drive') {
            options.push({
                tag: 'a',
                attributes: {
                    'target': '_blank',
                    'href': origin+'/drive/'
                },
                content: Messages.login_accessDrive
            });
        }
        // Add the change display name button if not in read only mode
        if (config.changeNameButtonCls && config.displayChangeName) {
            options.push({
                tag: 'a',
                attributes: {'class': config.changeNameButtonCls},
                content: Messages.user_rename
            });
        }
        if (accountName) {
            options.push({
                tag: 'a',
                attributes: {'class': 'profile'},
                content: Messages.profileButton
            });
        }
        if (padType !== 'settings') {
            options.push({
                tag: 'a',
                attributes: {'class': 'settings'},
                content: Messages.settingsButton
            });
        }
        // Add login or logout button depending on the current status
        if (accountName) {
            options.push({
                tag: 'a',
                attributes: {'class': 'logout'},
                content: Messages.logoutButton
            });
        } else {
            options.push({
                tag: 'a',
                attributes: {'class': 'login'},
                content: Messages.login_login
            });
            options.push({
                tag: 'a',
                attributes: {'class': 'register'},
                content: Messages.login_register
            });
        }
        var $icon = $('<span>', {'class': 'fa fa-user-secret'});
        //var $userbig = $('<span>', {'class': 'big'}).append($displayedName.clone());
        var $userButton = $('<div>').append($icon);//.append($userbig);
        if (accountName) {
            $userButton = $('<div>').append(accountName);
        }
        /*if (account && config.displayNameCls) {
            $userbig.append($('<span>', {'class': 'account-name'}).text('(' + accountName + ')'));
        } else if (account) {
            // If no display name, do not display the parentheses
            $userbig.append($('<span>', {'class': 'account-name'}).text(accountName));
        }*/
        var dropdownConfigUser = {
            text: $userButton.html(), // Button initial text
            options: options, // Entries displayed in the menu
            left: true, // Open to the left of the button
            container: config.$initBlock, // optional
            feedback: "USER_ADMIN",
        };
        var $userAdmin = Cryptpad.createDropdown(dropdownConfigUser);

        var $displayName = $userAdmin.find('.'+displayNameCls);

        var $avatar = $userAdmin.find('.buttonTitle');
        var updateButton = function () {
            var myData = metadataMgr.getMetadata().users[metadataMgr.getNetfluxId()];
            if (!myData) { return; }
            var newName = myData.name;
            var url = myData.avatar;
            $displayName.text(newName || Messages.anonymous);
            console.log(newName || Messages.anonymous);
            if (accountName) {
                $avatar.html('');
                Cryptpad.displayAvatar($avatar, url, newName, function ($img) {
                    if ($img) {
                        $userAdmin.find('button').addClass('avatar');
                    }
                });
            }
        };
        metadataMgr.onChange(updateButton);
        updateButton();

        $userAdmin.find('a.logout').click(function () {
            Common.logout(function () {
                window.top.location = origin+'/';
            });
        });
        $userAdmin.find('a.settings').click(function () {
            if (padType) {
                window.open(origin+'/settings/');
            } else {
                window.top.location = origin+'/settings/';
            }
        });
        $userAdmin.find('a.profile').click(function () {
            if (padType) {
                window.open(origin+'/profile/');
            } else {
                window.top.location = origin+'/profile/';
            }
        });
        $userAdmin.find('a.login').click(function () {
            Common.setLoginRedirect(function () {
                window.top.location = origin+'/login/';
            });
        });
        $userAdmin.find('a.register').click(function () {
            Common.setLoginRedirect(function () {
                window.top.location = origin+'/register/';
            });
        });

        return $userAdmin;
    };
    
    return UI;
});
