const Transaction = require('./transaction')
const Wallet = require('./index')
const {verifySignature} = require("../util");
const {REWARD_INPUT, MINING_REWARD} = require("../config");

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

    describe('update()', () => {
        let originalSignature, originalSenderOutput, nextRecipient, nextAmount

        describe('and the amount is invalid', () => {
            it('should throws an error', () => {
                expect(() => {
                    transaction.update({
                        senderWallet, recipient: 'this-recipient-', amount: 999999
                    })
                }).toThrow('Amount exceeds balance')
            });
        });

        describe('and the amount is valid', () => {
            beforeEach(() => {
                originalSignature = transaction.input.signature
                originalSenderOutput = transaction.outputMap[senderWallet.publicKey]
                nextRecipient = 'next-recipient'
                nextAmount = 50

                transaction.update({senderWallet, recipient: nextRecipient, amount: nextAmount})
            })

            it('should outputs the amount to the next recipient', () => {
                expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount)
            });

            it('should substracts the amount from the original sender output amount', () => {
                expect(transaction.outputMap[senderWallet.publicKey]).toEqual(originalSenderOutput - nextAmount)
            });

            it('should maintains a total output that matches the input amount', () => {
                expect(Object.values(transaction.outputMap).reduce((total, outputAmount) => total + outputAmount)
                ).toEqual(transaction.input.amount)
            });

            it('should re-sign the transaction', () => {
                expect(transaction.input.signature).not.toEqual(originalSignature)
            });

            describe('and another update for the same recipient', () => {
                let addedAmount

                beforeEach(() => {
                    addedAmount = 100
                    transaction.update({
                        senderWallet, recipient: nextRecipient, amount: addedAmount
                    })
                })

                it('should adds to the recipient amount', () => {
                    expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount + addedAmount)
                });

                it('should substract the amount from the original sender output amount', () => {
                    expect(transaction.outputMap[senderWallet.publicKey]).toEqual(originalSenderOutput - nextAmount - addedAmount)
                });
            });
        });
    });

    describe('rewardTransaction()', () => {
        let rewardTransaction, minerWallet

        beforeEach(() => {
            minerWallet = new Wallet()
            rewardTransaction = Transaction.rewardTransaction({minerWallet})
        })

        it('should create a transaction with reward input', () => {
            expect(rewardTransaction.input).toEqual(REWARD_INPUT)
        });

        it('should create one transaction for the miner with the `MINING_REWARD`', () => {
            expect(rewardTransaction.outputMap[minerWallet.publicKey]).toEqual(MINING_REWARD)
        });
    });
});