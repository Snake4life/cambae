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
mkdir -p pages
rm -rf docker-compose.template
cat <<EOF >>docker-compose.template
##CLEAN_USERNAME##:
    image: 'patt1293/myfreebae:build-100'
    labels:
      app: myfreebae:client
      io.rancher.container.hostname_override: container_name
      io.rancher.container.pull_image: always
      io.rancher.scheduler.affinity:host_label: service=client
    environment:
      MODELNAME: "##MODEL_NAME##"
      BACKEND: "elk.backend.chaturbae.tv"
      SYSLOG_TAG: '{docker: "myfreebae-client"}'
      LOGSTASH_FIELDS: "platform=docker,job=myfreebae-client,model_username=##MODEL_NAME##"
      DECODE_JSON_LOGS: "true"
      DEBUG: "myfreebae:*"

EOF
cp master_list.txt pages
echo "h1"
cd pages
gsplit -l 100 --numeric-suffixes --additional-suffix='.txt' 'master_list.txt' 'page'
lastP=$(ls | gsort -Vr | head -n 1 | sed 's|page\(.*\)\.txt|\1|g')
rm -rf master_list.txt
cd ../
for ((i=0;i<=$lastP;i++)); do
  if [ $i -gt 9 ]; then
    PPAGE="page$i.txt"
  else
    PPAGE="page0$i.txt"
  fi
  dOut=""
  while read p; do
    echo $p
      #nameMinusWorker=$(echo $p | sed 's|-worker||g')
      nameReplaceDash=$(echo $p | sed -e 's|_||g' -e 's|--|-|g' -e 's|^-||g' -e 's|^_||' -e 's|-$||g' -e 's|$_||g' -e 's|_||g')
      toLower=$(echo $nameReplaceDash | awk '{print tolower($0)}')
      dTemplate=$(cat docker-compose.template | sed -e "s|##IMAGE##|$IMAGE|g" -e "s|##MODEL_NAME##|$p|g" -e "s|##CLEAN_USERNAME##|$toLower|g")
      #echo $nameReplaceDash
      dOut="$dOut\n  $dTemplate"
  done < "pages/$PPAGE"
      printf "version: '2'\nservices:$dOut" > docker-compose-generate.yml
      echo "waiting to simulate rancher"
      rancher up -f docker-compose-generate.yml -s myfreebae-stack -u -d -c
      sleep 10

done

#rm -f master_list.txt
rm -rf docker-compose.template
rm -rf pages/*
