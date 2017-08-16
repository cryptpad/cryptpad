(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["MediaTag"] = factory();
	else
		root["MediaTag"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 19);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

const Identifier = {
	/*
	 * Renderers
	 */
	IMAGE: 'image',
	AUDIO: 'audio',
	VIDEO: 'video',
	PDF: 'pdf',
	DASH: 'dash',
	DOWNLOAD: 'download',

	/*
	 * Filters
	 */
	CRYPTO: 'crypto',
	CLEAR_KEY: 'clear-key',

	/*
	 * Sanitizers
	 */
	MEDIA_OBJECT: 'media-object'
};

module.exports = Identifier;


/***/ }),
/* 1 */
/***/ (function(module, exports) {

const Type = {
	MATCHER: 'matcher',
	RENDERER: 'renderer',
	FILTER: 'filter',
	SANITIZER: 'sanitizer'
};

module.exports = Type;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

const Type = 		__webpack_require__(1);
const Occurrence = 	__webpack_require__(5);
const Plugin = 		__webpack_require__(3);

class Matcher extends Plugin {
	/**
	 * Constructs the object.
	 *
	 * @param      {string}  identifier    The identifier
	 * @param      {Type}  matchingType  The matching type
	 */
	constructor(identifier, targetType) {
		super(identifier, Type.MATCHER, Occurrence.ANY);
		this.targetType = targetType;
	}

	/**
	 * Gets the target type.
	 *
	 * @return     {<type>}  The target type.
	 */
	getTargetType() {
		return this.targetType;
	}
}

module.exports = Matcher;


/***/ }),
/* 3 */
/***/ (function(module, exports) {

class Plugin {
	/**
	 * Constructs the object.
	 *
	 * @param      {string}  identifier  The identifier
	 * @param      {string}  type        The type
	 * @param      {string}  occurrence   The occurrence
	 */
	constructor(identifier, type, occurrence) {
		this.identifier = identifier;
		this.type = type;
		this.occurrence = occurrence;
	}

	/**
	 * Gets the identifier.
	 *
	 * @return     {string}  The identifier.
	 */
	getIdentifier() {
		if (this.identifier) {
			return this.identifier;
		}
		throw new Error('Plugin has not identifier');
	}

	/**
	 * Gets the type.
	 *
	 * @return     {string}  The type.
	 */
	getType() {
		if (this.type) {
			return this.type;
		}
		throw new Error('Plugin has no type');
	}

	/**
	 * Gets the occurrence.
	 *
	 * @return     {string}  The occurrence.
	 */
	getOccurrence() {
		if (this.occurrence) {
			return this.occurrence;
		}
		throw new Error('Plugin has no occurrence');
	}

	/**
	 * Starts the process on the media object.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 * @return     {*}
	 */
	start(mediaObject) {
		return this.process(mediaObject);
	}
}

module.exports = Plugin;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

const Type = 		__webpack_require__(1);
const Occurrence = 	__webpack_require__(5);
const Plugin = 		__webpack_require__(3);

class Renderer extends Plugin {
	/**
	 * Constructs the object.
	 *
	 * @param      {string}  identifier  The identifier
	 */
	constructor(identifier) {
		super(identifier, Type.RENDERER, Occurrence.ONCE);
	}
}

module.exports = Renderer;


/***/ }),
/* 5 */
/***/ (function(module, exports) {

const Occurrence = {
	EVERY: 'every',
	ANY: 'any',
	ONCE: 'once'
};

module.exports = Occurrence;


/***/ }),
/* 6 */
/***/ (function(module, exports) {

/**
 * Class for store.
 *
 * @class      Store (name)
 */
class Store {
	/**
	 * Constructs the object.
	 */
	constructor() {
		this.map = {};
	}

	/**
	 * Determines if stored.
	 *
	 * @param      {string}   key     The key
	 * @return     {boolean}  True if stored, False otherwise.
	 */
	isStored(key) {
		if (this.get(key)) {
			return true;
		}
		return false;
	}

	/**
	 * Stores a couple key value inside the store.
	 *
	 * @param      {string}  key     The key
	 * @param      {*}  value   The value
	 */
	store(key, value) {
		if (this.isStored(key)) {
			console.warn(`The key "${key}" is already registered, the content will be overwritten.`);
		}
		this.map[key] = value;
	}

	/**
	 * Unstores a value by deleting the entry and returning its value.
	 *
	 * @param      {string}  key     The key
	 */
	unstore(key) {
		if (this.isStored(key) === false) {
			console.warn(`The key "${key}" not exists in this manager`);
		} else {
			const value = this.map[key];
			delete this.map[key];
			return value;
		}
	}

	/**
	 * Gets a spcific value from the key.
	 *
	 * @param      {<type>}  key     The key
	 * @return     {<type>}  { description_of_the_return_value }
	 */
	get(key) {
		return this.map[key];
	}

	/**
	 * Returns all stored keys.
	 *
	 * @return     {Array<string>}
	 */
	keys() {
		return Object.keys(this.map);
	}

	/**
	 * Returns all stored values.
	 *
	 * @return     {Array}
	 */
	values() {
		const keys = this.keys();
		return keys.map(key => {
			return this.get(key);
		});
	}
}

module.exports = Store;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

const Filter =		__webpack_require__(8);
const Identifier = 	__webpack_require__(0);
const Store = 		__webpack_require__(6);

class CryptoFilter extends Filter {
	/**
	 * Constructs the object.
	 */
	constructor() {
		super(Identifier.CRYPTO);
	}

	/**
	 * Job to realise on a mediaObject.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	process(mediaObject) {
		const dataCryptoKey = mediaObject.getAttribute('data-crypto-key');
		const schemes = /\w+:/.exec(dataCryptoKey);
		if (schemes === null) {
			throw new Error('No algorithm scheme found in data-crypto-key');
		}
		const algorithmScheme = schemes[0];	/* Takes the first encountered scheme */
		const algorithmName = algorithmScheme.replace(':', '');
		const stringKey = dataCryptoKey.replace(algorithmScheme, '');

		/**
		 * Replaces data-crypto-key by the key part only (less algorithm scheme).
		 */
		mediaObject.setAttribute('data-crypto-key', stringKey);

		if (CryptoFilter.functionStore.isStored(algorithmName)) {
			const algorithm = CryptoFilter.functionStore.get(algorithmName);

			/**
			 * Runs any algorithm on media object.
			 * The algorithm HAVE TO pay back the media object to
			 * the processing engine when its job is done.
			 */
			algorithm(mediaObject);
		} else {
			throw new Error(`Algorithm ${algorithmName} is not registered`);
		}
	}
}

/**
 * Function store to register every needed algorithms as a named callback.
 */
CryptoFilter.functionStore = CryptoFilter.functionStore || new Store();

/**
 * Allowed media types.
 */
CryptoFilter.mediaTypes = [];

/**
 * Sets the allowed media types.
 *
 * @param      {Array<string>}  mediaTypes  The media types
 */
CryptoFilter.setAllowedMediaTypes = mediaTypes => {
	CryptoFilter.mediaTypes = mediaTypes;
};

/**
 * Gets the allowed media types.
 *
 * @return     {Array<string>}  The allowed media types.
 */
CryptoFilter.getAllowedMediaTypes = () => {
	return CryptoFilter.mediaTypes;
};

/**
 * Adds an allowed media type.
 *
 * @param      {string}  mediaType  The media type
 */
CryptoFilter.addAllowedMediaType = mediaType => {
	CryptoFilter.mediaTypes.push(mediaType);
};

/**
 * Adds all allowed media types.
 *
 * @param      {Array<string>}  mediaTypes  The media types
 */
CryptoFilter.addAllAllowedMediaTypes = mediaTypes => {
	// CryptoFilter.mediaTypes.push(...mediaTypes); // ES7 variant
	mediaTypes.forEach(mediaType => {
		CryptoFilter.addAllowedMediaType(mediaType);
	});
};

/**
 * Removes an allowed media type.
 *
 * @param      {string}  mediaType  The media type
 */
CryptoFilter.removeAllowedMediaType = mediaType => {
	const index = CryptoFilter.mediaTypes.indexOf(mediaType);

	if (index >= 0) {
		CryptoFilter.mediaTypes.splice(index, 1);
	}
};

/**
 * Removes all allowed media type.
 *
 * @param      {Array<string>}  mediaTypes  The media types
 */
CryptoFilter.removeAllAllowedMediaTypes = mediaTypes => {
	mediaTypes.forEach(mediaType => {
		CryptoFilter.removeAllowedMediaType(mediaType);
	});
};

/**
 * Determines if allowed media type.
 *
 * @param      {string}   mediaType  The media type
 * @return     {boolean}  True if allowed media type, False otherwise.
 */
CryptoFilter.isAllowedMediaType = mediaType => {
	return CryptoFilter.mediaTypes.some(type => {
		return type === mediaType;
	});
};

module.exports = CryptoFilter;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

const Type = 		__webpack_require__(1);
const Occurrence = 	__webpack_require__(5);
const Plugin = 		__webpack_require__(3);

class Filter extends Plugin {
	/**
	 * Constructs the object.
	 *
	 * @param      {string}  identifier  The identifier
	 */
	constructor(identifier) {
		super(identifier, Type.FILTER, Occurrence.ANY);
	}
}

module.exports = Filter;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

const hide = __webpack_require__(17);
const show = __webpack_require__(16);

module.exports = (mediaObjectToActivate, mediaTag) => {
	mediaTag.mediaObjects.forEach(mediaObject => {
		hide(mediaObject);
	});
	mediaTag.activeMediaObject = mediaObjectToActivate;
	show(mediaObjectToActivate);
};


/***/ }),
/* 10 */
/***/ (function(module, exports) {


/**
 * Aggregates all Errors classes that media tag throw.
 *
 * @since 0.2.0
 */
const Errors = {
	// Media Tag //

	/**
	 * @class {PluginExists} PluginExists Error thrown when a try to
	 * register a plugin but the same identifier has been already
	 * registered.
	 * @since 0.2.0
	 */
	PluginExists: class PluginExists extends Error {
		constructor(objPlugin) {
			super(`Plugin with same "${objPlugin.identifier}" identifier found.`);
		}
	},

	/**
	 * @class {TypeNotFound} TypeNotFound Error thrown when media tag
	 * is incapable to find the type of a given media content. It
	 * loops all the registered plugins, trying to find a match for
	 * typeCheck, if no plugin returns true then this error occurs.
	 * @since 0.2.0
	 */
	TypeNotFound: class TypeNotFound extends Error {
		constructor() {
			super(`Media Tag could not find the content type of an instance.}.`);
		}
	},

	/**
	 * @class {FilterExists} FilterExists Error thrown when a try to
	 * register a filter but the same identifier has been already
	 * registered.
	 * @since 0.2.1
	 */
	FilterExists: class FilterExists extends Error {
		constructor(filter) {
			super(`Filter with same "${filter.identifier} identifier found."`);
		}
	},

	// Fetch //

	/**
	 * @class {FetchFail} FetchFail Error thrown when media tag
	 * is incapable to fetch a resource.
	 * @since 0.2.0
	 */
	FetchFail: class FetchFail extends Error {
		constructor(response) {
			super(`Could not fetch "${response.url}", received "${response.status}: ${response.statusText}".`);
		}
	},

	// Crypto plugin //

	/**
	 * @class {InvalidCryptoKey} InvalidCryptoKey Error thrown when
	 * using the crypto plugin. The key informed is invalid (for
	 * example when a field is missing).
	 * @since 0.2.0
	 */
	InvalidCryptoKey: class InvalidCryptoKey extends Error {
		constructor() {
			super('Invalid cryptographic key.');
		}
	},

	/**
	 * @class {InvalidCryptoLib} InvalidCryptoLib Error thrown when
	 * using the crypto plugin. The key contains an invalid algorithm
	 * (for example, to the day, only 'xsalsa20poly1305' is supported).
	 * @since 0.2.0
	 */
	InvalidCryptoLib: class InvalidCryptoLib extends Error {
		constructor() {
			super('Invalid cryptographic algorithm name.');
		}
	},

	/**
	 * @class {FailedCrypto} FailedCrypto Error thrown when
	 * using the crypto plugin. The contents were impossible to
	 * decrypt (for example, the key may be wrong, or the encrypted
	 * file).
	 * @since 0.2.0
	 */
	FailedCrypto: class FailedCrypto extends Error {
		constructor(err) {
			super(`Failed to decrypt file${err && err.message ? ` ${err.message}` : ''}.`);
		}
	}
};

module.exports = Errors;


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

/* global Promise */

const ProcessingEngine = __webpack_require__(23);
const PluginStore = __webpack_require__(30);
const MediaTag = __webpack_require__(31);
const Loader = __webpack_require__(38);

/**
 * MediaTagAPI variant for asynchronous module loading.
 *
 * @class      MediaTagAPI (name)
 * @param      {Array<Element>|Element}  elements  The elements
 */
function MediaTagAPI(elements) {
	if (!Array.isArray(elements)) {
		elements = [elements];
	}

	/**
	 * Removes undefined elements.
	 */
	elements = elements.filter(element => {
		return element;
	});

	return MediaTagAPI.loadConfigurations(elements).then(() => {
		return MediaTagAPI.start(elements);
	});
}

/**
 * Starts Media-Tag processing on identified elements.
 *
 * @param      {Array<Element>}  elements  The elements
 * @return     {Promise}
 */
MediaTagAPI.start = elements => {
	const activeEngine = MediaTagAPI.loadingEngine || MediaTagAPI.processingEngine;

	return Promise.all(elements.map(element => {
		return new Promise(resolve => {
			if (element.hasAttribute('src') ||
				element.hasAttribute('sources')) {
				const mediaTag = new MediaTag(element, MediaTagAPI.processingEngine);
				const mediaObjects = mediaTag.mediaObjects;

				mediaObjects.forEach(mediaObject => {
					element.mediaObject = mediaObject;
					mediaObject.loader = MediaTagAPI.loader;
					resolve(activeEngine.start(mediaObject));
				});
			} else {
				resolve(console.warn(`Element skipped because has no sources`, element));
			}
		});
	}));
};

/**
 * Updates the media tag with the configuration.
 *
 * @param      {Configuration}  configuration  The configuration
 */
MediaTagAPI.update = configuration => {
	/**
	 * Update only if the configuration origin is different ...
	 * TODO : Update this rule to if changes is detected in a configuration
	 */
	if (configuration.origin !== 'store') {
		configuration.getPlugins().forEach(plugin => {
			/**
			 * Finds existing plugins to try to update their properties, methods ...
			 * WARNING : Existing plugins still conserve their prototypes.
			 * Configuration function will overwrite instances and avoid same name prototype ones.
			 * Configuration is always an overwrite or an addition of properties in this context.
			 */
			const existingPlugins = MediaTagAPI.pluginStore.getPlugins(plugin.getType()).filter(storedPlugin => {
				return	storedPlugin.getIdentifier() === plugin.getIdentifier() &&
						storedPlugin.getType() === plugin.getType();
			});
			if (existingPlugins.length > 1) {
				throw new Error('More than one plugin matched to update for this pass');
			} else if (existingPlugins.length === 1) {
				existingPlugins.forEach(existingPlugin => {
					Object.keys(plugin).forEach(key => {
						existingPlugin[key] = plugin[key];
					});
				});
			} else {
				MediaTagAPI.pluginStore.store(plugin);
			}
		});
	}
};

/**
 * Configures the media tag api.
 *
 * @param      {Configuration}  configuration  The configuration
 * @return     {Configuration}
 */
MediaTagAPI.configure = configuration => {
	const activeEngine = MediaTagAPI.loadingEngine ||
		MediaTagAPI.processingEngine;

	activeEngine.configure(configuration);
};

/**
 * Loads configurations.
 *
 * @param      {<type>}  elements  The elements
 * @return     {<type>}  { description_of_the_return_value }
 */
MediaTagAPI.loadConfigurations = elements => {
	const configurationLoaders = elements.filter(element => {
		return element.hasAttribute('configuration');
	}).map(element => {
		return element.getAttribute('configuration');
	}).reduce((urls, url) => {
		if (!urls.includes(url)) {
			urls.push(url);
		}
		return urls;
	}, []).map(url => {
		return MediaTagAPI.loader.configuration(url);
	});

	return Promise.all(configurationLoaders).then(configurations => {
		const dependencyUrls = [];

		configurations.forEach(configuration => {
			MediaTagAPI.update(configuration);
			MediaTagAPI.configure(configuration);
			if (configuration.dependencies) {
				configuration.dependencies.forEach(url => {
					if (!dependencyUrls.includes(url)) {
						dependencyUrls.push(url);
					}
				});
			}
		});
		return Promise.all(dependencyUrls.map(url => {
			return MediaTagAPI.loader.script(url);
		}));
	});
};

/**
 * PluginStore instance.
 */
MediaTagAPI.pluginStore = MediaTagAPI.pluginStore || new PluginStore();

/**
 * ProcessingEngine instance.
 */
MediaTagAPI.processingEngine = MediaTagAPI.processingEngine || new ProcessingEngine(MediaTagAPI.pluginStore);

/**
 * Loader with history system to prevent multiple same loadings.
 */
MediaTagAPI.loader = new Loader();

module.exports = MediaTagAPI;


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

const Renderer = __webpack_require__(4);
const Filter = __webpack_require__(8);
const Matcher = __webpack_require__(2);
const Sanitizer = __webpack_require__(13);
const Plugin = __webpack_require__(3);
const Group = __webpack_require__(25);

const Permission = __webpack_require__(26);
const Type = __webpack_require__(1);

class Configuration {
	/**
	 * Constructs the object.
	 *
	 * @param      {Object}  configuration  The configuration
	 */
	constructor(configuration) {
		Object.keys(configuration).forEach(key => {
			this[key] = configuration[key];
		});
	}

	/**
	 * Determines if allowed.
	 *
	 * @param      {<type>}   identifier  The identifier
	 * @return     {boolean}  True if allowed, False otherwise.
	 */
	isAllowed(identifier) {
		if (!this.permissions) {
			return Permission.ALLOWED;
		} else if (!this.permissions[identifier]) {
			return Permission.ALLOWED;
		}

		return this.permissions[identifier] !== Permission.FORBIDDEN;
	}

	/**
	 * Gets the permission.
	 *
	 * @param      {Identifier|string}  identifier  The identifier
	 * @return     {Permission|string}  The permission.
	 */
	getPermission(identifier) {
		if (!this.permissions) {
			return Permission.ALLOWED;
		} else if (!this.permissions[identifier]) {
			return Permission.ALLOWED;
		}
		return this.permissions[identifier];
	}

	/**
	 * Gets the object permissions for each identifier.
	 *
	 * @return     {Object}  The permissions.
	 */
	getPermissions() {
		return this.permissions || {};
	}

	/**
	 * Gets instanciated plugins from the configuration definition.
	 *
	 * @return     {Array<Plugin>}  The plugins.
	 */
	getPlugins() {
		if (!this.plugins) {
			return [];
		}
		return Object.keys(this.plugins).map(identifier => {
			return Object.keys(this.plugins[identifier]).map(type => {
				let plugin;

				switch (type) {
					case Type.RENDERER:
						plugin = new Renderer(identifier);
						break;
					case Type.FILTER:
						plugin = new Filter(identifier);
						break;
					case Type.SANITIZER:
						plugin = new Sanitizer(identifier);
						break;
					case Type.MATCHER:
						plugin = new Matcher(identifier);
						break;
					case Type.GROUP:
						plugin = new Group(identifier, type);
						break;
					default:
						plugin = new Plugin(identifier, type);
						break;
				}
				Object.keys(this.plugins[identifier][type]).forEach(attribute => {
					const value = this.plugins[identifier][type][attribute];
					plugin[attribute] = (typeof value === 'function' && attribute === 'process') ?
						((plugin, process) => mediaObject => {
							return process(plugin, mediaObject);
						})(plugin, value) : value;
				});

				return plugin;
			});
		}).reduce((plugin, next) => plugin.concat(next));
	}

	getDefaultPlugin() {
		const defaultPluginName = this.processingEngine.defaultPlugin;

		return this.getPlugins().filter(plugin => {
			return plugin.identifier === defaultPluginName;
		}).reduce((defaultPlugin, next) => {
			if (defaultPlugin.getType() !== Type.MATCHER) {
				return defaultPlugin;
			}
			return next;
		});
	}
}

module.exports = Configuration;


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

const Type = 		__webpack_require__(1);
const Occurrence = 	__webpack_require__(5);
const Plugin = 		__webpack_require__(3);

class Sanitizer extends Plugin {
	/**
	 * Constructs the object.
	 *
	 * @param      {string}  identifier  The identifier
	 */
	constructor(identifier) {
		super(identifier, Type.SANITIZER, Occurrence.EVERY);
	}
}

module.exports = Sanitizer;


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

/* global document, XMLHttpRequest, saveAs, File */
const Renderer =	__webpack_require__(4);
const Identifier = 	__webpack_require__(0);

class DownloadRenderer extends Renderer {
	/**
	 * Constructs the object.
	 */
	constructor(message, buttonMessage) {
		super(Identifier.DOWNLOAD);
		this.message = 	message;
		this.buttonMessage = buttonMessage || 'Download';
	}

	/**
	 * Job to realise to render a dash with a mediaObject.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	process(mediaObject) {
		const button = document.createElement('button');

		button.innerHTML = this.buttonMessage;

		button.onclick = () => {
			const xhr = new XMLHttpRequest();
			const src = mediaObject.getAttribute('src');

			xhr.open('GET', src, true);
			xhr.responseType = 'blob';
			xhr.onload = () => {
				const blob = xhr.response;
				if (blob) {
					if (mediaObject.name) {
						saveAs(blob, mediaObject.name);
					} else if (mediaObject.getAttribute('data-attr-type')) {
						const mime = mediaObject.getAttribute('data-attr-type');
						const ar = mime.split('/');
						const file = new File([blob], `download.${ar[1] || 'txt'}`, {type: mime});
						saveAs(file);
					} else {
						saveAs(blob);
					}
				}
			};
			xhr.send();
		};

		mediaObject.utilsSetAllDataAttributes(button);
		mediaObject.replaceContents([button]);
		mediaObject.return();
	}
}

module.exports = DownloadRenderer;


/***/ }),
/* 15 */
/***/ (function(module, exports) {

/**
 * List of .
 *
 * @class      Stack (name)
 */
class Stack {
	/**
	 * Constructs the object.
	 */
	constructor() {
		this.content = [];
	}
	/**
	 * Stacks an object.
	 *
	 * @param      {Object}  object  The object
	 */
	stack(object) {
		this.content.push(object);
	}

	/**
	 * Unstacks an object.
	 *
	 * @return     {Object|undefined}
	 */
	unstack() {
		return this.content.pop();
	}

	/**
	 * Top of the stack.
	 *
	 * @return     {Object|undefined}
	 */
	top() {
		return this.content[this.content.length - 1];
	}

	/**
	 * Base of the stack.
	 *
	 * @return     {Object}
	 */
	base() {
		return this.content[0];
	}

	/**
	 * Determines if empty.
	 *
	 * @return     {boolean}  True if empty, False otherwise.
	 */
	isEmpty() {
		return this.content.length === 0;
	}

	/**
	 * Stack length.
	 *
	 * @return     {number}
	 */
	length() {
		return this.content.length;
	}
}

module.exports = Stack;


/***/ }),
/* 16 */
/***/ (function(module, exports) {

module.exports = mediaObject => {
	mediaObject.element.style.display = 'block';
	for (const child of mediaObject.hookedFns.children()) {
		child.style.display = 'block';
	}
};


/***/ }),
/* 17 */
/***/ (function(module, exports) {

module.exports = mediaObject => {
	mediaObject.element.style.display = 'none';
	for (const child of mediaObject.hookedFns.children()) {
		child.style.display = 'none';
	}
};


/***/ }),
/* 18 */
/***/ (function(module, exports) {

/**
 * Class for attribute object.
 *
 * @class      AttributeObject (name)
 */
class AttributesObject {
	/**
	 * Constructs the object.
	 *
	 * @param      {Element}  element  The element
	 */
	constructor(element) {
		Object.keys(element.attributes).forEach(key => {
			this[element.attributes[key].name] = element.attributes[key].value;
		});
	}

	/**
	 * Gets the attribute.
	 *
	 * @param      {string}  attribute  The attribute
	 * @return     {Object}  The attribute.
	 */
	getAttribute(attribute) {
		return this[attribute];
	}

	/**
	 * Sets the attribute.
	 *
	 * @param      {string}  attribute  The attribute
	 * @param      {Object}  value      The value
	 */
	setAttribute(attribute, value) {
		this[attribute] = value;
	}

	/**
	 * Removes an attribute.
	 *
	 * @param      {string}  attribute  The attribute
	 */
	removeAttribute(attribute) {
		delete this[attribute];
	}

	/**
	 * Determines if it has attributes.
	 *
	 * @return     {boolean}  True if has attributes, False otherwise.
	 */
	hasAttributes() {
		return Object.keys(this) > 0;
	}
}

module.exports = AttributesObject;


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

/* global document, MutationObserver */
const mediaTagAPI = __webpack_require__(20);

document.addEventListener('DOMContentLoaded', () => {
	const observer = new MutationObserver(handleMutations);
	const target = document.body;
	const configuration = {
		characterData: true,
		childList: true,
		attributes: true,
		subtree: true
	};
	/**
	 * Gets the media tag elements.
	 *
	 * @param      {<type>}  mutations  The mutations
	 * @return     {Array}   The media tag elements.
	 */
	function getMediaTagElements(mutations) {
		const mediaTagElements = [];

		mutations.forEach(mutation => {
			if (mutation.addedNodes) {
				mutation.addedNodes.forEach(node => {
					const elements = find(node, 'MEDIA-TAG').filter(hasIdleMediaObjects);
					mediaTagElements.push(...elements);

					if (node.nodeName === 'MEDIA-TAG') {
						mediaTagElements.push(node);
					}
				});
			}
			if (mutation.target.nodeName === 'MEDIA-TAG') {
				/**
				 * Avoid mutation due to MediaTag end process ...
				 */
				if (mutation.type !== 'childList') {
					/**
					 * We don't store two times a same mutated element.
					 */
					if (!mediaTagElements.includes(mutation.target)) {
						mediaTagElements.push(mutation.target);
					}
				}
			}
		});

		return mediaTagElements;
	}

	/**
	 * Determines if it has idle media objects.
	 *
	 * @param      {<type>}   mediaTagElement  The media tag element
	 * @return     {boolean}  True if has idle media objects, False otherwise.
	 */
	function hasIdleMediaObjects(mediaTagElement) {
		if (mediaTagElement.mediaObjects) {
			return mediaTagElement.mediaObjects.some(mediaObject => {
				return mediaObject.state === 'idle';
			});
		} else if (mediaTagElement.mediaObject) {
			return mediaTagElement.mediaObject.state === 'idle';
		}
		return true;
	}

	/**
	 * Searches for the first match.
	 *
	 * @param      {<type>}  element  The element
	 * @param      {<type>}  tag      The tag
	 * @return     {Array}   { description_of_the_return_value }
	 */
	function find(element, tag) {
		let nodes = [];

		if (!element.children) {
			return nodes;
		}
		for (const child of element.children) {
			if (child.nodeName === tag) {
				nodes.push(child);
			}
			nodes = nodes.concat(find(child, tag));
		}
		return nodes;
	}

	/**
	 * { function_description }
	 *
	 * @param      {<type>}   mediaTagElements  The media tag elements
	 * @return     {Promise}  { description_of_the_return_value }
	 */
	function launch(mediaTagElements) {
		return new Promise((resolve, reject) => {
			try {
				if (mediaTagElements.length > 0) {
					mediaTagAPI(mediaTagElements);
				}
				resolve();
			} catch (err) {
				reject(err);
			}
		});
	}

	/**
	 * { function_description }
	 *
	 * @param      {<type>}  mutations  The mutations
	 */
	function handleMutations(mutations) {
		launch(getMediaTagElements(mutations)).catch(err => {
			console.error(err);
		});
	}

	observer.observe(target, configuration);
	launch(Array.from(document.getElementsByTagName('media-tag')));
});

module.exports = mediaTagAPI;


/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Enumerations
 */
// const Permission = require('../enums/permission');
// const Identifier = require('../enums/identifier');

/**
 * Configuration
 */
// const Configuration = require('../core/configuration');

/**
 * Algorithms
 */
const Salsa20Poly1305Algorithm	= __webpack_require__(21);
const CryptpadAlgorithm 		= __webpack_require__(22);

/**
 * Renderers
 */
const ImagePlugin 		= __webpack_require__(39);
const AudioPlugin 		= __webpack_require__(40);
const VideoPlugin 		= __webpack_require__(41);
const PdfPlugin 		= __webpack_require__(42);
const DashPlugin 		= __webpack_require__(43);
const DownloadPlugin 	= __webpack_require__(14);

/**
 * Filters
 */
const CryptoFilter		= __webpack_require__(7);
const ClearKeyFilter	= __webpack_require__(44);

/**
 * Sanitizers
 */
const MediaObjectSanitizer = __webpack_require__(45);

/**
 * Media Tag API with matchers.
 *
 * @type       {Function}
 */
const MediaTag = __webpack_require__(46);

/**
 * Configuration of the pdfjs viewer as main render for pdf plugin.
 */
MediaTag.PdfPlugin = PdfPlugin;
MediaTag.PdfPlugin.viewer = '/pdfjs/web/viewer.html';

/**
 * Store every algorithms inside CryptoFilter.
 */
CryptoFilter.functionStore.store('salsa20poly1305', Salsa20Poly1305Algorithm);
CryptoFilter.functionStore.store('cryptpad', CryptpadAlgorithm);

/**
 * Set default plugin for MediaTag.processingEngine
 */
MediaTag.processingEngine.setDefaultPlugin(
	new DownloadPlugin(`<p> Media-Tag can't process your content </p>`, 'Download'));

/**
 * WAY 1 : CRYPTO CAN DEFINE HIS OWN ALLOWED MEDIA TYPES (TYPE/MIME/...)
 * IT FORBID PLUGIN USAGE BY INFORMATION LACK (NO METADATA ARE SET IF MEDIA TYPE IS NOT ALLOWED)
 */

MediaTag.CryptoFilter = CryptoFilter;

/**
 * Allowed mime types that have to be set for a rendering after a decryption.
 */

MediaTag.CryptoFilter.setAllowedMediaTypes([
	'image/png',
	'image/jpeg',
	'image/jpg',
	'image/gif',
	'audio/mp3',
	'audio/ogg',
	'audio/wav',
	'audio/webm',
	'video/mp4',
	'video/ogg',
	'video/webm',
	'application/pdf',
	'application/dash+xml',
	'download'
]);

/**
 * You can define a configuration to dissable some plugins.
 * If a renderer is forbidden, the processing engine must fall in it default case.
 *
 * @type       {Configuration}
 */

// const configuration = new Configuration({});

// configuration.setPermission(Identifier.IMAGE, Permission.FORBIDDEN);
// configuration.setPermission(Identifier.AUDIO, Permission.FORBIDDEN);
// configuration.setPermission(Identifier.VIDEO, Permission.FORBIDDEN);
// configuration.setPermission(Identifier.PDF, Permission.FORBIDDEN);
// configuration.setPermission(Identifier.DASH, Permission.FORBIDDEN);
// configuration.setPermission(Identifier.DOWNLOAD, Permission.FORBIDDEN);
// MediaTag.processingEngine.configure(configuration);

/**
 * Register every job/active part plugins.
 */

MediaTag.pluginStore.store(new ImagePlugin());
MediaTag.pluginStore.store(new AudioPlugin());
MediaTag.pluginStore.store(new VideoPlugin());
MediaTag.pluginStore.store(new PdfPlugin());
MediaTag.pluginStore.store(new DashPlugin());
MediaTag.pluginStore.store(new DownloadPlugin());

MediaTag.pluginStore.store(new CryptoFilter());
MediaTag.pluginStore.store(new ClearKeyFilter());

MediaTag.pluginStore.store(new MediaObjectSanitizer());

module.exports = MediaTag;


/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

/* global window, fetch, XMLHttpRequest, Blob, Event */
const Errors = __webpack_require__(10);
const CryptoFilter = __webpack_require__(7);

/**
 * Class for crypto.
 *
 * @class      Crypto (name)
 */
class Crypto {
	/**
	 * Convert a Uint8Array into Array.
	 *
	 * @param      {Uint8Array}  u8      The u 8
	 * @return     {Array}  Array = require(Uint8Array.
	 */
	static slice(u8) {
		return Array.prototype.slice.call(u8);
	}

	/**
	 * Gets the random key string.
	 *
	 * @return     {String}  The random key string.
	 */
	static getRandomKeyStr() {
		const Nacl = window.nacl;
		const rdm = Nacl.randomBytes(18);
		return Nacl.util.encodeBase64(rdm);
	}

	/**
	 * Gets the key = require(string.
	 *
	 * @param      {String}  str     The string
	 * @return     {Uint8Array}  The key = require(string.
	 */
	static getKeyFromStr(str) {
		const Nacl = window.nacl;
		const hash = Nacl.hash(Nacl.util.decodeBase64(str));
		return hash.subarray(32, 64);
	}

	/**
	 * Encrypts a Uint8Array with the given key.
	 *
	 * @param      {<type>}      u8      The u 8
	 * @param      {<type>}      key     The key
	 * @return     {Uint8Array}  The encrypted content.
	 */
	static encrypt(u8, key) {
		const array = u8;
		const nonce = window.nacl.randomBytes(24);
		const packed = window.nacl.secretbox(array, nonce, key);
		if (packed) {
			return new Uint8Array(Crypto.slice(nonce).concat(Crypto.slice(packed)));
		}
		throw new Error();
	}

	/**
	 * Decrypts a Uint8Array with the given key.
	 *
	 * @param      {Uint8Array}  u8      The u 8
	 * @param      {String}  key     The key
	 * @return     {String}  The decrypted content.
	 */
	static decrypt(u8, key) {
		if (u8.length < 24) {
			throw new Error();
		}
		const slice = Crypto.slice;
		const Nacl = window.nacl;
		const nonce = new Uint8Array(slice(u8).slice(0, 24));
		const packed = new Uint8Array(slice(u8).slice(24));
		const unpacked = Nacl.secretbox.open(packed, nonce, key);
		if (unpacked) {
			return unpacked;
		}
		throw new Error('Decrypted file in undefined');
	}
}

/**
 * Class for data manager.
 *
 * @class      DataManager (name)
 */
class DataManager {
	/**
	 * Gets the array buffer = require(a source url.
	 *
	 * @param      {<type>}  url     The url
	 * @return     {<type>}  The array buffer.
	 */
	static getArrayBuffer(url) {
		return fetch(url)
		.then(response => {
			if (response.ok) {
				return response.arrayBuffer();
			}
			throw new Errors.FetchFails();
		})
		.then(arrayBuffer => arrayBuffer);
	}

	/**
	 * Creates an url.
	 *
	 * @param      {ArrayBuffer}  arrayBuffer  The array buffer
	 * @return     {String}  The url.
	 */
	static createUrl(arrayBuffer) {
		return window.URL.createObjectURL(arrayBuffer);
	}

	/**
	 * Gets the blob url.
	 *
	 * @param      {ArrayBuffer}  data    The data
	 * @param      {String}  mtype   The mtype
	 * @return     {String}  The blob url.
	 */
	static getBlobUrl(data, mtype) {
		return window.URL.createObjectURL(new Blob([data], {
			type: mtype
		}));
	}

	/**
	 * Gets the data url.
	 *
	 * @param      {ArrayBuffer}  data    The data
	 * @param      {string}  mtype   The mtype
	 * @return     {string}  The data url.
	 */
	static getDataUrl(data, mtype) {
		return 'data:' + mtype + ';base64,' + window.nacl.util.encodeBase64(data);
	}
}

/**
 * Applies metadata on media object only if CryptoFilter knows the media type.
 * Without these metadata the processing engine does not find any renderer and apply the default one.
 * It's a non render by information lack.
 *
 * -------------------------------------------------------------------------------------------
 * //mediaObject.setAttribute('type', decrypted.metadata.type);
 * //mediaObject.type = decrypted.metadata.type;
 * ///console.log(mediaObject);
 *
 * original model :
 *      <media-tag src="something" data-type="image/png" data-crypto-key="cryptpad:something">
 *
 * hypothetical model : (mime is hidden inside src data)
 *      <media-tag src="something" data-crypto-key="cryptpad:something">
 *
 * Crypto extracts metadata from the decrypted source and applies it on the media object.
 *
 * @param      {MediaObject}  mediaObject  The media object
 * @param      {Object}  metadata     The metadata
 */
function applyMetadata(mediaObject, metadata) {
	if (CryptoFilter.isAllowedMediaType(metadata.type)) {
		/**
		 * @example
		 * Inside 'src/plugins/renderers/image.js'
		 *
		 * ...
		 * mediaObject.utilsSetAllDataAttributes(element); // Takes all [data-] from attributes and it's done inside plugin job parts.
		 * ...
		 */
		mediaObject.setAttribute('data-type', metadata.type);

		/**
		 * Theses data are used in identification phasis and have to be set.
		 */
		mediaObject.type = metadata.type;
		mediaObject.extension = metadata.extension;
		mediaObject.mime = metadata.mime;
	}
}

function algorithm(mediaObject) {
	const src = mediaObject.getAttribute('src');
	const strKey = mediaObject.getAttribute('data-crypto-key');
	const cryptoKey = Crypto.getKeyFromStr(strKey);

	const xhr = new XMLHttpRequest();
	xhr.open('GET', src, true);
	xhr.responseType = 'arraybuffer';
	xhr.onload = () => {
		const arrayBuffer = xhr.response;
		if (arrayBuffer) {
			const u8 = new Uint8Array(arrayBuffer);
			const binStr = Crypto.decrypt(u8, cryptoKey);
			const url = DataManager.getBlobUrl(binStr, mediaObject.getMimeType());

			const decryptionEvent = new Event('decryption');
			decryptionEvent.blob = new Blob([binStr], {
				type: mediaObject.getMimeType()
			});
			window.document.dispatchEvent(decryptionEvent);

			/**
			 * Modifications applied on mediaObject.
			 * After these modifications the typeCheck
			 * method must return false otherwise the
			 * filter may infinite loop.
			 */
			mediaObject.setAttribute('src', url);
			mediaObject.removeAttribute('data-crypto-key');

			/**
			 * Filters must call chain to try if the
			 * current mediaObject matches other filters.
			 */
			mediaObject.return();
		}
	};
	xhr.send(null);
}

module.exports = algorithm;


/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

/* global window, fetch, XMLHttpRequest, Blob, Event */
const Errors = __webpack_require__(10);
const MediaTag = __webpack_require__(11);
const CryptoFilter = __webpack_require__(7);

const PARANOIA = true;
const plainChunkLength = 128 * 1024;
const cypherChunkLength = 131088;

/**
 * Class for crypto.
 *
 * @class      Crypto (name)
 */
class Cryptopad {
    /**
     * Create a nonce
     */
    static createNonce () {
        return new Uint8Array(new Array(24).fill(0));
    }

   /**
     * Increment a nonce
     * @param      {Uint8Array}  u8      The nonce
     */
    static increment (N) {
        var l = N.length;
        while (l-- > 1) {
            if (PARANOIA) {
                if (typeof(N[l]) !== 'number') {
                    throw new Error('E_UNSAFE_TYPE');
                }
                if (N[l] > 255) {
                    throw new Error('E_OUT_OF_BOUNDS');
                }
            }
        /*  jshint probably suspects this is unsafe because we lack types
            but as long as this is only used on nonces, it should be safe  */
            if (N[l] !== 255) { return void N[l]++; } // jshint ignore:line
            N[l] = 0;

            // you don't need to worry about this running out.
            // you'd need a REAAAALLY big file
            if (l === 0) {
                throw new Error('E_NONCE_TOO_LARGE');
            }
        }
    }

    static encodePrefix (p) {
        return [
            65280, // 255 << 8
            255,
        ].map(function (n, i) {
            return (p & n) >> ((1 - i) * 8);
        });
    }

    static decodePrefix (A) {
        return (A[0] << 8) | A[1];
    }

    static joinChunks (chunks) {
        return new Blob(chunks);
    }

    /**
     * Convert a Uint8Array into Array.
     *
     * @param      {Uint8Array}  u8      The u 8
     * @return     {Array}  Array = require(Uint8Array.
     */
    static slice(u8) {
        return Array.prototype.slice.call(u8);
    }

    /**
     * Gets the random key string.
     *
     * @return     {String}  The random key string.
     */
    static getRandomKeyStr() {
        const Nacl = window.nacl;
        const rdm = Nacl.randomBytes(18);
        return Nacl.util.encodeBase64(rdm);
    }

    /**
     * Gets the key = require(string.
     *
     * @param      {String}  str     The string
     * @return     {Uint8Array}  The key = require(string.
     */
    static getKeyFromStr(str) {
        return window.nacl.util.decodeBase64(str);
    }

    /**
     * Encrypts a Uint8Array with the given key.
     *
     * @param      {<type>}      u8      The u 8
     * @param      {<type>}      key     The key
     * @return     {Uint8Array}  The encrypted content.
     */
    static encrypt(u8, key) {
        const array = u8;
        const nonce = window.nacl.randomBytes(24);
        const packed = window.nacl.secretbox(array, nonce, key);
        if (packed) {
            return new Uint8Array(Cryptopad.slice(nonce).concat(Cryptopad.slice(packed)));
        }
        throw new Error();
    }

    /**
     * Decrypts a Uint8Array with the given key.
     *
     * @param      {Uint8Array}  u8      The u 8
     * @param      {String}  key     The key
     * @return     object YOLO
     */
    static decrypt (u8, key, done) {
        const Nacl = window.nacl;

        const progress = function (offset) {
            const ev = new Event('decryptionProgress');
            ev.percent = (offset / u8.length) * 100;

            window.document.dispatchEvent(ev);
        };

        var nonce = Cryptopad.createNonce();
        var i = 0;

        var prefix = u8.subarray(0, 2);
        var metadataLength = Cryptopad.decodePrefix(prefix);

        var res = {
            metadata: undefined
        };

        var metaBox = new Uint8Array(u8.subarray(2, 2 + metadataLength));

        var metaChunk = Nacl.secretbox.open(metaBox, nonce, key);
        Cryptopad.increment(nonce);

        try { res.metadata = JSON.parse(Nacl.util.encodeUTF8(metaChunk)); }
        catch (e) { return done('E_METADATA_DECRYPTION'); }

        if (!res.metadata) { return done('NO_METADATA'); }

        var takeChunk = function (cb) {
            setTimeout(function () {
                const start = i * cypherChunkLength + 2 + metadataLength;
                const end = start + cypherChunkLength;
                i++;
                const box = new Uint8Array(u8.subarray(start, end));

                // decrypt the chunk
                const plaintext = Nacl.secretbox.open(box, nonce, key);
                Cryptopad.increment(nonce);

                if (!plaintext) { return void cb('DECRYPTION_FAILURE'); }

                progress(Math.min(end, u8.length));

                cb(void 0, plaintext);
            });
        };

        var chunks = [];

        // decrypt file contents
        var again = function () {
            takeChunk(function (e, plaintext) {
                if (e) { return setTimeout(function () { done(e); }); }

                if (plaintext) {
                    if (i * cypherChunkLength < u8.length) { // not done
                        chunks.push(plaintext);
                        return again();
                    }

                    chunks.push(plaintext);
                    res.content = Cryptopad.joinChunks(chunks);
                    return done(void 0, res);
                }
                done('UNEXPECTED_ENDING');
            });
        }
        again();
    };
}

/**
 * Class for data manager.
 *
 * @class      DataManager (name)
 */
class DataManager {
    /**
     * Gets the array buffer = require(a source url.
     *
     * @param      {<type>}  url     The url
     * @return     {<type>}  The array buffer.
     */
    static getArrayBuffer(url) {
        return fetch(url)
        .then(response => {
            if (response.ok) {
                return response.arrayBuffer();
            }
            throw new Errors.FetchFails();
        })
        .then(arrayBuffer => arrayBuffer);
    }

    /**
     * Creates an url.
     *
     * @param      {ArrayBuffer}  arrayBuffer  The array buffer
     * @return     {String}  The url.
     */
    static createUrl(arrayBuffer) {
        return window.URL.createObjectURL(arrayBuffer);
    }

    /**
     * Gets the blob url.
     *
     * @param      {ArrayBuffer}  data    The data
     * @param      {String}  mtype   The mtype
     * @return     {String}  The blob url.
     */
    static getBlobUrl(data, mtype) {
        return window.URL.createObjectURL(new Blob([data], {
            type: mtype
        }));
    }

    /**
     * Gets the data url.
     *
     * @param      {ArrayBuffer}  data    The data
     * @param      {string}  mtype   The mtype
     * @return     {string}  The data url.
     */
    static getDataUrl(data, mtype) {
        return 'data:' + mtype + ';base64,' + window.nacl.util.encodeBase64(data);
    }
}

/**
 *
 * @example
 *
 * //mediaObject.setAttribute('type', decrypted.metadata.type);
 * //mediaObject.type = decrypted.metadata.type;
 * ///console.log(mediaObject);
 *
 * original model :
 *      <media-tag src="something" data-type="image/png" data-crypto-key="cryptpad:something">
 *
 * hypothetical model : (mime is hidden inside src data)
 *      <media-tag src="something" data-crypto-key="cryptpad:something">
 *
 * Crypto extracts metadata from the decrypted source and applies it on the media object.
 *
 * @param      {MediaObject}  mediaObject  The media object
 * @param      {Object}  metadata     The metadata
 */
function applyMetadata(mediaObject, metadata) {
    const info = metadata.type.split('/');
    /**
     * Normailse metadata to MediaTag model.
     */
    const mime = metadata.type;
    const type = info[0];
    const extension = info[1];

    if (CryptoFilter.isAllowedMediaType(mime)) {
        /**
         * @example
         * Inside 'src/plugins/renderers/image.js'
         *
         * ...
         * mediaObject.utilsSetAllDataAttributes(element); // Takes all [data-] from attributes and it's done inside plugin job parts.
         * ...
         */
        mediaObject.setAttribute('data-type', metadata.type);

        /**
         * Theses data are used in identification phasis and have to be set.
         */
        mediaObject.type = type;
        mediaObject.extension = extension;
        mediaObject.mime = mime;
    } else {
        console.log('Not allowed metadata, allowed ones are : ', CryptoFilter.getAllowedMediaTypes());
    }

    /**
     * Data to improve file format recognition at downloading.
     */
    mediaObject.name = metadata.name;
    mediaObject.setAttribute('data-attr-type', metadata.type);
};

function algorithm(mediaObject) {
    const src = mediaObject.getAttribute('src');
    const strKey = mediaObject.getAttribute('data-crypto-key');
    const cryptoKey = Cryptopad.getKeyFromStr(strKey);
    const xhr = new XMLHttpRequest();

    var uid = [src, strKey].join('');

    var followUp = function (decrypted) {
        // Metadata must be set before the blob construction.
        const decryptionEvent = new Event('decryption');
        decryptionEvent.metadata = decrypted.metadata;
        applyMetadata(mediaObject, decrypted.metadata);

        const binStr = decrypted.content;
        const url = DataManager.getBlobUrl(binStr, mediaObject.getMimeType());

        decryptionEvent.blob = new Blob([binStr], {
            type: mediaObject.getMimeType()
        });

        decryptionEvent.metadata = decrypted.metadata;
        CryptoFilter.addAllowedMediaType('audio/mpeg');

        /**
         * Modifications applied on mediaObject.
         * After these modifications the typeCheck
         * method must return false otherwise the
         * filter may infinite loop.
         */
        mediaObject.setAttribute('src', url);
        mediaObject.removeAttribute('data-crypto-key');

        //console.log(decrypted.metadata);
        if (/audio\/(mp3|ogg|wav|webm|mpeg)/.test(decrypted.metadata.type)) {
            // audio types should do the right thing.
        } else if (/application\/pdf/.test(decrypted.metadata.type)) {
            // let it be
        } else if (/video\//.test(decrypted.metadata.type)) {
            // let it be
        } else if (!/image\/(png|jpeg|jpg|gif)/.test(decrypted.metadata.type)) {
            // if it's not an image, present a download link
            decrypted.metadata.type = 'download';
        }

        //console.log(decrypted.metadata);
        applyMetadata(mediaObject, decrypted.metadata);

        decryptionEvent.callback = function (f) {
            /**
             * Filters must call chain to try if the
             * current mediaObject matches other filters.
             */
            MediaTag.processingEngine.return(mediaObject);
            if (typeof(f) === 'function') { f(mediaObject); }
        };

        window.document.dispatchEvent(decryptionEvent);
    };

    var Cache = MediaTag.__Cryptpad_Cache = MediaTag.__Cryptpad_Cache || {};
    if (Cache[uid]) {
        return followUp(Cache[uid]);
    }

    xhr.open('GET', src, true);
    xhr.responseType = 'arraybuffer';

    var fail = function (err) {
        const decryptionErrorEvent = new Event('decryptionError');
        decryptionErrorEvent.message = typeof(err) === 'string'? err: err.message;
        window.document.dispatchEvent(decryptionErrorEvent);
    };

    xhr.onload = function () {
        if (/^4/.test('' + this.status)) {
            return fail("XHR_ERROR", '' + this.status);
        }

        const arrayBuffer = xhr.response;
        if (arrayBuffer) {
            const u8 = new Uint8Array(arrayBuffer);

            Cryptopad.decrypt(u8, cryptoKey, function (err, decrypted) {
                if (err) { return fail(err); }
                Cache[uid] = decrypted;
                followUp(decrypted);
            });
        }
    };
    xhr.send(null);
}

module.exports = algorithm;


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

const Assert = __webpack_require__(24);
const Configuration = __webpack_require__(12);
const Type = __webpack_require__(1);
const PluginUtils = __webpack_require__(27);
const DownloadPlugin = __webpack_require__(14);
const Store = __webpack_require__(6);
const StackStore = __webpack_require__(28);
const PluginStack = __webpack_require__(29);
const Stack = __webpack_require__(15);

/**
 * Class for processing engine.
 *
 * @class      ProcessingEngine (name)
 */
class ProcessingEngine {
	/**
	 * Constructs the object.
	 *
	 * @param      {PluginStore}  pluginStore  The plugin store
	 */
	constructor(pluginStore) {
		Assert.that(pluginStore).not(undefined);

		this.pluginStore = pluginStore;

		/**
		 * Stacks for each media object instances.
		 */
		this.stacks = new StackStore();

		/**
		 * Snapshots of each media object's stack.
		 */
		this.snapshots = new StackStore();

		/**
		 * Stats of each plugin execution.
		 */
		this.stats = new Store();

		/**
		 * Configuration.
		 */
		this.configuration = new Configuration({});

		/**
		 * Default rendering plugin.
		 */
		this.defaultPlugin = new DownloadPlugin(
			'<p> MediaTag cannot find a plugin able to render your content </p>');

		/**
		 * The max size of a plugin stack.
		 */
		this.STACK_SIZE = 50;

		/**
		 * The max count of snapshots.
		 */
		this.SNAPSHOTS_LIMIT = 50;
	}

	/**
	 * Gets key from mediaObject.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 * @return     {number}
	 */
	key(mediaObject) {
		return mediaObject.getId();
	}

	/**
	 * Configures the processing engine.
	 *
	 * @param      {Configuration}  configuration  The configuration
	 */
	configure(configuration) {
		this.configuration = configuration;
		if (configuration.processingEngine) {
			Object.keys(configuration.processingEngine).forEach(key => {
				if (key === 'defaultPlugin') {
					this[key] = configuration.getDefaultPlugin();
				} else {
					this[key] = key;
				}
			});
		}
	}

	/**
	 * Determines if configured.
	 *
	 * @return     {boolean}  True if configured, False otherwise.
	 */
	isConfigured() {
		return Boolean(this.configuration);
	}

	/**
	 * Prepares mediaObject with some stuff.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	prepare(mediaObject) {
		// TODO Handle this stuff properly by test it...
		(() => {
			mediaObject.return = () => {
				return this.return(mediaObject);
			};
			mediaObject.state = 'processing';
		})();
		const key = mediaObject.getId();

		this.stacks.store(key, new PluginStack());
		this.snapshots.store(key, new Stack());
		this.stats.store(key, {});
	}

	/**
	 * Starts a processing over an instance of mediaObject.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	start(mediaObject) {
		this.prepare(mediaObject);
		this.routine(mediaObject);
		this.run(mediaObject);
	}

	/**
	 * Runs a processing engine step on mediaObject.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 * @return     {?MediaObject}
	 */
	run(mediaObject) {
		const key = this.key(mediaObject);
		const plugin = this.stacks.top(key);

		if (!plugin) {
			return this.end(mediaObject);
		}

		if (this.configuration) {
			if (this.configuration.isAllowed(plugin.identifier)) {
				if (!plugin.process) {
					console.warn('FALSY PLUGIN', plugin);
				}
				plugin.process(mediaObject);
			} else {
				this.skip(mediaObject, plugin);
				this.return(mediaObject);
			}
		} else {
			plugin.process(mediaObject);
		}
	}

	/**
	 * Routine
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	routine(mediaObject) {
		this.fill(mediaObject);
		this.snapshot(mediaObject);
		this.check(mediaObject);
	}

	/**
	 * Snapshots the current mediaObject plugin stack.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	snapshot(mediaObject) {
		const key = this.key(mediaObject);
		const stack = this.stacks.get(key).clone();

		this.snapshots.stack(key, stack);
	}

	/**
	 * Fills up the stack of usable plugins on this media object.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	fill(mediaObject) {
		const key = this.key(mediaObject);
		const plugins = this.pluginStore.values();
		const matchedIdentifiers = plugins.filter(plugin => {
			return plugin.getType() === Type.MATCHER;
		}).filter(matcher => {
			return matcher.process(mediaObject);
		}).map(matcher => {
			return matcher.getIdentifier();
		});
		const matchedPlugins = plugins.filter(plugin => {
			return plugin.getType() !== Type.MATCHER;
		}).filter(plugin => {
			return matchedIdentifiers.includes(plugin.getIdentifier());
		});
		const pbo = PluginUtils.filterByOccurrencies(matchedPlugins);

		Object.keys(pbo).forEach(occurrence => {
			pbo[occurrence].forEach(plugin => {
				if (this.configuration.isAllowed(plugin.getIdentifier())) {
					if (this.stacks.get(key).isStackable(plugin)) {
						this.stacks.stack(key, plugin);
					}
				} else {
					this.skip(mediaObject, plugin);
				}
			});
		});
	}

	/**
	 * Updates skipped plugins.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 * @param      {Plugin}  plugin       The plugin
	 */
	skip(mediaObject, plugin) {
		const key = mediaObject.getId();
		let stat = this.stats.get(key);

		if (stat) {
			if (!stat.skipped) {
				stat.skipped = [];
			}
		} else {
			stat = {
				skipped: []
			};
		}
		stat.skipped.push(plugin.identifier);
	}

	/**
	 * Unstacks the top plugin.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	unstack(mediaObject) {
		const stackId = mediaObject.getId();

		if (this.stacks[stackId]) {
			return this.stacks[stackId].pop();
		}
		return null;
	}

	/**
	 * Checks the stack.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	check(mediaObject) {
		const key = mediaObject.getId();

		if (this.stacks.length(key) >= this.STACK_SIZE) {
			console.error('SNAPSHOTS', this.snapshots.get(key));
			throw new Error('Plugin stack size exceed');
		}

		if (this.snapshots.length(key) >= this.SNAPSHOT_LIMIT) {
			console.error('SNAPSHOTS', this.snapshots.get(key));
			throw new Error('Plugin snapshots count exceed');
		}

		let rendererCount = 0;

		this.stacks.plugins(key).forEach(plugin => {
			if (plugin.type === Type.RENDERER) {
				rendererCount++;
			}
		});

		if (rendererCount > 1) {
			console.error('SNAPSHOTS', this.snapshots.get(key));
			throw new Error('More of one renderer in the stack');
		}

		/**
		 * To ends correctly, the stack have to be empty and only one renderer
		 * have to be executed on a mediaObject instance.
		 */
		if (this.stacks.length(key) === 0 && !this.stats.get(key)[Type.RENDERER]) {
			if (!this.defaultPlugin) {
				throw new Error('No default plugin assignated');
			}
			this.stacks.stack(key, this.defaultPlugin);
		}
	}

	/**
	 * Returns the media object to the processing engine.
	 * Every plugin must call this function when their job is done.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	return(mediaObject) {
		const key = mediaObject.getId();
		const plugin = this.stacks.unstack(key);

		if (!plugin) {
			return this.end(mediaObject);
		}

		try {
			if (!this.stats.get(key)) {
				this.stats.store(key, {});
			}

			if (this.stats.get(key)[plugin.type]) {
				this.stats.get(key)[plugin.type] += 1;
			} else {
				this.stats.get(key)[plugin.type] = 1;
			}
		} catch (err) {
			console.error(err, this.snapshots.get(key));
		}

		/**
		 * These types are ineffective on attributes contained
		 * inside a mediaObject instance then we don't need to
		 * refill the stack.
		 */
		if (
			plugin.type !== Type.SANITIZER &&
			plugin.type !== Type.RENDERER
		) {
			this.fill(mediaObject);
		}
		this.snapshot(mediaObject);
		this.check(mediaObject);
		this.run(mediaObject);
	}

	end(mediaObject) {
		mediaObject.status = 'processed';
		return mediaObject;
	}

	setDefaultPlugin(plugin) {
		this.defaultPlugin = plugin;
	}
}

module.exports = ProcessingEngine;


/***/ }),
/* 24 */
/***/ (function(module, exports) {

class Assert {
	/**
	 * Constructs the object.
	 *
	 * @param      {*}  truth   The truth
	 */
	constructor(truth) {
		this.truth = truth;
	}

	/**
	 * Instanciate an assertion on something considered as a truth.
	 *
	 * @param      {*}  truth   The truth
	 * @return     {Assert}
	 */
	static that(truth) {
		return new Assert(truth);
	}

	/**
	 * Asserts is something.
	 * @param      {*}  predicate  The predicate
	 * @return     {Object}
	 */
	is(predicate) {
		if (this.truth === predicate) {
			return this;
		}
		throw new Error(`Assertion fail on : ${this.truth} is ${predicate}`);
	}

	/**
	 * Asserts is not something.
	 *
	 * @param      {*}  predicate  The predicate
	 * @return     {Object}
	 */
	not(predicate) {
		if (this.truth !== predicate) {
			return this;
		}
		throw new Error(`Assertion fail on : ${this.truth} is not ${predicate}`);
	}
}

module.exports = Assert;


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

const Plugin = __webpack_require__(3);

/**
 * Class for group plugins.
 *
 * @class      Group (name)
 */
class Group extends Plugin {
	/**
	 * Constructs the object.
	 */
	constructor(identifier, type, occurrence) {
		super(identifier, type, occurrence);
		this.plugins = [];
	}

	/**
	 * Adds a plugin.
	 *
	 * @param      {Plugin}  plugin  The plugin
	 */
	addPlugin(plugin) {
		if (this.plugins.includes(plugin) === false) {
			this.plugins.push(plugin);
		}
	}

	/**
	 * Removes a plugin.
	 *
	 * @param      {Identifier}  identifier  The identifier
	 * @param      {Type}  type        The type
	 * @param      {Occurrence}  occurrence  The occurrence
	 */
	removePlugin(identifier, type, occurrence) {
		if (!identifier) {
			throw new Error('Identifier is null or undefined');
		}

		this.plugin.filter(plugin => {
			if (type && occurrence) {
				return	identifier === plugin.identifier &&
						type === plugin.type &&
						occurrence === plugin.occurrence;
			}
			if (type) {
				return	identifier === plugin.identifier &&
						type === plugin.type;
			}
			return identifier === plugin.identifier;
		});
	}

	/**
	 * Starts all stored plugins on a media object.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	start(mediaObject) {
		this.plugins.forEach(plugin => {
			plugin.start(mediaObject);
		});
	}
}

module.exports = Group;


/***/ }),
/* 26 */
/***/ (function(module, exports) {

const Permission = {
	ALLOWED: 'allowed',
	REQUIRED: 'required',
	FORBIDDEN: 'forbidden'
};

module.exports = Permission;


/***/ }),
/* 27 */
/***/ (function(module, exports) {

class PluginUtils {
	/**
	 * Filters a plugin list by occurrence.
	 *
	 * @param      {Array<Plugin>}  plugins     The plugins
	 * @param      {Occurence}  occurrence  The occurrence
	 * @return     {Array<Plugin>}  The list of plugins with the same occurrence.
	 */
	static filterByOccurrence(plugins, occurrence) {
		return plugins.filter(plugin => {
			return plugin.occurrence === occurrence;
		});
	}

	/**
	 * Filters plugins by occurencies.
	 *
	 * @param      {Array<Plugin>}  plugins  The plugins
	 * @return     {Object}  Object contaning for all occurrencies a plugin lists.
	 */
	static filterByOccurrencies(plugins) {
		const result = {
			once: [],
			any: [],
			every: []
		};

		for (const plugin of plugins) {
			if (result[plugin.occurrence]) {
				result[plugin.occurrence].push(plugin);
			} else {
				result[plugin.occurrence] = Array.of(plugin);
			}
		}
		return result;
	}
}

module.exports = PluginUtils;


/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

const Store = __webpack_require__(6);

class StackStore extends Store {
	/**
	 * Stacks an object.
	 *
	 * @param      {Object}  object  The object
	 */
	stack(key, object) {
		this.get(key).stack(object);
	}

	/**
	 * Unstacks an object.
	 *
	 * @return     {Object|undefined}
	 */
	unstack(key) {
		return this.get(key).unstack();
	}

	/**
	 * Top of the stack.
	 *
	 * @return     {Object|undefined}
	 */
	top(key) {
		return this.get(key).top();
	}

	/**
	 * Base of the stack.
	 *
	 * @return     {Object}
	 */
	base(key) {
		return this.get(key).base();
	}

	/**
	 * Determines if empty.
	 *
	 * @return     {boolean}  True if empty, False otherwise.
	 */
	isEmpty(key) {
		return this.get(key).isEmpty();
	}

	/**
	 * Stack length.
	 *
	 * @return     {number}
	 */
	length(key) {
		return this.get(key).content.length;
	}

	/**
	 * Stack content.
	 *
	 * @return     {Array}
	 */
	plugins(key) {
		return this.get(key).content;
	}
}

module.exports = StackStore;


/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

const Occurrence = __webpack_require__(5);
const Type = __webpack_require__(1);
const Plugin = __webpack_require__(3);
const Stack = __webpack_require__(15);

class PluginStack extends Stack {
	/**
	 * Determines if plugin.
	 *
	 * @param      {Object}   object  The object
	 * @return     {boolean}  True if plugin, False otherwise.
	 */
	isPlugin(object) {
		return object instanceof Plugin;
	}

	/**
	 * Determines if stackable.
	 *
	 * @param      {Object}   object  The object
	 * @return     {boolean}  True if stackable, False otherwise.
	 */
	isStackable(object) {
		const conditions = [
			this.isPlugin(object),
			!this.content.some(plugin => {
				return	plugin.getIdentifier() === object.getIdentifier() &&
						plugin.getType() === object.getType() &&
						plugin.getOccurrence() === object.getOccurrence() &&
						(
							object.occurrence === Occurrence.ONCE ||
							object.occurrence === Occurrence.ANY
						);
			})
		];

		return conditions.reduce((result, next) => {
			return result && next;
		});
	}

	/**
	 * Stacks a plugin.
	 *
	 * @param      {Plugin}  plugin  The plugin
	 * @override
	 */
	stack(plugin) {
		if (!this.isPlugin(plugin)) {
			throw new Error(`It can't stacks a non plugin instance`);
		}
		if (!this.isStackable(plugin)) {
			throw new Error(`A unique plugin cannot by stacked multiple times`);
		}
		super.stack(plugin);
	}

	/**
	 * Determines if it has renderer.
	 *
	 * @return     {boolean}  True if has renderer, False otherwise.
	 */
	hasRenderer() {
		return this.content.some(plugin => {
			return plugin.type === Type.renderer;
		});
	}

	/**
	 * Determines if ending by renderer.
	 *
	 * @return     {boolean}  True if ending by renderer, False otherwise.
	 */
	isEndingByRenderer() {
		const plugin = this.base();

		return plugin.type === Type.RENDERER;
	}

	/**
	 * Creates a new instance of the object with same properties than original.
	 *
	 * @return     {PluginStack}  Copy of this object.
	 */
	clone() {
		return JSON.parse(JSON.stringify(this));
	}

	plugins() {
		return this.content();
	}
}

module.exports = PluginStack;


/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

const Store = __webpack_require__(6);

class PluginStore extends Store {
	/**
	 * Gets the plugins.
	 *
	 * @param      {Type}  type    The type
	 * @return     {Array<Plugin>}  The plugins.
	 */
	getPlugins(type) {
		const plugins = this.values();

		return plugins.filter(plugin => {
			if (plugin.type === type) {
				return true;
			}
			return false;
		});
	}

	/**
	 * Stores a plugin.
	 *
	 * @param      {Plugin}  plugin  The plugin
	 * @override
	 */
	store(plugin) {
		/**
		 * Warning : A registered plugin can be replaced by another one.
		 */
		super.store([plugin.identifier, plugin.type], plugin);
	}

	/**
	 * Unstores a plugin.
	 *
	 * @param      {Plugin}  plugin  The plugin
	 */
	unstore(plugin) {
		if (PluginStore.isStored([plugin.identifier, plugin.type]) === false) {
			console.warn(`The key "${[plugin.identifier, plugin.type]}" not exists in this manager`);
		} else {
			return super.unstore([plugin.identifier, plugin.type]);
		}
	}
}

module.exports = PluginStore;


/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

/* global document */
const Action = __webpack_require__(32);
const AttributesObject = __webpack_require__(18);
const MediaObject = __webpack_require__(36);
/**
 * Class for media tag.
 *
 * @class      MediaTag (name)
 */
class MediaTag {
	/**
	 * Constructs the object.
	 *
	 * @param      {Element}  mediaTagElement  The media element
	 */
	constructor(mediaTagElement, processingEngine) {
		this.mediaTagElement = mediaTagElement;
		this.processingEngine = processingEngine;

		const attributeObject = new AttributesObject(mediaTagElement);
		const sourcesAttribute =
			attributeObject.getAttribute('sources') || attributeObject.getAttribute('srcs');

		if (sourcesAttribute) {
			const sourceObjects = this.extractSourceObjects(sourcesAttribute);
			const mediaElements = this.extractMediaElements(sourceObjects);

			this.mediaElements = mediaElements;
			this.mediaElements.forEach(mediaElement => {
				this.mediaTagElement.appendChild(mediaElement);
			});
			this.mediaObjects = this.createMediaObjects(mediaElements);

			Action.activate(this.mediaObjects[0], this);

			/**
			 * Fake actions event binding ...
			 */
			// const mediaObjectVideo = this.mediaObjects[0];
			// const mediaObjectImage = this.mediaObjects[2];

			// Offline.on('down', () => {
			// 	Action.activate(mediaObjectImage, this);
			// }, 'down');

			// Offline.on('up', () => {
			// 	Action.activate(mediaObjectVideo, this);
			// }, 'up');

			// const interval = () => {
			// 	let i = 0;
			// 	let step = -1;
			// 	setInterval(() => {
			// 		console.log(i);
			// 		if (i === 0 || i === this.mediaObjects.length - 1) {
			// 			step *= -1;
			// 		}
			// 		if (step > 0) {
			// 			Action.upgrade(this);
			// 		} else {
			// 			Action.downgrade(this);
			// 		}
			// 		i += step;
			// 	}, 3000);
			// };

			// interval();
		} else {
			const mediaObject = new MediaObject(mediaTagElement);
			this.mediaObjects = [mediaObject];
			this.activeMediaObject = this.mediaObjects[0];
		}
	}

	/**
	 * Extracts source objects from a sources attribute.
	 *
	 * @param      {string}  sourcesAttribute  The sources attribute
	 * @return     {Array}
	 */
	extractSourceObjects(sourcesAttribute) {
		return JSON.parse(sourcesAttribute);
	}

	/**
	 * Extracts media elements from source object list.
	 *
	 * @param      {Array<Object>}  sourceObjects  The source objects
	 * @return     {Array}
	 */
	extractMediaElements(sourceObjects) {
		const mediaElements = [];

		sourceObjects.forEach(sourceObject => {
			mediaElements.push(this.extractMediaElement(sourceObject));
		});

		return mediaElements;
	}

	extractMediaElement(sourceObject) {
		const mediaElement = document.createElement('media');

		Object.keys(sourceObject).forEach(attribute => {
			mediaElement.setAttribute(attribute, sourceObject[attribute]);
		});

		return mediaElement;
	}

	/**
	 * Creates media objects.
	 *
	 * @param      {Array<Element>}  mediaElements  The media elements
	 * @return     {Array}
	 */
	createMediaObjects(mediaElements) {
		const mediaObjects = [];

		mediaElements.forEach(mediaElement => {
			const mediaObject = new MediaObject(mediaElement);

			mediaObjects.push(mediaObject);
		});

		return mediaObjects;
	}
}

module.exports = MediaTag;


/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Actions bundle.
 *
 * @type       {Object}
 */

const Action = {
	clear: __webpack_require__(33),
	show: __webpack_require__(16),
	hide: __webpack_require__(17),
	upgrade: __webpack_require__(34),
	downgrade: __webpack_require__(35),
	activate: __webpack_require__(9)
};

module.exports = Action;


/***/ }),
/* 33 */
/***/ (function(module, exports) {

module.exports = mediaObject => {
	mediaObject.clearContents();
};


/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

const activate = __webpack_require__(9);

module.exports = mediaTag => {
	const index = mediaTag.mediaObjects.indexOf(mediaTag.activeMediaObject);
	if (index < mediaTag.mediaObjects.length) {
		activate(mediaTag.mediaObjects[index + 1], mediaTag);
	}
};


/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

const activate = __webpack_require__(9);

module.exports = mediaTag => {
	const index = mediaTag.mediaObjects.indexOf(mediaTag.activeMediaObject);
	if (index > 0) {
		activate(mediaTag.mediaObjects[index - 1], mediaTag);
	}
};


/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

const AttributesObject = __webpack_require__(18);
const Parser = __webpack_require__(37);

/**
 * Media Object is created for each media-tag and contains the
 * information about its contents. It also has helpers functions that
 * can be used by plugins to add functionality to media-tag.
 *
 * @class MediaObject
 * @since 0.2.0
 */
class MediaObject {

	/**
	 * Creates an instance of MediaObject.
	 * @param {Object} attributes Object with attributes that will specify the contents.
	 * @param {HTMLElement} rootElement HTMLElement DOM Node that acts as container to this object.
	 *
	 * @memberOf MediaObject
	 */
	constructor(rootElement) {
		/**
		 * Generate a unique id for this MediaObject, currently necessary to handle
		 * multiple MediaObject in the various engines.
		 */
		this.id = MediaObject.uid();

		this.element = rootElement;

		this.state = 'idle';

		/**
		 * @type {Object} attributesObject Object with attributes that will specify the contents.
		 */
		this.attributesObject = new AttributesObject(rootElement);

		const properties = Parser.parse(this.attributesObject);
		for (const property of Object.keys(properties)) {
			this[property] = properties[property];
		}

		/**
		 * @type {HTMLElement} rootElement HTMLElement DOM Node that acts as
		 * container to this object.
		 */

		// TODO: rethink about what is the best, explicit bind needed
		// functions OR saving the element
		this.hookedFns = {
			hasChildNodes: rootElement.hasChildNodes.bind(rootElement),
			removeChild: rootElement.removeChild.bind(rootElement),
			getLastChild: () => rootElement.lastChild,
			appendChild: rootElement.appendChild.bind(rootElement),
			children: () => rootElement.children
		};
	}

	/**
	 * Sets the properties. Properties are unique, no redefinition otherwise throws error.
	 *
	 * @param      {Object}  properties  The properties
	 */
	setProperties(properties) {
		for (const key in properties) {
			if (this[key]) {
				throw new Error('The property ' + key + ' already exists in this MediaObject !');
			}
			this[key] = properties[key];
		}
	}

	/**
	 * Gets the identifier.
	 *
	 * @return     {Number}  The identifier.
	 */
	getId() {
		return this.id;
	}

	// TODO: define what will be direct method and what will be by getAttribute
	/**
	 * Returns the value of a given attribute.
	 *
	 * @param {string} attrName Attribute identifier.
	 * @returns any the contents of the attribute.
	 *
	 * @memberOf MediaObject
	 */
	getAttribute(attrName) {
		return this.attributesObject[attrName];
	}

	/**
	 * Sets the attribute.
	 *
	 * @param      {String}  name    The name
	 * @param      {*}  value   The value
	 */
	setAttribute(name, value) {
		this.attributesObject[name] = value;
	}

	/**
	 * Removes an attribute.
	 *
	 * @param      {String}  name    The name
	 */
	removeAttribute(name) {
		delete this.attributesObject[name];
	}

	/**
	 * Returns all the attribute identifiers that starts with 'data-attr'.
	 * These attributes are normally passed down to the final element.
	 *
	 * @returns string[] List of attribute identifiers.
	 *
	 * @memberOf MediaObject
	 */
	getAllDataAttrKeys() {
		return Object.keys(this.attributesObject).filter(field => field.startsWith('data-attr'));
	}

	/**
	 * Returns the media content extension when available.
	 *
	 * @returns string Extension of media. For example, if the media
	 * source is "image.png" the extension is "png".
	 *
	 * @memberOf MediaObject
	 */
	getExtension() {
		return this.extension;
	}

	/**
	 * Returns the media content mime type when available.
	 *
	 * @returns string Media mime type. For example, if the media
	 * source is "image.png" the mime type is "image/png".
	 *
	 * @memberOf MediaObject
	 */
	getMimeType() {
		return this.mime;
	}

	/**
	 * Check for existence of a given attribute.
	 *
	 * @param {string} attributeName Attribute identifier to be checked.
	 * @returns Boolean true if attribute exists, false otherwise.
	 *
	 * @memberOf MediaObject
	 */
	hasAttribute(attributeName) {
		return attributeName in this.attributesObject;
	}

	/**
	 * Return the data-type attribute value.
	 *
	 * @returns string data-type attribute value.
	 *
	 * @memberOf MediaObject
	 */
	getType() {
		return this.type;
	}

	/**
	 * Gets the source.
	 *
	 * @return     {string}  The source.
	 */
	getSource() {
		return this.src;
	}

	/**
	 * Gets the sources.
	 *
	 * @return     {Array<Object>}  The sources.
	 */
	getSources() {
		return this.sources;
	}

	/**
	 * Cleans up the mediaTag element.
	 */
	clearContents() {
		while (this.hookedFns.hasChildNodes()) {
			this.hookedFns.removeChild(this.hookedFns.getLastChild());
		}
	}

	/**
	 * Replace the contents of the container, associated to the object,
	 * by the given elements. All previous contents of the container are
	 * erased.
	 *
	 * @param {HTMLElement[]} elements List of HTMLElement elements.
	 *
	 * @memberOf MediaObject
	 */
	replaceContents(elements) {
		/**
		 * Cleans up <media-tag> element. (root)
		 */
		this.clearContents();

		/**
		 * Adds elements to <media-tag> element. (root)
		 */
		elements.forEach(element => this.hookedFns.appendChild(element));
	}

	/**
	 * Sets all data-attr-* to * on the given element. For example,
	 * given a media-tag with data-attr-width="200px", this function
	 * will set element.setAttribute('width', '200px'). Notice that
	 * the attribute set have the prefix 'data-attr-' removed.
	 *
	 * @param {HTMLElement} element Element that will have attributes set.
	 *
	 * @memberOf MediaObject
	 */
	utilsSetAllDataAttributes(element) {
		const dataAttributes = this.getAllDataAttrKeys();
		dataAttributes.forEach(dataAttr => element.setAttribute(dataAttr.substr(10), this.getAttribute(dataAttr)));
	}

	/**
	 * Pass to the given element all data-attr-* attributes. For
	 * example, given a media-tag with data-attr-width="200px", this
	 * function will set element.setAttribute('data-attr-width','200px').
	 * Notice that the attribute set has still the prefix 'data-attr-'.
	 *
	 * @param {HTMLElement} element Element that will have attributes set.
	 *
	 * @memberOf MediaObject
	 */
	utilsPassAllDataAttributes(element) {
		const dataAttributes = this.getAllDataAttrKeys();
		dataAttributes.forEach(dataAttr => element.setAttribute(dataAttr, this.getAttribute(dataAttr)));
	}
}

/**
 * Unique id generator.
 */
MediaObject.uid = (i => () => i++)(0);

/**
 * Builds a attributesObject with a DOM element.
 *
 * @param      {DOMElement}  element    The element
 * @return     {Object}  { description_of_the_return_value }
 */

MediaObject.attributesObject = element => {
	const attributesObject = {};

	if (element.hasAttributes()) {
		const attributes = element.attributes;
		const keys = Object.keys(attributes);

		keys.forEach(key => {
			const attribute = attributes[key];

			attributesObject[attribute.name] = attribute.value;
		});
	}

	attributesObject.hasAttribute = name => {
		return true && attributesObject[name];
	};

	return attributesObject;
};

module.exports = MediaObject;


/***/ }),
/* 37 */
/***/ (function(module, exports) {

/* global window */

/**
 * Class for parse.
 *
 * @class      Parser (name)
 */
class Parser {

	/**
	 * Returns the AttributeObject extension.
	 *
	 * @param      {Object}  AttributeObject  The media object
	 * @return     {String}  The extension
	 */
	static extension(AttributeObject) {
		const dataType = AttributeObject.getAttribute('data-type');
		if (dataType) {
			return dataType.split('/')[1];
		}
		return undefined;
	}

	/**
	 * Returns the AttributeObject type.
	 *
	 * @param      {Object}  AttributeObject  The media object
	 * @return     {String}  The type
	 */
	static type(AttributeObject) {
		const dataType = AttributeObject.getAttribute('data-type');
		if (dataType) {
			return dataType.split('/')[0];
		}
		return undefined;
	}

	/**
	 * Returns the AttributeObject mime.
	 *
	 * @param      {Object}  AttributeObject  The media object
	 * @return     {String}  The mime
	 */
	static mime(AttributeObject) {
		return AttributeObject.getAttribute('data-type');
	}

	/**
	 * Returns the AttributeObject protocol.
	 *
	 * @param      {Object}  AttributeObject  The media object
	 * @return     {String}  The protocol
	 */
	static protocol(AttributeObject) {
		const array = AttributeObject.getAttribute('src').split('://');
		if (array.length > 1) {
			return array[0];
		}
		return window.location.protocol;
	}

	/**
	 * Returns the AttributeObject hostname.
	 *
	 * @param      {Object}  AttributeObject  The media object
	 * @return     {String}  The hostname
	 */
	static hostname(AttributeObject) {
		const array = AttributeObject.getAttribute('src').split('://');
		if (array.length > 1) {
			return array[1].split('/')[0];
		}
		return window.location.hostname;
	}

	/**
	 * Returns the AttributeObject source.
	 *
	 * @param      {Object}  AttributeObject  The media object
	 * @return     {String}  The source
	 */
	static source(AttributeObject) {
		const source = AttributeObject.getAttribute('src');

		return source;
	}

	/**
	 * Finds schemes in the source.
	 *
	 * @param      {Object}  AttributeObject  The media object
	 * @return     {Array<string>}  All schemes found in the source.
	 */
	static schemes(AttributeObject) {
		return /\w+:/.exec(AttributeObject.getAttribute('src'));
	}

	/**
	 * Returns json parsed object from AttributeObject sources.
	 *
	 * @param      {Object}  AttributeObject  The media object
	 * @return     {?Array<Object>}
	 */
	static sources(AttributeObject) {
		const sources =
			AttributeObject.getAttribute('sources') || AttributeObject.getAttribute('srcs');

		if (sources) {
			return JSON.parse(sources);
		}
		return null;
	}

	/**
	 * Returns json parsed object from AttributeObject actions.
	 *
	 * @param      {Object}  AttributeObject  The media object
	 * @return     {?Array<Object>}
	 */
	static actions(AttributeObject) {
		const actions = AttributeObject.getAttribute('actions');

		if (actions) {
			return JSON.parse(actions);
		}
		return null;
	}

	/**
	 * Returns a properties set extracted from the AttributeObject.
	 *
	 * @param      {Object}  AttributeObject  The media object
	 * @return     {Object}
	 */
	static parse(AttributeObject) {
		return {
			protocol: Parser.protocol(AttributeObject),
			hostname: Parser.hostname(AttributeObject),
			src: Parser.source(AttributeObject),
			type: Parser.type(AttributeObject),
			extension: Parser.extension(AttributeObject),
			mime: Parser.mime(AttributeObject),
			sources: Parser.sources(AttributeObject),
			actions: Parser.actions(AttributeObject)
		};
	}
}

module.exports = Parser;


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

/* global document */
const Store = __webpack_require__(6);
const Configuration = __webpack_require__(12);

class Loader {
	/**
	 * Constructs the object.
	 */
	constructor() {
		/**
		 * To store to manage loaded url like a kind of cache.
		 */
		this.store = new Store();

		/**
		 * To store promises and bring back a unique url to avoid multiple same loading.
		 */
		this.promiseStore = new Store();
	}

	isStored(url) {
		return this.store.isStore(url);
	}

	/**
	 * Loads script only one time.
	 *
	 * @param      {string}   url     The url
	 * @return     {Promise}
	 */
	script(url) {
		if (!this.promiseStore.isStored(url)) {
			this.promiseStore.store(url, new Promise((resolve, reject) => {
				const script = document.createElement('script');

				script.type = 'text/javascript';
				script.src = url;
				script.onload = resolve;
				script.onerror = reject;
				script.abort = reject;
				document.head.appendChild(script);
			}));
		}
		return this.promiseStore.get(url);
	}

	/**
	 * Loads a configuration only one time.
	 *
	 * @param      {<type>}   url     The url
	 * @return     {Promise}  { description_of_the_return_value }
	 */
	configuration(url) {
		if (!this.store.isStored(url)) {
			return new Promise((resolve, reject) => {
				const script = document.createElement('script');

				script.src = url;
				script.type = 'text/javascript';

				document.addEventListener('Configuration', event => {
					const configuration = event.configuration;

					if (this.store.isStored(url)) {
						configuration.origin = 'store';
					} else {
						this.store.store(url, event.configuration);
						configuration.origin = url;
					}
					resolve(new Configuration(configuration));
				});
				script.onerror = err => {
					reject(err);
				};
				document.head.appendChild(script);
			});
		}
		return new Promise(resolve => {
			resolve(new Configuration(this.store.get(url)));
		});
	}

	algorithm(url) {
		if (!this.promiseStore.isStored(url)) {
			this.promiseStore.store(url, new Promise((resolve, reject) => {
				const script = document.createElement('script');

				script.src = url;
				script.type = 'text/javascript';
				document.addEventListener('Algorithm', event => {
					if (!this.store.isStored(url)) {
						this.store.store(url, event.algorithm);
					}
					resolve(this.store.get(url));
				});
				script.onerror = err => {
					reject(err);
				};
				document.head.appendChild(script);
			}));
		}
		return this.promiseStore.get(url);
	}
}

module.exports = Loader;


/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

/* global document  */
const Renderer =	__webpack_require__(4);
const Identifier = 	__webpack_require__(0);

class ImageRenderer extends Renderer {
	/**
	 * Constructs the object.
	 */
	constructor() {
		super(Identifier.IMAGE);
	}

	/**
	 * Job to realise to render a image with a mediaObject.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	process(mediaObject) {
		const element = document.createElement('img');

		element.setAttribute('src', mediaObject.getAttribute('src'));
		mediaObject.utilsSetAllDataAttributes(element);
		mediaObject.replaceContents([element]);
		mediaObject.return();
	}
}

module.exports = ImageRenderer;


/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

/* global document */
const Renderer =	__webpack_require__(4);
const Identifier = 	__webpack_require__(0);

class AudioRenderer extends Renderer {
	/**
	 * Constructs the object.
	 */
	constructor() {
		super(Identifier.AUDIO);
	}

	/**
	 * Job to realise to render an audio with a mediaObject.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	process(mediaObject) {
		const element = document.createElement('audio');

		element.setAttribute('src', mediaObject.getAttribute('src'));
		element.setAttribute('controls', true);
		mediaObject.utilsSetAllDataAttributes(element);
		mediaObject.replaceContents([element]);

		mediaObject.return();
	}
}

module.exports = AudioRenderer;


/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

/* global document */
const Renderer =	__webpack_require__(4);
const Identifier = 	__webpack_require__(0);

class VideoRenderer extends Renderer {
	/**
	 * Constructs the object.
	 */
	constructor() {
		super(Identifier.VIDEO);
	}

	/**
	 * Job to realise to render a video with a mediaObject.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	process(mediaObject) {
		const element = document.createElement('video');

		element.setAttribute('src', mediaObject.getAttribute('src'));
		element.setAttribute('controls', true);
		mediaObject.utilsSetAllDataAttributes(element);
		mediaObject.replaceContents([element]);
		mediaObject.return();
	}
}

module.exports = VideoRenderer;


/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

/* global document, XMLHttpRequest */
const Renderer =	__webpack_require__(4);
const Identifier = 	__webpack_require__(0);

const Mode = {
	PDFJS: 'pdfjs',
	DEFAULT: 'default'
};

class PdfRenderer extends Renderer {
	/**
	 * Constructs the object.
	 */
	constructor() {
		super(Identifier.PDF);
		this.viewer = PdfRenderer.viewer;
		this.mode = PdfRenderer.mode;
	}

	/**
	 * Job to realise to render a pdf with a mediaObject.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	process(mediaObject) {
		const url = mediaObject.getAttribute('src');
		const iframe = document.createElement('iframe');

		/**
		 * Default dimention for the iframe if nothing is specified.
		 */
		if (!mediaObject.getAttribute('data-attr-width')) {
			iframe.setAttribute('width', '100%');
		}
		if (!mediaObject.getAttribute('data-attr-height')) {
			iframe.setAttribute('height', document.body.scrollHeight);
		}

		/**
		 * When no viewer is set, the pdf is rendered by the browser.
		 */
		if (!this.viewer) {
			this.mode = Mode.DEFAULT;
		}

		switch (this.mode) {
			case Mode.PDFJS: {
				const viewerUrl = `${this.viewer}?file=${url}`;
				const xhr = new XMLHttpRequest();

				xhr.onload = () => {
					if (xhr.status < 400) {
						iframe.src = viewerUrl;
					} else {
						console.warn(`The pdfjs viewer has not been found ...
							The browser viewer will be used by default`);
						iframe.src = `${url}`;
					}
				};
				xhr.open('HEAD', viewerUrl, true);
				xhr.send();

				break;
			}
			default: {
				iframe.src = `${url}`;
			}
		}

		mediaObject.utilsSetAllDataAttributes(iframe);
		mediaObject.replaceContents([iframe]);

		iframe.onload = () => {
			mediaObject.return();
		};
	}
}

/**
 * Viewer for pdfjs render.
 */
PdfRenderer.viewer = null;

/**
 * Render mode.
 */
PdfRenderer.mode = Mode.PDFJS;

module.exports = PdfRenderer;


/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

/* global document, shaka */
const Renderer =	__webpack_require__(4);
const Identifier = 	__webpack_require__(0);

class DashRenderer extends Renderer {
	/**
	 * Constructs the object.
	 */
	constructor() {
		super(Identifier.DASH);
	}

	/**
	 * Job to realise to render a dash with a mediaObject.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	process(mediaObject) {
		const video = document.createElement('video');
		const player = new shaka.Player(video);
		const id = mediaObject.getAttribute('id');
		const key = mediaObject.getAttribute('key');

		if (id && key) {
			const clearKeyStringObject = '{"' + id + '": "' + key + '"}';
			const clearKey = JSON.parse(clearKeyStringObject);
			player.configure({
				drm: {
					clearKeys: clearKey
				}
			});
		}
		video.setAttribute('controls', true);
		mediaObject.utilsSetAllDataAttributes(video);
		mediaObject.replaceContents([video]);
		player.load(mediaObject.getAttribute('src')).then(() => {});
		mediaObject.return();
	}
}

module.exports = DashRenderer;


/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

const Filter =		__webpack_require__(8);
const Identifier = 	__webpack_require__(0);

class ClearKeyFilter extends Filter {
	/**
	 * Constructs the object.
	 */
	constructor() {
		super(Identifier.CLEAR_KEY);
	}

	/**
	 * Job to realise on a mediaObject.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	process(mediaObject) {
		const clearKey = mediaObject.getAttribute('data-clear-key');
		const id = clearKey.substring(0, 32);
		const key = clearKey.substring(33, 65);

		mediaObject.setAttribute('id', id);
		mediaObject.setAttribute('key', key);
		mediaObject.removeAttribute('data-clear-key');
		mediaObject.return();
	}
}

module.exports = ClearKeyFilter;


/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

const Sanitizer =	__webpack_require__(13);
const Identifier = 	__webpack_require__(0);

class MediaObjectSanitizer extends Sanitizer {
	/**
	 * Constructs the object.
	 */
	constructor() {
		super(Identifier.MEDIA_OBJECT);
	}

	/**
	 * Job to process on mediaObject.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	process(mediaObject) {
		mediaObject.return();
	}
}

module.exports = MediaObjectSanitizer;


/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Renderer matchers
 */
const ImageMatcher = 		__webpack_require__(47);
const AudioMatcher = 		__webpack_require__(48);
const VideoMatcher = 		__webpack_require__(49);
const PdfMatcher = 			__webpack_require__(50);
const DashMatcher = 		__webpack_require__(51);
const DownloadMatcher = 	__webpack_require__(52);

/**
 * Filter matchers
 */
const CryptoMatcher = 		__webpack_require__(53);
const ClearKeyMatcher = 	__webpack_require__(54);

/**
 * Sanitizer matchers
 */
const MediaObjectMatcher =	__webpack_require__(55);

/**
 * Media Tag API
 */
const MediaTag = 			__webpack_require__(11);

/**
 * Store every matchers to detect when an job part plugin should be loaded
 * and should be applied on a media object. So it works for static and dynamic
 * media tag mode.
 */

MediaTag.pluginStore.store(new ImageMatcher());
MediaTag.pluginStore.store(new AudioMatcher());
MediaTag.pluginStore.store(new VideoMatcher());
MediaTag.pluginStore.store(new PdfMatcher());
MediaTag.pluginStore.store(new DashMatcher());
MediaTag.pluginStore.store(new DownloadMatcher());

MediaTag.pluginStore.store(new CryptoMatcher());
MediaTag.pluginStore.store(new ClearKeyMatcher());

MediaTag.pluginStore.store(new MediaObjectMatcher());

module.exports = MediaTag;


/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

const Identifier = 	__webpack_require__(0);
const Type = 		__webpack_require__(1);
const Matcher =		__webpack_require__(2);

class ImageMatcher extends Matcher {
	/**
	 * Constructs the object.
	 */
	constructor() {
		super(Identifier.IMAGE, Type.RENDERER);
	}

	/**
	 * Job to realise to render a image with a mediaObject.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	process(mediaObject) {
		const regexExtensions = /^png|jpg|jpeg|gif|svg[+]xml$/;
		const regexMimes = /^image[/](png|jpg|jpeg|gif|svg[+]xml)$/;

		return	mediaObject.hasAttribute('src') &&
				mediaObject.getType() === 'image' &&
				regexExtensions.exec(mediaObject.getExtension()) !== null &&
				regexMimes.exec(mediaObject.getMimeType()) !== null;
	}
}

module.exports = ImageMatcher;


/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

const Identifier = 	__webpack_require__(0);
const Type = 		__webpack_require__(1);
const Matcher =		__webpack_require__(2);

class AudioMatcher extends Matcher {
	/**
	 * Constructs the object.
	 */
	constructor() {
		super(Identifier.AUDIO, Type.RENDERER);
	}

	/**
	 * Job to realise to render a image with a mediaObject.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	process(mediaObject) {
		const regexExtensions = /^mp3|ogg|webm|wav|mpeg$/;
		const regexMimes = /^audio[/](mp3|ogg|webm|wav|mpeg)$/;

		return	mediaObject.hasAttribute('src') &&
				mediaObject.getType() === 'audio' &&
				regexExtensions.exec(mediaObject.getExtension()) !== null &&
				regexMimes.exec(mediaObject.getMimeType()) !== null;
	}
}

module.exports = AudioMatcher;


/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

const Identifier = 	__webpack_require__(0);
const Type = 		__webpack_require__(1);
const Matcher =		__webpack_require__(2);

class VideoMatcher extends Matcher {
	/**
	 * Constructs the object.
	 */
	constructor() {
		super(Identifier.VIDEO, Type.RENDERER);
	}

	/**
	 * Job to realise to render a image with a mediaObject.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	process(mediaObject) {
		const regexExtensions = /^mp4|ogg|webm$/;
		const regexMimes = /^video[/](mp4|ogg|webm)$/;

		return	mediaObject.hasAttribute('src') &&
				mediaObject.getType() === 'video' &&
				regexExtensions.exec(mediaObject.getExtension()) !== null &&
				regexMimes.exec(mediaObject.getMimeType()) !== null;
	}
}

module.exports = VideoMatcher;


/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

const Identifier = 	__webpack_require__(0);
const Type = 		__webpack_require__(1);
const Matcher =		__webpack_require__(2);

class PdfMatcher extends Matcher {
	/**
	 * Constructs the object.
	 */
	constructor() {
		super(Identifier.PDF, Type.RENDERER);
	}

	/**
	 * Job to realise to render a image with a mediaObject.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	process(mediaObject) {
		const regexExtensions = /^pdf$/;
		const regexMimes = /^application[/]pdf$/;

		return	mediaObject.hasAttribute('src') &&
				mediaObject.getType() === 'application' &&
				regexExtensions.exec(mediaObject.getExtension()) !== null &&
				regexMimes.exec(mediaObject.getMimeType()) !== null;
	}
}

module.exports = PdfMatcher;


/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

const Identifier = 	__webpack_require__(0);
const Type = 		__webpack_require__(1);
const Matcher =		__webpack_require__(2);

class DashMatcher extends Matcher {
	/**
	 * Constructs the object.
	 */
	constructor() {
		super(Identifier.DASH, Type.RENDERER);
	}

	/**
	 * Job to realise to render a image with a mediaObject.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	process(mediaObject) {
		const regexExtensions = /^dash[+]xml$/;
		const regexMimes = /^application[/]dash[+]xml$/;

		return	mediaObject.hasAttribute('src') &&
				mediaObject.getType() === 'application' &&
				regexExtensions.exec(mediaObject.getExtension()) !== null &&
				regexMimes.exec(mediaObject.getMimeType()) !== null;
	}
}

module.exports = DashMatcher;


/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

const Identifier = 	__webpack_require__(0);
const Type = 		__webpack_require__(1);
const Matcher =		__webpack_require__(2);

class ImageMatcher extends Matcher {
	/**
	 * Constructs the object.
	 */
	constructor() {
		super(Identifier.DOWNLOAD, Type.RENDERER);
	}

	/**
	 * Job to realise to render a image with a mediaObject.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	process(mediaObject) {
		return	mediaObject.hasAttribute('src') &&
				mediaObject.getType() === 'download';
	}
}

module.exports = ImageMatcher;


/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

const Identifier = 	__webpack_require__(0);
const Type = 		__webpack_require__(1);
const Matcher =		__webpack_require__(2);

class CryptoMatcher extends Matcher {
	/**
	 * Constructs the object.
	 */
	constructor() {
		super(Identifier.CRYPTO, Type.FILTER);
	}

	/**
	 * Job to realise to render a image with a mediaObject.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	process(mediaObject) {
		return	mediaObject.hasAttribute('data-crypto-key');
	}
}

module.exports = CryptoMatcher;


/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

const Identifier = 	__webpack_require__(0);
const Type = 		__webpack_require__(1);
const Matcher =		__webpack_require__(2);

class ClearKeyMatcher extends Matcher {
	/**
	 * Constructs the object.
	 */
	constructor() {
		super(Identifier.CLEAR_KEY, Type.FILTER);
	}

	/**
	 * Job to realise to render a image with a mediaObject.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	process(mediaObject) {
		return	mediaObject.hasAttribute('data-clear-key');
	}
}

module.exports = ClearKeyMatcher;


/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

const Identifier = 	__webpack_require__(0);
const Type = 		__webpack_require__(1);
const Matcher =		__webpack_require__(2);

class MediaObjectMatcher extends Matcher {
	/**
	 * Constructs the object.
	 */
	constructor() {
		super(Identifier.MEDIA_OBJECT, Type.SANITIZER);
	}

	/**
	 * Job to realise to render a image with a mediaObject.
	 *
	 * @param      {MediaObject}  mediaObject  The media object
	 */
	process(mediaObject) {
		return	mediaObject.hasAttribute('src') &&
				mediaObject.hasAttribute('data-type');
	}
}

module.exports = MediaObjectMatcher;


/***/ })
/******/ ]);
});