<!--
SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

## CryptPad Server Architecture

CryptPad is designed to serve its content over two domains. Account passwords
and cryptographic content is handled on the 'main' domain, while the user
interface is loaded on a 'sandbox' domain which can only access information
which the main domain willingly shares.

In the event of an XSS vulnerability in the UI (that's bad) this system prevents
attackers from gaining access to your account (that's good).

Most problems with new instances are related to this system blocking access
because of incorrectly configured sandboxes. If you only see a white screen when
you try to load CryptPad, this is probably the cause.

## CryptPad Configuration

This folder contains the configuration files for CryptPad.

It shows examples files you will need to configure CryptPad:

- `config.example.js`
  - The base configuration file for your instance for a service administrator
    point of view.
- `infra.example.js`

### `config.js`

- Sessions
  - `otpSessionExpiration`: in hours, default: 7 days.
    - Accounts can be protected with an **OTP** (One Time Password) system to
      add a second authentication layer. Such accounts use a session with a
      given lifetime after which they are logged out and need to be
      re-authenticated. You can configure the lifetime of these sessions here.
  - `enforceMFA`: to enforce multifactor authentication for all users. It can
    also be set up in the admin panel. Default to false.
- Privacy
  - `logIp`: default: false
    - Depending on where your instance is hosted, you may be required to log IP
      addresses of the users who make a change to a document. This setting
      allows you to do so. You can configure the logging system below in this
      config file. Setting this value to true will include a log for each
      websocket connection including this connection's unique ID, the user
      public key and the IP.
    - **NOTE:** this option requires a log level of "info" or below.
- Administration
  - `adminKeys`: default `[]`
    - CryptPad contains an administration panel. Its access is restricted to
      specific users using the following list and the management interface on
      the instance. To give access to the admin panel to a user account, just
      add their public signing key, which can be found on the settings page for
      registered users.  
      Access can be revoked directly from the interface, unless you added the
      key in this parameter.  
      Entries should be strings separated by a comma. Example:
    ```js
    adminKeys: [
      "[cryptpad-user1@my.awesome.website/YZgXQxKR0Rcb6r6CmxHPdAGLVludrAF2lEnkbx1vVOo=]",
      "[cryptpad-user2@my.awesome.website/jA-9c5iNuG7SyxzGCjwJXVnk5NPfAOO8fQuQ0dC83RE=]",
    ];
    ```
- Storage
  - `inactiveTime`: default: 90 days
    - Pads that are not '_pinned_' by any registered user can be set to expire
      after a configurable number of days of inactivity. The value can be
      changed or set to false to remove expiration. Expired pads can then be
      removed using a cron job calling the `evict-inactive.js` script with node
  - `archiveRetentionTime`: default 15 days
    - CryptPad archives some data instead of deleting it outright. This archived
      data still takes up space and so you'll probably still want to remove
      these files after a brief period. `cryptpad/scripts/evict-archived.js` is
      intended to be run daily from a crontab or similar scheduling service. The
      intent with this feature is to provide a safety net in case of accidental
      deletion. Set this value to the number of days you'd like to retain
      archived data before it's removed permanently.
  - `accountRetentionTime`: default: infinite
    - It's possible to configure your instance to remove data stored on behalf
      of inactive accounts. Set 'accountRetentionTime' to the number of days an
      account can remain idle before its documents and other account data is
      removed. Leave this value commented out to preserve all data stored by
      user accounts regardless of inactivity.
  - `disableIntegratedEviction`: default: false
    - The server automatically runs the script responsible for removing inactive
      data according to your configured definition of inactivity. Set this value
      to `true` if you prefer not to remove inactive data, or if you prefer to
      do so manually using `scripts/evict-inactive.js`.
  - `maxUploadSize`: default: 20 MB
    - Max Upload Size (bytes) this sets the maximum size of any one file
      uploaded to the server. Anything larger than this size will be rejected
      defaults to 20MB if no value is provided
  - `premiumUploadSize`: default: same as maxUploadSize
    - Users with premium accounts (those with a plan included in their
      customLimit) can benefit from an increased upload size limit.
- Database volumes
  - `filePath`
    - CryptPad stores each document in an individual file on your hard drive.
      Specify a directory where files should be stored. It will be created
      automatically if it does not already exist.
  - `archivePath`
    - CryptPad offers the ability to archive data for a configurable period
      before deleting it, allowing a means of recovering data in the event that
      it was deleted accidentally. To set the location of this archive directory
      to a custom value, change the path below:
  - `pinPath`
    - CryptPad allows logged-in users to request that the server store
      particular documents indefinitely. This is called 'pinning'. Pin requests
      are stored in a pin-store. The location of this store is defined here.
  - `taskPath`
    - Custom location for the list of scheduled tasks
  - `blockPath`
    - Custom location for users' authenticated blocks
  - `blobPath`
    - Custom location for uploaded encrypted files.
  - `blobStagingPath`
    - CryptPad stores incomplete blobs in a "_staging_" area until they are
      fully uploaded.
  - `decreePath`
    - Custom location for decrees (an append-only database for server-wide
      instruction, it is be used to change the color of the instance or to add
      new administrators or moderators for instance)
  - `logPath`
    - Custom location for logs written in the disk. They are stored in a
      directory per year and per month.
- Debugging/Logs
  - `logToStdout`: default: false
    - To write in the console as well what is logged by CryptPad (following the
      server configuration). It may be useful for developping/debugging.
  - `logLevel`: default: 'info'
    - CryptPad can be configured to log more or less the various settings are
      listed below by order of importance
      - silly
      - verbose
      - debug
      - feedback
      - info
      - warn
      - error

      Choose the least important level of logging you wish to see. For example,
      a '`silly`' `logLevel` will display everything, while '`info`' will
      display '`info`', '`warn`', and '`error`' logs This will affect both
      logging to the console and the disk.

  - `logFeedback`: default: false
    - Clients can use the `/settings/` app to opt out of usage feedback which
      informs the server of things like how much each app is being used, and
      whether certain clientside features are supported by the client's browser.
      The intent is to provide feedback to the admin such that the service can
      be improved.  
      Enable this with `true` and ignore feedback with `false` or by commenting
      the attribute.  
      You will need to set your logLevel to include '`feedback`'. Set this to
      `false` if you'd like to exclude feedback from your logs.

- Extra
  - `installMethod`: default: 'unspecified'
    - If server telemetry is enabled, it is sent to the CryptPad team to
      voluntarily indicate the installation method (e.g., Docker).

### `infra.js`

- `public`
  - Contains the settings to access the server.
    - `origin`
      - The public URL of the instance (the client cannot be accessed from a
        different URL, it’s used for Content-Security-Policy)
    - `sandboxOrigin`
      - The URL of the sandbox domain
    - `httpHost`, `httpPort`, `httpSafePort`
      - The address and port of the Node.js http server. Those are the
        information than needs to be put in your reverse-proxy configuration if
        you are using one.
  - And optional values:
    - `externalWebsocketURL`, `fileHost`
      - API server URLs if hosted on a different domain
    - `httpServerId`
      - Only useful in multiserver case to specify which nodes run on a specific
        server (not implemented yet).

The following parameters define the internal server topology.

CryptPad server has several types of nodes running with different purpose:
`front`, `core`, `storage`, and `http`. `http` node is responsible for serving
the client and redirects `http` authenticated user commands to its destination,
it’s always running alone with the parameters specified above.

However, other types of nodes can be run in different numbers depending on the
load of the server for scalability. The default configuration spawns 2 nodes per
type and should be sufficient for most purpose. To change it, you can add or
remove configurations in the corresponding arrays. The specified information
corresponds to a (authenticated) websocket channel that the node uses for
intra-server communication.

Note that `front` also serves a `http` server that need to be put in your
reverse-proxy if you are using it to serve static content (see
[example-advanced.nginx.conf](../docs/example-advanced.nginx.conf)).

**Warning:** Overlaps in `host`/`port` lead to a server start failure.
