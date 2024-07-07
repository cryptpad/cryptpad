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

if [ ! -f "$CPAD_CONF" ]; then
    echo -e "\n\
         #################################################################### \n\
         Warning: No config file provided for cryptpad \n\
         We will create a basic one for now but you should rerun this service \n\
         by providing a file with your settings \n\
         eg: docker run -v /path/to/config.js:/cryptpad/config/config.js \n\
         #################################################################### \n"

    cp "$CPAD_HOME"/config/config.example.js "$CPAD_CONF"

    sed -i  -e "s@\(httpUnsafeOrigin:\).*[^,]@\1 '$CPAD_MAIN_DOMAIN'@" \
        -e "s@\(^ *\).*\(httpSafeOrigin:\).*[^,]@\1\2 '$CPAD_SANDBOX_DOMAIN'@" "$CPAD_CONF"
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
