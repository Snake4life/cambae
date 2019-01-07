#!/bin/bash
touch combined-compose.yml
#split -l 10 --numeric-suffixes --additional-suffix='.txt' 'master_list.txt' 'page'
rm docker-compose-generated.yml
bash generate_docker_compose_local.sh master_list.txt
cat docker-compose-generate.yml >> combined-compose.yml
rancher up -f docker-compose-generate.yml -s myfreebae-stack -u -d -c
rm -rf docker-compose-generate.yml
