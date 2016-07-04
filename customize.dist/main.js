define([
    '/customize/DecorateToolbar.js',
    '/common/cryptpad-common.js',
    '/bower_components/lil-uri/uri.min.js',
    '/bower_components/jquery/dist/jquery.min.js'
], function (DecorateToolbar, Cryptpad, LilUri) {
    var $ = window.$;
    DecorateToolbar.main($('#bottom-bar'));

    var $table = $('table.scroll');
    var $tbody = $table.find('tbody');
    var $tryit = $('#tryit');
    var now = new Date();
    var hasRecent = false;

    var memorySpan = Cryptpad.timeframe; // thirty days

    var forgetPad = Cryptpad.forgetPad;

    var padTypes = {
        '/pad/': 'Pad',
        '/code/': 'Code'
    };

    var truncateTitle = function (title, len) {
        if (typeof(title) === 'string' && title.length > len) {
            return title.slice(0, len) + '…';
        }
        return title;
    };

    var recentPads = Cryptpad.getRecentPads();
    recentPads.sort(Cryptpad.mostRecent);

    var makeRecentPadsTable = function () {
        if (!recentPads.length) { return; }
        recentPads.some(function (pad, index) {
            if (!pad) { return; }

            console.log(pad);

            // don't link to old pads
            if (now.getTime() - new Date(pad.atime).getTime() > memorySpan) { return true; }

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

            $tbody.append('<tr id="'+id+'">' +
               '<td>' + name + '</td>' +
               //'<td>' + title + '</td>' +
               '<td><a href="' + pad.href + '" title="'+ pad.title + '">' + shortTitle + '</a></td>' +
               '<td>' + created + '</td>' + // created
               '<td>' + date + '</td>' +
               '<td class="remove" title="forget \''+shortTitle+'\'">✖</td>'+
               '</tr>');

            var $row = $('#'+id);
            $row.find('.remove').click(function () {
                if (!window.confirm("Are you sure you'd like to forget this pad (" + shortTitle + ")?")) { return; }
                forgetPad(pad.href);
                $row.fadeOut(750, function () {
                    $row.remove();
                    if (!$table.find('tr').find('td').length) {
                        $table.remove();
                        $tryit.text("Try it out!");
                    }
                });
            });
        });
    };

    if (recentPads.length) {
        recentPads.sort(Cryptpad.mostRecent);
        makeRecentPadsTable();
    }
    if (hasRecent) {
        $('table').attr('style', '');
        $tryit.text('Your Recent pads (stored only in browser)');
    }
});

