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

cd $CPAD_HOME

if [ "$CPAD_INSTALL_ONLYOFFICE" == "yes" ]; then
	./install-onlyoffice.sh --accept-license --trust-repository
fi

npm run build

exec "$@"
