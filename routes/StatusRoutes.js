const express = require('express');
const router = express.Router();
const StatusModel = require('../Models/StatusModel');

router.post('/register',async(req,res)=>{
    try {

        const {nom_status,class_css} = req.body;
        const status = new StatusModel({nom_status,class_css});
        await status.save();
        res.status(200).json({message:"status cree"});
        
    } catch (error) {
        console.log(error);
    }
});

//get all status produit
// router.get('/getAll', async function (req, res) {
//     try 
//     {
//         const status = await StatusModel.find({
//             _id: { $in: [id1, id3, id9] } // Remplacez par les vrais _id
//         });
//         res.json(status);
//     } catch (error) {
//         console.log("l'erreur " + error);
//         res.status(500).json({ message: "Erreur serveur", error: error.message });
//     }
// })


module.exports = router;