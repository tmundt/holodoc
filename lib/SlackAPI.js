/**
 * API calls to Slack
 * @author: thomasmundt on 11.09.16.
 */
'use strict';

var path = require('path');
var fs = require('fs');
var request = require('request');
var https = require('https');
var Q = require('q');
// configs for local server
//var token = process.env.SLACK_API_KEY || require('../config').token.enterprise.slackAPI;
//var token = process.env.SLACK_API_KEY || require('../config').token.coresystemsteam.slackAPI;

// token and api keys for deployment with heroku
var token = process.env.SLACK_API_KEY;
var SlackAPI = function Constructor(settings) {
    this.baseURL = settings.url||'https://slack.com/api/';
}

/**
 * getUserName(): returns username from an given userid
 * @param userID
 */
SlackAPI.prototype.getUserInfo = function(userID) {
    console.log('SlackAPI.getUserInfo(), this.baseURL: ' + this.baseURL);
    console.log('token: ' + token + ', userID: ' + userID);
    var deferred = Q.defer();
    request({
        url: this.baseURL+'users.info' + '?token=' + token + '&user='+ userID,
        method: 'GET',
        qs: {
            token: token,
            user: userID
        },
        json: true
    }, function(error, response, body) {
        console.log('Requesting Slack API, getUserInfo()');
        if(error) {
            deferred.reject(new Error(err));
            return console.error('An error occured: ' + error);
        }

        if(response.statusCode != 200) {
            console.warn('Status Code is: ' + status.code);
        }
        var data = body;
        deferred.resolve(data);
        //console.log(data);
    });
    return deferred.promise;
};

SlackAPI.prototype.gotoChannel = function(users) {
    console.log('SlackAPI.gotoChannel(), this.baseURL: ' + this.baseURL);
    console.log('token: ' + token + ', userID: ' + userID);
    var deferred = Q.defer();
    request({
        url: this.baseURL+'users.info' + '?token=' + token + '&user='+ userID,
        method: 'GET',
        qs: {
            token: token,
            user: userID
        },
        json: true
    }, function(error, response, body) {
        console.log('Requesting Slack API, getUserInfo()');
        if(error) {
            deferred.reject(new Error(err));
            return console.error('An error occured: ' + error);
        }

        if(response.statusCode != 200) {
            console.warn('Status Code is: ' + status.code);
        }
        var data = body;
        deferred.resolve(data);
        //console.log(data);
    });
    return deferred.promise;
};

module.exports = SlackAPI;