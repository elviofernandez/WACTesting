/*----------------------------------------------------------------------------------------------------
/ Copyright (C) 2018 SQUAD <info@squad.com> http:/squad.com
/ 
/ Permission is hereby granted, free of charge, to any person obtaining
/  a copy of this software and associated documentation files (the "Software"),
/  to deal in the Software without restriction, including without limitation
/  the rights to use, copy, modify, merge, publish, distribute, sublicense,
/  and/or sell copies of the Software, and to permit persons to whom the
/  Software is furnished to do so, subject to the following conditions:
/ 
/ The above copyright notice and this permission notice shall be included
/  in all copies or substantial portions of the Software.
/ 
/ THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
/  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
/  OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
/  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
/  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
/  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
/  OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
----------------------------------------------------------------------------------------------------*/

// See https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
var Reset = "\x1b[0m";
var Bright = "\x1b[1m";
var Dim = "\x1b[2m";
var Underscore = "\x1b[4m";
var Blink = "\x1b[5m";
var Reverse = "\x1b[7m";
var Hidden = "\x1b[8m";

var FgBlack = "\x1b[30m";
var FgRed = "\x1b[31m";
var FgGreen = "\x1b[32m";
var FgYellow = "\x1b[33m";
var FgBlue = "\x1b[34m";
var FgMagenta = "\x1b[35m";
var FgCyan = "\x1b[36m";
var FgWhite = "\x1b[37m";

var BgBlack = "\x1b[40m";
var BgRed = "\x1b[41m";
var BgGreen = "\x1b[42m";
var BgYellow = "\x1b[43m";
var BgBlue = "\x1b[44m";
var BgMagenta = "\x1b[45m";
var BgCyan = "\x1b[46m";
var BgWhite = "\x1b[47m";




'use strict'
var express = require('express');
var app = express();
var path = require('path');
var util = require('util');
var bodyParser = require('body-parser');
var twilio = require('twilio');
//var msgRepo = require('./msgRepo.js'); // local data mockup for use without twilio connection
var db = require('./users.js'); // Test purpose
var qryString = require('querystring');
var https = require('https');

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3001 });
var twilioAPI = require('./myTwilio');

function clog(header, headerColor, text) {
	var options = {
		weekday: "short",
		year: "numeric",
		month: "2-digit",
		day: "numeric",
	};
	var date = new Date();
	var strTime = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ':' + date.getMilliseconds();
	var str = headerColor + header + '=========================================================' + Reset + ' \n';
	str = str.replace('{time}', date.toLocaleDateString("en", options) + ' ' + strTime);
	str = str + text + '\n';
	console.log(str);
}

function generateId(count, k) {
	var _sym = 'abcdefghijklmnopqrstuvwxyz1234567890';
	var str = '';
	for (var i = 0; i < count; i++) {
		str += _sym[parseInt(Math.random() * (_sym.length))];
	}
	base.getID(str, function (err, res) {
		if (!res.length) {
			k(str)                   // use the continuation
		} else generate(count, k)  // otherwise, recurse on generate
	});
}

/**
* Procesa un pedido de envio desde el web client
* @param {string} text - cuerpo del mensaje
* @param {string} phone - nro de cel remitente
* @param {string} tPhone - nro de cel target
*/
function proccesSendMessage(text, phone, tPhone, out) {

	twilioAPI.sendMessage(text, phone, tPhone, (data) => {
		console.log(data);
		data = JSON.parse(data);

		var dateCreated = new Date(data.date_created.split('+')[0]).getTime();
		var dateSent = (data.date_sent != null) ? new Date(data.date_sent.split('+')[0]).getTime() : data.date_sent;
		var dateUpdated = new Date(data.date_updated.split('+')[0]).getTime();

		var msg = {
			"command": "CmdMessageAck",
			"body": data.body,
			"id": data.sid,
			"author": data.from.split(':')[1],
			"time": new Date(data.date_created).getTime(),
			"dateCreated": dateCreated,
			"dateUpdated": dateUpdated,
			"dateSent": dateSent,
			"direction": data.direction,
			"status": data.status,
			"chatId": data.from.split(':')[1],
			"type": "chat",
			"senderName": data.from.split(':')[1],
			"to": data.to.split(':')[1],
			"from": data.from.split(':')[1],
			"fromMe": (phone == data.from.split(':')[1]),
			"messageNumber": 0
		};
		out(msg);
		//this.emit("#sentMessage", msg, text, phone, tPhone);
	});
}


function proccesGetMessages(phone, tPhone, out) {

	try {

		twilioAPI.listMessagesBetween(phone, tPhone, out);
	} catch (err) {
		console.log("ERROR: " + err);

	}
}


function OLD_proccesGetMessages(id, phoneNumber, out) {

	// Get twilio messages "https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json"
	var number = 1;
	var data = {
		"command": "CmdMessageSet",
		"messages": []
	};

	function onFinish(error) {
		out(data);
	};

	twClient.messages.each({ done: onFinish }, (message) => {
		//console.log(message);
		var msg = {
			"body": message.body,
			"id": message.sid,
			"author": message.from.split(':')[1],
			"time": new Date(message.dateCreated).getTime(),
			"dateCreated": new Date(message.dateCreated).getTime(),
			"dateUpdated": new Date(message.dateUpdated).getTime(),
			"dateSent": new Date(message.dateSent).getTime(),
			"direction": message.direction,
			"status": message.status,
			"chatId": message.from.split(':')[1],
			"type": "chat",
			"senderName": message.from.split(':')[1],
			"to": message.to.split(':')[1],
			"from": message.from.split(':')[1],
			"fromMe": (phoneNumber == message.from.split(':')[1]),
			"messageNumber": number
		};
		number++;
		data.messages.push(msg);
		//console.log(data)
	});
}



function proccesWHIncommingStatus(idata, out) {

	//clog('<<WHDATA {time}>>', Reverse, idata.MessageSid);
	var target = null;
	var msg = {
		"command": "CmdMessageStatus",
		"id": idata.MessageSid,
		"status": (idata.hasOwnProperty('EventType') ? idata.EventType : idata.SmsStatus),
		"event": (idata.hasOwnProperty('EventType') ? idata.EventType : idata.SmsStatus),
		"chatId": idata.From.split(':')[1],
		"direction": 'in-status',
		"type": "chat",
		"senderName": idata.From.split(':')[1],
		"to": idata.To.split(':')[1],
		"from": idata.From.split(':')[1]
	}
	target = db.userByPhoneNumber(msg.from);
	out(msg, target.ip);
}


/**
* Inicia una session. Retorna los dos usuarios implicados
* @param {integer} userId Nro tel de usuario
* @param {integer} tuserId  Nro tel de TWILIO service
*/
function proccesSessionUser(userId, tuserid, ip, out) {

	var data = null;
	var usr, tusr = null;
	try {
		usr = db.users[userId];
		tusr = db.users[tuserid];
		usr.ip = ip;
		data = {
			"command": "CmdSessionUserResponse",
			"user": usr,
			"targetUser": tusr
		};
	}
	catch (err) {
		console.log(err);
		data = { "command": "CmdUnknowSessionUser" };
	}
	out(data);
}

/**
* El mensaje no ha sido reconocido
* @param {any} data Nro tel de usuario
* @param {Callback} out - callback
*/
function proccesUnknown(data, out) {

	clog('<<DATA {time}>>', Reverse, data);
	out({ "command": "CmdUnknow" });
}



/**
* Procesa una notificacion entrante (webHook) de la red de telefonia
* @param {integer} userId Nro tel de usuario
* @param {Callback} out - callback
*/
function processWHMessage(idata, out) {

	//clog('<<WHDATA {time}>>', Reverse, idata.MessageSid);
	var data = {
		"command": "CmdMessageReponse",
		"id": idata.MessageSid,
		"author": idata.From.split(':')[1],
		"time": new Date().getTime(),
		"body": idata.Body,
		"dateCreated": new Date().getTime(),
		"dateUpdated": new Date().getTime(),
		"dateSent": new Date().getTime(),
		"direction": 'in-webhook',
		"status": 'received',
		"chatId": idata.From.split(':')[1],
		"type": "chat",
		"senderName": idata.From.split(':')[1],
		"to": idata.To.split(':')[1],
		"from": idata.From.split(':')[1],
		"fromMe": false,
		"messageNumber": -1,
		"receiveTime": Date.now()
	}

	if (this.user != null) {
		out(data, this.user.ip);
	}
}




function processMessage(data, ip, out) {

	var resp = null;


	data = JSON.parse(data);
	//data.id = accountSid;
	switch (data.type) {
		case 'CCmdSessionUser':
			proccesSessionUser(data.id, data.tid, ip, (resp) => {
				out(JSON.stringify(resp));
			});
			break;
		case 'CCmdMessages':
			proccesGetMessages(data.phoneNumber, data.targetPhoneNumber, (resp) => {
				out(JSON.stringify(resp));
			});
			break;
		case 'CCmdSendMessage':
			proccesSendMessage(data.body, data.from, data.to, (resp) => {
				out(JSON.stringify(resp));
			});
			break;
		case 'CCmdSendTemplate':
			proccesSendTemplateMessages(data.id, data.phoneNumber, (resp) => {
				out(JSON.stringify(resp));
			});
		default:
			proccesUnknown(data, (resp) => {
				out(JSON.stringify(resp));
			});
	}
}



wss.on('connection', (ws, req) => {
	var resp = null;
	var ip = req.connection.remoteAddress;

	ws.on('message', (message) => {
		clog('<<RECEIVE {time}>>', Reverse, message);
		processMessage(message, ip, (resp) => {
			clog('<<SEND {time}>', Reverse, resp);
			ws.send(resp);
		});
	});
	ws.send('Conectado al socket port 3001');
	console.log('Client connected from IP: ' + req.connection.remoteAddress);
});

var target = null;
app.use(express.static(path.join(__dirname, "/public/")));
app.use(bodyParser.urlencoded({ extended: true }));
app.get('/messenger', (req, res) => {
	res.status(200)
		.sendFile(path.join(__dirname, "/public/", "index.html"))
})
	.post('/webhook', (req, res) => {

		clog('<<RECEIVEWEBHOOK {time}>>', Reverse + FgGreen, util.inspect(req.body));
		processWHMessage(req.body, (resp, targetIP) => {
			wss.clients.forEach(function each(client) {


				if ((client.readyState === WebSocket.OPEN) && (client._socket.remoteAddress == targetIP)) {
					clog('<<SEND {time}>', Reverse, JSON.stringify(resp));
					client.send(JSON.stringify(resp));
				}
			});

		});
		res.status(200).end();
	})
	.post('/status', (req, res) => {
		clog('<<RECEIVEStatus {time}>>', Reverse + FgYellow, util.inspect(req.body));
		proccesWHIncommingStatus(req.body, (resp, targetIP) => {
			wss.clients.forEach(function each(client) {

				//console.log('targetIP:'+ targetIP);			
				if ((client.readyState === WebSocket.OPEN) && (client._socket.remoteAddress == targetIP)) {
					clog('<<SENDStatus {time}>', Reverse, JSON.stringify(resp));
					client.send(JSON.stringify(resp));
				}
			});

		});
		res.status(200).end();
	});
app.listen(3000);
console.log('Iniciando WhatsappConnector en puerto 3000')
