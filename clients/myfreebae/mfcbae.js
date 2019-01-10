var MFCSocket = require("MFCSocket");
var MessageType = require('MFCSocket').MFCMessageType;
var VideoState = require('MFCSocket').MFCVideoState
var MFCChatOpt = require("MFCSocket").MFCChatOpt;
var JoinChannelMessage = require("MFCSocket").JoinChannelMessage;
var LeaveChannelMessage = require("MFCSocket").LeaveChannelMessage
var UserLookup = require("MFCSocket").UserLookup;
var logger = require('pino')({ level: "debug" })
var MFCMessage = require('MFCSocket').MFCMessage;
var socket = new MFCSocket();
var modelName = process.env.MODELNAME
var debugTime = process.env.DEBUG_TIME
var backend = process.env.BACKEND
var modelID = ""
var sessionId = ""
var request = require("request");
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var nudity_log = logger.child({ event: 'logging:myfreebae-nude', site: 'mfc', model_username: `${modelName}` })
var ai_log = logger.child({ event: 'logging:myfreebae-ai', site: 'mfc', model_username: `${modelName}` })
var client_log = logger.child({ event: 'logging:myfreebae-client' , site: 'mfc', model_username: `${modelName}` })
var sessionId = ""
var hlsURL = ""
var cOnline = false
var client_log
var roomCount=""
var roomRank=""
var cModelAge=""
var cModelEthnic=""
var cModelMissMfc=""
var cModelCountry=""
var cModelNew=""
var rMeta=""
socket.on("loggedIn", function(u){
  socket.send(new MFCMessage({ Type: MessageType.FCTYPE_USERNAMELOOKUP, Arg1: 20, Data: `${modelName}` }))
  setSessionInfo(u, function(){

  })

});
socket.on("mfcMessage", function(msg){
    if (msg.Type == MessageType.FCTYPE_CMESG){
        try {
          if(msg.Data.nm == modelName || msg.Data.nm == "FCServer" || msg.Data.nm == "CharlesBot"){
            server_chat="true"
          }
          else{
            server_chat="false"
          }
          logger.child({ event: 'logging:myfreebae-message', chat_username: msg.Data.nm, model_id: modelID, site: 'mfc', model_username: `${modelName}`, room_count: `${roomCount}`, room_rank: roomRank, server_chat: server_chat, model_age: cModelAge, model_ethnicity: cModelEthnic, model_was_miss_mfc: cModelMissMfc, model_country: cModelCountry, model_new: cModelNew}).info(decodeURIComponent(msg.Data.msg))
        }
        catch(e) {}
      }

    if (msg.Type == MessageType.FCTYPE_USERNAMELOOKUP){
      if(checkIfOnline.didRun != true && (msg.Data.vs == '0' || msg.Data.vs == '127')){
        socket.send(new JoinChannelMessage(sessionId, parseInt(msg.Data.uid)));
      }
      checkIfOnline(msg, function() {} )
    }

    if (msg.Type == MessageType.FCTYPE_TOKENINC){
      var datetime = (new Date).getTime();
      var tipper = msg.Data.u[msg.Data.u.length-1]
      request.post({
        headers: {'content-type' : 'application/x-www-form-urlencoded'},
        url: `http://${backend}:6902/mfc-status/${modelName}`,
        body: "hi=heh"
      },function(error, response, body){
          resp = JSON.parse(body);
          score = resp['nsfwAvg'].toString();
          nsfwScore = parseInt(score);
          tip_amount = parseInt(msg.Data.tokens);
          converted_dollar = tip_amount * .05
          mfc_total_dollars = tip_amount * .085483
          if(!isNaN(nsfwScore)){
            if(nsfwScore > 51){
              var naked_logger = logger.child({event: 'logging:myfreebae-tip', model_username: `${modelName}`, tipper: tipper, model_id: modelID, tip_amount: parseInt(msg.Data.tokens), usd_amount: converted_dollar, mfc_usd_amount: mfc_total_dollars, is_naked: 'true', nsfw_score: nsfwScore, room_count: roomCount, room_rank: roomRank, model_age: cModelAge, model_ethnicity: cModelEthnic, model_was_miss_mfc: cModelMissMfc, model_country: cModelCountry, model_new: cModelNew, site: 'mfc'});
              naked_logger.info(`Tip Amount: ${tip_amount} - Converted to Dollars: ${converted_dollar} - ${modelName} appears to be naked`);
            }
            else{
              var not_naked_logger = logger.child({event: 'logging:myfreebae-tip', model_username: `${modelName}`, tipper: tipper, mfc_model_id: modelID, tip_amount: parseInt(msg.Data.tokens), usd_amount: converted_dollar, mfc_usd_amount: mfc_total_dollars, is_naked: 'false', nsfw_score: nsfwScore, room_count: roomCount, room_rank: roomRank, model_age: cModelAge, model_ethnicity: cModelEthnic, model_was_miss_mfc: cModelMissMfc, model_country: cModelCountry, model_new: cModelNew, site: 'mfc' });
              not_naked_logger.info(`Tip Amount: ${tip_amount} - Converted to Dollars: ${converted_dollar} - ${modelName} does not appear to be naked`);
            }
          }
        });
    }
});

function checkIfOnline(data, callback){
    modelID = data.Data.uid
    camVS = data.Data.vs
    if(camVS == '127'){
      checkIfOnline.status = false
      var min=10;
      var max=20;
      var randomTime =Math.floor(Math.random() * (+max - +min)) + +min;
      var timeInt = parseInt(`${randomTime}00`)
      minutes = 5;
      var the_interval = minutes * 60 * timeInt;
      setTimeout(function(){
        //if(cOnline == true){
          client_log.error(`${modelName} appears to be offline or the backend websockets aren't responding. Exiting`);
          cOnline = false
        //}
        socket.send(new LeaveChannelMessage(sessionId, parseInt(modelID)));
        var offline_log = logger.child({ event: 'logging:myfreebae-offline', site: 'mfc', model_username: `${modelName}`, status: 'offline' })
      }, the_interval);

    }
    if(camVS == '90' || camVS == '0'){
      roomMetaData(data, function(){ })
      //if(cOnline == false){
        checkIfOnline.status = true
        var online_log = logger.child({ event: 'logging:myfreebae-online', site: 'mfc', model_username: `${modelName}`, status: `online`, room_count: roomCount, room_rank: roomRank, model_age: cModelAge, model_ethnicity: cModelEthnic, model_was_miss_mfc: cModelMissMfc, model_country: cModelCountry, model_new: cModelNew})
        online_log.info(`${modelName} is online`)
        cOnline = true
      //}

    }
    checkIfOnline.didRun = true
    callback (data);

}
function roomMetaData(d, callback){
  roomCount = !roomCount ? -1 : d.Data.m.rc;
  roomRank = !roomRank ? -1 : d.Data.m.rank;
  cModelAge = !cModelAge ? 'unknown' : d.Data.u.age
  cModelEthnic = !cModelEthnic ? 'unknown' : d.Data.u.ethnic
  cModelMissMfc = !cModelMissMfc ? 'unknown' : d.Data.m.missmfc
  cModelCountry = !cModelCountry ? 'unknown' : d.Data.u.country
  cModelNew = !cModelNew ? 'unknown': d.Data.m.new_model
  callback();

}
function exposeRMeta (d, callback){
  rMeta = d
  callback(d)
}
function setSessionInfo(u, callback){
    sessionId = u.SessionId
    callback (sessionId);

}
function getModelInfo(u, callback){
  sessionId = u.SessionId
  callback(u);
}

var status_inter = 1 * 15 * 1000;
setInterval(function() {
  socket.send(new MFCMessage({ Type: MessageType.FCTYPE_USERNAMELOOKUP, Arg1: 20, Data: `${modelName}` }))
}, status_inter);
