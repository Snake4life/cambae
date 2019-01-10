# FROM alpine:3.4
# FROM alpine:3.6
# FROM alpine:3.7
FROM node:alpine

RUN apk add --no-cache unzip \
ca-certificates \
nss \
wget \
xvfb \
ffmpeg \
strace \
icu-dev \
screen \
supervisor \
git \
python3 \
bash \
curl

# ENV VERSION=v4.9.1 NPM_VERSION=2
# ENV VERSION=v6.16.0 NPM_VERSION=3
# ENV VERSION=v8.15.0 NPM_VERSION=6 YARN_VERSION=latest
# ENV VERSION=v10.15.0 NPM_VERSION=6 YARN_VERSION=latest
ENV VERSION=v11.6.0 NPM_VERSION=6 YARN_VERSION=latest
# Application parameters and variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV application_directory=/usr/src/app

RUN mkdir -p $application_directory

WORKDIR $application_directory

#ADD supervisord.conf /etc/supervisor/conf.d/supervisord.conf
RUN mkdir -p /var/log/myfreebae/
# Cleanup
#RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Add user
#RUN groupadd -r myfreebae && useradd -r -g myfreebae -G audio,video chaturbae

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
RUN wget -O /usr/local/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_amd64
RUN chmod +x /usr/local/bin/dumb-init
# Expose the web-socket and HTTP ports
#EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
#CMD [ "node", "cb_client.js" ]
#RUN screen -dmS super /usr/bin/supervisord -n
# Install app dependencies

CMD /bin/bash entrypoint.sh
#CMD tail -f /dev/null
