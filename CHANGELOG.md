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
