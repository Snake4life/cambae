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
var roomCount;
var roomRank
var cModelAge
var cModelEthnic
var cModelMissMfc
var cModelCountry
var cModelNew
var rMeta = ""

/**
 *
 * pino logger
 * Description. Create several logging instances to send data to stdout.
 *
 */

var logger = require('pino')({
    level: "debug"
})
var client_log
var nudity_log = logger.child({
    event: 'logging:myfreebae-nude',
    site: 'mfc',
    model_username: `${m_user}`
})
var ai_log = logger.child({
    event: 'logging:myfreebae-ai',
    site: 'mfc',
    model_username: `${m_user}`
})
var client_log = logger.child({
        event: 'logging:myfreebae-client',
        site: 'mfc',
        model_username: `${m_user}`
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
            } else {
                server_chat = "false"
            }
            logger.child({
                event: 'logging:myfreebae-message',
                chat_username: msg.Data.nm,
                model_id: m_id,
                site: 'mfc',
                model_username: `${m_user}`,
                room_count: `${roomCount}`,
                room_rank: roomRank,
                server_chat: server_chat,
                model_age: cModelAge,
                model_ethnicity: cModelEthnic,
                model_was_miss_mfc: cModelMissMfc,
                model_country: cModelCountry,
                model_new: cModelNew
            }).info(decodeURIComponent(msg.Data.msg))
        } catch (e) {}
    }
    // event = username lookup
    // returns with m_id
    if (msg.Type == MessageType.FCTYPE_USERNAMELOOKUP) {
        try {
            //console.log(msg)
            if (checkIfOnline.didRun != true && (msg.Data.vs != '127')) {
              roomMetaData(msg, function() {})
              socket.send(new JoinChannelMessage(sess_id, parseInt(msg.Data.uid)));
            }
            checkIfOnline(msg, function() {})
            roomMetaData(msg, function() {})
        } catch (e) {
            console.log(e)
            client_log.error('unable to determine online status, skipping lookup - model is probably offline')
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
            url: `http://${backend}:6902/mfc-status/${m_user}`,
            body: "hi=heh"
        }, function(error, response, body) {
            resp = JSON.parse(body);
            score = resp['nsfwAvg'].toString();
            nsfwScore = parseInt(score);
            tip_amount = parseInt(msg.Data.tokens);
            converted_dollar = tip_amount * .05
            mfc_total_dollars = tip_amount * .085483
            if (!isNaN(nsfwScore)) {
                if (nsfwScore > 51) {
                    var naked_logger = logger.child({
                        event: 'logging:myfreebae-tip',
                        model_username: `${m_user}`,
                        tipper: tipper,
                        model_id: m_id,
                        tip_amount: parseInt(msg.Data.tokens),
                        usd_amount: converted_dollar,
                        mfc_usd_amount: mfc_total_dollars,
                        is_nude: 'true',
                        nsfw_score: nsfwScore,
                        room_count: roomCount,
                        room_rank: roomRank,
                        model_age: cModelAge,
                        model_ethnicity: cModelEthnic,
                        model_was_miss_mfc: cModelMissMfc,
                        model_country: cModelCountry,
                        model_new: cModelNew,
                        site: 'mfc'
                    });
                    naked_logger.info(`Tip Amount: ${tip_amount} - Converted to Dollars: ${converted_dollar} - ${m_user} detected nude`);
                } else {
                    var not_naked_logger = logger.child({
                        event: 'logging:myfreebae-tip',
                        model_username: `${m_user}`,
                        tipper: tipper,
                        mfc_model_id: m_id,
                        tip_amount: parseInt(msg.Data.tokens),
                        usd_amount: converted_dollar,
                        mfc_usd_amount: mfc_total_dollars,
                        is_nude: 'false',
                        nsfw_score: nsfwScore,
                        room_count: roomCount,
                        room_rank: roomRank,
                        model_age: cModelAge,
                        model_ethnicity: cModelEthnic,
                        model_was_miss_mfc: cModelMissMfc,
                        model_country: cModelCountry,
                        model_new: cModelNew,
                        site: 'mfc'
                    });
                    not_naked_logger.info(`Tip Amount: ${tip_amount} - Converted to Dollars: ${converted_dollar} - ${m_user} detected nude`);
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

    //model in private
    if (m_vs == '12') {
      checkIfOnline.status = true
      roomMetaData(data, function() {

      })
      var online_log = logger.child({
          event: 'logging:myfreebae-online',
          site: 'mfc',
          model_username: `${m_user}`,
          status: `private`,
          room_count: roomCount,
          room_rank: roomRank,
          model_age: cModelAge,
          model_ethnicity: cModelEthnic,
          model_was_miss_mfc: cModelMissMfc,
          model_country: cModelCountry,
          model_new: cModelNew
      })
      online_log.info(`${m_user} is online`)
    }
    //model in public
    if (m_vs == '90' || m_vs == '0') {
        roomMetaData(data, function() {

        })
        checkIfOnline.status = true
        var online_log = logger.child({
            event: 'logging:myfreebae-online',
            site: 'mfc',
            model_username: `${m_user}`,
            status: `online`,
            room_count: roomCount,
            room_rank: roomRank,
            model_age: cModelAge,
            model_ethnicity: cModelEthnic,
            model_was_miss_mfc: cModelMissMfc,
            model_country: cModelCountry,
            model_new: cModelNew
        })
        online_log.info(`${m_user} is online`)
        cOnline = true

    }
    //model's video stream is offline
    if (m_vs == '127') {
        checkIfOnline.status = false
        var min = 10;
        var max = 20;
        var randomTime = Math.floor(Math.random() * (+max - +min)) + +min;
        var timeInt = parseInt(`${randomTime}00`)
        minutes = 5;
        var the_interval = minutes * 60 * timeInt;
        setTimeout(function() {
            //if(cOnline == true){
            client_log.error(`${m_user} appears to be offline or the backend websockets aren't responding. Exiting`);
            cOnline = false
                //}
            socket.send(new LeaveChannelMessage(sess_id, parseInt(m_id)));
            var offline_log = logger.child({
                event: 'logging:myfreebae-offline',
                site: 'mfc',
                model_username: `${m_user}`,
                status: 'offline'
            })
        }, the_interval);

    }

    checkIfOnline.didRun = true
    callback(data);

}

function roomMetaData(d, callback) {
    roomCount = !roomCount ? -1 : d.Data.m.rc;
    roomRank = !roomRank ? -1 : d.Data.m.rank;
    cModelAge = !cModelAge ? 'unknown' : d.Data.u.age
    cModelEthnic = !cModelEthnic ? 'unknown' : d.Data.u.ethnic
    cModelMissMfc = !cModelMissMfc ? 'unknown' : d.Data.m.missmfc
    cModelCountry = !cModelCountry ? 'unknown' : d.Data.u.country
    cModelNew = !cModelNew ? 'unknown' : d.Data.m.new_model
    callback();

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
//hacky, we check to see fi we've run before, if not, lets run quicklym if yes, run every ${watch_interval_min} minutes
if (checkIfOnline.didRun != true) {
    var status_inter = 1 * 20 * 1000;
}
else{
    var status_inter = watch_interval_min * 60 * 1000;
}
var watch_interval_min = 3


setInterval(function() {
    socket.send(new MFCMessage({
        Type: MessageType.FCTYPE_USERNAMELOOKUP,
        Arg1: 20,
        Data: `${m_user}`
    }))
}, status_inter);
