# OrienteCaveRat release (3.14.0)

## Goals

We planned a one-week release cycle in order to finish up some major features that were already in development during our last release.

In the meantime, the reaction to the COVID-19 pandemic has resulted in a greatly increased load on our servers, so we've begun to focus on improving stability to ensure that we are able to keep up with demand.

## Update notes

We had some trouble during the week of March 9th, 2020, as the CryptPad.fr server started throwing EMFILE errors. This means that it was trying to open new files (for reading or writing) but there were too many files open already. We've added some new code to help debug the issue, but there is not yet a fix in place. The maximum number of open files on our host OS had been increased by several orders of magnitude (several years ago) but we're now aware that the systemd service file that launches the API server does not respect this global limit. As such, we've updated the example service file to indicate how you can update this limit yourself. For an example of how to update this limit at the OS level, see this page: https://docs.oracle.com/cd/E19623-01/820-6168/file-descriptor-requirements.html

Otherwise, updating from 3.13.0 to 3.14.0 is as usual:

1. stop your server
2. fetch the latest source
3. `npm i`
4. `bower update`
5. restart your server

## Features

We're very happy to announce a major update to our kanban application! We've made a lot of changes, but the most notables ones are:

* the ability to add markdown content to your cards and edit it collaboratively in real-time
* tags on cards and the ability to filter cards by tags at the top of the application
* indicators to show if a card is being modified by another user while you are editing it
* the ability to toggle between an 'overview mode' which hides everything but your cards titles and a full mode which shows everything
* vertical scrolling for very tall columns, and horizontal scrolling for columns that don't fit on your screen (intead of reflowing to the next line)
* a smaller palette of pre-chosen colors for cards and boards instead of a color-picker, to make it easier to choose matching colors for tasks
* the ability to drag cards and boards to the trash instead of having to click a small X and confirm their deletion

## Bug fixes

* Drive:
  * a regression in the drive for anonymous users made it impossible to delete contained pads directly from the drive (though deletion from the pad itself was working). It's now back to normal.
  * we've updated the translation key referenced in [issue 482](https://github.com/xwiki-labs/cryptpad/issues/482) to clarify what qualifies a pad as "recently modified".
* We noticed (and fixed) another regression that disabled our recently introduced "history trim" functionality.
* We've identified and addressed a few client networking errors that were causing clients to disconnect (and to get stuck in a reconnecting state), but we're still actively looking for more.
* Server:
  * we've added some extra checks to try to identify where our file descriptor leak is coming from, we'll release fixes as they become available.
  * we've caught a typeError that only ever happened while the server was overwhelmed with EMFILE errors.
  * [this PR](https://github.com/xwiki-labs/cryptpad/pull/503) fixed an incorrect conditional expression at launch-time.

# NorthernWhiteRhino release (3.13.0)

## Goals

This release cycle we prioritized the completion of "access lists", a major feature that we're excited to introduce.

## Update notes

Nearly every week (sometimes more than once) we end up taking time away from development to help administrators to configure their CryptPad instances. We're happy to see more instances popping up, but ideally we'd like to spend more of our time working on new features. With this in mind we devoted some time to simplify instance configuration and to clarify some points where people commonly have difficulty.

If you review `cryptpad/config.example.js` you'll notice it is significantly smaller than it was last release.
Old configuration files should be backwards compatible (if you copied `config.example.js` to `config.js` in order to customize it).
The example has been reorganized so that the most important parts (which people seemed to miss most of the time) are at the top.
Most of the fields which were defined within the config file now have defaults defined within the server itself.
If you supply these values they will override the default, but for the most part they can be removed.

We advise that you read the comments at the top of the example, in particular the points related to `httpUnsafeOrigin` and `httpSafeOrigin` which are used to protect users' cryptographic keys in the event of a cross-site scripting (XSS) vulnerability.
If these values are not correctly set then your users will not benefit from all the security measures we've spent lots of time implemented.

A lot of the fields that were present as modifiable defaults have been removed or commented out in the example config.
If you supply them then they will override the default behaviour, however, you probably won't need to and doing so might break important functionality.
Content-Security Policy (CSP) definitions should be safe to remove, as should `httpAddress`, `httpPort`, and `httpSafePort` (unless you need to run the nodejs API server on an address other than `localhost` or port 3000.

Up until now it's been possible for administrators to allow users to pay for accounts (on their server) via https://accounts.cryptpad.fr.
Our intent was to securely handle payment and then split the proceeds between ourselves and the instance's administrator.
In practice this just created extra work for us because we ended up having to contact admins, all of whom have opted to treat the subscription as a donation to support development.
As such we have disabled the ability of users to pay for premium subscriptions (on https://accounts.cryptpad.fr) for any instance other than our own.

Servers with premium subscriptions enabled were configured to check whether anyone had subscribed to a premium account by querying our accounts server on a daily basis.
We've left this daily check in place despite premium subscriptions being disabled because it informs us how many third-party instances exist and what versions they are running.
We don't sell or share this information with anyone, but it is useful to us because it informs us what older data structures we have to continue to support.
For instance, we retain code for migrating documents to newer data formats as long as we know that there are still instances that have not run those migrations.
We also cite the number of third-party instances when applying for grants as an indicator of the value of funding our project.
In any case, you can disable this daily check-in by setting `blockDailyCheck` to `true` in `config/config.js`.

Finally, we've implemented the ability to set a higher limit on the maximum size of uploaded files for premium users (paying users on CryptPad.fr and users with entries in `customLimits` on other instances).
Set this limit as a number (of bytes) with `premiumUploadSize` in your config file.

## Features

* It is often difficult to fix problems reported as GitHub issues because we don't have enough information. The platform's repository now includes an _issue template_ which includes a list of details that will probably be relevant to fixing bugs. Please read the list carefully, as we'll probably just close issues if information that we need was not included.
* We've made it easy to terminate all open sessions for your account. If you're logged in, you'll now see a _log out everywhere_ button in the _user admin menu_ (in the top-right corner of the screen).
  * You may still terminate only _remote sessions_ while leaving your local session intact via the pre-existing button on the settings page's _confidentiality_ tab.
* You may have noticed that it takes progressively longer to load your account as you add more files to your drive, shared folders, and teams. This is because an integrity check is run on all your files when you first launch a CryptPad session. We optimized some parts of this check to speed it up. We plan to continue searching for similar processes that we can optimize in order to decrease loading time and run-time efficiency.
* Lastly, this release introduces **access lists**, which you can use to limit who can view your documents _even if they have the keys required to decrypt them_. You can do so by using the _Access_ modal for any given document, available in the `...` dropdown menu in each app's toolbar or when right-clicking in the drive.
  * Enabling access restriction for a document will disallow anyone except its owners or allowed users from opening it. Anyone else who is currently editing or viewing the document will be disconnected from the session.

## Bug fixes

* A member of _C3Wien_ reported some strange behaviour triggered by customizing some of Firefox's anti-tracking features. The settings incorrectly identified our cross-domain sandboxing system as a tracker and interfered with its normal functionality. As a result, the user was treated as though they were not logged in, even though pads from their account's drive were displayed within the "anonymous drive" that unregistered users normally see.
  * This was simple to fix, requiring only that we adjust our method of checking whether a user is logged in.
  * If you ever notice odd behaviour we do recommend that you review any customizations you've made to your browser, as we only test CryptPad under default conditions unless prompted to investigate an issue.
* Users that take advantage of the Mermaid renderer in our markdown editor's preview pane may have noticed that the preview's scroll position was lost whenever mermaid charts were modified. We've updated our renderer such that it preserves scroll position when redrawing elements, making it easier to see the effects of your changes when editing large charts.

# Megaloceros release (3.12.0)

## Goals

As of our last release our 'history trim' functionality was almost ready to go. We took this release period to do some extensive testing and to prepare the 'allow list' functionality which will be included in our next release.

In the meantime, we also aimed to improve performance, add a few small but nice features, and fix a number of bugs.

## Update notes

This release includes updates to:

1. the server and its dependencies
2. the example nginx configuration which we recommend for production installations
4. the client code and its dependencies

Our ability to debug CryptPad's usage of shared workers (on the client) has been complicated by the fact that Firefox's shared worker debugging panel was not working for our instance. We finally traced the problem back to a Content-Security Policy setting in our configuration file. The issue can be addressed by adding a `resource:` entry in the `connect-src` header. We've updated the example nginx config to reflect this. You can deploy this version of CryptPad without this modification, but without it our ability to debug and fix issues related to shared worker will be extremely limited.

Otherwise, updating from CryptPad v3.11.0 is pretty much the same as normal:

1. stop your server
2. pull the latest code via git
3. `npm i` to get the latest server dependencies
4. `bower update` to get the latest client dependencies
5. restart your server

## Features

* The CryptPad server stores documents as a series of encrypted changes to a blank document. We have mechanisms in place that make it so clients only need the most recent changes to view the document, but the storage requirements on the server would only ever grow unless you deleted the entire document. As of this release, owners of document have the option to remove that unnecessary history. To do so: right-click a pad in a drive or shared folder and choose the properties option in the menu. The bottom of the properties popup will display the document's size. If there is any history that is eligible for removal, a button will be displayed to remove it.
  * This option is only available for the pad's owners. If it has no owners then it will not be possible to remove its history.
  * It is not yet possible to trim the history of spreadsheets, as they are based on a different system than the rest of our documents and it will take some additional work to add this functionality.
* We've also added the ability to easily make copies of documents from your drive. Right-click on documents and select "make a copy" from the menu.
  * This feature doesn't work for files. Files can't be modified anyway, so there's little value in making copies.
  * We haven't added the ability to make a copy of a spreadsheet yet for the same reasons as above.
* We've improved the way our markdown renderer handles links to better support a variety of types of URLs:
  * anchors, like `[bug fixes](#bug-fixes)`
  * relative paths, like `[cryptpad home page](/index.html)` or `[a rich text pad](/pad/#/pad/view/12151241241254123412451231231221)`
  * absolute URLs without the protocol, like `[//github.com/xwiki-labs/cryptpad)
* We've optimized a background process that iterates over a part of the database when you first launch the CryptPad server. It now uses less memory and should incur less load on the CPU when restarting the server. This should allow the server to spend its resources handling clients that are trying to reconnect.
* We've also optimized some client-side code to prioritize loading your drive instead of some other non-essential resources used for notifications. Pages should load faster. We're working on some related improvements to address page load time which we'll introduce on an ongoing basis.
* As noted above, we're finally able to debug shared workers in Firefox. We're investigating a few issues that were blocked by this limitation, and we hope to include a number of bug fixes in upcoming releases.
* We've continued some ongoing improvements to the instance admin panel and introduced the ability to link directly to a support ticket. The link will only be useful to users who would already be able to open the admin panel.
* The code responsible for fetching and scanning the older history of a document has also been optimized to avoid handling messages for channels multiple times.
* Finally, we've received contributions from our German and Italian translators via our weblate instance.
  * We're always looking for more help with localization. You can review the status of our translations and contribute to them [here](https://weblate.cryptpad.fr/projects/cryptpad/app/).

## Bug fixes

* After a lot of digging we believe we've identified and fixed a case of automatic text duplication in our rich text editor. We plan to wait a little longer and see if [reports of the incorrect behaviour](https://github.com/xwiki-labs/cryptpad/issues/352) really do stop, but we're optimistic that this problem has been solved.
* [Another GitHub issue](https://github.com/xwiki-labs/cryptpad/issues/497) related to upgrading access for team members has been fixed. If you continue to have issues with permissions for team members, we recommend haging the team owner demote the affected users to viewers before promoting them to the desired access level.
* We've fixed a number of small issues in our server:
  * The server did not correctly respond to unsupported commands for its SET_METADATA RPC. Instead of responding with an error it ignored the message. In practice this should not have affected any users, since our client only uses supported commands.
  * The server used to log for every entry in a document's metadata log that contained an unsupported command. As we develop we occasionally have to such logs with older versions of the code that don't support every command. To avoid filling the logs with errors, we now ignore any errors of a given type beyond the first one encountered for a given document.
* We've fixed an issue with read-only spreadsheets that was introduced in our previous release. An overlay intended to prevent users from interacting with the spreadsheet while disconnected was incorrectly applied to spreadsheets in read-only mode, preventing users from copying their data.
* Clients send "pin commands" to the server to instruct it to count a document against their quota and to preserve its data even if it's considered inactive. We realized that the client wasn't including todo-lists in its list of pads to pin and have updated the client to do so.

# LabradorDuck release (3.11.0)

## Goals

For this release we aimed to phase in two major features that we've been anticipating for a while: "history trim" and "safe links".

History trim will allow users to remove the old versions of their documents which continue to count against their storage quotas. It will be formally introduced in our next release, even though its server-side components are all ready. We had to reorganize and modify a lot of our server code, so we wanted to wait and make sure there were no regressions in our existing functionality before moving ahead.

We're introducing the concept of "safe links" in CryptPad. Users can continue to share links to documents which include the cryptographic secrets necessary to read or edit them, but whenever possible we will replace those secrets with a document id. This will make it less likely for encryption keys to be exposed to third parties through invasive browser extensions or passive behaviour like history synchronization across devices.

## Update notes

This release features a few changes to the server:

1. The "legal notice" feature which we included in the previous release turned out to be incorrect. We've since fixed it. We document this functionality [here](https://github.com/xwiki-labs/cryptpad/blob/e8b905282a2cde826ad9100dcad6b59a50c70e8b/www/common/application_config_internal.js#L35-L41), but you'll need to implement the recommended changes in `cryptpad/customize/application_config.js` for best effect.
2. We've dropped server-side support for the `retainData` attribute in `cryptpad/config/config.js`. Previously you could configure CryptPad to delete unpinned, inactive data immediately or to move it into an archive for a configurable retention period. We've removed the option to delete data outright, since it introduces additional complexity in the server which we don't regularly test. We also figure that administrators will appreciate this default in the event of a bug which incorrectly flags data as inactive.
3. We've fixed an incorrect line in [the example nginx configuration file](https://github.com/xwiki-labs/cryptpad/commit/1be01c07eee3431218d0b40a58164f60fec6df31). If you're using nginx as a reverse proxy for your CryptPad instance you should correct this line. It is used to set Content-Security Policy headers for the sandboxed-iframe which provides an additional layer of security for users in the event of a cross-site-scripting (XSS) vulnerability within CryptPad. If you find that your instance stops working after applying this change it is likely that you have not correctly configured your instance to use a secondary domain for its sandbox. See [this section of `cryptpad/config/config.example.js`](https://github.com/xwiki-labs/cryptpad/blob/c388641479128303363d8a4247f64230c08a7264/config/config.example.js#L94-L96) for more information.

Otherwise, deploying the new code should be fairly simple:

1. stop your server
2. fetch the latest code from the git repository
3. update your server dependencies with `npm install`
4. update your clientside dependencies with `bower update`
5. start your server

## Features

* We've slightly reorganized the _settings_ page to include a new "Confidentiality" section. It includes a checkbox to enable "safe links", which will remove the cryptographic secrets from your documents' URLs whenever possible. It is currently off by default but will most likely default to true in the near future. Otherwise, the settings page has an updated layout which is generally easier to read.
* We've remove the "Owned pads" category from the CryptDrive application. It was included to provide an overview of pads that you could delete when we first introduced that functionality, however, we've realized that it is generally not very useful.
* We implemented the ability to convert a regular folder in your drive into a _shared folder_ several months ago, but disabled it when we discovered that it had some bugs. We finally got around to fixing those bugs and so it is officially ready for public use.
* We've continued to make little changes to improve the discoverability of CryptPad's social features. Unregistered users that view another user's profile are now informed that they can send that profile's owner a contact request once they register.
* You may remember that CryptPad's contacts used to be called "friends". We've changed this terminology to reflect that you might work with people with whom you do not have a close personal relationship.
* We analyzed CryptPad for possible vectors for social abuse as a part of our _Teams_ project, sponsored by NLnet foundation. During this audit we identified that the main method for abuse was through the direct messaging/notifications system. We added the ability to mute users, but realized it could be difficult to find the profile page of the person you want to mute. As of this release, any notification triggered by a remote user's actions will include their avatar and a link to their profile. If you find any user's behaviour abusive or annoying you can go straight to their profile and mute them.
* We've made a small improvements to the admin panel's support ticket view. Tickets which have not received a response are now highlighted in red.
* The login/register pages had a minor bug where the loading screen was not correctly displayed the second time you tried to enter your password. This was because the key derivation function which unlocks the corresponding user credentials was keeping the CPU busy and preventing an animation from running. It has since been corrected.
* We've continued to make some small but important changes to various UI elements that are reused throughout the platform. The password field in the _pad properties dialog_ has been tweaked for better color contrast. Similarly, the small notice that pops up in the bottom right hand corner to prompt you to store a pad in your drive has been restyled. We've also implemented a second variation on this popup to display general information not directly related to the current pad. Both of these UI elements better match the general appearance of the rest of the platform and represent a continued effort to improve its visual consistency.
* The spreadsheet editor has received some attention in the last few weeks as well. It is now able to gracefully resume a session when you reconnect to the server after an interruption. Likewise, the locking system which prevents two users from editing a cell at the same time is now significantly faster, and completely disabled if you're editing alone. Now that it's possible for unregistered users to edit spreadsheets we've had to improve the color contrast for the toolbar message which prompts users to register in order to ensure that a spreadsheet isn't deleted due to inactivity.
* The "file upload status table" has received some attention as well, in response to [issue 496](https://github.com/xwiki-labs/cryptpad/issues/496). When you upload many files to CryptPad in a row you'll see them all displayed in a table which will include a scrollbar if necessary.

## Bug fixes

* [Issue 441](https://github.com/xwiki-labs/cryptpad/issues/441 "Other users writing in pad hiijacks chat window") has been fixed.
* We found a bug that affected encrypted files saved to your CryptDrive via the right-click menu. The files were saved in an incorrect format and were unusable. They should behave normally now.
* Finally, we identified a race condition whereby if two users sent each other contact requests at the same time the request might not be accepted correctly. This process should now be much more reliable.

# Kouprey release (3.10.0)

## Goals

For this release we aimed to finish the last major feature of our CryptPad Teams project as well as some long-awaited features that we've planned to demo at FOSDEM 2020.

## Update notes

The CryptPad repository's _docs_ directory now includes a _systemd service file_ which you can use to ensure that CryptPad stays up and running. We're working on some step-by-step documentation to describe how to make use of it, but for now you can probably find some instructions by searching the web.

We've also updated the provided example.nginx.conf to include a minor but important change to the CSP settings for our OnlyOffice spreadsheet integration.

Up until now we have not been deleting unowned encrypted files from our server. As of this release `cryptpad/scripts/evict-inactive.js` includes logic to identify inactive, unpinned files. Identified files are first moved to your instance's _archive_ directory for a configurable period, after which they are deleted. This script is not run automatically, so if you haven't configured a cron job to run periodically then inactive files will not be removed. We recommend running the script once per day at a time when you expect your server to be relatively idle, since it consumes a non-negligible amount of server resources.

Finally, in case you live in a political jurisdiction that requires web site administrators to display their legal information, we've made it easier to add a link to a custom page. See `cryptpad/www/common/application_config_internal.js` for details, particularly the comments above `config.imprint`.

To update from v3.9.0:

1. update the CSP settings in your reverse proxy's configuration file to match those in nginx.example.conf
  * don't forget to reload your server to ensure that your changes are deployed
2. stop your API server
3. pull the latest server/client code with `git pull origin master`
4. install the latest clientside dependencies with `bower update`
5. relaunch your server

## Features

* Owned pads can now be shared in _self-destruct_ mode as an additional option in the _access rights_ section of the _share menu_.
  * to use self-destructing pads:
    1. select `View once and self-destruct`
    2. share the _self-destructing pad link_ directly with a contact or create and copy a link
    3. recipients who open the link will land on a warning page informing them about what is about to happen
    4. once they click through the link, they'll see the content and automatically delete it from the server
    5. opening the same link a second time will not yield any content
  * note that deletion affects the original document that you choose to share. It does not create a copy
* We no longer consider spreadsheets to be a BETA application!
  * we've been using them for some time and while there are still points to improve we consider them stable enough for regular use
  * this change in status is due to a few big updates:
    1. we've integrated a recent version of OnlyOffice in which a number of bugs were fixed
    2. we've enabled the use of spreadsheets for unregistered users, though registration is still free and will provide a better experience
    3. it's now possible to upload encrypted images into your spreadsheets, in case you're the type of person that puts images in spreadsheets
    4. you can also import and export spreadsheets between CryptPad's internal format and XLSX. This conversion is run entirely in your browser, so your documents stay private. Unfortunately it relies on some new features that are not available in all browsers. Chrome currently supports it, and we expect Firefox to enable support as of February 11th, 2020
* Finally, we've continued to receive contributions from our numerous translators (via https://weblate.cryptpad.fr) in the following languages (alphabetical order):
  * Catalan
  * Finnish
  * German
  * Italian
  * Spanish

## Bug fixes

* We found and fixed an incorrect usage of the pinned-data API in `scripts/check-account-deletion.js`.
* We also updated an incorrect client-side test in /assert/.
* A minor bug in our CSS caching system caused some content to be unnecessarily recompiled. We've implemented a fix which should speed up loading time.

# JamaicanMonkey release (3.9.0)

## Goals

Over time we've added many small configuration values to CryptPad's `config/config.js`.
As the number of possible variations grew it became increasingly difficult to test the platform and to provide clear documentation.
Ultimately this has made the platform more difficult to understand and consequently to host.

This release features relatively few bug fixes or features.
Instead, we took the calm period of the northern winter holidays to simplify the process of running a server and to begin working on some comprehensive documentation.

## Update notes

We have chosen to drop support for a number of parameters which we believe are not widely used.
Read the following list carefully before updating, as you could be relying on behaviour which no longer exists.

* Due to reasons of security and performance we have long advised that administrators make their instance available only over HTTPS provided by a reverse proxy such as nginx instead of loading TLS certificates via the node process itself. We have removed the option of serving HTTPS traffic directly from node by removing all support for HTTPS in this process.
* Over the years many administrators have had to migrate their instance from one machine to another and have had difficulty identifying which directories were responsible for storing user data. We are beginning to migrate all user-generated data from the repository's root into the `data` directory as a new default, allowing for admins to migrate content by copying this single directory.
  * for the time being we have not moved anything which is exposed directly over HTTPS since that complicates the upgrade process by requiring all configuration changes to be made simultaneously.
  * the modifications we've made only affect the _default configuration_ provided by `config/config.example.js`, existing instances which have copied this file to `config/config.js` will not be affected.
  * only the following values have been modified:
    * `pinPath`
    * `taskPath`
    * `blobStagingPath`
* We have modified the Dockerfile volume list to reflect the changes to these default paths. If you are using docker you will have to either:
  * revert their removal or
  * move the affected directories into the `data` directory and update your live config file to reflect their new location
* Please note that we do our team does not use docker, that it was included in the main repository as a community contribution, and that we are not committed to supporting its configuration since we do not test it.
  * Our official policy is to provide an up-to-date set of configuration files reflecting the state of our production installation on [CryptPad.fr](https://cryptpad.fr) using Debian, nginx, and systemd.
  * we are actively working on improving our documentation for this particular configuration and we plan to close issues for other configurations as being outside of the project's scope.
* We've updated our example nginx configuration file, located at `cryptpad/docs/example.nginx.conf`.
  * in addition to a great number of comments, it now makes use of variables configure the domains referenced by the CSP headers which are required to take advantage of all of CryptPad's security features.
* Prompted by warnings from recent nodejs versions we are updating our recommended version to v12.14.0 which is at the time of this writing the latest Long Term Support version.
  * you may need to update to successfully launch your server.
  * as always, we recommend using nvm to manage nodejs installation.
* We have dropped support for a number of experimental features:
  * replify (which allowed admins to modify their server at runtime using a REPL connected via a named socket)
  * heapdump (which provided snapshots of the server's memory if it crashed)
  * configurable RPC files as a configuration parameter
* Finally, we've replaced a number of websocket configuration values (`websocketURL`, `websocketPath`, `useExternalWebsockets`, and `useSecureWebsockets`) with one optional value (`externalWebsocketURL`) in config.js
  * if your instance is configured in the default manner you shouldn't actually need this value, as it will default to using `/cryptpad_websocket`.
  * if you have configured your instance to serve all static assets over one domain and to host your API server on another, set `externalWebsocketURL` to `wss://your-domain.tld/cryptpad_websocket` or whatever URL will be correctly forwarded to your API server.

Once you have reviewed your configuration files and ensured that they are correct, update to 3.9.0 with the following steps:

1. take your server down
2. get the latest code with `git pull origin master`
3. install some required serverside dependency with `npm update`
4. (optionally) update clientside dependencies with `bower update`
5. bring your server back up

## Features

* We made some minor improvements to the process of redeeming invitation links for teams.
  * invitation links can only be used once, so we remove the hash from the URL bar once you've landed on the redemption page so that reloading after redeeming doesn't indicate that you've used an expired link.
* [One of our Finnish-speaking contributors](https://weblate.cryptpad.fr/user/ilo/) has translated a very large amount of the platform's text in the last few weeks, making Finnish our fifth most thoroughly translated language!

## Bug fixes

* We noticed and fixed a style regression which incorrectly removed the scrollbar from some textareas
* We also found that it was possible to corrupt the href of an item in a team's drive if you first shared a pad with your team then transferred ownership, the link stored in the team's drive would have its domain concatenated together twice.
* The type value of read-only pads displayed as search results in user and team drives was incorrect but is now correctly inferred.

# IsolobodonPortoricensis release (3.8.0)

We had some trouble finding an extinct animal whose name started with "I", and we had to resort to using a scientific name.
Despite this long name, this was a very short release cycle.
It's the last release of 2019, so we hope you like it!

## Goals

During this release cycle we prioritized the mitigation of some social abuse vectors and the ability to invite users to a team via a link.
We have more improvements planned for both features, but we wanted to release what we had before the end of the year as our team is taking a little time off to recharge for 2020.

## Update notes

This is a small and simple release. We made a very minor improvement to the server which will require a restart, but everything will still work if you choose not to.

Update from 3.7.0 to 3.8.0 with the following procedure:

1. Take your server down
2. Get the latest code with `git pull origin master`
3. Bring your server back up

Or if you've set up your admin interface:

1. Pull the latest code
2. Click the admin panel's "Flush cache" button

## Features

* We updated a bunch of styles to improve the platform's visual consistency:
  * prettier buttons
  * elimination of rounded corners on buttons, text inputs, and password inputs
* We've fixed the default styles on embedded media while their content is loading
* The button to add a user as a contact on their profile page now has a more prominent position at the top of the page
* Users also have the option of muting other people via their profile page.
  * these users will not know that you've muted them.
  * you can review the complete list of all the people you've muted on your contacts page
  * you can mute or unmute from the contacts page as well as their profile
  * changes to a user's mute status propagate across pages in real-time
* Some of our Finnish-speaking users have become contributors via our weblate instance (https://weblate.cryptpad.fr/)
  * we're always looking for more translators to help more people protect their data, so don't hesitate to contact us if you want to help
* Finally, it's now possible to invite users to a team by creating and sharing a personalized one-time-use link.
  * team owners and admins can try it out via their teams' "Members" tab

## Bug fixes

* We've fixed a few subtle bugs where various contact status and our one-to-one chat functionality could get into a bad state.

# HimalayanQuail release (3.7.0)

## Goals

As we are getting closer to the end of our CryptPad Teams project we planned to spend this release addressing some of the difficulties that users have reported regarding the usage of our newer social features.

## Update notes

This release includes an upgrade to a newer version of JQuery which mitigates a minor vulnerability which could have contributed to the presence of an XSS attack. We weren't using the affected methods in the library, but there's no harm in updating as it will protect against the vulnerability affecting user data in the future.

We've also made some non-critical fixes to the server code, so you'll need to restart after pulling the latest code to take advantage of these improvements.

Update to 3.7.0 from 3.6.0 using the normal update procedure:

1. stop your server
2. pull the latest code via git
3. run `bower update`
4. restart your server

If you're using an up-to-date version of NPM you should find that running `npm update` prints a notice that one of the packages you've installed is seeking funding. Entering `npm fund` will print information about our OpenCollective funding campaign. If you're running a slightly older version of NPM and you wish to support CryptPad's development you can do so by visiting https://opencollective.com/cryptpad .

## Features

* Many users have contacted us via support tickets to ask how to add contacts on the platform. The easiest way is to share the link to your profile page. Once on that page registered users will be able to send a contact request which will appear in your notification tray. Because we believe you shouldn't have to read a manual to use CryptPad (and because we want to minimize how much time we spend answering support tickets) we've integrated this tip into the UI itself. Users that don't have any contacts on the platform will hopefully notice that the sharing menu's contacts tab now prompts them with this information, followed by a button to copy their profile page's URL to their clipboard.
* We've made a lot of other small changes that we hope will have a big impact on the usability of the sharing menu:
  * the "Link" section of the modal which includes the URL generated from your chosen access rights has been restyled so that the URL is displayed in a multiline textarea so that users can better see the URL changing as they play with the other controls
  * both the "Contacts" and "Link" section include short, unintrusive hints about how passwords interact with the different sharing methods:
    * when sharing via a URL we indicate that the recipient will need to enter a password, allowing for the URL to be sent over an insecure channel without leaking your document's content
    * when sharing directly with a contact via their encrypted mailbox the password is transferred automatically, since it is assumed that you intend for the recipient to gain access and the platform provides a secure channel through which all the relevant information can be delivered
    * this information is only included in cases when the document is protected with a password to limit the amount of information the user has to process to complete their task
  * we include brief and dismissable warning within the menu which indicates that URLs provide non-revocable access to documents so that new users of the platform understand the consequences of sharing
  * in general we've tried to make the appearance of the modal more appealing and intuitive so that users naturally discover and adopt the workflows which are the most conducive to their privacy and security
* Our premium accounts platform authenticates that you are logged in on a given CryptPad instance by loading it in an iframe and requesting that it use one of your account's cryptographic keys to sign a message. Unfortunately, this process could be quite slow as it would load your CryptDrive and other information related to account, and some users reported that their browser timed out on this process. We've addressed this by loading only the account information required to prove your identity.
* We've also included some changes to CryptPad's server to allow users to share quotas between multiple accounts, though we still have work to do to make this behaviour functional on the web client.
* Spreadsheets now support password change!
* Kanban boards now render long column titles in a much more intuitive way, wrapping the text instead of truncating it.
* Our code editor now features support for Gantt charts in markdown mode via an improved Mermaidjs integration. We've also slowed down the rendering cycle so that updates are displayed once you stop typing for 400ms instead of 150ms, and improved the rendering methods so that all mermaid-generated charts are only redrawn if they have changed since the last time they were rendered. This results in a smoother reading experience while permitting other users to continue to edit the document.
* Finally, after a review of the code responsible for sanitizing the markdown code which we render as HTML, we've decided to remove SVG tags from our sanitizer's filter. This means that you can write SVG markup in the input field and see it rendered, in case you're into that kind of thing.

## Bug fixes

* It seems our "contacts" app broke along with the 3.5.0 release and nobody reported it. The regression was introduced when we made some changes to the teams chat integration. We've addressed the issue so that you can once again use the contacts app to chat directly with friends.
* We've found and fixed a "memory puddle" (a non-critical memory leak which was automatically mopped up every now and then). The fix probably won't have much noticeable impact but the server is now a little bit more correct
* We stumbled across a bug which wiped out the contents of a Kanban board and caused the application to crash if you navigated to the affected version of the document in history mode. If you notice that one of your documents was affected please contact us and we'll write a guide instructing you how to recover your content.
* We've found a few bugs lurking in our server which could have caused the amount of data stored in users' drives to be calculated incorrectly under very unlikely circumstances. We've fixed the issue and addressed a number of similar asynchrony-related code paths which should mitigate similar issues in the future.
* Lastly, we spotted some flaws in the code responsible for encrypting pad credentials in shared folders and teams such that viewers don't automatically gain access to the editing keys of a document when they should only have view access. There weren't any access control vulnerabilities, but an error was thrown under rare circumstances which could prevent affected users' drives from loading. We've guarded against the cause and made it such that any affected users will automatically repair their damaged drives.

# GoldenFrog release (3.6.0)

## Goals

We're following up our last few releases of major core developments with an effort to improve reliability in some unstable areas and make some superficial tweaks to improve usability of some critical interfaces.

## Update notes

Update to 3.6.0 from 3.5.0 using the normal update procedure:

1. stop your server
2. pull the latest code via git
3. run `bower update`
4. restart your server

## Features

* We've introduced a word-count feature in our rich text editor.
* The "share modal" which is accessible from both the "right-click menu" in the drive and the sharing button in the toolbar has been redesigned:
  * different means of sharing access to documents have been split into different tabs to present users with less information to process
  * each sharing method has an associated icon to make their actions easier to recognize at a glance
  * various UI elements have been restyled to make their purpose and importance more obvious
    * cancel buttons have a grey border to draw less attention
    * OK buttons have a blue or grey background depending on whether they are active
    * secondary buttons like "preview" have only a thin blue border so that they don't draw attention away from the primary button
    * read-only text fields have a subtler appearance since they are shown primarily for the purpose of previewing your action
    * text input fields (such as search) have a light background to suggest that you can use them
* We've made a minor adjustment to some of our styles for small screen to detect when a screen is very short in addition to when it is very narrow. As a result it should be somewhat easier to use on-screen keyboards.

## Bug fixes

* We found and fixed a subtle race condition which caused teams' quotas to be calculated incorrectly in certain circumstances.
* A minor bug in our login process caused users with premium accounts to incorrectly see an entry in their user menu as linking to our 'pricing' page instead of their 'subscription' management tools. This has since been fixed.
* We noticed that some of the rendered messages in the history mode of the notifications panel could fail to display text for some message types. These incorrect messages will be hidden from view wherever it is impossible to decide what should be displayed. We plan to address the issue in a deeper way in the near future.
* We've become aware of some odd behaviour in long-lived sessions where tabs seem to lose their connection to the sharedWorker which is common to all tabs open in a particular browser session. As far as we can tell the bug only affects Firefox browser. Unfortunately, debugging sharedWorkers in Firefox has been broken for a number of major versions, so we haven't been able to determine the cause of the issue. Until we're able to determine the underlying cause we've added extra checks to detect when particular features become isolated from the worker, where previously we assumed that if the worker was connected to the server then everything was behaving correctly. We recommend that you reload the tab if you notice that aspects of your shared folders or drives (for users or teams) display a read-only warning while your other tabs are behaving normally.

# FalklandWolf release (3.5.0)

## Goals

This release features work that we've been planning for a long time centered around sharing collections of documents in a more granular way.

This is our first release since David Benqué joined our team, so in addition to these team-centric updates we also worked on integrating some UI/UX improvements.

## Update notes

Updating to 3.5.0 from 3.4.0 is simple.

1. stop your server
2. pull the latest code via git
3. run `bower update`
4. restart your server

## Features

* We restyled some elements throughout the platform:
  * our tooltips have a sleeker flat design
  * the quota bar which appears in the drive, teams, and settings pages has also been improved
  * we've begun improving the look and feel of various popup dialogs
* We've added support for password-change for owned uploaded files and owned shared folders:
  * changing passwords for encrypted files means that the original file will be removed from the server and a new file will be encrypted with a new key and uploaded to a new location on the server. References to the original file will be broken. This includes links, media-tags embedded within pads, and items in other users' drives or shared folders to which you do not have access.
  * the process is very similar for shared folders stored in users' CryptDrives, except that users will have the opportunity to enter the new password when they visit the platform.
* We're very happy to finally introduce the notion of _read-only shared folders_. While we've had the capacity to make shared folders read-only for some time, it was only in the same sense as pads were read-only.
  * This is to say that while a viewer cannot modify the document, any links to encrypted documents within that document would confer their natural editing rights to viewers, making it possible to accidentally leak access when a single pad was shared.
  * Our new read-only shared folders encrypt the editing keys for the documents they contain, such that only those with the ability to change the folder structure itself have the inherent capacity to edit the documents contained within. We think this is more intuitive than the alternative, but it took a lot of work to make it happen!
  * Unfortunately, older shared folders created before this release will already contain the cryptographic keys which confer editing rights. Pads which are added to shared folders from this release onward will have the keys for their editing rights encrypted. We'll offer the ability for owners to migrate these shared folders in an upcoming release once we've added the ability to selectively trim document history.
* Similarly, we've introduced the notion of _viewers_ in teams. Viewers are listed in the team roster and have the ability to view the contents of the team's drive, but not to edit them or add new documents.
  * Unfortunately, the notion of viewers is also complicated by the fact that documents added to team drives or shared folders in team drives did not have their editing keys encrypted. The first team member to open the team drive since we've deployed this release will run a migration that will encrypt the keys saved within the team drive, however, the encryption keys will remain in the drive's history until we develop a means of selectively trimming history.

## Bug fixes

* We discovered and fixed some bugs in the serverside code responsible for handling some aspects of file upload related to starting a new upload after having cancelled a previous session.
* We also identified a regression in Our _slides_ app related to the rendering of `<br>` tags, such as you might create with a `****` sequence in the corresponding markdown. This was introduced with some overly broad CSS that was intended to style our notifications page. We've since made the notifications styles more specific such that they can't interfere with other applications.
* We've become aware of some mysterious behaviour in Firefox that seems to cause some tabs or functionality to reconnect to the server after going offline while other aspects of the platform did not. Until now we've always assumed that users were connected or not, and this partial connection has revealed some bugs in our implementation. Consequently, we've begun adding some measures to detect odd behaviour if it occurs. We expect to have determined the cause of this behaviour and to have proposed a solution by our next release.

# Elasmotherium release (3.4.0)

## Goals

This is a small release, focused on bug fixes and UI improvements, while we're finalizing bigger team-centric features planned for the next release.

## Update notes

This is a pretty basic release:

1. stop your server
2. pull the latest source code
3. restart your server

## Features

* Media elements (images, videos, pdf, etc.) will now display a placeholder while they're being downloaded and decrypted.
* Media elements deleted from the server by their owner will now display a "broken/missing" image.
* The "auto-close brackets" option in the Code and Slide applications can now be disabled from the user settings.
* "Add item" and "Add board" buttons in Kanban have been moved to improve usability with small screens.
* The "transfer ownership" feature for pads has been extended to shared folders. It is now possible to offer ownership of a shared folder to a friend.
* For administrators
  * Better sorting of support tickets in the administration panel. Unanswered messages will be displayed first.
  * Add team configuration options in `customize/application_config.js`
    * `maxTeamsSlots` defines the maximum number of teams a user can join (default is 3). Teams may significantly increase the loading time of pages and we consider 3 to be a good balance between usability and performances.
    * `maxOwnedTeams` defines the number of teams a user can own (default is 1). This number prevent users to create many teams only to increase their storage limit.

## Bug fixes

* The "pad creation modal" (Ctrl+E) is now working everywhere in the drive.
* We've fixed the share button for unregistered users (https://github.com/xwiki-labs/cryptpad/issues/457).
* We've fixed an issue with newly created kanban items replacing existing ones.
* Transfering/offering pad ownership from a team to yourself is now working properly.

# Dodo release (v3.3.0)

## Goals

We've continued to prioritize the development of team-centric features in CryptPad. This release was focused on stabilizing the code for Teams and making them available to the users.

## Update notes

This is a pretty basic release:

1. stop your server
2. pull the latest source code
3. install the latest serverside dependencies with `npm install`
4. install the latest clientside dependencies with `bower update`
5. restart your server

Note: we've updated our Nginx configuration to fix any missing trailing slash in the URL for the newest applications: https://github.com/xwiki-labs/cryptpad/commit/d4e5b98c140c28417e008379ec7af7cdc235792b

## Features

* You can now create _Teams_ in CryptPad. They're available from a new _Teams_ application and provide a full CryptDrive that can be shared between multiple users.
  * Each team has a list of members. There are currently 3 different access level for team members:
    * Members: can add, delete and edit pads from the team
    * Admins: can also invite their CryptPad friends to the team, kick members and promote members as "Admin"
    * Owners: can also promote admins as "Owner", change the team name or avatar and delete the team
  * Each team has its own storage limit (50 MB by default, the same as user accounts).
  * A chat is available to all the team members
  * Pads created from the team's drive will be stored in this drive. If they are created as _owned_ pads, they will be ownedcc by the team.
  * You can share pads or folders from your drive with one of your teams and you can store pads or folders from your team to your personal drive.
  * Each user can be a member of up to 3 teams. A user can't create a new Team if they are already _Owner_ of another one.
* We've done some server improvements to save CPU usage.
* We've also improved to the messenger module to save CPU and memory in the client.
* The support panel (administrator side) now provides more debugging information about the users who ask for help
* A link to the new CryptPad survey (https://survey.cryptpad.fr/index.php/672782?lang=en) has been added to the user menu
  * This link can be changed or removed using the "surveyURL" key in `/customize/application_config.js`. An empty value will remove the link from the menu.

## Bug fixes

* We've fixed an issue preventing users to remove owned empty channels from the server
* Adding and editing new items to the kanban boards will now update the correct item from the board
* We've fixed an issue with shared folders loaded by unregistered users
* The default title is now always set in newly created polls
* Desktop notifications will now be displayed only once per connection to the server and not once per CryptPad tab in the browser
* The button to download a spreadsheet from the drive has been removed. This feature is not available yet and the button was doing nothing.

# Chilihueque release (v3.2.0)

## Goals

We've continued to prioritize the development of team-centric features in CryptPad. This release implements most of the core functionality for fully-functional teams as a core part of CryptPad, though they're not quite ready for use just yet.

Beyond teams we did a little work to standardize some serverside APIs related to storage.

## Update notes

This is a pretty basic release:

1. stop your server
2. pull the latest source code
3. install the latest clientside dependencies with `bower update`
4. restart your server

## Features

* Much of the code from CryptPad's sharedworker system and the CryptDrive's front end has been refactored to consider the existence of _Teams_ in addition to your regular user account.
  * Our next release will make it possible to use this functionality
* Blob (encrypted file uploads) can now archived instead of being deleted outright.
  * set `retainData` to false in your config if you want both channels and blobs to be deleted, or true if you prefer to have them both archived
  * the tools for restoring accidentally deleted data are limited, but if the data is gone then there will certainly be nothing you can do
  * `scripts/evict-inactive.js` expires archived blobs after `archiveRetentionTime` days, as was already the case with channel data
* We've added support for nodejs to a few more of our internal dependencies.
  * for now we're just using this for tests and to speed up development time
  * eventually we hope to be able to use these modules for more command-line tools

## Bug fixes

* Alertify logs (the little pop-ups in the bottom-left of the screen) are now set to appear in front of everything else.
  * it was possible for them to be hidden behind a variety of modals
* When using the search bar to filter friends in the share modal the returned results are now case-insensitive.
* We've fixed some thumbnail bugs related to handling different encodings gracefully.
* We've found and fixed a minor memory leak in our shared workers related to how we fetched chat messages.
* We've also found a serverside bug which could have caused otherwise valid metadata entries in channels to not be read due to how the messages were chunked when reading from the filesystem.

# Baiji release (v3.1.0)

## Goals

For CryptPad 3.1.0 we prioritized our work on team-centric features. In particular we wanted to finish some improvements to make our notifications system more private and start making use of our prior work on editable pad metadata.

## Update notes

* `config/config.example.js` has included the `inactiveTime` value for a while. It's used by our archival script (`scripts/evict-inactive.js`) to determine if a pad should be removed. This value is now shared with clients via the `/api/config` endpoint. Unregistered clients now use this value to inform users that unpinned pad will expire after that number of days of inactivity.
  * previously the value was hardcoded to "3 months"
* Changes to channel metadata logs and users' pin logs now include the time of the modification.
  * this is mostly to help with debugging, though we might use this value in the future
  * newly created metadata will also include a `created` field with a timestamp indicating when it was first created on the server
* We've removed two files from our `scripts` directory:
  * `delete-inactive.js`: because it ignored the configured values for archival
  * `pinned-data.js`: because it was only used by `delete-inactive.js` and we will soon have better ways to accomplish the same goal
* We've made some updates to the server-side components of our caching logic
  * CryptPad used to use the `version` value from `package.json` as a cache-busting string so that all assets would be reloaded and cached when you upgraded to a new version
  * in practice, lots of administrators had problems with this where they made configuration changes and restarted the server, but their client was stuck with old values cached
  * the new default is to generate a cache string at the server's launch time and use this value for the lifetime of the server
    * server administrators can still change the cache string through the instance's admin panel
    * this behaviour was previously available by launching the server with `FRESH=1 node server.js`
  * the old behaviour is still available by launching the server with `PACKAGE=1 node server.js`
* We've refactored some small functions implemented in `historyKeeper.js` which halved our server's memory usage in the previous release and reused those functions in our RPC module.
  * we hope this leads to even better performance under heavy load when doing things like
    * reading metadata
    * checking disk usage (global and for particular users)
    * loading a user's pin log

Baiji depends on updates to clientside and serverside dependencies.

To update:

1. Take down your server
2. Pull the latest code
2. `npm install`
3. `bower update`
4. Launch your server

## Features

* Messages sent to a user's encrypted mailbox are now anonymized by the server.
  * This means that clients other than the intended recipient of a message no longer have any information indicating the identity of the sender
* It is now possible to modify ownership of pads
  * use the "properties modal", available by right-clicking on the pad in your drive or from the properties entry in the "toolbar drawer" in pads
  * navigate to the "Availability tab" and click "manage owners" where you can:
    * offer ownership to friends, who will receive a notification and will be able to accept or refuse ownership
    * remove ownership from confirmed owners
    * rescind pending offers
* Amendments to the "owners" field in pad metadata will now also change the "mailbox" field, allowing users with read-only access rights to request editing rights from any of the owners
  * the current behaviour is to ask only the first owner in the list, but we'll be able to make use of the additional mailboxes in future releases
* We now consider changes to metadata to be "activity" for a channel for the purposes of deciding whether an unpinned channel should be archived.
  * this means that if you offer other users ownership of a pad and remove yourself as owner, even if nobody is pinning the document it will not be removed until the configured period of inactivity from the time when you removed yourself as owner
* The "What is CryptPad" pad which is created in a user's CryptDrive when they first register is now created as an "owned pad" which they can remove from the server
* We've begun work on a basic command-line client which we're mostly using for automated testing of our history-related APIs and our serverside RPCs (Remote Procedure Calls).
  * a stable command-line client API won't necessarily be available for the foreseeable future, but these tests should lead to fewer serverside regressions which will be better for the browser client as well
  * as we write tests we're converting more and more of our browser-only modules to work in more environments, so native and mobile apps will be easier to implement in the future
* Finally, we've begun to detect and users that try to register with their email address as their username
  * we don't prevent them from doing so, but we do warn them that their email address is not actually sent to the server, and we won't be able to use it to recover their account if they forget it or their password

## Bug fixes

* In our previous release we discovered that `config/config.example.js` did not include the configuration point which enabled the server to schedule tasks for the expiration of files.
  * even though the pads were created with the expiration time in their metadata, and the server would not serve such files to clients that requested them, they would still remain in the database
  * if these expired pads are ever requested and they should have expired over a day before, the server will now archive or delete the file immediately
* We've investigated and fixed a number of errors that were visible in the browser console even if they didn't have harmful effects on the client's behaviour
  * when reconnecting
    * "channel ready without callback"
    * network "EJOINED" error
* Changes to the metadata logs for pads are now queued so that they are always written in the same order as they were received

# Aurochs release (v3.0.0)

The move to 3.0 is mostly because we ran out of letters in the alphabet for our 2.0 release cycle.
Releases in this cycle will be named according to a theme of "extinct animals", a list which is unfortunately getting longer all the time.

## Goals

In this release, we took more time than usual to make some big changes to the way the platform works, taking great care to maintain or improve stability.

Up until now it has been necessary to create documents with the whatever settings they might require in the future, after which point it was not possible to change them. This release introduces the ability of the server to store and read amendments to document metadata. This will soon allow users of owned documents to delegate that ownership to their friends, add or modify expiration times, and make other modifications that will greatly improve their control over their data.

## Update notes

During this development period we performed an extensive audit of our existing features and discovered a few potential security issues which we've addressed. We plan to announce the details of these flaws once administrators have had sufficient time to update their instances. If you are running a CryptPad instance, we advise you to update to 3.0.0 at your earliest opportunity.

* It was brought to our attention that while expired pads were not being served beyond their expiration time, they were not being removed as intended. The cause was due to our failure to document a configuration point (`enableTaskScheduling`) that was added to make expiration optional in the example configuration file. We've removed this configuration point so that tasks like expiration will always be scheduled. Expiration of tasks was already integrated into the main server process, but we have added a new configuration point to the server in case any administrators would like to run the expiration tasks in a dedicated process for performance reasons. To disable the integration, change `disableIntegratedTasks` from `false` to `true` in the server configuration file.
* This release depends on updates to three clientside libraries (`netflux-websocket@0.1.20`, `chainpad-netflux@0.9.0`, and `chainpad-listmap@0.7.0`). These changes are **not compatible with older versions of the server**. To update:
  1. make any configuration changes you want
  2. take down your server process
  3. fetch the latest clientside and serverside code via git
  4. run `bower update` and `npm install` to ensure you have the latest dependencies
  5. update your cache-busting string if you've configured your instance to update this manually
  6. bring your server back up

## Features

* Support panel
  * Support tickets now include the "user agent" string of the user's browser to make it easier to debug issues.
  * Users that submitted support tickets will now receive notifications when their tickets are answered
* Sharing and access control
  * the "pad properties modal" now displays the name of the owner of a pad if you recognize their public key
    * this will be improved further in future releases as we introduce the notion of "acquantances" as users who you have seen in the past but who are not yet your friends
  * newly created "owned pads" will now contain an "owner" field containing the address of your "mailbox", encrypted with the same key as the pad itself
    * this allows users with view-only access rights to send you a message to request edit rights
    * the same functionality is offered for older pads if you happen to know the mailbox address for an owner listed in the "owners" field
  * it was already possible to delegate access to a friend via the "share modal", but we now support a special message type for templates so that the pad will be stored as a template in the receiving user's drive (if accepted)
  * the "availability" tab of the "properties" modal for any particalar pad now shows the display name of the pad's owner if they are your friend. Additionally we now support displaying multiple owners rather than just "yourself" or "somebody else"
* File and CryptDrive workflows
  * we now support folder upload in any browser offering the required APIs
  * it's now possible to export files and folders (as zips) directly from your CryptDrive
  * the ctrl-e and right-click menus in the drive now features an entry for uploading files and folders
  * certain plain-text file formats uploaded as static files can now be rendered within other documents or used as the basis of a new code pad
  * ~~regular folders in your CryptDrive can be converted into shared folders from the right-click menu as long as they do not contain shared folders and are not within another shared folder~~
    * nesting is complicated for a variety of technical reasons, but we're discussing whether it's worthwhile to try to find a solution
    * we found a critical bug in the implementation of this feature and disabled it for this release
  * documents and folders within your CryptDrive can now be moved to parent folders by dropping them on the file path in the toolbar
* Styles
  * the upload/download progress table has been restyled to be less invasive
  * right-click menus throughout the platform now feature icons for each entry in addition to text
  * the animation on the spinner on the loading page has been updated:
    * it no longer oscillates
    * it doesn't display a 'box' while the icon font is loading
    * it's more dynamic and stylish (depending on your tastes)
* We've renamed the "features" page "pricing" after many prospective users reported that is was difficult to find details about premium accounts
* Code editor updates
  * you can now un-indent code blocks with shift-tab while on a line or selecting multiple lines of text
  * backspace now removes the configured level of indentation
  * titles which are inferred from document content now ignore any html you might have included in your markdown

## Bug fixes

* One of our users registered `CVE-2019-15302` for a bug they discovered
  * users with edit access for rich text pads could change the URL of the document to load the same document in a code pad
  * doing so invalidated the existing stored content, making it impossible to load the same document in the rich text editor
  * doing the same steps now displays an error and does not modify the existing document
* UI and responsiveness
  * submenus in contextmenus can now be opened on mobile devices
  * the CryptDrive layout mode is now detected dynamically instead of at page load
  * contextmenus shouldn't get rendered off the page anymore
  * a non-functional ctrl-e menu could be loaded when another modal is already open, but now it is simply blocked
  * icons with thumbnails in the drive no longer flicker when the page is redrawn
  * the color picker in the settings page which chooses your cursor color now uses the same cross-platform library used in other applications (jsColor) so that it will work in all modern browsers
  * when prompted to save a pad to your CryptDrive is was possible to click multiple times, displaying multiple confirmation messages when the pad was finally stored. We now ignore successive clicks until the first request fails or is successful
  * chat messages now only render a subset of the markdown implemented elsewhere on the platform
  * your most recently used access-right settings are remembered when you delegate access directly to a friend, while previously the settings were only remembered when the other sharing methods were used
* Code editor bugs
  * indentation settings modified on the settings page are updated in real time, as intended
  * we discovered that when changes made by remote editors were applied to the document when the window was not focused, the user's cursor position would not be preserved. This has been fixed
  * when importing code without file extensions (.bashrc, .viminfo) the file name itself was used as an extension while the name was considered empty. These file names and extensions are now parsed correctly
  * language modes in the code editor are now exported with their respective file extensions
  * file extensions are reapplied when importing files
* CryptDrive
  * we offer a "debug" app which is not advertised anywhere in the UI which can be used to investigate strange behaviour in documents
    * if the app is loaded without a hash, the hash for the user's drive is used instead
    * we no longer add this document as an entry in your CryptDrive
    * we guard against deleting the history of your CryptDrive if you already have such a file and you delete it permanently or move it to your trash
  * we've fixed a number of bugs related to viewing and restoring invalid states from your CryptDrive's history
* Connectivity
  * we've fixed a bug that caused disconnection from the server to go undetected for 30 seconds
  * we discovered that leaving rejoining a real-time session would cause the reactivation of existing listeners for that session as well as the addition of a new set of handlers. We now remove the old listeners when leaving a session, preventing a memory leak and avoiding the repeated application of incoming messages
  * when we leave a session we also make sure to clean up residual data structures from the consensus engine, saving memory
  * we found that support tickets on the admin page were displayed twice when the admin disconnected and reconnected while the support ticket panel was open. This has been fixed

# Zebra release (v2.25.0)

## Goals

This release coincided with XWiki's yearly seminar, so our regular schedule was interrupted a bit. We spent the time we had working towards implementing components of "editable metadata", which will allow pad owners to add new owners or transfer ownership to friends, among other things.

Otherwise we wanted to deploy a built-in support system to improve our ability to debug issues as well as to make it easier for users to report problems. Along the way we did our best to improve usability and fix small annoying bugs.

As this is the last release in our 2.0 cycle, we're going to take some extra time to prepare some big features for our 3.0.0 release, which we expect to deploy on August 20th, 2019.

## Update notes

* We've updated some dependencies that are used to lint the CryptPad codebase to detect errors. Run `npm install` if you plan to develop for CryptPad and you want to use the linter
* This release introduces a _support_ tab within the admin panel. If you generate an asymmetric keypair and add it to your server-side configuration file then users will have the option of opening support tickets if they encounter errors. Their support tickets will include some basic information about their account which might help you to solve their issues. To set up your _"encrypted support mailbox"_:
  1. run `node ./scripts/generate-admin-keys.js`
  2. copy the "public key" and add it to your config.js file like so:
    * `supportMailboxPublicKey: "BL3kgYBM0HNw5ms8ULWU1wMTb5ePBbxAPjDZKamkuB8=",
  3. copy the private key and store it in a safe place
  4. navigate to the "support" tab in the admin panel and enter the private key
  5. share the private key with any other administrators who should be able to read the support tickets
  6. restart so that your users receive the public key stored in your configuration file
    * this will allow them to submit tickets via the support page
    * if you don't know how to fix the issue and want to open a ticket on our public tracker, include the information submitted along with their ticket

## Features

* The feature added in the previous release which displayed a preview of the theme and highlighting mode chosen for the code and slide editors has been improved to also display previews when navigating through the dropdowns using keyboard arrow keys.
* We've followed up on our initial work on notifications by adding a full notifications page which offers the ability to review older notifications that you might have accidentally dismissed.
* When you right-click on an element in the CryptDrive the resulting menu now includes icons to make it easier to find the action for which you are looking
* We now include folders in search results which used to only include files
* You can right-click to add colors to folders, in case that helps you organize your content more effectively

# Yak release (v2.24.0)

## Goals

We've recently had an intern join our team, so this release and those until the end of summer are likely to feature a lot of small usability fixes.
Otherwise, we've continued to develop team-centric features, particularly the way that registered users share pads with friends.
Finally, we prioritized the ability to archive files for a period instead of deleting them, which we've been planning for a while.

## Update notes

* There are some important steps in this release:
    * **make sure you read the full update notes before proceeding!**
* [@zimbatm](https://github.com/zimbatm) added the ability to configure the location of your configuration file via environment variables when launching the server:
  * `CRYPTPAD_CONFIG=/home/cryptpad/cryptpad/cryptpad-config/config.js /home/cryptpad/cryptpad/server.js`
* We discovered a bug in our Xenops release which resulted in the server's list of pads stored for each user to be incorrect.
  * if you're running CryptPad 2.23.0, we recommend that you disable any scripts configured to delete inactive pads
  * updating to 2.24.0 will fix the issue in the client, but each user's list of "pinned pads" won't be corrected until they visit your instance and run the latest code
* This release introduces the ability to archive some data instead of deleting it, since it can be scary to remove user data when you can't easily inspect it to see what it is
  * to take advantage of this new functionality you'll need to update your configuration file with three new configuration points:
    * set `retainData` to `true` if you want to archive channels instead of deleting them
      * either by user command or due to inactivity
      * the server will fall back to its default deletion behaviour if this value is `false` or not set at all
    * set `archiveRetentionTime` to the number of days that an archived pad should be stored in the archive directory before being deleted permanently
    * set `archivePath` to the path where you'd like archives to be stored
      * it should not be publicly accessible in order to respect the users' wishes
* We've introduced some new scripts to work with the database, some of which were needed to diagnose problems stemming from the pinning bug
  * `evict-inactive.js` identifies channels which are unpinned and inactive and archives them
    * unlike `delete-inactive.js` it only handles channels, not files or any other kind of data
    * ...but it's much safer, since nothing is removed permanently
    * in the coming releases we'll implement archival for other types of data so that we can fully remove unsafe scripts
  * `diagnose-archive-conflicts.js` checks all the files in your archive and identifies whether they can be restored safely or if they conflict with newer files in the production database
  * `restore-archived.js` restores any channels archived by the server or evict-inactive.js, excluding those which would conflict with the database
* This release depends on updates to some serverside dependencies. Run `npm update`:
  * `ws` addresses a potential vulnerability, so if possible anyone running earlier versions of CryptPad should update
  * `chainpad-server` handles users' websocket connections and we needed to make a few changes to deal with changes in the `ws` API
  * `heapdump` is no longer a default dependency, though you can install it if you want its functionality
* This release also features a **Clientside migration** which modifies users' CryptDrives. Any clients which are running both the latest code after the update as well as an older version in another browser or device risk creating conflicts in their account data. To prevent this, update in the following manner:
  1. ensure that you've added the configuration values listed above
  2. shut down the server and ensure that it doesn't restart until you've completed the following steps
  3. pull the latest clientside and serverside code via git
  4. `npm update` to get the latest serverside dependencies
  5. update the cache-busting string if you are handling the cache manually, otherwise allow the server to handle this as per its default
  5. restart the server: clients with open tabs should be prompted to reload instead of reconnecting because the server's version has changed
* We recommend that you test a local version of CryptPad before deploying this latest code, as aspects of the above-mentioned migrations are not backwards-compatible.
  * you can roll back, but users' CryptDrives might have errors coping with data introduced by newer features.

## Features

* As mentioned above, CryptPad instances can be configured to temporarily archive files instead of deleting them permanently.
  * as a user this means if you accidentally delete a file you have the option of contacting your administrator and asking them to help
  * if they're really nice and have the spare time to help you, they might actually recover your data!
* A contributor is working on translating CryptPad into the Catalan language.
  * if your preferred language isn't supported, you can do the same on https://weblate.cryptpad.fr
* We added the ability to add colors to folders in users CryptDrives, along with support for arbitrary folder metadata which we aren't using yet.
* Users with existing friends on the platform will run a migration to allow them to share pads with friends directly instead of sending them a link.
  * they'll receive a notification indicating the title of the pad and who shared it
  * if you've already added friends on the platform, you can send them pads from the usual "sharing menu"
* Our code editor already offered the ability to set their color theme and highlighting mode, but now those values will be previewed when mousing over the the option in the dropdown.
  * Our slide editor now offers the same theme selection as the code editor
* It's now possible to view the history of a shared folder by clicking the history button while viewing the shared folder's contents.

## Bug fixes

* The CryptDrive received a number of usability fixes this time around:
  * better styles when hovering over interactive elements in the drive (cursors, shading, etc)
  * clicking the history button in the drive a second time will exit history mode
  * after being resized, the tree pane now correctly responds to mobile layout styles
  * the path indicator also adapts to very narrow layouts
  * the user's current location is preserved when renaming the current folder or its ancestors
  * you can right-click on elements in the tree and expand or collapse all of their children
* A user noticed that one-on-one chats did not seem to be deleted, as their messages were still available after a reload.
  * they were deleted but our usage of the sharedWorker API incorrectly preserved a local cache of those message until you closed all of your browser tabs
* We've also fixed some elements of the chat UI, notably the position of the chat's scrollbar when first loading older messages and how the interface scrolls to keep up with new messages.
* We've noticed some cases of tooltips getting stuck in the UI and implemented some measures to prevent this from happening.
* After "unfriending" another user it was possible that they would be automatically re-added as friends.

# Xenops release (v2.23.0)

## Goals

For this release we wanted to focus on releasing a small set of features built on top of some foundations established in our last release. Since we were able to complete this feature set in less than a week, we decided to bundle them together so users could take benefit from them sooner.

This work is being funded by the grant we received from NLnet foundation as a part of their PET (Privacy Enhancing Technology) fund. You can read all about this grant on our latest blog post (https://blog.cryptpad.fr/2019/05/27/Our-future-is-collaborative/).

## Update notes

* This update only uses clientside dependencies. Fetch the latest code for the core repository, and depending on when you last updated you may need to `bower update` as well.
* User data is "pinned" on CryptPad instances to keep track of what encrypted data can be safely removed. At one point this system was optional and could be disabled by setting `enablePinning = false` in `customize/application_config.js`. At some point we stopped testing whether CryptPad could actually work without pinning enabled, and at this point it is definitely broken. As such, we've decided to drop support for this configuration.

## Features

* Some of our multilingual contributors have contributed translations in the German, Russian, and Italian. The history of their contributions is available on our weblate instance (https://weblate.cryptpad.fr/projects/cryptpad/app/).
* This release introduces a practical use-case of the encrypted mailbox infrastructure which we developed in our last release. Registered users are now able to use this system to accept friend requests and review the status of friend requests that have been accepted or declined. Unlike our previous friend request system, our usage of encrypted mailboxes allows for users to send friend requests from other user's profiles whether or not they are online.
* We've also put some time towards improving user profiles as well. When you change your display name from anywhere within CryptPad the name used in your profile will be updated as well. We've also made updates to other users' profiles render in real-time, since the rest of CryptPad generally updates instantly.

## Bug fixes

* Some small components of CryptPad time out if they don't work within a set amount of time, and apparently this timeout was causing problems in the newest Tor browser version. We've drastically increased the timeout to make it less likely to cause problems when loading very large documents.
* We realized that Weblate was committing "empty strings" to our translation files. Our internationalization system was configured to fall back to the English translation if no translation was available in the user's preferred language, but these empty strings fooled the system into displaying nothing instead. We addressed the issue by checking whether a string was really present, and not just whether a value existed.

# Wolf release (v2.22.0)

## Goals

This release coincided with a little time off for the team, so we planned to include only a few things. We recognized that the "Recent pads" view in the CryptDrive was not very useful for us because it did not include documents stored in _Shared folders_, so we decided to fix that. Otherwise, we're beginning a new project which we'll announce soon, so we've started working on some of its basic features.

## Update notes

* This release does not include any serverside changes, so you'll only need to get the latest source from the core repository and update dependencies with `bower update`

## Features

* As noted above, we've updated the _Recent Pads_ view in the CryptDrive to include _Shared folders_. We've also broken the list up into categories for the last 24 hours, last 7 days, and last 4 weeks.
* Continuing the theme of taking multi-user workflows into account, we've started working on the design and implementation of "Encrypted mailboxes". This will allow for account notifications in a future release, which will then make it possible for us to improve our "friend request" process, as well as enabling users to share access to documents directly without ever having to send their links outside of the platform.
* Even though this is a fairly small release from us, we've continued to receive contributions to our German, Spanish, Italian, Romanian, and Russian translations.

## Bug fixes

* We've removed a fairly large amount of duplicated code related to our networking layer which - while not directly responsible for any bugs that we know of - increased the likelihood that there would be bugs in the future.
* We realized that very old document hashes (version 0) were being displayed as having a "read-only link", even though those document did not support read-only mode. This has been fixed.
* We've also included some new tests to make sure that those fixed bugs stay fixed.
* Finally, it was reported that templates for polls were not working. We determined that the templates had been encoded in an invalid format at creation time, so when people tried to apply theme the process failed. We've addressed the underlying issue, but those invalid templates will unfortunately have to be recreated.

# Vervet release (v2.21.0)

## Goals

For this release cycle we decided to fix some deep bugs and reduce the likelihood of regressions. This included not just errors in the code, but issues that were likely to arise from incorrect configuration. There's still some work to do, but the process of setting up a CryptPad server should be slightly easier now.

## Update notes

* First off, we've added a [Code of Conduct](https://github.com/xwiki-labs/cryptpad/blob/master/CODE_OF_CONDUCT.md) to this repository. This project is intended to improve people's safety, and we want to be clear that this goal extends to any medium through which the public engages with the project.
* We've made a change related to how our server handles automatically expiring pads. Our server has always refused to send users the history of channels that have expired, but the actual files were only removed if administrators had set up a cron job to call a script which removed channels that had passed their expiration date. We've integrated this script into the server so that no such script will be necessary (though the old one will continue to work).
  * We've also made the process which scans for expired files more efficient, though the optimizations require a new format. We've included a migration, but the removal process is backwards compatible, so nothing terrible will happen if you don't run it. Nevertheless, we recommend you do.
* This release features changes to our serverside and clientside dependencies. To update:
  * get the latest code:
    * `git pull`
  * update serverside dependencies
    * `npm install`
  * update clientside dependencies
    * `bower update`
  * restart your server
  * run the migration to optimize for expiring channels:
     * From your CryptPad source directory, run `node scripts/migrations/migrate-tasks-v1.js`
* Administrators who want to restrict the translation languages available on their server can do so by defining an array of available language codes.
  * In your `cryptpad/customize/application_config.js`, define an array containing the langauges you want:
    * for Example: `AppConfig.availableLanguages = ['en', 'de', 'fr']`
* Finally, some administrators requested the ability to remove any references to our crowdfunding campaign. CryptPad is open-source, so naturally this was already possible, but we've made it easier.
  * In your `cryptpad/customize/application_config.js`, set `AppConfig.disableCrowdfundingMessages = true`.

## Features

* Contributors to our translation files have been busy. This release introduces Italian and Norwegian Bokmål. There has also been significant progress with for our partially complete Romanian and Russian translations.
* Our 'history-keeper' module which is responsible for storing and fetching messages has integrated our new serverside logging API, so any errors should all end up in one log instead of printing to the console.
* Similarly, every aspect of the server which is responsible for deleting content now makes an entry in the logs for that deletion, indicating the cause of the event (automatic expiration, deletion due to inactivity, or manual action on the part of the user).
* We identified some parts of the serverside code and our scripts which duplicated logic, and refactored them to use singular implementation of the intended behaviour.
* We've configured codemirror to allow for spellcheck in our code editing applications (/code/ and /slide/)

## Bug fixes

* The admin panel already featured a function which displayed the number of active sessions on the server, but it was likely to be incorrect if the API server was behind a reverse proxy. It should now display the correct number of distinct IPs which are currently connected.
* We've fixed a regression in our rendering of highlighted code blocks in markdown.
* When you close a pad which included some chat history, we remove that history from the memory of the sharedWorker which implements some caching for when you have duplicated tabs.
* We discovered that under some conditions it was possible for tabs to lose their connection to their corresponding worker. Such tabs will now identify that they have disconnected, and will prompt the user to reload.
* Our usage of shared workers also made it possible for users to leave a pad and then reconnect with the same network id, which led to some errors in our userlist. We've addressed a number of related problems, so incorrect userlists should be less likely to reappear in the future.
* Our usage of OnlyOffice for our spreadsheet editor disabled some behaviour, but left the buttons present. We've hidden those buttons to avoid confusion.
* Finally, we've investigated a bug which users reported in our rich text editor, where text could be duplicated without any user action. Unfortunately we don't yet have a fix, but we've identified the cause of the issue deep in our realtime engine. We hope to address this issue in a coming release.

# Upupa release (v2.20.0)

## Goals

After all the features we've added over time, the root of the CryptPad repository had gotten to be something of a mess. We decided to spend a lot of this release period cleaning things up. We also prioritized some other features which make it easier to manage a CryptPad instance.

## Update notes

This release makes a number of serverside changes. Read the following notes carefully before updating from an earlier version of CryptPad!

* We realized that docker images persisted `config.js` by copying it into the `customize` volume. Since customize is exposed by the webserver, this meant that potentially private information in the configuration file would be accessible over the web. We've moved `config.js` to a `cryptpad/config/`, along with `config.example.js` and modified the docker setup so that nothing in this folder will be exposed to the web.
  * Consequently, you'll need to move your own `config.js` to the new location in order for your server to read it when you restart.
* We also noticed that the configuration values for alternate paths to various were not universally supported, and that they couldn't be deeper than one directory, in any case. We've reviewed the server's source and introduced support for arbitrary filepaths to each of the directories.
  * In the near future we plan to simplify server maintenance by moving all user data into a new `data` directory. This will make docker setups easier to maintain, as well as simplifying the task of migrating or backing up your database.
* CryptPad now features a rudimentary administration panel, accessible at the /admin/ URL. Server operators can add their **Public signing key** (found on their settings page) to their config file in the `adminKeys` array. See config.example.js for more info.
* We've also moved all our scripts out of the repository root and into a dedicated `scripts` directory. We recommend reviewing any crontabs or other scripts that might be calling them.
* After receiving a number of support requests for third-party instances due to our email being displayed on the contact page, we've decided to display the `adminEmail` from `config.js` to users.
  * If you leave the default `i.did.not.read.my.config@cryptpad.fr`, nothing will be displayed. We'd appreciate it if you did leave your own contact information, as time we spend trying to help users on your instance is time we spend _not developing new features_.
* We've introduced a basic logging API which standardizes how various messages are printed, as well as logging them to the disk.
  * If you do not specify `logPath` in your config file, it will not log to the disk.
  * Unless `logToStdout` is true, it will not print to the console either.
  * You can configure the degree of logging by setting `logLevel` to one of the supported settings. If no level is set, it will use the default `info` setting, which includes _warnings_ and _errors_. See the example config for more information.
* We've dropped support for number of configuration points:
  * `enableUploads` no longer has any effect, as the clientside code assumed the server supported uploads. This value was added when file uploads were still considered experimental, but they have been a core part of the platform for some time.
  * `restrictUploads` no longer has any effect either, for the same reason.
* We've made some small updates to `example.nginx.conf` to expose `/datastore/` over the web, as there are some scripts which depend on expect the log files to be exposed.
* Depending on when you last updated, you may need to update your clientside dependencies. Run `bower update` to get the latest code.
* Finally, we've introduced a server-side dependency (get-folder-size) and updated one of our own libraries (chainpad-server). Run `npm install` to get the updated versions. The server won't work without them.

## Features

* Our rich text editor is now configured to support the insertion of LaTeX equations via CKEditor's  _mathjax_ plugin.
* The contact page now lists our Mastodon account, which is quickly catching up to our twitter account's number of followers.
  * If configured correctly, instances will also display the contact email for the instance administrator.
* We've reorganized the home page a little bit, making more of our applications visible at a glance. It also features changes to the header and footer.
* The chat box and help text are no longer shown by default, making the interface much cleaner for new users.
* Pads which were created with an expiration date are now displayed with a clock icon in users' Drives.
* The settings page now remembers which tab you'd selected, in the event of a page reload.
* We received contributions to our [German](https://weblate.cryptpad.fr/projects/cryptpad/app/de/#history) and [Russian](https://weblate.cryptpad.fr/projects/cryptpad/app/ru/#history) translations.
* Our code and slide editors now features a first version of support for rendering [Mermaid rendering](https://mermaidjs.github.io/).

## Bug fixes

* The dialog to store a pad in your drive was hidden behind the preview panel in the slide editor. It's now back on top where it belongs.

# Tapir release (v2.19.0)

## Goals

As we're very busy wrapping up the project which has funded CryptPad's development so far, this release is very small.
We've requested assistance improving the state of our translations, and received some very helpful contributions.

## Update notes

* We discovered that `container-start.sh` erroneously made a full copy of the `customize.dist` directory. This caused issues when updating to newer versions of CryptPad, where the customize directory was out of date with the rest of the instance.
  * if you have installed using docker, and have not customized your instance, you can safely remove everything in the `customize` directory **after having backed up your config.js file**. Your instance should fall back to using the default versions of those files instead of the outdated copies.
  * if you have customized your instance, you'll need to be more careful about cleaning up. Remove the files which you haven't modified, and compare your modified files against the latest versions of the default files. Merge your changes into the updated versions, and you should have an easier time updating in the future.

## Features

* We've rearranged the example server configuration file to make it easier to read and understand
* CryptPad now features a Russian translation which is 10% complete
* Our German translation has received a few fixes
* One of our Romanian colleagues has begun updating the Romanian translation, which is currently 39% complete
* **NOTE**: we're still learning our way around using weblate. We haven't given credit to these contributions because we're unsure if their authors want to be named. Going forward we'll figure out a system for giving proper credit where it is desired.

## Bug fixes

* As noted above, we've made some small changes to `container-start.sh` so that new docker images are correctly initialized

# Sloth release (v2.18.0)

## Goals

This release was developed during a busy period, so it contains fewer features than normal.
In particular we aimed to improve some aspects of our infrastructure, including finishing our deployment of _weblate_ for translations.

## Features

* Inserting `[TOC]` into the code editor while in markdown mode will render a table of contents in the preview pane.
* The code and slide editors also features some usability improvements pertaining to how tabs are handled, as it was possible to mix tabs and spaces unintentionally.
* The search bar in users drives now displays an _x_ while displaying search results, allowing users to easily return to the default view of their drive with a click.
* We've updated our translation guide to describe our new policies and procedures for translating CryptPad.
* We've added some additional features to our debugging application to help some users that reported difficulty finding documents in the history of their CryptDrives.

## Bug fixes

* We discovered that some additional validation we'd applied to document hashes had falsely identified some old URLs as invalid, and updated the validation to correctly account for those edge cases.
* We noticed that it was not possible to use arrow keys to navigate within some inputs in the drive, and fixed the issue.
* We also realized that some values were not correctly initialized for new accounts, and restored the intended behaviour.
* We've added a clientside migration to users' accounts to remove some duplicated values, making drives take up slightly less space over time.

# Raccoon release (v2.17.0)

## Goals

For this release we planned to resolve issues discovered in our beta release of encrypted spreadsheets, work towards providing an easier experience for contributors who wish to translate CryptPad, and resolve some minor usability issues that had been bothering us.

## Update notes

* This release introduces a new clientside dependency. Run `bower update` to install `requirejs-plugins`.
* We investigated using [Weblate](https://weblate.org/) for translating CryptPad, but in order to do so we have to migrate from our current translation format (Javascript files) to JSON. Administrators running recent version of CryptPad shouldn't have any trouble using the new system as long as they have not modified their translation files directly. Extensions to the translation dictionaries present in `/customize/translations/` should continue to work as expected. Anyone experiencing difficulty upgrading from older version of CryptPad to 2.17.0 can visit our chat channel for advice on how to proceed.

## Features

* We've received some updates from some of our German-speaking contributors to our Deutsch translation.
* We now perform more strict validation for the secret values encoded after the hash, since one of our users discovered that CryptPad failed silently when provided with an invalid hash.
* As requested, the CryptDrive now displays a lock icon for password protected pads.
* When you click 'Show in folder' from the _search_ or _recent pads_ interface, the selected file will be at the top of the screen. Previously the file was selected, but we didn't scroll to its location in the resulting folder, so it could be out of view if that folder had many files.
* We've tweaked the styles of some of the rendered Markdown in both our code and slide editors.
* Finally, we've added the same _pad creation screen_ to our spreadsheet editor as is normally present within our other editors. This will allow users to mark a spreadsheet as _owned_ (allowing them to delete it at a later time) and as having a pre-set expiration time.

## Bug fixes

* Very long words and lines are now wrapped correctly in the Kanban app.
* The rest of the bug fixes for this release were all applied to the spreadsheet editor:
  * Spreadsheets with additional worksheets were prone to errors caused when some clients did not receive instructions to update the identifier for a worksheet. This caused those spreadsheets to fail to load entirely.
  * We have added two buttons to the spreadsheet editor's app toolbar:
    * a _properties_ button like those on our other editors, to provide basic information about the document
    * an _import_ button, to process exported documents. Unlike our other import buttons, the spreadsheet editor is currently limited to importing when you are the only editor present in the session.
  * We've resolved some errors in how the history of a spreadsheet was counted against user quotas. Similarly, we've made sure to delete some extraneous information associated with spreadsheets when they are deleted from users' CryptDrives.
  * In the event of a server error, the spreadsheet editor will lock itself and proceed in read-only mode

# Quokka release (v2.16.0)

## Goals

We set aside an additional week for this release in order to deploy _encrypted spreadsheets_, which we've been working toward for a long time.
This feature combines our usual focus on privacy with OnlyOffice's spreadsheet editor.

At least for this first release we're still considering this functionality to be **highly experimental**.
We've done our best to make this new application fun and easy to use, however, it will still require a lot of work before it supports all the features that you can expect from our other editors.
We welcome you to try it out and report any difficulties you encounter, though you may want to wait before you start using it for all your financial documents.

## Update notes

* OnlyOffice requires more lax Content Security Policy headers than the rest of the platform. Compare your configuration against `config.example.js`.
* If you are running a customized `application_config.js`, you may need to update `availablePadTypes` and `registeredOnlyTypes`. See [the wiki](https://github.com/xwiki-labs/cryptpad/wiki/Application-config) for more details.
* In addition to a few serverside changes for the new spreadsheet editor, this release fixes a bug that affected system administrators who had set custom limits for some users and disabled communication with our payment server. Restart your server after updating for these changes to take effect.

## Features

* We've implemented a feature we call _ephemeral channels_, which we use for displaying other users' cursors in our rich text, code, and slide editors. Ephemeral channels behave exactly like our regular server messaging infrastructure except that no history is stored.
* We've added additional highlighting modes in our code editor for C, C++, Java, and Objective-C
* We've imposed a limit of five items for the table which displays upload progress, in order to keep it from taking up too much space on the screen when users upload many files in one session.

## Bugfixes

* [@3n2pS3P5kG23S96yxRbUHAZajuH2F](https://github.com/3n2pS3P5kG23S96yxRbUHAZajuH2F) reported an issue shortly after our last release which threw an error if our feedback API was disabled. The fix was on our master branch, but now it will be properly tagged.
* We noticed an issue in our code editor where imported .md files were interpreted as text, instead of markdown. This caused the preview pane to stop working.
* We also discovered an issue which had broken our CryptDrive import function, but as far as we know it did not affect any users. It should be working as intended now.
* Unfortunately, we don't do a lot of testing on Internet Explorer 11, but one of our users was kind enough to report an error. We tracked down a few uses of APIs which do not exist on IE11, and replaced them with compatible functions, so now users of IE11 will be able to enjoy CryptPad once more.

# Pademelon release (v2.15.0)

## Goals

For this release we planned to improve upon last release's introduction of the display of other users' cursors in our code and slide editors by adding the same functionality to our rich text editor.

Beyond just producing software, the CryptPad team has also begun to produce peer-reviewed papers.
We have previously published [Private Document Editing with Some Trust](https://dl.acm.org/citation.cfm?doid=3209280.3209535) as a part of the 2018 proceedings of the ACM Symposium on Document Engineering.
We have recently been accepted for publication as a part of [HCI-CPT](http://2019.hci.international/hci-cpt): the first international conference on HCI (Human Computer Interaction) for cybersecurity, privacy and trust.
In preparation for this publication we've begun to collect additional usage data in order to inform the wider community of our findings regarding usability of cryptography-based collaboration systems.

## Update notes

* Updating to version 2.15.0 from 2.14.0 should only require that update to the latest clientside code via git, and update any cache-busting parameters you've set.
* Several of our third-party clientside dependencies have been updated, and you may optionally run `bower update` to receive their latest versions.
* As explained above, we have added a number of new keys to our existing feedback system. The new keys are detailed below
  * HOME_SUPPORT_CRYPTPAD informs us when users discover our opencollective campaign from the CryptPad home page
  * UPGRADE_ACCOUNT informs us when someone clicks the upgrade account button from their CryptDrive or settings page
  * SUPPORT_CRYPTPAD is not active on our CryptPad instance, since this key is only sent when clicking the _donate button_ which is shown when upgraded accounts are disabled
  * DELETE_ACCOUNT_AUTOMATIC informs us when somebody deletes their account automatically from the settings page. Automatic account deletion is only available for accounts created since version 1.29.0
  * DELETE_ACCOUNT_MANUAL informs us when a user generates the proof of their account ownership which is required for manual account deletion. This feature is available only for accounts predating version 1.29.0
  * OWNED_DRIVE_MIGRATION informs us when a user migrates their CryptDrive from our legacy format (which does not support automatic deletion) to our newer format (which does) via the settings page
  * PASSWORD_CHANGED informs us when a user changes their password from the settings page
  * NO_WEBRTC informs us when a users browser does not support WebRTC at all via a crude test which never actually runs any WebRTC-based code
  * SUBSCRIPTION_BUTTON informs us when a user navigates to our paid account administration panel from their settings page
  * LOGOUT_EVERYWHERE informs us when a user executes the command to log out of their account on all remote devices from the settings page
* We've implemented the ability to configure which applications are available on a particular CryptPad instance via `cryptpad/customize/application_config.js`. Two arrays (`config.availablePadTypes` and `config.registeredOnlyTypes`) define which applications are available to everyone, and which applications are available to registered users. Due to a bug which was discovered, this behaviour is incorrect for our encrypted file viewer, and as a result encrypted files cannot currently be disabled. This will be addressed in our next release.

## Features

* Our rich text editor now displays other users' cursors when editing with a group. Preferences for this behaviour can be defined via the settings page.
* Links in our rich text editor can now be clicked more easily, as a small tooltip with a clickable link will be displayed above the editable link in the document.
* Users who wish to be notified of spelling errors in their rich text pads can enable spellcheck via the settings page.
* As noted above, various pad types can be disabled by instance administrators via `customize/application_config.js`.
* We've enabled a feature in the settings page which will migrate users' CryptDrive from our legacy format to our latest format (which supports automatic deletion). Only users with accounts dating back to version 1.29.0 will notice any difference.
* We've worked to improve some usability issues presented by the interaction of _owned files_ and _shared folders_. Since only the owner of an owned document can delete it the owner must keep a record of that document in their CryptDrive even if they place it in a shared folder (where someone else could delete it while they are offline). As such, owned documents were always copied to shared folders instead of being moved, and this proliferation of copies made it more difficult for users to organize their CryptDrives. Duplicated owned documents which are kept in your CryptDrive can now be hidden via the settings page. If those files are removed from a shared folder by another user, the hidden duplicate will be revealed in the root of your CryptDrive's tree.
* Finally, we've implemented the ability to copy documents to multiple shared folders via an entry in the right-click menu for any such document.

## Bugfixes

* We've improved the styles for displaying other users' cursors in the code and slide editors to avoid moving your view of the text when someone else highlights it.
* We've also changed some of the logic for how often other users' cursors are updated and displayed, so as to maximize the accuracy of their position and not show incorrect placements while you are typing.
* We fixed a bug which caused errors while loading your CryptDrive after a shared folder had been deleted.

# Opossum release (v2.14.0)

## Goals

For this release we chose to focus on our in-pad chat functionality and the ability to show your cursor's position to other users in the same pad.

## Update notes

* We've released an updated version of a serverside dependency: `chainpad-server`
  * this addresses a recently introduced bug which is capable of sending more history than clients require under certain circumstances
  * to use this updated dependency, run `npm update` and restart your server

## Features

* Our code editor is now capable of displaying other user's cursors within your view of the document.
  * this is enabled by default, but you can choose not to share your own cursor, and to disable the display of other users' cursors in your document
  * your initial color is chosen randomly, but you can choose any color you like within the settings page alongside the other configuration options for cursors
* After some consideration, we have chosen to change the permissions around the chat functionality embedded within every pad.
  * previously we had allowed viewers to participate in chat, even though they could not change the document.
  * we decided that this was counter-intuitive
  * in the event of an XSS vulnerability it could be used as a vector for privilege escalation
  * as such, we have modified our embedded chat functionality to only allow editors to participate
  * this change is not backwards-compatible, and so the embedded chat boxes will have dropped their older history
    * our assumption is that this will be an improvement for the majority of our users, and that it's fairly safe to drop older history given that chat is a relatively new feature
    * if this has affected you in an adverse way, the information is still accessible, and you can contact us if you need a way to recover that information
* Finally, it is now possible to print the rendered markdown content in our code editor, thanks to a contribution from [@joldie](https://github.com/joldie)

# Numbat release (v2.13.0)

## Goals

This release features long-awaited improvements to our Rich Text Pad.
This work was done over a short period, and we're releasing it now so that users can take advantage of the improvements as soon as possible.

## Update notes

* We've fixed a bug related to chat via an update to our messaging server. To install the update, run `npm update`. This server improvement is backwards compatible, so you can update your clientside or serverside dependencies in either order. Restart your server for the changes to take effect.
* You can run `bower update` in order to take advantage of the latest clientside dependencies. Depending on when you last updated you may benefit from updates to Codemirror or some other clientside libraries.

## Features

* We've refactored a great deal of CryptPad's Remote Procedure Call mechanisms related to chat. This should simplify CryptPad and make potential bugs less likely to occur.

## Bugfixes

* The behaviour of the cursor in our rich text editor has been greatly improved. Your experience when collaboratively editing should be noticeably better.
* Characters inserted into rich text pads were sometimes dropped due to a race condition between CKEditor and ChainPad, but this asynchronous behaviour has been resolved. As such the editor should be much more reliable.
* Deleting chat history from the server now removes it from your chat interface and that of remote messengers, where it previously would require a reload of the interface to see the correct chat history.
* We now correctly set owners of a shared chat channel such that either chat participant in a one-to-one room can delete the history.
* If you request history with a `lastKnownHash` which is not in the history, the server informs you that it is not there via a direct message. Clients fall back to a classic full retreival of the history. Previously this would fail, and print a message to the server's stdout.
* Firefox users may have noticed that when they clicked the dropdown menus for styles in the CKEditor toolbar, their scrollbar would jump to the top of the document. Their scroll position is now preserved in cases where it would previously have been disrupted.

# Manatee release (v2.12.0)

## Goals

For this release we aimed to address usability concerns in our Rich Text Pad, since it's our most widely used application. During this time we also received an unexpected security disclusure which we treated as being top priority.

## Update notes

* This release addresses an XSS vulnerability in our chat interface which was discovered thanks to [cyberpunky](https://twitter.com/cyberpunkych). In older versions of CryptPad, only the /contacts/ app was affected. In newer versions which feature the embedded chat interface in pads, it is possible to leverage this vulnerability against other users in the same pad. Due to our [Sandboxed iframe technique](https://blog.cryptpad.fr/2017/08/30/CryptPad-s-new-Secure-Cross-Domain-Iframe/), this vulnerability does not permit an attacker to compromise concurrent editor's accounts, as their user keys are never accessible within the scope of the domain which was subject to exploitation. However, since the chat functionality is available to viewers as well as editors, it could be leveraged to gain access to the keys which permit modification of the document. Despite this limitation, creative attackers could leverage the front-end code to perform phishing attacks, or other forms of social engineering to trick users into handing over their credentials.  We recommend that administrators of affected CryptPad instances upgrade to this version as soon as possible. Once more, we'd like to thank _cyberpunky_ for their effort to discover the issue, and for reporting the issue to us in private so that we could fix it without putting our users at risk.
* On a lighter note, this release features a server-side dependency update which fixes a non-critical bug in our websocket protocol. New users joining a channel which had never been vacated by all its users since its creation would receive the full history instead of only the latest state. To deploy the fix, run `npm update` and restart your server.

## Bugfixes

* As noted above, this release fixes an XSS vulnerability.
* We realized that each shared-folder in your CryptDrive was using a separate websocket connection to the server instead of routing over the existing websocket connection. This has been fixed.
* We've improved our _cursor-recovery script_ in the Rich Text Pad app to make it more resilient. In cases where the text changed in two places within one node of the document, your cursor could be displaced. It should behave more predictably now.
* Another problem in the Rich Text Pad app could lead to conflicts between users when one reverted the change of another. Conflicts should now resolve in a predictable fashion.
* If you were using the Rich Text Pad in its reduced-width mode (available via your /settings/ page), it was possible to scroll down beyond the white, paper-like styles of the document into an un-styled area of the page. This has been addressed.
* We discovered that the export functionality for Rich Text Pads was not working due to a semantic difference in a conditional test in Chrome. Export within Chrome should work once more, however, there are [serious privacy risks within Chrome/Chromium](https://reddit.com/r/ProtonMail/comments/9yl94k/never_connect_to_protonmail_using_chrome/) and we recommend that you consider using a more privacy-friendly browser.

## What's new

* The home page now features a badge advertising the fact that CryptPad is now a winner of the NGI award for _Privacy and Trust-enhanced technologies_. You can follow the link to our blog post which contains more information.
* It is now possible to directly download uploaded files from your CryptDrive without opening a new tab, making your content available more quickly.

# Lemur release (v2.11.0)

## Goals

This release continued the work on better customization features for community instances. We also worked on usability improvements and UI issues.

## Update notes

* This is a simple release. Just download the latest commits and update your cache-busting string.
* Customized instances may require additionnal changes in order to make customization easier to maintain in the future.
  * The static pages content (home page, FAQ, contact, privacy, etc.) has been moved from `./customize.dist/pages.js` to a `./customize.dist/pages/` directory, containing one file per page. This new structure allows administrators to override only some pages instead of all the pages at once.
  * To override a page, just make a copy of its .js file from `./customize.dist/pages` to a `./customize/pages` and make your changes.

## Features

* We've replaced our Font Awesome application icons with new custom icons. The new icons should be closer to the goals of the apps.
* We've cancelled the Ctrl+S shortcut from the browser for saving the page. In CryptPad, the result of the browser save was not usable and the content of the pads is automatically saved.
* As explained above, we've made it easier to customize some specific static pages instead of overriding all of them.
* Our Markdown renderer should display tables in a nicer and cleaner way (*Code* and *Slide* applications).
* The font size in the code and slide editors can now be changed from the *Settings* page.
* We've added a warning text to the CryptDrive export feature from the last release.

## Bugfixes

* We've found an issue causing some deleted characters to be inserted back in the document. It could happen when a least one member of the session had the tab not focused in their browser.
* We've fixed an issue with our code for detecting small (or zoomed) screens in several part of our UI. This will hide some unnecessary elements of the interface at first load and free space for the actual content of the pad.
* The "present" mode in the Slide application will no longer display the toolbar.
* We've fixed an issue in the *Pad* application where the font could be reset to Arial when making a new paragraph.
* The full CryptDrive export no longer stops when trying to export a very old poll.

# Koala release (v2.10.0)

## Goals

This release continued to improve our _shared folder_ functionality, addressed user concerns about data portability, and implemented various features for customization for different CryptPad instances.

## Update notes

* This release features updates to client-side dependencies. Run `bower update` to update the following:
  * netflux-websocket
  * chainpad-netflux
* we've added a new field (`fileHost`) in `config.example.js`. It informs clientside code what domain they should use when fetching encrypted blobs.
* Administrators can now do more to customize their CryptPad server, most notably via the ability to override specific translations. For example, the home page now features a short message which, by default, says that the server is a community-hosted instance of the CryptPad open-source project. On CryptPad.fr, we have replaced this text to talk about our organization. You can do the same by modifying files in `cryptpad/customize/translations/`, like so:

```
define(['/common/translations/messages.js'], function (Messages) {
    // Replace the existing keys in your copied file here:
    Messages.home_host = "CryptPad.fr is the official instance of the open-source CryptPad project. It is administered by XWiki SAS, the employee-owned French company which created and maintains the product.";

    return Messages;
});
```

Simply change the text assigned to `home_host` with a blurb about your own organization. We'll update the wiki soon with more info about customization.

### Features

* We've updated our features page to indicate what users get by purchasing a premium account. You can visit our accounts page directly from this list with the click of a button.
* We've updated our home page to explain more about what CryptPad is.
* As mentioned above, we've made all of our translation files overrideable.
* We've made it easier to get your data out of CryptPad, by implementing a complete export of your CryptDrive's content as a zip file. This feature is available on the _settings page_.
* Shared folders now support password protection.

### Bugfixes

* We fixed an issue which affected users of our Kanban application, which caused the color picker to pop up and get in the way at inopportune moments.
* We found that when a CryptPad code editor tab finished loading in the background, when it was focused, the markdown preview pane would be blank. We've added a check to try to re-draw the pane in these circumstances.
* We noticed that anonymous users who used our in-pad chat app could not be distinguished when they both chatted at once. We now add a string at the end of their name which makes it possible to distinguish them.
* We've updated an internal library (cryptget) such that it correctly tears down realtime sessions after connecting and loading content from the server.
  * We also added better error handling.
* At some point in the last few releases we broke export of media-tags in rich text pads. They should be back to normal now.
* Media-Tags also use the configurable value `fileHost` to construct absolute URLs, instead of using relative URLs to the server.
* Tall dropdown menus no longer use scrollbars when they are displayed with enough space to display all options.
* Chrome browser seemed to display our rich text editor correctly, except that no cursor was visible in empty documents. Users will now be able to see where their cursor is placed.
* It was possible for disconnected users' browsers to enter a bad state after reconnecting. This resulted in that pad being inaccessible until they relaunched their browser. This bad state is now detected and mitigated.
* Tags for documents in the CryptDrive were stopped functioning correctly as of the last few releases. This release fixes this bug.

# Jerboa release (v2.9.0)

## Goals

Since last release introduced several big features, this release was allocated towards usability improvements largely related to those new features.

## Update notes

This is a simple release. Just deploy the latest source.

### Features

* At a user's request, we now highlight annotated code blocks according to their language's syntax
* Shared folders can now be viewed by unregistered users (in read-only mode)
* The authentication process that we use for handling accounts has been improved so as to tolerate very slow networks more effectively
* The chat system embedded within pads can now optionally use the browser's system notifications API

### Bugfixes

* We found and fixed a race condition when initializing two tabs at once, which could leave one of the tabs in a broken state

# Ibis release (v2.8.0)

## Goals

We've been making use of some hidden features for a while, to make sure that they were safe to deploy.
This release, we worked on making _contextual chat_ and _shared folders_ available to everyone.

## Update notes

* run `bower update` to download an updated version of _marked.js_

### Features

* Our kanban application now features a much more consistent and flexible colorpicker, thanks to @MTRNord (https://github.com/MTRNord)
* File upload dialogs now allow you to upload multiple files at once
* Updated German translations thanks to [b3yond](https://github.com/b3yond/)
* An explicit pad storage policy to better suit different privacy constraints
  * _import local pads_ at login time is no longer default
* An embedded chat room in every pad, so you can work alongside your fellow editors more easily
* Promotion of our [crowdfunding campaign](https://opencollective.com/cryptpad), including a button on the home page, and a one-time dialog for users

### Bug fixes

* Updating our markdown library resolved an issue which incorrectly rendered links containing parentheses.
* We discovered an issue logging in with _very old_ credentials which were initialized without a public key. We now regenerate your keyring if you do not have public keys stored in association with your account.
* We found another bug in our login process; under certain conditions the terminating function could be called more than once.

# Hedgehog release (v2.7.0)

## Goals

This release overlapped with the publication and presentation of a paper written about CryptPad's architecture.
As such, we didn't plan for any very ambitious new features, and instead focused on bug fixes and some new workflows.

## Update notes

This is a fairly simple release. Just download the latest commits and update your cache-busting string.

### Features

* In order to address some privacy concerns, we've changed CryptPad such that pads are not immediately stored in your CryptDrive as soon as you open them. Instead, users are presented with a prompt in the bottom-right corner which asks them whether they'd like to store it manually. Alternatively, you can use your settings page to revert to the old automatic behaviour, or choose not to store, and to never be asked.
* It was brought to our attention that it was possible to upload base64-encoded images in the rich text editor. These images had a negative performance impact on such pads. From now on, if these images are detected in a pad, users are prompted to run a migration to convert them to uploaded (and encrypted) files.
* We've added a progress bar which is displayed while you are loading a pad, as we found that it was not very clear whether large pads were loading, or if they had become unresponsive due to a bug.
* We've added an option to allow users to right-click uploaded files wherever they appear, and to store that file in their CryptDrive.
* We've improved the dialog which is used to modify the properties of encrypted media embedded within rich text pads.

### Bug fixes

* Due to a particularly disastrous bug in Chrome 68 which was unfortunately beyond our power to fix, we've added a warning for anyone affected by that bug to let them know the cause.
* We've increased the module loading timeout value used by requirejs in our sharedWorker implementation to match the value used by the rest of CryptPad.

# Gibbon release (v2.6.0)

## Goals

For this release we focused on deploying two very large changes in CryptPad.
For one, we'd worked on a large refactoring of the system we use to compile CSS from LESS, so as to make it more efficient.
Secondly, we reworked the architecture we use for implementing the CryptDrive functionality, so as to integrate support for shared folders.

## Update notes

To test the _shared folders_ functionality, users can run the following command in their browser console:

`localStorage.CryptPad_SF = "1";`

Alternatively, if the instance administrator would like to enable shared folders for all users, they can do so via their `/customize/application_config.js` file, by adding the following line:

`config.disableSharedFolders = true;`

### Features

* As mentioned in the _goals_ for this release, we've merged in the work done to drastically improve performance when compiling styles. The system features documentation for anyone interested in understanding how it works.
* We've refactored the APIs used to interact with your CryptDrive, implementing a single interface with which applications can interact, which then manages any number of sub-objects each representing a shared folder. Shared folders are still disabled by default. See the _Update notes_ section for more information.
* The home page now features the same footer which has been displayed on all other information pages until now.
* We've added a slightly nicer spinner icon on loading pages.
* We've created a custom font _cp-tools_ for our custom-designed icons

### Bug fixes

* We've accepted a pull request implementing serverside support for moving files across different drives, for system administrators hosting CryptPad on systems which segregate folders on different partitions.
* We've addressed a report of an edge case in CryptPad's user password change logic which could cause users to delete their accounts.

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
