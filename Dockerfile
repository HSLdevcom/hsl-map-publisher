FROM node:18-bullseye-slim as production

RUN apt-get -y update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -yq wget curl gnupg fontconfig fonts-liberation ca-certificates --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] https://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' \
    && apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -yq google-chrome-stable libxss1 --no-install-recommends \
    && wget -O azcopy_v10.tar.gz https://aka.ms/downloadazcopy-v10-linux && tar -xf azcopy_v10.tar.gz --strip-components=1 \
    && cp ./azcopy /usr/bin/ \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_OPTIONS=--openssl-legacy-provider

ENV WORK /opt/publisher

RUN mkdir -p ${WORK}
WORKDIR ${WORK}

COPY package.json package-lock.json .npmrc ${WORK}/
RUN npm ci && npm cache clean --force

COPY . ${WORK}

ARG BUILD_ENV=dev
COPY .env.${BUILD_ENV} ${WORK}/.env

ENV BUILD_ENV=${BUILD_ENV}
RUN npm run build

ARG SERVICE='start:production'
ENV SERVICE=${SERVICE}

CMD ["sh", "-c", "npm run ${SERVICE}"]

