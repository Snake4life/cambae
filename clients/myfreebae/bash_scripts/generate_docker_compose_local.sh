#!/bin/bash
FILENAME=$1
#cb-client:
#  image: patt1293/chaturbae-client:latest
#  environment:
#    CB_USERNAME: "${CB_USERNAME}"
#    AWSKEY: "${AWSKEY}"
#    AWSSECRET: "${AWSSECRET}"
#    SERVICE_IP: "172.26.5.97"
#    DEBUG: "chaturbae:*"
rm -rf docker-compose.template
cat <<EOF >>docker-compose.template
##CLEAN_USERNAME##:
    image: 'patt1293/myfreebae:build-100'
    labels:
      app: myfreebae:client
      io.rancher.container.hostname_override: container_name
      io.rancher.container.pull_image: always
    environment:
      MODELNAME: "##MODEL_NAME##"
      BACKEND: "elk.backend.chaturbae.tv"
      SYSLOG_TAG: '{docker: "myfreebae-client"}'
      LOGSTASH_FIELDS: "platform=docker,job=myfreebae-client,model_username=##MODEL_NAME##"
      DECODE_JSON_LOGS: "true"
      DEBUG: "myfreebae:*"

EOF
dOut=""
while read p; do
  echo $p
    #nameMinusWorker=$(echo $p | sed 's|-worker||g')
    nameReplaceDash=$(echo $p | sed -e 's|_||g' -e 's|--|-|g' -e 's|^-||g' -e 's|^_||' -e 's|-$||g' -e 's|$_||g' -e 's|_||g')
    toLower=$(echo $nameReplaceDash | awk '{print tolower($0)}')
    dTemplate=$(cat docker-compose.template | sed -e "s|##IMAGE##|$IMAGE|g" -e "s|##MODEL_NAME##|$p|g" -e "s|##CLEAN_USERNAME##|$toLower|g")
    #echo $nameReplaceDash
    dOut="$dOut\n  $dTemplate"
done < $FILENAME
    printf "version: '2'\nservices:$dOut" > docker-compose-generate.yml
rm -rf docker-compose.template
