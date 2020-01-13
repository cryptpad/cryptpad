# We use multi stage builds
FROM node:12-stretch-slim AS build

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -yq git jq python curl
RUN npm install -g bower

# install tini in this stage to avoid the need of jq and python
# in the final image
ADD docker-install-tini.sh /usr/local/bin/docker-install-tini.sh
RUN /usr/local/bin/docker-install-tini.sh

COPY . /cryptpad
WORKDIR /cryptpad

RUN npm install --production \
    && npm install -g bower \
    && bower install --allow-root

FROM node:12-stretch-slim

# You want USE_SSL=true if not putting cryptpad behind a proxy
ENV USE_SSL=false
ENV STORAGE="'./storage/file'"
ENV LOG_TO_STDOUT=true

# Persistent storage needs
VOLUME /cryptpad/cfg
VOLUME /cryptpad/datastore
VOLUME /cryptpad/customize
VOLUME /cryptpad/blobstage
VOLUME /cryptpad/block
VOLUME /cryptpad/blob
VOLUME /cryptpad/data

# Copy cryptpad and tini from the build container
COPY --from=build /sbin/tini /sbin/tini
COPY --from=build /cryptpad /cryptpad

WORKDIR /cryptpad

# Unsafe / Safe ports
EXPOSE 3000 3001

# Run cryptpad on startup
CMD ["/sbin/tini", "--", "/cryptpad/container-start.sh"]
