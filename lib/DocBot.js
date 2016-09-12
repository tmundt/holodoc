'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var request = require('request');
var SQLite = require('sqlite3').verbose();
var Bot = require('slackbots');
var Q = require('q');

//var slack = require('./slackConnect');
var SlackAPI = require('./SlackAPI');

var slack = new SlackAPI('');

var DocBot = function Constructor(settings) {
    this.settings = settings;
    this.name = settings.name || 'holodoc';
    //this.dbPath = settings.dbPath || path.resolve(__dirname, '..', 'data', 'docbot.db');

    this.user = null;
    this.db = null;
    this.sickStationAsked = false;
};

// inherits methods and properties from the Bot constructor
util.inherits(DocBot, Bot);

/**
 * Run the bot
 * @public
 */
DocBot.prototype.run = function () {
    DocBot.super_.call(this, this.settings);

    this.on('start', this._onStart);
    this.on('message', this._onMessage);
};

// Run on first start of the bot
DocBot.prototype._onStart = function() {
    this._loadBotUser();
    this._welcomeMessage();
    //this._connectDb();
    //this._firstRunCheck();
};

/**
 * On message callback, called when a message (of any type) is detected with the real time messaging API
 * @param {object} message
 * @private
 */
DocBot.prototype._onMessage = function (message) {
    console.log('_onMessage(): message is: ');
    console.log(message);
    if (this._isChatMessage(message)&&
        this._isChannelConversation(message) &&
        !this._isFromDocBot(message) &&
        this._isMentioningDocBot(message)
    ) {
    	// Check message to generate proper output
        this._checkMessage(message);
        console.log('_onMessage(), end of checking');
    } else {
        if(this._isReaction(message)) {
            console.log('_onMessage: reaction added');
            this._checkReaction(message);
        }
    }

    console.log('_onMessage(), end');
};

/**
 * Loads user object representing the bot
 * @private
 */
DocBot.prototype._loadBotUser = function () {
    var self = this;
    this.user = this.users.filter(function (user) {
        return user.name === self.name;
    })[0];
    console.log('_loadBotUser: user.name is ' + this.user.name);
    //console.log(this.user)
};

/**
* Checks if message is of type chat
*/
DocBot.prototype._isChatMessage = function (message) {
    console.log("_isChatMessage()");
    var isChatMessage  = message.type === 'message' && Boolean(message.text);
    console.log(isChatMessage);
  return isChatMessage;
};

DocBot.prototype._isChannelConversation = function (message) {
    console.log('_isChannelConversation()');
    var isChannelConversation = typeof message.channel === 'string' &&
    message.channel[0] === 'C';
    console.log(isChannelConversation);

    return isChannelConversation;
};

/*
* Disregard message from the bot itself
*/
DocBot.prototype._isFromDocBot = function (message) {
    console.log('_isFromDocBot()');
    var isBot = message.user === this.user.id;
    console.log(isBot);
    return isBot;
};

/**
 * _areKeywordsUsed
 * Check if keywords used in message
 * @param keywords: array of words to be checked
 * @param message to be checked
 * @return isUsed: state if words are uses (true/false)
 */
var areKeyWordsUsed = function (keywords, message) {
    if(keywords.length <= 0||message == undefined) {
        console.warn('_areKeyWordsUsed(): no keywords or message to validate!');
        return null;
    }
    var isUsed = false;
    // Iterate through keywords and check if it is part of the message
    keywords.forEach(function(key) {
        isUsed = isUsed||message.text.toLowerCase().indexOf(key) > -1 ;
    });
    return isUsed;
};
/**
* Check if bot is mentioned in message
*/
DocBot.prototype._isMentioningDocBot = function (message) {
    console.log('_isMentioningDocBot()');
    var keywords = [];
    var isDocMentioned;
    keywords.push('doc');
    keywords.push('Doc');
    keywords.push(this.name);
    isDocMentioned = areKeyWordsUsed(keywords, message);
    // keywords.forEach(function(key) {
    //     isDocMentioned = isDocMentioned||message.text.toLowerCase().indexOf(key) > -1 ;
    // });
    // var isDocMentioned = message.text.toLowerCase().indexOf('holodoc') > -1 ||
    //     message.text.toLowerCase().indexOf(this.name) > -1;
    console.log(isDocMentioned);
    return isDocMentioned;
};

// Checks if user added a reaction to a message
DocBot.prototype._isReaction = function(message) {
    var isReaction = message.type === 'reaction_added';
    if (isReaction == true) {
        console.log('_isReaction: true');
    } else {
        console.log('_isReaction: false');
    }
    return isReaction;
}

DocBot.prototype._getChannelById = function (channelId) {
    return this.channels.filter(function (item) {
        return item.id === channelId;
    })[0];
};

DocBot.prototype._checkMessage = function (message) {
    console.log('_checkMessage() begin...');
    var self = this;
    var channel = self._getChannelById(message.channel);
    var sickStationAsked = false;

    slack.getUserInfo(message.user).then(function(userData) {
        console.log('promise resolved');
        var userName;
        console.log('userData is:');
        console.log(userData);

        // If there is no real name for the user, use the default user name
        if(userData.user.real_name == undefined||userData.user.real_name == null) {
            userName = userData.user.name;
        } else {
            // There is a real name, so use this
            userName = userData.user.real_name;
        }

        console.log('_checkMessage(), got message from user ' + userName + ':');
        //console.log('message.user ID is: ' + message.user);
        console.log(message);

        if(message.text.toLowerCase().indexOf('help') > -1) {
            self.postMessageToChannel(channel.name, 'Do you need medical assistance, '+ userName +'?', {as_user: true});
        }

        if(message.text.toLowerCase().indexOf('sick') > -1) {
            self.postMessageToChannel(channel.name, 'Are you sick, ' + userName +'? If so, I suggest treating your sickness at the sick station. Is this ok for you?', {as_user: true});
            this.sickStationAsked = true;
        }

        console.log('_checkMessage(), this.sickStationAsked is: ' + this.sickStationAsked);
    });

};

// checks reaction of user and to react to it
DocBot.prototype._checkReaction = function (message) {
    var self = this;
    var channel = self._getChannelById(message.item.channel);
    console.log('_checkReaction(), reaction added: ' + message.type);
    console.log('this.sickStationAsked is: ' + this.sickStationAsked);
    // check if user reacted with thumbs up after being asked to be transferred to the sick station
    if(this.sickStationAsked == true) {
        console.log('_checkMessage(), reaction added!' + message.type);
        if(message.reaction == "+1") {
            console.log('_checkReaction(), reaction was: ' + message.reaction);
            self.postMessageToChannel(channel.name, 'HoloDoc to Technics, two persons to be beamed to sick station!', {as_user: true});
            // put DocBot and User to channel sick-station
        }
    }
}

/**
 * Sends a welcome message in the channel
 * @private
 */
DocBot.prototype._welcomeMessage = function () {
    console.log('_welcomeMessage()');
    console.log('this.channels[0].name:');
    console.log(this.channels[0].name);
    this.postMessageToChannel(this.channels[0].name, 'Dear Crew, I am the medical emergency holographic program.' +
        '\n In case you need my help,  you can call my assistance in saying ´Hello Doc` or `' + this.name + 
        '.`\n In case of emergencies just say "help" or "emergency"!',
        {as_user: true});
};

module.exports = DocBot;

