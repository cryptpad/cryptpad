#!/bin/sh

# Creating customize folder
mkdir -p customize

# Copying default config
mkdir -p cfg
[ ! -f cfg/config.js ] && echo "Creating config.js" && cp config/config.example.js cfg/config.js

# Linking config.js
[ ! -L config/config.js ] && echo "Linking config.js" && ln -s ../cfg/config.js config/config.js


# Thanks to http://stackoverflow.com/a/10467453
sedeasy() {
  sed -i "s/$1/$(echo $2 | sed -e 's/[\/&]/\\&/g')/g" $3
}

# Configure
[ -n "$STORAGE" ] && echo "Using storage adapter: $STORAGE" \
  && sedeasy "storage: [^,]*," "storage: ${STORAGE}," cfg/config.js

[ -n "$LOG_TO_STDOUT" ] && echo "Logging to stdout: $LOG_TO_STDOUT" \
  && sedeasy "logToStdout: [^,]*," "logToStdout: ${LOG_TO_STDOUT}," cfg/config.js

export FRESH=1
exec node ./server.js
