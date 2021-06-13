// jshint esversion: 6

const Express = require('express');
var Default = require("./lib/defaults");
var config = require("./lib/load-config");

const JSONdb = require('simple-json-db');
const bodyParser = require('body-parser');

module.exports = function (app) {

    // Initialize JSON DB
    app.use(bodyParser.json());
    const DB = new JSONdb('./data/sso-users.json', {
        asyncWrite: true,
        jsonSpaces: 2,
    });


    /**
     * Add new API routes needed for SSO
     */

    /**
     * Provide a javascript file at /api/sso
     * It provides the http request headers, containing all the SSO informations
     */
    app.get('/api/sso', function (req, res) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        const content = [
            'define(function(){',
            'var obj = ' + JSON.stringify(req.headers, null, '\t'),
            'return obj',
            '});'
        ].join(';\n');
        res.send(content);
    });

    /**
     * Return current sso user public informations
     * (uid, edPublic, curvePublic, displayName, notifications)
     * The response is a stringified object
     */
    app.get('/api/sso/user', function (req, res) {
        const uid = req.headers.preferred_username;
        const user = DB.get(uid);
        res.send(user);
    });

    /**
     * Return whether current sso user has already registered
     * The response is a stringified boolean
     */
    app.get('/api/sso/user/registered', function (req, res) {
        const uid = req.query.uid;
        const user = DB.get(uid);
        res.send(!!user);
    });

    /**
     * Save current sso user most of its public information to the server
     * (uid, edPublic, curvePublic, displayName)
     * It cannot save the notification channel id yet, as it has not been initialize
     * at the time this api is called
     *
     * When everything has been saved, it send back a string
     * containing the sso display name of the user
     */
    app.post('/api/sso/user', function (req, res) {
        const uid = req.headers.preferred_username;
        // If provided uid does not match sso one, send error
        if (req.body.uid !== uid) {
            return void res.status(403).send();
        }
        const data = req.body;
        const displayName = req.headers.given_name + " " + req.headers.family_name;
        data.displayName = displayName;
        DB.set(uid, data);
        res.send(displayName);
    });

    /**
     * Save current sso user its notification channel id
     */
    app.post('/api/sso/user/notifications', function (req, res) {
        const uid = req.headers.preferred_username;
        // As we can only modify top properties inside the DB
        // We get the from the DB and modify him here, before setting him again
        const user = DB.get(uid);
        user.notifications = req.body.notifications;
        DB.set(uid, user);
        res.send();
    });

    /**
     * Return the list of every registered sso user on the server
     * The response is a stringified Object, in the form:
     * {
     *   curvePublic1: { uid, edPublic, curvePublic, displayName, notifications },
     *   curvePublic2: { ... }
     *   ...
     * }
     */
    app.get('/api/sso/friends', function (req, res) {
        const uid = req.headers.preferred_username;
        const friendsDB = DB.JSON();
        const ssoFriends = {};
        Object.values(friendsDB).forEach(friend => {
            // Do not include yourself in your friends
            if (friend.uid === uid) { return; }
            ssoFriends[friend.curvePublic] = friend;
        });
        res.json(ssoFriends);
    });

};