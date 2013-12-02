var expect = require('chai').expect,
    Bamboo = require('../../bamboo/bamboo.js');

describe('Bamboo', function() {
    describe('#constructor', function() {
        it('should return new bamboo instance without error', function() {
            var bambooServer = new Bamboo("www.fakedomain.com");
        });
        it('should should prepend http:// if necessary', function() {
            bambooServer = new Bamboo('http://www.fakedomain.com')
            expect(bambooServer).to.have.property('domain', 'http://www.fakedomain.com');
            bambooServer = new Bamboo('https://www.fakedomain.com')
            expect(bambooServer).to.have.property('domain', 'https://www.fakedomain.com');
            var bambooServer = new Bamboo('www.fakedomain.com');
            expect(bambooServer).to.have.property('domain', 'https://www.fakedomain.com');
        });
    });
});