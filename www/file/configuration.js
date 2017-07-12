/* global document, saveAs, XMLHttpRequest, shaka, File, Event */

(function () {
	const event = new Event('Configuration');

	event.configuration = {
		dependencies: [
			// '/bower_components/tweetnacl/nacl.min.js',
			// '/bower_components/file-saver/FileSaver.min.js'
		],
		processingEngine: {
			defaultPlugin: 'failure'
		},
		permissions: {
			// image: 'forbidden',
			// audio: 'forbidden',
			// video: 'forbidden',
			// dash: 'forbidden',
			// pdf: 'forbidden',
			// crypto: 'forbidden',
			// clearKey: 'forbidden'
		},
		plugins: {
			image: {
				matcher: {
					types: [
						'image'
					],
					subtypes: [
						'png',
						'jpg',
						'jpeg',
						'gif',
						'svg+xml'
					],
					process: (self, mediaObject) => {
						const hasType = self.types.includes(mediaObject.getType());
						const hasSubtype = self.subtypes.includes(mediaObject.getExtension());

						return hasType && hasSubtype;
					}
				},
				renderer: {
					process: (self, mediaObject) => {
						const element = document.createElement('img');

						element.setAttribute('src', mediaObject.getAttribute('src'));
						mediaObject.utilsSetAllDataAttributes(element);
						mediaObject.replaceContents([element]);
						mediaObject.return();
					}
				}
			},
			audio: {
				matcher: {
					types: [
						'audio'
					],
					subtypes: [
						'mp3',
						'ogg',
						'webm',
						'wav'
					],
					process: (self, mediaObject) => {
						const hasType = self.types.includes(mediaObject.getType());
						const hasSubtype = self.subtypes.includes(mediaObject.getExtension());

						return hasType && hasSubtype;
					}
				},
				renderer: {
					process: (self, mediaObject) => {
						const element = document.createElement('audio');

						element.setAttribute('src', mediaObject.getAttribute('src'));
						element.setAttribute('controls', true);
						mediaObject.utilsSetAllDataAttributes(element);
						mediaObject.replaceContents([element]);
						mediaObject.return();
					}
				}
			},
			video: {
				matcher: {
					types: [
						'video'
					],
					subtypes: [
						'mp4',
						'ogg',
						'webm'
					],
					process: (self, mediaObject) => {
						const hasType = self.types.includes(mediaObject.getType());
						const hasSubtype = self.subtypes.includes(mediaObject.getExtension());

						return hasType && hasSubtype;
					}
				},
				renderer: {
					process: (self, mediaObject) => {
						const element = document.createElement('video');

						element.setAttribute('src', mediaObject.getAttribute('src'));
						element.setAttribute('controls', true);
						mediaObject.utilsSetAllDataAttributes(element);
						mediaObject.replaceContents([element]);
						mediaObject.return();
					}
				}
			},
			dash: {
				matcher: {
					types: [
						'application'
					],
					subtypes: [
						'dash+xml'
					],
					process: (self, mediaObject) => {
						const hasType = self.types.includes(mediaObject.getType());
						const hasSubtype = self.subtypes.includes(mediaObject.getExtension());

						return hasType && hasSubtype;
					}
				},
				renderer: {
					process: (self, mediaObject) => {
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
			},
			pdf: {
				matcher: {
					types: [
						'application'
					],
					subtypes: [
						'pdf'
					],
					process: (self, mediaObject) => {
						const hasType = self.types.includes(mediaObject.getType());
						const hasSubtype = self.subtypes.includes(mediaObject.getExtension());

						return hasType && hasSubtype;
					}
				},
				renderer: {
					viewer: '/pdfjs/web/viewer.html',
					mode: 'pdfjs',
					process: (self, mediaObject) => {
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
						if (!self.viewer) {
							self.mode = 'default';
						}

						switch (self.mode) {
							case 'pdfjs': {
								const viewerUrl = `${self.viewer}?file=${url}`;
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
			},
			failure: {
				matcher: {
					process: (self, mediaObject) => {
						return 	mediaObject.hasAttribute('src') &&
								mediaObject.getType() === 'download';
					}
				},
				renderer: {
					prepareContainer: () => {
						const element = document.createElement('div');

						element.style.textAlign = 'center';
						element.style.verticalAlign = 'middle';

						return element;
					},
					prepareMessage: () => {
						const element = document.createElement('div');

						element.style.margin = 'auto';
						element.style.paddingTop = '3%';
						element.style.paddingBottom = '3%';
						element.style.background = '#ff4444';
						element.style.width = '80%';
						element.style.color = 'white';
						element.innerHTML = `
							Sorry, but Media Tag is not able to render your media ... <br><br><br>
							<hr><br><br>
							Click on the button to download your decrypted content.
						`;

						return element;
					},
					prepareButton: () => {
						const element = document.createElement('button');

						element.style.margin = 'auto';
						element.style.marginTop = '60px';
						element.style.height = '40px';
						element.style.width = '80%';
						element.innerHTML = 'DOWNLOAD';

						return element;
					},
					process: (self, mediaObject) => {
						const container = self.prepareContainer();
						const message = self.prepareMessage();
						const button = self.prepareButton();

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

						container.appendChild(message);
						container.appendChild(button);

						mediaObject.utilsSetAllDataAttributes(container);
						mediaObject.replaceContents([container]);

						mediaObject.return();
					}
				}
			},
			crypto: {
				matcher: {
					process: (self, mediaObject) => {
						return mediaObject.hasAttribute('data-crypto-key');
					}
				},
				filter: {
					algorithms: [
						{
							scheme: 'cryptpad:',
							src: './algorithms/cryptpad.js',
							run: null
						},
						{
							scheme: 'salsa20poly1305:',
							src: './algorithms/salsa20poly1305.js',
							run: null
						}
					],
					types: [
						'image',
						'audio',
						'video',
						'application'
					],
					subtypes: [
						'png',
						'jpg',
						'jpeg',
						'gif',
						'svg+xml',
						'mp3',
						'mpeg',
						'ogg',
						'webm',
						'wav',
						'mp4',
						'dash+xml',
						'pdf'
					],
					isAllowedMediaType: (self, type) => {
						const mimeTypes = self.types.map(type => {
							return self.subtypes.map(subtype => {
								return `${type}/${subtype}`;
							});
						}).reduce((array, next) => {
							return array.concat(next);
						});

						if (mimeTypes.includes(type)) {
							return true;
						}
						return false;
					},
					process: (self, mediaObject) => {
						const cryptoUrl = mediaObject.getAttribute('data-crypto-key');

						const scheme = self.algorithms.map(algorithm => {
							return algorithm.scheme;
						}).filter(scheme => {
							return cryptoUrl.includes(scheme);
						}).reduce((result, next) => {
							return result || next;
						});

						if (!scheme) {
							throw new Error(`No matching scheme found`);
						}

						const key = cryptoUrl.replace(scheme, '');

						const algorithm = self.algorithms.filter(algorithm => {
							return algorithm.scheme === scheme;
						}).reduce((result, next) => {
							return result || next;
						});

						mediaObject.setAttribute('data-crypto-key', key);

						if (!algorithm) {
							throw new Error(`No algorithm for the scheme '${scheme}'`);
						}

						if (!algorithm.run && algorithm.src) {
							mediaObject.loader.algorithm(algorithm.src).then(algorithm => {
								algorithm.run = algorithm;
								algorithm.run(self, mediaObject);
							});
						} else if (algorithm.run) {
							algorithm.run(self, mediaObject);
						} else {
							throw new Error(`No source and no algorithm to run for self scheme '${scheme}'`);
						}
					}
				}
			}
		}
	};

	document.dispatchEvent(event);
})();
