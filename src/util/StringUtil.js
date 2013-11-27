var StringUtil = function() {};

StringUtil.prototype.startsWith = function(string, test) {
    return (string.lastIndexOf(test, 0) === 0);
};

module.exports = new StringUtil();