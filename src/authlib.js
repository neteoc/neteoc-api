const Promise = require('promise');
var request = require('request');

// TODO: Do we need promise or can we just use the stuff that's built in?
module.exports.validateJWT = (event) => {
  if (event.headers.Host.indexOf("localhost") == 0) {
      return new Promise(function(resolve){
      console.log("we be localhost")
      resolve();
    })
  } else {
    return new Promise(function(resolve, reject){
        console.log(event.headers.Authorization)
        console.log("--------------TEST_________________")
      if(event.headers.Authorization){
          var authHeader = event.headers.Authorization.split(" ")
          var token = authHeader[1]
            request('https://dwaomjth0nnz7.cloudfront.net/users',
            {
            'auth': {
                'bearer': token
                }
            },
            function (error, response, body) {
                console.log('error:', error); // Print the error if one occurred
                if (response.statusCode == 200) {
                    resolve();
                } else {
                    reject(error);
                }
            });
      } else {
        console.log("________________no auth header__________________")
        reject({err: {message: "no auth header"}});
      }

    })
  }
}