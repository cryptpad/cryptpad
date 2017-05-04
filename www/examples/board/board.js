define([
    'jquery'
],function ($) {
    var Board = {};
    var proxy;

    var Uid = function (prefix) {
        return function () {
            return prefix + Number(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
                .toString(32).replace(/\./g, '');
        };
    };

    var removeUid = function (A, e) {
        var i = A.indexOf(e);
        if (i === -1) { return -1; }
        A.splice(i, 1);
        return i;
    };

    var luid = Board.luid = Uid('l-'); // list-uid
    var cuid = Board.cuid = Uid('c-'); // card uid

    var Input = Board.Input = function (opt) {
        return $('<input>', opt);
    };

    /*
        populate the proxy with all the relevant fields
        return boolean whether you are the first user
    */
    Board.initialize = function (_proxy) {
        proxy = _proxy;
        var first = false;

        ['listOrder'].forEach(function (k) {
            if (typeof(proxy[k]) === 'undefined') {
                first = true;
                proxy[k] = [];
            }
        });

        ['lists', 'cards'].forEach(function (k) {
            if (typeof(proxy[k]) === 'undefined') {
                proxy[k] = {};
            }
        });

        return first;
    };

    /*
     * a list is appended to the extant order
     */
    var List = Board.List = function (id) {
        if (!id) {
            id = List.create();
        }

        var $input = Input({
            type: 'text',
            placeholder: 'list title',
        })
        .addClass('list-title')
        .on('keyup change', function () {
            var val = $input.val();
            proxy.lists[id].title = val;
        });

        var $cards = $('<div>', {

        })
        .addClass('card-holder');

        var $new = $('<a>', {

        })
        .addClass('add-card')
        .text('add new card')
        .click(function () {
            // is this correct?
            $cards.append(Board.Card(id));
        });

        var $list =  $('<div>', {
            id: id,
        })
        .addClass('list-column')
        .append($input)
        .append($cards)
        .append($new);

        return $list;
    };

    /*
     */
    List.create = function () {
        var id = luid();
        proxy.listOrder.push(id);
        proxy.lists[id] = {
            title: "",
            cards: [],
        };

        return id;
    };

    /*
     */
    List.remove = function (id) {
        var i = removeUid(proxy.listOrder, id);
        if (i === -1) {

        }
    };

    /*
     */
    List.move = function () {

    };

    /*
     */
    List.insert = function () {

    };

    List.draw = function ($lists, lid) {
        if (!lid) {
            console.log("List Id not supplied");
        }


        var $parent = $lists.find('#' + lid);
        if (!$parent.length) {
            console.log("Creating new list");
            // doesn't exist. draw it fresh

            var $list = Board.List(lid);
            $lists.append($list);

            //console.log("Updating list");

            //var $list = Board.List(lid);
            var title = proxy.lists[lid].title;

            console.log(title);

            $list.find('input.list-title').val(title);



            return;
        }


        // else update
    };

    /*
     * UI element
     */
    var Card = Board.Card = function (pid) {
        // pid => parent id

        var id = Card.create(pid);

        var $input = Input({
            placeholder: 'card description',
            id: id,
        })
        .addClass('card-title');

        var $card = $('<div>', {

        })
        .addClass('card-container')
        .append($input);

        return $card;
    };

    /*
     * a card is instantiated within a parent list
     * .create(parent) adds the relevant attributes to the data structure
     * and returns the created id
     */
    Card.create = function (pid) {
        var id = cuid();

        if (typeof(proxy.lists[pid]) === 'undefined') {
            console.error("Trying to create card for list which does not exist");
            return id;
        }

        proxy.lists[pid].cards.push(id);
        proxy.cards[id] = {
            // TODO what goes in a card
            parent: pid,
            title: "",
        };

        return id;
    };

    /*
     */
    Card.move = function (/*uid, A, B*/) {

    };

    /*
     */
    Card.insert = function () {

    };

    Card.draw = function ($lists, cid) {
        if (!cid) {
            console.error("card id not supplied");
            return;
        }

        if (!proxy.cards[cid]) {
            console.error("no such card: ", cid);
            return;
        }

        var card = proxy.cards[cid];
        card = card; // TODO actually draw
    };

    Board.Draw = function ($lists) {
        proxy.listOrder.forEach(function (luid) {
            List.draw($lists, luid);
        });
    };

    return Board;
});
