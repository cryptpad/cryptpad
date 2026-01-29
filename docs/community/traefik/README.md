# Traefik

## Create folder structure fro cryptpad
Modify paths below to your liking or use docker volumes

Create the required folder and set permissions
```
cd /docker
mkdir /docker/cryptpad 
mkdir /docker/cryptpad/data
mkdir /docker/cryptpad/customize
mkdir /docker/cryptpad/onlyoffice-dist
mkdir /docker/cryptpad/onlyoffice-conf
mkdir /docker/cryptpad/config
```
## Fix permissions 
```
cd /docker/cryptpad 
sudo find . -type d -exec chmod 755 {} +
sudo find . -type f -exec chmod 644 {} +
sudo chown -R 4001:4001 .
```

## In Traefik dynamik conf
the docker compose use this middleware
```
http:
  middlewares:
    # other middlewares
    redirect-to-https:
      redirectScheme:
        scheme: "https"
        permanent: true
```

## modify docker-compose

* replace https://main.domain.com
* replace https://sandbox.domain.com
* fix volumes paths to your desired paths

Start the stack again using the docker-compose 

