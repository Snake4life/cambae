var MFCSocket = require("MFCSocket");
var MessageType = require('MFCSocket').MFCMessageType;
var JoinChannelMessage = require("MFCSocket").JoinChannelMessage;
var LeaveChannelMessage = require("MFCSocket").LeaveChannelMessage
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
var sessoinInfo = ""
var hlsURL = ""
var cOnline = false
socket.on("loggedIn", function(u){
  getModelInfo( function(){
    //client_log.debug(`modelInfo function called`);
  });
  setSessionInfo(u, function(){

  });
  var command = `bash mfc_id.sh ${modelName}`
  var child = exec(command, function(error, stdout, stderr){
    socket.send(new JoinChannelMessage(u.SessionId, parseInt(modelID)));
  });

});
socket.on("mfcMessage", function(msg){
    if (msg.Type == MessageType.FCTYPE_CMESG){
        try {
          if(msg.Data.nm == modelName || msg.Data.nm == "FCServer"){
            var myfreebae_message_logger = logger.child({ event: 'logging:myfreebae-message', mfc_chat_username: msg.Data.nm, mfc_model: modelName, mfc_model_id: modelID, site: 'mfc', model_username: `${modelName}`, server_chat: 'true'})
            myfreebae_message_logger.info(decodeURIComponent(msg.Data.msg))
          }
          else{
            var myfreebae_message_logger = logger.child({ event: 'logging:myfreebae-message', mfc_chat_username: msg.Data.nm, mfc_model: modelName, mfc_model_id: modelID, site: 'mfc', model_username: `${modelName}`, server_chat: 'false'})
            myfreebae_message_logger.info(decodeURIComponent(msg.Data.msg))
          }

        }
        catch(e){

        }
      }
      if (msg.Type == MessageType.FCTYPE_USERNAMELOOKUP){
        try {

          modelID = msg.Data.uid;
          var camserv = msg.Data.u.camserv;
          request('https://www.myfreecams.com/mfc2/data/serverconfig.js', function (error, response, body) {
            if (error) {
              client_log.error(`error ${error}`);
              throw new Error("Unable to get a list of servers from MFC");
            }
            var mfcServers = JSON.parse(body).h5video_servers;
            var videoServer = mfcServers[camserv];
          });
          var online_log = logger.child({ event: 'logging:myfreebae-online', site: 'mfc', model_username: `${modelName}`, status: `online` })
          if(cOnline == false){
            online_log.info(`${modelName} appears to be online`)
            client_log.info(JSON.stringify(sessoinInfo))
            cOnline = true
          }
          else{
            client_log.info(`attmpted to log online status, but it was already logged before. Skipping`)
          }

        }
        catch(e){
          var min=10;
          var max=20;
          var randomTime =Math.floor(Math.random() * (+max - +min)) + +min;
          var timeInt = parseInt(`${randomTime}00`)
          minutes = 5;
          var the_interval = minutes * 60 * timeInt;
          setTimeout(function(){
            if(cOnline == true){
              client_log.error(`${modelName} appears to be offline or the backend websockets aren't responding. Exiting`);
              cOnline = false
            }
            else{
              client_log.info(`attmpted to log offline status, but it was already logged before. Skipping`)
            }
            var command = `bash mfc_id.sh ${modelName}`
            var child = exec(command, function(error, stdout, stderr){
              socket.send(new LeaveChannelMessage(sessoinInfo.SessionId, parseInt(modelID)));
            });
            var offline_log = logger.child({ event: 'logging:myfreebae-offline', site: 'mfc', model_username: `${modelName}`, status: 'offline' })
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
          if(nsfwScore > 51){
            var naked_logger = logger.child({event: 'logging:myfreebae-tip', tipper: tipper, mfc_model_id: modelID, tip_amount: parseInt(msg.Data.tokens), usd_amount: converted_dollar, mfc_usd_amount: mfc_total_dollars, is_naked: 'true', nsfw_score: nsfwScore, site: 'mfc', model_username: `${modelName}`});
            naked_logger.info(`Tip Amount: ${tip_amount} - Converted to Dollars: ${converted_dollar} - ${modelName} appears to be naked`);
          }
          else{
            var not_naked_logger = logger.child({event: 'logging:myfreebae-tip', tipper: tipper, mfc_model_id: modelID, tip_amount: parseInt(msg.Data.tokens), usd_amount: converted_dollar, mfc_usd_amount: mfc_total_dollars, is_naked: 'false', nsfw_score: nsfwScore, site: 'mfc', model_username: `${modelName}` });
            not_naked_logger.info(`Tip Amount: ${tip_amount} - Converted to Dollars: ${converted_dollar} - ${modelName} does not appear to be naked`);
          }
        }
      });
  }
});

function setSessionInfo(u, callback){
    //client_log.info(`${u}`)
    sessoinInfo = u
    client_log.info(JSON.stringify(sessoinInfo))
    callback();

}
function getModelInfo(callback){
  socket.send(new MFCMessage({ Type: MessageType.FCTYPE_USERNAMELOOKUP, Arg1: 20, Data: `${modelName}` }))
  callback();
}


var status_inter = 1 * 60 * 1000;
setInterval(function() {
  getModelInfo( function(){
    //client_log.debug(`modelInfo function called`);
  });
}, status_inter);
//
