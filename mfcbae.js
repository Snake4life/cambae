var MFCSocket = require("MFCSocket");
var MessageType = require('MFCSocket').MFCMessageType;
var JoinChannelMessage = require("MFCSocket").JoinChannelMessage;
var logger = require('pino')()
var MFCMessage = require('MFCSocket').MFCMessage;
var socket = new MFCSocket();
var modelName = process.env.MODELNAME
var debugTime = process.env.DEBUG_TIME
var modelID = ""
var request = require("request");
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var client_log = logger.child({ event: 'logging:myfreebae-client' , site: 'mfc', model_username: `${modelName}` })
var nudity_log = logger.child({ event: 'logging:myfreebae-nude', site: 'mfc', model_username: `${modelName}` })
var ai_log = logger.child({ event: 'logging:myfreebae-ai', site: 'mfc', model_username: `${modelName}` })
var hlsURL = ""
socket.on("loggedIn", function(u){
  getModelInfo( function(){
    client_log.info(`hlsurl has been set`);
  });
    var command = `bash mfc_id.sh ${modelName}`
    var child = exec(command, function(error, stdout, stderr){
      socket.send(new JoinChannelMessage(u.SessionId, parseInt(modelID)));
    });

});
socket.on("mfcMessage", function(msg){
  //console.log(msg)

    if (msg.Type == MessageType.FCTYPE_CMESG){
        //ar message = JSON.stringify(msg.Data);
        try {
          var myfreebae_message_logger = logger.child({ event: 'logging:myfreebae-message', mfc_chat_username: msg.Data.nm, mfc_model: modelName, mfc_model_id: modelID, site: 'mfc', model_username: `${modelName}`})
          //console.log(msg.Data)
          //myfreebae_message_logger.info(msg.Data)
          myfreebae_message_logger.info(decodeURIComponent(msg.Data.msg))
        }
        catch(e){

        }
      }
if (msg.Type == MessageType.FCTYPE_USERNAMELOOKUP){
  try {
    client_log.info(`new user look up for ${msg.Data.uid}`);
    modelID = msg.Data.uid;
    var camserv = msg.Data.u.camserv;
    client_log.info(`pulling mfc server list`);
    request('https://www.myfreecams.com/mfc2/data/serverconfig.js', function (error, response, body) {
        if (error) {
            client_log.info(`error ${error}`);
            throw new Error("Unable to get a list of servers from MFC");
        }
        client_log.info(`setting mfc server config`);
        var mfcServers = JSON.parse(body).h5video_servers;
        var videoServer = mfcServers[camserv];
        setHlsUrl(`https://${videoServer}.myfreecams.com/NxServer/ngrp:mfc_10${modelID}.f4v_desktop/manifest.mpd`, videoServer, function(){
          client_log.info(`hlsurl has been set`);
        });
    });
  }
catch(e){
  client_log.info(`${modelName} appears to be offline or the backend websockets aren't responding`);
}
}
});
function setHlsUrl(url, videoServer, callback){
  request(url, function (error, response, body) {
    if(response.statusCode == 404){
      hlsURL = `https://${videoServer}.myfreecams.com/NxServer/ngrp:mfc_1${modelID}.f4v_desktop/manifest.mpd`
    }
    else{
      hlsURL = `https://${videoServer}.myfreecams.com/NxServer/ngrp:mfc_10${modelID}.f4v_desktop/manifest.mpd`
    }

  });
  callback();

}
function getModelInfo(callback){
  socket.send(new MFCMessage({ Type: MessageType.FCTYPE_USERNAMELOOKUP, Arg1: 20, Data: `${modelName}` }))
  callback();
}
socket.on("mfcMessage", function(msg){

  if (msg.Type == MessageType.FCTYPE_TOKENINC){
    var datetime = (new Date).getTime();
    var tipper = msg.Data.u[msg.Data.u.length-1]
    var command = `bash bash_scripts/all.sh ${modelName} ${datetime} ${hlsURL}`
    var child = spawn('bash', ['bash_scripts/all.sh', `${modelName}`, `${datetime}`, `${hlsURL}`])
    child.on('error', err => nudity_log.error('Error:', err));
    child.on('exit', () => {

      child.stdout.on('data', (data) => {
      nudity_log.info(`background nudity worker exited gracefully`);
        score = data.toString();
        score = score*100
        nsfwScore = parseInt(score);
        if(isNaN(nsfwScore)){
          ai_log.info(`NSFW score returned NaN, skipping`);
        }
        else{
          ai_log.info(`AI Detected a NSFW Score of ${nsfwScore}%`);
          if(nsfwScore > 51){
            naked_logger = logger.child({event: 'logging:myfreebae-tip', tipper: tipper, mfc_model: modelName, mfc_model_id: modelID, tip_amount: parseInt(msg.Data.tokens), is_naked: 'true', nsfw_score: nsfwScore, site: 'mfc', model_username: `${modelName}`});
            naked_logger.info(`${modelName} appears to be naked`);
          }
          else{
            not_naked_logger = logger.child({event: 'logging:myfreebae-tip', tipper: tipper, mfc_model: modelName, mfc_model_id: modelID, tip_amount: parseInt(msg.Data.tokens), is_naked: 'false', nsfw_score: nsfwScore, site: 'mfc', model_username: `${modelName}` });
            not_naked_logger.info(`${modelName} does not appear to be naked`);
          }
        }


    });
      });
  }
});
minutes = 5;
if(debugTime == "true"){
   var the_interval = 5 * 1000;
}
else {
  var the_interval = minutes * 60 * 1000;
}
var firstNaked = 0;

setInterval(function() {
  var datetime = (new Date).getTime();
  var command = `bash bash_scripts/all.sh ${modelName} ${datetime} ${hlsURL}`
  //var child = exec(command, function(error, stdout, stderr){
  var child = spawn('bash', ['bash_scripts/all.sh', `${modelName}`, `${datetime}`, `${hlsURL}`])
  child.on('error', err => nudity_log.error('Error:', err));
  child.on('exit', () => {
    child.stdout.on('data', (data) => {
      var score = data.toString();
      score = score*100
      nsfwScore = parseInt(score);
      ai_log.info(`AI Detected a NSFW Score of ${nsfwScore}%`);
      if(nsfwScore > 51){
        naked_logger = logger.child({event: 'logging:myfreebae-naked', is_naked: 'true', nsfw_score: `${nsfwScore}`, site: 'mfc', model_username: `${modelName}`});
        naked_logger.info(`${modelName} appears to be naked`);
        if(firstNaked < 1){
          ai_log.info(`First time seen naked: ${firstNaked}`);
        }
        else{
          //ai_log.child({ is_naked: 'false' })
          ai_log.info(`${modelName} - Seen naked recently: ${firstNaked}`);
        }
        firstNaked += 1;
      }
      else{
        not_naked_logger = logger.child({event: 'logging:myfreebae-not-naked', is_naked: 'false' , site: 'mfc', model_username: `${modelName}`, nsfw_score: nsfwScore});
        not_naked_logger.info(`${modelName} does not appear to be naked`);
        if(firstNaked > 10){
            ai_log.info(`irc post timeout reached for ${modelName}. Resetting counter`);
          firstNaked = 0;
        }
      }
    //child.stdout.on('data', data => nudity_log.info(data));
  });
  });
}, the_interval);
