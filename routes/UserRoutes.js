const express = require('express');
const router = express.Router();
const userModel = require('../Models/UserModel')
const multer = require('multer');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10Mo max par fichier
});

router.post('/register/user', upload.array('photo_voiture', 1),[
        // Validation du mot de passe
        body('pwd')
            .notEmpty()
            .withMessage('Le mot de passe est requis')
            .isLength({ min: 8 })
            .withMessage('Le mot de passe doit contenir au moins 8 caractères')
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z/*@#!$%]{8,}$/)
            .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractere speciaux')
    ], async(req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Erreur de validation",
                errors: errors.array()
            });
        }

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
        await newUser.save();
        res.status(200).json({ message: "Utilisateur créé avec succès" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

module.exports = router;