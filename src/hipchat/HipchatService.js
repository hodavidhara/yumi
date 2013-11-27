var config = require('../config.json'),
    HipchatClient = require('node-hipchat'),
    q = require("q");

var DEFAULT_PARAMS = {
    room: config.hipchat.room,
    from: 'Yumi',
    message: '',
    notify: false,
    color: 'green',
    message_format: 'html'
}

var HipchatService = function() {
    this.hipchatClient = new HipchatClient(config.hipchat.apiKey);
};

HipchatService.prototype.sendMessage = function(message, callback) {
    var messageSent = q.defer();
    var params = DEFAULT_PARAMS;
    params.message = message;

    this.hipchatClient.postMessage(params, function(response) {
        messageSent.resolve(response);
        if (callback) {
            callback(null, response);
        }
    });

    return messageSent.promise;
};

HipchatService.prototype.sendPlainTextMessage = function(message, callback) {
    var messageSent = q.defer();
    var params = DEFAULT_PARAMS;
    params.message = message;
    params.message_format = 'text';

    this.hipchatClient.postMessage(params, function(response) {
        messageSent.resolve(response);
        if (callback) {
            callback(null, response);
        }
    });

    return messageSent.promise;
}

module.exports = new HipchatService();
