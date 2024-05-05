const Wallet = require('./index')
const Transaction = require('./transaction')
const {verifySignature} = require('../util')
const Blockcahin = require('../blockchain')
const {STARTING_BALANCE} = require("../config");


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

        describe('and the cahin is passed', () => {

            it('should call `Wallet.calculateBalance', () => {
                const calculateBalanceMock = jest.fn()

                const originalCalculateBalance = Wallet.calculateBalance

                Wallet.calculateBalance = calculateBalanceMock
                wallet.createTransaction({
                    recipient: 'iam',
                    amount: 10,
                    chain: new Blockcahin().chain
                })
                expect(calculateBalanceMock).toHaveBeenCalled()

                Wallet.calculateBalance = originalCalculateBalance
            });
        });
    });

    describe('calculateBalance()', () => {
        let blockchain

        beforeEach(() => {
            blockchain = new Blockcahin()
        })

        describe('and there are no outputs for the wallet', () => {
            it('should return the `STARTING_BALANCE`', () => {
                expect(
                    Wallet.calculateBalance({
                        chain: blockchain.chain,
                        address: wallet.publicKey
                    })
                ).toEqual(STARTING_BALANCE)
            });
        });

        describe('and there are outputd for the wallet', () => {
            let transactionOne, transactionTwo

            beforeEach(() => {
                transactionOne = new Wallet().createTransaction({
                    recipient: wallet.publicKey,
                    amount: 50
                })
                transactionTwo = new Wallet().createTransaction({
                    recipient: wallet.publicKey,
                    amount: 25
                })
                blockchain.addBlock({data: [transactionOne, transactionTwo]})
            })

            it('should add the sum of all outputs to the wallet balance', () => {
                expect(
                    Wallet.calculateBalance({
                        chain: blockchain.chain,
                        address: wallet.publicKey
                    })
                ).toEqual(STARTING_BALANCE + transactionOne.outputMap[wallet.publicKey] + transactionTwo.outputMap[wallet.publicKey])
            });

            describe('and the wallet has made a transaction', () => {
                let recentTransaction

                beforeEach(() => {
                    recentTransaction = wallet.createTransaction({
                        recipient: 'iam',
                        amount: 30
                    })

                    blockchain.addBlock({data: [recentTransaction]})
                })

                it('should return the output amount of the recent transaction', () => {
                    expect(
                        Wallet.calculateBalance({
                            chain: blockchain.chain,
                            address: wallet.publicKey
                        })
                    ).toEqual(recentTransaction.outputMap[wallet.publicKey])
                });

                describe('and there are outputs next to and after the recent transaction', () => {
                    let sameBlockTransaction, nextBlockTransaction

                    beforeEach(() => {
                        recentTransaction = wallet.createTransaction({
                            recipient: 'later-iam-adrress',
                            amount: 60
                        })

                        sameBlockTransaction = Transaction.rewardTransaction({minerWallet: wallet})

                        blockchain.addBlock({data: [recentTransaction, sameBlockTransaction]})

                        nextBlockTransaction = new Wallet().createTransaction({
                            recipient: wallet.publicKey, amount: 75
                        })
                        blockchain.addBlock({data: [nextBlockTransaction]})
                    })

                    it('should includes the output amounts in the returned balance', () => {
                        expect(
                            Wallet.calculateBalance({
                                chain: blockchain.chain,
                                address: wallet.publicKey
                            })
                        ).toEqual(
                            recentTransaction.outputMap[wallet.publicKey] +
                            sameBlockTransaction.outputMap[wallet.publicKey] +
                            nextBlockTransaction.outputMap[wallet.publicKey]
                        )
                    });
                });
            });
        });
    });
});