# Customizing CryptPad

In order allow the content of the main page to be changed and to allow site-specific changes
to the pad and sheet while still keeping the git repository pristine, this directory exists
to allow a set of hooks to be run.

The server is configured to check for a directory called `/customize/` and if that is not
found, to fallback on `/customize.dist/`. In order to customize cryptpad, please **copy**
`/customize.dist/` to `/customize` and then edit it there, this way you will still be able
to pull from (and make pull requests to (!) the git repository. 


* pad.js will be run whenever the (CKEditor) **pad** is loaded.
* sheet.js will be run whenever the (JQuery.sheet) **spreadsheet** is loaded.
* index.html is the main page.

All other content which is placed in this directory will be referencable at the `/customize/`
URL location.
