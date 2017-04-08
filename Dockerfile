FROM node:6

ARG VERSION=0.3.0

# Download stable version
# RUN wget https://github.com/xwiki-labs/cryptpad/archive /${VERSION}.tar.gz -O /cryptpad.tar.gz \
#   && mkdir -p /cryptpad \
#   && tar -xzf /cryptpad.tar.gz -C /cryptpad --strip-components=1 \
#   && rm /cryptpad.tar.gz

# Download from github
# RUN git clone https://github.com/xwiki-labs/cryptpad.git

# Add code directly
ADD . /cryptpad

WORKDIR /cryptpad

RUN npm install \
   && npm install -g bower \
   && bower install --allow-root

ADD container-start.sh /container-start.sh
RUN chmod u+x /container-start.sh

EXPOSE 3000

VOLUME /cryptpad/datastore
VOLUME /cryptpad/customize

ENV USE_SSL=false
ENV STORAGE='./storage/file'
ENV LOG_TO_STDOUT=true

CMD /container-start.sh
