FROM ubuntu:18.04

# Application parameters and variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV application_directory=/usr/src/app
ENV ENABLE_XVBF=true

# Build Args
ARG USE_CHROME_STABLE

# Configuration for Chrome
ENV CONNECTION_TIMEOUT=60000
ENV CHROME_PATH=/usr/bin/google-chrome
ENV USE_CHROME_STABLE=${USE_CHROME_STABLE}

RUN mkdir -p $application_directory

WORKDIR $application_directory

# Dependencies + NodeJS
RUN apt-get update && \
echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections && \
apt-get install -y software-properties-common &&\
apt-add-repository ppa:malteworld/ppa && apt-get update && apt-get install -y \
msttcorefonts \
fonts-noto-color-emoji \
fonts-noto-cjk \
fonts-liberation \
fonts-thai-tlwg \
fontconfig \
libappindicator3-1 \
pdftk \
unzip \
locales \
gconf-service \
libasound2 \
libatk1.0-0 \
libc6 \
libcairo2 \
libcups2 \
libdbus-1-3 \
libexpat1 \
libfontconfig1 \
libgcc1 \
libgconf-2-4 \
libgdk-pixbuf2.0-0 \
libglib2.0-0 \
libgtk-3-0 \
libnspr4 \
libpango-1.0-0 \
libpangocairo-1.0-0 \
libstdc++6 \
libx11-6 \
libx11-xcb1 \
libxcb1 \
libxcomposite1 \
libxcursor1 \
libxdamage1 \
libxext6 \
libxfixes3 \
libxi6 \
libxrandr2 \
libxrender1 \
libxss1 \
libxtst6 \
ca-certificates \
libappindicator1 \
libnss3 \
lsb-release \
xdg-utils \
wget \
xvfb \
livestreamer \
ffmpeg \
strace \
libicu-dev \
screen \
supervisor \
curl &&\
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - &&\
echo 'deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main' | tee /etc/apt/sources.list.d/google-chrome.list &&\
# Install Node
 curl --silent --location https://deb.nodesource.com/setup_8.x | bash - &&\
apt-get install --yes nodejs &&\
apt-get install --yes build-essential &&\
# Fonts
fc-cache -f -v
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 9DA31620334BD75D9DCB49F368818C72E52529D4
RUN echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-4.0.list
RUN apt-get update
RUN export DEBIAN_FRONTEND=noninteractive && apt-get install -y tzdata

RUN ln -fs /usr/share/zoneinfo/America/New_York /etc/localtime
RUN dpkg-reconfigure --frontend noninteractive tzdata
RUN apt-get install -y mongodb-org

RUN apt-get install -y google-chrome-stable
# It's a good idea to use dumb-init to help prevent zombie chrome processes.
ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

# Install Chrome Stable when specified
RUN if [ "$USE_CHROME_STABLE" = "true" ]; then \
cd /tmp &&\
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb &&\
dpkg -i google-chrome-stable_current_amd64.deb;\
fi
#Build
RUN if [ "$USE_CHROME_STABLE" = "true" ]; then \
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true;\
fi

#ADD supervisord.conf /etc/supervisor/conf.d/supervisord.conf
RUN mkdir -p /var/log/myfreebae/

RUN apt-get install nginx vim -y
#ADD nginx.conf /etc/nginx/sites-enabled/default
RUN apt-get install -y jq git python3 python3-pip python3-dev build-essential

RUN pip3 install --upgrade streamlink
# Cleanup
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Add user
RUN groupadd -r chaturbae && useradd -r -g chaturbae -G audio,video chaturbae

COPY package.json .

RUN npm install pino

COPY streamlink-plugins/myfreecams.py /root/.config/streamlink/plugins/myfreecams.py
# Bundle app source
COPY . .

RUN npm install

RUN npm install -g typescript nodemon

#&& mkdir -p /home/blessuser/Downloads
#&& chown -R blessuser:blessuser /home/blessuser \
#&& chown -R blessuser:blessuser $application_directory

# Run everything after as non-privileged user.
#USER blessuser

# Expose the web-socket and HTTP ports
#EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
#CMD [ "node", "cb_client.js" ]
#RUN screen -dmS super /usr/bin/supervisord -n
# Install app dependencies
RUN mkdir ./src/services/bash_scripts/models
CMD bash entrypoint.sh
#CMD tail -f /dev/null
