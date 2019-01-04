import multiprocessing
import time
import sys
import subprocess
import json
import os

def getSl(model, url):
    mkvPath = "%s.mkv" % model_name
    result = subprocess.Popen(['streamlink', '-Q', url, 'worst', '-o', mkvPath])

if __name__ == '__main__':
    model_name = sys.argv[1]
    try:
        os.remove("%s.mkv" % model_name)
    except OSError:
        pass
    mfcUrl = "https://www.myfreecams.com/#%s" % model_name
    getSl(model_name, mfcUrl)
    time.sleep(10)
    psCmd = "ps -ef |grep '[s]tream'|cut -d' ' -f4"
    result = subprocess.Popen([psCmd], shell=True, stdout=subprocess.PIPE)
    output = result.communicate()[0]
    output = output.decode('utf-8')
    killCmd = "kill -9 %s" % output
    killP = subprocess.Popen([killCmd], shell=True, stdout=subprocess.PIPE)
    print('TERMINATORRRRRR')
