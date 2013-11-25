var HipchatService = require('../hipchat/HipchatService.js'),
    Bamboo = require('../bamboo/bamboo.js'),
    AliasService = require('../db/AliasService.js'),
    config = require('../config.json'),
    StringUtil = require('../util/StringUtil.js');

var bamboo = new Bamboo(config.bamboo.domain);

var YUMI_KEYWORD = '!yumi';

var CommandService = function() {};

// TODO: Should these be made objects of some sort?
CommandService.prototype.commands = [
    {
        command: 'help',
        args: '',
        description: 'Displays the list of Yumi commands.',
        run: function() {
            // TODO: Build this from list of commands.
            var messageString = '<strong>Commands:</strong><br/>';
            messageString = messageString + '&emsp;show plans - Lists all build plans.<br/>';
            messageString = messageString + '&emsp;show branches &lt;plan key&gt; - Lists all branches of the given plan.<br/>';
            messageString = messageString + '&emsp;run build &lt;plan key || branch key || alias&gt; - Runs a build for the given plan, branch, or personal alias.<br/>';
            messageString = messageString + '&emsp;alias &lt;plan key&gt; &lt;alias&gt; - Creates a personal alias for a plan key.<br/>';
            messageString = messageString + '&emsp;show aliases - Lists your personal aliases.<br/>';
            HipchatService.sendMessage(messageString);
        }
    },
    {
        command: 'show plans',
        args: '',
        description: 'Lists all build plans',
        run: function() {
            this.bamboo.getPlansForProject(config.bamboo.project, function(error, plans) {

                if (error) {
                    console.log(error);
                    return;
                }

                var messageString = '';
                plans.forEach(function(plan) {
                    messageString = messageString + plan.name + ' (' + plan.key + ')<br/>';
                });
                HipchatService.sendMessage(messageString);
            });
        }
    },
    {
        command: 'run build',
        args: '<plan key || branch key || alias>',
        description: 'Runs a build for the given plan, branch, or personal alias.',
        run: function(user, args) {
            var userInput = args[0];

            AliasService.getPlanKeyForAlias(user, userInput)
                .then(_queueBuildAndSendHipchatMessage)
                .fail(function() {
                    _queueBuildAndSendHipchatMessage(userInput);
                });
        }
    },
    {
        command: 'show branches',
        args: '<plan key>',
        description: 'Lists all branches of the given plan.',
        run: function(user, args) {
            var planKey = args[0];

            console.log('getting branch for plan key: ' + planKey);

            this.bamboo.getBranchesForPlan(planKey, function(error, branches) {

                if (error) {
                    console.log(error);
                    return;
                }

                var messageString = '';
                branches.forEach(function(branch) {
                    messageString = messageString + branch.shortName + ' (' + branch.key + ')<br/>';
                });
                HipchatService.sendMessage(messageString);
            });
        }
    },
    {
        command: 'alias',
        args: '<plan key> <alias>',
        description: 'Creates a personal alias for a plan key.',
        run: function(user, args) {
            // TODO handle error case.
            if (args.length === 2) {
                var planKey = args[0];
                var aliasKey = args[1];

                if (planKey && aliasKey) {

                    AliasService.createAlias(user, planKey, aliasKey).then(function(response) {
                        var messageString = 'Aliased ' + planKey + ' to ' + aliasKey + ' for ' + user.name;
                        HipchatService.sendMessage(messageString);
                    });
                }
            }
        }
    },
    {
        command: 'show aliases',
        args: '',
        description: 'Lists your personal aliases.',
        run: function(user, args) {

            AliasService.getAllAliasesForUser(user).then(function(aliases) {
                var messageString = '';
                aliases.forEach(function(alias) {
                    messageString = messageString + alias.aliasKey + ' -> ' + alias.planKey + '<br/>'
                });
                HipchatService.sendMessage(messageString);
            });
        }
    }
];

CommandService.prototype.getCommands = function() {
    return this.commands;
};

CommandService.prototype.getCommandForMessage = function(messageString) {
    var retCommand = null;
    this.commands.forEach(function(command) {
        var fullCommand = YUMI_KEYWORD + ' ' + command.command;
        if (StringUtil.startsWith(messageString, fullCommand)) {
            retCommand = command;
            return false;
        }
    });
    return retCommand;
};

CommandService.prototype.runCommand = function(user, messageString) {
    var command = this.getCommandForMessage(messageString);

    if (command) {

        console.log('command found: ' + JSON.stringify(command));
        // Extract the arguments.
        var fullCommand = YUMI_KEYWORD + ' ' + command.command;
        var argString = messageString.slice(fullCommand.length);
        argString = argString.trim();
        console.log('running command with argString: ' + argString);
        var args = argString.split(' ');
        console.log('args:' + JSON.stringify(args));
        
        // Run the command.
        command.run.call(this, user, args);
    }
};

var _queueBuildAndSendHipchatMessage = function(planKey) {
    this.bamboo.queueBuild(planKey, function(error, response) {

        if (error) {
            console.log(error);
        } else {
            var resultUrl = 'https://' + config.bamboo.domain + '/browse/' + response.buildResultKey;
            var messageString = 'Queuing build for plan ' + planKey + '. <a href=' + resultUrl + '>View status.</a>';
            HipchatService.sendMessage(messageString);
        }

    });
};

bamboo.authenticate(config.bamboo.username, config.bamboo.password, function(error, isAuthenticated) {
    if (isAuthenticated) {
        CommandService.prototype.bamboo = bamboo;
    } else {
        console.log('ERROR AUTHENTICATING');
    }
});

module.exports = new CommandService();