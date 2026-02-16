#!/bin/bash

# SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
#
# SPDX-License-Identifier: AGPL-3.0-or-later

## Required vars
# CPAD_MAIN_DOMAIN
# CPAD_SANDBOX_DOMAIN
# CPAD_CONF

set -e

CPAD_HOME="/cryptpad"
PLUGIN_COMMIT_SEPARATOR='|'

if [ -z "$CPAD_CONF" ]; then
    CRYPTPAD_CONFIG="$CPAD_HOME/config/config.js"
    export CRYPTPAD_CONFIG
    cp "$CPAD_HOME/config/config.docker.js" "$CRYPTPAD_CONFIG"

    # Use env variable or default if absent
    : ${CPAD_HTTP_UNSAFE_ORIGIN:="https://your-main-domain.com"}
    : ${CPAD_HTTP_SAFE_ORIGIN:="https://your-sandbox-domain.com"}
    : ${CPAD_HTTP_ADDRESS:="0.0.0.0"}
    : ${CPAD_HTTP_PORT:=3000}
    : ${CPAD_HTTP_SAFE_PORT:=$(( $CPAD_HTTP_PORT + 1 ))}
    : ${CPAD_WEBSOCKET_PORT:=3003}
    : ${CPAD_MAX_WORKERS:=-1}
    : ${CPAD_OTP_SESSION_EXPIRATION:=$(( 7 * 24))}
    : ${CPAD_ENFORCE_MFA:=false}
    : ${CPAD_LOG_IP:=false}
    : ${CPAD_ADMIN_KEYS:="[]"}
    : ${CPAD_INACTIVE_TIME:=90}
    : ${CPAD_ARCHIVE_RETENTION_TIME:=15}
    : ${CPAD_ACCOUNT_RETENTION_TIME:=-1}
    : ${CPAD_DISABLE_INTEGRATED_EVICTION:=false}
    : ${CPAD_MAX_UPLOAD_SIZE:=$(( 20 * 1024 * 1024 ))}
    : ${CPAD_PREMIUM_UPLOAD_SIZE:=$CPAD_MAX_UPLOAD_SIZE}
    : ${CPAD_FILE_PATH:="$CPAD_HOME/persistent/datastore/"}
    : ${CPAD_ARCHIVE_PATH:="$CPAD_HOME/persistent/data/archive"}
    : ${CPAD_PIN_PATH:="$CPAD_HOME/persistent/data/pins"}
    : ${CPAD_TASK_PATH:="$CPAD_HOME/persistent/data/tasks"}
    : ${CPAD_BLOCK_PATH:="$CPAD_HOME/persistent/block"}
    : ${CPAD_BLOB_PATH:="$CPAD_HOME/persistent/blob"}
    : ${CPAD_BLOB_STAGING_PATH:="$CPAD_HOME/persistent/data/blobstage"}
    : ${CPAD_DECREE_PATH:="$CPAD_HOME/persistent/data/decrees"}
    : ${CPAD_LOG_PATH:="$CPAD_HOME/persistent/data/logs"}
    : ${CPAD_LOG_TO_STDOUT:=true}
    : ${CPAD_LOG_LEVEL:="info"}
    : ${CPAD_LOG_FEEDBACK:=false}
    : ${CPAD_VERBOSE:=false}
    : ${CPAD_INSTALL_METHOD:="docker"}

    set -x
    # Change configuration file
    sed -i -E "
        s@(httpUnsafeOrigin:) .*,@\1 '${CPAD_HTTP_UNSAFE_ORIGIN}',@
        s@(httpSafeOrigin:) .*,@\1 '${CPAD_HTTP_SAFE_ORIGIN}',@
        s@(httpAddress:) .*,@\1 '${CPAD_HTTP_ADDRESS}',@
        s@(httpPort:) .*,@\1 ${CPAD_HTTP_PORT},@
        s@(httpSafePort:) .*,@\1 ${CPAD_HTTP_SAFE_PORT},@
        s@(websocketPort:) .*,@\1 ${CPAD_WEBSOCKET_PORT},@
        s@(maxWorkers:) .*,@\1 ${CPAD_MAX_WORKERS},@
        s@(otpSessionExpiration:) .*,@\1 ${CPAD_OTP_SESSION_EXPIRATION},@
        s@(enforceMFA:) .*,@\1 ${CPAD_ENFORCE_MFA},@
        s@(logIP:) .*,@\1 ${CPAD_LOG_IP},@
        s@(adminKeys:) .*,@\1 ${CPAD_ADMIN_KEYS},@
        s@(inactiveTime:) .*,@\1 ${CPAD_INACTIVE_TIME},@
        s@(archiveRetentionTime:) .*,@\1 ${CPAD_ARCHIVE_RETENTION_TIME},@
        s@(accountRetentionTime:) .*,@\1 ${CPAD_ACCOUNT_RETENTION_TIME},@
        s@(disableIntegratedEviction:) .*,@\1 ${CPAD_DISABLE_INTEGRATED_EVICTION},@
        s@(maxUploadSize:) .*,@\1 ${CPAD_MAX_UPLOAD_SIZE},@
        s@(premiumUploadSize:) .*,@\1 ${CPAD_PREMIUM_UPLOAD_SIZE},@
        s@(filePath:) .*,@\1 '${CPAD_FILE_PATH}',@
        s@(archivePath:) .*,@\1 '${CPAD_ARCHIVE_PATH}',@
        s@(pinPath:) .*,@\1 '${CPAD_PIN_PATH}',@
        s@(taskPath:) .*,@\1 '${CPAD_TASK_PATH}',@
        s@(blockPath:) .*,@\1 '${CPAD_BLOCK_PATH}',@
        s@(blobPath:) .*,@\1 '${CPAD_BLOB_PATH}',@
        s@(blobStagingPath:) .*,@\1 '${CPAD_BLOB_STAGING_PATH}',@
        s@(decreePath:) .*,@\1 '${CPAD_DECREE_PATH}',@
        s@(logPath:) .*,@\1 '${CPAD_LOG_PATH}',@
        s@(logToStdout:) .*,@\1 ${CPAD_LOG_TO_STDOUT},@
        s@(logLevel:) .*,@\1 '${CPAD_LOG_LEVEL}',@
        s@(logFeedback:) .*,@\1 ${CPAD_LOG_FEEDBACK},@
        s@(verbose:) .*,@\1 ${CPAD_VERBOSE},@
        s@(installMethod:) .*,@\1 '${CPAD_INSTALL_METHOD}',@" \
        "$CRYPTPAD_CONFIG"
else
    >&2 echo -e "\n\
         #################################################################### \n\
         Warning: You provided a config file path for cryptpad. \n\
         Support for the config file in docker is deprecated and might be
         deleted in a future release. You are encouraged to pass environment
         variables to the container for cryptpad's configuration.\n\
         All environment variables can be found in the github page:\n\
         https://github.com/cryptpad/cryptpad/blob/main/DOCKER.md\n
         This warning is triggered by the presence of the variable CPAD_CONF.
         #################################################################### \n"
fi

# Find all environment variable names starting with "CPAD_PLUGIN_"
PLUGIN_LIST=$(env | sed -n '/^CPAD_PLUGIN_/{s@=.*$@@g;p}')

for PLUGIN in $PLUGIN_LIST; do
    # Retrieve the plugin name from the end of the environment variable name
    PLUGIN_NAME=$(echo "$PLUGIN" | sed 's@^CPAD_PLUGIN_@@' | \
        tr '[:upper:]' '[:lower:]')

    # Plugins are stored in the lowercase suffix of their variable name.
    # Example: "CPAD_PLUGIN_SSO" will create the directory "sso"
    PLUGIN_PATH="$CPAD_HOME/lib/plugins/$PLUGIN_NAME"

    # Read the variable's value and split the git URL and the branch/tag
    IFS="$PLUGIN_COMMIT_SEPARATOR" read -ra PLUGIN_VALUES <<<"${!PLUGIN}"
    PLUGIN_URL="${PLUGIN_VALUES[0]}"
    PLUGIN_BRANCH_OR_TAG="${PLUGIN_VALUES[1]}"

    if [ ! -d "$PLUGIN_PATH" ]; then
        # The directory does not exist and need to be cloned
        git clone "$PLUGIN_URL" "$PLUGIN_PATH"
    else
        echo "Plugin $PLUGIN_NAME already present, not cloning it."
    fi

    # Change the working directory to the git path
    pushd "$PLUGIN_PATH"

    if [ -z "$PLUGIN_BRANCH_OR_TAG" ]; then
        # No branch was specified, using the default git branch
        DEFAULT_BRANCH=$(git remote show origin | sed -n '/HEAD branch/s@.*: @@p')
        PLUGIN_BRANCH_OR_TAG="$DEFAULT_BRANCH"
    fi

    # Retrieve the content and go to the commit/branch
    git fetch
    git checkout "$PLUGIN_BRANCH_OR_TAG"

    # Returns the number of branches matching the branch/commit/tags value
    # Should be 1 if a remote branch matches with the value
    IS_BRANCH=$(git branch -r | grep "origin/$PLUGIN_BRANCH_OR_TAG$" | wc -l)
    if [ "$IS_BRANCH" -gt 0 ]; then
        # Merge local branch with remote branch
        git merge
    fi

    # Rollback the working directory to the old path
    popd
done

cd $CPAD_HOME

if [ "$CPAD_INSTALL_ONLYOFFICE" == "yes" ]; then
	./install-onlyoffice.sh --accept-license --trust-repository
fi

npm run build

exec "$@"
