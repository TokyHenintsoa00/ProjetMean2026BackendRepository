const express = require('express');
const router = express.Router();
const userModel = require('../Models/UserModel')
const multer = require('multer');
const bcrypt = require('bcrypt');
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10Mo max par fichier
});

router.post('/register/user', upload.array('photo_voiture', 1), async(req, res) => {
    try {
        const date = new Date();
        
        const{nom_client,prenom_client,email,pwd,
                date_naissance,role,numero_telephone,avatar} = req.body;

          const hashedPassword = await bcrypt.hash(pwd, 10);

        
        const newUser = new userModel({
            nom_client,
            prenom_client,
            email,
            pwd:hashedPassword,
            date_naissance,
            role,
            numero_telephone,
            avatar,
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