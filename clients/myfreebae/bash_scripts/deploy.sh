#!/bin/bash
#touch combined-compose.yml
#split -l 10 --numeric-suffixes --additional-suffix='.txt' 'master_list.txt' 'page'
rm -rf docker-compose-generate.yml
rm -rf pages/*
rm -rf docker-compose.template
bash generate_docker_compose_local.sh master_list.txt
#rancher up -f docker-compose-generate.yml -s myfreebae-client -u -d -c
rm -rf docker-compose-generate.yml
