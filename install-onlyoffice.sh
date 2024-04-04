#!/usr/bin/env bash

# SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
#
# SPDX-License-Identifier: AGPL-3.0-or-later

set -euo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
CONF_DIR=$SCRIPT_DIR/onlyoffice-conf
BUILDS_DIR=$CONF_DIR/onlyoffice-builds.git
OO_DIR=$SCRIPT_DIR/www/common/onlyoffice/dist
PROPS_FILE="$CONF_DIR"/onlyoffice.properties

declare -A PROPS

main () {
	mkdir -p "$CONF_DIR"

	load_props

	parse_arguments "$@"

	ask_for_license

	# Remeber the 1st version that is installed. This will help us install only
	# needed OnlyOffice versions in a later version of this script.
	set_prop oldest_needed_version v1

	mkdir -p "$OO_DIR"
	install_version v1 4f370beb
	install_version v2b d9da72fd
	install_version v4 6ebc6938
	install_version v5 88a356f0
	install_version v6 abd8a309
	install_version v7 9d8b914a

	rm -rf "$BUILDS_DIR"
	if command -v rdfind &> /dev/null; then
		rdfind -makehardlinks true -makeresultsfile false $OO_DIR/v*
	fi
}

load_props () {
	if [ -e "$PROPS_FILE" ]; then
		while IFS='=' read -r key value; do
			PROPS["$key"]="$value"
		done < "$PROPS_FILE"
	fi
}

set_prop () {
	PROPS["$1"]="$2"

	for i in "${!PROPS[@]}"; do
		echo "$i=${PROPS[$i]}"
	done > "$PROPS_FILE"
}

parse_arguments () {
	while [[ $# -gt 0 ]]; do
		case $1 in
			-h|--help)
				show_help
				shift
				;;
			-a|--accept-license)
				ACCEPT_LICENSE="1"
				shift
				;;
			*)
				show_help
				shift
				;;
		esac
	done 
}

ask_for_license () {
	if [ ${ACCEPT_LICENSE+x} ] || [ "${PROPS[agree_license]:-no}" == yes ]; then
		return
	fi

	ensure_command_available curl

	(echo -e "Please review the license of OnlyOffice:\n\n" ; curl https://raw.githubusercontent.com/ONLYOFFICE/web-apps/master/LICENSE.txt 2>/dev/null) | less

	read -rp "Do you accept the license? (Y/N): " confirm \
		&& [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]] || exit 1

	set_prop "agree_license" yes
}

show_help () {
	cat << EOF
install-onlyoffice installs or upgrades OnlyOffice.

NOTE: When you have rdfind installed, it will be used to save ~650MB of disk
space.

OPTIONS:
    -h, --help
            Show this help.

    -a, --accept-license
            Accept the license of OnlyOffice and do not ask when running this
            script. Read and accept this before using this option:
            https://github.com/ONLYOFFICE/web-apps/blob/master/LICENSE.txt
EOF
	exit 1
}

ensure_oo_is_downloaded () {
	ensure_command_available git

	if ! [ -d "$BUILDS_DIR" ]; then
		echo "Downloading OnlyOffice..."
		git clone --bare https://github.com/cryptpad/onlyoffice-builds.git "$BUILDS_DIR"
	fi
}

install_version () {
	local DIR=$1
	local COMMIT=$2
	local FULL_DIR=$OO_DIR/$DIR
	local LAST_DIR
	LAST_DIR=$(pwd)

	if [ ! -e "$FULL_DIR"/.commit ] || [ "$(cat "$FULL_DIR"/.commit)" != "$COMMIT" ]; then
		ensure_oo_is_downloaded

		rm -rf "$FULL_DIR"

		cd "$BUILDS_DIR"
		git worktree add "$FULL_DIR" "$COMMIT"

		cd "$LAST_DIR"

		echo "$COMMIT" > "$FULL_DIR"/.commit

		echo "$DIR updated"
	else
		echo "$DIR was up to date"
	fi


	if [ ${CLEAR+x} ]; then
		rm -f "$FULL_DIR"/.git
	fi
}

ensure_command_available () {
	if ! command -v "$1" &> /dev/null; then
		echo "$1 needs to be installed to run this script"
		exit 1
	fi
}

main "$@"
