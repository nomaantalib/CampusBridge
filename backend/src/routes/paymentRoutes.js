const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All payment routes are protected
router.use(protect);

router.get('/balance', (req, res) => {
    res.json({ success: true, balance: req.user.walletBalance });
});

router.post('/withdraw', authorize('Server', 'Admin'), (req, res) => {
    res.json({ success: true, message: 'Withdrawal initiated' });
});

module.exports = router;
