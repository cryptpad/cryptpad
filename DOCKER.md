# Docker container for cryptpad

## Environments
Most of the environment variable are coming from the configuration file.
All configuration variable are not documented here but can be found in file
[config/config.example.js](config/config.example.js).

Most of the configurable parameters are represented with the environments:
- `CPAD_HTTP_UNSAFE_ORIGIN` (default: `http://localhost:3000`)
- `CPAD_HTTP_SAFE_ORIGIN` (default: same as `CPAD_HTTP_UNSAFE_ORIGIN`)
- `CPAD_HTTP_ADDRESS` (default: `0.0.0.0`)
- `CPAD_HTTP_PORT` (default: `3000`)
- `CPAD_HTTP_SAFE_PORT` (default: `CPAD_HTTP_PORT + 1`)
- `CPAD_WEBSOCKET_PORT` (default: `3003`)
- `CPAD_MAX_WORKERS` (default: `-1`)
- `CPAD_OTP_SESSION_EXPIRATION` (default: `168` in hour)
- `CPAD_ENFORCE_MFA` (default: `false`)
- `CPAD_LOG_IP` (default: `false`)
- `CPAD_ADMIN_KEYS` (default: `[]`)
- `CPAD_INACTIVE_TIME` (default: `90` in day)
- `CPAD_ARCHIVE_RETENTION_TIME` (default: `15` in day)
- `CPAD_ACCOUNT_RETENTION_TIME` (default: `-1`)
- `CPAD_DISABLE_INTEGRATED_EVICTION` (default: `false`)
- `CPAD_MAX_UPLOAD_SIZE` (default: `20971520` in byte)
- `CPAD_PREMIUM_UPLOAD_SIZE` (default: same as `CPAD_MAX_UPLOAD_SIZE`)
- `CPAD_FILE_PATH` (default: `/cryptpad/persistent/datastore/`)
- `CPAD_ARCHIVE_PATH` (default: `/cryptpad/persistent/data/archive`)
- `CPAD_PIN_PATH` (default: `/cryptpad/persistent/data/pins`)
- `CPAD_TASK_PATH` (default: `/cryptpad/persistent/data/tasks`)
- `CPAD_BLOCK_PATH` (default: `/cryptpad/persistent/block`)
- `CPAD_BLOB_PATH` (default: `/cryptpad/persistent/blob`)
- `CPAD_BLOB_STAGING_PATH` (default: `/cryptpad/persistent/data/blobstage`)
- `CPAD_DECREE_PATH` (default: `/cryptpad/persistent/data/decrees`)
- `CPAD_LOG_PATH` (default: `/cryptpad/persistent/data/logs`)
- `CPAD_LOG_TO_STDOUT` (default: `true`)
- `CPAD_LOG_LEVEL` (default: `info`)
- `CPAD_LOG_FEEDBACK` (default: `false`)
- `CPAD_VERBOSE` (default: `false`)
- `CPAD_INSTALL_METHOD` (default: `docker`)

## Plugin Environments
- `CPAD_PLUGIN_*`
    Allows to automatically download a plugin using git.
    For example
    ```
    CPAD_PLUGIN_SSO=https://github.com/cryptpad/sso.git|main
    ```
    Will:
    - Create the directory `sso`, which is the suffix of the environment in
      lowercase
    - Clone the SSO plugin from git URL in the `sso` directory
    - (Optional) checkout to the branch/commit/tag specified after the separator `|`

