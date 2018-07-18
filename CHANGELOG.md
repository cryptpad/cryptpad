# Fossa release (v2.5.0)

## Goals

This release took longer than usual - three weeks instead of two - due to our plans involving a complete redesign of how login and registration function.
Any time we rework a critical system within CryptPad we're very cautious about deploying it, however, this update should bring considerable value for users.
From now on, users will be able to change their passwords without losing access to their old data, however, this is very different from _password recovery_.
While we will still be unable to help you if you have forgotten your password, this update will address our inability up until this point to change your password in the event that it has been compromised in some way.

## Update notes

* v2.5.0 uses newly released features in a clientside dependency ([chainpad-netflux](https://github.com/xwiki-labs/chainpad-netflux/releases/tag/0.7.2)). Run `bower update` to make sure you have the latest version.
* Update your server config to serve /block/ with maxAge 0d, if you are using a reverse proxy, or docker. `cryptpad/docs/example.nginx.conf` has been updated to include an example.
* Restart your server after updating.
* We have added a new feedback key, `NO_CSS_VARIABLES`, in order to diagnose how many of our clients support the CSS3 functionality.

### Features

* v2.5.0 introduces support for what we have called _modern users_.
  * New registrations will use the new APIs that we've built to facillitate the ability to change your account password.
  * _Legacy registrations_ will continue to function as they always have.
  * Changing your password (via the settings page) will migrate old user accounts to the new system.
  * We'll publish a blog post in the coming weeks to explain in depth how this functionality is implemented.
* The _kanban_ application now features support for export and import of your project data.
* This release features minor improvements to the _Deutsch_ translation

### Bug fixes

* We noticed that if you entered credentials for registration, and cancelled the displayed prompt informing you that such a user was already registered, the registration interface would not unlock for further interaction. This has been fixed.
* We found that on very slow connections, or when users opened pads in Firefox without focusing the tab, requirejs would fail to load dependencies before timing out. We've increased the timeout period by a factor of ten to address such cases.

# Echidna release (v2.4.0)

## Goals

For version 2.4.0 we chose to use our time to address difficulties that some users had, and to release some features which have been in development for some time. With the recent release of the _password-protected-pads_ feature, some users desired to be able to change the passwords that they'd already set, or to add a password to a pad retroactively. Other users wanted to recover information that had accidentally been deleted from their pads, but found that the history feature was difficult to use on networks with poor connectivity. Others still found that loading pads in general was too slow.

## Update notes

* We have released new clientside dependencies, so server administrators will need to run `bower update`
* This release also depends on new serverside dependencies, so administrators will also need to run `npm update`
* This release (optionally) takes advantage of Webworker APIs, so administrators may need to update their Content Security Headers to include worker-src (and child-src for safari)
  * see cryptpad/docs/example.nginx.conf for more details regarding configuration for nginx as a reverse proxy
  * to enable webworkers as an experimental feature, add `AppConfig.disableWorkers = false;` to your `cryptpad/customize/application-config.js`
* Finally, administrators will need to restart their servers after updating, as clients will require new functionality

## What's new

### Features

* CryptPad now takes advantage of some very modern browser APIs
  * Shared Workers allow common tasks for all CryptPad editors to be handled by a single background process which runs in the background. This results in better performance savings for anyone using multiple editors at once in different tabs
  * Webworkers are used in situations where shared workers are not supported, for most of the same tasks. They are not shared amongst different tabs, but can allow for a more responsive user experience since some heavy commands will be run in the background
  * Not all browsers feature complete support for webworkers. For cases where they are not supported at all, or where cryptographic APIs are not supported within their context (https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/7607496/), we fall back to an asynchronous context in the same thread
* Pads with no password can now be updated to include a password, and pads with a password can have their passwords changed
  * right-click on the pad in question, and see its properties. The following dialog will present the option to change its password
  * changing a pad's password will remove its history
* Accessing a pad's history used to require that clients fetch the entire history of the pad before they could view any of it. History retrieval is now done on an on-demand basis, approximately 100 versions of the pad at a time
  * this also features an updated UI with a slider
* We've refactored our whiteboard application to be compatible with our internal framework. As a result, it will be easier to maintain and will have all the same features as the other editors built with the same framework
* We've defined some new server-side features which will allow clients to change their user passwords in a coming release
* We've updated our messaging server implementation
  * the aspect of the server which stores and distributes history has been untangled from the aspect which tracks user lists and broadcasts messages
  * the server will now store the time when each message was received, so as to be able to allow users to view the time of edits in a later release

### Bug fixes

* When a user tries to register, but enters credentials which have already been used for that CryptPad instance, we prompt them to log in as that user. We discovered that the login had stopped working at some point. This has been fixed
* Server administrators may have seen warnings from npm when attempting to update. We have fixed invalid entries and added missing entries where appropriate such that there are no more warnings
* Static info pages have been restyled to be more responsive, thanks to @CatalinScr
* Support for friend requests in pads with version 0 hashes has been repaired
* We noticed a regression in how default titles for pads were suggested, and have implemented the intended behaviour

# Donkey release (v2.3.0)

## Goals

For this release we wanted to deploy some new features related to our encrypted file functionality.

## Update notes

* new clientside dependencies. run `bower update`
* new serverside APIs. Restart your server

## What's new

### Features

* When uploading files to your CryptDrive or a pad, users will now be prompted to protect the file with a password (in addition to some random data)
  * this adds an additional layer of security in case a third party gains access to the file's link, but not the password.
* Users are also able to claim an encrypted file as their own, allowing them the option to delete it from the server at a later date.
* We've refactored the Media-Tag library to be much smaller and easier to use.

### Bug fixes

* When setting a title for a pad which was created from a template, titles were not correctly inferred from the content of a document. This has been fixed.
* We discovered that users who had installed _AdBlock Plus_ and configured it to **Block social media icons tracking** were unable to use the _share menu_ to construct alternative links to the same pad, but with different attributes. We have worked around the problem.
* Admins who had configured their CryptPad instance to use custom icons for applications in the CryptDrive may have noticed that the same icons were not used on the home page. We've fixed this such that the same icons will be used everywhere
* We have also updated the icon for the Kanban app to a more appropriate symbol
* We found that the download button in the _file_ app was downloading the user's avatar, instead of the correct encrypted file embedded in the page. We've since fixed this

# Coati release (v2.2.0)

## Goals

For this release we wanted to continue our efforts towards improving CryptPad usability. We've also added a new Kanban application which was in its final stage for quite some time.

## What's new

### Features

* We've added a new kanban application!
  * You can create boards, add items to those boards and move items from one board to another.
  * It includes almost all the features seen in the other apps: templates, password protection, history, read-only, etc.
  * Kanban can be shared and used collaboratively.
  * This new app was prototyped by @ldubost, and based on [jkanban](https://github.com/riktar/jkanban) by @riktar
* We've improved our tagging feature.
  * When you want to add tags to a pad, you will see suggestions based on the tags you've already used
  * There is a new *Tags* category in CryptDrive for logged in users. It shows all the tags you've used in your pads and their number of use.
* In the Poll application, the line where your cursor is located will be highlighted so that you can see easily which option you're looking at.

### Bug fixes

* We've fixed two interface bugs in the Share menu which made it difficult to change the access rights for the link (edit or read-only) in some cases.
* A bug introduced in the previous version prevented loading of the drive if it contained some content from an alpha version of CryptPad.
* Some parts of our UI were using CSS values not supported by all browsers.
* Some pads created more than one year ago were not loading properly.

# Badger release (v2.1.0)

## Goals

This is a small release due to a surplus of holidays in France during the Month of May.
We'd been planning to implement _Password-protected Pads_ for a long time, but we had not found a good opportunity to do so within our roadmap.
After a generous donation from one of our users who considered this a critical feature, we were able to dedicate some resources towards delivering it to all of our users.

## Update notes

This release depends on new APIs in our `chainpad-crypto` module. Additionally, we have fixed a critical bug in `chainpad-listmap`.
Admins will need to update their clientside dependencies with `bower update` when deploying.

## What's new

### For Users

* Users can now protect their new pads with a password.
  * This makes it safer to share very sensitive links over email or messengers, as anyone who gains access to the link will still need the password to edit or view pads.
  * This also protects your pads against browsers which share your history across devices via the cloud.
  * We recommend that you share passwords using a different messenger tool.
  * Passwords cannot be set or changed after creation time (yet), so we also recommend you consider how secure your pad will need to be when you create it.
* Password protection coincides with an update to our URL encoding scheme. URLs are generally quite a bit shorter than before, while offering more functionality.
* Existing users will have a short delay the first time that they load this version of CryptPad, as it contains a migration of their CryptDrive's data format.
  * This migration is very tolerant of interuptions, so if you need to close your browser while it is in progress, you are free to do so.

### For Admins

* Admins can look forward to happier users!

### Bug fixes

* data loss when reconnecting in our poll app
* we've fixed a minor bug in our poll app which caused an increasing number of tooltips to be added to elements

# Alpaca release (v2.0.0)

This is the first release of our 2.0 cycle.

After careful consideration we've decided to name each release in this cycle after a cute animal, iterating through the letters of the Latin alphabet from A to Z.

## Goals

We wanted to update CryptPad's appearance once more, adopting the colors from our logo throughout more of its interface.

## Update notes

This release coincides with the introduction of new APIs in ChainPad, so we recommend that adminstrators update their clientside dependencies by running `bower update`.

As recent updates have updated serverside dependencies, we also recommend that you run `npm update` and _restart your server_.

## What's new

### For Users

* CryptPad 2.0.0 features a complete German-language translation, thanks to contributions from @polx, @kpcyrd, and @micealachman
* CryptPad has a new look!
  * we've adopted the color scheme of our logo for more UI elements throughout CryptPad, on the loading screen and various dialogs
  * we've customized our checkboxes and radio buttons to match
  * we've updated the look of our pad creation screen to feature up to four templates per page, with tab and button navigation
  * tooltips have been made to match the dialogs on our pad creation screen
  * clients now store their usage of various templates in their CryptDrive, and rank templates by popularity in the pad creation screen
  * we no longer show usage tips on the loading screen
* Users who visit pads which have been deleted or otherwise do not exist are now prompted to redirect to their home page
* Our poll and whiteboard apps now use an in-house CSS framework to help us maintain consistency with the other applications

### For Admins

* we've updated the example configuration file (`config.example.js`) to no longer require a leading space before the domain, as we found it to be a common source of confusion. This will only affect newly generated config files.
* our webserver has been configured to support HTTP access of the client datastore, to facilitate scripts which parse and decrypt history without having to go through our websocket infrastructure
* we no longer use a single image for our favicon and our loading screen icon, allowing admins to customize either feature of their instance independently
* We've also moved the rest of the styles for the loading screen from `/common/` into `/customize.dist/`, 
* move loading screen implementation from `/common/` to `/customize.dist/`

## Bug fixes

* don't eat tab presses when focused on register button
* idempotent picker initialization
* CKEditor fixes
  * drag and drop text
  * media-tag movement integrated as CKEditor plugin
  * avoid media-tag flicker on updates
* set content type for the 404 page

# 1.29.0

## Goals

For this release we wanted to direct our effort towards improving user experience issues surrounding user accounts.

## Update notes

This release features breaking changes to some clientside dependencies. Administrators must make sure to deploy the
latest server with npm update before updating your clientside dependencies with bower update.

## What's new

* newly registered users are now able to delete their accounts automatically, along with any personal
 information which had been created:
  * ToDo list data is automatically deleted, along with user profiles
  * all of a user's owned pads are also removed immediately in their account deletion process
* users who predate account deletion will not benefit from automatic account deletion, since the server
  does not have sufficient knowledge to guarantee that the information they could request to have deleted is strictly
  their own. For this reason, we've started working on scripts for validating user requests, so as to enable manual
  deletion by the server administrator.
  * the script can be found in cryptpad/check-account-deletion.js, and it will be a part of an ongoing
    effort to improve administrator tooling for situations like this
* users who have not logged in, but wish to use their drive now see a ghost icon which they can use to create pads.
  We hope this makes it easier to get started as a new user.
* registered users who have saved templates in their drives can now use those templates at any time, rather than only
  using them to create new pads
* we've updated our file encryption code such that it does not interfere with other scripts which may be running at
  the same time (synchronous blocking, for those who are interested)
* we now validate message signatures clientside, except when they are coming from the history keeper because clients
  trust that the server has already validated those signatures

## Bug fixes

* we've removed some dependencies from our home page that were introduced when we updated to use bootstrap4
* we now import fontawesome as css, and not less, which saves processing time and saves room in our localStorage cache
* templates which do not have a 'type' attribute set are migrated such that the pads which are created with their
  content are valid
* thumbnail creation for pads is now disabled by default, due to poor performance
  * users can enable thumbnail creation in their settings page
* we've fixed a significant bug in how our server handles checkpoints (special patches in history which contain the
  entire pads content)
  * it was possible for two users to independently create checkpoints in close proximity while the document was in a
    forked state. New users joining while the session was in this state would get stuck on one side of the fork,
    and could lose data if the users on the opposing fork overrode their changes
* we've updated our tests, which have been failing for some time because their success conditions were no longer valid
* while trying to register a previously registered user, users could cancel the prompt to login as that user.
  If they did so, the registration form remained locked. This has been fixed.
