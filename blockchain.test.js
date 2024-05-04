const Blockchain = require('./blockchain')
const Block = require('./block')
const cryptoHash = require('./crypto-hash')

describe('Blockchain', () => {
    let blockchain, newChain, originalChain

    beforeEach(() => {
        blockchain = new Blockchain()
        newChain = new Blockchain()
        originalChain = blockchain.chain
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
        let errorMock, logMock

        beforeEach(() => {
            errorMock = jest.fn()
            logMock = jest.fn()

            global.console.error = errorMock
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
    });
});