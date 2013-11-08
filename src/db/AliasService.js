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
        aliasKey: aliasKey,
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

    var userId = getUserIdFromGenericUserInput(user);

    this.yumiDb.view('yumi', 'alias', {key: userId}, function(error, body) {

        if (error) {
            aliasFound.reject(error);
        } else {

            var userAliases = [];

            body.rows.forEach(function(row) {
                userAliases.push({
                    aliasKey: row.value.aliasKey,
                    planKey: row.value.planKey
                });
            });
            aliasFound.resolve(userAliases);
        }
    });
    
    return aliasFound.promise;
};

AliasService.prototype.getPlanKeyForAlias = function(user, aliasKey) {

    var planKeyFound = q.defer();

    this.getAllAliasesForUser(user).then(function(aliases) {
        aliases.forEach(function(alias) {
           if (alias.aliasKey == aliasKey) {
               planKeyFound.resolve(alias.planKey);
           }
        });

        // no matching alias found
        planKey.reject("No matching alias found");
    }).fail(function(error) {
        planKeyFound.reject(error);
    });

    return planKeyFound.promise;
}

var getUserIdFromGenericUserInput = function(user) {
    if (user instanceof String) {
        return user;
    } else {

        // Hipchat user objects store the id under the user_id property.
        return user.user_id;
    }
}

module.exports = AliasService;
