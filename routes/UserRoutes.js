const express = require('express');
const router = express.Router();
const userModel = require('../Models/UserModel')
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10Mo max par fichier
});

router.post('/register/user', upload.array('photo_voiture', 1), async(req, res) => {
    try {
        const date = new Date();
        
        
        const newUser = new userModel({
            nom_client: req.body.nom_client,
            prenom_client: req.body.prenom_client,
            date_naissance: req.body.date_naissance,
            role: req.body.role,
            numero_telephone: req.body.numero_telephone,
            avatar: req.body.avatar,
            is_active: false,
            created_at: date,
            updated_at: null
        });
        
        // Maintenant save() fonctionnera
        await newUser.save();
        
        res.status(200).json({ message: "Utilisateur créé avec succès" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

module.exports = router;