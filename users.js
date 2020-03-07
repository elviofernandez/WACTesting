
var users = new Array();
users[0] = {
	"name": "Leo",
	"id": "0",
	"ip": "",
	"phoneNumber": "XXXXXXXXX"
};
users[2] = {
	"name": "Elvio Fernandez", // Target cel
	"id": "1",
	"ip": "",
	"phoneNumber": "+5492215455520"
};
users[1] = {
	"name": "TWILIO", // TWILIO NUMBER
	"id": "2",
	"ip": "",
	"phoneNumber": "+14155238886"
};

function userByPhoneNumber(number) {

	var result = null;
	users.forEach(function each(user) {
		if (user.phoneNumber == number) {
			result = user;
		}
	});
	return result;
}

module.exports.users = users;
module.exports.userByPhoneNumber = userByPhoneNumber;  