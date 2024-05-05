const Transaction = require('./transaction')
const Wallet = require('./index')
const {verifySignature} = require("../util");

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

    describe('input', () => {
        it('should has an `input`', () => {
            expect(transaction).toHaveProperty('input')
        });

        it('should has a `timestamp`', () => {
            expect(transaction.input).toHaveProperty('timestamp')
        });

        it('should sets the `amount` to the `senderWallet` balance', () => {
            expect(transaction.input.amount).toEqual(senderWallet.balance)
        });

        it('should sets the `address` to the `senderWallet` publicKey', () => {
            expect(transaction.input.address).toEqual(senderWallet.publicKey)
        });

        it('should signs the input', () => {
            expect(verifySignature({
                publicKey: senderWallet.publicKey,
                data: transaction.outputMap,
                signature: transaction.input.signature
            })).toBe(true)
        });
    });

    describe('validTransaction()', () => {
        let errorMock

        beforeEach(() => {
            errorMock = jest.fn()

            global.console.error = errorMock
        })

        describe('when the transaction is valid', () => {
            it('should returns true', () => {
                expect(Transaction.validTransaction(transaction)).toBe(true)
            });
        });

        describe('when the transaction is invalid', () => {
            describe('and a transaction outputMap value is invalid', () => {
                it('should returns false and logs an error', () => {
                    transaction.outputMap[senderWallet.publicKey] = 999999
                    expect(Transaction.validTransaction(transaction)).toBe(false)
                    expect(errorMock).toHaveBeenCalled()
                });
            });

            describe('and the transaction input signature is invalid', () => {
                it('should returns false and logs an error', () => {
                    transaction.input.signature = new Wallet().sign('data')
                    expect(Transaction.validTransaction(transaction)).toBe(false)
                    expect(errorMock).toHaveBeenCalled()
                });
            });
        });
    });
});