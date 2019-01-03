#!/bin/bash
RANDOMWAIT=$((1 + RANDOM % 20))
node generate_log.js init "yay for using sleeps to fix bad code! sleeping for ${RANDOMWAIT} seconds"
sleep $RANDOMWAIT
node generate_log.js init "npm install deps started"
npm install >> /var/log/myfreebae/npm_install.log 2>&1
node generate_log.js init "npm install deps complete"

npm install -g typescript @types/node >> /var/log/myfreebae/npm_install.log 2>&1
node generate_log.js init "npm install typescript complete"
node generate_log.js init "npm install deps - log /var/log/myfreebae/npm_install.log"

#service nginx start > /var/log/chaturbae/supervisor.log 2>&1 &
#node generate_log.js init "starting supervisord - /var/log/chaturbae/supervisor.log"
#/usr/bin/supervisord > /var/log/chaturbae/supervisor.log 2>&1 &
#sleep 3
#node generate_log.js init "complete"
#tail -f /var/log/chaturbae/cb_client-output.log
node mfcbae.js
#tail -f /dev/null
