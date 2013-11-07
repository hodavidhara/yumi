var Bamboo = require('./bamboo/bamboo.js'),
    HipchatClient = require('node-hipchat'),
    moment = require('moment'),
    config = require('./config.json'),
    StringUtil = require('./util/StringUtil.js'),
    yumiDbHelper = require('./db/yumi-db.js');

console.log('Starting yumi with config:' + JSON.stringify(config));

// TODO: Checks for required config.

var bamboo = new Bamboo(config.bamboo.domain),
    hipchat = new HipchatClient(config.hipchat.apiKey),
    yumiDb = null;

var YUMI_KEYWORD = '!yumi';

var startYumi = function() {
  console.log("Getting db...");
  yumiDbHelper.get().then(function(db) {
    yumiDb = db;
    if (!yumiDb) {
      console.log("No db found.");
      return;
    }
    console.log('db found!');
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
    room : config.hipchat.room,
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
    setTimeout(poll, 10000, mostRecentDate);
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
  messages.forEach(function (message) {
    var messageDate = moment(message.date);
    if (mostRecentDate === null || mostRecentDate < messageDate) {
      mostRecentDate = messageDate;
    }
  });
  return mostRecentDate;
}

/**
 * Goes through the messages and checks the text for any key words, then executes the appropriate command to bamboo.
 *
 * TODO: lots of clean up here.
 *
 * @param {Array} unreadMessages The list of unread messages.
 */
var searchUnreadMessagesForCommand = function(unreadMessages) {

  console.log("Searching messages for commands: " + JSON.stringify(unreadMessages));

  unreadMessages.forEach(function(message) {
    if (StringUtil.startsWith(message.message, YUMI_KEYWORD)) {
      if (message.message === YUMI_KEYWORD + ' show plans') {

        bamboo.getPlansForProject(config.bamboo.project, function(error, plans) {

          if (error) {
            console.log(error);
            return;
          }

          var messageString = '<ul>';
          plans.forEach(function(plan) {
            messageString = messageString + '<li>' + plan.name + ' (' + plan.key + ')</li>';
          });
          messageString = messageString + '</ul>';
          var params = {
            room: config.hipchat.room,
            from: 'Yumi',
            message: messageString,
            notify: false,
            color: 'green',
            message_format: 'html'
          }
          hipchat.postMessage(params, function(response) {
            console.log(response);
          });
        });
      } else if (StringUtil.startsWith(message.message, YUMI_KEYWORD + ' run plan')) {
        var tokens = message.message.split(' ');
        var planKey = tokens[3];

        bamboo.queueBuild(planKey, function(error, response) {

          if (error) {
            console.log(error);
            return;
          }

          var resultUrl = 'https://' + config.bamboo.domain + '/browse/' + response.buildResultKey;
          var messageString = 'Queuing build for plan ' + planKey + '. <a href=' + resultUrl + '>View status.</a>';
          var params = {
            room: config.hipchat.room,
            from: 'Yumi',
            message: messageString,
            notify: false,
            color: 'green',
            message_format: 'html'
          }
          hipchat.postMessage(params, function(response) {
            console.log(response);
          });
        });
      } else if (StringUtil.startsWith(message.message, YUMI_KEYWORD + ' show branches')) {
        var tokens = message.message.split(' ');
        var planKey = tokens[3];

        bamboo.getBranchesForPlan(planKey, function(error, branches) {

          if (error) {
            console.log(error);
            return;
          }

          var messageString = '<ul>';
          branches.forEach(function(branch) {
            messageString = messageString + '<li>' + branch.shortName + ' (' + branch.key + ')</li>';
          });
          messageString = messageString + '</ul>';
          var params = {
            room: config.hipchat.room,
            from: 'Yumi',
            message: messageString,
            notify: false,
            color: 'green',
            message_format: 'html'
          }
          console.log(messageString);
          hipchat.postMessage(params, function(response) {
            console.log(response);
          });

        });
      } else if (StringUtil.startsWith(message.message, YUMI_KEYWORD + ' alias')) {
        var tokens = message.message.split(' ');
        var planKey = tokens[2];
        var planAlias = tokens[3];
        var user = message.from;

        var alias = {
          type: 'alias',
          planKey: planKey,
          alias: planAlias,
          user: user
        }

        yumiDb.insert(alias, {}, function(error) {
          if (error) {
            throw error;
          }
          var messageString = 'Aliased ' + planKey + ' to ' + planAlias + ' for ' + user.name;
          var params = {
            room: config.hipchat.room,
            from: 'Yumi',
            message: messageString,
            notify: false,
            color: 'green',
            message_format: 'html'
          }
          hipchat.postMessage(params, function(response) {
            console.log(response);
          });
        });
      }
    }
  });
}

startYumi();