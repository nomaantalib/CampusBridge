const express = require('express');
const { getTransactions, addFunds } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All payment routes are protected
router.use(protect);

router.get('/transactions', getTransactions);
router.post('/add-funds', addFunds);

router.get('/balance', (req, res) => {
    res.json({ success: true, balance: req.user.walletBalance });
});


module.exports = router;
