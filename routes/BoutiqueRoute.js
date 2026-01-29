const express = require('express');
const router = express.Router();
const boutiqueModel = require('../Models/BoutiqueModel');
const multer = require('multer');
const categorieModel = require('../Models/CategorieModel');
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10Mo max par fichier
});

router.post('/register/boutique',upload.array('photo_voiture', 10),async function(req,res){
    try 
    {
        //%comission en fonction du categorie de boutique
            //=>comission type categirue et insert dans new boutique
            const {id_categorie} = req.body.id_categorie
        const find_id_categorie = categorieModel.findById({id_categorie});
        const commission = find_id_categorie.comission;
        // // const newBoutique = new 
        // const newBoutique = new boutiqueModel({
        //     nom_boutique:req.body.nom_boutique,
        //     manager_id : req.body.manager_id,
        //     description: req.body.description,
        //     logo: req.body.logo,
        //     photo_boutique:req.body.photo_boutique,
        //     id_categorie:req.body.id_categorie,
        //     location:req.body.location,
        //     commission:req.body.commission,
        //     status:req.body.status,
        //     rating:req.body.rating,
        //     loyer:req.body.loyer
        // });
        
    } catch (error) {
        console.log("l'erreur "+error);
        
    }
})