'use strict';

const fetch = require('node-fetch');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const s3 = new AWS.S3();

module.exports.getAttachments = (event, context, callback) => {

    var missionId = event.pathParameters.missionId;

    if(!missionId) {
        return Promise.reject(new Error(
            `You no give key for mission, you bad person.`));
    }

    var params = {
        Bucket: process.env.BUCKET,
        Prefix: missionId
    }

    s3.listObjects(params, function(err, data) {

        if (err) {
            console.log("Something is broke trying to list objects in path " + missionId + " in bucket " + process.env.BUCKET);
            console.log(err, err.stack); // an error occurred
        } else if(data.Contents == null) {
            console.log("Didn't error, but contents are null because I'm stupid");
        }

        var attachments = [];

        for(var index in data.Contents) {

            attachments.push(data.Contents[index].Key.replace(missionId + "/", ""));
        }

        const response = {
            statusCode: 200,
            body: JSON.stringify(attachments),
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        };

        callback(null, response);
    });
};

module.exports.getAttachmentLink = (event, context, callback) => {

    var missionId = event.pathParameters.missionId;
    var attachmentId = unescape(event.pathParameters.attachmentId);

    var url = s3.getSignedUrl('getObject', {
        Bucket: process.env.BUCKET,
        Key: missionId + "/" + attachmentId,
        Expires: 60
    });

    const response = {
        statusCode: 301,
        headers: {
            Location: url
        }
    };

    callback(null, response);
}

module.exports.getAttachment = (event, context, callback) => {

    var missionId = event.pathParameters.missionId;
    var attachmentId = event.pathParameters.attachmentId;

    getAttachment(missionId + "/" + attachmentId).then(function(attachment) {

        const response = {
            statusCode: 200,
            body: JSON.stringify(attachment),
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        };

        callback(null, response);
    });
}

// currently unused, maybe delete ...
module.exports.getAllAttachments = (event, context, callback) => {

    var mission = JSON.parse(event.body);

    if(!mission.id) {
    return Promise.reject(new Error(
            `You no give key for mission, you bad person.`));
    }

    var params = {
        Bucket: process.env.BUCKET,
        Key: mission.id
    }

    s3.listObjects(params, function(err, data) {

        if (err) console.log(err, err.stack); // an error occurred

        var attachments = {};
        var objectCount = data.Contents.length;

        for(var index in data.Contents) {

            // params.Key = "missions/" + mission.id + "/" + data.Key;

            getAttachment("missions/" + mission.id + "/" + data.Key)
            .then(function(attachment) {

                console.log(data.Key);
                console.log(attachment);

                attachments[data.Key] = attachment;

                if(Object.keys(attachments).length == objectCount) {

                    const response = {
                        statusCode: 200,
                        body: JSON.stringify(attachments),
                        headers: {
                            'Access-Control-Allow-Origin': '*'
                        }
                    };

                    callback(null, response);
                }
            });
        }
    }) 
}

function getAttachment(key) {

    return new Promise(function(resolve,reject){

        var params = {
          Bucket: process.env.BUCKET,
          Key: key
        }

      s3.getObject(params, function(err, data) {

        if(err) {
          console.log(err);
          resolve({});
        } else {

          resolve(data.Body.toString());
        }
    });
  });
}

module.exports.postAttachment = (event, context, callback) => {

    var attachments = JSON.parse(event.body);

    attachments = attachments.uploads;

    for(var index in attachments) {

        var attachment = attachments[index];

        // TODO: support images and other data types
        var buf = new Buffer(attachment.replace(/^data:application\/\w+;base64,/, ""),'base64');

        s3.putObject({
            Bucket: process.env.BUCKET,
            Key: event.pathParameters.missionId + "/" + index,
            Body: buf,
            ContentEncoding: 'base64',
        })
        .promise().then(function(result) {

            const response = {
                statusCode: 201,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                }
            };

            callback(null, response);
        }); 
    }
};

module.exports.deleteAttachment = (event, context, callback) => {

    console.log(event);
};
