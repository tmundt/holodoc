#!/usr/bin/env node

'use strict';

/**
 * DocBot launch
 *
 * @author: Thomas Mundt
 * original idea by Luciano Mammino <lucianomammino@gmail.com>
 */

var DocBot = require('./lib/DocBot');

/**
 * Environment variables used to configure the bot:
 *
 *  BOT_API_KEY : the authentication token to allow the bot to connect to your slack organization. You can get your
 *      token at the following url: https://<yourorganization>.slack.com/services/new/bot (Mandatory)
 *  BOT_DB_PATH: the path of the SQLite database used by the bot
 *  BOT_NAME: the username you want to give to the bot within your organisation.
 */
var token = process.env.BOT_API_KEY || require('./token');
//var dbPath = process.env.BOT_DB_PATH ||'some/path';
var name = process.env.BOT_NAME||'holodoc';

console.log('index.js: name: ' + name);

var docbot = new DocBot({
    token: token,
    //dbPath: dbPath,
    name: name
});

docbot.run();