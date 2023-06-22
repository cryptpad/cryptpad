# Multistage build to reduce image size and increase security
FROM node:lts-alpine AS build

# Install requirements to clone repository and install deps
RUN apk add --no-cache git
RUN npm install -g bower

# Create folder for cryptpad
RUN mkdir /cryptpad
WORKDIR /cryptpad

# Get cryptpad from repository submodule
COPY . /cryptpad

RUN sed -i "s@//httpAddress: '::'@httpAddress: '0.0.0.0'@" /cryptpad/config/config.example.js
RUN sed -i "s@installMethod: 'unspecified'@installMethod: 'docker-alpine'@" /cryptpad/config/config.example.js

# Install dependencies
RUN npm install --production \
    && npm install -g bower \
    && bower install --allow-root

# Create actual cryptpad image
FROM node:lts-alpine

# Create user and group for cryptpad so it does not run as root
RUN addgroup -g 4001 -S cryptpad \
    && adduser -u 4001 -S -D -g 4001 -H -h /cryptpad cryptpad

# Copy cryptpad with installed modules
COPY --from=build --chown=cryptpad /cryptpad /cryptpad
USER cryptpad

# Copy docker-entrypoint.sh script
COPY docker-entrypoint.sh /docker-entrypoint.sh

# Set workdir to cryptpad
WORKDIR /cryptpad

# Create directories
RUN mkdir blob block customize data datastore \
    && chown cryptpad:cryptpad blob block customize data datastore

# Volumes for data persistence
VOLUME /cryptpad/blob
VOLUME /cryptpad/block
VOLUME /cryptpad/customize
VOLUME /cryptpad/data
VOLUME /cryptpad/datastore

# Ports
EXPOSE 3000 3001

# Run cryptpad on startup
CMD ["npm", "start"]
