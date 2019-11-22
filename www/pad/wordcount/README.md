CKEditor-WordCount-Plugin
=========================

WordCount Plugin for CKEditor v4 (or above) that counts the words/characters an shows the word count and/or char count in the footer of the editor.

![Screenshot](http://www.watchersnet.de/Portals/0/screenshots/dnn/CKEditorWordCountPlugin.png)

#### Demo

http://w8tcha.github.com/CKEditor-WordCount-Plugin/

DISCLAIMER: This is a forked Version, i can not find the original Author anymore if anyone knows the original Author please contact me and i can include the Author in the Copyright Notices. 

#### License

Licensed under the terms of the MIT License.

#### Installation

 If building a new editor using the CKBuilder from http://ckeditor.com/, there is no need to follow numbers steps below. If adding the Word Count & Char Count plugin to an already established CKEditor, follow the numbered steps below.

1.	Download the Word Count &  Char Count plugin from http://ckeditor.com/addon/wordcount or https://github.com/w8tcha/CKEditor-WordCount-Plugin. This will download a folder named **wordcount_*version*.zip** or **CKEditor-WordCount-Plugin-master.zip** to your Downloads folder.
2.	Download the Notification plugin from http://ckeditor.com/addon/notification. This will download a folder named **notification_*version*.zip** to your Downloads folder.
3.	Extract the .zip folders for both the Word Count & Char Count and Notification plugin. After extraction, you should have a folder named **wordcount** and a folder named **notification**.
4.	Move the wordcount folder to /web/server/root/ckeditor/plugins/.  Move the notification folder to /web/server/root/ckeditor/plugins/.
5.	Add the following line of text to the config.js file, which is located at /web/server/root/ckeditor/.

```javascript
config.extraPlugins = 'wordcount,notification'; 
```

Below is an example of what your config.js file might look like after adding config.extraPlugins = 'wordcount,notification';

```javascript
CKEDITOR.editorConfig = function( config ) {
  config.extraPlugins = 'wordcount,notification';
  config.toolbar [
  et cetera . . .
  ];
};
```

There now should be text in the bottom right-hand corner of your CKEditor which counts the number of Paragraphs and number of Words in your CKEditor.

To modify the behavior of the Word Count & Char Count text at the bottom right-hand corner of your CKEditor, add the following text to your config.js file located at /web/server/root/ckeditor/config.js.

````js
config.wordcount = {

    // Whether or not you want to show the Paragraphs Count
    showParagraphs: true,

    // Whether or not you want to show the Word Count
    showWordCount: true,

    // Whether or not you want to show the Char Count
    showCharCount: false,

    // Whether or not you want to count Spaces as Chars
    countSpacesAsChars: false,

    // Whether or not to include Html chars in the Char Count
    countHTML: false,
    
    // Whether or not to include Line Breaks in the Char Count
    countLineBreaks: false,

    // Maximum allowed Word Count, -1 is default for unlimited
    maxWordCount: -1,

    // Maximum allowed Char Count, -1 is default for unlimited
    maxCharCount: -1,
    
    // Maximum allowed Paragraphs Count, -1 is default for unlimited
    maxParagraphs: -1,

    // How long to show the 'paste' warning, 0 is default for not auto-closing the notification
    pasteWarningDuration: 0,
    

    // Add filter to add or remove element before counting (see CKEDITOR.htmlParser.filter), Default value : null (no filter)
    filter: new CKEDITOR.htmlParser.filter({
        elements: {
            div: function( element ) {
                if(element.attributes.class == 'mediaembed') {
                    return false;
                }
            }
        }
    })
};
````

**Note:** If you plan to change some of the JavaScript, you probably will not want to use the CKBuilder, because this will place the JavaScript of the Word Count & Char Count plugin in the ckeditor.js file located at /web/server/root/ckeditor/ckeditor.js. The JavaScript for the Word Count & Char Count plugin in the ckeditor.js file is different than the JavaScript used when manually adding the Word Count & Char Count plugin.  When manually adding the Word Count & Char Count plugin, the JavaScript will be in the plugin.js file located at 

---

If you want to query the current wordcount you can do it via 

```javascript
// get the word count
CKEDITOR.instances.editor1.wordCount.wordCount 

// get the char count
CKEDITOR.instances.editor1.wordCount.charCount 
```
