SPATH=$1
SURL=$2
SUSER=$3
SLLOC=`which streamlink`
echo "$SUSER-*.jpg"
echo $(pwd)
rm -f "$SUSER-*.jpg"
#echo "$SLLOC --quiet --hls-duration 00:00:15 $SURL\" worst -o $SPATH" >> fuckmeplswhywontthiswork.txt
$SLLOC --quiet --hls-duration 00:00:08 $SURL worst -o $SPATH
