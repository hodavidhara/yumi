var request = require('request');

var Bamboo = function (domain) {
  if (domain.lastIndexOf('https://', 0) === 0) {
    this.domain = domain;
  } else {
    this.domain = 'https://' + domain;
  }
}

Bamboo.prototype.authenticate = function(username, password, callback) {

  var loginUrl = this.domain + '/rest/api/latest/plan?os_authType=basic&os_username=' + username + '&os_password=' + password;
  request.get(loginUrl, function(error, response, body) {
    if (error) {
      console.error("Authentication Failed with request :" + loginUrl);
      console.error(error);
      callback(false);
    } else if (response.statusCode === 401) {
      console.log("Incorrect username or password for: " + username);
      callback(false)
    }

    Bamboo.prototype.username = username;
    Bamboo.prototype.password = password;
    callback(true);
  });
}

Bamboo.prototype.getPlans = function(callback) {

  var plansUri = this.domain + '/rest/api/latest/plan.json'
  request.get(plansUri, function(error, response, body) {
    if (error) {
      console.error("Error getting plans.");
      console.error("Error");
    } else if (response.statusCode === 401) {
      console.log("Not authenticated");
    }

    var parsedBody = JSON.parse(body);
    var planMap = {};
    parsedBody.plans.plan.forEach(function(plan) {
      planMap[plan.key] = plan;
    });

    if (callback) {
      callback(planMap);
    }
  }).auth(this.username, this.password);
}

Bamboo.prototype.getPlan = function(projectKey, buildKey, callback) {

  var planUri = this.domain + '/rest/api/latest/plan/' + projectKey + '-' + buildKey + '.json';

  console.log(planUri);
  request.get(planUri, function(error, response, body) {
    if (error) {
      console.error("Error getting plans.");
      console.error("Error");
    } else if (response.statusCode === 401) {
      console.log("Not authenticated");
    }

    var parsedBody = JSON.parse(body);

    if (callback) {
      callback(parsedBody);
    }
  }).auth(this.username, this.password);
}

Bamboo.prototype.getResult = function(projectKey, buildKey, callback) {

  var planUri = this.domain + '/rest/api/latest/result/' + projectKey + '-' + buildKey + '.json';

  console.log(planUri);
  request.get(planUri, function(error, response, body) {
    if (error) {
      console.error("Error getting plans.");
      console.error("Error");
    } else if (response.statusCode === 401) {
      console.log("Not authenticated");
    }

    var parsedBody = JSON.parse(body);

    if (callback) {
      callback(parsedBody.results);
    }
  }).auth(this.username, this.password);
}

module.exports = Bamboo;