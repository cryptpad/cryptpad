# Adding Translations

To illustrate the process of translating, this guide will make an english-pirate translation of Cryptpad.
We'll assume that you have a work locally-installed, properly functioning installation of Cryptpad.
If you don't have Cryptpad installed locally, start by following the steps in the main readme.

## Getting started

Once everything is working, copy the default (English) source file (`/www/common/translations/messages.js`) to a file named according to your language's [ISO 639-1 Code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes), like `/www/common/translations/messages.fr.js`.
There is no ISO 639-1 language code for _English-pirate_, so we'll just call it `messages.pirate.js`.

```Bash
cd www/common/translations/
cp messages.js messages.pirate.js
```

## Including your translation

To include your translation in the list, you'll need to add it to `/customize.dist/messages.js`.
There are comments indicating what to modify in three places:

```javascript
(function () {
// add your module to this map so it gets used
// please use the translated name of your language ("Français" and not "French")
var map = {
    'fr': 'Français',
    'es': 'Español',
    'pl': 'Polski',
    'de': 'Deutsch',
    'pt-br': 'Português do Brasil',
    'ro': 'Română',
    'zh': '繁體中文',
    'el': 'Ελληνικά',
};
```

We need to modify that map to include our translation:

```javascript
(function () {
// add your module to this map so it gets used
// please use the translated name of your language ("Français" and not "French")
var map = {
    'fr': 'Français',
    'es': 'Español',
    'pl': 'Polski',
    'de': 'Deutsch',
    'pt-br': 'Português do Brasil',
    'ro': 'Română',
    'zh': '繁體中文',
    'el': 'Ελληνικά',
    'pirate': 'English Pirate', // add our module to the map of languages
};
```
Just add your module in a similar fashion to the existing translations, save your changes, and close `/customize.dist/messages.js`.


You also need to add a customizable version of you translation. To do so, make a copy of the file `/customize.dist/translations/messages.js` with your translation name (`messages.pirate.js` in our case), and change its content to load the correct language file:

```javascript
/*
 * You can override the translation text using this file.
 * The recommended method is to make a copy of this file (/customize.dist/translations/messages.{LANG}.js)
   in a 'customize' directory (/customize/translations/messages.{LANG}.js).
 * If you want to check all the existing translation keys, you can open the internal language file
   but you should not change it directly (/common/translations/messages.{LANG}.js)
*/
define(['/common/translations/messages.pirate.js'], function (Messages) { // Change the file name here
    // Replace the existing keys (in your copied file) here:
    // Messages.button_newpad = "New Rich Text Document";
    return Messages;
});
```

That's all!

## Actually translating content

Now we can go back to our file, `/www/common/translations/messages.pirate.js` and start to add our Pirate-language customizations.

Open the translation file you created in `/customize.dist/translations/`.
You should see something like: 

```javascript
define(function () {
    var out = {};

    out.main_title = "Cryptpad: Zero Knowledge, Collaborative Real Time Editing";
```

Now you just need to work through this file, updating the strings like so:

```javascript
define(function () {
    var out = {};

    out.main_title = "Cryptpad: Knowledge lost at sea while ye scribble with yer mateys";
```

It's important that you modify just the string, and not the variable name which is used to access its content.
For instance, changing `main_title` to `mainTitle` would make the translated string inaccessible to the rest of the codebase.

If a key is not found in your translation, the default English version of that key will be used.
This is to make sure that buttons and other interface elements are not empty, but it's obviously not ideal.

## Verifying Your Translations

It's advisable to save your translation file frequently, and reload Cryptpad in your browser to check that there are no errors in your translation file.
If there are any errors in your code, the file will fail to parse, and the page will no load correctly.

Checking frequently will make it easier to know which change caused the error.

Additionally, we advise using the apps and visiting the various pages, to make sure that your translations make sense in context.

When you're happy with your translation file, you can visit http://localhost:3000/assert/translations/ to view Cryptpad's tests.
These tests will check to make sure that your translation has an entry for every entry in the default English translation.

## Getting Help

If you have any issues, reach out via any of the methods listed in the readme under **Contacting Us**.
We're happy to help.

## Deleting a translation
When a key is nolonger used (such as presentSuccess) you can delete it using this bash one-liner.

```shell
( export KEY=presentSuccess && grep -nr "$KEY" ./www/common/translations/ | sed 's/:.*$//' | while read x; do sed -i -e "/out\.$KEY =/d" $x; done )
```
