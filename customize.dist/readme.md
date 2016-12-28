# Customizing CryptPad

In order allow a variety of features to be changed and to allow site-specific changes
to CryptPad apps while still keeping the git repository pristine, this directory exists
to allow a set of hooks to be run.

The server is configured to load files from the `/customize/` path preferentially from
`cryptpad/customize/`, and to fall back to `cryptpad/customize.dist/` if they are not found

If you wish to customize cryptpad, please **copy**
`/customize.dist/` to `/customize` and then edit it there, this way you will still be able
to pull from (and make pull requests to (!) the git repository. 

## Files you may be interested in

* index.html is the main page
* main.js contains javascript for the home page
* application_config.js allows you to modify settings used by the various applications
* messages.js contains functions for applying translations to various pages
  * look inside `/translations/` for the rest of the files which contain translated strings
* `/share/` implements an iframe RPC which allows multiple domains to access the same localStorage
* `/src/` contains source files for html and css (in the form of html templates and .less stylesheets)

All other content which is placed in this directory will be referencable at the `/customize/`
URL location.
