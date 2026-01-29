const express = require('express');
const router = express.Router();
const boutiqueModel = require('../Models/BoutiqueModel');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10Mo max par fichier
});

router.post('/register/boutique',upload.array('photo_voiture', 10),async function(req,res){
    try 
    {
        // const newBoutique = new 
        
        
    } catch (error) {
        console.log("l'erreur "+error);
        
    }
})