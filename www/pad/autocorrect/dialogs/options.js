/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

( function() {
	var plugin = CKEDITOR.plugins.autocorrect;

	function setupOption() {
		this.setValue(plugin.getOption(this.option));
	}

	function commitOption() {
		plugin.setOption(this.option, this.getValue());
	}

	CKEDITOR.dialog.add( 'autocorrectOptions', function( editor ) {
		var lang = editor.lang.autocorrect;
		return {
				title: lang.autocorrect,
				resizable: CKEDITOR.DIALOG_RESIZE_NONE,
				minWidth: 350,
				minHeight: 170,
				onOk: function() {
					this.commitContent();
				},
				contents: [
					{
					id: 'autocorrect',
					label: lang.autocorrect,
					title: lang.autocorrect,
					accessKey: '',
					elements: [
							{
							type: 'vbox',
							padding: 0,
							children: [
								{
								type: 'checkbox',
								id: 'useReplacementTableCheckbox',
								option: 'useReplacementTable',
								setup: setupOption,
								commit: commitOption,
								isChanged: false,
								label: lang.replaceTextAsYouType
							},
							{
								type: 'html',
								html: '<div style="height: 150px;overflow-y: scroll;border: 1px solid #afafaf"></div>',
								setup: function() {
									this.getElement().setHtml('');
									var option = plugin.getOption('replacementTable');
									var table = document.createElement('table');
									table.style.width = '100%';
									table.style.tableLayout = 'fixed';
									var tbody = table.appendChild(document.createElement('tbody'));
									for (var prop in option) {
										var row = document.createElement('tr');
										var cell1 = document.createElement('td');
										cell1.appendChild(document.createTextNode(prop));
										cell1.style.borderBottom = '1px solid #afafaf';
										cell1.style.padding = '0 5px';
										var cell2 = document.createElement('td');
										row.appendChild(cell1);
										cell2.appendChild(document.createTextNode(option[prop]));
										cell2.style.borderBottom = '1px solid #afafaf';
										cell2.style.padding = '0 5px';
										row.appendChild(cell2);
										tbody.appendChild(row);
									}
									this.getElement().append(new CKEDITOR.dom.element(table));
								}
							}]
						}
					]
				},
					{
					id: 'autoformatAsYouType',
					label: lang.autoformatAsYouType,
					title: lang.autoformatAsYouType,
					accessKey: '',
					elements: [
						{
						type: 'fieldset',
						label: CKEDITOR.tools.htmlEncode( lang.replaceAsYouType ),
						children: [
							{
							type: 'vbox',
							padding: 0,
							children: [
								{
								type: 'checkbox',
								id: 'smartQuotesCheckbox',
								option: 'smartQuotesAsYouType',
								setup: setupOption,
								commit: commitOption,
								isChanged: false,
								label: lang.smartQuotesOption
							},
								{
								type: 'checkbox',
								id: 'formatOrdinalsCheckbox',
								option: 'formatOrdinalsAsYouType',
								setup: setupOption,
								commit: commitOption,
								isChanged: false,
								label: lang.formatOrdinalsOption
							},
								{
								type: 'checkbox',
								id: 'replaceHyphensCheckbox',
								option: 'replaceHyphensAsYouType',
								setup: setupOption,
								commit: commitOption,
								isChanged: false,
								label: lang.replaceHyphensOption
							},
								{
								type: 'checkbox',
								id: 'recognizeUrlsCheckbox',
								option: 'recognizeUrlsAsYouType',
								setup: setupOption,
								commit: commitOption,
								isChanged: false,
								label: lang.recognizeUrlsOption
							}
							]
						}
						]
					},
						{
						type: 'fieldset',
						label: CKEDITOR.tools.htmlEncode( lang.applyAsYouType ),
						children: [
							{
							type: 'vbox',
							padding: 0,
							children: [
								{
								type: 'checkbox',
								id: 'formatBulletedListsCheckbox',
								option: 'formatBulletedListsAsYouType',
								setup: setupOption,
								commit: commitOption,
								isChanged: false,
								label: lang.formatBulletedListsOption
							},
								{
								type: 'checkbox',
								id: 'formatNumberedListsCheckbox',
								option: 'formatNumberedListsAsYouType',
								setup: setupOption,
								commit: commitOption,
								isChanged: false,
								label: lang.formatNumberedListsOption
							},
								{
								type: 'checkbox',
								id: 'createHorizontalRulesCheckbox',
								option: 'createHorizontalRulesAsYouType',
								setup: setupOption,
								commit: commitOption,
								isChanged: false,
								label: lang.createHorizontalRulesOption
							}
							]
						}
						]
					}
					]
				},
					{
					id: 'replace',
					label: lang.autoformat,
					accessKey: '',
					elements: [
						{
						type: 'fieldset',
						label: CKEDITOR.tools.htmlEncode( lang.replace ),
						children: [
							{
							type: 'vbox',
							padding: 0,
							children: [
								{
								type: 'checkbox',
								id: 'smartQuotesCheckbox',
								option: 'smartQuotes',
								setup: setupOption,
								commit: commitOption,
								isChanged: false,
								label: lang.smartQuotesOption
							},
								{
								type: 'checkbox',
								id: 'formatOrdinalsCheckbox',
								option: 'formatOrdinals',
								setup: setupOption,
								commit: commitOption,
								isChanged: false,
								label: lang.formatOrdinalsOption
							},
								{
								type: 'checkbox',
								id: 'replaceHyphensCheckbox',
								option: 'replaceHyphens',
								setup: setupOption,
								commit: commitOption,
								isChanged: false,
								label: lang.replaceHyphensOption
							},
								{
								type: 'checkbox',
								id: 'recognizeUrlsCheckbox',
								option: 'recognizeUrls',
								setup: setupOption,
								commit: commitOption,
								isChanged: false,
								label: lang.recognizeUrlsOption
							}
							]
						}
						]
					},
						{
						type: 'fieldset',
						label: CKEDITOR.tools.htmlEncode( lang.apply ),
						children: [
							{
							type: 'vbox',
							padding: 0,
							children: [
								{
								type: 'checkbox',
								id: 'formatBulletedListsCheckbox',
								option: 'formatBulletedLists',
								setup: setupOption,
								commit: commitOption,
								isChanged: false,
								label: lang.formatBulletedListsOption
							},
								{
								type: 'checkbox',
								id: 'formatNumberedListsCheckbox',
								option: 'formatNumberedLists',
								setup: setupOption,
								commit: commitOption,
								isChanged: false,
								label: lang.formatNumberedListsOption
							},
								{
								type: 'checkbox',
								id: 'createHorizontalRulesCheckbox',
								option: 'createHorizontalRules',
								setup: setupOption,
								commit: commitOption,
								isChanged: false,
								label: lang.createHorizontalRulesOption
							}
							]
						}
						]
					}
					]
				}
				],
				onShow: function() {
					this.setupContent();
				}
		};
	} );

} )();
