class TransactionMiner {
    constructor({blockchain, transactionPool, wallet, pubsub}) {
        this.blockchain = blockchain
        this.transactionPool = transactionPool
        this.wallet = wallet
        this.pubsub = pubsub
    }
    
    mineTransactions() {
        //get the tx pool valid tx

        //generate miner reward

        //add a block consisting of tx to the blockchain

        //broadcast updated blockchain

        //clear the pool
    }
}

module.exports = TransactionMiner