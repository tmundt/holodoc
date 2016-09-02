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
    //this._connectDb();
    //this._firstRunCheck();
};

/**
 * On message callback, called when a message (of any type) is detected with the real time messaging API
 * @param {object} message
 * @private
 */
DocBot.prototype._onMessage = function (message) {
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
};


/**
 * Sends a welcome message in the channel
 * @private
 */
DocBot.prototype._welcomeMessage = function () {
    this.postMessageToChannel(this.channels[0].name, 'Dear Crew, I am the medical emergency holographic program.' +
        '\n In case of medical emergencies, you can call my assistance in saying ´Doc` or `' + this.name + '`!',
        {as_user: true});
};

module.exports = DocBot;

