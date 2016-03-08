(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["nf"] = factory();
	else
		root["nf"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _Facade = __webpack_require__(1);

	var _Facade2 = _interopRequireDefault(_Facade);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	module.exports = new _Facade2.default();

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _WebChannel = __webpack_require__(2);

	var _WebChannel2 = _interopRequireDefault(_WebChannel);

	var _ServiceProvider = __webpack_require__(4);

	var _ServiceProvider2 = _interopRequireDefault(_ServiceProvider);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Facade = function () {
	  function Facade() {
	    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    _classCallCheck(this, Facade);

	    this.defaults = {
	      webrtc: {}
	    };
	    this.settings = Object.assign({}, this.defaults, options);
	  }

	  _createClass(Facade, [{
	    key: 'create',
	    value: function create() {
	      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	      return new _WebChannel2.default();
	    }
	  }, {
	    key: 'join',
	    value: function join(key) {
	      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	      var defaults = {
	        connector: 'WebRTCService',
	        protocol: 'ExchangeProtocolService'
	      };
	      var settings = Object.assign({}, defaults, options);
	      var connector = _ServiceProvider2.default.get(settings.connector);
	      var protocol = _ServiceProvider2.default.get(settings.protocol);
	      var connectorOptions = { signaling: settings.signaling, facade: this };
	      return new Promise(function (resolve, reject) {
	        connector.join(key, connectorOptions).then(function (channel) {
	          var webChannel = new _WebChannel2.default(options);
	          channel.webChannel = webChannel;
	          channel.onmessage = protocol.onmessage;
	          webChannel.channels.add(channel);
	          webChannel.onopen = function () {
	            resolve(webChannel);
	          };
	        });
	      });
	    }
	  }, {
	    key: 'invite',
	    value: function invite() {
	      // TODO
	    }
	  }, {
	    key: '_onJoining',
	    value: function _onJoining() {
	      // TODO
	    }
	  }, {
	    key: '_onLeaving',
	    value: function _onLeaving() {
	      // TODO
	    }
	  }, {
	    key: '_onMessage',
	    value: function _onMessage() {
	      // TODO
	    }
	  }, {
	    key: '_onPeerMessage',
	    value: function _onPeerMessage() {
	      // TODO
	    }
	  }, {
	    key: '_onInvite',
	    value: function _onInvite() {
	      // TODO
	    }
	  }]);

	  return Facade;
	}();

	exports.default = Facade;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _constants = __webpack_require__(3);

	var cs = _interopRequireWildcard(_constants);

	var _ServiceProvider = __webpack_require__(4);

	var _ServiceProvider2 = _interopRequireDefault(_ServiceProvider);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var WebChannel = function () {
	  function WebChannel() {
	    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    _classCallCheck(this, WebChannel);

	    this.defaults = {
	      connector: cs.WEBRTC_SERVICE,
	      topology: cs.FULLYCONNECTED_SERVICE,
	      protocol: cs.EXCHANGEPROTOCOL_SERVICE
	    };
	    this.settings = Object.assign({}, this.defaults, options);

	    // Private attributes
	    this.protocol = cs.EXCHANGEPROTOCOL_SERVICE;

	    // Public attributes
	    this.id;
	    this.myID = this._generateID();
	    this.channels = new Set();
	    this.onjoining;
	    this.onleaving;
	    this.onmessage;
	  }

	  _createClass(WebChannel, [{
	    key: 'leave',
	    value: function leave() {}
	  }, {
	    key: 'send',
	    value: function send(data) {
	      var protocol = _ServiceProvider2.default.get(this.settings.protocol);
	      this.topologyService.broadcast(this, protocol.message(cs.USER_DATA, { id: this.myID, data: data }));
	    }
	  }, {
	    key: 'openForJoining',
	    value: function openForJoining() {
	      var _this = this;

	      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	      var settings = Object.assign({}, this.settings, options);
	      var connector = _ServiceProvider2.default.get(settings.connector);
	      return connector.open(function (channel) {
	        // 1) New dataChannel connection established.
	        //    NEXT: add it to the network
	        var protocol = _ServiceProvider2.default.get(_this.protocol);
	        _this.topologyService = _ServiceProvider2.default.get(_this.settings.topology);
	        channel.webChannel = _this;
	        channel.onmessage = protocol.onmessage;

	        // 2.1) Send to the new client the webChannel topology name
	        channel.send(protocol.message(cs.JOIN_START, _this.settings.topology));

	        // 2.2) Ask to topology to add the new client to this webChannel
	        _this.topologyService.addStart(channel, _this).then(function (id) {
	          _this.topologyService.broadcast(_this, protocol.message(cs.JOIN_FINISH, id));
	          _this.onJoining(id);
	        });
	      }, settings).then(function (data) {
	        return data;
	      });
	    }
	  }, {
	    key: 'closeForJoining',
	    value: function closeForJoining() {}
	  }, {
	    key: 'isInviting',
	    value: function isInviting() {}
	  }, {
	    key: '_generateID',
	    value: function _generateID() {
	      var MIN_LENGTH = 10;
	      var DELTA_LENGTH = 10;
	      var MASK = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	      var result = '';
	      var length = MIN_LENGTH + Math.round(Math.random() * DELTA_LENGTH);

	      for (var i = 0; i < length; i++) {
	        result += MASK[Math.round(Math.random() * (MASK.length - 1))];
	      }
	      return result;
	    }
	  }, {
	    key: 'topology',
	    set: function set(topologyServiceName) {
	      this.settings.topology = topologyServiceName;
	      this.topologyService = _ServiceProvider2.default.get(topologyServiceName);
	    },
	    get: function get() {
	      return this.settigns.topology;
	    }
	  }]);

	  return WebChannel;
	}();

	exports.default = WebChannel;

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	// API user's message
	var USER_DATA = exports.USER_DATA = 0;

	// Internal messages
	var JOIN_START = exports.JOIN_START = 2;
	var JOIN_FINISH = exports.JOIN_FINISH = 4;
	var YOUR_NEW_ID = exports.YOUR_NEW_ID = 5;

	// Internal message to a specific Service
	var SERVICE_DATA = exports.SERVICE_DATA = 3;

	var WEBRTC_SERVICE = exports.WEBRTC_SERVICE = 'WebRTCService';
	var WEBSOCKET_SERVICE = exports.WEBSOCKET_SERVICE = 'WebSocketService';
	var FULLYCONNECTED_SERVICE = exports.FULLYCONNECTED_SERVICE = 'FullyConnectedService';
	var STAR_SERVICE = exports.STAR_SERVICE = 'StarTopologyService';
	var EXCHANGEPROTOCOL_SERVICE = exports.EXCHANGEPROTOCOL_SERVICE = 'ExchangeProtocolService';
	var WSPROTOCOL_SERVICE = exports.WSPROTOCOL_SERVICE = 'WebSocketProtocolService';

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _constants = __webpack_require__(3);

	var cs = _interopRequireWildcard(_constants);

	var _FullyConnectedService = __webpack_require__(5);

	var _FullyConnectedService2 = _interopRequireDefault(_FullyConnectedService);

	var _StarTopologyService = __webpack_require__(6);

	var _StarTopologyService2 = _interopRequireDefault(_StarTopologyService);

	var _WebRTCService = __webpack_require__(7);

	var _WebRTCService2 = _interopRequireDefault(_WebRTCService);

	var _WebSocketService = __webpack_require__(8);

	var _WebSocketService2 = _interopRequireDefault(_WebSocketService);

	var _ExchangeProtocolService = __webpack_require__(9);

	var _ExchangeProtocolService2 = _interopRequireDefault(_ExchangeProtocolService);

	var _WebSocketProtocolService = __webpack_require__(10);

	var _WebSocketProtocolService2 = _interopRequireDefault(_WebSocketProtocolService);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var services = new Map();

	var ServiceProvider = function () {
	  function ServiceProvider() {
	    _classCallCheck(this, ServiceProvider);
	  }

	  _createClass(ServiceProvider, null, [{
	    key: 'get',
	    value: function get(code) {
	      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	      var service = undefined;
	      switch (code) {
	        case cs.WEBRTC_SERVICE:
	          service = new _WebRTCService2.default(options);
	          break;
	        case cs.WEBSOCKET_SERVICE:
	          service = new _WebSocketService2.default(options);
	          break;
	        case cs.FULLYCONNECTED_SERVICE:
	          service = new _FullyConnectedService2.default(options);
	          break;
	        case cs.STAR_SERVICE:
	          service = new _StarTopologyService2.default(options);
	          break;
	        case cs.EXCHANGEPROTOCOL_SERVICE:
	          service = new _ExchangeProtocolService2.default(options);
	          break;
	        case cs.WSPROTOCOL_SERVICE:
	          service = new _WebSocketProtocolService2.default(options);
	          break;
	      }
	      services.set(code, service);
	      return service;
	    }
	  }]);

	  return ServiceProvider;
	}();

	exports.default = ServiceProvider;

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _constants = __webpack_require__(3);

	var cs = _interopRequireWildcard(_constants);

	var _ServiceProvider = __webpack_require__(4);

	var _ServiceProvider2 = _interopRequireDefault(_ServiceProvider);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var FullyConnectedService = function () {
	  function FullyConnectedService() {
	    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    _classCallCheck(this, FullyConnectedService);
	  }

	  _createClass(FullyConnectedService, [{
	    key: 'addStart',
	    value: function addStart(channel, webChannel) {
	      var _this = this;

	      var protocol = _ServiceProvider2.default.get(cs.EXCHANGEPROTOCOL_SERVICE);
	      return new Promise(function (resolve, reject) {
	        channel.peerID = _this._generateID();
	        channel.send(protocol.message(cs.YOUR_NEW_ID, {
	          newID: channel.peerID,
	          myID: webChannel.myID
	        }));
	        if (Reflect.has(webChannel, 'aboutToJoin') && webChannel.aboutToJoin instanceof Map) {
	          webChannel.aboutToJoin.set(channel.peerID, channel);
	        } else {
	          webChannel.aboutToJoin = new Map();
	        }

	        if (webChannel.channels.size === 0) {
	          webChannel.channels.add(channel);
	          resolve(channel.peerID);
	        } else {
	          (function () {
	            webChannel.successfullyConnected = new Map();
	            webChannel.successfullyConnected.set(channel.peerID, 0);
	            webChannel.connectionSucceed = function (id, withId) {
	              var counter = webChannel.successfullyConnected.get(withId);
	              webChannel.successfullyConnected.set(withId, ++counter);
	              if (webChannel.successfullyConnected.get(withId) === webChannel.channels.size) {
	                _this.addFinish(webChannel, withId);
	                resolve(withId);
	              }
	            };
	            var connector = _ServiceProvider2.default.get(cs.WEBRTC_SERVICE);
	            webChannel.channels.forEach(function (c) {
	              connector.connect(channel.peerID, webChannel, c.peerID);
	            });
	          })();
	        }
	      });
	    }
	  }, {
	    key: 'addFinish',
	    value: function addFinish(webChannel, id) {
	      if (id != webChannel.myID) {
	        webChannel.channels.add(webChannel.aboutToJoin.get(id));
	        //webChannel.aboutToJoin.delete(id)
	        if (Reflect.has(webChannel, 'successfullyConnected')) {
	          webChannel.successfullyConnected.delete(id);
	        }
	      } else {
	        webChannel.onopen();
	      }
	    }
	  }, {
	    key: 'broadcast',
	    value: function broadcast(webChannel, data) {
	      var _iteratorNormalCompletion = true;
	      var _didIteratorError = false;
	      var _iteratorError = undefined;

	      try {
	        for (var _iterator = webChannel.channels[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	          var c = _step.value;

	          c.send(data);
	        }
	      } catch (err) {
	        _didIteratorError = true;
	        _iteratorError = err;
	      } finally {
	        try {
	          if (!_iteratorNormalCompletion && _iterator.return) {
	            _iterator.return();
	          }
	        } finally {
	          if (_didIteratorError) {
	            throw _iteratorError;
	          }
	        }
	      }
	    }
	  }, {
	    key: 'sendTo',
	    value: function sendTo(id, webChannel, data) {
	      var _iteratorNormalCompletion2 = true;
	      var _didIteratorError2 = false;
	      var _iteratorError2 = undefined;

	      try {
	        for (var _iterator2 = webChannel.channels[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	          var c = _step2.value;

	          if (c.peerID == id) {
	            c.send(data);
	          }
	        }
	      } catch (err) {
	        _didIteratorError2 = true;
	        _iteratorError2 = err;
	      } finally {
	        try {
	          if (!_iteratorNormalCompletion2 && _iterator2.return) {
	            _iterator2.return();
	          }
	        } finally {
	          if (_didIteratorError2) {
	            throw _iteratorError2;
	          }
	        }
	      }
	    }
	  }, {
	    key: 'leave',
	    value: function leave(webChannel) {
	      this.broadcast(webChannel);
	    }
	  }, {
	    key: '_generateID',
	    value: function _generateID() {
	      var MIN_LENGTH = 10;
	      var DELTA_LENGTH = 10;
	      var MASK = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	      var length = MIN_LENGTH + Math.round(Math.random() * DELTA_LENGTH);
	      var maskLastIndex = MASK.length - 1;
	      var result = '';

	      for (var i = 0; i < length; i++) {
	        result += MASK[Math.round(Math.random() * maskLastIndex)];
	      }
	      return result;
	    }
	  }]);

	  return FullyConnectedService;
	}();

	exports.default = FullyConnectedService;

/***/ },
/* 6 */
/***/ function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var StarTopologyService = function () {
	  function StarTopologyService() {
	    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    _classCallCheck(this, StarTopologyService);
	  }

	  _createClass(StarTopologyService, [{
	    key: "broadcast",
	    value: function broadcast(webChannel, data) {
	      var _iteratorNormalCompletion = true;
	      var _didIteratorError = false;
	      var _iteratorError = undefined;

	      try {
	        for (var _iterator = webChannel.channels[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	          var c = _step.value;

	          var msg = JSON.stringify([c.seq++, data.type, webChannel.id, data.msg]);
	          c.send(msg);
	        }
	      } catch (err) {
	        _didIteratorError = true;
	        _iteratorError = err;
	      } finally {
	        try {
	          if (!_iteratorNormalCompletion && _iterator.return) {
	            _iterator.return();
	          }
	        } finally {
	          if (_didIteratorError) {
	            throw _iteratorError;
	          }
	        }
	      }
	    }
	  }, {
	    key: "sendTo",
	    value: function sendTo(id, webChannel, data) {
	      var _iteratorNormalCompletion2 = true;
	      var _didIteratorError2 = false;
	      var _iteratorError2 = undefined;

	      try {
	        for (var _iterator2 = webChannel.channels[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	          var c = _step2.value;

	          var msg = JSON.stringify([c.seq++, data.type, id, data.msg]);
	          c.send(msg);
	        }
	      } catch (err) {
	        _didIteratorError2 = true;
	        _iteratorError2 = err;
	      } finally {
	        try {
	          if (!_iteratorNormalCompletion2 && _iterator2.return) {
	            _iterator2.return();
	          }
	        } finally {
	          if (_didIteratorError2) {
	            throw _iteratorError2;
	          }
	        }
	      }
	    }
	  }]);

	  return StarTopologyService;
	}();

	exports.default = StarTopologyService;

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _constants = __webpack_require__(3);

	var cs = _interopRequireWildcard(_constants);

	var _ServiceProvider = __webpack_require__(4);

	var _ServiceProvider2 = _interopRequireDefault(_ServiceProvider);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var WEBRTC_DATA = 0;
	var CONNECT_WITH = 1;
	var CONNECT_WITH_SUCCEED = 2;

	var WebRTCService = function () {
	  function WebRTCService() {
	    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    _classCallCheck(this, WebRTCService);

	    this.NAME = this.constructor.name;
	    this.protocol = _ServiceProvider2.default.get(cs.EXCHANGEPROTOCOL_SERVICE);
	    this.defaults = {
	      signaling: 'ws://localhost:8000',
	      webRTCOptions: {
	        iceServers: [{
	          urls: ['stun:23.21.150.121', 'stun:stun.l.google.com:19302']
	        }, {
	          urls: 'turn:numb.viagenie.ca',
	          credential: 'webrtcdemo',
	          username: 'louis%40mozilla.com'
	        }]
	      }
	    };
	    this.settings = Object.assign({}, this.defaults, options);

	    // Declare WebRTC related global(window) constructors
	    this.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.msRTCPeerConnection;

	    this.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.RTCIceCandidate || window.msRTCIceCandidate;

	    this.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription || window.msRTCSessionDescription;
	  }

	  _createClass(WebRTCService, [{
	    key: 'connect',
	    value: function connect(newPeerID, webChannel, peerID) {
	      webChannel.topologyService.sendTo(peerID, webChannel, this._msg(CONNECT_WITH, { key: newPeerID, intermediaryID: webChannel.myID }));
	    }
	  }, {
	    key: 'open',
	    value: function open(onchannel) {
	      var _this = this;

	      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	      var defaults = {
	        key: this._randomKey()
	      };
	      var settings = Object.assign({}, this.settings, defaults, options);

	      return new Promise(function (resolve, reject) {
	        var connections = [];
	        console.log(settings);
	        var socket = new window.WebSocket(settings.signaling);
	        socket.onopen = function () {
	          socket.send(JSON.stringify({ key: settings.key }));
	          resolve({ url: _this.settings.signaling, key: settings.key });
	        };
	        socket.onmessage = function (e) {
	          var msg = JSON.parse(e.data);
	          if (Reflect.has(msg, 'id') && Reflect.has(msg, 'data')) {
	            if (Reflect.has(msg.data, 'offer')) {
	              (function () {
	                var connection = new _this.RTCPeerConnection(settings.webRTCOptions);
	                connections.push(connection);
	                connection.ondatachannel = function (e) {
	                  e.channel.onopen = function () {
	                    onchannel(e.channel);
	                  };
	                };
	                connection.onicecandidate = function (e) {
	                  if (e.candidate !== null) {
	                    var candidate = {
	                      candidate: e.candidate.candidate,
	                      sdpMLineIndex: e.candidate.sdpMLineIndex
	                    };
	                    socket.send(JSON.stringify({ id: msg.id, data: { candidate: candidate } }));
	                  }
	                };
	                var sd = Object.assign(new _this.RTCSessionDescription(), msg.data.offer);
	                connection.setRemoteDescription(sd, function () {
	                  connection.createAnswer(function (answer) {
	                    connection.setLocalDescription(answer, function () {
	                      socket.send(JSON.stringify({
	                        id: msg.id,
	                        data: { answer: connection.localDescription.toJSON() } }));
	                    }, function () {});
	                  }, function () {});
	                }, function () {});
	              })();
	            } else if (Reflect.has(msg.data, 'candidate')) {
	              var candidate = new _this.RTCIceCandidate(msg.data.candidate);
	              connections[msg.id].addIceCandidate(candidate);
	            }
	          }
	        };
	        socket.onerror = reject;
	      });
	    }
	  }, {
	    key: 'join',
	    value: function join(key) {
	      var _this2 = this;

	      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	      var settings = Object.assign({}, this.settings, options);
	      return new Promise(function (resolve, reject) {
	        var connection = undefined;
	        var socket = new window.WebSocket(settings.signaling);
	        console.log('Socket created');
	        socket.onopen = function () {
	          connection = new _this2.RTCPeerConnection(settings.webRTCOptions);
	          console.log('RTC created');
	          connection.onicecandidate = function (e) {
	            if (e.candidate !== null) {
	              var candidate = {
	                candidate: e.candidate.candidate,
	                sdpMLineIndex: e.candidate.sdpMLineIndex
	              };
	              socket.send(JSON.stringify({ data: { candidate: candidate } }));
	            }
	          };
	          var dc = connection.createDataChannel(key);
	          console.log('data channel created');
	          console.log(dc);
	          dc.onopen = function () {
	            resolve(dc);
	          };
	          connection.createOffer(function (offer) {
	            connection.setLocalDescription(offer, function () {
	              socket.send(JSON.stringify({ join: key, data: { offer: connection.localDescription.toJSON() } }));
	            }, reject);
	          }, reject);
	        };
	        socket.onmessage = function (e) {
	          var msg = JSON.parse(e.data);
	          console.log('message');
	          console.log(msg);
	          if (Reflect.has(msg, 'data')) {
	            if (Reflect.has(msg.data, 'answer')) {
	              var sd = Object.assign(new _this2.RTCSessionDescription(), msg.data.answer);
	              connection.setRemoteDescription(sd, function () {}, reject);
	            } else if (Reflect.has(msg.data, 'candidate')) {
	              var candidate = new _this2.RTCIceCandidate(msg.data.candidate);
	              connection.addIceCandidate(candidate);
	            } else {
	              reject();
	            }
	          } else {
	            reject();
	          }
	        };
	        socket.onerror = reject;
	      });
	    }
	  }, {
	    key: '_randomKey',
	    value: function _randomKey() {
	      var MIN_LENGTH = 10;
	      var DELTA_LENGTH = 10;
	      var MASK = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	      var result = '';
	      var length = MIN_LENGTH + Math.round(Math.random() * DELTA_LENGTH);

	      for (var i = 0; i < length; i++) {
	        result += MASK[Math.round(Math.random() * (MASK.length - 1))];
	      }
	      return result;
	    }
	  }, {
	    key: '_msg',
	    value: function _msg(code, data) {
	      var msg = { service: this.constructor.name };
	      msg.data = {};
	      msg.data.code = code;
	      Object.assign(msg.data, data);
	      return this.protocol.message(cs.SERVICE_DATA, msg);
	    }
	  }, {
	    key: 'onmessage',
	    value: function onmessage(channel, msg) {
	      var _this3 = this;

	      var webChannel = channel.webChannel;
	      if (!Reflect.has(webChannel, 'connections')) {
	        webChannel.connections = new Map();
	      }
	      switch (msg.code) {
	        case WEBRTC_DATA:
	          if (webChannel.myID === msg.recipientPeerID) {
	            if (Reflect.has(msg, 'sdp')) {
	              if (msg.sdp.type === 'offer') {
	                (function () {
	                  var connection = new _this3.RTCPeerConnection(_this3.settings.webRTCOptions);
	                  webChannel.connections.set(msg.senderPeerID, connection);
	                  connection.ondatachannel = function (e) {
	                    e.channel.onopen = function () {
	                      e.channel.peerID = msg.senderPeerID;
	                      e.channel.webChannel = webChannel;
	                      e.channel.onmessage = _this3.protocol.onmessage;
	                      webChannel.channels.add(e.channel);
	                    };
	                  };
	                  connection.onicecandidate = function (e) {
	                    if (e.candidate !== null) {
	                      var candidate = {
	                        candidate: e.candidate.candidate,
	                        sdpMLineIndex: e.candidate.sdpMLineIndex
	                      };
	                      channel.send(_this3._msg(WEBRTC_DATA, {
	                        senderPeerID: webChannel.myID,
	                        recipientPeerID: msg.senderPeerID,
	                        candidate: candidate
	                      }));
	                    }
	                  };
	                  var sd = Object.assign(new _this3.RTCSessionDescription(), msg.sdp);
	                  connection.setRemoteDescription(sd, function () {
	                    connection.createAnswer(function (answer) {
	                      connection.setLocalDescription(answer, function () {
	                        channel.send(_this3._msg(WEBRTC_DATA, {
	                          senderPeerID: webChannel.myID,
	                          recipientPeerID: msg.senderPeerID,
	                          sdp: connection.localDescription.toJSON()
	                        }));
	                      }, function () {});
	                    }, function () {});
	                  }, function () {});
	                })();
	              } else if (msg.sdp.type === 'answer') {
	                var sd = Object.assign(new this.RTCSessionDescription(), msg.sdp);
	                webChannel.connections.get(msg.senderPeerID).setRemoteDescription(sd, function () {}, function () {});
	              }
	            } else if (Reflect.has(msg, 'candidate')) {
	              webChannel.connections.get(msg.senderPeerID).addIceCandidate(new this.RTCIceCandidate(msg.candidate));
	            }
	          } else {
	            var data = this._msg(WEBRTC_DATA, msg);
	            if (webChannel.aboutToJoin.has(msg.recipientPeerID)) {
	              webChannel.aboutToJoin.get(msg.recipientPeerID).send(data);
	            } else {
	              webChannel.topologyService.sendTo(msg.recipientPeerID, webChannel, data);
	            }
	          }
	          break;
	        case CONNECT_WITH:
	          var connection = new this.RTCPeerConnection(this.settings.webRTCOptions);
	          connection.onicecandidate = function (e) {
	            if (e.candidate !== null) {
	              var candidate = {
	                candidate: e.candidate.candidate,
	                sdpMLineIndex: e.candidate.sdpMLineIndex
	              };
	              webChannel.topologyService.sendTo(msg.intermediaryID, webChannel, _this3._msg(WEBRTC_DATA, {
	                senderPeerID: webChannel.myID,
	                recipientPeerID: msg.key,
	                candidate: candidate
	              }));
	            }
	          };
	          var dc = connection.createDataChannel(msg.key);
	          dc.onopen = function () {
	            if (!Reflect.has(webChannel, 'aboutToJoin')) {
	              webChannel.aboutToJoin = new Map();
	            }
	            webChannel.aboutToJoin.set(dc.label, dc);
	            dc.onmessage = _this3.protocol.onmessage;
	            dc.peerID = dc.label;
	            dc.webChannel = webChannel;
	            webChannel.topologyService.sendTo(msg.intermediaryID, webChannel, _this3._msg(CONNECT_WITH_SUCCEED, {
	              senderPeerID: webChannel.myID,
	              recipientPeerID: dc.label
	            }));
	          };
	          connection.createOffer(function (offer) {
	            connection.setLocalDescription(offer, function () {
	              webChannel.topologyService.sendTo(msg.intermediaryID, webChannel, _this3._msg(WEBRTC_DATA, {
	                senderPeerID: webChannel.myID,
	                recipientPeerID: msg.key,
	                sdp: connection.localDescription.toJSON()
	              }));
	              webChannel.connections.set(msg.key, connection);
	            }, function () {});
	          }, function () {});
	          break;
	        case CONNECT_WITH_SUCCEED:
	          webChannel.connectionSucceed(msg.senderPeerID, msg.recipientPeerID);
	          break;
	      }
	    }
	  }]);

	  return WebRTCService;
	}();

	exports.default = WebRTCService;

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _constants = __webpack_require__(3);

	var cs = _interopRequireWildcard(_constants);

	var _ServiceProvider = __webpack_require__(4);

	var _ServiceProvider2 = _interopRequireDefault(_ServiceProvider);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var WebSocketService = function () {
	  function WebSocketService() {
	    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    _classCallCheck(this, WebSocketService);

	    this.NAME = this.constructor.name;
	    this.protocol = _ServiceProvider2.default.get(cs.EXCHANGEPROTOCOL_SERVICE);
	    this.defaults = {
	      signaling: 'ws://localhost:9000'
	    };
	    this.settings = Object.assign({}, this.defaults, options);
	  }

	  _createClass(WebSocketService, [{
	    key: 'join',
	    value: function join(key) {
	      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	      var settings = Object.assign({}, this.settings, options);
	      return new Promise(function (resolve, reject) {
	        var connection = undefined;
	        var socket = new window.WebSocket(settings.signaling);
	        socket.seq = 1;
	        socket.facade = options.facade || null;
	        socket.onopen = function () {
	          if (key && key !== '') {
	            socket.send(JSON.stringify([socket.seq++, 'JOIN', key]));
	          } else {
	            socket.send(JSON.stringify([socket.seq++, 'JOIN']));
	          }
	          resolve(socket);
	        };
	        socket.onerror = reject;
	      });
	    }
	  }]);

	  return WebSocketService;
	}();

	exports.default = WebSocketService;

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _constants = __webpack_require__(3);

	var cs = _interopRequireWildcard(_constants);

	var _ServiceProvider = __webpack_require__(4);

	var _ServiceProvider2 = _interopRequireDefault(_ServiceProvider);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var ExchangeProtocolService = function () {
	  function ExchangeProtocolService() {
	    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    _classCallCheck(this, ExchangeProtocolService);
	  }

	  _createClass(ExchangeProtocolService, [{
	    key: 'onmessage',
	    value: function onmessage(e) {
	      var msg = JSON.parse(e.data);
	      var channel = e.currentTarget;
	      var webChannel = channel.webChannel;

	      switch (msg.code) {
	        case cs.USER_DATA:
	          webChannel.onmessage(msg.id, msg.data);
	          break;
	        case cs.SERVICE_DATA:
	          var service = _ServiceProvider2.default.get(msg.service);
	          service.onmessage(channel, msg.data);
	          break;
	        case cs.YOUR_NEW_ID:
	          // TODO: change names
	          webChannel.myID = msg.newID;
	          channel.peerID = msg.myID;
	          break;
	        case cs.JOIN_START:
	          // 2.1) Send to the new client the webChannel topology
	          webChannel.topology = msg.topology;
	          webChannel.topologyService = _ServiceProvider2.default.get(msg.topology);
	          break;
	        case cs.JOIN_FINISH:
	          webChannel.topologyService.addFinish(webChannel, msg.id);
	          if (msg.id != webChannel.myID) {
	            webChannel.onJoining(msg.id);
	          }
	          break;
	      }
	    }
	  }, {
	    key: 'message',
	    value: function message(code, data) {
	      var msg = { code: code };
	      switch (code) {
	        case cs.USER_DATA:
	          msg.id = data.id;
	          msg.data = data.data;
	          break;
	        case cs.SERVICE_DATA:
	          msg.service = data.service;
	          msg.data = Object.assign({}, data.data);
	          break;
	        case cs.YOUR_NEW_ID:
	          msg.newID = data.newID;
	          msg.myID = data.myID;
	          break;
	        case cs.JOIN_START:
	          msg.topology = data;
	          break;
	        case cs.JOIN_FINISH:
	          msg.id = data;
	          break;
	      }
	      return JSON.stringify(msg);
	    }
	  }]);

	  return ExchangeProtocolService;
	}();

	exports.default = ExchangeProtocolService;

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _constants = __webpack_require__(3);

	var cs = _interopRequireWildcard(_constants);

	var _ServiceProvider = __webpack_require__(4);

	var _ServiceProvider2 = _interopRequireDefault(_ServiceProvider);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var WebSocketProtocolService = function () {
	  function WebSocketProtocolService() {
	    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    _classCallCheck(this, WebSocketProtocolService);
	  }

	  _createClass(WebSocketProtocolService, [{
	    key: 'onmessage',
	    value: function onmessage(e) {
	      var msg = JSON.parse(e.data);
	      var socket = e.currentTarget;
	      var webChannel = socket.webChannel;
	      var topology = cs.STAR_SERVICE;
	      var topologyService = _ServiceProvider2.default.get(topology);

	      if (msg[0] !== 0) {
	        return;
	      }
	      if (msg[1] === 'IDENT') {
	        socket.uid = msg[2];
	        webChannel.peers = [];
	        webChannel.topology = topology;
	        return;
	      }
	      if (msg[1] === 'PING') {
	        msg[1] = 'PONG';
	        socket.send(JSON.stringify(msg));
	        return;
	      }
	      if (msg[2] === 'MSG') {}
	      // We have received a new direct message from another user
	      if (msg[2] === 'MSG' && msg[3] === socket.uid) {
	        // Find the peer exists in one of our channels or create a new one
	        if (typeof socket.facade._onPeerMessage === "function") socket.facade._onPeerMessage(msg[1], msg);
	      }
	      if (msg[2] === 'JOIN' && (webChannel.id == null || webChannel.id === msg[3])) {
	        if (!webChannel.id) {
	          // New unnamed channel : get its name from the first "JOIN" message
	          if (!window.location.hash) {
	            var chanName = window.location.hash = msg[3];
	          }
	          webChannel.id = msg[3];
	        }

	        if (msg[1] === socket.uid) {
	          // If the user catches himself registering, he is synchronized with the server
	          webChannel.onopen();
	        } else {
	          // Trigger onJoining() when another user is joining the channel

	          // Register the user in the list of peers in the channel
	          var linkQuality = msg[1] === '_HISTORY_KEEPER_' ? 1000 : 0;
	          var sendToPeer = function sendToPeer(data) {
	            topologyService.sendTo(msg[1], webChannel, { type: 'MSG', msg: data });
	          };
	          var peer = { id: msg[1], connector: socket, linkQuality: linkQuality, send: sendToPeer };
	          if (webChannel.peers.indexOf(peer) === -1) {
	            webChannel.peers.push(peer);
	          }

	          if (typeof webChannel.onJoining === "function") webChannel.onJoining(msg[1]);
	        }
	      }
	      // We have received a new message in that channel from another peer
	      if (msg[2] === 'MSG' && msg[3] === webChannel.id) {
	        // Find the peer who sent the message and display it
	        //TODO Use Peer instead of peer.id (msg[1]) :
	        if (typeof webChannel.onMessage === "function") webChannel.onMessage(msg[1], msg[4]);
	      }
	      // Someone else has left the channel, remove him from the list of peers
	      if (msg[2] === 'LEAVE' && msg[3] === webChannel.id) {
	        //TODO Use Peer instead of peer.id (msg[1]) :
	        if (typeof webChannel.onLeaving === "function") webChannel.onLeaving(msg[1], webChannel);
	      }
	    }
	  }, {
	    key: 'message',
	    value: function message(code, data) {
	      var type = undefined;
	      switch (code) {
	        case cs.USER_DATA:
	          type = 'MSG';
	          break;
	        case cs.JOIN_START:
	          type = 'JOIN';
	          break;
	      }
	      return { type: type, msg: data.data };
	    }
	  }]);

	  return WebSocketProtocolService;
	}();

	exports.default = WebSocketProtocolService;

/***/ }
/******/ ])
});
;