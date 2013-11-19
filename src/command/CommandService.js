var HipchatService = require('../hipchat/HipchatService.js'),
    StringUtil = require('../util/StringUtil.js');

var YUMI_KEYWORD = '!yumi';

var CommandService = function() {
    this.commands = {
        "help": {
            command: 'help',
            description: 'Displays the list of Yumi commands.',
            exec: function() {
                var messageString = '<strong>Commands:</strong><br/>';
                messageString = messageString + '&emsp;show plans - Lists all build plans.<br/>';
                messageString = messageString + '&emsp;show branches &lt;plan key&gt; Lists all branches of the given plan.<br/>';
                messageString = messageString + '&emsp;run build &lt;plan key || branch key || alias&gt; - Runs a build for the given plan, branch, or personal alias.<br/>';
                messageString = messageString + '&emsp;alias &lt;plan key&gt; &lt;alias&gt; - Creates a personal alias for a plan key.<br/>';
                messageString = messageString + '&emsp;show aliases - Lists your personal aliases.<br/>';
                HipchatService.sendMessage(messageString);
            }
        }
    }
}

CommandService.prototype.getCommandForMessage = function(messageString) {
    for (var commandKey in this.commands) {
        var fullCommand = YUMI_KEYWORD + ' ' + commandKey;
        if (StringUtil.startsWith(fullCommand, messageString)) {
            return this.commands[commandKey];
        }
    }
    return null;
}