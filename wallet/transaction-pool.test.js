const TransactionPool = require('./transaction-pool')
const Transaction = require('./transaction')
const Wallet = require('./index')
const Blockchain = require('../blockchain')

describe('TransactionPool', () => {
    let transactionPool, transaction, senderWallet

    beforeEach(() => {
        transactionPool = new TransactionPool()
        senderWallet = new Wallet()
        transaction = new Transaction({
            senderWallet,
            recipient: 'fake-recipient',
            amount: 50
        })
    })

    describe('setTransaction', () => {
        it('should adds transaction', () => {
            transactionPool.setTransaction(transaction)
            expect(transactionPool.transactionMap[transaction.id]).toBe(transaction)
        });
    });

    describe('existingTransaction()', () => {
        it('should return an existing transaction given an input adress', () => {
            transactionPool.setTransaction(transaction)
            expect(
                transactionPool.existingTransaction({inputAddress: senderWallet.publicKey})
            ).toBe(transaction)
        });
    });

    describe('validTransactions()', () => {
        let validTransactions, errorMock

        beforeEach(() => {
            validTransactions = []
            errorMock = jest.fn()

            global.console.error = errorMock

            for (let i = 0; i < 10; i++) {
                transaction = new Transaction({
                    senderWallet,
                    recipient: 'any-recipient',
                    amount: 30
                })


                if (i % 3 === 0) {
                    transaction.input.amount = 999999
                } else if (i % 3 === 1) {
                    transaction.input.signature = new Wallet().sign('foo')
                } else {
                    validTransactions.push(transaction)
                }
                transactionPool.setTransaction(transaction)
            }
        })

        it('should returns valid transaction', () => {
            expect(transactionPool.validTransactions()).toEqual(validTransactions)
        });

        it('should logs errors for the invalid transaction', () => {
            transactionPool.validTransactions()
            expect(errorMock).toHaveBeenCalled()
        });
    });

    describe('clear()', () => {
        it('should clear the transaction', () => {
            transactionPool.clear()

            expect(transactionPool.transactionMap).toEqual({})
        });
    });

    describe('clearBlockchainTransactions()', () => {
        it('should clear the pool of existing blockchain transaction', () => {
            const blockchain = new Blockchain()
            const expectedTransactionMap = {}

            for (let i = 1; i < 6; i++) {
                const transaction = new Wallet().createTransaction({
                    recipient: 'you', amount: 25
                })

                transactionPool.setTransaction(transaction)

                if (i % 2 === 0) {
                    blockchain.addBlock({data: [transaction]})
                } else {
                    expectedTransactionMap[transaction.id] = transaction
                }
            }

            transactionPool.clearBlockchainTransactions({chain: blockchain.chain})
            expect(transactionPool.transactionMap).toEqual(expectedTransactionMap)
        });
    });
});