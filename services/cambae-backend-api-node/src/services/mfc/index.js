//import request from 'request-promise'
var exec = require('child_process').exec
var spawn = require('child_process').spawn
import Promise from 'bluebird'
var request = require('request');

function getNude (model_name, callback){
  var filename = './src/services/bash_scripts/streamlink.sh'
  var mkvPath = `./src/services/bash_scripts/models/${model_name}.mkv`
  var mfcUrl = `https://www.myfreecams.com/${model_name}`
  var filePath = './src/services/bash_scripts/models/'
  var args = ` ${mfcUrl} ${model_name}`
  var end = ''
  //result = subprocess.run(['bash', '/usr/src/app/app/scripts/streamlink.sh', mkvPath, mfcUrl, model_name], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
  var child = spawn('bash', [filename, mkvPath, mfcUrl, model_name, filePath])
    // Do async job
    child.stdout.on('data', (data) => {
        end = data.toString()
    })
    child.on('exit', () => {
      callback(end);
  })
}
function getStatus (model_name, callback){
  var r = request.get(`https://mfc.im/${model_name}`, function (err, res, body) {
    if(r.uri.href.includes('profiles')){
      callback(`{"model_status": "offline"}`)
    }
    else{
      callback(`{"model_status": "online"}`)
    }
  });
}
var Nude = {
  get: function(model_name, callback) {
    //var video = getVideo(model_name)
    getNude(model_name, function(data){
      callback(null, data)
    });

  }

};
const nudeFunct = Promise.promisify(Nude.get)
var Status = {
  get: function(model_name, callback) {
    //var video = getVideo(model_name)
    getStatus(model_name, function(data){
      callback(null, data)
    });

  }

};
const statusFunct = Promise.promisify(Status.get)
export const stat = (model_name) => statusFunct(model_name)
export const nude = (model_name) => nudeFunct(model_name)
