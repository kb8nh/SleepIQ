/*
 * The following is an API implementation srated from 
 * https://github.com/DeeeeLAN/homebridge-sleepiq/blob/HEAD/API.js (tons of thanks)
 * I also have added pressure API
 */

var request = require('request-promise-native')
request = request.defaults({jar: true})

class API {
    constructor (username, password) {
    	// fill these with your SleepIQ account details
	    this.username = '__YOUR_SLEEP_NUMBER_USERNAME_HERE__'
	    this.password = '__YOUR_SLEEP_NUMBER_PASSWORD_HERE__'

	    this.userID = '' // also the sleeperID I think
	    this.bedId = ''
	    this.key = ''
	    this.json = ''
	    this.bedSide = 'R'	// change to 'L' if you want to default to Left side instead of Right side
	    this.defaultBed = 0 // change if you want the class methods to default to a different bed in your datasets.
    }

    genURL (url, method, body=null, callback=null) {
        //console.log('uri:https://api.sleepiq.sleepnumber.com/rest/' + url);
        //console.log('body:' + JSON.stringify(body));
	    return request(
	        {
	            method: method,
	            uri: 'https://api.sleepiq.sleepnumber.com/rest/' + url,
		        body: JSON.stringify(body),
	            qs: {_k: this.key}
	        }, 
	        function(err, resp, data) {
	 	        if (err) {
		            return callback(`ERROR: ${method} request for ${url} returned an error. Error:`, err)
		        }
		        if (data) {
		            this.json = JSON.parse(data)

		            if (callback) {
	    		        callback(data);
		            }
		        } 
	        }.bind(this)
	    )
    }

    /*
     * Sample response
	  {
	    "userId":"",
	    "key":"",
	    "registrationState":13, // not sure what registrationState is used for
	    "edpLoginStatus":200,
	    "edpLoginMessage":"not used"
	  }
	*/
    login (callback=null) {
        return this.genURL('login', 
                        'PUT', 
                        {'login': this.username, 'password': this.password}, 
                        function (data) {
        		            this.userID = this.json.userID
		                    this.key = this.json.key
                          
                            if (callback) {
                                callback(data);
                            }
                        }.bind(this)
                    )
    }

	/*
	 * Has to be called after login and before anything else
	 * Sample response
	 
	  {
	    "beds":[ // array of beds
	        {"status":1,
	          "bedId":"", // used to identify each bed
	           "leftSide": {
	             "isInBed":false, // used in homebridge plugin
	             "alertDetailedMessage":"No Alert",
	             "sleepNumber":30, // used in homebridge plugin
	             "alertId":0,
	             "lastLink":"00:00:00",
	              "pressure":1088
	           },
	           "rightSide": {
	              "isInBed":false,
	              "alertDetailedMessage":"No Alert",
	              "sleepNumber":40,
	              "alertId":0,
	              "lastLink":"00:00:00",
	              "pressure":1298
	           }
	        }
	     ]
	  }
	*/
    familyStatus (callback=null) {
        return this.genURL('bed/familyStatus', 
                        'GET', 
			            null,
                        function (data) {
		                    if (this.json.beds) {
    			                this.bedId = this.json.beds[this.defaultBed].bedId
		                    }
                          
                            if (callback) {
                                callback(data)
                            }
                        }.bind(this)
                    );
    }
    
    setBedSide(side) {
        this.bedSide = side;
    }
    
    genBedURL(url, body, callback=null) {
	    return this.genURL('bed/'+this.bedId+url, 'PUT', body, callback);
    }
    
    // num is any num in FAVORITE = 1, READ = 2, WATCH_TV = 3, FLAT = 4, ZERO_G = 5, SNORE = 6
    preset (num, callback=null) {
	    return this.genBedURL('/foundation/preset', 
                            {speed: 0, side: this.bedSide, preset: num}, 
                            callback)
    }

    // num is any number in the range [0-100]. Actuator is either 'F' or 'H' (foot or head).
    adjust (actuator, num, callback=null) {
	    return this.genBedURL('/foundation/adjustment/micro', 
                            {speed: 0, side: this.bedSide, position: num, actuator: actuator}, 
                            callback);
    }

    // num is any number which is a multiple of 5 in the range [5-100], side is 'L' or 'R'
    setpressure (num, side, callback=null) {
	    return this.genBedURL('/sleepNumber', 
                            {bed: this.bedId, side: side, sleepNumber: num}, 
                            callback);
    }
    
}

module.exports = API
