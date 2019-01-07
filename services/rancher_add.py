#!/usr/bin/python

import os
import sys
import getopt
import requests, json
from time import sleep

# usage help message
def usage(msg = None):
        if not msg == None:
                print msg
                print
        print "Usage: new_host [--url=<RANCHER_URL> --key=<RANCHER_ACCESS_KEY> --secret=<RANCHER_SECRET_KEY>]"
        print
        print "Adds this host to Rancher using the credentials supplied or defined as environment vars"

# get credentials form args or env
rancher_url = "http//rancher.chaturbae.tv:8080"
rancher_key = "46D93353B153B9A52F7E"
rancher_secret = "BNSk9c8ZjE3m8r16jYP1gKncGEEpX1S6p993itrH"

rancher_protocol = 'http'
rancher_host = 'rancher.chaturbae.tv:8080'
# get environment we're in
url = "%s://%s:%s@%s/v1/projects" % (rancher_protocol,rancher_key,rancher_secret,rancher_host)
response = requests.get(url)
data = json.loads(response.text)
rancher_environment = data['data'][0]['name']
#print "rancher_environment is %s" % rancher_environment

# now ask for a new registration key and wait until it becomes active
url = "%s://%s:%s@%s/v1/registrationtokens" % (rancher_protocol,rancher_key,rancher_secret,rancher_host)
response = requests.get(url,json={})
response = response.text
response = json.loads(response)
key_active = False
while not key_active:
        url = "%s://%s:%s@%s/v1/registrationtokens/%s" % (rancher_protocol,rancher_key,rancher_secret,rancher_host,response['data'][0]['uuid'])
#        print url
        if response['data'][0]['state'] == 'active':
                key_active = True
                command = response['data'][0]['command']
        else:
                sleep(0.1)
                response = requests.get(url)

print command
os.system(command)
