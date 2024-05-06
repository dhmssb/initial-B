import React from "react";

const Transaction = ({transaction}) => {
    const {input, outputMap} = transaction
    const recipients = Object.keys(outputMap)

    return (
        <div className='Transaction'>
            <div>From: {`${input.address.substring(0, 20)}...`} | Balance : {input.amount}</div>
            {
                recipients.map(recipients => (
                    <div key={recipients}>
                        To: {`${recipients.substring(0, 20)}...`} | Sent: {outputMap[recipients]}
                    </div>
                ))
            }
        </div>
    )
}

export default Transaction