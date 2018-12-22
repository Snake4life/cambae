set -x
ROOMID="$(curl -s $(echo "https://www.myfreecams.com/#$1" | awk '{sub(/www/,"profiles"); sub(/#/,""); print $0}') | awk -F/ '/\/[0-9]{7,8}\//{print $6; exit}')"

if [ ${#ROOMID} -eq 7 ]; then
        PREFIX="10"; else
        PREFIX="1"
fi
echo $ROOMID
