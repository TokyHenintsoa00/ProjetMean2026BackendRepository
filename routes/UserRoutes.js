require('dotenv').config();
const express = require('express');
const router = express.Router();
const userModel = require('../Models/UserModel');
const boutiqueModel = require('../Models/BoutiqueModel');
const multer = require('multer');
const bcrypt = require('bcrypt');
const roleModel = require('../Models/RoleModel');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const { generateToken } = require('../utils/TokenConfig');
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10Mo max par fichier
});
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_EMAIL, // Votre email Brevo
        pass: process.env.BREVO_SMTP_KEY // Votre clé API Brevo
    }
});

// Vérifiez la configuration au démarrage
transporter.verify(function(error, success) {
    if (error) {
        console.log('Erreur configuration SMTP:', error);
    } else {
        console.log('Serveur SMTP prêt à envoyer des emails');
    }
});

router.post('/password/forgotPassword', [
    body('email')
        .notEmpty()
        .withMessage('L\'email est requis')
        .isEmail()
        .withMessage('L\'email n\'est pas valide')
        .normalizeEmail()
], async (req, res) => {
    try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    message: "Erreur de validation",
                    errors: errors.array()
                });
            }

            const { email } = req.body;

            console.log(email);
            

            // Vérifier si l'utilisateur existe
            const user = await userModel.findOne({ email });
            
        
            if (!user) {
                return res.status(200).json({
                    message: "Si cet email existe, un lien de réinitialisation a été envoyé"
                });
            }

            // Générer un token de réinitialisation sécurisé
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenHash = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');

            // Définir l'expiration du token (1 heure)
            const resetTokenExpiry = Date.now() + 3600000; // 1 heure

            // Sauvegarder le token hashé dans la base de données
            user.resetPasswordToken = resetTokenHash;
            user.resetPasswordExpiry = resetTokenExpiry;
            await user.save();

            // Créer le lien de réinitialisation
            const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;

        // Contenu de l'email
        const mailOptions = {
            from: `"${process.env.SENDER_NAME }" <${process.env.BREVO_SENDER_EMAIL}>`,
            to: email,
            subject: 'Réinitialisation de votre mot de passe',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background-color: #4CAF50;
                            color: white;
                            padding: 20px;
                            text-align: center;
                            border-radius: 5px 5px 0 0;
                        }
                        .content {
                            background-color: #f9f9f9;
                            padding: 30px;
                            border-radius: 0 0 5px 5px;
                        }
                        .button {
                            display: inline-block;
                            padding: 12px 30px;
                            background-color: #4CAF50;
                            color: white;
                            text-decoration: none;
                            border-radius: 5px;
                            margin: 20px 0;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 20px;
                            font-size: 12px;
                            color: #666;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Réinitialisation de mot de passe</h1>
                        </div>
                        <div class="content">
                            <p>Bonjour ${user.prenom_client || 'Utilisateur'},</p>
                            
                            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                            
                            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
                            
                            <div style="text-align: center;">
                                <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
                            </div>
                            
                            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
                            <p style="word-break: break-all; color: #4CAF50;">${resetUrl}</p>
                            
                            <p><strong>Ce lien est valide pendant 1 heure.</strong></p>
                            
                            <p>Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.</p>
                            
                            <p>Cordialement,<br>L'équipe ${process.env.APP_NAME || 'Votre Application'}</p>
                        </div>
                        <div class="footer">
                            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        // Envoyer l'email
        await transporter.sendMail(mailOptions);

        res.status(200).json({
            message: "Si cet email existe, un lien de réinitialisation a été envoyé"
        });

    } catch (error) {
        console.error('Erreur lors de la réinitialisation:', error);
        res.status(500).json({
            message: "Erreur serveur",
            error: error.message
        });
    }
});

//--------- Réinitialisation du mot de passe ------------------
router.post('/password/resetPassword', [
    body('token')
        .notEmpty()
        .withMessage('Le token est requis'),
    body('email')
        .notEmpty()
        .withMessage('L\'email est requis')
        .isEmail()
        .withMessage('L\'email n\'est pas valide')
        .normalizeEmail(),
    body('newPassword')
        .notEmpty()
        .withMessage('Le nouveau mot de passe est requis')
        .isLength({ min: 8 })
        .withMessage('Le mot de passe doit contenir au moins 8 caractères')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z/*@#!$%]{8,}$/)
        .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Erreur de validation",
                errors: errors.array()
            });
        }

        const { token, email, newPassword } = req.body;

        // Hasher le token reçu pour le comparer
        const resetTokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Trouver l'utilisateur avec le token valide
        const user = await userModel.findOne({
            email,
            resetPasswordToken: resetTokenHash,
            resetPasswordExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: "Token invalide ou expiré"
            });
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mettre à jour le mot de passe et supprimer le token
        user.pwd = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiry = undefined;
        user.updated_at = new Date();
        await user.save();

        // Email de confirmation
        const confirmationMailOptions = {
            from: `"${process.env.APP_NAME || 'Votre Application'}" <${process.env.BREVO_EMAIL}>`,
            to: email,
            subject: 'Mot de passe modifié avec succès',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background-color: #4CAF50;
                            color: white;
                            padding: 20px;
                            text-align: center;
                            border-radius: 5px 5px 0 0;
                        }
                        .content {
                            background-color: #f9f9f9;
                            padding: 30px;
                            border-radius: 0 0 5px 5px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>✓ Mot de passe modifié</h1>
                        </div>
                        <div class="content">
                            <p>Bonjour ${user.prenom_client || 'Utilisateur'},</p>
                            
                            <p>Votre mot de passe a été modifié avec succès.</p>
                            
                            <p>Si vous n'êtes pas à l'origine de cette modification, veuillez contacter immédiatement notre support.</p>
                            
                            <p>Cordialement,<br>L'équipe ${process.env.APP_NAME || 'Votre Application'}</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(confirmationMailOptions);

        res.status(200).json({
            message: "Mot de passe réinitialisé avec succès"
        });

    } catch (error) {
        console.error('Erreur lors de la réinitialisation:', error);
        res.status(500).json({
            message: "Erreur serveur",
            error: error.message
        });
    }
});


//-----function find one user---------------------------
router.post('/find/role/by/email',async(req,res)=>{
    try{
        const {email} = req.body;
        const findUserByemail = await userModel
                                .findOne({email})
                                .select('role')
        const role = findUserByemail.role.toString();
        const findRole = await roleModel.findById(role);
        res.json(findRole);
    } catch(err){
        console.log(err);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

router.post('/login/user',async(req,res)=>{
    try 
    {
        const{email,pwd,rememberMe} = req.body;
        //const pwd_bycript = pwd;
        const find_user = await userModel.findOne({email});  
        
        //find boutique user if exsiste
        const id_user = find_user._id;
        console.log("ID USER :"+id_user);
        

        //get id_boutique
        const boutique = await boutiqueModel.findOne({
            manager_id: id_user
        });

         const id_boutique  = boutique._id;

        //  console.log("id boutique:"+id_boutique);
        


        const compare_pwd = await bcrypt.compare(pwd,find_user.pwd);

        if (!find_user&&!compare_pwd) {
            alert("email ou pwd non reconnue")
            console.log("email ou non reconnue");
        }

        //generateToken dans utils/tokenConfig
         const tokenExpiration = rememberMe ? '30d' : '1d';
         const cookieMaxAge = rememberMe 
            ? 30 * 24 * 60 * 60 * 1000  // 30 jours
            : 24 * 60 * 60 * 1000;       // 1 jour
        const token = generateToken(find_user,tokenExpiration,id_boutique);
        
        //  STOCKER LE TOKEN 
        // DANS UN COOKIE HTTP ONLY 
        res.cookie("token_user", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // HTTPS en prod
            sameSite: "strict",
            maxAge: cookieMaxAge
        });


         res.status(200).json({
            message: "Connexion réussie",
            // token,
            // find_user: {
            //     id_user: find_user._id,
            //     email_user: find_user.email,
            //     role_user_id: find_user.role,

            // }
        }); 
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });   
    }
});

router.post('/register/user', upload.array('photo_user', 1),[
        // Validation du mot de passe
        //  body('nom_client')
        //     .notEmpty()
        //     .withMessage('Le nom est requis')
        //     .trim()
        //     .isLength({ min: 2 })
        //     .withMessage('Le nom doit contenir au moins 2 caractères'),
        
        // body('prenom_client')
        //     .notEmpty()
        //     .withMessage('Le prénom est requis')
        //     .trim()
        //     .isLength({ min: 2 })
        //     .withMessage('Le prénom doit contenir au moins 2 caractères'),
        
        // body('email')
        //     .notEmpty()
        //     .withMessage('L\'email est requis')
        //     .isEmail()
        //     .withMessage('L\'email n\'est pas valide')
        //     .normalizeEmail()
        //     .custom(async (value) => {
        //         const existingUser = await userModel.findOne({ email: value });
        //         if (existingUser) {
        //             throw new Error('Cet email est déjà utilisé');
        //         }
        //         return true;
        //     }),

        body('pwd')
            .notEmpty()
            .withMessage('Le mot de passe est requis')
            .isLength({ min: 8 })
            .withMessage('Le mot de passe doit contenir au moins 8 caractères')
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z/*@#!$%]{8,}$/)
            .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractere speciaux')
        
        // body('numero_telephone')
        // .notEmpty()
        // .withMessage('Le numéro de téléphone est requis')
        // .matches(/^[0-9]{10}$/)
        // .withMessage('Le numéro de téléphone doit contenir 10 chiffres'),
    
        // body('date_naissance')
        //     .notEmpty()
        //     .withMessage('La date de naissance est requise')
        //     .isISO8601()
        //     .withMessage('Format de date invalide')
        
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
                date_naissance,role,numero_telephone,avatar,rememberMe} = req.body;

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
         const tokenExpiration = rememberMe ? '30d' : '1d';
         const cookieMaxAge = rememberMe 
            ? 30 * 24 * 60 * 60 * 1000  // => 30 jours
            : 24 * 60 * 60 * 1000;       // => 1 jour
        const token = generateToken(newUser,tokenExpiration);
        
        res.cookie("token_user", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // HTTPS en prod
            sameSite: "strict",
            maxAge: cookieMaxAge
        });


        res.status(200).json({ 
            message: "Utilisateur créé avec succès",
            token
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

//-------------- non finie 
//--------- send email reset pwd------------------
router.get('/password/forgotPassword',async(req,res)=>{

    try 
    {
        const {email} = req.body;
        //send email to restore the pwd USER BREVO

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message:"error serveur",
            error:error.message
        });
        
    }
})


// router.post('/commande-produit', authMiddleware, async (req, res) => {
//     try {
//         const userId = req.user.id; // récupéré depuis le token
//         const { produits } = req.body; // tableau de produits avec quantité, etc.

//         const nouvelleCommande = new CommandeModel({
//             user: userId,
//             produits,
//             date_commande: new Date(),
//             statut: 'en attente'
//         });

//         await nouvelleCommande.save();

//         res.status(201).json({
//             message: "Commande passée avec succès",
//             commande: nouvelleCommande
//         });
//     } catch (error) {
//         res.status(500).json({ message: "Erreur serveur", error: error.message });
//     }
// });


module.exports = router;