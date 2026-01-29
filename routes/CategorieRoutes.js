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

module.exports = router;