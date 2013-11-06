var nano = require('nano')('http://yumi.iriscouch.com/'),
    q = require('q');

var yumiDbName = 'yumi';

var getYumiDb = function() {
  var dbCreated = q.defer();

  nano.db.get(yumiDbName, function(error, body) {

    if (error) {
      if (error.reason === 'no_db_file') {
        nano.db.create(yumiDbName, function() {
          // specify the database we are going to use
          var yumiDb = nano.use(yumiDbName);
          dbCreated.resolve(yumiDb);
        });
      } else {
        throw error;
      }
    } else {
      var yumiDb = nano.use(yumiDbName);
      dbCreated.resolve(yumiDb);
    }
  });

  return dbCreated.promise;
}

module.exports = {
  get: getYumiDb
}