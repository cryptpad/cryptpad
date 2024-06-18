// Parts from Ace; see <https://raw.githubusercontent.com/ajaxorg/ace/master/LICENSE>
// Ace highlight rules function imported below.
    
(function(mod) {
    "use strict";
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("cm/lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["cm/lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
    "use strict";
    CodeMirror.defineMode("asciidoc", function() {
        
        var HighlightRules = function () {
          var identifierRe = "[a-zA-Z\u00a1-\uffff]+\\b";

          this.$rules = {
            "start": [
              {token: "empty", regex: /$/},
              {token: "literal", regex: /^\.{4,}\s*$/, next: "listingBlock"},
              {token: "literal", regex: /^-{4,}\s*$/, next: "literalBlock"},
              {token: "literal", regex: /^\+{4,}\s*$/, next: "passthroughBlock"},
              {token: "keyword", regex: /^={4,}\s*$/},
              {token: "text", regex: /^\s*$/},
              // immediately return to the start mode without matching anything
              {token: "empty", regex: "", next: "dissallowDelimitedBlock"}
            ],

            "dissallowDelimitedBlock": [
              {include: "paragraphEnd"},
              {token: "comment", regex: '^//.+$'},
              {token: "keyword", regex: "^(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION):\\s"},

              {include: "listStart"},
              {token: "literal", regex: /^\s+.+$/, next: "indentedBlock"},
              {token: "empty", regex: "", next: "text"}
            ],

            "paragraphEnd": [
              {token: "doc.comment", regex: /^\/{4,}\s*$/, next: "commentBlock"},
              {token: "tableBlock", regex: /^\s*[|!]=+\s*$/, next: "tableBlock"},
              // open block, ruler
              {token: "keyword", regex: /^(?:--|''')\s*$/, next: "start"},
              {token: "option", regex: /^\[.*\]\s*$/, next: "start"},
              {token: "pageBreak", regex: /^>{3,}$/, next: "start"},
              {token: "literal", regex: /^\.{4,}\s*$/, next: "listingBlock"},
              {token: "titleUnderline", regex: /^(?:={2,}|-{2,}|~{2,}|\^{2,}|\+{2,})\s*$/, next: "start"},
              {token: "singleLineTitle", regex: /^={1,6}\s+\S.*$/, next: "start"},

              {token: "otherBlock", regex: /^(?:\*{2,}|_{2,})\s*$/, next: "start"},
              // .optional title
              {token: "optionalTitle", regex: /^\.[^.\s].+$/, next: "start"}
            ],

            "listStart": [
              {
                token: "keyword",
                regex: /^\s*(?:\d+\.|[a-zA-Z]\.|[ixvmIXVM]+\)|\*{1,5}|-|\.{1,5})\s/,
                next: "listText"
              },
              {token: "meta.tag", regex: /^.+(?::{2,4}|;;)(?: |$)/, next: "listText"},
              // continuation
              {token: "keyword", regex: /^\+\s*$/, next: "start"}
            ],

            "text": [
              {
                token: ["link", "link"],
                regex: /((?:https?:\/\/|ftp:\/\/|file:\/\/|mailto:|callto:)[^\s\[]+)(\[.*?\])/
              },
              {token: ["link", "link"], regex: /(?:https?:\/\/|ftp:\/\/|file:\/\/|mailto:|callto:)[^\s\[]+/},
              {token: "link", regex: /\b[\w\.\/\-]+@[\w\.\/\-]+\b/},
              {include: "macros"},
              {include: "paragraphEnd"},
              {token: "literal", regex: /\+{3,}/, next: "smallPassthrough"},
              {
                token: "escape",
                regex: /\((?:C|TM|R)\)|\.{3}|->|<-|=>|<=|&#(?:\d+|x[a-fA-F\d]+);|(?: |^)--(?=\s+\S)/
              },
              {token: "escape", regex: /\\[_*'`+#]|\\{2}[_*'`+#]{2}/},
              {token: "keyword", regex: /\s\+$/},
              // any word
              {token: "text", regex: identifierRe},
              {
                token: ["keyword", "string", "keyword"],
                regex: /(<<[\w\d\-$]+,)(.*?)(>>|$)/
              },
              {token: "keyword", regex: /<<[\w\d\-$]+,?|>>/},
              {token: "constant.character", regex: /\({2,3}.*?\){2,3}/},
              // List of callouts
              {token: "support.function.list.callout", regex: /^(?:<\d+>|\d+>|>) /, next: "text"},
              // Anchor
              {token: "keyword", regex: /\[\[.+?\]\]/},
              // bibliography
              {token: "support", regex: /^\[{3}[\w\d =\-]+\]{3}/},

              {include: "quotes"},
              // text block end
              {token: "empty", regex: /^\s*$/, next: "start"}
            ],

            "listText": [
              {include: "listStart"},
              {include: "text"}
            ],

            "indentedBlock": [
              {token: "literal", regex: /^[\s\w].+$/, next: "indentedBlock"},
              {token: "literal", regex: "", next: "start"}
            ],

            "listingBlock": [
              {token: "literal", regex: /^\.{4,}\s*$/, next: "dissallowDelimitedBlock"},
              {token: "constant.numeric", regex: '<\\d+>'},
              {token: "literal", regex: '[^<]+'},
              {token: "literal", regex: '<'}
            ],
            "literalBlock": [
              {token: "literal", regex: /^-{4,}\s*$/, next: "dissallowDelimitedBlock"},
              {token: "constant.numeric", regex: '<\\d+>'},
              {token: "literal", regex: '[^<]+'},
              {token: "literal", regex: '<'}
            ],
            "passthroughBlock": [
              {token: "literal", regex: /^\+{4,}\s*$/, next: "dissallowDelimitedBlock"},
              {token: "literal", regex: identifierRe + "|\\d+"},
              {include: "macros"},
              {token: "literal", regex: "."}
            ],

            "smallPassthrough": [
              {token: "literal", regex: /[+]{3,}/, next: "dissallowDelimitedBlock"},
              {token: "literal", regex: /^\s*$/, next: "dissallowDelimitedBlock"},
              {token: "literal", regex: identifierRe + "|\\d+"},
              {include: "macros"}
            ],

            "commentBlock": [
              {token: "doc.comment", regex: /^\/{4,}\s*$/, next: "dissallowDelimitedBlock"},
              {token: "doc.comment", regex: '^.*$'}
            ],
            "tableBlock": [
              {token: "tableBlock", regex: /^\s*\|={3,}\s*$/, next: "dissallowDelimitedBlock"},
              {token: "tableBlock", regex: /^\s*!={3,}\s*$/, next: "innerTableBlock"},
              {token: "tableBlock", regex: /\|/},
              {include: "text", noEscape: true}
            ],
            "innerTableBlock": [
              {token: "tableBlock", regex: /^\s*!={3,}\s*$/, next: "tableBlock"},
              {token: "tableBlock", regex: /^\s*|={3,}\s*$/, next: "dissallowDelimitedBlock"},
              {token: "tableBlock", regex: /\!/}
            ],
            "macros": [
              {token: "macro", regex: /{[\w\-$]+}/},
              {
                token: ["text", "string", "text", "constant.character", "text"],
                regex: /({)([\w\-$]+)(:)?(.+)?(})/
              },
              {
                token: ["text", "markup.list.macro", "keyword", "string"],
                regex: /(\w+)(footnote(?:ref)?::?)([^\s\[]+)?(\[.*?\])?/
              },
              {
                token: ["markup.list.macro", "keyword", "string"],
                regex: /([a-zA-Z\-][\w\.\/\-]*::?)([^\s\[]+)(\[.*?\])?/
              },
              {token: ["markup.list.macro", "keyword"], regex: /([a-zA-Z\-][\w\.\/\-]+::?)(\[.*?\])/},
              {token: "keyword", regex: /^:.+?:(?= |$)/}
            ],

            "quotes": [
              {token: "string.italic", regex: /__[^_\s].*?__/},
              {token: "string.italic", regex: quoteRule("_")},

              {token: "keyword.bold", regex: /\*\*[^*\s].*?\*\*/},
              {token: "keyword.bold", regex: quoteRule("\\*")},

              {token: "literal", regex: /\+\+[^+\s].*?\+\+/},
              {token: "literal", regex: quoteRule("\\+")},

              {token: "literal", regex: /\$\$.+?\$\$/},
              {token: "literal", regex: quoteRule("\\$")},

              {token: "literal", regex: /``[^`\s].*?``/},
              {token: "literal", regex: quoteRule("`")},

              {token: "keyword", regex: /\^[^\^].*?\^/},
              {token: "keyword", regex: quoteRule("\\^")},
              {token: "keyword", regex: /~[^~].*?~/},
              {token: "keyword", regex: quoteRule("~")},

              {token: "keyword", regex: /##?/},
              {token: "keyword", regex: /(?:\B|^)``|\b''/}
            ]

          };

          function quoteRule(ch) {
            var prefix = /\w/.test(ch) ? "\\b" : "(?:\\B|^)";
            return prefix + ch + "[^" + ch + "].*?" + ch + "(?![\\w*])";
          }

          //addQuoteBlock("text")

          var tokenMap = {
            macro: "constant.character",
            tableBlock: "doc.comment",
            titleUnderline: "markup.heading",
            singleLineTitle: "markup.heading",
            pageBreak: "string",
            option: "string.regexp",
            otherBlock: "markup.list",
            literal: "support.function",
            optionalTitle: "constant.numeric",
            escape: "constant.language.escape",
            link: "markup.underline.list"
          };

          for (var state in this.$rules) {
            var stateRules = this.$rules[state];
            for (var i = stateRules.length; i--;) {
              var rule = stateRules[i];
              if (rule.include || typeof rule == "string") {
                var args = [i, 1].concat(this.$rules[rule.include || rule]);
                if (rule.noEscape) {
                  args = args.filter(function (x) {
                    return !x.next;
                  });
                }
                stateRules.splice.apply(stateRules, args);
              } else if (rule.token in tokenMap) {
                rule.token = tokenMap[rule.token];
              }
            }
          }
        };


        // Ace's Syntax Tokenizer.

        // tokenizing lines longer than this makes editor very slow
        var MAX_TOKEN_COUNT = 1000;
        var Tokenizer = function (rules) {
          this.states = rules;

          this.regExps = {};
          this.matchMappings = {};
          for (var key in this.states) {
            var state = this.states[key];
            var ruleRegExps = [];
            var matchTotal = 0;
            var mapping = this.matchMappings[key] = {defaultToken: "text"};
            var flag = "g";

            var splitterRurles = [];
            for (var i = 0; i < state.length; i++) {
              var rule = state[i];
              if (rule.defaultToken)
                mapping.defaultToken = rule.defaultToken;
              if (rule.caseInsensitive)
                flag = "gi";
              if (rule.regex == null)
                continue;

              if (rule.regex instanceof RegExp)
                rule.regex = rule.regex.toString().slice(1, -1);

              // Count number of matching groups. 2 extra groups from the full match
              // And the catch-all on the end (used to force a match);
              var adjustedregex = rule.regex;
              var matchcount = new RegExp("(?:(" + adjustedregex + ")|(.))").exec("a").length - 2;
              if (Array.isArray(rule.token)) {
                if (rule.token.length == 1 || matchcount == 1) {
                  rule.token = rule.token[0];
                } else if (matchcount - 1 != rule.token.length) {
                  throw new Error("number of classes and regexp groups in '" +
                    rule.token + "'\n'" + rule.regex + "' doesn't match\n"
                    + (matchcount - 1) + "!=" + rule.token.length);
                } else {
                  rule.tokenArray = rule.token;
                  rule.token = null;
                  rule.onMatch = this.$arrayTokens;
                }
              } else if (typeof rule.token == "function" && !rule.onMatch) {
                if (matchcount > 1)
                  rule.onMatch = this.$applyToken;
                else
                  rule.onMatch = rule.token;
              }

              if (matchcount > 1) {
                if (/\\\d/.test(rule.regex)) {
                  // Replace any backreferences and offset appropriately.
                  adjustedregex = rule.regex.replace(/\\([0-9]+)/g, function (match, digit) {
                    return "\\" + (parseInt(digit, 10) + matchTotal + 1);
                  });
                } else {
                  matchcount = 1;
                  adjustedregex = this.removeCapturingGroups(rule.regex);
                }
                if (!rule.splitRegex && typeof rule.token != "string")
                  splitterRurles.push(rule); // flag will be known only at the very end
              }

              mapping[matchTotal] = i;
              matchTotal += matchcount;

              ruleRegExps.push(adjustedregex);

              // makes property access faster
              if (!rule.onMatch)
                rule.onMatch = null;
            }

            splitterRurles.forEach(function (rule) {
              rule.splitRegex = this.createSplitterRegexp(rule.regex, flag);
            }, this);

            this.regExps[key] = new RegExp("(" + ruleRegExps.join(")|(") + ")|($)", flag);
          }
        };

        (function () {
          this.$setMaxTokenCount = function (m) {
            MAX_TOKEN_COUNT = m | 0;
          };

          this.$applyToken = function (str) {
            var values = this.splitRegex.exec(str).slice(1);
            var types = this.token.apply(this, values);

            // required for compatibility with old modes
            if (typeof types === "string")
              return [{type: types, value: str}];

            var tokens = [];
            for (var i = 0, l = types.length; i < l; i++) {
              if (values[i])
                tokens[tokens.length] = {
                  type: types[i],
                  value: values[i]
                };
            }
            return tokens;
          },

            this.$arrayTokens = function (str) {
              if (!str)
                return [];
              var values = this.splitRegex.exec(str);
              if (!values)
                return "text";
              var tokens = [];
              var types = this.tokenArray;
              for (var i = 0, l = types.length; i < l; i++) {
                if (values[i + 1])
                  tokens[tokens.length] = {
                    type: types[i],
                    value: values[i + 1]
                  };
              }
              return tokens;
            };

          this.removeCapturingGroups = function (src) {
            var r = src.replace(
              /\[(?:\\.|[^\]])*?\]|\\.|\(\?[:=!]|(\()/g,
              function (x, y) {
                return y ? "(?:" : x;
              }
            );
            return r;
          };

          this.createSplitterRegexp = function (src, flag) {
            if (src.indexOf("(?=") != -1) {
              var stack = 0;
              var inChClass = false;
              var lastCapture = {};
              src.replace(/(\\.)|(\((?:\?[=!])?)|(\))|([\[\]])/g, function (m, esc, parenOpen, parenClose, square, index) {
                if (inChClass) {
                  inChClass = square != "]";
                } else if (square) {
                  inChClass = true;
                } else if (parenClose) {
                  if (stack == lastCapture.stack) {
                    lastCapture.end = index + 1;
                    lastCapture.stack = -1;
                  }
                  stack--;
                } else if (parenOpen) {
                  stack++;
                  if (parenOpen.length != 1) {
                    lastCapture.stack = stack
                    lastCapture.start = index;
                  }
                }
                return m;
              });

              if (lastCapture.end != null && /^\)*$/.test(src.substr(lastCapture.end)))
                src = src.substring(0, lastCapture.start) + src.substr(lastCapture.end);
            }
            return new RegExp(src, (flag || "").replace("g", ""));
          };

          /**
           * Returns an object containing two properties: `tokens`, which contains all the tokens; and `state`, the current state.
           * @returns {Object}
           **/
          this.getLineTokens = function (line, startState) {
            if (startState && typeof startState != "string") {
              var stack = startState.slice(0);
              startState = stack[0];
            } else
              var stack = [];

            var currentState = startState || "start";
            var state = this.states[currentState];
            if (!state) {
              currentState = "start";
              state = this.states[currentState];
            }
            var mapping = this.matchMappings[currentState];
            var re = this.regExps[currentState];
            re.lastIndex = 0;

            var match, tokens = [];
            var lastIndex = 0;

            var token = {type: null, value: ""};

            while (match = re.exec(line)) {
              var type = mapping.defaultToken;
              var rule = null;
              var value = match[0];
              var index = re.lastIndex;

              if (index - value.length > lastIndex) {
                var skipped = line.substring(lastIndex, index - value.length);
                if (token.type == type) {
                  token.value += skipped;
                } else {
                  if (token.type)
                    tokens.push(token);
                  token = {type: type, value: skipped};
                }
              }

              for (var i = 0; i < match.length - 2; i++) {
                if (match[i + 1] === undefined)
                  continue;

                rule = state[mapping[i]];

                if (rule.onMatch)
                  type = rule.onMatch(value, currentState, stack);
                else
                  type = rule.token;

                if (rule.next) {
                  if (typeof rule.next == "string")
                    currentState = rule.next;
                  else
                    currentState = rule.next(currentState, stack);

                  state = this.states[currentState];
                  if (!state) {
                    window.console && console.error && console.error(currentState, "doesn't exist");
                    currentState = "start";
                    state = this.states[currentState];
                  }
                  mapping = this.matchMappings[currentState];
                  lastIndex = index;
                  re = this.regExps[currentState];
                  re.lastIndex = index;
                }
                break;
              }

              if (value) {
                if (typeof type == "string") {
                  if ((!rule || rule.merge !== false) && token.type === type) {
                    token.value += value;
                  } else {
                    if (token.type)
                      tokens.push(token);
                    token = {type: type, value: value};
                  }
                } else if (type) {
                  if (token.type)
                    tokens.push(token);
                  token = {type: null, value: ""};
                  for (var i = 0; i < type.length; i++)
                    tokens.push(type[i]);
                }
              }

              if (lastIndex == line.length)
                break;

              lastIndex = index;

              if (tokens.length > MAX_TOKEN_COUNT) {
                // chrome doens't show contents of text nodes with very long text
                while (lastIndex < line.length) {
                  if (token.type)
                    tokens.push(token);
                  token = {
                    value: line.substring(lastIndex, lastIndex += 2000),
                    type: "overflow"
                  };
                }
                currentState = "start";
                stack = [];
                break;
              }
            }

            if (token.type)
              tokens.push(token);

            if (stack.length > 1) {
              if (stack[0] !== currentState)
                stack.unshift(currentState);
            }
            return {
              tokens: tokens,
              state: stack.length ? stack : currentState
            };
          };

        }).call(Tokenizer.prototype);

        // Token conversion.
        // See <https://github.com/ajaxorg/ace/wiki/Creating-or-Extending-an-Edit-Mode#common-tokens>
        // This is not an exact match nor the best match that can be made.
        var tokenFromAceToken = {
          empty: null,
          text: null,

          // Keyword
          keyword: 'keyword',
          control: 'keyword',
          operator: 'operator',

          // Constants
          constant: 'atom',
          numeric: 'number',
          character: 'atom',
          escape: 'atom',

          // Variables
          variable: 'variable',
          parameter: 'variable-3',
          language: 'variable-2',  // Python's `self` uses that.

          // Comments
          comment: 'comment',
          line: 'comment',
          'double-slash': 'comment',
          'double-dash': 'comment',
          'number-sign': 'comment',
          percentage: 'comment',
          block: 'comment',
          doc: 'comment',

          // String
          string: 'string',
          quoted: 'string',
          single: 'string',
          double: 'string',
          triple: 'string',
          unquoted: 'string',
          interpolated: 'string',
          regexp: 'string-2',

          meta: 'keyword',
          literal: 'qualifier',
          support: 'builtin',

          // Markup
          markup: 'tag',
          underline: 'link',
          link: 'link',
          strong: 'strong',
          heading: 'header',
          em: 'em',
          list: 'variable-2',
          numbered: 'variable-2',
          unnumbered: 'variable-2',
          quote: 'quote',
          raw: 'variable-2',  // Markdown's raw block uses that.

          // Invalid
          invalid: 'error',
          illegal: 'invalidchar',
          deprecated: 'error'
        };

        // Takes a list of Ace tokens, returns a (string) CodeMirror token.
        var cmTokenFromAceTokens = function (tokens) {
          var token = null;
          for (var i = 0; i < tokens.length; i++) {
            // Find the most specific token.
            if (tokenFromAceToken[tokens[i]] !== undefined) {
              token = tokenFromAceToken[tokens[i]];
            }
          }
          return token;
        };

        // Consume a token from plannedTokens.
        var consumeToken = function (stream, state) {
          var plannedToken = state.plannedTokens.shift();
          if (plannedToken === undefined) {
            return null;
          }
          stream.match(plannedToken.value);
          var tokens = plannedToken.type.split('.');
          return cmTokenFromAceTokens(tokens);
        };

        var matchToken = function (stream, state) {
          // Anormal start: we already have planned tokens to consume.
          if (state.plannedTokens.length > 0) {
            return consumeToken(stream, state);
          }

          // Normal start.
          var currentState = state.current;
          var currentLine = stream.match(/.*$/, false)[0];
          var tokenized = tokenizer.getLineTokens(currentLine, currentState);
          // We got a {tokens, state} object.
          // Each token is a {value, type} object.
          state.plannedTokens = tokenized.tokens;
          state.current = tokenized.state;

          // Consume a token.
          return consumeToken(stream, state);
        }

        // Initialize all state.
        var aceHighlightRules = new HighlightRules();
        var tokenizer = new Tokenizer(aceHighlightRules.$rules);
        
        var asciidoc = {
          startState: function () {
            return {
              current: 'start',
              // List of {value, type}, with type being an Ace token string.
              plannedTokens: []
            };
          },
          blankLine: function (state) {
            matchToken('', state);
          },
          token: matchToken
        };
        return asciidoc;
    });

    CodeMirror.defineMIME('text/asciidoc', 'asciidoc');
});
