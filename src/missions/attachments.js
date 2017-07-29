'use strict';

const fetch = require('node-fetch');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const s3 = new AWS.S3();

module.exports.postAttachment = (event, context, callback) => {

    var attachment = JSON.parse(event.body);

    attachment = attachment.upload;

    var buf = new Buffer(attachment.contents.replace(/^data:application\/\w+;base64,/, ""),'base64');

    s3.putObject({
      Bucket: process.env.BUCKET,
      Key: event.pathParameters.missionId + "/" + attachment.name,
      Body: buf,
      ContentEncoding: 'base64',
    }).promise()
        .then(function(result) {

        const response = {
            statusCode: 201,
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        };

        callback(null, response);
        }); 
};

module.exports.deleteAttachment = (event, context, callback) => {

    console.log(event);
};