const express = require('express');
const router = express.Router();
// const authMiddleware = require('../Middleware/verifyToken');
const {authMiddleware,managerMiddleware, clientMiddleware} = require('../Middleware/verifyToken');

router.get('/verify', authMiddleware, (req, res) => {
    res.status(200).json({ valid: true, user: req.user });
});

router.get('/verify/client',clientMiddleware,(req, res) => {
    res.status(200).json({ valid: true, user: req.user });
});

router.get('/verify/manager',managerMiddleware,(req, res) => {
    res.status(200).json({ valid: true, user: req.user });
});



module.exports = router;