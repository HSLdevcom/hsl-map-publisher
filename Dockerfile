FROM node:16.20-buster-slim

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -yq wget curl gnupg fontconfig fonts-liberation ca-certificates --no-install-recommends \
    # This installs the necessary libs to make the bundled version of Chromium that Puppeteer installs work
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] https://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' \
    && apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -yq google-chrome-stable libxss1 --no-install-recommends \
    && wget -O azcopy_v10.tar.gz https://aka.ms/downloadazcopy-v10-linux && tar -xf azcopy_v10.tar.gz --strip-components=1 \
    && cp ./azcopy /usr/bin/ \
    && rm -rf /var/lib/apt/lists/*


ENV WORK /opt/publisher

RUN mkdir -p ${WORK}
WORKDIR ${WORK}

# Install app dependencies
COPY yarn.lock package.json ${WORK}/
RUN yarn && yarn cache clean

COPY . ${WORK}

ARG BUILD_ENV=prod
COPY .env.${BUILD_ENV} ${WORK}/.env

ARG DIGITRANSIT_APIKEY
ENV DIGITRANSIT_APIKEY=${DIGITRANSIT_APIKEY}
RUN yarn run build

ARG SERVICE='start:production'
ENV SERVICE=${SERVICE}

CMD \
  ./fonts.sh && \
  fc-cache -f -v && \
  yarn run ${SERVICE} && \
  sleep 3 && \
  node_modules/.bin/forever -f logs 0
