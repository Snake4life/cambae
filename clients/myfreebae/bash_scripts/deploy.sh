#!/bin/bash
rm -rf docker-compose-generate.yml
rm -rf pages/*
rm -rf docker-compose.template
bash generate_docker_compose_local.sh master_list.txt
rm -rf docker-compose-generate.yml
