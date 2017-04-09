#!/bin/sh

# Creating customize folder
mkdir -p customize
[ -z "$(ls -A customize)" ] && echo "Creating customize folder" \
  && cp -R customize.dist/* customize/ \
  && cp config.js.dist customize/config.js

# Linking config.js 
[ ! -h config.js ] && echo "Linking config.js" && ln -s customize/config.js config.js

# Configure 
[ -n "$USE_SSL" ] && echo "Using secure websockets: $USE_SSL" \
  && sed -i "s/useSecureWebsockets: .*/useSecureWebsockets: ${USE_SSL},/g" customize/config.js

[ -n "$STORAGE" ] && echo "Using storage adapter: $STORAGE" \
  && sed -i "s/storage: .*/storage: ${STORAGE},/g" customize/config.js

[ -n "$LOG_TO_STDOUT" ] && echo "Logging to stdout: $LOG_TO_STDOUT" \
  && sed -i "s/logToStdout: .*/logToStdout: ${LOG_TO_STDOUT},/g" customize/config.js


exec node ./server.js
