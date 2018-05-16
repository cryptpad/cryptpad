# 1.29.0

**Goals**

For this release we wanted to direct our effort towards improving user experience issues surrounding user accounts.

**Update notes**

This release features breaking changes to some clientside dependencies. Administrators must make sure to deploy the
latest server with npm update before updating your clientside dependencies with bower update.

**What's new**

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

**Bug fixes**
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