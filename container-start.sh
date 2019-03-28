#!/bin/sh

# Creating customize folder
mkdir -p customize

# Copying default config
mkdir -p config
[ ! -f config/config.js ] && echo "Creating config.js" && cp config/config.example.js config/config.js

# Thanks to http://stackoverflow.com/a/10467453
sedeasy() {
  sed -i "s/$1/$(echo $2 | sed -e 's/[\/&]/\\&/g')/g" $3
}

# Configure
[ -n "$USE_SSL" ] && echo "Using secure websockets: $USE_SSL" \
  && sedeasy "useSecureWebsockets: [^,]*," "useSecureWebsockets: ${USE_SSL}," config/config.js

[ -n "$STORAGE" ] && echo "Using storage adapter: $STORAGE" \
  && sedeasy "storage: [^,]*," "storage: ${STORAGE}," config/config.js

[ -n "$LOG_TO_STDOUT" ] && echo "Logging to stdout: $LOG_TO_STDOUT" \
  && sedeasy "logToStdout: [^,]*," "logToStdout: ${LOG_TO_STDOUT}," config/config.js

export FRESH=1
exec node ./server.js
