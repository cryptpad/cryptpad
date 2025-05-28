#!/usr/bin/env bash

# SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
#
# SPDX-License-Identifier: AGPL-3.0-or-later

set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
CONF_DIR=$SCRIPT_DIR/onlyoffice-conf
BUILDS_DIR=$CONF_DIR/onlyoffice-builds.git
OO_DIR=$SCRIPT_DIR/www/common/onlyoffice/dist
PROPS_FILE="$CONF_DIR"/onlyoffice.properties

declare -A PROPS

main() {

    # clean build env in case a previous build has failed
    rm -rf "$BUILDS_DIR"
    
    mkdir -p "$CONF_DIR"

    load_props

    parse_arguments "$@"

    ask_for_license

    # Remember the 1st version that is installed. This will help us install only
    # needed OnlyOffice versions in a later version of this script.
    set_prop oldest_needed_version v1

    mkdir -p "$OO_DIR"
    install_old_version v1 4f370beb
    install_old_version v2b d9da72fd
    install_old_version v4 6ebc6938
    install_old_version v5 88a356f0
    install_old_version v6 abd8a309
    install_version v7 v7.3.3.60+11 1e65be6dc87d97e82b4972f303956e5397b34d637ca80a4239c48e49ab829ee5afc8f5b1680b2fb14230d63ff872ec5f9b562bb6c3f1811316b68f8b436f7ee6
    install_version v8 v8.3.3.23+4 01abfb3e13dae2066c9fcdc9fd3a3a21cd08212feb7ee2f927d8acaa5c3e560f8ce7c78c533c6aad7048aaecc14f7445891f06cb38a1720e1637a971c0a02295
    install_x2t v7.3+1 ab0c05b0e4c81071acea83f0c6a8e75f5870c360ec4abc4af09105dd9b52264af9711ec0b7020e87095193ac9b6e20305e446f2321a541f743626a598e5318c1

    rm -rf "$BUILDS_DIR"

    if [ "${RDFIND+x}" != "x" ]; then
        if command -v rdfind &>/dev/null; then
            RDFIND="1"
        else
            RDFIND="0"
        fi
    fi

    if [ "$RDFIND" = "1" ]; then
        ensure_command_available rdfind
        rdfind -makehardlinks true -makeresultsfile false $OO_DIR/v*
    fi
}

load_props() {
    if [ -e "$PROPS_FILE" ]; then
        while IFS='=' read -r key value; do
            PROPS["$key"]="$value"
        done <"$PROPS_FILE"
    fi
}

set_prop() {
    PROPS["$1"]="$2"

    for i in "${!PROPS[@]}"; do
        echo "$i=${PROPS[$i]}"
    done >"$PROPS_FILE"
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
        -h | --help)
            show_help
            shift
            ;;
        -a | --accept-license)
            ACCEPT_LICENSE="1"
            shift
            ;;
        -t | --trust-repository)
            TRUST_REPOSITORY="1"
            shift
            ;;
        --check)
            CHECK="1"
            shift
            ;;
        --rdfind)
            RDFIND="1"
            shift
            ;;
        --no-rdfind)
            RDFIND="0"
            shift
            ;;
        *)
            show_help
            shift
            ;;
        esac
    done
}

ask_for_license() {
    if [ ${ACCEPT_LICENSE+x} ] || [ "${PROPS[agree_license]:-no}" == yes ]; then
        return
    fi

    ensure_command_available curl

    (
        echo -e "Please review the license of OnlyOffice:\n\n"
        curl https://raw.githubusercontent.com/ONLYOFFICE/web-apps/master/LICENSE.txt 2>/dev/null
    ) | less

    read -rp "Do you accept the license? (Y/N): " confirm &&
        [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]] || exit 1

    set_prop "agree_license" yes
}

show_help() {
    cat <<EOF
install-onlyoffice installs or upgrades OnlyOffice.

OPTIONS:
    -h, --help
            Show this help.

    -a, --accept-license
            Accept the license of OnlyOffice and do not ask when running this
            script. Read and accept this before using this option:
            https://github.com/ONLYOFFICE/web-apps/blob/master/LICENSE.txt

    -t, --trust-repository
            Automatically configure the cloned onlyoffice-builds repository
            as a safe.directory.
            https://git-scm.com/docs/git-config/#Documentation/git-config.txt-safedirectory

    --check
            Do not install OnlyOffice, only check if the existing installation
            is up to date. Exits 0 if it is up to date, nonzero otherwise.

    --rdfind
            Run rdfind to save ~650MB of disk space.
            If neither '--rdfind' nor '--no-rdfind' is specified, then rdfind
            will only run if rdfind is installed.

    --no-rdfind
            Do not run rdfind, even if it is installed.

EOF
    exit 1
}

ensure_oo_is_downloaded() {
    ensure_command_available git

    if ! [ -d "$BUILDS_DIR" ]; then
        echo "Downloading OnlyOffice..."
        git clone --bare https://github.com/cryptpad/onlyoffice-builds.git "$BUILDS_DIR"
    fi
    if [ ${TRUST_REPOSITORY+x} ] || [ "${PROPS[trust_repository]:-no}" == yes ]; then
        git config --global --add safe.directory /cryptpad/onlyoffice-conf/onlyoffice-builds.git
    fi
}

install_old_version() {
    local DIR=$1
    local COMMIT=$2
    local FULL_DIR=$OO_DIR/$DIR
    local LAST_DIR=$(pwd)

    local ACTUAL_COMMIT="not installed"
    if [ -e "$FULL_DIR"/.commit ]; then
        ACTUAL_COMMIT="$(cat "$FULL_DIR"/.commit)"
    fi

    if [ "$ACTUAL_COMMIT" != "$COMMIT" ]; then
        if [ ${CHECK+x} ]; then
            echo "Wrong commit of $FULL_DIR found. Expected: $COMMIT. Actual: $ACTUAL_COMMIT"
            exit 1
        fi

        ensure_oo_is_downloaded

        rm -rf "$FULL_DIR"

        cd "$BUILDS_DIR"
        git worktree add "$FULL_DIR" "$COMMIT"

        cd "$LAST_DIR"

        echo "$COMMIT" >"$FULL_DIR"/.commit

        echo "$DIR updated"
    else
        echo "$DIR was up to date"
    fi

    if [ ${CLEAR+x} ]; then
        rm -f "$FULL_DIR"/.git
    fi
}

install_version() {
    ensure_command_available curl
    ensure_command_available sha512sum
    ensure_command_available unzip

    local DIR=$1
    local VERSION=$2
    local HASH=$3
    local FULL_DIR=$OO_DIR/$DIR
    local LAST_DIR=$(pwd)

    if [ ! -e "$FULL_DIR"/.version ] || [ "$(cat "$FULL_DIR"/.version)" != "$VERSION" ]; then
        rm -rf "$FULL_DIR"
        mkdir -p "$FULL_DIR"

        cd "$FULL_DIR"

        curl "https://github.com/cryptpad/onlyoffice-editor/releases/download/$VERSION/onlyoffice-editor.zip" --location --output "onlyoffice-editor.zip"
        echo "$HASH onlyoffice-editor.zip" >onlyoffice-editor.zip.sha512
        if ! sha512sum --check onlyoffice-editor.zip.sha512; then
            echo "onlyoffice-editor.zip does not match expected checksum"
            exit 1
        fi
        unzip onlyoffice-editor.zip
        rm onlyoffice-editor.zip*

        echo "$VERSION" >"$FULL_DIR"/.version

        echo "$DIR updated"
    else
        echo "$DIR was up to date"
    fi
}

install_x2t() {
    local VERSION=$1
    local HASH=$2
    local LAST_DIR
    LAST_DIR=$(pwd)
    local X2T_DIR=$OO_DIR/x2t

    local ACTUAL_VERSION="not installed"
    if [ -e "$X2T_DIR"/.version ]; then
        ACTUAL_VERSION="$(cat "$X2T_DIR"/.version)"
    fi

    if [ ! -e "$X2T_DIR"/.version ] || [ "$(cat "$X2T_DIR"/.version)" != "$VERSION" ]; then
        if [ ${CHECK+x} ]; then
            echo "Wrong version of x2t found. Expected: $VERSION. Actual: $ACTUAL_VERSION"
            exit 1
        fi

        rm -rf "$X2T_DIR"
        mkdir -p "$X2T_DIR"

        cd "$X2T_DIR"

        ensure_command_available curl
        ensure_command_available sha512sum
        ensure_command_available unzip
        curl "https://github.com/cryptpad/onlyoffice-x2t-wasm/releases/download/$VERSION/x2t.zip" --location --output x2t.zip
        echo "$HASH x2t.zip" >x2t.zip.sha512
        if ! sha512sum --check x2t.zip.sha512; then
            echo "x2t.zip does not match expected checksum"
            exit 1
        fi
        unzip x2t.zip
        rm x2t.zip*

        echo "$VERSION" >"$X2T_DIR"/.version

        echo "x2t updated"
    else
        echo "x2t was up to date"
    fi
}

ensure_command_available() {
    if ! command -v "$1" &>/dev/null; then
        echo "$1 needs to be installed to run this script"
        exit 1
    fi
}

main "$@"
