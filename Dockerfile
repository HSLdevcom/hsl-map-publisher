FROM node:10

RUN apt-get update && apt-get install -yq pdftk --no-install-recommends

# See https://crbug.com/795759
RUN apt-get update && apt-get install -yq libgconf-2-4 --no-install-recommends

# This installs the necessary libs to make the bundled version of Chromium that Pupppeteer installs work
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -yq wget --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -yq $(apt-cache depends google-chrome-unstable | awk '/Depends:/{print$2}') --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge --auto-remove -y curl \
    && rm -rf /src/*.deb

RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser

ENV WORK /opt/publisher

RUN mkdir -p ${WORK}
WORKDIR ${WORK}

# Install app dependencies
COPY yarn.lock ${WORK}
COPY package.json ${WORK}
RUN yarn

COPY . ${WORK}
RUN yarn run build

EXPOSE 4000

CMD \
  mkdir -p ~/.local/share/fonts/opentype && \
  cp /fonts/* ~/.local/share/fonts/opentype && \
  fc-cache -f -v && \
  ln -s /output . && \
  node_modules/.bin/forever start -c "yarn serve" ./ && \
  node_modules/.bin/forever start -c "yarn server" ./ && \
  node_modules/.bin/forever -f logs 1
