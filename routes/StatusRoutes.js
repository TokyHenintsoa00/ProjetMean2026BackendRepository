const express = require('express');
const router = express.Router();
const StatusModel = require('../Models/StatusModel');
const authMiddleware = require('../Middleware/verifyToken');
const requireRole = require('../Middleware/requireRole');

// Admin seulement
router.post('/register', authMiddleware, requireRole('admin'), async(req,res)=>{
    try {

        const {nom_status,class_css} = req.body;
        const status = new StatusModel({nom_status,class_css});
        await status.save();
        res.status(200).json({message:"status cree"});
        
    } catch (error) {
        console.log(error);
    }
});

//get all status boutique
router.get('/getAll', async function (req, res) {
    try 
    {
        const status = await StatusModel.find({
            _id: { $in: ["6986f4cce38c7e27ea86c043", "6986f4f4e38c7e27ea86c045", "6986f513e38c7e27ea86c047"] } // Remplacez par les vrais _id
        });
        res.json(status);
    } catch (error) {
        console.log("l'erreur " + error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
})


module.exports = router;