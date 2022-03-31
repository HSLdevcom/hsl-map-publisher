FROM node:16-buster-slim

# This installs the necessary libs to make the bundled version of Chromium that Pupppeteer installs work
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -yq \
      wget curl gnupg pdftk libgconf-2-4 gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 \
      libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
      libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 \
      libnss3 lsb-release xdg-utils --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -yq $(apt-cache depends google-chrome-unstable | awk '/depends:/{print$2}') --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /src/*.deb

RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser

# Install Azure CLI to download the fonts
# TODO: This takes almost 1G size in the docker image. Change Azure CLI to azcopy. See MM-262
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash && rm -rf /var/lib/apt/lists/*

ENV WORK /opt/publisher

RUN mkdir -p ${WORK}
WORKDIR ${WORK}

# Install app dependencies
COPY yarn.lock package.json ${WORK}/
RUN yarn && yarn cache clean

COPY . ${WORK}

ARG BUILD_ENV=prod
COPY .env.${BUILD_ENV} ${WORK}/.env

RUN yarn run build

CMD \
  ./fonts.sh && \
  fc-cache -f -v && \
  yarn run start:production && \
  yarn run server:production && \
  yarn run worker:production && \
  sleep 3 && \
  node_modules/.bin/forever -f logs 1
