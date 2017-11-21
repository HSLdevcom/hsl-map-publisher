FROM node:8

# Install latest chrome dev package.
# Note: this installs the necessary libs to make the bundled version of Chromium that Pupppeteer
# installs, work.
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y wget --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y $(apt-cache depends google-chrome-unstable | awk '/Depends:/{print$2}') pdftk --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge --auto-remove -y curl \
    && rm -rf /src/*.deb

ENV WORK /opt/publisher

# Create app directory
RUN mkdir -p ${WORK}
WORKDIR ${WORK}

# Add privileges for puppeteer user
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p ${WORK} \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser ${WORK}

# Run user as non privileged.
USER pptruser

# Install app dependencies
COPY yarn.lock ${WORK}
COPY package.json ${WORK}
RUN yarn

# Bundle app source
COPY . ${WORK}

EXPOSE 5000

CMD \
  mkdir -p ~/.local/share/fonts/opentype && \
  cp /fonts/* ~/.local/share/fonts/opentype && \
  fc-cache -f -v && \
  cd ${WORK} && \
  rm -r output && ln -s /output . && \
  node_modules/.bin/forever start -c "npm start" ./ && \
  node_modules/.bin/forever start -c "npm run ui" ./ && \
  node_modules/.bin/forever start -c "npm run serve" ./ && \
  node_modules/.bin/forever --fifo logs 2
