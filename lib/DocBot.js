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
    this.isAtSickStation = false;
    this.needMedicalAssistanceAsked = false;
    this.subscribedChannels;
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
    var self = this;
    this._loadBotUser();
    // Gathers all channels where user is member of
    console.log('_onStart(), this.user: ' + this.user.name);
    self.subscribedChannels = this._getChannelsByUser(this.user.name);

    this._welcomeMessage();
    //this._connectDb();
    //this._firstRunCheck();
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
    console.log('_loadBotUser(): user.name is ' + this.user.name);
    //console.log(this.user);
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
* Checks if message is of type chat
*/
DocBot.prototype._isChatMessage = function (message) {
    //console.log("_isChatMessage()");
    var isChatMessage  = message.type === 'message' && Boolean(message.text);
    //console.log(isChatMessage);
  return isChatMessage;
};

DocBot.prototype._isChannelConversation = function (message) {
    //console.log('_isChannelConversation()');
    var isChannelConversation = typeof message.channel === 'string' &&
        (message.channel[0] === 'C' ||message.channel[0] === 'G');
    //console.log(isChannelConversation);

    return isChannelConversation;
};

/*
* Disregard message from the bot itself
*/
DocBot.prototype._isFromDocBot = function (message) {
    //console.log('_isFromDocBot()');
    var isBot = message.user === this.user.id;
    //console.log(isBot);
    return isBot;
};


/**
 *
 * @param userName
 * @returns {*}
 */
DocBot.prototype._getRandomAnswer = function(userName) {
    //console.log('getRandomAnswer()');
    var answer;
    var answers = [
        "Yes, please?",
        "If you need help or you are sick, let me know.",
        "Sorry, but I do not understand what you mean " + userName +"!",
        "I am here to help you if you need medical assistance.",
        "My name is " + this.name +".",
        "If you are sick or need help, I can help.",
        "Pardon me?"
    ]
    var randomIndex = Math.floor((Math.random() * answers.length));
    //console.log('_getRandomAnswers(), randomIndex: ' + randomIndex);
    var answer = answers[randomIndex];
    //console.log('Has answer: ' + answer);
    return answer;
}

/**
* Check if bot is mentioned in message
*/
DocBot.prototype._isMentioningDocBot = function (message) {
    var keywords = [];
    var isDocMentioned;
    keywords.push('doc');
    keywords.push('Doc');
    keywords.push(this.name);
    keywords.push('@' + this.name);
    isDocMentioned = this._areKeyWordsUsed(keywords, message);
    console.log('_isMentioningDocBot(): ' + isDocMentioned);
    return isDocMentioned;
};

// Checks if user added a reaction to a message
DocBot.prototype._isReaction = function(message) {
    var isReaction = message.type === 'reaction_added';
    // if (isReaction == true) {
    //     console.log('_isReaction: true');
    // } else {
    //     console.log('_isReaction: false');
    // }
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
    var isMessageUnderstood = false;

    slack.getUserInfo(message.user).then(function(userData) {
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

        // check if doc was greeted by user
        var isDocGreeted = self._areKeyWordsUsed(['hi', 'hey', 'hello', 'good morning', 'good evening'], message);
        console.log('doc is greeted: ' + isDocGreeted);
        if(isDocGreeted == true) {
            self.postMessageToChannel(channel.name, 'Hello, '+ userName +', nice to meet you.', {as_user: true});
            isMessageUnderstood = true;
        }

        // check if user needs help
        if(self._areKeyWordsUsed('help', message) == true) {
            self.postMessageToChannel(channel.name, 'Do you need medical assistance, '+ userName +'?', {as_user: true});
            self.needMedicalAssistanceAsked = true;
            isMessageUnderstood = true;
        }

        if(self._areKeyWordsUsed('sick', message)||self._areKeyWordsUsed('yes', message) && self.needMedicalAssistanceAsked == true) {
            self.postMessageToChannel(channel.name, 'Are you sick, ' + userName +'? If so, I suggest treating your sickness at the sick station. Is this ok for you?', {as_user: true});
            self.sickStationAsked = true;
            isMessageUnderstood = true;
        }

        if(self._areKeyWordsUsed('yes', message) && self.sickStationAsked == true) {
            // Prevent execution of posting message/going to sick station if message part is "yes"
            if(self.needMedicalAssistanceAsked == true) {
                self.needMedicalAssistanceAsked = false;
                return;
            }
            self.postMessageToChannel(channel.name, 'HoloDoc to Technics, two persons to be beamed to sick station!', {as_user: true});
            // put DocBot and User to channel sick-station
            self.isAtSickStation = true;
            self.sickStationAsked = false;
            isMessageUnderstood = true;
        }

        if(self._areKeyWordsUsed('no', message) && self.sickStationAsked||self._areKeyWordsUsed('no', message) && self.needMedicalAssistanceAsked) {
            // Prevent execution of posting message/going to sick station if message part is "no"
            if(self.needMedicalAssistanceAsked == false&&self.sickStationAsked == false) {
                return;
            }
            self.postMessageToChannel(channel.name, 'Sorry to hear that!', {as_user: true});
            self.sickStationAsked = false;
            if(self.needMedicalAssistanceAsked) {
                self.needMedicalAssistanceAsked = false;
            }
            isMessageUnderstood = true;
        }

        if(self._areKeyWordsUsed('profile', message)&&self._areKeyWordsUsed('slack', message)) {
            var response = 'This is your profile on slack:';
            var profile = userData.user.profile;
            response += '\nName: ' + userName;
            if(profile.title) {
                response += '\nTitle:' + profile.title;
            }
            if(profile.skype) {
                response += '\nSkype Name: ' + profile.skype;
            }
            if(profile.email) {
                response += '\nEmail: ' + profile.email;
            }
            self.postMessageToChannel(channel.name, response, {as_user: true});
            isMessageUnderstood = true;

        }

        // Message was not understood, so output some random answer
        if(isMessageUnderstood == false) {
            self.postMessageToChannel(channel.name, self._getRandomAnswer(userName), {as_user: true});
        }


    });
    //console.log('_checkMessage(), this.sickStationAsked is: ' + self.sickStationAsked);
};

// checks reaction of user and to react to it
DocBot.prototype._checkReaction = function (message) {
    var self = this;
    var channel = self._getChannelById(message.item.channel);
    var channel = self._getChannelById(message.item.channel);
    //console.log('_checkReaction(), checking reaction of: ' + message.type);
    //console.log('this.sickStationAsked is: ' + this.sickStationAsked);
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
DocBot.prototype._welcomeMessage = function (channelName) {
    var channel;
    console.log('_welcomeMessage()');
    // Get first channel where bot is member of
    //channel = this.subscribedChannels[0];
    // For testing purposes, only show welcome message on test channel
    this.subscribedChannels.forEach(function (c) {
        if(c.name == channelName||'test-bot') {
            //console.log('channel found: ' + c.name);
            channel = c;
        }
    });


    this.postMessageToChannel(channel.name, 'Dear Team, I am the medical emergency holographic program.' +
        '\n In case you need my assistance, just tell me that you need my `help` by calling my name `' + this.name +
        '` or short `doc`.',
        {as_user: true});
};

//Helper functions
/**
 * getChannelsByUser
 * get channels where user is member of
 * @returns {Array.<T>|*}
 * @private
 */
DocBot.prototype._getChannelsByUser = function(userName) {
    //console.log(this.channels);
    //Bot ID: B2B4W7JLC
    console.log('getChannelsByUser, userName: ' + userName);
    var channels = this.channels.filter(function (item) {
        return item.is_member === true;
    });
    console.log('Subscribed channels of user ' + userName + ' ('+ channels.length + '):');
    channels.forEach(function(channel) {
        console.log(channel.name);
    })
    //console.log(channels);
    return channels;
};

/**
 * checkWordInMessage
 * @param word
 * @param message
 * @returns {boolean}
 */
DocBot.prototype.checkWordInMessage = function(word, message) {
    //console.log('checkWordInMessage()');
    //console.log('Checking message.text: ' + message.text);
    var isValid = false;
    var isFound;
    var regExIsPartOfSentence = new RegExp(word + '[,.]*(?![aA-zZ])','i');
    //console.log('regular expression: ');
    //console.log(regExIsPartOfSentence);

    isFound = message.text.search(regExIsPartOfSentence);
    if(isFound >-1) {
        isValid = true;
        //console.log('isValid is true');
    }
    //isValid = message.text.match(regExIsPartOfSentence);
    //console.log('checkWordInMessage(), word ' + word + ' is match: ' + isValid);
    return isValid;
}

/**
 * _areKeywordsUsed
 * Check if keywords used in message
 * @param keywords: array of words to be checked
 * @param message to be checked
 * @return isUsed: state if words are uses (true/false)
 */
DocBot.prototype._areKeyWordsUsed = function (keywords, message) {
    console.log('areKeyWordsUsed(), keywords: ' + keywords);
    var isUsed = false;
    var self = this;
    if(keywords.length <= 0||message == undefined) {
        console.warn('_areKeyWordsUsed(): no keywords or message to validate!');
        return null;
    }
    // If keyword is of type string, then there is only one word
    if(typeof keywords == 'string') {
        isUsed = self.checkWordInMessage(keywords, message);
    } else {
            // Iterate over array of keywords and check if it is part of the message
            keywords.forEach(function(key) {
            //isUsed = isUsed||message.text.toLowerCase().indexOf(key) > -1 ;
            isUsed = isUsed||self.checkWordInMessage(key, message);
        });
    }

    //console.log('_areKeyWordsUsed(), isUsed: ' + isUsed);
    return isUsed;
};


module.exports = DocBot;

