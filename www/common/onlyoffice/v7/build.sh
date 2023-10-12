#!/usr/bin/env sh

set -euxo pipefail

BRANCH=cp7.3.3.60

WORK_DIR=`mktemp -d -t build-oo.XXXXX`
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

cd $WORK_DIR

git clone --depth 1 --branch $BRANCH https://github.com/cryptpad/sdkjs
git clone --depth 1 --branch $BRANCH https://github.com/cryptpad/web-apps

cd sdkjs
make

cd $SCRIPT_DIR
rm -rf sdkjs web-apps

cp -r \
  $WORK_DIR/sdkjs/deploy/sdkjs \
  $WORK_DIR/sdkjs/deploy/web-apps \
  $SCRIPT_DIR
