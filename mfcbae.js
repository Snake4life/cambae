var MFCSocket = require("MFCSocket");
var MessageType = require('MFCSocket').MFCMessageType;
var JoinChannelMessage = require("MFCSocket").JoinChannelMessage;
var logger = require('pino')({ level: "debug" })
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
            process.exit(1);
          }, the_interval);

        }
      }
});

socket.on("mfcMessage", function(msg){

  if (msg.Type == MessageType.FCTYPE_TOKENINC){
    var datetime = (new Date).getTime();
    var tipper = msg.Data.u[msg.Data.u.length-1]
    var child = spawn('bash', ['bash_scripts/all.sh', `${modelName}`, `${datetime}`, `${hlsURL}`])
    child.on('error', err => nudity_log.error('Error:', err));
    child.on('exit', () => {
      nudity_log.debug(`background nudity worker exited without throwing error`);
      child.stdout.on('data', (data) => {
        score = data.toString();
        score = score*100
        nsfwScore = parseInt(score);
        tip_amount = parseInt(msg.Data.tokens);
        converted_dollar = tip_amount * .05
        if(!isNaN(nsfwScore)){
          ai_log.info(`AI Detected a NSFW Score of ${nsfwScore}%`);
          if(nsfwScore > 51){
            naked_logger = logger.child({event: 'logging:myfreebae-tip', tipper: tipper, mfc_model: modelName, mfc_model_id: modelID, tip_amount: parseInt(msg.Data.tokens), usd_amount: converted_dollar, is_naked: 'true', nsfw_score: nsfwScore, site: 'mfc', model_username: `${modelName}`});
            naked_logger.info(`Tip Amount: ${tip_amount} - Converted to Dollars: ${converted_dollar} - ${modelName} appears to be naked`);
          }
          else{
            not_naked_logger = logger.child({event: 'logging:myfreebae-tip', tipper: tipper, mfc_model: modelName, mfc_model_id: modelID, tip_amount: parseInt(msg.Data.tokens), usd_amount: converted_dollar, is_naked: 'false', nsfw_score: nsfwScore, site: 'mfc', model_username: `${modelName}` });
            not_naked_logger.info(`Tip Amount: ${tip_amount} - Converted to Dollars: ${converted_dollar} - ${modelName} does not appear to be naked`);
          }
        }


    });
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
  var the_interval = minutes * 60 * 1000;
}
var firstNaked = 0;

//setInterval(function() {
//  var datetime = (new Date).getTime();
//  var command = `bash bash_scripts/all.sh ${modelName} ${datetime} ${hlsURL}`
//  //var child = exec(command, function(error, stdout, stderr){
//  var child = spawn('bash', ['bash_scripts/all.sh', `${modelName}`, `${datetime}`, `${hlsURL}`])
//  child.on('error', err => nudity_log.error('Error:', err));
//  child.on('exit', () => {
//    child.stdout.on('data', (data) => {
//      var score = data.toString();
//      score = score*100
//      nsfwScore = parseInt(score);
//      ai_log.info(`AI Detected a NSFW Score of ${nsfwScore}%`);
//      if(nsfwScore > 51){
//        naked_logger = logger.child({event: 'logging:myfreebae-naked', is_naked: 'true', nsfw_score: `${nsfwScore}`, site: 'mfc', model_username: `${modelName}`});
//        naked_logger.info(`${modelName} appears to be naked`);
//        if(firstNaked < 1){
//          ai_log.info(`First time seen naked: ${firstNaked}`);
//        }
//        else{
//          //ai_log.child({ is_naked: 'false' })
//          ai_log.info(`${modelName} - Seen naked recently: ${firstNaked}`);
//        }
//        firstNaked += 1;
//      }
//      else{
//        not_naked_logger = logger.child({event: 'logging:myfreebae-not-naked', is_naked: 'false' , site: 'mfc', model_username: `${modelName}`, nsfw_score: nsfwScore});
//        not_naked_logger.info(`${modelName} does not appear to be naked`);
//        if(firstNaked > 10){
//            ai_log.info(`irc post timeout reached for ${modelName}. Resetting counter`);
//          firstNaked = 0;
//        }
//      }
//    //child.stdout.on('data', data => nudity_log.info(data));
//  });
//  });
//}, the_interval);
//
