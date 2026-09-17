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

export CRYPTPAD_CONFIG=$CPAD_CONF
export CRYPTPAD_CONFIG_INFRA=$CPAD_CONF_INFRA

cd $CPAD_HOME

if [ "$CPAD_INSTALL_ONLYOFFICE" == "yes" ] || [ "$CPAD_INSTALL_OFFICE" == "yes" ]; then
	./install-office.sh --accept-license --trust-repository
fi

exec "$@"
