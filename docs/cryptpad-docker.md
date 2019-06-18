# Cryptpad Docker Image

Cryptpad includes support for building a Docker image and running it to provide a Cryptpad instance. You can manage the container manually, or let Docker Compose manage it for you.

A full tutorial is available [on the Cryptpad Github wiki](https://github.com/xwiki-labs/cryptpad/wiki/Docker-(with-Nginx-and-Traefik)). This document provides a brief overview.

## Features

- Configuration via .env file
- Ready for use with traffic
- Using github master for now, release 0.3.0 too old
- Creating customize folder
- Adding config.js to customize folder
- Persistance for datastore and customize folder

## Run

Run from the cryptpad source directory, keeping instance state in `/var/cryptpad`:

```
docker build -t xwiki/cryptpad .
docker run --restart=always -d --name cryptpad -p 3000:3000 -p 3001:3001 \
-v /var/cryptpad/files:/cryptpad/datastore \
-v /var/cryptpad/customize:/cryptpad/customize \
-v /var/cryptpad/blob:/cryptpad/blob \
-v /var/cryptpad/blobstage:/cryptpad/blobstage \
-v /var/cryptpad/pins:/cryptpad/pins \
-v /var/cryptpad/tasks:/cryptpad/tasks \
-v /var/cryptpad/block:/cryptpad/block \ 
xwiki/cryptpad
```

Or, using docker-compose and the included `docker-compose.yml`, keeping instance state in the current directory under `./data`:

```
docker-compose up -d
```

## Configuration

Set configurations Dockerfile or in .env (using docker-compose) file.

- VERSION=latest
- USE_SSL=false
- STORAGE='./storage/file'
- LOG_TO_STDOUT=true

The .env variables are read by docker-compose and forwarded to docker container.
On runtime, in `bin/container-start.sh` the settings are written to the `config.js` file.


## Persistance

The docker-compose file is preconfigured to persist folders

- cryptpad/datastore --> ./data/files
- cryptpad/customize --> ./data/customize
- cryptpad/pins --> ./data/pins
- cryptpad/blob --> ./data/blob
- cryptpad/blobstage --> ./data/blobstage
- cryptpad/tasks --> ./data/tasks
- cryptpad/block --> ./data/block

Your configuration file will be in `./data/customize/config.js`.

The data folder is ignored by git, so if you want to add your customizations to git versioning change the volume:

```
./customize:/cryptpad/customize:rw
```

## SSL Proxy

The [traefik](https://traefik.io/) proxy has builtin Let'sEncrypt for easy SSL setup.
In the docker-compose file you can find preset lables for usage with traefik.

[Traefik Docker Image](https://hub.docker.com/_/traefik/)

Alternativly just use plain old nginx.
