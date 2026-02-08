const express = require('express');
const router = express.Router();
const CategorieModel = require('../Models/CategorieModel');

router.post('/register/categorie',async(req,res)=>{
    try 
    {
        const {nom,parent} = req.body;
        const categorie = new CategorieModel( {
            nom,
            parent
        });

        await categorie.save();
        res.status(200).json({message:"Role cree"});
    } catch (error) {
        console.log(error);
    }
});


router.get('/getAll/boutique',async(req,res)=>{

    try
    {
        const categorie = await CategorieModel.find({parent:null});
        res.json(categorie);
    } catch(error){
        console.log("l'erreur "+error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });

    }
})

module.exports = router;