const Blockchain = require('./index')
const Block = require('./block')
const {cryptoHash} = require('../util')
const Wallet = require('../wallet')
const Transaction = require('../wallet/transaction')

describe('Blockchain', () => {
    let blockchain, newChain, originalChain, errorMock

    beforeEach(() => {
        blockchain = new Blockchain()
        newChain = new Blockchain()

        errorMock = jest.fn()
        originalChain = blockchain.chain
        global.console.error = errorMock
    })

    it('should contains a `chain` Array instance', () => {
        expect(blockchain.chain instanceof Array).toBe(true)
    });
    it('should starts with the genesis block', () => {
        expect(blockchain.chain[0]).toEqual(Block.genesis())
    });
    it('should add a new block to the chain', () => {
        const newData = 'foo bar'
        blockchain.addBlock({data: newData})

        expect(blockchain.chain[blockchain.chain.length - 1].data).toEqual(newData)
    });

    describe('isValidChain()', () => {
        describe('when the chain doesn start with the genesis block', () => {
            it('should return false', () => {
                blockchain.chain[0] = {data: 'fake - genesis'}
                expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
            });
        });

        describe('when the chain starts with the genesis block and has multiple blocks', () => {
            beforeEach(() => {
                blockchain.addBlock({data: 'Horse'})
                blockchain.addBlock({data: 'Horseas'})
                blockchain.addBlock({data: 'Hours'})
            })
            describe('and a lastHash reference has changed', () => {
                it('should return false', () => {

                    blockchain.chain[2].lastHash = 'broken-lasthash'
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
                });
            });

            describe('and the chain contains a block with an invalid field', () => {
                it('should return false', () => {

                    blockchain.chain[2].data = 'some-bad-data'
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
                });
            })

            describe('and the chain contains a block with a jumped difficulty', () => {
                it('should return false', () => {
                    const lastBlock = blockchain.chain[blockchain.chain.length - 1]
                    const lastHash = lastBlock.hash
                    const timestamp = Date.now()
                    const nonce = 0
                    const data = []
                    const difficulty = lastBlock.difficulty - 3

                    const hash = cryptoHash(timestamp, lastHash, difficulty, nonce, data)
                    const badBlock = new Block({
                        timestamp, lastHash, hash, nonce, difficulty, data
                    })

                    blockchain.chain.push(badBlock)

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
                });
            });

            describe('and the chain doesnt contain any invalid block', () => {
                it('should return true', () => {

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(true)

                });
            });
        });
    });

    describe('replaceChain()', () => {
        let logMock

        beforeEach(() => {
            logMock = jest.fn()

            global.console.log = logMock
        })

        describe('when the new chain is not longer', () => {
            beforeEach(() => {
                newChain.chain[0] = {new: 'chain'}
                blockchain.replaceChain(newChain.chain)
            })

            it('should doesnt replace the chain', () => {
                expect(blockchain.chain).toEqual(originalChain)
            });
            it('should logs an error', () => {
                expect(errorMock).toHaveBeenCalled()
            })
        });

        describe('when the chain is longer', () => {
            beforeEach(() => {
                newChain.addBlock({data: 'Horse'})
                newChain.addBlock({data: 'Horseas'})
                newChain.addBlock({data: 'Hours'})
            })

            describe('and the chain is invalid', () => {
                beforeEach(() => {
                    newChain.chain[2].hash = 'some-fake-hash'

                    blockchain.replaceChain(newChain.chain)
                })
                it('should doesnt replace the chain', () => {
                    expect(blockchain.chain).toEqual(originalChain)
                });
                it('should logs an error', () => {
                    expect(errorMock).toHaveBeenCalled()
                })
            });

            describe('and the chain is valid', () => {
                beforeEach(() => {
                    blockchain.replaceChain(newChain.chain)
                })

                it('should replaces the chain', () => {
                    expect(blockchain.chain).toEqual(newChain.chain)

                });
                it('should logs about the chain replacement', () => {
                    expect(logMock).toHaveBeenCalled()
                });
            });
        });

        describe('and the `validateTransaction` flag is true', () => {
            it('should call validTransactionData()', () => {
                const validTransactionDataMock = jest.fn()

                blockchain.validTransactionData = validTransactionDataMock
                newChain.addBlock({data: 'test'})
                blockchain.replaceChain(newChain.chain, true)

                expect(validTransactionDataMock).toHaveBeenCalled()
            });
        });
    });

    describe('validTransactionData()', () => {
        let transaction, rewardTransaction, wallet

        beforeEach(() => {
            wallet = new Wallet()
            transaction = wallet.createTransaction({recipient: 'iam-address', amount: 65})
            rewardTransaction = Transaction.rewardTransaction({minerWallet: wallet})
        })

        describe('and the transaction data is valid', () => {
            it('should return true', () => {
                newChain.addBlock({data: [transaction, rewardTransaction]})

                expect(blockchain.validTransactionData({chain: newChain.chain})).toBe(true)
                expect(errorMock).not.toHaveBeenCalled()

            });
        });

        describe('and the transaction data has multiple rewards', () => {
            it('should return false and logs an error', () => {
                newChain.addBlock({data: [transaction, rewardTransaction, rewardTransaction]})

                expect(blockchain.validTransactionData({chain: newChain.chain})).toBe(false)
                expect(errorMock).toHaveBeenCalled()
            });
        });

        describe('and the transaction data has at least one malformed outputMap', () => {
            describe('and teh transaction is not a reward transaction', () => {
                it('should return false and logs an error', () => {
                    transaction.outputMap[wallet.publicKey] = 999999
                    newChain.addBlock({data: [transaction, rewardTransaction]})

                    expect(blockchain.validTransactionData({chain: newChain.chain})).toBe(false)
                    expect(errorMock).toHaveBeenCalled()

                });
            });

            describe('and the transaction is a reward transaction', () => {
                it('should return false and logs an error', () => {
                    rewardTransaction.outputMap[wallet.publicKey] = 999999
                    newChain.addBlock({data: [transaction, rewardTransaction]})

                    expect(blockchain.validTransactionData({chain: newChain.chain})).toBe(false)
                    expect(errorMock).toHaveBeenCalled()

                });
            });
        });

        describe('and the transaction data has at least one malforemed input', () => {
            it('should return false and logs an error', () => {
                wallet.balance = 9000

                const badOutputMap = {
                    [wallet.publicKey]: 8900,
                    testRecipient: 100
                }

                const badTransaction = {
                    input: {
                        timestamp: Date.now(),
                        amount: wallet.balance,
                        address: wallet.publicKey,
                        signature: wallet.sign(badOutputMap)
                    },
                    outputMap: badOutputMap
                }

                newChain.addBlock({data: [badTransaction, rewardTransaction]})
                expect(blockchain.validTransactionData({chain: newChain.chain})).toBe(false)
                expect(errorMock).toHaveBeenCalled()
            });
        });

        describe('and a block contains multiple identical transaction', () => {
            it('should return false and logs an error', () => {
                newChain.addBlock({
                    data: [transaction, transaction, transaction, rewardTransaction]
                })

                expect(blockchain.validTransactionData({chain: newChain.chain})).toBe(false)
                expect(errorMock).toHaveBeenCalled()
            });
        });
    });
});