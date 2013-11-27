var request = require('request'),
    StringUtil = require('../util/StringUtil.js');

var Bamboo = function(domain) {
    this.username = null;
    this.password = null;
    if (StringUtil.startsWith(domain, 'http://') || StringUtil.startsWith('https://')) {
        this.domain = domain;
    }
    else {
        this.domain = 'https://' + domain;
    }
};

/**
 * Authenticate a user
 *
 * @param username
 * @param password
 * @param callback
 */
Bamboo.prototype.authenticate = function(username, password, callback) {

    var bamboo = this;
    var uri = this.domain + '/rest/api/latest/plan.json?os_authType=basic&os_username=' + username + '&os_password=' + password;

    request.get(uri, function(error, response, body) {
        if (error) {
            console.error('Authentication Failed');
            console.error(error);
            callback(error);
        } else if (response.statusCode === 401) {
            console.log('Incorrect username or password for: ' + username);
            callback(null, false)
        }

        bamboo.username = username;
        bamboo.password = password;

        callback(null, true);
    });
};

/**
 * Get all plans from bamboo.
 *
 * @param callback
 */
Bamboo.prototype.getPlans = function(callback) {

    // TODO: pick a better strategy for getting all the plans.
    var uri = this.domain + '/rest/api/latest/plan.json?max-result=50';

    request.get(uri, function(error, response, body) {
        _handleErrors(error, response, callback);

        if (callback) {
            var parsedBody = JSON.parse(body);
            callback(null, parsedBody.plans.plan);
        }
    }).auth(this.username, this.password);
};

/**
 * Get all plans for a specific project.
 *
 * @param projectKey
 * @param callback
 */
Bamboo.prototype.getPlansForProject = function(projectKey, callback) {

    this.getPlans(function(error, allPlans) {

        if (error) {
            callback(error);
        }

        var projectPlans = [];

        allPlans.forEach(function(plan) {
            if (StringUtil.startsWith(plan.key, projectKey)) {
                projectPlans.push(plan);
            }
        });

        if (callback) {
            callback(null, projectPlans);
        }
    });
};

/**
 * Get a single plan.
 *
 * @param planKey
 * @param callback
 */
Bamboo.prototype.getPlan = function(planKey, callback) {

    var uri = this.domain + '/rest/api/latest/plan/' + planKey + '.json';

    request.get(uri, function(error, response, body) {
        _handleErrors(error, response, callback);

        var plan = JSON.parse(body);

        if (callback) {
            callback(null, plan);
        }
    }).auth(this.username, this.password);
};

Bamboo.prototype.getBranchesForPlan = function(planKey, callback) {

    var uri = this.domain + '/rest/api/latest/plan/' + planKey + '/branch.json';

    request.get(uri, function(error, response, body) {
        _handleErrors(error, response, callback);

        var parsedBody = JSON.parse(body);

        if (callback) {
            callback(null, parsedBody.branches.branch);
        }
    }).auth(this.username, this.password);
};

/**
 * Get a result of a plan.
 *
 * TODO: This method isn't ready yet.
 *
 * @param planKey
 * @param callback
 */
Bamboo.prototype.getResult = function(planKey, callback) {

    var uri = this.domain + '/rest/api/latest/result/' + planKey + '.json';

    request.get(uri, function(error, response, body) {
        _handleErrors(error, response, callback);

        var parsedBody = JSON.parse(body);

        if (callback) {
            callback(parsedBody.results);
        }
    }).auth(this.username, this.password);
};

/**
 * Queue a build for a plan.
 *
 * @param planKey
 * @param callback
 */
Bamboo.prototype.queueBuild = function(planKey, callback) {

    var uri = this.domain + '/rest/api/latest/queue/' + planKey + '.json';

    request.post(uri, function(error, response, body) {
        _handleErrors(error, response, callback);

        var queueResult = JSON.parse(body);

        if (callback) {
            callback(null, queueResult);
        }
    }).auth(this.username, this.password);
};

var _handleErrors = function(error, response, callback) {
    if (error) {
        if (callback) {
            callback(error);
        }
    } else if (response.statusCode === 401) {
        console.log('Not authenticated');
        var response = {
            message: "No bamboo user authenticated."
        };
        if (callback) {
            callback(response);
        }
    }
};

module.exports = Bamboo;