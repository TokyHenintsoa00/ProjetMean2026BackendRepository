require('dotenv').config();
const express = require('express');
const router = express.Router();
const userModel = require('../Models/UserModel');
const mongoose = require('mongoose');
const authMiddleware = require('../Middleware/verifyToken');
const requireRole = require('../Middleware/requireRole');

// Toutes les routes dashboard sont réservées à l'admin
router.use(authMiddleware, requireRole('admin'));

const TARGET_ROLES = [
    new mongoose.Types.ObjectId('697b0d19b784b5da2ab3ba22'),
    new mongoose.Types.ObjectId('697b0d46b784b5da2ab3ba24'),
];

/* ── Helper : construit le $match selon le roleId reçu en query ── */
function buildRoleMatch(roleId) {
    if (roleId) {
        // Un seul rôle ciblé
        return { role: new mongoose.Types.ObjectId(roleId) };
    }
    // Tous (Manager + Client)
    return { role: { $in: TARGET_ROLES } };
}

/* ── Total ── */
router.get('/sum/AllUser', async function(req, res) {
    try {
        const count = await userModel.countDocuments(buildRoleMatch(req.query.roleId));

        res.status(200).json({ success: true, total: count });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/* ── Par mois ── */
router.get('/sum/AllUser/byMonth', async function(req, res) {
    try {
        const result = await userModel.aggregate([
            { $match: buildRoleMatch(req.query.roleId) },
            {
                $group: {
                    _id  : { year: { $year: '$created_at' }, month: { $month: '$created_at' } },
                    total: { $sum: 1 },
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            {
                $project: {
                    _id  : 0,
                    year : '$_id.year',
                    month: '$_id.month',
                    total: 1,
                }
            },
        ]);

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/* ── Par année ── */
router.get('/sum/AllUser/byYear', async function(req, res) {
    try {
        const result = await userModel.aggregate([
            { $match: buildRoleMatch(req.query.roleId) },
            {
                $group: {
                    _id  : { year: { $year: '$created_at' } },
                    total: { $sum: 1 },
                }
            },
            { $sort: { '_id.year': 1 } },
            {
                $project: {
                    _id  : 0,
                    year : '$_id.year',
                    total: 1,
                }
            },
        ]);

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});





module.exports = router;