const express = require('express');
const router = express.Router();
const boutiqueModel = require('../Models/BoutiqueModel');
const multer = require('multer');
const CategorieModel = require('../Models/CategorieModel');
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10Mo max par fichier
});

router.get('/getAll',async function(req,res){
    try {
        const boutique = await boutiqueModel.find();
        res.json(boutique);
    } catch (error) {
        console.log("l'erreur "+error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
})

router.post('/register/boutique',upload.array('photo_voiture', 10),async function(req,res){
    try 
    {
        //%comission en fonction du categorie de boutique
        //=>comission type categirue et insert dans new boutique
        const categorie = {id_categorie:req.body.id_categorie}
        const id_categorie = categorie.id_categorie;
        const find_comission = await CategorieModel.findById(id_categorie);
        const comission = find_comission.commission;
        //console.log(comisssion);
        
        const newBoutique = new boutiqueModel({
            nom_boutique:req.body.nom_boutique,
            manager_id : req.body.manager_id,
            description: req.body.description,
            logo: req.body.logo,
            photo_boutique:req.body.photo_boutique,
            id_categorie:req.body.id_categorie,
            location:req.body.location,
            commission:comission,
            status:req.body.status,
            rating:req.body.rating,
            loyer:req.body.loyer
        });

        await newBoutique.save();
        console.log("insertion boutique reussie");
        res.status(200).json({ message: "Utilisateur créé avec succès" });
    } catch (error) {
        console.log("l'erreur "+error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });

    }
})

module.exports = router;