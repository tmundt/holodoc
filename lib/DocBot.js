'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3').verbose();
var Bot = require('slackbots');

var DocBot = function Constructor(settings) {
    this.settings = settings;
    this.name = settings.name || 'holodoc';
    //this.dbPath = settings.dbPath || path.resolve(__dirname, '..', 'data', 'docbot.db');

    this.user = null;
    this.db = null;
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
    if (this._isChatMessage(message) &&
        this._isChannelConversation(message) &&
        !this._isFromDocBot(message) &&
        this._isMentioningHoloDoc(message)
    ) {
    	// Check message to generate proper output
        this._checkMessage(message);
    }
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
    console.log(this.user)
};

/**
* Checks if message is of type chat
*/
DocBot.prototype._isChatMessage = function (message) {
    console.log("_isChatMessage()");
  return message.type === 'message' && Boolean(message.text);
};

DocBot.prototype._isChannelConversation = function (message) {
    return typeof message.channel === 'string' &&
        message.channel[0] === 'C';
};

/*
* Disregard message from the bot itself
*/
DocBot.prototype._isFromDocBot = function (message) {
    return message.user === this.user.id;
};
/**
* Check if bot is mentioned in message
*/
DocBot.prototype._isMentioningHoloDoc = function (message) {
    return message.text.toLowerCase().indexOf('holodoc') > -1 ||
        message.text.toLowerCase().indexOf(this.name) > -1;
};

DocBot.prototype._getChannelById = function (channelId) {
    return this.channels.filter(function (item) {
        return item.id === channelId;
    })[0];
};

DocBot.prototype._checkMessage = function (originalMessage) {
    var self = this;
    console.log('_checkMessage, got originalSessage:');
    console.log(originalMessage);
    // self.db.get('SELECT id, joke FROM jokes ORDER BY used ASC, RANDOM() LIMIT 1', function (err, record) {
    //     if (err) {
    //         return console.error('DATABASE ERROR:', err);
    //     }

    //     var channel = self._getChannelById(originalMessage.channel);
    //     self.postMessageToChannel(channel.name, record.joke, {as_user: true});
    //     self.db.run('UPDATE jokes SET used = used + 1 WHERE id = ?', record.id);
    // });

    var channel = self._getChannelById(originalMessage.channel);
    self.postMessageToChannel(channel.name, 'ja', {as_user: true});
};

/**
 * Sends a welcome message in the channel
 * @private
 */
DocBot.prototype._welcomeMessage = function () {
    console.log('_welcomeMessage()');
    console.log('this.channels[0].name:');
    console.log(this.channels[0].name);
    this.postMessageToChannel(this.channels[0].name, 'Dear Crew, I am the medical emergency holographic program.' +
        '\n In case of medical emergencies, you can call my assistance in saying ´Doc` or `' + this.name + '`!',
        {as_user: true});
};

module.exports = DocBot;

