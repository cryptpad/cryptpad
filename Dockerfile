FROM node:6-alpine

COPY . /cryptpad
WORKDIR /cryptpad

RUN apk add --no-cache git tini \
   && npm install \
   && npm install -g bower \
   && bower install --allow-root

EXPOSE 3000

VOLUME /cryptpad/datastore
VOLUME /cryptpad/customize

ENV USE_SSL=false
ENV STORAGE='./storage/file'
ENV LOG_TO_STDOUT=true

CMD ["/sbin/tini", "--", "/cryptpad/container-start.sh"]
