#!/bin/bash

pid=0
USERNAME=$1
datetime=$2
url=$3
function finish {
    [ ${pid} -gt 0 ] && kill ${pid} 2>/dev/null
}
trap finish EXIT

streamlink -Q "$url" worst -o "${USERNAME}-${datetime}.mkv" &
pid=$!

sleep "3"
finish
