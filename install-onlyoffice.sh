#!/usr/bin/env bash

set -euxo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
BUILDS_DIR=$SCRIPT_DIR/onlyoffice-builds.git
OO_DIR=$SCRIPT_DIR/www/common/onlyoffice/dist

main () {
	parse_arguments "$@"
	validate_arguments

	mkdir -p "$OO_DIR"
	install_version v1 4f370beb
	install_version v2b d9da72fd
	install_version v4 6ebc6938
	install_version v5 88a356f0
	install_version v6 abd8a309
	install_version v7 9d8b914a

	if [ ${CLEAR+x} ]; then
		rm -rf "$BUILDS_DIR"
	fi

	if [ ${MAKE_LINKS+x} ]; then
		rdfind -makehardlinks true -makeresultsfile false $OO_DIR/v*
	fi
}

parse_arguments () {
	while [[ $# -gt 0 ]]; do
		case $1 in
			-h|--help)
				show_help
				shift
				;;
			-c|--clear)
				CLEAR="1"
				shift
				;;
			-l|--make-links)
				MAKE_LINKS="1"
				shift
				;;
			*)
				show_help
				shift
				;;
		esac
	done 
}

validate_arguments () {
	if [ ${MAKE_LINKS+x} ]; then
		if [ -z ${CLEAR+x} ]; then
			echo "--make-links has to be combined with --clear"
			exit 1
		fi

		if ! command -v rdfind &> /dev/null; then
			echo "rdfind has to be installed for --make-links"
			exit 1
		fi
	fi
}

show_help () {
	cat << EOF
install-onlyoffice installs or upgrades OnlyOffice.

OPTIONS:
    -h, --help
            Show this help.

    -c, --clear
            Safe ~300MB of disk space. However, the next run of
            install-onlyoffice will have to download OnlyOffice again.

    -l, --make-links
            This argument has to be combined with --clear. It will
            replace duplicate files with hard links. This will save
            another ~650MB. The command rdfind has to be installed.
EOF
	exit 1
}

ensure_commit_exists () {
	if [ -d "$BUILDS_DIR" ]; then
		local LAST_DIR
		LAST_DIR=$(pwd)
		cd "$BUILDS_DIR"
		if ! git cat-file -e "$1"; then
			git fetch
		fi
		cd "$LAST_DIR"
		return
	fi
	
	git clone --bare git@github.com:cryptpad/onlyoffice-builds.git "$BUILDS_DIR"  # TODO use https here, when repo is public
}

install_version () {
	local DIR=$1
	local COMMIT=$2
	local FULL_DIR=$OO_DIR/$DIR
	local LAST_DIR
	LAST_DIR=$(pwd)

	if [ ! -e "$FULL_DIR"/.commit ]; then
		if [ "$(cat "$FULL_DIR"/.commit)" != "$COMMIT" ]; then
			ensure_commit_exists "$COMMIT"

			if [ ! -e "$FULL_DIR"/.git ]; then
				rm -rf "$FULL_DIR"
			fi
			
			if [ -d "$FULL_DIR" ]; then
				cd "$FULL_DIR"
				git checkout "$COMMIT"
			else
				cd "$BUILDS_DIR"
				git worktree add "$FULL_DIR" "$COMMIT"
			fi

			cd "$LAST_DIR"

			echo "$COMMIT" > "$FULL_DIR"/.commit
		fi
	fi

	if [ ${CLEAR+x} ]; then
		rm -f "$FULL_DIR"/.git
	fi
}

main "$@"
