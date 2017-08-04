# CryptPad Styling

How it works:
* In this example, we use the index page, for each page we will have a corresponding class name and a corresponding less file.
* The index page has a main div containing everything `<div id="cp-main" class="cp-page-index">`
* There is a corresponding less file called `less2/pages/page-index.less`
* Finally there is a corresponding line in main.less which imports that less file: `div#main.cp-page-index { @import "./pages/page-index.less"; }`
  * cp-page-index class means:
    * cp -> cryptpad
    * page -> this is a style for accessing a page's less file
    * index -> the name of the page and of the less file (page-index.less)
* And everything which is standardized across pages is included from `page-index.less` as variables and mixins.

Rules:
* All of our new classes and ids should start with `cp-`.
* You may make as many files as you need, for different purposes, but they can only contain mixins and variables.
* All mixins and variables must be prefixed with the name of the file where they're defined and and underscore.
  * e.g. `@colortheme_toolbar-poll-bg: #006304;` defined in `colortheme.less`
* All mixin / variable files go in an `/include/` directory.
* Document the meaning of your variable or mixin in a comment, consider that your mixin will be used by people other than you and if they do not have a definition of what it means, an update to it's style which seems logical to you might break their usage of it.