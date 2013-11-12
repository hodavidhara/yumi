var DbHelper = require("./DbHelper"),
    q = require("q");

var AliasService = function() {
    this.yumiDb = null;
    var service = this;
    
    DbHelper.getDb.then(function(db) {
        service.yumiDb = db;
    });
};

AliasService.prototype.createAlias = function(user, planKey, aliasKey, callback) {
    var aliasCreated = q.defer();
    
    var alias = {
        type: 'alias',
        planKey: planKey,
        aliasKey: aliasKey,
        user: user
    };

    this.yumiDb.insert(alias, {}, function(error, body) {
        if (error) {
            aliasCreated.reject(error);
            if (callback) {
                callback(error);
            }
        } else {
            aliasCreated.resolve(body);
            if (callback) {
                callback(null, body);
            }
        }
    });
    
    return aliasCreated.promise;
};

AliasService.prototype.getAllAliasesForUser = function(user, callback) {
    
    var aliasFound = q.defer();

    var userId = _getUserIdFromGenericUserInput(user);

    this.yumiDb.view('yumi', 'alias', {key: userId}, function(error, body) {

        if (error) {
            aliasFound.reject(error);
            if (callback) {
                callback(error);
            }
        } else {

            var userAliases = [];

            body.rows.forEach(function(row) {
                userAliases.push({
                    aliasKey: row.value.aliasKey,
                    planKey: row.value.planKey
                });
            });
            aliasFound.resolve(userAliases);
            if (callback) {
                callback(null, userAliases);
            }
        }
    });
    
    return aliasFound.promise;
};

AliasService.prototype.getPlanKeyForAlias = function(user, aliasKey, callback) {

    var planKeyFound = q.defer();

    this.getAllAliasesForUser(user).then(function(aliases) {
        aliases.forEach(function(alias) {
           if (alias.aliasKey == aliasKey) {
               planKeyFound.resolve(alias.planKey);
               if (callback) {
                   callback(null, alias.planKey);
               }
           }
        });

        // no matching alias found
        planKey.reject("No matching alias found.");
        if (callback) {
            callback("No matching alias found.");
        }
    }).fail(function(error) {
        planKeyFound.reject(error);
        if (callback) {
            callback(error);
        }
    });

    return planKeyFound.promise;
}

var _getUserIdFromGenericUserInput = function(user) {
    if (user instanceof String) {
        return user;
    } else {

        // Hipchat user objects store the id under the user_id property.
        return user.user_id;
    }
}

module.exports = AliasService();
