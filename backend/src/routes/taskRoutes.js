const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All task routes are protected
router.use(protect);

router.get('/', (req, res) => {
    res.json({ success: true, message: 'Protected task list' });
});

router.post('/', authorize('Requester', 'Admin'), (req, res) => {
    res.json({ success: true, message: 'Task created' });
});

module.exports = router;
