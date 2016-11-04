# Adding Translations

To illustrate the process of translating, this guide will make an english-pirate translation of Cryptpad.
We'll assume that you have a work locally-installed, properly functioning installation of Cryptpad.
If you don't have Cryptpad installed locally, start by following the steps in the main readme.

## Getting started

Once everything is working, copy the default (English) source file (`/customize.dist/translations/messages.js`) to a file named according to your language's [ISO 639-1 Code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes), like `/customize.dist/translations/messages.fr.js`.
There is no ISO 639-1 language code for _English-pirate_, so we'll just call it `messages.pirate.js`.

```Bash
cd /customize.dist/translations/
cp messages.js messages.pirate.js
```

## Including your translation

To include your translation in the list, you'll need to add it to `/customize.dist/messages.js`.
There are comments indicating what to modify in three places:

```javascript
define(['/customize/languageSelector.js',
        '/customize/translations/messages.js',
        '/customize/translations/messages.es.js',
        '/customize/translations/messages.fr.js',

    // 1) additional translation files can be added here...

        '/bower_components/jquery/dist/jquery.min.js'],

    // 2) name your language module here...
        function(LS, Default, Spanish, French) {
    var $ = window.jQuery;

    // 3) add your module to this map so it gets used
    var map = {
        'fr': French,
        'es': Spanish,
    };
```

We need to modify these three places to include our file:

```javascript
define(['/customize/languageSelector.js',
        '/customize/translations/messages.js',
        '/customize/translations/messages.es.js',
        '/customize/translations/messages.fr.js',

    // 1) additional translation files can be added here...
        '/customize/translations/messages.pirate.js', // add our module via its path

        '/bower_components/jquery/dist/jquery.min.js'],

    // 2) name your language module here...
        function(LS, Default, Spanish, French, Pirate) { // name our module 'Pirate' for use as a variable
    var $ = window.jQuery;

    // 3) add your module to this map so it gets used
    var map = {
        'fr': French,
        'es': Spanish,
        'pirate': Pirate, // add our module to the map of languages
    };
```

Note that the path to the file is `/customize/translations/`, not `/customize.dist/translations`.
Cryptpad's server is configured to search for files in `/customize/` first.
If a file is not found, it falls back to `/customize.dist/`.
This allows administrators of a Cryptpad installation to override the default behaviour with their own files.

We want translations to be the default behaviour, so we'll place it in `/customize.dist/translations/`, but resolve it via `/customize/translations/`.

The second and third steps are simpler.
Just add your module in a similar fashion to the existing translations, save your changes, and close `/customize.dist/messages.js`.
That's all!


## Actually translating content

Now we can go back to our file, `/customize.dist/translations/messages.pirate.js` and start to add our Pirate-language customizations.

Open the translation file you created in `/customize.dist/translations/`.
You should see something like: 

```javascript
define(function () {
    var out = {};

    // translations must set this key for their language to be available in
    // the language dropdowns that are shown throughout Cryptpad's interface
    out._languageName = 'English';
```

Now you just need to work through this file, updating the strings like so:

```javascript
define(function () {
    var out = {};

    // translations must set this key for their language to be available in
    // the language dropdowns that are shown throughout Cryptpad's interface
    out._languageName = 'Pirate';
```

It's important that you modify just the string, and not the variable name which is used to access its content.
For instance, changing `_languageName` to `_language_name` would make the string `'Pirate'` inaccessible to the rest of the codebase.

## Verifying Your Translations

It's advisable to save your translation file frequently, and reload Cryptpad in your browser to check that there are no errors in your translation file.
If there are any errors in your code, the file will fail to parse, and the page will no load correctly.

Checking frequently will make it easier to know which change caused the error.

Additionally, we advise using the apps and visiting the various pages, to make sure that your translations make sense in context.

When you're happy with your translation file, you can visit http://localhost:3000/assert/ to view Cryptpad's tests.
Among other things, these tests will check to make sure that your translation has an entry for every entry in the default English translation.

## Getting Help

If you have any issues, reach out via any of the methods listed in the readme under **Contacting Us**.
We're happy to help.

