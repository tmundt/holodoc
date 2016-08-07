'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3').verbose();
var Bot = require('slackbots');

var DocBot = function Constructor(settings) {
    this.settings = settings;
    this.settings.name = this.settings.name || 'norrisbot';
    this.dbPath = settings.dbPath || path.resolve(__dirname, '..', 'data', 'norrisbot.db');

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