Module.register("smartmirror-decision-maker", {

	mainManuStateObj: {
		none: 0,
		main: 1,
		camera:2,
		application:3,
		preferences:4,
	},

	mainManuState: 0,

	currentuserid: -1,

	facerecognitionshown: false,
	objectdetectionshown: false,
	gesturerecognitionshown: false,

	defaults: {
		module_list: [
			{name : "clock", words : ["clock","uhr"]},
			{name : "calendar", words : ["calendar"]},
			{name : "smartmirror-speechrecognition", words : ["speech"]},
			{name : "MMM-cryptocurrency", words : ["crypto"]},
			{name : "weatherforecast", words : ["weather","wetter"]},
			{name : "currentweather", words : ["weather","wetter"]},
			{name : "newsfeed", words : ["news feed" , "newsfeed"]},
			{name : "MMM-PublicTransportHafas", words : ["transportation"]},
			{name : "smartmirror-mensa-plan", words : ["mensa"]},
			{name : "smartmirror-main-menu", words : ["menu"]},
			{name : "smartmirror-center-display", words : ["centerdisplay"]},
			{name : "MMM-Stock", words : ["stock"]}
		]
	},

	start: function() {
		this.currentuserid = -1;
		console.log(this.name + " has started...");
		this.mainManuState = this.mainManuStateObj.none;
		console.log("[" + this.name + "] " + "sending MAIN_MENU: none");
		this.sendNotification('MAIN_MENU', 'none');
		this.sendSocketNotification('CONFIG', this.config);	
	},

	notificationReceived: function(notification, payload, sender) {
		if (notification === 'DOM_OBJECTS_CREATED') {
			var self = this;
      		MM.getModules().enumerate(function(module) {
				module.hide(0, function() {
					Log.log('Module is hidden.');
				}, {lockString: "lockString"});
			});
		}else if(notification === 'TRANSCRIPT_EN') {
			console.log("[" + this.name + "] " + "transcript received: " + payload);
			this.process_string(payload)
		}else if(notification === 'TRANSCRIPT_DE') {
			console.log("[" + this.name + "] " + "transcript received: " + payload);
			this.process_string(payload)
		}else if(notification === 'MENU_CLICKED') {
			console.log("[" + this.name + "] " + "Menu item was clicked: " + payload);
			this.process_string(payload)
		}else if(notification === 'RECOGNIZED_USER') {
			console.log("[" + this.name + "] " + "Face recognition has send following data: " + payload);	
			this.process_rec_persons(payload);
		}else if(notification === 'FACE_REC_IDS') {
			console.log("[" + this.name + "] " + "Face recognition has send following data: " + payload);	
			this.process_face_IDs(payload);
		}else if (notification === 'ALL_MODULES_STARTED') {
			this.sendSocketNotification('LOGGIN_USER', -1);
			this.sendNotification('smartmirror-TTS-en',"Welcome to the smart mirror!");
		}else if(notification === 'GESTURE_DETECTED') {
			//var parsed_message = JSON.parse(payload)
			this.process_gesture(payload);
		}
	},

	// Override socket notification handler.
	socketNotificationReceived: function(notification, payload) {
		if(notification === 'LOGGIN_USER_INFOS') {
			//console.log("[" + this.name + "] " + "User data received: " + JSON.stringify(JSON.parse(payload)));	
			//console.log("test " + JSON.parse(payload)[0]["ID"])
			this.adjustViewLogin((JSON.parse(payload))[0]);
			if (JSON.parse(payload)[0]["ID"] > 0) {
				//this.sendNotification('smartmirror-TTS-en',"Hello, nice to see you");
				this.sendNotification('smartmirror-TTS-ger',"Hallo " + JSON.parse(payload)[0]["name"] + ", schön dich wieder zu sehen");
			}
		}
	},

	adjustViewLogin: function(config){
		this.config.module_list.forEach(function(element) {
			for(var key in config){
				if(element.words.includes(key)){
					MM.getModules().withClass(element.name).enumerate(function(module) {
					if(config[key]) {
						if (module.hidden)
							module.show(1000, function() {Log.log(module.name + ' is shown.');}, {lockString: "lockString"});
					}else{
						 if(!module.hidden)
							module.hide(1000, function() {Log.log(module.name + ' is shown.');}, {lockString: "lockString"})
					}					
					});
				}
			}
		});
	},

	process_face_IDs: function(face_ids){	
		if(this.currentuserid == -1 || face_ids[0] == -1 || !(face_ids.includes(this.currentuserid))){
			if(face_ids.length == 1){
				login_id = face_ids[0];
			} else {
				function findfirstone(element) {
  					return element > 0 ;
				}
				login_id = face_ids.find(findfirstone)
	
				if (typeof login_id === "undefined"){
					login_id = face_ids[0];
				}
			}
			this.sendSocketNotification('LOGGIN_USER', login_id);
			this.currentuserid = login_id;
			console.log("[" + this.name + "] changing current user to: " + login_id );
		} else { // user is not changed!
			console.log("[" + this.name + "] not changing current user" );
		}
	},

	process_rec_persons: function(rec_persons){
		function findfirstone(element) {
  			return element == 1;
		}
		
		rec_persons.findIndex(findfirstone)
		console.log("ID "  + rec_persons.findIndex(findfirstone) + " will be logged in");
		this.sendSocketNotification('LOGGIN_USER', rec_persons.findIndex(findfirstone));	
		
	},
	
	process_string: function(transcript){
		if (typeof transcript === 'string'){

			if(transcript.includes('shutdown') || transcript.includes('sudo') || transcript.includes('reboot')){
				this.sendNotification('smartmirror-TTS-en', "Thorsten no! Stop it!");
				this.sendNotification('smartmirror-TTS-ger', "Genau Thorsten! Lass es sein!");
			}else if(transcript.includes('fuck')){
				this.sendNotification('smartmirror-TTS-en', "language please!");

			}else if(transcript.includes('close')){
				this.sendNotification('MAIN_MENU', 'none');
				this.mainManuState = this.mainManuStateObj.none;

			}else if(this.mainManuState === this.mainManuStateObj.none){			
				if(transcript.includes('menu')){
					this.sendNotification('MAIN_MENU', 'menu');
					this.mainManuState = this.mainManuStateObj.main;
				}

			}else if(this.mainManuState === this.mainManuStateObj.main){
				if(transcript.includes('camera')||transcript.includes('kamera')||transcript.includes('demonstration')){				
					this.sendNotification('MAIN_MENU', 'camera');
					this.mainManuState = this.mainManuStateObj.camera;
				}else if(transcript.includes('application')||transcript.includes('anwendung')){				
					this.sendNotification('MAIN_MENU', 'application');
					this.mainManuState = this.mainManuStateObj.application;
				}else if(transcript.includes('preference')||transcript.includes('einstellung')){				
					this.sendNotification('MAIN_MENU', 'preferences');
					this.mainManuState = this.mainManuStateObj.preferences;
				}else if(transcript.includes('back')||transcript.includes('zurück')){				
					this.sendNotification('MAIN_MENU', 'none');
					this.mainManuState = this.mainManuStateObj.none;
				}

			}else if(this.mainManuState === this.mainManuStateObj.camera){
				if(transcript.includes('back')||transcript.includes('zurück')){				
					this.sendNotification('MAIN_MENU', 'menu');
					this.mainManuState = this.mainManuStateObj.main;
				}else if(transcript.includes('image')||transcript.includes('bild')){				
					this.sendNotification('CENTER_DISPLAY', 'TOGGLE');
				}else if(transcript.includes('distance')||transcript.includes('distanz')){				
					this.sendNotification('CENTER_DISPLAY', 'DISTANCE');
				}else if(transcript.includes('object')){				
					this.sendNotification('CENTER_DISPLAY', 'OBJECT');
					this.objectdetectionshown = !(this.objectdetectionshown);
					if (this.objectdetectionshown) {
						this.sendNotification("smartmirror-object-detection" + "SetFPS", 30.0);
					} else {
						this.sendNotification("smartmirror-object-detection" + "SetFPS", 5.0);
					} 
				}else if(transcript.includes('gesture')||transcript.includes('hand')){				
					this.sendNotification('CENTER_DISPLAY', 'GESTURE');
					this.gesturerecognitionshown = !(this.gesturerecognitionshown);
					if (this.gesturerecognitionshown) {
						this.sendNotification("smartmirror-gesture-recognition" + "SetFPS", 30.0);
					} else {
						this.sendNotification("smartmirror-gesture-recognition" + "SetFPS", 5.0);
					} 
				}else if(transcript.includes('face')||transcript.includes('gesicht')){				
					this.sendNotification('CENTER_DISPLAY', 'FACE');
					this.facerecognitionshown = !(this.facerecognitionshown);
					if (this.facerecognitionshown) {
						this.sendNotification("smartmirror-facerecognition" + "SetFPS", 30.0);
					} else {
						this.sendNotification("smartmirror-facerecognition" + "SetFPS", 5.0);
					} 
				}else if(transcript.includes('hide all')||transcript.includes('hideALL')||transcript.includes('versteck')||transcript.includes('alles')||transcript.includes('remove all')){
					this.sendNotification('CENTER_DISPLAY', 'HIDEALL');
					this.facerecognitionshown = false;
					this.objectdetectionshown = false;
					this.sendNotification("smartmirror-object-detection" + "SetFPS", 5.0);
					this.sendNotification("smartmirror-facerecognition" + "SetFPS", 5.0);
					this.sendNotification("smartmirror-gesture-recognition" + "SetFPS", 5.0);
				}
			}else if(this.mainManuState === this.mainManuStateObj.application){
				if(transcript.includes('back')||transcript.includes('zurück')){				
					this.sendNotification('MAIN_MENU', 'menu');
					this.mainManuState = this.mainManuStateObj.main;
				} else {
					this.config.module_list.forEach(function(element) {
						var wordIncluded = false;					
						element.words.forEach(function(word){
							if(transcript.includes(word))
								wordIncluded = true	});
						if (wordIncluded)
							MM.getModules().withClass(element.name).enumerate(function(module) {
								if (module.hidden) 
								module.show(1000, function() {Log.log(module.name + ' is shown.');}, {lockString: "lockString"});
								else 
								module.hide(1000, function() {Log.log(module.name + ' is shown.');}, {lockString: "lockString"})
							});
					});
				}		
			}else if(this.mainManuState === this.mainManuStateObj.preferences){
				if(transcript.includes('back')||transcript.includes('zurück')){				
					this.sendNotification('MAIN_MENU', 'menu');
					this.mainManuState = this.mainManuStateObj.main;
				}
			}
		}
	},

	process_gesture: function(detection_string){
		console.log("[" + this.name + "] " + "gesture detected: " + detection_string);
		var parsed_detection = JSON.parse(detection_string)
		this.sendNotification('MAIN_MENU_SELECT', 0);
		
	}
});
