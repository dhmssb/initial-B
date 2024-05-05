const redis = require('redis')

const CHANNELS = {
    TEST: 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN',
    TRANSACTION: 'TRANSACTION'
};

class Pubsub {
    constructor({blockchain, transactionPool, wallet}) {
        this.blockchain = blockchain
        this.transactionPool = transactionPool
        this.wallet = wallet
        this.publisher = redis.createClient()
        this.subscriber = redis.createClient()

        this.publisher.on('error', (err) => {
            console.error('Publisher Error:', err)
        });

        this.subscriber.on('error', (err) => {
            console.error('Subscriber Error:', err)
        });

        this.subscribeToChannels()
        this.subscriber.on('message', (channel, message) => this.handleMessage(channel, message))
    }

    handleMessage(channel, message) {
        console.log(`Message received. Channel: ${channel}. Message: ${message}.`)
        const parsedMessage = JSON.parse(message)

        switch (channel) {
            case CHANNELS.BLOCKCHAIN:
                this.blockchain.replaceChain(parsedMessage)
                break;
            case CHANNELS.TRANSACTION:
                if (!this.transactionPool.existingTransaction({
                    inputAddress: this.wallet.publicKey
                })) {
                    this.transactionPool.setTransaction(parsedMessage)
                }
                break;
            default:
                return
        }

    }

    subscribeToChannels() {
        Object.values(CHANNELS).forEach(channel => {
            this.subscriber.subscribe(channel)
        })
    }

    publish({channel, message}) {
        this.subscriber.unsubscribe(channel, () => {
            this.publisher.publish(channel, message, () => {
                this.subscriber.subscribe(channel)
            })
        })

    }

    broadcastChain() {
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            message: JSON.stringify(this.blockchain.chain)
        })
    }

    broadcastTransaction(transaction) {
        this.publish({
            channel: CHANNELS.TRANSACTION,
            message: JSON.stringify(transaction)
        })
    }
}

module.exports = Pubsub

// const PubNub = require('pubnub')
//
// const credentials = {
//     publishKey: 'pub-c-b410f792-7bb0-4247-b5dc-ff05b8e5bd87',
//     subscribeKey: 'sub-c-68a88f03-5c14-40c5-910f-05a12ec4ebf0',
//     userId: 'sec-c-Mjk4ZGUyMGUtNjZkMS00MWVmLTkwNTMtY2Y3ZTM5NzMwOGFj'
// }
//
// const CHANNELS = {
//     TEST: 'TEST',
//     TESTTTWO: 'TESTTWO'
// }
//
// class Pubsub {
//     constructor() {
//         this.pubnub = new PubNub(credentials)
//
//         this.pubnub.subscribe({channels: [Object.values(CHANNELS)]})
//
//         this.pubnub.addListener(this.listener())
//     }
//
//     listener() {
//         return {
//             message: messageObject => {
//                 const {channel, message} = messageObject
//                 console.log(`Message received. Channel: ${channel}. Message: ${message}`)
//             }
//         }
//     }
//
//     publish({channel, message}) {
//         this.pubnub.publish({channel, message})
//     }
// }
//
//
// module.exports = Pubsub
