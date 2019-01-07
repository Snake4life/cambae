#!/bin/bash
while true
do
  DATE=`date '+%Y-%m-%d %H:%M:%S'`
  echo "${DATE} - scraping home page of MFC for top rooms every 1 minute"
  python mfc_scrape.py > temp_scrape.txt
  sort master_list.txt temp_scrape.txt | uniq > temp_scrape2.txt
  rm -rf master_list.txt
  mv temp_scrape2.txt master_list.txt
  rm -rf temp_scrape.txt
  sleep 3
  bash ./deploy.sh
  sleep 60
done
