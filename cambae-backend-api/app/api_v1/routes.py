from flask_restplus import Resource, reqparse
import requests
import json
import sys
import time
import subprocess
import base64
import os
import glob
from functools import reduce
from base64 import b64encode

from . import api
def printDebug(message):
    print(message, file=sys.stderr)

class Status(Resource):
    def get(self):
        return {
            "status": "Up and running"
        }, 200


class DB(Resource):
    def get(self):
        return {
            "db": "len(user)"
        }, 200

class MFCOnline(Resource):
    def get(self, model_name):
        mfcURL = "https://mfc.im/%s" % model_name
        response = requests.get(mfcURL)
        onlineStatus = ""
        if 'profiles' in response.url:
            onlineStatus = "offline"
            print('offline', file=sys.stderr)
            print(response.url, file=sys.stderr)
        else:
            onlineStatus = "online"
            print('online', file=sys.stderr)
            print(response.url, file=sys.stderr)
        return {
            "model_name": "%s" % model_name,
            "model_status": "%s" % onlineStatus
        }, 200
class MFCNaked(Resource):
    def get(self, model_name):
        onlineUrl = 'http://watcher4.backend.chaturbae.tv:6901/api/v1/mfc/online/'+model_name
        response = requests.get(onlineUrl)
        rJson = json.loads(response.text)
        modelStatus = rJson['model_status']
        printDebug(modelStatus)
        if modelStatus == "online":
            printDebug('seems like shes online')
            try:
                os.remove("/usr/src/app/data/models/%s.mkv" % model_name)
                files = glob.glob("/usr/src/app/data/models/" + model_name + "*.jpg")
                for file in files:
                    os.remove(file)
            except OSError:
                pass
            mfcUrl = "https://www.myfreecams.com/%s" % model_name
            mkvPath = "/usr/src/app/data/models/%s.mkv" % model_name
            result = subprocess.run(['bash', '/usr/src/app/app/scripts/streamlink.sh', mkvPath, mfcUrl, model_name], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            output = result
            for i in range(1, 10):
                timest = i + 3
                if i < 10:
                    timecode = "00:00:0%d"
                else:
                    timecode = "00:00:%d"
                ffmpegCommand = "ffmpeg -loglevel panic -ss %s -i %s -frames:v 1 -f image2 /usr/src/app/data/models/%s-%d.jpg" % (timest, mkvPath, model_name, i)
                p = subprocess.Popen([ffmpegCommand], shell=True, stdout=subprocess.PIPE)
                (output, err) = p.communicate()
                p_status = p.wait()

            #os.chdir("/mydir")
            urlList = []
            nsfwScoreList = []
            for file in glob.glob("/usr/src/app/data/models/*.jpg"):
                headers = {"Authorization": "Client-ID 110cd2d2abefaf9"}
                url = "https://api.imgur.com/3/image"
                imgur = requests.post(
                    url,
                    headers = headers,
                    data = {
                        'image': b64encode(open(file, 'rb').read()),
                        'type': 'base64'
                    }
                )
                imgurJson = json.loads(imgur.text)
                urlList.append(imgurJson['data']['link'])
                url = "http://watcher4.backend.chaturbae.tv:5000"
                files = {'file': open(file, 'rb')}
                nakedAPI = requests.post(url, files=files)
                nakedScore = json.loads(nakedAPI.text)
                nakedScore = nakedScore['score']
                nakedScore = nakedScore * 100
                nsfwScoreList.append(nakedScore)
                printDebug(nakedAPI.text)
            printDebug(nsfwScoreList)
            printDebug(urlList)
            nsfwAverage = reduce(lambda x, y: x + y, nsfwScoreList) / len(nsfwScoreList)
            if nsfwAverage > 40:
                nude = 'true'
            else:
                nude = 'false'
             #return {
             #    "tst": 'yo fuck this shit'
             #}
            files = glob.glob("/usr/src/app/data/models/" + model_name + "*.jpg")
            for file in files:
                os.remove(file)
            return {
                "captured_screenshot_list": urlList,
                "nude_detection_score_list": json.dumps(nsfwScoreList),
                "average_nude_score": nsfwAverage,
                "is_nude": nude
            }, 200
        else:
            printDebug('idk what went wrong')
            return {
                "model_status": 'offline'
            }, 200
api.add_resource(Status, '/status')
api.add_resource(MFCOnline, '/mfc/online/<model_name>')
api.add_resource(MFCNaked, '/mfc/naked/<model_name>')
