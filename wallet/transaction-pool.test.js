const TransactionPool = require('./transaction-pool')
const Transaction = require('./transaction')
const Wallet = require('./index')

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
        let validTransaction, errorMock

        beforeEach(() => {
            validTransaction = []
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
                    validTransaction.push(transaction)
                }
                transactionPool.setTransaction(transaction)
            }
        })

        it('should returns valid transaction', () => {
            expect(transactionPool.validTransaction()).toEqual(validTransaction)
        });

        it('should logs errors for the invalid transaction', () => {
            transactionPool.validTransaction()
            expect(errorMock).toHaveBeenCalled()
        });
    });
});