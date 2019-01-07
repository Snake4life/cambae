#!/bin/bash
touch combined-compose.yml
#split -l 10 --numeric-suffixes --additional-suffix='.txt' 'master_list.txt' 'page'
cat <<EOF > page01.txt
JulyaWild
AlabamaWhirly
Petite_Kas
LadyStarr
TaraWhitee
EOF
rm docker-compose-generated.yml
for i in $(seq 1 $STACKS)
do
  rm -rf docker-compose-generate.yml
  rm -rf docker-compose.template
  echo $i
  if [[ $i -gt '9' ]]; then
  	echo "page$i.txt"
  	bash generate_docker_compose.sh page$i.txt
    cat docker-compose-generate.yml >> combined-compose.yml
  	rancher up -f docker-compose-generate.yml -s stack-$i-myfreebae-stack -u -d -c
  else
  	echo "page0$i.txt"
  	bash generate_docker_compose.sh page0$i.txt
    rancher up -f docker-compose-generate.yml -s stack-$i-myfreebae-stack -u -d -c
  fi

done
echo "uploading to termbin and sleeping for 15s to wait"
cat combined-compose.yml | nc termbin.com 9999
sleep 15
rm -rf combined-compose.yml
rm -rf page*.txt
