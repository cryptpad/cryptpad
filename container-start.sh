#!/bin/sh

# Creating customize folder
mkdir -p customize
[ -z "$(ls -A customize)" ] && echo "Creating customize folder" \
  && cp -R customize.dist/* customize/ \
  && cp config.example.js customize/config.js

# Linking config.js
[ ! -h config.js ] && echo "Linking config.js" && ln -s customize/config.js config.js

# Thanks to http://stackoverflow.com/a/10467453
sedeasy() {
  sed -i "s/$1/$(echo $2 | sed -e 's/[\/&]/\\&/g')/g" $3
}

# Configure
[ -n "$USE_SSL" ] && echo "Using secure websockets: $USE_SSL" \
  && sedeasy "useSecureWebsockets: [^,]*," "useSecureWebsockets: ${USE_SSL}," customize/config.js

[ -n "$STORAGE" ] && echo "Using storage adapter: $STORAGE" \
  && sedeasy "storage: [^,]*," "storage: ${STORAGE}," customize/config.js

[ -n "$LOG_TO_STDOUT" ] && echo "Logging to stdout: $LOG_TO_STDOUT" \
  && sedeasy "logToStdout: [^,]*," "logToStdout: ${LOG_TO_STDOUT}," customize/config.js


exec node ./server.js
