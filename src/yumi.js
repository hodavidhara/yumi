var Bamboo = require('./bamboo/bamboo.js');
var config = require('./config.json');

console.log("Starting yumi with config:" + JSON.stringify(config));

// TODO: Checks for required config.

var bamboo = new Bamboo(config.domain);

bamboo.authenticate(config.username, config.password, function(isAuthenticated) {
  if (isAuthenticated) {
    bamboo.getPlans(function(planMap) {
      console.log(planMap);
    });
  }
});
