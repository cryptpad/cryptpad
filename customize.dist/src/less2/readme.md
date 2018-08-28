# CryptPad Styling

## Linking Less/CSS

In order to keep the amount of CSS generated under control, we use "linking", via the LessLoader.
This makes use of CSS variables in order to work. The old solution was to put all of the content into less mixins
which would be used inside of the scope where they should be, but this caused a state explosion because each app needed
essentially the same mixins. However, these mixins had arguments such as colors which were different per-app.

The new solution is to set CSS variables for the arguments (like color) and then put the bulk of the less at the global
scope. When you include a dependency, the following happens:

1. You `@include (reference) './include/dependency.less`. The (reference) argument which means it will not emit CSS,
this is important because otherwise all of the dependencies of your app's less file would end up bundled with it, the
state explosion problem.
2. You invoke `.dependency_main(@arg1 @arg2)` inside of the scope you want it in, the name `dependency_main` is a
convention, all less variables, mixins, or CSS variables which a file creates should be prefixed with the name of the
file (in this case, "dependency").
3. The mixin `.dependency_main` does a couple of things:
  * First, it sets a CSS variable called `--LessLoader_require`, this is a special variable which the browser does not
  use, the only objective of this variable is to inform LessLoader that another file is needed. To do this, there is a
  helper function (also specified in LessLoader.js) called `LessLoader_currentFile()`. The syntax is:
  `--LessLoader_require: LessLoader_currentFile();` and in the CSS, this outputs something like:
  `--LessLoader_require: "/customize/src/less2/include/dependency.less?ver=2.4.0-1531572157592";`
  * Secondly, it sets browser variables for it's arguments, making sure to avoid namespace collisions:
  `--dependency-arg1: @arg1;`, `--dependency-arg2: @arg2;`. Sometimes a less transformation needs to be done on a
  variable, unfortunately in this case the transformation must be done here and the transformed variable must be output.
  `--dependency-arg1-l10: lighten(@arg1, 10%);`.
4. After less processing is completed, the LessLoader caches the result of parsing, then scans the it for instances of
`--LessLoader_require` variable and then processes them, but it does this separately. So even if dependency.less is
required many times, it will only be processed by the less interpreter once.

## Other convensions

* All of our new classes and ids should start with `cp-`.
* The document body has a class on it depending on the app/page, app classes begin with `cp-app-` and page classes begin
with `cp-page-`.
* Custom classes ought to begin with `cp-` and the name of the file where the rules are written for them (see help.less as
an example of doing the right thing).
* Since the include files generate CSS and the app cannot control the scope which it's run at, be considerate avoid
making an include file which changes something significant (like making a rule for `li`). help.less is an excellent example
of doing this well, infopages.less is the worst example (fortunately it doesn't get included in any of the apps).
* All mixins and variables must be prefixed with the name of the file where they're defined and and underscore.
  * e.g. `@colortheme_toolbar-poll-bg: #006304;` defined in `colortheme.less`
* All mixin / variable files go in an `/include/` directory.
* Document the meaning of your variable or mixin in a comment, consider that your mixin will be used by people other than you and if they do not have a definition of what it means, an update to it's style which seems logical to you might break their usage of it.