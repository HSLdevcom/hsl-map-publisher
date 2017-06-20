FROM node:8

RUN echo "deb http://http.debian.net/debian jessie-backports main" >> /etc/apt/sources.list
RUN echo "deb http://http.debian.net/debian unstable main" >> /etc/apt/sources.list

RUN \
  apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -yq -t jessie-backports libgl1-mesa-glx libgl1-mesa-dri xserver-xorg-video-dummy xserver-xorg-input-mouse xserver-xorg-input-kbd && \
  DEBIAN_FRONTEND=noninteractive apt-get install -yq -t unstable firefox imagemagick argyll pdftk

ENV WORK /opt/publisher

# Create app directory
RUN mkdir -p ${WORK}
WORKDIR ${WORK}

# Install app dependencies
COPY yarn.lock ${WORK}
COPY package.json ${WORK}
RUN yarn

# Bundle app source
COPY . ${WORK}

EXPOSE 5000

CMD \
  cp policy.xml /etc/ImageMagick-6/policy.xml && \
  cp fonts.conf /etc/fonts/local.conf && \
  mkdir -p /usr/share/fonts/opentype && \
  cp fonts/* /usr/share/fonts/opentype 2>/dev/null || : && \
  fc-cache -f -v && \
  cd ${WORK} && \
  Xorg -dpi 96 -nolisten tcp -noreset +extension GLX +extension RANDR +extension RENDER -logfile ./10.log -config ./xorg.conf :10 & \
  sleep 15 && \
  node_modules/.bin/forever start -c "npm start" ./ && \
  node_modules/.bin/forever start -c "npm run ui" ./ && \
  DISPLAY=":10" node_modules/.bin/forever start -c "npm run serve" ./ && \
  sleep 5 && \
  node_modules/.bin/forever --fifo logs 2
