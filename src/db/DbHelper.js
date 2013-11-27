var config = require('../config.json'),
    StringUtil = require('../util/StringUtil.js');
var dbUrl;

if (StringUtil.startsWith(config.yumi.dbUrl, 'http://') || StringUtil.startsWith(config.yumi.dbUrl, 'https://')) {
    dbUrl = config.yumi.dbUrl;
} else {
    dbUrl = 'https://' + config.yumi.dbUrl;
}

var nano = require('nano')(dbUrl),
    q = require('q');

var yumiDbName = 'yumi';
var views = {
    alias: {
        "map": "function(doc) {" + "if(doc.type === 'alias') {" + "emit(doc.user.user_id, doc);" + "}" + "}"
    }
};

var getYumiDb = function() {
    var dbCreated = q.defer();

    nano.db.get(yumiDbName, function(error, body) {

        if (error) {
            if (error.reason === 'no_db_file') {
                nano.db.create(yumiDbName, function() {

                    // specify the database we are going to use
                    var yumiDb = nano.use(yumiDbName);
                    createViewsIfNecessary(yumiDb);
                    dbCreated.resolve(yumiDb);
                });
            } else {
                console.error('Error connecting to couchdb. Aliasing will not work.');
            }
        } else {
            var yumiDb = nano.use(yumiDbName);
            createViewsIfNecessary(yumiDb);
            dbCreated.resolve(yumiDb);
        }
    });

    return dbCreated.promise;
};

var createViewsIfNecessary = function(db) {
    db.get('_design/yumi', function(error, body) {
        if (error) {
            if (error.message === 'missing' || error.message === 'deleted') {
                var designDoc = {};
                designDoc.views = views;
                console.log('Creating design doc');
                db.insert(designDoc, '_design/yumi', function(error, body, header) {
                    if (error) {
                        throw error;
                    }
                });
            } else {
                throw error;
            }
        } else {
            var designDoc = body;
            for (var key in views) {
                if (designDoc.views[key]) {
                    if (JSON.stringify(designDoc.views[key]) !== JSON.stringify(views[key])) {
                        console.log('Updating view: ' + key);
                        designDoc.views[key] = views[key];
                    }
                } else {
                    console.log('Adding view: ' + key);
                    designDoc.views[key] = views[key];
                }
            }

            db.insert(designDoc, '_design/yumi', function(error, body, header) {
                if (error) {
                    throw error;
                }
            });
        }
    });
};

module.exports = {
    getDb: getYumiDb
};