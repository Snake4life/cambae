# WIP

## Description

A dockerized "sorta-bot-net" running on top of Rancher (for container orchestration) that is incorrectly using Node.js to gather analytics from Chaturbate and MFC (tip amounts, chat messages, clothing status) and pipe it into an ELK stack

This project started as all good ones do, with a little bit of alcohol and a thought "I wonder if I can automate notifications when a live streaming model is doing something _interesting_"

The result is an unholy concoction of node.js, python flask, docker, rancher, ELK

## Primary Focus

- [ ] (IN PROGRESS) build backend api for returning values like online status, clothing, hair color, ethnicity
- [ ] (IN PROGRESS) add online status tracker to mfcbae.js to better track model status
- [ ] continue building out / finding metrics to track in ELK

## Upcoming Focus

- [ ] front end of some sort for managing model lists
- [ ] hair color detection
- [ ] ethnicity detection
- [ ] better nude confirmation
- [ ] investigate removing the dependency for chrome with chaturbae. At least remove the dependency for it to be running 24x7.

## Hopes and Dreams

- [ ] come up with a magical way to validate my data without literally running two replicas

## Overall goals

- [X] Track models on cam sites, and alert when online/offline/event happens

- [X] Detect nudity using clip of webcam show, and alert

- [ ] provide web interface for managing list of models

- [ ] provide chromecast streaming features for tracked models

- [ ] god only knows what else I come up with

## WIP Dashboard

![](http://ul.gy/dMnoK.png)
