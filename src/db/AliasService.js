var DbHelper = require("./DbHelper"),
    q = require("q");

var AliasService = function() {
    this.yumiDb = null;
    var service = this;
    
    DbHelper.getDb.then(function(db) {
        service.yumiDb = db;
    });
};

AliasService.prototype.createAlias = function(user, planKey, aliasKey) {
    var aliasCreated = q.defer();
    
    var alias = {
        type: 'alias',
        planKey: planKey,
        alias: aliasKey,
        user: user
    };

    this.yumiDb.insert(alias, {}, function(error, body) {
        if (error) {
            aliasCreated.reject(error);
        } else {
            aliasCreated.resolve(body);
        }
    });
    
    return aliasCreated.promise;
};

AliasService.prototype.getAllAliasesForUser = function(user) {
    
    var aliasFound = q.defer();
    
    var userId = null;
    if (user instanceof String) {
        userId = user;
    } else {
        userId = user.user_id;
    }
    
    this.yumiDb.view('yumi', 'alias', {key: userId}, function(error, body) {

        if (error) {
            aliasFound.reject(error);
        } else {
            // TODO: format into map of alias -> plan key.
            aliasFound.resolve(body);
        }
    });
    
    return aliasFound.promise;
};
