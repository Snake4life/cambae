SPATH=$1
SURL=$2
SUSER=$3
FPATH=$4
SLLOC=`which streamlink`
FFLOC=`which ffmpeg`
END=4

#echo $(pwd)
#rm -f "$SUSER-*.jpg"
#echo "$SLLOC --quiet --hls-duration 00:00:15 $SURL\" worst -o $SPATH" >> fuckmeplswhywontthiswork.txt
if [ -f $SPATH ]; then
    rm -rf $SPATH
    rm -rf $FPATH/*.jpg
fi
if [ ! -f $FPATH/streamlink.log ]; then
    touch $FPATH/streamlink.log
fi
$SLLOC --quiet --hls-duration 00:00:05 $SURL worst -o $SPATH > $FPATH/streamlink.log 2>&1
TOTAL=0
OLIST=""
for i in $(seq 1 $END);
do
  OPATH="$FPATH/$SUSER-$i.jpg"
  TSTAMP="00:00:0$i"
  $FFLOC -loglevel panic -ss $TSTAMP -i $SPATH -frames:v 1 -f image2 $OPATH
  URL="http://$BACKEND:5000"
  #sleep .5
  OCURL=$(curl -s -F "file=@${OPATH}" $URL | jq -r '.[]')
  sleep .5
  #OCURL=$(echo $OCURL \* 100|bc)
  TOTAL=$(expr $TOTAL + $OCURL)
  TOTALAVG=$(expr $TOTAL / $END)
  OST="\"$OCURL\""
  if [[ "$i" == "1" ]]; then
    OLIST="$OST"
  else
    OLIST="$OLIST, $OST"
  fi
done
OSTRING="{\"status\": \"online\", \"nsfwAvg\": \"$TOTALAVG\", \"nsfwScores\": [$OLIST]}"
if [ -f $SPATH ]; then
    rm -rf $SPATH
    rm -rf $FPATH/*.jpg
fi
echo $OSTRING
