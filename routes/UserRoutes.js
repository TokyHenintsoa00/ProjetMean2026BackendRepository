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
const authMiddleware = require('../Middleware/verifyToken');
const requireRole = require('../Middleware/requireRole');
const UserModel = require('../Models/UserModel');
const storage = multer.memoryStorage();
const path = require('path');
const { log } = require('console');
const { uploadToCloud } = require('../utils/cloudinary');
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10Mo max par fichier
});
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 465,
    secure: true,
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
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Réinitialisation de mot de passe — ShopMall</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    body { margin: 0 !important; padding: 0 !important; background-color: #0f1419; }
    a { color: inherit; }
    @media only screen and (max-width: 600px) {
      .email-card { width: 100% !important; }
      .pad-main { padding: 28px 22px !important; }
      .pad-header { padding: 30px 22px 26px !important; }
      .pad-footer { padding: 16px 22px !important; }
      .title { font-size: 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0f1419;">

<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#0f1419;">
  <tr>
    <td align="center" style="padding:40px 16px;">

      <!-- Card -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" class="email-card"
        style="max-width:560px;width:100%;border-radius:20px;overflow:hidden;
               border:1px solid rgba(255,255,255,0.08);">

        <!-- HEADER -->
        <tr>
          <td class="pad-header" style="background-color:#1e2832;padding:40px 44px 36px;border-bottom:1px solid rgba(255,255,255,0.07);">

            <!-- Logo -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:10px;">
                  <svg viewBox="0 0 54 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="34" height="34" style="display:block;">
                    <path fill-rule="evenodd" clip-rule="evenodd"
                      d="M17.1637 19.2467C17.1566 19.4033 17.1529 19.561 17.1529 19.7194C17.1529 25.3503 21.7203 29.915 27.3546 29.915C32.9887 29.915 37.5561 25.3503 37.5561 19.7194C37.5561 19.5572 37.5524 19.3959 37.5449 19.2355C38.5617 19.0801 39.5759 18.9013 40.5867 18.6994L40.6926 18.6782C40.7191 19.0218 40.7326 19.369 40.7326 19.7194C40.7326 27.1036 34.743 33.0896 27.3546 33.0896C19.966 33.0896 13.9765 27.1036 13.9765 19.7194C13.9765 19.374 13.9896 19.0316 14.0154 18.6927L14.0486 18.6994C15.0837 18.9062 16.1223 19.0886 17.1637 19.2467ZM33.3284 11.4538C31.6493 10.2396 29.5855 9.52381 27.3546 9.52381C25.1195 9.52381 23.0524 10.2421 21.3717 11.4603C20.0078 11.3232 18.6475 11.1387 17.2933 10.907C19.7453 8.11308 23.3438 6.34921 27.3546 6.34921C31.36 6.34921 34.9543 8.10844 37.4061 10.896C36.0521 11.1292 34.692 11.3152 33.3284 11.4538ZM43.826 18.0518C43.881 18.6003 43.9091 19.1566 43.9091 19.7194C43.9091 28.8568 36.4973 36.2642 27.3546 36.2642C18.2117 36.2642 10.8 28.8568 10.8 19.7194C10.8 19.1615 10.8276 18.61 10.8816 18.0663L7.75383 17.4411C7.66775 18.1886 7.62354 18.9488 7.62354 19.7194C7.62354 30.6102 16.4574 39.4388 27.3546 39.4388C38.2517 39.4388 47.0855 30.6102 47.0855 19.7194C47.0855 18.9439 47.0407 18.1789 46.9536 17.4267L43.826 18.0518ZM44.2613 9.54743L40.9084 10.2176C37.9134 5.95821 32.9593 3.1746 27.3546 3.1746C21.7442 3.1746 16.7856 5.96385 13.7915 10.2305L10.4399 9.56057C13.892 3.83178 20.1756 0 27.3546 0C34.5281 0 40.8075 3.82591 44.2613 9.54743Z"
                      fill="white"/>
                  </svg>
                </td>
                <td valign="middle">
                  <span style="font-family:Georgia,'Times New Roman',serif;font-size:19px;font-weight:bold;color:#ffffff;letter-spacing:-0.5px;">ShopMall</span>
                </td>
              </tr>
            </table>

            <div style="height:22px;line-height:22px;">&nbsp;</div>

            <!-- Tag badge -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="background-color:#2a3642;border:1px solid rgba(255,255,255,0.12);
                           border-radius:30px;padding:5px 14px;">
                  <span style="font-family:Arial,sans-serif;font-size:10px;font-weight:bold;
                               color:rgba(255,255,255,0.6);letter-spacing:2px;text-transform:uppercase;">
                    SÉCURITÉ DU COMPTE
                  </span>
                </td>
              </tr>
            </table>

            <div style="height:14px;line-height:14px;">&nbsp;</div>

            <!-- Title -->
            <p class="title" style="margin:0;font-family:Georgia,'Times New Roman',serif;
               font-size:30px;font-weight:bold;color:#ffffff;line-height:1.2;letter-spacing:-0.5px;">
              Réinitialisation<br/>de votre mot de passe
            </p>

          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td class="pad-main" style="background-color:#f8fafc;padding:40px 44px;">

            <!-- Greeting -->
            <p style="margin:0 0 14px 0;font-family:Georgia,'Times New Roman',serif;
               font-size:18px;font-weight:bold;color:#1e2832;">
              Bonjour ${user.prenom_client || 'Utilisateur'},
            </p>

            <!-- Intro text -->
            <p style="margin:0 0 30px 0;font-family:Arial,Helvetica,sans-serif;
               font-size:14px;color:#64748b;line-height:1.75;">
              Vous avez demandé la réinitialisation de votre mot de passe pour votre compte
              <strong style="color:#1e2832;">ShopMall</strong>.
              Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
            </p>

            <!-- CTA Button (centered) -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td align="center" style="padding-bottom:28px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="background-color:#1e2832;border-radius:12px;">
                        <a href="${resetUrl}"
                          style="display:inline-block;padding:15px 38px;
                                 font-family:Arial,Helvetica,sans-serif;font-size:14px;
                                 font-weight:bold;color:#ffffff;text-decoration:none;
                                 letter-spacing:0.4px;border-radius:12px;">
                          Réinitialiser mon mot de passe &nbsp;&#8594;
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Expiry notice -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="background-color:#fffbeb;border:1px solid #fcd34d;
                           border-radius:10px;padding:12px 16px;margin-bottom:24px;">
                  <p style="margin:0;font-family:Arial,Helvetica,sans-serif;
                     font-size:13px;color:#92400e;font-weight:600;">
                    &#9719;&nbsp; Ce lien est valide pendant <strong>1 heure</strong> uniquement.
                  </p>
                </td>
              </tr>
            </table>

            <div style="height:24px;line-height:24px;">&nbsp;</div>

            <!-- Divider with text -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="border-top:1px solid #e2e8f0;" width="35%">&nbsp;</td>
                <td align="center" style="padding:0 10px;white-space:nowrap;" width="30%">
                  <span style="font-family:Arial,sans-serif;font-size:11px;color:#94a3b8;">ou copiez ce lien</span>
                </td>
                <td style="border-top:1px solid #e2e8f0;" width="35%">&nbsp;</td>
              </tr>
            </table>

            <div style="height:16px;line-height:16px;">&nbsp;</div>

            <!-- URL fallback box -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="background-color:#ffffff;border:1.5px solid #e2e8f0;
                           border-radius:12px;padding:14px 16px;">
                  <p style="margin:0 0 5px 0;font-family:Arial,sans-serif;font-size:10px;
                     font-weight:bold;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">
                    Lien de réinitialisation
                  </p>
                  <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:12px;
                     color:#1e2832;word-break:break-all;line-height:1.5;">
                    ${resetUrl}
                  </p>
                </td>
              </tr>
            </table>

            <div style="height:24px;line-height:24px;">&nbsp;</div>

            <!-- Security warning box -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="background-color:#f1f5f9;border:1.5px solid #e2e8f0;
                           border-radius:12px;padding:16px 18px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td width="40" valign="top">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td width="34" height="34"
                              style="background-color:#1e2832;border-radius:8px;
                                     text-align:center;vertical-align:middle;line-height:34px;">
                              <span style="font-size:16px;">&#128737;</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td style="padding-left:12px;" valign="top">
                        <p style="margin:0 0 4px 0;font-family:Arial,sans-serif;font-size:12px;
                           font-weight:bold;color:#1e2832;">
                          Vous n'avez pas fait cette demande ?
                        </p>
                        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;
                           color:#64748b;line-height:1.6;">
                          Ignorez simplement cet email. Votre mot de passe actuel reste inchangé et votre compte est en sécurité.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <div style="height:28px;line-height:28px;">&nbsp;</div>

            <!-- Sign-off -->
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;line-height:1.75;">
              Cordialement,<br/>
              <strong style="color:#1e2832;">L'équipe ${process.env.APP_NAME || 'ShopMall'}</strong>
            </p>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td class="pad-footer" style="background-color:#f1f5f9;border-top:1px solid #e2e8f0;padding:18px 44px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td>
                  <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#94a3b8;">
                    Cet email a été envoyé automatiquement, merci de ne pas y répondre.
                  </p>
                </td>
                <td align="right" style="white-space:nowrap;">
                  <span style="font-family:Georgia,'Times New Roman',serif;font-size:13px;
                         font-weight:bold;color:#1e2832;">ShopMall</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
      <!-- /Card -->

    </td>
  </tr>
</table>

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


//-----function find one user — auth requise---------------------------
router.post('/find/role/by/email', async(req,res)=>{
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



//route speclial admin
router.post('/administrator/login/user', async function (req,res) {
    try {
        const {email,pwd,rememberMe} = req.body;

        const find_user = await userModel.findOne({email});
        if (!find_user) return res.status(401).json({ message: "Email ou mot de passe incorrect" });

        const compare_pwd = await bcrypt.compare(pwd,find_user.pwd);
        if (!compare_pwd) return res.status(401).json({ message: "Email ou mot de passe incorrect" });

        // Récupérer le nom du rôle pour l'inclure dans le token
        const roleDoc = await roleModel.findById(find_user.role);
        const role_name = roleDoc?.nom_role || null;

        const tokenExpiration = rememberMe ? '30d' : '1d';
        const cookieMaxAge = rememberMe
            ? 30 * 24 * 60 * 60 * 1000  // 30 jours
            : 24 * 60 * 60 * 1000;       // 1 jour
        const token = generateToken(find_user, tokenExpiration, null, role_name);

        res.cookie("token_user", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: cookieMaxAge
        });

        res.status(200).json({ message: "Connexion réussie", token });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
})

//route pour client
router.post('/login/user', async(req,res)=>{
    try {
        const { email, pwd, rememberMe } = req.body;

        const find_user = await userModel.findOne({email});
        if (!find_user) return res.status(401).json({ message: "Email ou mot de passe incorrect" });

        const compare_pwd = await bcrypt.compare(pwd, find_user.pwd);
        if (!compare_pwd) return res.status(401).json({ message: "Email ou mot de passe incorrect" });

        // Récupérer le nom du rôle pour l'inclure dans le token
        const roleDoc = await roleModel.findById(find_user.role);
        const role_name = roleDoc?.nom_role || null;

        const tokenExpiration = rememberMe ? '30d' : '1d';
        const cookieMaxAge = rememberMe
            ? 30 * 24 * 60 * 60 * 1000  // 30 jours
            : 24 * 60 * 60 * 1000;       // 1 jour

        // Vérifier si l'utilisateur est manager d'une boutique
        const boutique = await boutiqueModel.findOne({ manager_id: find_user._id });
        const id_boutique = boutique ? boutique._id : null;

        const token = generateToken(find_user, tokenExpiration, id_boutique, role_name);

        res.cookie("token_user", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: cookieMaxAge
        });

        res.status(200).json({ message: "Connexion réussie", token });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

//router pour demande de boutique en manager
router.post('/register/permission/manager/boutique/byClient',upload.array('avatar', 1),[
   
],async(req,res)=>{
    try {
        console.log('📥 Requête reçue');
        console.log('Body:', req.body);
        console.log('Files:', req.files);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Erreur de validation",
                errors: errors.array()
            });
        }

        // Sauvegarder les fichiers avatar (Cloudinary)
        let avatarData = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await uploadToCloud(file.buffer, 'mall/avataruser');
                const avatarObject = {
                    filename: result.public_id,
                    url: result.secure_url,
                    size: file.size,
                    mimetype: file.mimetype
                };
                avatarData.push(avatarObject);
                console.log('✅ Avatar uploadé sur Cloudinary:', avatarObject);
            }
        }

        console.log('📊 avatarData final:', avatarData);
        console.log('📊 Longueur avatarData:', avatarData.length);

        const { nom_client, prenom_client, email, pwd,
                date_naissance, role, numero_telephone, rememberMe } = req.body;
        
        const hashedPassword = await bcrypt.hash(pwd, 10);
        const date = new Date();
        
        // ✅ Objet utilisateur à créer
        const userData = {
            nom_client,
            prenom_client,
            email,
            pwd: hashedPassword,
            date_naissance,
            role,
            numero_telephone,
            avatar: avatarData, // ✅ Assignation explicite
            is_active: false,
            created_at: date,
            updated_at: null
        };

        console.log('📝 Données utilisateur avant création:', JSON.stringify(userData, null, 2));
        
        const newUser = new userModel(userData);
        
        console.log('🔍 newUser.avatar AVANT save:', newUser.avatar);
        
        await newUser.save();
        
        // console.log('✅ Utilisateur sauvegardé dans MongoDB');
        // console.log('🔍 newUser.avatar APRÈS save:', newUser.avatar);
        
        // // Vérifier en base
        // const verifyUser = await userModel.findById(newUser._id);
        // console.log('🔍 Avatar vérifié en BDD:', verifyUser.avatar);
        
        // const tokenExpiration = rememberMe === 'true' ? '30d' : '1d';
        // const cookieMaxAge = rememberMe === 'true'
        //     ? 30 * 24 * 60 * 60 * 1000
        //     : 24 * 60 * 60 * 1000;
        
        // const token = generateToken(newUser, tokenExpiration);
        
        // res.cookie("token_user", token, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === "production",
        //     sameSite: "strict",
        //     maxAge: cookieMaxAge
        // });

        res.status(201).json({
            message: "Utilisateur créé avec succès",
            token,
            user: {
                id: newUser._id,
                nom_client: newUser.nom_client,
                prenom_client: newUser.prenom_client,
                email: newUser.email,
                avatar: newUser.avatar
            }
        });
    } catch (error) {
        console.error('❌ Erreur complète:', error);
        console.error('❌ Stack:', error.stack);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

//router pour add manager boutique — admin seulement
router.post('/register/managerBoutique/byAdmin', authMiddleware, requireRole('admin'), upload.array('avatar', 1), [
    // ... validations mdp etc
       body('pwd')
            .notEmpty()
            .withMessage('Le mot de passe est requis')
            .isLength({ min: 8 })
            .withMessage('Le mot de passe doit contenir au moins 8 caractères')
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z/*@#!$%]{8,}$/)
            .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractere speciaux')

], async (req, res) => {
    try {
        console.log('📥 Requête reçue');
        console.log('Body:', req.body);
        console.log('Files:', req.files);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Erreur de validation",
                errors: errors.array()
            });
        }

        // Sauvegarder les fichiers avatar (Cloudinary)
        let avatarData = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await uploadToCloud(file.buffer, 'mall/avataruser');
                const avatarObject = {
                    filename: result.public_id,
                    url: result.secure_url,
                    size: file.size,
                    mimetype: file.mimetype
                };
                avatarData.push(avatarObject);
                console.log('✅ Avatar uploadé sur Cloudinary:', avatarObject);
            }
        }

        console.log('📊 avatarData final:', avatarData);
        console.log('📊 Longueur avatarData:', avatarData.length);

        const { nom_client, prenom_client, email, pwd,
                date_naissance, role, numero_telephone, rememberMe } = req.body;
        
        const hashedPassword = await bcrypt.hash(pwd, 10);
        const date = new Date();
        
        // ✅ Objet utilisateur à créer
        const userData = {
            nom_client,
            prenom_client,
            email,
            pwd: hashedPassword,
            date_naissance,
            role,
            numero_telephone,
            avatar: avatarData, // ✅ Assignation explicite
            is_active: true,
            created_at: date,
            updated_at: null
        };

        console.log('📝 Données utilisateur avant création:', JSON.stringify(userData, null, 2));
        
        const newUser = new userModel(userData);
        
        console.log('🔍 newUser.avatar AVANT save:', newUser.avatar);
        
        await newUser.save();
        
        // console.log('✅ Utilisateur sauvegardé dans MongoDB');
        // console.log('🔍 newUser.avatar APRÈS save:', newUser.avatar);
        
        // // Vérifier en base
        // const verifyUser = await userModel.findById(newUser._id);
        // console.log('🔍 Avatar vérifié en BDD:', verifyUser.avatar);
        
        // const tokenExpiration = rememberMe === 'true' ? '30d' : '1d';
        // const cookieMaxAge = rememberMe === 'true'
        //     ? 30 * 24 * 60 * 60 * 1000
        //     : 24 * 60 * 60 * 1000;
        
        // const token = generateToken(newUser, tokenExpiration);
        
        // res.cookie("token_user", token, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === "production",
        //     sameSite: "strict",
        //     maxAge: cookieMaxAge
        // });

        res.status(201).json({
            message: "Utilisateur créé avec succès",
            token,
            user: {
                id: newUser._id,
                nom_client: newUser.nom_client,
                prenom_client: newUser.prenom_client,
                email: newUser.email,
                avatar: newUser.avatar
            }
        });
    } catch (error) {
        console.error('❌ Erreur complète:', error);
        console.error('❌ Stack:', error.stack);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});
// router.post('/register/managerBoutique/byAdmin',upload.array('avatar', 1),[
//     body('pwd')
//             .notEmpty()
//             .withMessage('Le mot de passe est requis')
//             .isLength({ min: 8 })
//             .withMessage('Le mot de passe doit contenir au moins 8 caractères')
//             .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z/*@#!$%]{8,}$/)
//             .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractere speciaux')

// ], async (req,res) =>{
    
//     try {
//           const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({
//                 message: "Erreur de validation",
//                 errors: errors.array()
//             });
//         }

//         const photo = req.files.map(file => ({
//            filename: file.filename, // ← Utilisez filename au lieu de originalname
//                 url: `/uploads/${file.filename}`, // ← Ajoutez le chemin complet
//                 size: file.size,
//                 mimetype: file.mimetype
//         }));


//          const{nom_client,prenom_client,email,pwd,
//                 date_naissance,role,numero_telephone,rememberMe} = req.body;

//         const hashedPassword = await bcrypt.hash(pwd, 10);
//         const date = new Date();
//         const newUser = new userModel({
//             nom_client,
//             prenom_client,
//             email,
//             pwd:hashedPassword,
//             date_naissance,
//             role,
//             numero_telephone,
//             avatar:photo,
//             is_active: false,
//             created_at: date,
//             updated_at: null
//         });
//         await newUser.save();
//          const tokenExpiration = rememberMe ? '30d' : '1d';
//          const cookieMaxAge = rememberMe 
//             ? 30 * 24 * 60 * 60 * 1000  // => 30 jours
//             : 24 * 60 * 60 * 1000;       // => 1 jour
//         const token = generateToken(newUser,tokenExpiration);
        
//         res.cookie("token_user", token, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === "production", // HTTPS en prod
//             sameSite: "strict",
//             maxAge: cookieMaxAge
//         });
//     } catch (error) {
//            console.log(error);
//         res.status(500).json({ message: "Erreur serveur", error: error.message });

//     }

// })

//router formulaire login register 
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
            is_active: true,
            created_at: date,
            updated_at: null
        });
        await newUser.save();
        const tokenExpiration = rememberMe ? '30d' : '1d';
        const cookieMaxAge = rememberMe
            ? 30 * 24 * 60 * 60 * 1000  // => 30 jours
            : 24 * 60 * 60 * 1000;       // => 1 jour

        const roleDocReg = await roleModel.findById(newUser.role);
        const role_nameReg = roleDocReg?.nom_role || null;

        const token = generateToken(newUser, tokenExpiration, null, role_nameReg);

        res.cookie("token_user", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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

//find user manager by email — admin seulement
router.get('/findBy/email', authMiddleware, requireRole('admin'), async function (req,res) {
    try 
    {
        const {email} = req.body;
        const getUserByemail = await UserModel.find({email:email,role:"697b0d19b784b5da2ab3ba22"});

        res.json(getUserByemail);

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message:"error serveur",
            error:error.message
        });
    }

})
//active account — admin seulement
router.put('/account/active', authMiddleware, requireRole('admin'), async function (req,res) {
    try 
    {
         const {_id} = req.body;
        const update_is_active = await UserModel.findByIdAndUpdate(
            _id,
            { 
                is_active: true,
                updated_at: new Date()
            },
            { new: true } // retourne la nouvelle version
        );

        if (!update_is_active) {
            return res.status(404).json({
                message: "Utilisateur non trouvé"
            });
        }

        res.status(200).json({
            message: "Compte active avec succès",
            user: update_is_active
        });    
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message:"error serveur",
            error:error.message
        });
    }
})



// desactive account — admin seulement
router.put('/account/desactive', authMiddleware, requireRole('admin'), async function(req,res){
    try 
    {
        const {_id} = req.body;
        const update_is_active = await UserModel.findByIdAndUpdate(
            _id,
            { 
                is_active: false,
                updated_at: new Date()
            },
            { new: true } // retourne la nouvelle version
        );

        if (!update_is_active) {
            return res.status(404).json({
                message: "Utilisateur non trouvé"
            });
        }

        res.status(200).json({
            message: "Compte désactivé avec succès",
            user: update_is_active
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message:"error serveur",
            error:error.message
        });
    }
});



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


// GET utilisateur connecte (pour les guards frontend)
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select('-pwd');
        if (!user) return res.status(404).json({ message: "Utilisateur non trouve" });
        const role = await roleModel.findById(user.role);
        res.json({
            user,
            roleName: role ? role.nom_role : null,
            id_boutique: req.user.id_boutique_user || null
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// POST deconnexion (clear cookie)
router.post('/logout', (req, res) => {
    res.clearCookie('token_user', {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    });
    res.json({ message: "Deconnexion reussie" });
});


// get all user (tous les client et manager)

router.get('/getAll/client/manager', async function(req, res) {
    try {
        const users = await userModel.find({
            role: { $in: ['697b0d19b784b5da2ab3ba22', '697b0d46b784b5da2ab3ba24'] }
        })
            .populate({ path: 'role', model: roleModel });
        
        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


router.put('/update/avatar/user', authMiddleware,upload.array('photo_user', 1), async function(req, res) {
    try {
         const id = req.user.id || req.user._id;

        

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Aucun fichier envoyé' 
            });
        }

        // Sauvegarder les fichiers avatar
        let avatarData = [];
        const uploadDir = path.join(__dirname, '../uploads/avataruser');
        await fs.mkdir(uploadDir, { recursive: true });

        for (const file of req.files) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            const filename = `avatar-${uniqueSuffix}${ext}`;
            const filepath = path.join(uploadDir, filename);

            await fs.writeFile(filepath, file.buffer);

            const avatarObject = {
                filename: filename,
                url: `/uploads/avataruser/${filename}`,
                size: file.size,
                mimetype: file.mimetype
            };

            avatarData.push(avatarObject);
            console.log('✅ Avatar préparé pour BDD:', avatarObject);
        }

        const avatar = avatarData[0];

        // 🔍 Récupérer l'ancien avatar pour suppression
        const existingUser = await userModel.findById(id);
        console.log("USERRRRRRRRRR"+existingUser);
        
        if (!existingUser) {
            return res.status(404).json({ 
                success: false, 
                message: 'Utilisateur non trouvé' 
            });
        }

       // 🗑️ Supprimer l'ancien avatar si existant
        if (existingUser.avatar && existingUser.avatar.filename) {
            const oldFilePath = path.join(__dirname, '../uploads/avataruser', existingUser.avatar.filename);
            try {
                await fs.unlink(oldFilePath);
                console.log('🗑️ Ancien avatar supprimé:', oldFilePath);
            } catch (err) {
                console.warn('⚠️ Impossible de supprimer l ancien avatar:', err.message);
            }
        }

        // 💾 Mise à jour en BDD
        existingUser.avatar = avatar;
        await existingUser.save();

        //console.log('Avatar mis à jour pour user:', user_id);

        return res.status(200).json({
            success: true,
            message: 'Avatar mis à jour avec succès',
            avatar: avatar
        });

    } catch (error) {
        console.error('Erreur update avatar:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur', 
            error: error.message 
        });
    }
});


router.delete('/delete/:user_id', async function(req, res) {
    try {
        const { user_id } = req.params;

        if (!user_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'user_id est requis' 
            });
        }

        // 🔍 Récupérer l'user
        const existingUser = await userModel.findById(user_id);

        if (!existingUser) {
            return res.status(404).json({ 
                success: false, 
                message: 'Utilisateur non trouvé' 
            });
        }

        // 🗑️ Supprimer l'avatar si existant
        if (existingUser.avatar && existingUser.avatar.filename) {
            const oldFilePath = path.join(__dirname, '../uploads/avataruser', existingUser.avatar.filename);
            try {
                await fs.unlink(oldFilePath);
                console.log('🗑️ Avatar supprimé:', oldFilePath);
            } catch (err) {
                console.warn('⚠️ Impossible de supprimer l avatar:', err.message);
            }
        }

        // 💾 Suppression en BDD
        await userModel.findByIdAndDelete(user_id);

        console.log('✅ User supprimé:', user_id);

        return res.status(200).json({
            success: true,
            message: 'Utilisateur supprimé avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur suppression user:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur', 
            error: error.message 
        });
    }
});


router.get('/getUser/byId', authMiddleware, async function(req, res) {
    try {
        const id = req.user.id || req.user._id; // extrait du token décodé

        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;