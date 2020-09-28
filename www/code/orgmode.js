define([
    'cm/lib/codemirror',
    'cm/addon/mode/simple'
], function (CodeMirror) {
    CodeMirror.__mode = 'orgmode';

    var isEmpty = function (el, idx) {
        if (idx < 2) { return true; }
        return !Boolean(el);
    };
    var onLevelOne = function (matches) {
        // If all the elements starting from index 2 are empty, remove them
        // because it means it's an empty header for now and it may break codemirror
        if (matches && matches.length > 2 && matches.every(isEmpty)) {
            matches.splice(2, (matches.length-2));
        }
        return ["header level1 org-level-star","header level1 org-todo","header level1 org-done", "header level1 org-priority", "header level1", "header level1 void", "header level1 comment"];
    };
    // Dirty hack to make the function also work as an array
    onLevelOne().forEach(function (str, i) { onLevelOne[i] = str; });

    var onLevelStar = function (matches) {
        // If all the elements starting from index 2 are empty, remove them
        // because it means it's an empty header for now and it may break codemirror
        if (matches && matches.length > 2 && matches.every(isEmpty)) {
            matches.splice(2, (matches.length-2));
        }
        return ["header org-level-star","header org-todo","header org-done", "header org-priority", "header", "header void", "header comment"];
    };
    // Dirty hack to make the function also work as an array
    onLevelStar().forEach(function (str, i) { onLevelStar[i] = str; });

    CodeMirror.defineSimpleMode("orgmode", {
        start: [
            {regex: /(\*\s)(TODO|DOING|WAITING|NEXT|PENDING|)(CANCELLED|CANCELED|CANCEL|DONE|REJECTED|STOP|STOPPED|)(\s+\[\#[A-C]\]\s+|)(.*?)(?:(\s{10,}|))(\:[\S]+\:|)$/, sol: true, token: onLevelOne},
            {regex: /(\*{1,}\s)(TODO|DOING|WAITING|NEXT|PENDING|)(CANCELLED|CANCELED|CANCEL|DEFERRED|DONE|REJECTED|STOP|STOPPED|)(\s+\[\#[A-C]\]\s+|)(.*?)(?:(\s{10,}|))(\:[\S]+\:|)$/g, sol: true, token: onLevelStar},
            /*
            {regex: /(\*\s)(TODO|DOING|WAITING|NEXT|PENDING|)(CANCELLED|CANCELED|CANCEL|DONE|REJECTED|STOP|STOPPED|)(\s+\[\#[A-C]\]\s+|)(.*?)(?:(\s{10,}|))(\:[\S]+\:|)$/, sol: true, token: ["header level1 org-level-star","header level1 org-todo","header level1 org-done", "header level1 org-priority", "header level1", "header level1 void", "header level1 comment"]},
            {regex: /(\*{1,}\s)(TODO|DOING|WAITING|NEXT|PENDING|)(CANCELLED|CANCELED|CANCEL|DEFERRED|DONE|REJECTED|STOP|STOPPED|)(\s+\[\#[A-C]\]\s+|)(.*?)(?:(\s{10,}|))(\:[\S]+\:|)$/g, sol: true, token: ["header org-level-star","header org-todo","header org-done", "header org-priority", "header", "header void", "header comment"]},
            */
            {regex: /(\+[^\+]+\+)/, token: ["strikethrough"]},
            {regex: /(\*[^\*]+\*)/, token: ["strong"]},
            {regex: /(\/[^\/]+\/)/, token: ["em"]},
            {regex: /(\_[^\_]+\_)/, token: ["link"]},
            {regex: /(\~[^\~]+\~)/, token: ["comment"]},
            {regex: /(\=[^\=]+\=)/, token: ["comment"]},
            {regex: /\[\[[^\[\]]+\]\[[^\[\]]+\]\]/, token: "org-url"}, // links
            {regex: /\[\[[^\[\]]+\]\]/, token: "org-image"}, // image
            {regex: /\[[xX\s\-\_]\]/, token: 'qualifier org-toggle'}, // checkbox
            {regex: /\#\+(?:(BEGIN|begin))_[a-zA-Z]*/, token: "comment", next: "env", sol: true}, // comments
            {regex: /:?[A-Z_]+\:.*/, token: "comment", sol: true}, // property drawers
            {regex: /(\#\+[a-zA-Z_]*)(\:.*)/, token: ["keyword", 'qualifier'], sol: true}, // environments
            {regex: /(CLOCK\:|SHEDULED\:|DEADLINE\:)(\s.+)/, token: ["comment", "keyword"]}
        ],
        env: [
            {regex: /\#\+(?:(END|end))_[a-zA-Z]*/, token: "comment", next: "start", sol: true},
            {regex: /.*/, token: "comment"}
        ]
    });
    CodeMirror.registerHelper("fold", "orgmode", function(cm, start) {
        function headerLevel (lineNo) {
            var line = cm.getLine(lineNo);
            var match = /^\*+/.exec(line);
            if (match && match.length === 1 && /header/.test(cm.getTokenTypeAt(CodeMirror.Pos(lineNo, 0)))) {
                return match[0].length;
            }
            return null;
        }
        // init
        var levelToMatch = headerLevel(start.line);

        // no folding needed
        if(levelToMatch === null) { return; }

        // find folding limits
        var lastLine = cm.lastLine();
        var end = start.line;
        while (end < lastLine){
            end += 1;
            var level = headerLevel(end);
            if (level && level <= levelToMatch) {
                end = end - 1;
                break;
            }
        }

        return {
            from: CodeMirror.Pos(start.line, cm.getLine(start.line).length),
            to: CodeMirror.Pos(end, cm.getLine(end).length)
        };
    });
    CodeMirror.registerGlobalHelper("fold", "drawer", function(mode) {
        return mode.name === 'orgmode' ? true : false;
    }, function(cm, start) {
        function isBeginningOfADrawer(lineNo) {
            var line = cm.getLine(lineNo);
            var match = /^\:.*\:$/.exec(line);
            if(match && match.length === 1 && match[0] !== ':END:'){
                return true;
            }
            return false;
        }
        function isEndOfADrawer(lineNo){
            var line = cm.getLine(lineNo);
            return line.trim() === ':END:' ? true : false;
        }

        var drawer = isBeginningOfADrawer(start.line);
        if (drawer === false) { return; }

        // find folding limits
        var lastLine = cm.lastLine();
        var end = start.line;
        while(end < lastLine){
            end += 1;
            if (isEndOfADrawer(end)) {
                break;
            }
        }
        return {
            from: CodeMirror.Pos(start.line, cm.getLine(start.line).length),
            to: CodeMirror.Pos(end, cm.getLine(end).length)
        };
    });

    var init = false;
    CodeMirror.registerHelper("orgmode", "init", function (editor) {
        if (init) { return; }

        editor.setOption("extraKeys", {
            "Tab": function(cm) { org_cycle(cm); },
            "Shift-Tab": function(cm){ org_shifttab(cm); },
            "Alt-Left": function(cm){ org_metaleft(cm); },
            "Alt-Right": function(cm){ org_metaright(cm); },
            "Alt-Enter": function(cm){ org_meta_return(cm); },
            "Alt-Up": function(cm){ org_metaup(cm); },
            "Alt-Down": function(cm){ org_metadown(cm); },
            "Shift-Alt-Left": function(cm){ org_shiftmetaleft(cm); },
            "Shift-Alt-Right": function(cm){ org_shiftmetaright(cm); },
            "Shift-Alt-Enter": function(cm){ org_insert_todo_heading(cm); },
            "Shift-Left": function(cm){ org_shiftleft(cm); },
            "Shift-Right": function(cm){ org_shiftright(cm); }
        });

        init = true;
        editor.on('mousedown', toggleHandler);
        editor.on('touchstart', toggleHandler);
        editor.on('gutterClick', foldLine);

        // fold everything except headers by default
        editor.operation(function() {
            for (var i = 0; i < editor.lineCount() ; i++) {
                if(/header/.test(editor.getTokenTypeAt(CodeMirror.Pos(i, 0))) === false){
                    fold(editor, CodeMirror.Pos(i, 0));
                }
            }
        });
        return CodeMirror.orgmode.destroy.bind(this, editor);
    });

    CodeMirror.registerHelper("orgmode", "destroy", function (editor) {
        if (!init) { return; }

        init = false;
        editor.off('mousedown', toggleHandler);
        editor.off('touchstart', toggleHandler);
        editor.off('gutterClick', foldLine);

        // Restore CryptPad shortcuts
        if (typeof (editor.updateSettings) === "function") { editor.updateSettings(); }
    });

    function foldLine (cm, line){
        var cursor = {line: line, ch: 0};
        isFold(cm, cursor) ? unfold(cm, cursor) : fold(cm, cursor);
    }


    var widgets = [];
    function toggleHandler (cm, e){
        var position = cm.coordsChar({
            left: e.clientX || (e.targetTouches && e.targetTouches[0].clientX),
            top: e.clientY || (e.targetTouches && e.targetTouches[0].clientY)
        }, "page"),
              token = cm.getTokenAt(position);

        _disableSelection();
        if(/org-level-star/.test(token.type)){
            _preventIfShould();
            _foldHeadline();
            _disableSelection();
        }else if(/org-toggle/.test(token.type)){
            _preventIfShould();
            _toggleCheckbox();
            _disableSelection();
        }else if(/org-todo/.test(token.type)){
            _preventIfShould();
            _toggleTodo();
            _disableSelection();
        }else if(/org-done/.test(token.type)){
            _preventIfShould();
            _toggleDone();
            _disableSelection();
        }else if(/org-priority/.test(token.type)){
            _preventIfShould();
            _togglePriority();
            _disableSelection();
        }else if(/org-url/.test(token.type)){
            _disableSelection();
            _navigateLink();
        }else if(/org-image/.test(token.type)){
            _disableSelection();
            _toggleImageWidget();
        }

        function _preventIfShould(){
            if('ontouchstart' in window) e.preventDefault();
        }
        function _disableSelection(){
            cm.on('beforeSelectionChange', _onSelectionChangeHandler);
            function _onSelectionChangeHandler(cm, obj){
                obj.update([{
                    anchor: position,
                    head: position
                }]);
                cm.off('beforeSelectionChange', _onSelectionChangeHandler);
            }
        }

        function _foldHeadline(){
            var line = position.line;
            if(line >= 0){
                var cursor = {line: line, ch: 0};
                isFold(cm, cursor) ? unfold(cm, cursor) : fold(cm, cursor);
            }
        }

        function _toggleCheckbox(){
            var line = position.line;
            var content = cm.getRange({line: line, ch: token.start}, {line: line, ch: token.end});
            var new_content = content === "[X]" || content === "[x]" ? "[ ]" : "[X]";
            cm.replaceRange(new_content, {line: line, ch: token.start}, {line: line, ch: token.end});
        }

        function _toggleTodo(){
            var line = position.line;
            cm.replaceRange("DONE", {line: line, ch: token.start}, {line: line, ch: token.end});
        }

        function _toggleDone(){
            var line = position.line;
            cm.replaceRange("TODO", {line: line, ch: token.start}, {line: line, ch: token.end});
        }

        function _togglePriority(){
            var PRIORITIES = [" [#A] ", " [#B] ", " [#C] ", " [#A] "];
            var line = position.line;
            var content = cm.getRange({line: line, ch: token.start}, {line: line, ch: token.end});
            var new_content = PRIORITIES[PRIORITIES.indexOf(content) + 1];
            cm.replaceRange(new_content, {line: line, ch: token.start}, {line: line, ch: token.end});
        }

        function _toggleImageWidget(){
            var exist = !!widgets
                .filter(function (line) { return line === position.line; })[0];

            if(exist === false){
                if(!token.string.match(/\[\[(.*)\]\]/)) return null;
                var $node = _buildImage(RegExp.$1);
                var widget = cm.addLineWidget(position.line, $node, {coverGutter: false});
                widgets.push(position.line);
                $node.addEventListener('click', closeWidget);

                function closeWidget(){
                    widget.clear();
                    $node.removeEventListener('click', closeWidget);
                    widgets = widgets.filter(function (line) { return line !== position.line; });
                }
            }
            function _buildImage(src){
                var $el = document.createElement("div");
                var $img = document.createElement("img");

                if(/^https?\:\/\//.test(src)){
                    $img.src = src;
                }else{
                    var root_path = dirname(window.location.pathname.replace(/^\/view/, ''));
                    var img_path = src;
                    $img.src = "/api/files/cat?path="+encodeURIComponent(pathBuilder(root_path, img_path));
                }
                $el.appendChild($img);
                return $el;
            }
            return null;
        }

        function _navigateLink(){
            token.string.match(/\[\[(.*?)\]\[/);
            var link = RegExp.$1;
            if(!link) return;

            if(/^https?\:\/\//.test(link)){
                window.open(link);
            }else{
                var root_path = dirname(window.location.pathname.replace(/^\/view/, ''));
                var link_path = link;
                window.open("/view"+pathBuilder(root_path, link_path));
            }
        }
    }

    CodeMirror.defineMIME("text/org", "org");

    function fold(cm, start){
        cm.foldCode(start, null, "fold");
    }
    function unfold(cm, start){
        cm.foldCode(start, null, "unfold");
    }
    function isFold(cm, start){
        var line = start.line;
        var marks = cm.findMarks(CodeMirror.Pos(line, 0), CodeMirror.Pos(line + 1, 0));
        for (var i = 0; i < marks.length; ++i) {
            if (marks[i].__isFold && marks[i].find().from.line === line) { return marks[i]; }
        }
        return false;
    }

/*
    CodeMirror.afterInit = function(editor){
        function fold(cm, start){
            cm.foldCode(start, null, "fold");
        }
        function unfold(cm, start){
            cm.foldCode(start, null, "unfold");
        }
        function isFold(cm, start){
            var line = start.line;
            var marks = cm.findMarks(CodeMirror.Pos(line, 0), CodeMirror.Pos(line + 1, 0));
            for (var i = 0; i < marks.length; ++i) {
                if (marks[i].__isFold && marks[i].find().from.line === line) { return marks[i]; }
            }
            return false;
        }

        var state = {
            stab: 'OVERVIEW'
        };
        editor.setOption("extraKeys", {
            "Tab": function(cm) {
                var pos = cm.getCursor();
                return isFold(cm, pos) ? unfold(cm, pos) : fold(cm, pos);
            },
            "Shift-Tab": function(cm){
                if(state.stab === "SHOW_ALL"){
                    // fold everything that can be fold
                    state.stab = 'OVERVIEW';
                    cm.operation(function() {
                        for (var i = cm.firstLine(), e = cm.lastLine(); i <= e; i++){
                            fold(cm, CodeMirror.Pos(i, 0));
                        }
                    });
                }else{
                    // unfold all headers
                    state.stab = 'SHOW_ALL';
                    cm.operation(function() {
                        for (var i = cm.firstLine(), e = cm.lastLine(); i <= e; i++){
                            if(/header/.test(cm.getTokenTypeAt(CodeMirror.Pos(i, 0))) === true){
                                unfold(cm, CodeMirror.Pos(i, 0));
                            }
                        }
                    });
                }
            }
        });

        editor.on('touchstart', function(cm){
            setTimeout(function () {
                return isFold(cm, cm.getCursor()) ? unfold(cm, cm.getCursor()) : fold(cm, cm.getCursor());
            }, 150);
        });
        // fold everything except headers by default
        editor.operation(function() {
            for (var i = 0; i < editor.lineCount() ; i++) {
                if(/header/.test(editor.getTokenTypeAt(CodeMirror.Pos(i, 0))) === false){
                    fold(editor, CodeMirror.Pos(i, 0));
                }
            }
        });
    };
*/



var org_cycle = function (cm) {
    var pos = cm.getCursor();
    isFold(cm, pos) ? unfold(cm, pos) : fold(cm, pos);
};


var state = {
    stab: 'CONTENT'
};
var org_set_fold = function (cm) {
    var cursor = cm.getCursor();
    set_folding_mode(cm, state.stab);
    cm.setCursor(cursor);
    return state.stab;
};
/*
 * DONE: Global visibility cycling
 * TODO: or move to previous table field.
 */
var org_shifttab = function (cm) {
    if(state.stab === "SHOW_ALL"){
        state.stab = 'OVERVIEW';
    }else if(state.stab === "OVERVIEW"){
        state.stab = 'CONTENT';
    }else if(state.stab === "CONTENT"){
        state.stab = 'SHOW_ALL';
    }
    set_folding_mode(cm, state.stab);
    return state.stab;
};


function set_folding_mode(cm, mode){
    if(mode === "OVERVIEW"){
        folding_mode_overview(cm);
    }else if(mode === "SHOW_ALL"){
        folding_mode_all(cm);
    }else if(mode === "CONTENT"){
        folding_mode_content(cm);
    }
    cm.refresh();

    function folding_mode_overview(cm){
        cm.operation(function() {
            for (var i = cm.firstLine(), e = cm.lastLine(); i <= e; i++){
                fold(cm, CodeMirror.Pos(i, 0));
            }
        });
    }
    function folding_mode_content(cm){
        cm.operation(function() {
            var previous_header = null;
            for (var i = cm.firstLine(), e = cm.lastLine(); i <= e; i++){
                fold(cm, CodeMirror.Pos(i, 0));
                if(/header/.test(cm.getTokenTypeAt(CodeMirror.Pos(i, 0))) === true){
                    var level = cm.getLine(i).replace(/^(\*+).*/, "$1").length;
                    if(previous_header && level > previous_header.level){
                        unfold(cm, CodeMirror.Pos(previous_header.line, 0));
                    }
                    previous_header = {
                        line: i,
                        level: level
                    };
                }
            }
        });
    }
    function folding_mode_all(cm){
        cm.operation(function() {
            for (var i = cm.firstLine(), e = cm.lastLine(); i <= e; i++){
                if(/header/.test(cm.getTokenTypeAt(CodeMirror.Pos(i, 0))) === true){
                    unfold(cm, CodeMirror.Pos(i, 0));
                }
            }
        });
    }
}


/*
 * Promote heading or move table column to left.
 */
var org_metaleft = function (cm) {
    var line = cm.getCursor().line;
    _metaleft(cm, line);
};
function _metaleft(cm, line){
    var p = null;
    if(p = isTitle(cm, line)){
        if(p['level'] > 1) cm.replaceRange('', {line: p.start, ch: 0}, {line: p.start, ch: 1});
    }else if(p = isItemList(cm, line)){
        for(var i=p.start; i<=p.end; i++){
            if(p['level'] > 0) cm.replaceRange('', {line: i, ch: 0}, {line: i, ch: 2});
        }
    }else if(p = isNumberedList(cm, line)){
        for(var i=p.start; i<=p.end; i++){
            if(p['level'] > 0) cm.replaceRange('', {line: i, ch: 0}, {line: i, ch: 3});
        }
        rearrange_list(cm, line);
    }
}

/*
 * Demote a subtree, a list item or move table column to right.
 * In front of a drawer or a block keyword, indent it correctly.
 */
var org_metaright = function (cm){
    var line = cm.getCursor().line;
    _metaright(cm, line);
};

function _metaright(cm, line) {
    var p = null, tmp = null;
    if(p = isTitle(cm, line)){
        cm.replaceRange('*', {line: p.start, ch: 0});
    }else if(p = isItemList(cm, line)){
        if(tmp = isItemList(cm, p.start - 1)){
            if(p.level < tmp.level + 1){
                for(var i=p.start; i<=p.end; i++){
                    cm.replaceRange('  ', {line: i, ch: 0});
                }
            }
        }
    }else if(p = isNumberedList(cm, line)){
        if(tmp = isNumberedList(cm, p.start - 1)){
            if(p.level < tmp.level + 1){
                for(var i=p.start; i<=p.end; i++){
                    cm.replaceRange('   ', {line: i, ch: 0});
                }
                rearrange_list(cm, p.start);
            }
        }
    }
}

/*
 * Insert a new heading or wrap a region in a table
 */
var org_meta_return = function (cm) {
    var line = cm.getCursor().line,
          content = cm.getLine(line);
    var p = null;

    if(p = isItemList(cm, line)){
        var level = p.level;
        cm.replaceRange('\n'+" ".repeat(level*2)+'- ', {line: p.end, ch: cm.getLine(p.end).length});
        cm.setCursor({line: p.end+1, ch: level*2+2});
    }else if(p = isNumberedList(cm, line)){
        var level = p.level;
        cm.replaceRange('\n'+" ".repeat(level*3)+(p.n+1)+'. ', {line: p.end, ch: cm.getLine(p.end).length});
        cm.setCursor({line: p.end+1, ch: level*3+3});
        rearrange_list(cm, line);
    }else if(p = isTitle(cm, line)){
        var tmp = previousOfType(cm, 'title', line);
        var level = tmp && tmp.level || 1;
        cm.replaceRange('\n'+'*'.repeat(level)+' ', {line: line, ch: content.length});
        cm.setCursor({line: line+1, ch: level+1});
    }else if(content.trim() === ""){
        cm.replaceRange('* ', {line: line, ch: 0});
        cm.setCursor({line: line, ch: 2});
    }else{
        cm.replaceRange('\n\n* ', {line: line, ch: content.length});
        cm.setCursor({line: line + 2, ch: 2});
    }
};


var TODO_CYCLES = ["TODO", "DONE", ""];
/*
 * Cycle the thing at point or in the current line, depending on context.
 * Depending on context, this does one of the following:
 * - TODO: switch a timestamp at point one day into the past
 * - DONE: on a headline, switch to the previous TODO keyword.
 * - TODO: on an item, switch entire list to the previous bulvar type
 * - TODO: on a property line, switch to the previous allowed value
 * - TODO: on a clocktable definition line, move time block into the past
 */
var org_shiftleft = function (cm) {
    var cycles = [].concat(TODO_CYCLES.slice(0).reverse(), TODO_CYCLES.slice(-1)),
          line = cm.getCursor().line,
          content = cm.getLine(line),
          params = isTitle(cm, line);

    if(params === null) return;
    params['status'] = cycles[cycles.indexOf(params['status']) + 1];
    cm.replaceRange(makeTitle(params), {line: line, ch: 0}, {line: line, ch: content.length});
};
/*
 * Cycle the thing at point or in the current line, depending on context.
 * Depending on context, this does one of the following:
 * - TODO: switch a timestamp at point one day into the future
 * - DONE: on a headline, switch to the next TODO keyword.
 * - TODO: on an item, switch entire list to the next bulvar type
 * - TODO: on a property line, switch to the next allowed value
 * - TODO: on a clocktable definition line, move time block into the future
 */
var org_shiftright = function (cm) {
    cm.operation(function () {
        var cycles = [].concat(TODO_CYCLES, [TODO_CYCLES[0]]),
              line = cm.getCursor().line,
              content = cm.getLine(line),
              params = isTitle(cm, line);

        if(params === null) return;
        params['status'] = cycles[cycles.indexOf(params['status']) + 1];
        cm.replaceRange(makeTitle(params), {line: line, ch: 0}, {line: line, ch: content.length});
    });
};

var org_insert_todo_heading = function (cm) {
    cm.operation(function () {
        var line = cm.getCursor().line,
              content = cm.getLine(line);

        var p = null;
        if(p = isItemList(cm, line)){
            var level = p.level;
            cm.replaceRange('\n'+" ".repeat(level*2)+'- [ ] ', {line: p.end, ch: cm.getLine(p.end).length});
            cm.setCursor({line: line+1, ch: 6+level*2});
        }else if(p = isNumberedList(cm, line)){
            var level = p.level;
            cm.replaceRange('\n'+" ".repeat(level*3)+(p.n+1)+'. [ ] ', {line: p.end, ch: cm.getLine(p.end).length});
            cm.setCursor({line: p.end+1, ch: level*3+7});
            rearrange_list(cm, line);
        }else if(p = isTitle(cm, line)){
            var level = p && p.level || 1;
            cm.replaceRange('\n'+"*".repeat(level)+' TODO ', {line: line, ch: content.length});
            cm.setCursor({line: line+1, ch: level+6});
        }else if(content.trim() === ""){
            cm.replaceRange('* TODO ', {line: line, ch: 0});
            cm.setCursor({line: line, ch: 7});
        }else{
            cm.replaceRange('\n\n* TODO ', {line: line, ch: content.length});
            cm.setCursor({line: line + 2, ch: 7});
        }
    });
}


/*
 * Move subtree up or move table row up.
 * Calls ‘org-move-subtree-up’ or ‘org-table-move-row’ or
 * ‘org-move-item-up’, depending on context
 */
var org_metaup = function (cm) {
    cm.operation(function () {
        var line = cm.getCursor().line;
        var p = null;

        if(p = isItemList(cm, line)){
            var a = isItemList(cm, p.start - 1);
            if(a){
                swap(cm, [p.start, p.end], [a.start, a.end]);
                rearrange_list(cm, line);
            }
        }else if(p = isNumberedList(cm, line)){
            var a = isNumberedList(cm, p.start - 1);
            if(a){
                swap(cm, [p.start, p.end], [a.start, a.end]);
                rearrange_list(cm, line);
            }
        }else if(p = isTitle(cm, line)){
            var _line = line,
                a;
            do{
                _line -= 1;
                if(a = isTitle(cm, _line, p.level)){
                    break;
                }
            }while(_line > 0);

            if(a){
                swap(cm, [p.start, p.end], [a.start, a.end]);
                org_set_fold(cm);
            }
        }
    });
}

/*
 * Move subtree down or move table row down.
 * Calls ‘org-move-subtree-down’ or ‘org-table-move-row’ or
 * ‘org-move-item-down’, depending on context
 */
var org_metadown = function (cm) {
    cm.operation(function () {
        var line = cm.getCursor().line;
        var p = null;

        if(p = isItemList(cm, line)){
            var a = isItemList(cm, p.end + 1);
            if(a){
                swap(cm, [p.start, p.end], [a.start, a.end]);
            }
        }else if(p = isNumberedList(cm, line)){
            var a = isNumberedList(cm, p.end + 1);
            if(a){
                swap(cm, [p.start, p.end], [a.start, a.end]);
            }
            rearrange_list(cm, line);
        }else if(p = isTitle(cm, line)){
            var a = isTitle(cm, p.end + 1, p.level);
            if(a){
                swap(cm, [p.start, p.end], [a.start, a.end]);
                org_set_fold(cm);
            }
        }
    });
}



var org_shiftmetaright = function(cm) {
    cm.operation(function () {
        var line = cm.getCursor().line;
        var p = null;
        if(p = isTitle(cm, line)){
            _metaright(cm, line);
            for(var i=p.start + 1; i<=p.end; i++){
                if(isTitle(cm, i)){
                    _metaright(cm, i);
                }
            }
        }
    });
};

var org_shiftmetaleft = function(cm){
    cm.operation(function () {
        var line = cm.getCursor().line;
        var p = null;
        if(p = isTitle(cm, line)){
            if(p.level === 1) return;
            _metaleft(cm, line);
            for(var i=p.start + 1; i<=p.end; i++){
                if(isTitle(cm, i)){
                    _metaleft(cm, i);
                }
            }
        }
    });
};



function makeTitle(p){
    var content = "*".repeat(p['level'])+" ";
    if(p['status']){
        content += p['status']+" ";
    }
    content += p['content'];
    return content;
}

function previousOfType(cm, type, line){
    var content, tmp, i;
    for(i=line - 1; i>0; i--){
        if(type === 'list' || type === null){
            tmp = isItemList(cm, line);
        }else if(type === 'numbered' || type === null){
            tmp = isNumberedList(cm, line);
        }else if(type === 'title' || type === null){
            tmp = isTitle(cm, line);
        }
        if(tmp !== null){
            return tmp;
        }
    }
    return null;
}

function isItemList(cm, line){
    var rootLineItem = findRootLine(cm, line);
    if(rootLineItem === null) return null;
    line = rootLineItem;
    var content = cm.getLine(line);

    if(content && (content.trimLeft()[0] !== "-" || content.trimLeft()[1] !== " ")) return null;
    var padding = content.replace(/^(\s*).*$/, "$1").length;
    if(padding % 2 !== 0) return null;
    return {
        type: 'list',
        level: padding / 2,
        content: content.trimLeft().replace(/^\s*\-\s(.*)$/, '$1'),
        start: line,
        end: function(_cm, _line){
            var line_candidate = _line,
                content = null;
            do{
                _line += 1;
                content = _cm.getLine(_line);
                if(content === undefined || content.trimLeft()[0] === "-"){
                    break;
                }else if(/^\s+/.test(content)){
                    line_candidate = _line;
                    continue;
                }else{
                    break;
                }
            }while(_line <= _cm.lineCount())
            return line_candidate;
        }(cm, line)
    };

    function findRootLine(_cm, _line){
        var content;
        do{
            content = _cm.getLine(_line);
            if(/^\s*\-/.test(content)) return _line;
            else if(/^\s+/.test(content) === false){
                break;
            }
            _line -= 1;
        }while(_line >= 0);
        return null;
    }

}
function isNumberedList(cm, line){
    var rootLineItem = findRootLine(cm, line);
    if(rootLineItem === null) return null;
    line = rootLineItem;
    var content = cm.getLine(line);

    if(/^[0-9]+[\.\)]\s.*$/.test(content && content.trimLeft()) === false) return null;
    var padding = content.replace(/^(\s*)[0-9]+.*$/, "$1").length;
    if(padding % 3 !== 0) return null;
    return {
        type: 'numbered',
        level: padding / 3,
        content: content.trimLeft().replace(/^[0-9]+[\.\)]\s(.*)$/, '$1'),
        start: line,
        end: function(_cm, _line){
            var line_candidate = _line,
                content = null;
            do{
                _line += 1;
                content = _cm.getLine(_line);
                if(content === undefined || /^[0-9]+[\.\)]/.test(content.trimLeft())){
                    break;
                }else if(/^\s+/.test(content)){
                    line_candidate = _line;
                    continue;
                }else{
                    break;
                }
            }while(_line <= _cm.lineCount())
            return line_candidate;
        }(cm, line),
        // specific
        n: parseInt(content.trimLeft().replace(/^([0-9]+).*$/, "$1")),
        separator: content.trimLeft().replace(/^[0-9]+([\.\)]).*$/, '$1')
    };


    function findRootLine(_cm, _line){
        var content;
        do{
            content = _cm.getLine(_line);
            if(/^\s*[0-9]+[\.\)]\s/.test(content)) return _line;
            else if(/^\s+/.test(content) === false){
                break;
            }
            _line -= 1;
        }while(_line >= 0);
        return null;
    }
}
function isTitle(cm, line, level){
    var content = cm.getLine(line);
    if(/^\*+\s/.test(content) === false) return null;
    var match = content.match(/^(\*+)([\sA-Z]*)\s(.*)$/);
    var reference_level = match[1].length;
    if(level !== undefined && level !== reference_level){ return null; }
    if(match === null) return null;
    return {
        type: 'title',
        level: reference_level,
        content: match[3],
        start: line,
        end: function(_cm, _line){
            var line_candidate = _line,
                content = null;
            do{
                _line += 1;
                content = _cm.getLine(_line);
                if(content === undefined) break;
                var match = content.match(/^(\*+)\s.*/);
                if(match && match[1] && ( match[1].length === reference_level || match[1].length < reference_level)){
                    break;
                }else{
                    line_candidate = _line;
                    continue;
                }
            }while(_line <= _cm.lineCount())
            return line_candidate;
        }(cm, line),
        // specific
        status: match[2].trim()
    };
}

function rearrange_list(cm, line){
    var line_inferior = find_limit_inferior(cm, line);
    var line_superior = find_limit_superior(cm, line);

    var last_p = null, p;

    for(var i=line_inferior; i<=line_superior; i++){
        if(p = isNumberedList(cm, i)){
            // rearrange numbers on the numbered list
            if(last_p){
                if(p.level === last_p.level){
                    var tmp = findLastAtLevel(cm, p.start, line_inferior, p.level);
                    if(tmp && p.n !== tmp.n + 1) setNumber(cm, p.start, tmp.n + 1);
                }else if(p.level > last_p.level){
                    if(p.n !== 1){
                        setNumber(cm, p.start, 1);
                    }
                }else if(p.level < last_p.level){
                    var tmp = findLastAtLevel(cm, p.start, line_inferior, p.level);
                    if(tmp && p.n !== tmp.n + 1) setNumber(cm, p.start, tmp.n + 1);
                }
            }else{
                if(p.n !== 1){ setNumber(cm, p.start, 1); }
            }
        }


        if(p = (isNumberedList(cm, i) || isItemList(cm, i))){
            // rearrange spacing levels in list
            if(last_p){
                if(p.level > last_p.level){
                    if(p.level !== last_p.level + 1){
                        setLevel(cm, [p.start, p.end], last_p.level + 1, p.type);
                    }
                }
            }else{
                if(p.level !== 0){
                    setLevel(cm, [p.start, p.end], 0, p.type);
                }
            }
        }


        last_p = p;
        // we can process content block instead of line
        if(p){
            i += (p.end - p.start);
        }
    }

    function findLastAtLevel(_cm, line, line_limit_inf, level){
        var p;
        do{
            line -= 1;
            if((p = isNumberedList(_cm, line)) && p.level === level)
                return p;
        }while(line > line_limit_inf);

        return null;
    }

    function setLevel(_cm, range, level, type){
        var content, i;
        for(i=range[0]; i<=range[1]; i++){
            content = cm.getLine(i).trimLeft();
            var n_spaces = function(_level, _line, _type){
                var spaces = _level * 3;
                if(_line > 0){
                    spaces += _type === 'numbered' ? 3 : 2;
                }
                return spaces;
            }(level, i - range[0], type)

            content = " ".repeat(n_spaces) + content;
            cm.replaceRange(content, {line: i, ch: 0}, {line: i, ch: _cm.getLine(i).length});
        }
    }

    function setNumber(_cm, line, level){
        var content = _cm.getLine(line);
        var new_content = content.replace(/[0-9]+\./, level+".");
        cm.replaceRange(new_content, {line: line, ch: 0}, {line: line, ch: content.length});
    }

    function find_limit_inferior(_cm, _line){
        var content, p, match, line_candidate = _line;
        do{
            content = _cm.getLine(_line);
            p = isNumberedList(_cm, _line);
            match = /(\s+).*$/.exec(content);
            if(p){ line_candidate = _line;}
            if(!p || !match) break;
            _line -= 1;
        }while(_line >= 0);
        return line_candidate;
    }
    function find_limit_superior(_cm, _line){
        var content, p, match, line_candidate = _line;
        do{
            content = _cm.getLine(_line);
            p = isNumberedList(_cm, _line);
            match = /(\s+).*$/.exec(content);
            if(p){ line_candidate = _line;}
            if(!p || !match) break;
            _line += 1;
        }while(_line < _cm.lineCount());
        return line_candidate;
    }
}

function swap(cm, from, to){
    var from_content = cm.getRange({line: from[0], ch: 0}, {line: from[1], ch: cm.getLine(from[1]).length}),
          to_content = cm.getRange({line: to[0], ch: 0}, {line: to[1], ch: cm.getLine(to[1]).length}),
          cursor = cm.getCursor();

    if(to[0] > from[0]){
        // moving down
        cm.replaceRange(
            from_content,
            {line: to[0], ch:0},
            {line: to[1], ch: cm.getLine(to[1]).length}
        );
        cm.replaceRange(
            to_content,
            {line: from[0], ch:0},
            {line: from[1], ch: cm.getLine(from[1]).length}
        );
        cm.setCursor({
            line: cursor.line + (to[1] - to[0] + 1),
            ch: cursor.ch
        });
    }else{
        // moving up
        cm.replaceRange(
            to_content,
            {line: from[0], ch:0},
            {line: from[1], ch: cm.getLine(from[1]).length}
        );
        cm.replaceRange(
            from_content,
            {line: to[0], ch:0},
            {line: to[1], ch: cm.getLine(to[1]).length}
        );
        cm.setCursor({
            line: cursor.line - (to[1] - to[0] + 1),
            ch: cursor.ch
        });
    }
}



});
