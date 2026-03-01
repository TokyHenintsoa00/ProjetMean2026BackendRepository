const express = require('express');
const router = express.Router();
const RoleModel = require('../Models/RoleModel');
const authMiddleware = require('../Middleware/verifyToken');
const requireRole = require('../Middleware/requireRole');

// Admin seulement
router.post('/register/user', authMiddleware, requireRole('admin'), async(req,res) =>{
    try 
    {
        const {nom_role} = req.body;
        const userRole = new RoleModel({
            nom_role
        });
        await userRole.save();
        res.status(200).json({message:"Role cree"});    
    } catch (error) {
        console.log("erreur"+error);
        
    }
    
});

module.exports = router;