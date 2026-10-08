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

if [ ! -f "$/cryptpad/config/config.js" ]; then
    echo -e "\n\
         #################################################################### \n\
         Warning: No config file provided for cryptpad \n\
         We will create a basic one for now but you should rerun this service \n\
         by providing a file with your settings \n\
         #################################################################### \n"

    cp "$CPAD_HOME"/config/config.example.js "$CPAD_HOME"/config/config.js
fi

if [ ! -f "$/cryptpad/config/infra.js" ]; then
    echo -e "\n\
         #################################################################### \n\
         Warning: No infra config file provided for cryptpad \n\
         We will create a basic one for now but you should rerun this service \n\
         by providing a file with your settings \n\
         #################################################################### \n"

    cp "$CPAD_HOME"/config/infra.example.js "$CPAD_HOME"/config/infra.js
fi

cd $CPAD_HOME

if [ "$CPAD_INSTALL_ONLYOFFICE" == "yes" ] || [ "$CPAD_INSTALL_OFFICE" == "yes" ]; then
	./install-office.sh --accept-license --trust-repository
fi

npm run build

exec "$@"
