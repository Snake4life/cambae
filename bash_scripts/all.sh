USERNAME=$1
datetime=$2
url=$3
./bash_scripts/streamlink.sh $USERNAME $datetime $url
#>/dev/null 2>&1
./bash_scripts/ffmpeg.sh $USERNAME $datetime
./bash_scripts/is_naked.sh "${USERNAME}-${datetime}.jpg"
rm -f "${USERNAME}-${datetime}.jpg"
rm -f "${USERNAME}-${datetime}.mkv"
