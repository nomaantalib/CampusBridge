const Task = require('../models/Task');
const { createTaskSchema, placeBidSchema } = require('../utils/validation');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Requester)
exports.createTask = async (req, res, next) => {
    try {
        const { error } = createTaskSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        // Set default expiration to 2 hours if not provided
        const expiresAt = req.body.expiresAt || new Date(Date.now() + 2 * 60 * 60 * 1000);

        const task = await Task.create({
            ...req.body,
            expiresAt,
            requesterId: req.user.id,
            campusId: req.user.campusId,
            status: 'Open'
        });

        // Emit socket event to the campus room
        const io = req.app.get('io');
        io.to(req.user.campusId.toString()).emit('newTask', task);

        res.status(201).json({ success: true, data: task });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all tasks for the user's campus
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res, next) => {
    try {
        const tasks = await Task.find({ 
            campusId: req.user.campusId,
            status: 'Open' 
        }).sort('-createdAt');

        res.status(200).json({ success: true, count: tasks.length, data: tasks });
    } catch (err) {
        next(err);
    }
};

// @desc    Place a bid on a task
// @route   POST /api/tasks/bid
// @access  Private (Server)
exports.placeBid = async (req, res, next) => {
    try {
        const { error } = placeBidSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const { taskId, amount } = req.body;
        let task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        if (task.status !== 'Open' && task.status !== 'Negotiating') {
            return res.status(400).json({ success: false, message: 'Task is no longer accepting bids' });
        }

        // Only servers can bid (enforced by middleware, but good to check)
        if (req.user.role !== 'Server' && req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Only servers can place bids' });
        }

        const bid = {
            serverId: req.user.id,
            amount,
            timestamp: new Date()
        };

        task.bids.push(bid);
        task.status = 'Negotiating';
        await task.save();

        // Emit socket event for the specific task update
        const io = req.app.get('io');
        io.to(task.campusId.toString()).emit('newBid', { taskId: task._id, bid });

        res.status(200).json({ success: true, data: task });
    } catch (err) {
        next(err);
    }
};

// @desc    Accept a bid
// @route   POST /api/tasks/accept
// @access  Private (Requester)
exports.acceptBid = async (req, res, next) => {
    try {
        const { error } = acceptBidSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const { taskId, bidId } = req.body;
        let task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        if (task.requesterId.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(401).json({ success: false, message: 'Not authorized to accept bids for this task' });
        }

        if (task.serverId) {
            return res.status(400).json({ success: false, message: 'This task already has an assigned server' });
        }

        const bid = task.bids.id(bidId);
        if (!bid) {
            return res.status(404).json({ success: false, message: 'Bid not found' });
        }

        task.serverId = bid.serverId;
        task.finalFare = bid.amount;
        task.status = 'Accepted';
        
        // Generate simple 4-digit OTP
        task.otpCode = Math.floor(1000 + Math.random() * 9000).toString();
        
        await task.save();

        const io = req.app.get('io');
        io.to(task.campusId.toString()).emit('taskAccepted', { taskId: task._id, serverId: bid.serverId });

        res.status(200).json({ success: true, data: task });
    } catch (err) {
        next(err);
    }
};


// @desc    Update task status (e.g., to InTransit)
// @route   PATCH /api/tasks/:id/status
// @access  Private (Server)
exports.updateTaskStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const validStatuses = ['InTransit', 'Cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status update' });
        }

        let task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        if (task.serverId.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        task.status = status;
        await task.save();

        const io = req.app.get('io');
        io.to(task.campusId.toString()).emit('taskStatusUpdated', { taskId: task._id, status });

        res.status(200).json({ success: true, data: task });
    } catch (err) {
        next(err);
    }
};

// @desc    Complete task with OTP
// @route   POST /api/tasks/:id/complete
// @access  Private (Server)
exports.completeTask = async (req, res, next) => {
    try {
        const { otp } = req.body;
        let task = await Task.findById(req.params.id).select('+otpCode');

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        if (task.serverId.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        if (task.otpCode !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        task.status = 'Completed';
        await task.save();

        // TODO: Handle payment release logic here (Phase 4)

        const io = req.app.get('io');
        io.to(task.campusId.toString()).emit('taskCompleted', { taskId: task._id });

        res.status(200).json({ success: true, data: task });
    } catch (err) {
        next(err);
    }
};

