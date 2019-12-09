define([
    'cm/lib/codemirror',
    'cm/addon/mode/simple'
], function (CodeMirror) {
    CodeMirror.__mode = 'orgmode';

    CodeMirror.defineSimpleMode("orgmode", {
        start: [
            {regex: /(\*\s)(TODO|DOING|WAITING|NEXT|PENDING|)(CANCELLED|CANCELED|CANCEL|DONE|REJECTED|STOP|STOPPED|)(\s+\[\#[A-C]\]\s+|)(.*?)(?:(\s{10,}|))(\:[\S]+\:|)$/, sol: true, token: ["header level1 org-level-star","header level1 org-todo","header level1 org-done", "header level1 org-priority", "header level1", "header level1 void", "header level1 comment"]},
            {regex: /(\*{1,}\s)(TODO|DOING|WAITING|NEXT|PENDING|)(CANCELLED|CANCELED|CANCEL|DEFERRED|DONE|REJECTED|STOP|STOPPED|)(\s+\[\#[A-C]\]\s+|)(.*?)(?:(\s{10,}|))(\:[\S]+\:|)$/, sol: true, token: ["header org-level-star","header org-todo","header org-done", "header org-priority", "header", "header void", "header comment"]},
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

});
