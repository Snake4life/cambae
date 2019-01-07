var MFCSocket = require("MFCSocket");
var MessageType = require('MFCSocket').MFCMessageType;
var JoinChannelMessage = require("MFCSocket").JoinChannelMessage;
var logger = require('pino')({ level: "debug" })
var MFCMessage = require('MFCSocket').MFCMessage;
var socket = new MFCSocket();
var modelName = process.env.MODELNAME
var debugTime = process.env.DEBUG_TIME
var backend = process.env.BACKEND
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
    client_log.debug(`modelInfo function called`);
  });
  var command = `bash mfc_id.sh ${modelName}`
  var child = exec(command, function(error, stdout, stderr){
    socket.send(new JoinChannelMessage(u.SessionId, parseInt(modelID)));
  });

});
socket.on("mfcMessage", function(msg){
    if (msg.Type == MessageType.FCTYPE_CMESG){
        try {
          var myfreebae_message_logger = logger.child({ event: 'logging:myfreebae-message', mfc_chat_username: msg.Data.nm, mfc_model: modelName, mfc_model_id: modelID, site: 'mfc', model_username: `${modelName}`})
          myfreebae_message_logger.info(decodeURIComponent(msg.Data.msg))
        }
        catch(e){

        }
      }
      if (msg.Type == MessageType.FCTYPE_USERNAMELOOKUP){
        try {

          client_log.debug(`new user look up for ${msg.Data.uid}`);
          client_log.debug(`data output for `+ JSON.stringify(msg.Data));
          modelID = msg.Data.uid;
          var camserv = msg.Data.u.camserv;
          client_log.debug(`pulling mfc server list`);
          request('https://www.myfreecams.com/mfc2/data/serverconfig.js', function (error, response, body) {
            if (error) {
              client_log.error(`error ${error}`);
              throw new Error("Unable to get a list of servers from MFC");
            }
            client_log.debug(`setting mfc server config`);
            var mfcServers = JSON.parse(body).h5video_servers;
            var videoServer = mfcServers[camserv];
            setHlsUrl(modelID, videoServer, function(){
              client_log.debug(`hlsurl has been set`);
            });
          });
          var online_log = logger.child({ event: 'logging:myfreebae-online', site: 'mfc', model_username: `${modelName}`, status: `online` })
          online_log.info(`${modelName} appears to be online`)
        }
        catch(e){
          var min=10;
          var max=20;
          var randomTime =Math.floor(Math.random() * (+max - +min)) + +min;
          var timeInt = parseInt(`${randomTime}00`)
          minutes = 5;
          var the_interval = minutes * 60 * timeInt;
          client_log.error(`${modelName} appears to be offline or the backend websockets aren't responding. Waiting ${the_interval} before trying again (yay for random sleeps to fix bad code)`);
          setTimeout(function(){
            client_log.error(`${modelName} appears to be offline or the backend websockets aren't responding. Exiting`);
            var offline_log = logger.child({ event: 'logging:myfreebae-offline', site: 'mfc', model_username: `${modelName}`, status: 'offline' })
            offline_log.info(`${modelName} appears to be offline`)
            process.exit(1);
          }, the_interval);

        }
      }
});

socket.on("mfcMessage", function(msg){

  if (msg.Type == MessageType.FCTYPE_TOKENINC){
    var datetime = (new Date).getTime();
    var tipper = msg.Data.u[msg.Data.u.length-1]
    request.post({
      headers: {'content-type' : 'application/x-www-form-urlencoded'},
      url: `http://${backend}:6902/mfc-status/${modelName}`,
      body: "hi=heh"
    },function(error, response, body){
        console.log(body);
        resp = JSON.parse(body);
        console.log(resp)
        score = resp['nsfwAvg'].toString();
        nsfwScore = parseInt(score);
        tip_amount = parseInt(msg.Data.tokens);
        converted_dollar = tip_amount * .05
        mfc_total_dollars = tip_amount * .085483
        if(!isNaN(nsfwScore)){
          ai_log.info(`AI Detected a NSFW Score of ${nsfwScore}%`);
          if(nsfwScore > 51){
            naked_logger = logger.child({event: 'logging:myfreebae-tip', tipper: tipper, mfc_model_id: modelID, tip_amount: parseInt(msg.Data.tokens), usd_amount: converted_dollar, mfc_usd_amount: mfc_total_dollars, is_naked: 'true', nsfw_score: nsfwScore, site: 'mfc', model_username: `${modelName}`});
            naked_logger.info(`Tip Amount: ${tip_amount} - Converted to Dollars: ${converted_dollar} - ${modelName} appears to be naked`);
          }
          else{
            not_naked_logger = logger.child({event: 'logging:myfreebae-tip', tipper: tipper, mfc_model_id: modelID, tip_amount: parseInt(msg.Data.tokens), usd_amount: converted_dollar, mfc_usd_amount: mfc_total_dollars, is_naked: 'false', nsfw_score: nsfwScore, site: 'mfc', model_username: `${modelName}` });
            not_naked_logger.info(`Tip Amount: ${tip_amount} - Converted to Dollars: ${converted_dollar} - ${modelName} does not appear to be naked`);
          }
        }
      });
  }
});

function setHlsUrl(modelID, videoServer, callback){
    var publicChannelId = 100000000 + modelID;
    hlsURL = `https://${videoServer}.myfreecams.com/NxServer/ngrp:mfc_${publicChannelId}.f4v_desktop/manifest.mpd`
  callback();

}
function getModelInfo(callback){
  socket.send(new MFCMessage({ Type: MessageType.FCTYPE_USERNAMELOOKUP, Arg1: 20, Data: `${modelName}` }))
  callback();
}


minutes = 5;
if(debugTime == "true"){
   var the_interval = 5 * 1000;
}
else {
  var the_interval = 5 * 60 * 1000;
}
var firstNaked = 0;

setInterval(function() {
  request.post({
    headers: {'content-type' : 'application/x-www-form-urlencoded'},
    url: `http://${backend}:6902/mfc-status/${modelName}`,
    body: "hi=heh"
  },function(error, response, body){
      console.log(body);
      resp = JSON.parse(body);
      score = resp['nsfwAvg'].toString();
      nsfwScore = parseInt(score);
      if(!isNaN(nsfwScore)){
        ai_log.info(`AI Detected a NSFW Score of ${nsfwScore}%`);
        if(nsfwScore > 51){
          naked_logger = logger.child({event: 'logging:myfreebae-naked', model_username: modelName, mfc_model_id: modelID, is_naked: 'true'}) //nsfw_score: nsfwScore, site: 'mfc', model_username: `${modelName}`});
          naked_logger.info(`${modelName} appears to be naked`);
        }
        else{
          naked_logger = logger.child({event: 'logging:myfreebae-naked', model_username: modelName, mfc_model_id: modelID, is_naked: 'false'}) //nsfw_score: nsfwScore, site: 'mfc', model_username: `${modelName}`});
          naked_logger.info(`${modelName} appears to NOT be naked`);
        }
      }
    });
}, the_interval);

var status_inter = 1 * 60 * 1000;
setInterval(function() {
  getModelInfo( function(){
    client_log.debug(`modelInfo function called`);
  });  
}, status_inter);
//
