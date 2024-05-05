const cryptoHash = require('./crypto-hash')

describe('CryptoHash()', () => {

    it('should generates a SHA-256 hashed output', () => {
        expect(cryptoHash('test')).toEqual('4d967a30111bf29f0eba01c448b375c1629b2fed01cdfcc3aed91f1b57d5dd5e')
    });

    it('should be produces the same hash with the same input arguments in any order', () => {
        expect(cryptoHash('one', 'two', 'three')).toEqual(cryptoHash('three', 'one', 'two'))
    });

    it('should produces a unique hash when properties changed on input', () => {
        const test = {}
        const originalHash = cryptoHash(test)
        test['x'] = 'x'

        expect(cryptoHash(test)).not.toEqual(originalHash)
    });
});