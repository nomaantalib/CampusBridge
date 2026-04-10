const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

class PaymentService {
    /**
     * Hold funds in escrow (Debit Requester)
     */
    async holdEscrow(requesterId, taskId, amount) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const requester = await User.findById(requesterId).session(session);
            
            if (requester.walletBalance < amount) {
                throw new Error('Insufficient wallet balance');
            }

            // Debit requester
            requester.walletBalance -= amount;
            await requester.save({ session });

            // Create pending transaction record
            await Transaction.create([{
                userId: requesterId,
                taskId,
                type: 'debit',
                amount,
                status: 'pending' // pending because it's in escrow
            }], { session });

            await session.commitTransaction();
            return true;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Release funds from escrow to Server (minus commission)
     */
    async releasePayment(requesterId, serverId, taskId, amount) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // Find the server
            const server = await User.findById(serverId).session(session);
            
            const commissionRate = parseFloat(process.env.PLATFORM_COMMISSION) || 0.1;
            const commission = amount * commissionRate;
            const finalAmount = amount - commission;

            // Credit server
            server.walletBalance += finalAmount;
            await server.save({ session });

            // Update requester's pending transaction to success
            await Transaction.findOneAndUpdate(
                { userId: requesterId, taskId, type: 'debit', status: 'pending' },
                { status: 'success' },
                { session }
            );

            // Create success transaction record for server
            await Transaction.create([{
                userId: serverId,
                taskId,
                type: 'credit',
                amount: finalAmount,
                status: 'success'
            }], { session });

            await session.commitTransaction();
            return true;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}

module.exports = new PaymentService();
