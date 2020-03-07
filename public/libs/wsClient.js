var output;
var websocket;
var msgr = null;

/** Class Messenger 
 * representa el modelo del messaneger + la UI.
 * Es deseable tener estos dos conceptos separados:
 * model y UI, sin embargo aqui estan juntos por 
 * simplicidad
 * 
 */
class Messenger {
    constructor(userid, tuserid) {
        this.socket = null;
        this.channels = [];
        this.user = null;
        this.targetUser = null;
        this.init(userid, tuserid);
    }

    /**
     * Inicializacion del messenger
     */
    init(userid, tuserid) {
        var self = this;
        if ("WebSocket" in window) {
            console.log("Websocket support");
        } else {
            console.log("Error - No Websocket support");
            return false;
        }
        this.socket = new WebSocket('ws://localhost:3001');

        this.socket.onopen = function (e) {
            self.newSession(userid, tuserid);
            //self.getMessages(null);
        };
        this.socket.onmessage = function (e) {
            self.receiveMessage(e)
        };

        this.socket.onerror = function (e) {
            self.receiveError(e)
        };
    }

    /**
     * Envia un mensaje a traves del web socket
     * @param {string} str - The string containing two comma-separated numbers.
     * @return {Point} A Point object.
     */
    send(msg) {

        var data = null;

        data = {
            type: "CCmdSendMessage",
            body: msg,
            from: this.user.phoneNumber,
            to: this.targetUser.phoneNumber
        }
        data = JSON.stringify(data);
        this.socket.send(data);

    }

    /**
     * Se recibe un mensaje desde el websocket
     * @param {MessageEvent} Objeto MessageEvent
     */
    receiveMessage(e) {

        this.processMessage(e);

    }

    /**
     * Se recibe un error desde el websocket
     * @param {MessageEvent} Objeto MessageEvent
     */
    receiveError(e) {
        console.log("onError:" + e);
    }

    /**
     * Pide el conjunto de mensajes al servidor     
     */
    getMessages() {
        var data = null;
        data = {
            type: "CCmdMessages",
            id: this.user.id,
            phoneNumber: this.user.phoneNumber,
            tid: this.targetUser.id,
            targetPhoneNumber: this.targetUser.phoneNumber
        }
        data = JSON.stringify(data);
        this.socket.send(data);
    }

    /**
     * Pide el conjunto de mensajes al servidor     
     */
    newSession(userid, tuserid) {
        var data = null;
        data = {
            type: "CCmdSessionUser",
            id: userid,
            tid: tuserid
        }
        data = JSON.stringify(data);
        this.socket.send(data);
    }

    /**
     * Procesa un mensaje entrante
     * @param {json} Objeto
     */
    processMessage(data) {
        try {
            data = JSON.parse(data.data);
            if (data.command == "CmdMessageSet") {
                this.processCmdMessageSet(data);
            } else if (data.command == "CmdSessionUserResponse") {
                this.CmdSessionUserResponse(data);
            } else if (data.command == "CmdMessageStatus") {
                this.proccesIncomingMessageStatus(data);

            } else if (data.command == "CmdMessageAck") {
                this.proccesCmdIncomingMessage(data);
            }
        } catch (error) {
            console.log(data.data);
        }
    }


    showChannels() {
        var res = document.getElementById("result");

    }





    /**
     * Procesa un conjunto de mensajes entrantes
     * Tipicamente esta situacion sucede al iniciar el
     * cliente. Obteniendo todos los mensajes.
     * @param {json} data Objeto
     */
    processCmdMessageSet(data) {
        var channel = null;
        var msgJSON = null;
        var msg = null;
        for (var index = 0; index < 150/*data.messages.length*/; index++) {
            msgJSON = data.messages[index];

            if (this.channels[msgJSON.chatId] == undefined) {
                channel = new WAChannel(msgJSON.chatId, msgJSON.senderName);
                this.channels[msgJSON.chatId] = channel;
            } else channel = this.channels[msgJSON.chatId];
            msg = WAMessage.fromJSON(msgJSON);
            channel.add(msg);
        }

        this.showChannels();
        console.log("[RECEIVE] incomingMessageSet <<<<<<<", this.channels);

    }

    /**
     * Procesa el mensaje de respuesta de inicio de session.
     * Adquiere el user y el target user
     * @param {json} data Objeto
     */
    CmdSessionUserResponse(data) {
        this.user = data.user;
        this.targetUser = data.targetUser;
        console.log("[RECEIVE] Nueva session <<< ", this.targetUser);
        console.log("[RECEIVE] Nueva session <<< ", this.user);
    }

    proccesCmdIncomingMessage(data) {
        console.log("[RECEIVE] incomingMessage <<<<<<<", data);
    }

    proccesIncomingMessageStatus(data) {
        console.log("[RECEIVE] incomingMessageStatus <<<<<<<", data);
    }

}

/** Class WAChannel
 * representa un channel. Un channel puede ser un nro de cel
 * o un nombre de grupo. Cada channel tiene un conjunto de mensajes.
 *
 */
class WAChannel {
    constructor(name, chatId) {
        this.name = name;
        this.chatId = chatId;
        this.messages = [];
    }

    /**
     * Agrega un mensaje al receptor
     */
    add(aWAMessage) {
        this.messages.push(aWAMessage);
    }

    /**
     * Retorna la cantidad de mensajes del receptor
     */
    size() {
        return this.messages.length;
    }
}


class WAMessage {
    constructor() {
        this.id = null;
        this.author = null;
        this.body = null;
        this.chatId = null;
        this.fromMe = null;
        this.messageNum = null;
        this.sender = null;
        this.time = null;
        this.type = null;
    }
}
WAMessage.fromJSON = function (json) {
    var waMsg = new WAMessage();
    waMsg.id = json.id;
    waMsg.author = json.author;
    waMsg.body = json.body;
    waMsg.chatId = json.chatId;
    waMsg.fromMe = json.fromMe;
    waMsg.messageNum = json.messageNum;
    waMsg.sender = json.senderName;
    waMsg.time = json.time;
    waMsg.type = json.type;
    return waMsg;
}



function init() {
    var urlStr = window.location.href;
    var url = new URL(urlStr);
    var userid = url.searchParams.get("userid"); // TWILIO NUMBER
    var tuserid = url.searchParams.get("tuserid"); // Target user number

    msgr = new Messenger(userid, tuserid);

}

function sendMessage(event) {

    var bodyText = document.getElementById("body").value;
    msgr.send(bodyText);
}

function getMessages() {
    msgr.getMessages();
}


