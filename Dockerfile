FROM node:6-stretch-slim

# You want USE_SSL=true if not putting cryptpad behind a proxy
ENV USE_SSL=false
ENV STORAGE=\'./storage/file\'
ENV LOG_TO_STDOUT=true

# Persistent storage needs
VOLUME /cryptpad/datastore
VOLUME /cryptpad/customize
VOLUME /cryptpad/blobstage
VOLUME /cryptpad/pins
VOLUME /cryptpad/tasks
VOLUME /cryptpad/block

# Required packages
#   jq is a build only dependency, removed in cleanup stage
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
         git jq python

# Install tini for faux init
#   sleep 1 is to ensure overlay2 can catch up with the copy prior to running chmod
COPY ./docker-install-tini.sh / 
RUN chmod a+x /docker-install-tini.sh \
    && sleep 1 \
    && /docker-install-tini.sh \
    && rm /docker-install-tini.sh

# Cleanup apt
RUN apt-get remove -y --purge jq python \
    && apt-get auto-remove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install cryptpad
COPY . /cryptpad
WORKDIR /cryptpad
RUN npm install --production \
    && npm install -g bower \
    && bower install --allow-root

# Unsafe / Safe ports
EXPOSE 3000 3001

# Run cryptpad on startup
CMD ["/sbin/tini", "--", "/cryptpad/container-start.sh"]

