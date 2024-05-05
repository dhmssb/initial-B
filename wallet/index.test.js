const Wallet = require('./index')
const Transaction = require('./transaction')
const {verifySignature} = require('../util')


describe('wallet', () => {
    let wallet

    beforeEach(() => {
        wallet = new Wallet
    })

    it('should has a `balance`', () => {
        expect(wallet).toHaveProperty('balance')
    });

    it('should has a `publicKey', () => {
        expect(wallet).toHaveProperty('publicKey')
    });

    describe('signing data', () => {
        const data = 'this-data'

        it('should verifies a signature', () => {
            expect(
                verifySignature({
                    publicKey: wallet.publicKey,
                    data,
                    signature: wallet.sign(data)
                })
            ).toBe(true)

        });

        it('should doesnt verify an invalid signature', () => {
            expect(
                verifySignature({
                    publicKey: wallet.publicKey,
                    data,
                    signature: new Wallet().sign(data)
                })
            ).toBe(false)
        });
    });

    describe('createTransaction(', () => {
        describe('and the amount exceeds the balance', () => {
            it('should throws an error', () => {
                expect(() => wallet.createTransaction({
                    amount: 999999,
                    recipients: 'this-recipient'
                })).toThrow('Amount exceeds balance')
            });
        });

        describe('and the amount is valid', () => {
            let transaction, amount, recipient

            beforeEach(() => {
                amount = 50
                recipient = 'this-recipient'
                transaction = wallet.createTransaction({amount, recipient})
            })

            it('should creates an instance of `Transaction`', () => {
                expect(transaction instanceof Transaction).toBe(true)
            });

            it('should matches the transaction input with wallet', () => {
                expect(transaction.input.address).toEqual(wallet.publicKey)
            });

            it('should outputs the amount the recipient', () => {
                expect(transaction.outputMap[recipient]).toEqual(amount)
            });
        });
    });
});