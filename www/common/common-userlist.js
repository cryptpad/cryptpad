define(function () {
    var module = {};

    module.create = function (info, onLocal, Cryptget, Cryptpad) {
        var exp = {};

        var userData = exp.userData = {};
        var userList = exp.userList = info.userList;
        var myData = exp.myData = {};
        exp.myUserName = info.myID;
        exp.myNetfluxId = info.myID;

        var network = Cryptpad.getNetwork();

        var parsed = Cryptpad.parsePadUrl(window.location.href);
        var appType = parsed ? parsed.type : undefined;

        var addToUserData = exp.addToUserData = function(data) {
            var users = userList.users;
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
                userNetfluxId: exp.myNetfluxId
            };
        };

        var setName = exp.setName = function (newName, cb) {
            if (typeof(newName) !== 'string') { return; }
            var myUserNameTemp = newName.trim();
            if(myUserNameTemp.length > 32) {
              myUserNameTemp = myUserNameTemp.substr(0, 32);
            }
            exp.myUserName = myUserNameTemp;
            myData = {};
            myData[exp.myNetfluxId] = {
                name: exp.myUserName,
                uid: Cryptpad.getUid(),
                avatar: Cryptpad.getAvatarUrl(),
                profile: Cryptpad.getProfileUrl(),
                edPublic: Cryptpad.getProxy().edPublic
            };
            addToUserData(myData);
            /*Cryptpad.setAttribute('username', exp.myUserName, function (err) {
                if (err) {
                    console.log("Couldn't set username");
                    console.error(err);
                    return;
                }
                if (typeof cb === "function") { cb(); }
            });*/
            if (typeof cb === "function") { cb(); }
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
                    myData[exp.myNetfluxId] = {
                        name: "",
                        uid: Cryptpad.getUid(),
                        avatar: Cryptpad.getAvatarUrl(),
                        profile: Cryptpad.getProfileUrl(),
                        edPublic: Cryptpad.getProxy().edPublic
                    };
                    addToUserData(myData);
                    onLocal();
                    $changeNameButton.click();
                }
                if (isNew && appType) {
                    Cryptpad.selectTemplate(appType, info.realtime, Cryptget);
                }
            });
        };

        Cryptpad.onDisplayNameChanged(function (newName) {
            setName(newName, onLocal);
        });

        network.on('reconnect', function (uid) {
            exp.myNetfluxId = uid;
            exp.setName(exp.myUserName);
        });

        return exp;
    };

    return module;
});
