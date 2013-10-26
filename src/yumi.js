var Bamboo = require('./bamboo/bamboo.js'),
    HipchatClient = require('node-hipchat'),
    config = require('./config.json');

console.log("Starting yumi with config:" + JSON.stringify(config));

// TODO: Checks for required config.

var bamboo = new Bamboo(config.domain),
    hipchat = new HipchatClient(config.hipchatApiKey);

bamboo.authenticate(config.username, config.password, function(isAuthenticated) {
  if (isAuthenticated) {
    bamboo.getPlans(function(planMap) {
      console.log(planMap);
    });
  }
});

hipchat.listRooms(function(rooms) {
  console.log(rooms);
})