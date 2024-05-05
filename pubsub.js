const redis = require('redis')

const CHANNELS = {
    TEST: 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN'
};

class Pubsub {
    constructor({blockchain}) {
        this.blockchain = blockchain
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

        if (channel === CHANNELS.BLOCKCHAIN) {
            this.blockchain.replaceChain(parsedMessage)
        }
    }

    subscribeToChannels() {
        Object.values(CHANNELS).forEach(channel => {
            this.subscriber.subscribe(channel)
        })
    }

    publish({channel, message}) {
        this.publisher.publish(channel, message)
    }

    broadcastChain() {
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            message: JSON.stringify(this.blockchain.chain)
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
