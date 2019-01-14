 /**
  *
  * Description. Client part of the myfreecams data watcher/consumer.
  *   functions located herein are resonsible for consuming the data sent by the mfc websocket, and parsing it into usable info
  *
  * @link   https://github.com/patrick-hudson/cambae
  * @file   This file defines the mfcbae client.
  * @author Patrick Hudson.
  * @copyright 2019 - Patrick Hudson
  */


 var MFCSocket = require("MFCSocket");
 var MessageType = require('MFCSocket').MFCMessageType;
 var VideoState = require('MFCSocket').MFCVideoState
 var MFCChatOpt = require("MFCSocket").MFCChatOpt;
 var JoinChannelMessage = require("MFCSocket").JoinChannelMessage;
 var LeaveChannelMessage = require("MFCSocket").LeaveChannelMessage
 var UserLookup = require("MFCSocket").UserLookup;
 var MFCMessage = require('MFCSocket').MFCMessage;
 var socket = new MFCSocket();
 var request = require("request");
 var exec = require('child_process').exec;
 var spawn = require('child_process').spawn;

 /**
  *
  * m_user - mfc user name
  * m_id = mfc room id
  * sess_id - session id that was generated when joining an mfc room
  *
  */

 var m_user = process.env.MODEL_USERNAME
 var m_id = ""
 var sess_id = ""

 /**
  *
  * setting of misc globals
  *
  */

 var debugTime = process.env.DEBUG_TIME
 var backend = process.env.BACKEND
 var cOnline = false
 var room_joined = false
 var roomCount;
 var roomRank
 var cModelAge
 var cModelEthnic
 var cModelMissMfc
 var cModelCountry
 var cModelNew
 var rMeta = ""
 var onlineButNotInRoom = 0
 /**
  *
  * pino logger
  * Description. Create several logging instances to send data to stdout.
  *
  */

 var logger = require('pino')({
     level: "debug"
 })

 /**
  *
  * Description. Listens for the 'loggedIn' event triggered by the MFCSocket module
  * requires: m_user
  *
  */

 socket.on("loggedIn", function(u) {
     socket.send(new MFCMessage({
         Type: MessageType.FCTYPE_USERNAMELOOKUP,
         Arg1: 20,
         Data: `${m_user}`
     }))
     setSessionInfo(u, function() {

     })

 });

 /**
  *
  * Description. Listens for the 'mfcMessage' event triggered by the MFCSocket module
  *
  */

 socket.on("mfcMessage", function(msg) {

     //event == chat room message
     if (msg.Type == MessageType.FCTYPE_CMESG) {
         try {
             // check to see if the chat message come from a user, or either the owner of the room, a bot (CharlesBot), or mfc (FCServer)
             if (msg.Data.nm == m_user || msg.Data.nm == "FCServer" || msg.Data.nm == "CharlesBot") {
                 server_chat = "true"
                 room_joined = true
             } else {
                 server_chat = "false"
             }
             sendLog({level: 'info', event: 'chat', chat_username: msg.Data.nm, server_chat: server_chat, data_msg: decodeURIComponent(msg.Data.msg)})
         } catch (e) {}
     }
     // event = username lookup
     // returns with m_id
     if (msg.Type == MessageType.FCTYPE_USERNAMELOOKUP) {
       try{
        if (typeof(msg.Data.u) == 'undefined') {
         if (typeof(msg.Data.u.camserv) == 'undefined') {
           msg.Data.u.camserv = 0
         }
       }
       }
       catch(e){

       }

         if (typeof(msg.Data) === 'undefined') {
             sendLog({level: 'debug', event: 'offline', data_msg:`${m_user} - unable to determine online status, skipping lookup - model is probably offline`})
         } else {
             try {
                 roomMetaData(msg, function() {

                 })
                 //console.log(msg)
                 if (checkIfOnline.didRun != true && (msg.Data.vs != '127')) {
                   if(msg.Data.u.camserv != 0){
                     socket.send(new JoinChannelMessage(sess_id, parseInt(msg.Data.uid)));
                     sendLog({level: 'debug', event: 'room_join', data_msg: `${m_user} - detected first run after joining room`})
                   }
                 }

                 checkIfOnline(msg, function() {})
             } catch (e) {
                 sendLog({level: 'debug', event: 'exception', exception: e, data_msg: `${m_user} - unable to determine online status, skipping lookup - model is probably offline`})
             }
         }
     }
     //event tip
     if (msg.Type == MessageType.FCTYPE_TOKENINC) {
         var datetime = (new Date).getTime();
         var tipper = msg.Data.u[msg.Data.u.length - 1]
         checkIfOnline(msg, function() {})
             //checking to see if the model is nude when tip arrived
         request.post({
             headers: {
                 'content-type': 'application/x-www-form-urlencoded'
             },
             url: `http://api.backend.svc.cluster.local:6902/mfc-status/${m_user}`,
             body: "hi=heh"
         }, function(error, response, body) {
             resp = JSON.parse(body);
             score = resp['nsfwAvg'].toString();
             nsfwScore = parseInt(score);
             tip_amount = parseInt(msg.Data.tokens);
             converted_dollar = tip_amount * .05
             mfc_total_dollars = tip_amount * .085483
             nsfwLogDefault = {
               level: 'info',
               event: 'tip',
               tipper: tipper,
               tip_amount: parseInt(msg.Data.tokens),
               usd_amount: converted_dollar,
               mfc_usd_amount: mfc_total_dollars,
               nsfw_score: nsfwScore
             }
             if (!isNaN(nsfwScore)) {
                 if (nsfwScore > 51) {
                   nsfwLogDefault.is_nude = 'true'
                   nsfwLogDefault.data_msg = `Tip Amount: ${tip_amount} - Converted to Dollars: ${converted_dollar} - ${m_user} detected nude`
                   sendLog(nsfwLogDefault)
                 } else {
                   nsfwLogDefault.is_nude = 'false'
                   nsfwLogDefault.data_msg = `Tip Amount: ${tip_amount} - Converted to Dollars: ${converted_dollar} - ${m_user} NOT detected nude`
                   sendLog(nsfwLogDefault)
                 }
             }
         });
     }
 });
 /**
  * Description. checks if m_user is online, and logs the result
  *
  * @param {string} data - json object that gets returned when a username lookup is called
  * @example
  *     {
  *     Type: 10,
  *     From: '',
  *     To: '',
  *     Arg1: '20',
  *     Arg2: '0',
  *     Data:
  *      { lv: INT,
  *        nm: 'STRING',
  *        pid: 1,
  *        sid: FLOAT,
  *        uid: FLOAT,
  *        vs: INT,
  *        u:
  *         { age: INT,
  *           avatar: INT,
  *           blurb: 'STRING',
  *           camserv: INT,
  *           chat_bg: INT,
  *           chat_color: 'STRING',
  *           chat_font: INT,
  *           chat_opt: INT,
  *           country: 'STRING',
  *           creation: TIMESTAMP,
  *           ethnic: 'STRING',
  *           photos: INT,
  *           profile: INT,
  *           status: '' },
  *        m:
  *         { camscore: INT,
  *           continent: 'EU',
  *           flags: INT,
  *           hidecs: true,
  *           kbit: INT,
  *           lastnews: INT,
  *           mg: INT,
  *           missmfc: INT,
  *           new_model: INT,
  *           rank: INT,
  *           rc: INT,
  *           sfw: INT,
  *           topic:
  *            'URI_ENCODED_STRING'
  *         },
  *        x: { fcext: [Object], share: [Object] } },
  *     asMFCMessage: [Function: asMFCMessage] }
  *
  *
  * @return {function} callback()
  */
 function checkIfOnline(data, callback) {
     //model id and modesl status (vs)
     m_id = data.Data.uid
     m_vs = data.Data.vs
     m_cs = data.Data.u.camserv
     //model in private
     var statusLogDefault = {

     }
     if (m_vs == '12') {
         checkIfOnline.status = true
         roomMetaData(data, function() {

         })
         sendLog({level: 'info', event: 'status', status: 'private', data_msg: `${m_user} is in private show`})
         cOnline = true
     }
     //model in public
     if ((m_vs == '90' || m_vs == '0') && m_cs != 0) {
         roomMetaData(data, function() {

         })
         checkIfOnline.status = true
         sendLog({level: 'info', event: 'status', status: 'online', data_msg: `${m_user} is in online`})
         cOnline = true

     }
     else{
       sendLog({level: 'debug', event: 'offline', data_msg: `${m_user}'s chatroom appears to be online, but her Cam Server isn't defined, are you sure she's really online?`})
     }
     //model's video stream is offline
     if (m_vs == '127') {
         checkIfOnline.status = false
         cOnline = false
         var min = 10;
         var max = 20;
         var randomTime = Math.floor(Math.random() * (+max - +min)) + +min;
         var timeInt = parseInt(`${randomTime}00`)
         minutes = 5;
         var the_interval = minutes * 60 * timeInt;
         setTimeout(function() {
             //if(cOnline == true){
             sendLog({level: 'info', event: 'status', status: 'offline', data_msg: `${m_user} is offline`})
             if(room_joined == true){
               socket.send(new LeaveChannelMessage(sess_id, parseInt(m_id)));
               sendLog({level: 'debug', event: 'status', status: 'offline', data_msg: `Attempting to leave ${m_user}'s room`})
             }
             room_joined = false
         }, the_interval);

     }

     checkIfOnline.didRun = true
     callback(data);

 }

 function roomMetaData(d, callback) {
     try {
         roomCount = !roomCount ? -1 : d.Data.m.rc;
         roomRank = !roomRank ? -1 : d.Data.m.rank;
         cModelAge = !cModelAge ? -1 : d.Data.u.age
         cModelEthnic = !cModelEthnic ? 'unknown' : d.Data.u.ethnic
         cModelMissMfc = !cModelMissMfc ? -1 : d.Data.m.missmfc
         cModelCountry = !cModelCountry ? 'unknown' : d.Data.u.country
         cModelNew = !cModelNew ? 'unknown' : d.Data.m.new_model
         callback();
     } catch (e) {
       sendLog({level: 'error', event: 'set_metadata', data_msg:`${m_user} - tried setting metadata but shits broke son`})
     }


 }
 function sendLog (logInfo){
   logInfo = logInfo || {};
   var defaultLogger = {
     model_id: m_id,
     site: 'mfc',
     model_username: `${m_user}`,
     //room_count: `${roomCount}`,
     room_rank: roomRank || -1,
     room_count: parseInt(roomCount) || -1,
     model_age: cModelAge || -1,
     model_ethnicity: cModelEthnic || 'unknown',
     model_was_miss_mfc: cModelMissMfc|| 'unknown',
     model_country: cModelCountry|| 'unknown',
     model_new: cModelNew || -1,
   }
   level = logInfo.level || 'debug'
   logMsg = logInfo.data_msg
   delete logInfo.data_msg
   logInfo = {...defaultLogger, ...logInfo}
   logInfo.event = "logging:myfreebae-" + logInfo.event
   var mfc_logger = logger.child(logInfo)
   mfc_logger[level](logMsg);
 }

 function exposeRMeta(d, callback) {
     rMeta = d
     callback(d)
 }

 function setSessionInfo(u, callback) {
     sess_id = u.SessionId
     callback(sess_id);

 }

 function getModelInfo(u, callback) {
     sess_id = u.SessionId
     callback(u);
 }
 //check model's online status every ${watch_interval_min} minutes
 //hacky, we check to see fi we've run before, if not, lets run quickly if yes, run every ${watch_interval_min} minutes
 if (checkIfOnline.didRun != true) {
     var status_inter = 1 * 20 * 1000;
 } else {
     var status_inter = watch_interval_min * 60 * 1000;
 }
 var watch_interval_min = 3


 setInterval(function() {
     socket.send(new MFCMessage({
         Type: MessageType.FCTYPE_USERNAMELOOKUP,
         Arg1: 20,
         Data: `${m_user}`
     }))
     if(room_joined == false && cOnline == true){
       onlineButNotInRoom = onlineButNotInRoom + 1
       sendLog({level: 'error', event: 'online_not_in_room', data_msg: `ERROR - ${m_user} - script indicates that model is online, but not currently in room`})
       socket.send(new JoinChannelMessage(sess_id, parseInt(m_id)));
       if(onlineButNotInRoom > 4){
         sendLog({level: 'error', event: 'online_not_in_room', data_msg: `ERROR - ${m_user} - unable to join room after 5 attempts, quitting`})
         process.exit(1);
       }
     }
 }, status_inter);
