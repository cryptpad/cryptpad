define([
    '/customize/messages.js',
    '/customize/DecorateToolbar.js',
    '/common/cryptpad-common.js',
    '/bower_components/lil-uri/uri.min.js',
    '/customize/email.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Messages, DecorateToolbar, Cryptpad, LilUri, Email) {
    var $ = window.$;

    var email = Email.makeScrambler(1);

    // slip past the spammers, then unscramble mailto links
    $('a[href^="mailto:"]').each(function () {
        $(this).attr('href', function (i, href) {
            return href.replace(/:(.*$)/, function (a, address) {
                return ':' + email.decrypt(address);
            });
        });
    });

    DecorateToolbar.main($('#bottom-bar'));
    Cryptpad.styleAlerts();

    var $table = $('table.scroll');
    var $tbody = $table.find('tbody');
    var $tryit = $('#tryit');
    var now = new Date();
    var hasRecent = false;

    var forgetPad = Cryptpad.forgetPad;

    var padTypes = {
        '/pad/': 'Pad',
        '/code/': 'Code',
        '/poll/': 'Poll',
    };

    var truncateTitle = function (title, len) {
        if (typeof(title) === 'string' && title.length > len) {
            return title.slice(0, len) + '…';
        }
        return title;
    };

    var fixHTML = function (html) {
        return html.replace(/</g, '&lt;');
    };

    var makeRecentPadsTable = function (recentPads) {
        if (!recentPads.length) { return; }
        recentPads.some(function (pad, index) {
            if (!pad) { return; }

            hasRecent = true;

            // split up the uri
            var uri = LilUri(pad.href);

            // derive the name
            var name = padTypes[uri.path()];

            var title = pad.title || uri.parts.hash.slice(0,8);
            var shortTitle = truncateTitle(pad.title, 48);

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
                title: "forget '"+shortTitle + "'"
            }).text('✖').click(function () {
                Cryptpad.confirm(Messages.forgetPrompt + ' (' + fixHTML(shortTitle) + ')', function (yes) {
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

            $row
                .append($('<td>').text(name))
                .append($('<td>').append($('<a>', {
                    href: pad.href,
                    title: pad.title,
                }).text(shortTitle)))
                .append($('<td>').text(created))
                .append($('<td>').text(date))
                .append($remove);
            $tbody.append($row);
        });
    };

    Cryptpad.ready(function () {
        console.log("ready");
        Cryptpad.getRecentPads(function (err, recentPads) {
            if (err) {
                console.log("unable to get recent pads");
                console.error(err);
                return;
            }

            if (recentPads.length) {
                recentPads.sort(Cryptpad.mostRecent);
                makeRecentPadsTable(recentPads);
            }

            if (hasRecent) {
                $('table').attr('style', '');
                $tryit.text(Messages.recentPads);
            }
        });
    });
});

