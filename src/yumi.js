var Bamboo = require('./bamboo/bamboo.js'),
    HipchatClient = require('node-hipchat'),
    moment = require('moment'),
    config = require('./config.json'),
    StringUtil = require('./util/StringUtil.js'),
    CommandService = require('./command/CommandService.js');

console.log('Starting yumi with config:' + JSON.stringify(config));

// TODO: Checks for required config.

var bamboo = new Bamboo(config.bamboo.domain),
    hipchat = new HipchatClient(config.hipchat.apiKey);

var YUMI_KEYWORD = '!yumi';

var startYumi = function() {
    console.log('Authenticating...');

    // Authenticate bamboo and start polling.
    bamboo.authenticate(config.bamboo.username, config.bamboo.password, function(error, isAuthenticated) {

        if (error) {
            console.log(error);
            return;
        }

        if (isAuthenticated) {
            console.log('Authenticated!');
            poll();
        }
    });
}

/**
 * Poll for messages and execute commands
 *
 * @param fromDate a moment.js date object.
 */
var poll = function(fromDate) {
    console.log('polling for messages.');
    var params = {
        room: config.hipchat.room,
        date: 'recent'
    }
    hipchat.getHistory(params, function(response, error) {
        if (error) {
            console.log('ERROR: ' + error);
        }
        var messages = response.messages;
        var unreadMessages = getUnreadMessages(messages, fromDate);
        var mostRecentDate = getMostRecentDateFromMessages(unreadMessages);
        searchUnreadMessagesForCommand(unreadMessages);
        setTimeout(poll, 7000, mostRecentDate);
    });
}

/**
 * Gets all messages from the given list that happened after the given date.
 *
 * @param {Array} messages The list of all messages.
 * @param lastDate A moment.js date that we want messages after.
 * @returns {Array} The list of 'unread' messages.
 */
var getUnreadMessages = function(messages, lastDate) {
    var unreadMessages = [];

    if (!lastDate) {
        return unreadMessages;
    }
    messages.forEach(function(message) {
        var messageDate = moment(message.date);
        if (messageDate > lastDate) {
            unreadMessages.push(message);
        }
    });

    return unreadMessages;
}

/**
 * Gets the date of the most recently posted message.
 *
 * TODO: There's lost of that can be done to improve this as the messages seem to always be in order.
 * @param messages The list of messages.
 * @returns {*} a moment.js object.
 */
var getMostRecentDateFromMessages = function(messages) {
    var mostRecentDate = null;

    // If we got no messages, make now the most recent date.
    if (!messages || messages.length === 0) {
        return moment();
    }
    messages.forEach(function(message) {
        var messageDate = moment(message.date);
        if (mostRecentDate === null || mostRecentDate < messageDate) {
            mostRecentDate = messageDate;
        }
    });
    return mostRecentDate;
}

/**
 * Goes through the messages and checks the text for the yumi keyword, then executes the appropriate command to bamboo.
 *
 * @param {Array} unreadMessages The list of unread messages.
 */
var searchUnreadMessagesForCommand = function(unreadMessages) {

    console.log("Searching messages for commands: " + JSON.stringify(unreadMessages));

    unreadMessages.forEach(function(message) {
        if (StringUtil.startsWith(message.message, YUMI_KEYWORD)) {
            CommandService.runCommand(message.from, message.message);
        }
    });
}

startYumi();