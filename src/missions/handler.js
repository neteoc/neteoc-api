'use strict';

const fetch = require('node-fetch');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const s3 = new AWS.S3();


const neteocauth = require('../authlib')

module.exports.getMissions = (event, context, callback) => {

   neteocauth.validateJWT(event).then(
      getMissions().then(function(missions) {
          const response = {
            statusCode: 200,
            body: JSON.stringify(missions),
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
          };

          callback(null, response);
        })
   ).catch(err => {
    const response = {
      statusCode: 403,
      body: JSON.stringify({
        message: err,
        input: event
      }),
      headers: {
        "Access-Control-Allow-Origin" : "*" // Required for CORS support to work
      },
    };
    callback(null, response);
  });

  
};

module.exports.postMission = (event, context, callback) => {

  // TODO: try, and encapsulate return error with the if mission id ...
  var mission = JSON.parse(event.body);

  if(!mission.id) {
    return Promise.reject(new Error(
          `You no give key for mission, you bad person.`));
  }

  getMissions().then(function(missions) {

    missions[mission.id] = mission;
    
    saveMissions(missions)
      .then(function(missions) {

        const response = {
          statusCode: 201,
          headers: {
              'Access-Control-Allow-Origin': '*'
          }
        };

        callback(null, response);
      }); 
  });
};

function saveMissions(missions) {

    return s3.putObject({
      Bucket: process.env.BUCKET,
      Key: "missions",
      Body: JSON.stringify(missions),
    }).promise();
}

function getMissions() {

    return new Promise(function(resolve,reject){

        var params = {
          Bucket: process.env.BUCKET,
          Key: "missions"
        }

      s3.getObject(params, function(err, data) {

        if(err) {
          console.log(err);
          resolve({});
        } else {
          var missions = JSON.parse(data.Body.toString());

          resolve(missions);
        }
    });
  });
}

module.exports.attendMission = (event, context, callback) => {

  var missionId = event.pathParameters.missionId;
  // TODO: call auth service to get full user object (with name!)
  var userId = event.body;

  if(!missionId || !userId) {
    return Promise.reject(new Error(
          `You no give key for user, you bad person.`));
  }

  getMissions().then(function(missions) {

    if(!missionId in missions) {
      return Promise.reject(new Error(
            `Mission does not exist.`));
    }
    var mission = missions[missionId];

    if(!('staff' in mission)) {
      mission.staff = {};
    }
    mission.staff[userId] = {name: userId};

    saveMissions(missions)
      .then(function(missions) {

        const response = {
          statusCode: 201,
          headers: {
              'Access-Control-Allow-Origin': '*'
          }
        };

        callback(null, response);
      });
  });
};