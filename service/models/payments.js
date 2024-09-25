const { db } = require('./mongo/mongoClient');

const paymentsCollection = db.collection('payments');

async function setCheckoutSession(username, sessionId) {
    try {
        const filter = { username: username };
        const options = { upsert: true };
        const updateDoc = {
            $set: {
                checkoutSession: sessionId 
            }
        }
    
        const result = await paymentsCollection.updateOne(filter, updateDoc, options);
    
        return ( result.modifiedCount !== 0 || result.upsertedCount !== 0 );
    } catch (error) {
        console.error("Error updating the payment session for user:", error);
        throw error;
    }
}

async function getCheckoutSession(username) {
    try {
        const filter = { username: username };
        const result = await paymentsCollection.findOne(filter, { projection: { checkoutSession: 1, _id: 0 } });
    
        if (result && result.checkoutSession) {
            return result.checkoutSession;
        } else {
            throw new Error(`Checkout session not found for user: ${username}`);
        }
    } catch (error) {
        console.error("Error retrieving the payment session for user:", error);
        throw error;
    }
}

async function setPaymentStatus(username, paymentStatus) {
    try {
        const filter = { username: username };
        const options = { upsert: true };
    
        const oldStatus = await paymentsCollection.findOne(filter, { projection: { paymentStatus: 1, _id: 0 } });
    
        if (oldStatus && oldStatus.paymentStatus === 'paid') {
            return;
        }
    
        if (oldStatus && oldStatus.paymentStatus === paymentStatus) {
            return;
        }
    
        const updateDoc = {
            $set: { paymentStatus: paymentStatus }
        };
    
        await paymentsCollection.updateOne(filter, updateDoc, options);
    } catch (error) {
        console.error("Error updating the payment status for user:", error);
        throw error;
    }
}

async function getPaymentStatus(username) {
    try {
        const filter = { username: username };
    
        const userPayment = await paymentsCollection.findOne(filter, { projection: { paymentStatus: 1, _id: 0 } });
    
        return userPayment ? userPayment.paymentStatus : null;
    } catch (error) {
        console.error("Error retrieving payment status for user:", error);
        throw error;
    }
}

module.exports = {
    setCheckoutSession,
    getCheckoutSession,
    setPaymentStatus,
    getPaymentStatus
};
