const Transaction = require('./transaction')
const Wallet = require('./index')

describe('Transaction', () => {
    let transaction, senderWallet, recipient, amount

    beforeEach(() => {
        senderWallet = new Wallet()
        recipient = 'recipient-public-key'
        amount = 50

        transaction = new Transaction({senderWallet, recipient, amount})
    })

    it('should has an `id', () => {
        expect(transaction).toHaveProperty('id')
    });

    describe('outputMap', () => {
        it('should has `outputMap`', () => {
            expect(transaction).toHaveProperty('outputMap')
        });

        it('should outpust the amount to the recipient', () => {
            expect(transaction.outputMap[recipient]).toEqual(amount)
        });

        it('should outputs the remaining balance for the `senderWallet', () => {
            expect(transaction.outputMap[senderWallet.publicKey]).toEqual(senderWallet.balance - amount)
        });
    });
});