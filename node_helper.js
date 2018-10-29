'use strict';
const NodeHelper = require('node_helper');
var mysql = require('mysql');



module.exports = NodeHelper.create({

	setup: function () {
		this.con = mysql.createConnection({
  			host: "localhost",
  			user: "smart-mirror",
  			password: "Sm4rt-M1rr0r"
		});
		this.con.connect(function(err) {
 			if (err) throw err;
  			console.log("Connected to mysql!");
			
	//		con.query("select * from mydb.user;" , function (err, result, fields) {
	//		//con.query("select * from mydb.user;", function (err, result, fields) {
   // 			if (err) throw err;
    //			console.log(result[1].name);
 	//		});
		});	
	},



	// Subclass socketNotificationReceived received.
	socketNotificationReceived: function(notification, payload) {
		const self = this;
		if(notification === 'CONFIG') {
			this.config = payload
      		this.setup(); 
    	}else if(notification === 'LOGGIN_USER') {
			this.con.query("select * from mydb.user, mydb.login_view where ID = " + payload + " AND ID = user_ID", function (err, result, fields) {
				if (err) throw err;
				self.sendSocketNotification('LOGGIN_USER_INFOS',JSON.stringify(result));
			});
    	} /* else if(notification === 'GREET_USER') {
			this.con.query("select * from mydb.user where ID = " + payload + " AND ID = user_ID", function (err, result, fields)
			var name = result[0]["name"];
			this.con.query("select * from mydb.language", function (err, result, fields)
			console.log(result);
		} */
  	}

});
