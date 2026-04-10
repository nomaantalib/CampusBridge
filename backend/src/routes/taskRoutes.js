const express = require('express');
const { 
    createTask, 
    getTasks, 
    placeBid, 
    acceptBid,
    updateTaskStatus,
    completeTask
} = require('../controllers/taskController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All task routes are protected
router.use(protect);

router.route('/')
    .get(getTasks)
    .post(authorize('Requester', 'Admin'), createTask);

router.post('/bid', authorize('Server', 'Admin'), placeBid);
router.post('/accept', authorize('Requester', 'Admin'), acceptBid);
router.patch('/:id/status', authorize('Server', 'Admin'), updateTaskStatus);
router.post('/:id/complete', authorize('Server', 'Admin'), completeTask);


module.exports = router;


