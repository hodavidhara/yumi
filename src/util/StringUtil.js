var StringUtil = function() {
    this.startsWith = function(string, test) {
        return (string.lastIndexOf(test, 0) === 0);
    }
}
module.exports = new StringUtil();