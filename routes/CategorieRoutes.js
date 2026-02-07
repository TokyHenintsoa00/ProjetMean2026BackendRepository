const express = require('express');
const router = express.Router();
const CategorieModel = require('../Models/CategorieModel');

router.post('/register/categorie',async(req,res)=>{
    try 
    {
        const {nom_categorie,commission} = req.body;
        const categorie = new CategorieModel( {
            nom_categorie,
            commission
        });

        await categorie.save();
        res.status(200).json({message:"Role cree"});
    } catch (error) {
        console.log(error);
    }
});


router.get('/getAll',async(req,res)=>{

    try
    {
        const categorie = await CategorieModel.find();
        res.json(categorie);
    } catch(error){
        console.log("l'erreur "+error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });

    }
})

module.exports = router;