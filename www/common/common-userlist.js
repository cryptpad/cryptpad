define([
    'jquery',
    '/common/cryptget.js',
], function ($, Cryptget) {
    var module = {};

    module.create = function (info, onLocal, Cryptpad) {
        var exp = {};

        var userData = exp.userData = {};
        var userList = exp.userList = info.userList;
        var myData = exp.myData = {};
        var myUserName = exp.myUserName = info.myID;
        var myNetfluxId = exp.myNetfluxId = info.myID;

        var users = userList.users;
        var addToUserData = exp.addToUserData = function(data) {
            for (var attrname in data) { userData[attrname] = data[attrname]; }

            if (users && users.length) {
                for (var userKey in userData) {
                    if (users.indexOf(userKey) === -1) {
                        delete userData[userKey];
                    }
                }
            }

            if(userList && typeof userList.onChange === "function") {
                userList.onChange(userData);
            }
        };

        exp.getToolbarConfig = function () {
            return {
                data: userData,
                list: userList,
                userNetfluxId: myNetfluxId
            };
        };

        var setName = exp.setName = function (newName, cb) {
            if (typeof(newName) !== 'string') { return; }
            var myUserNameTemp = newName.trim();
            if(newName.trim().length > 32) {
              myUserNameTemp = myUserNameTemp.substr(0, 32);
            }
            myUserName = myUserNameTemp;
            myData[myNetfluxId] = {
               name: myUserName,
               uid: Cryptpad.getUid(),
            };
            addToUserData(myData);
            Cryptpad.setAttribute('username', myUserName, function (err) {
                if (err) {
                    console.log("Couldn't set username");
                    console.error(err);
                    return;
                }
                if (typeof cb === "function") { onLocal(); }
            });
        };

        exp.getLastName = function ($changeNameButton, isNew) {
            Cryptpad.getLastName(function (err, lastName) {
                if (err) {
                    console.log("Could not get previous name");
                    console.error(err);
                    return;
                }
                // Update the toolbar list:
                // Add the current user in the metadata
                if (typeof(lastName) === 'string') {
                    setName(lastName, onLocal);
                } else {
                    myData[myNetfluxId] = {
                        name: "",
                        uid: Cryptpad.getUid(),
                    };
                    addToUserData(myData);
                    onLocal();
                    $changeNameButton.click();
                }
                if (isNew) {
                    Cryptpad.selectTemplate('code', info.realtime, Cryptget);
                }
            });
        };

        Cryptpad.onDisplayNameChanged(function (newName) {
            setName(newName, onLocal);
        });

        return exp;
    };

    return module;
});
