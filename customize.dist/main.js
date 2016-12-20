define([
    '/customize/messages.js',
    '/customize/DecorateToolbar.js',
    '/customize/application_config.js',
    '/common/cryptpad-common.js',
    '/bower_components/lil-uri/uri.min.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Messages, DecorateToolbar, Config, Cryptpad, LilUri) {
    var $ = window.$;

    var APP = window.APP = {
        Cryptpad: Cryptpad,
    };

    var padTypes = {
        '/pad/': Messages.type.pad,
        '/code/': Messages.type.code,
        '/poll/': Messages.type.poll,
        '/slide/': Messages.type.slide,
    };

    var $table;
    var $tbody;
    var $tryit;
    var now = new Date();
    var hasRecent = false;

    var forgetPad = Cryptpad.forgetPad;

    var displayCreateButtons = function () {
        var $parent = $('#buttons');
        Config.availablePadTypes.forEach(function (el) {
            $('#create-' + el).detach().appendTo($parent).show();
        });
    };

    var makeRecentPadsTable = function (recentPads) {
        if (!recentPads.length) { return; }

        $('tbody tr').each(function (i, e) {
            if (!i) { return; }
            $(this).remove();
        });

        recentPads.some(function (pad, index) {
            if (!pad) { return; }

            hasRecent = true;

            // split up the uri
            var uri = LilUri(pad.href);

            // derive the name
            var name = padTypes[uri.path()];

            var title = pad.title || uri.parts.hash.slice(0,8);
            var shortTitle = Cryptpad.truncate(pad.title, 48);

            var date = new Date(pad.atime).toLocaleDateString();
            var created = new Date(pad.ctime).toLocaleDateString();

            if (date === now.toLocaleDateString()) {
                date = new Date(pad.atime).toLocaleTimeString().replace(/ /g, '');
            }

            var id = 'pad-'+index;

            var $row = $('<tr>', {
                id: id
            });

            var $remove = $('<td>', {
                'class': 'remove',
                title: Messages.forget + " '"+shortTitle + "'"
            }).text('✖').click(function () {
                Cryptpad.confirm(Messages.forgetPrompt + ' (' + Cryptpad.fixHTML(shortTitle) + ')', function (yes) {
                    if (!yes) { return; }
                    forgetPad(pad.href, function (err, data) {
                        if (err) {
                            console.log("Unable to forget pad");
                            console.log(err);
                            return;
                        }
                        $row.fadeOut(750, function () {
                            $row.remove();
                            if (!$table.find('tr').find('td').length) {
                                $table.remove();
                                $tryit.text(Messages.tryIt);
                            }
                        });
                    });
                });
            });

            var readOnly = false;
            if (pad.href.indexOf('#') !== -1) {
                var modeArray = pad.href.split('#')[1].split('/');
                if (modeArray.length >= 3 && modeArray[2] === 'view') {
                    readOnly =  true;
                }
            }
            var readOnlyText = readOnly ? '(' + Messages.readonly + ') ' : '';
            $row
                .append($('<td>').text(name))
                .append($('<td>').append(readOnlyText).append($('<a>', {
                    href: pad.href,
                    title: pad.title,
                }).text(shortTitle)))
                .append($('<td>').text(created))
                .append($('<td>').text(date))
                .append($remove);
            $tbody.append($row);
        });
    };

    var refreshTable = function () {
        Cryptpad.getRecentPads(function (err, recentPads) {
            if (err) {
                console.log("unable to get recent pads");
                console.error(err);
                return;
            }

            if (recentPads.length) {
                recentPads.sort(Cryptpad.mostRecent);
                $('iframe').attr('style', '');
                $tryit.removeAttr('data-localization');
                $tryit.text(Messages.recentPadsIframe);
                //makeRecentPadsTable(recentPads);
            }

            /*if (hasRecent) {
                $('table').attr('style', '');
                // Race condition here, this is triggered before the localization in HTML
                // so we have to remove the data-localization attr
                $tryit.removeAttr('data-localization');
                $tryit.text(Messages.recentPads);
            }*/
        });
    };

    Cryptpad.ready(function () {
        console.log("ready");

        $table = $('table.scroll');
        $tbody = $table.find('tbody');
        $tryit = $('#tryit');

        DecorateToolbar.main($('#bottom-bar'));
        Cryptpad.styleAlerts();

        displayCreateButtons();
        refreshTable();
        if (Cryptpad.store && Cryptpad.store.change) {
            Cryptpad.store.change(function (data) {
                if (data.key === 'CryptPad_RECENTPADS') {
                    refreshTable();
                }
            });
        }
    });
});

