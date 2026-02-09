const express = require('express');
const router = express.Router();
const boutiqueModel = require('../Models/BoutiqueModel');
const multer = require('multer');
const CategorieModel = require('../Models/CategorieModel');
const storage = multer.memoryStorage();
const path = require('path');
const UserModel = require('../Models/UserModel');
const fs = require('fs').promises;
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
});

//router register boutique by admin

router.post('/register/boutique/byAdmin',upload.array('photo_voiture', 10),async function(req,res){
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
            status:null,
            rating:null,
            loyer:req.body.loyer
        });

        await newBoutique.save();
        console.log("insertion boutique reussie");
        res.status(200).json({ message: "Utilisateur créé avec succès" });
    } catch (error) {
        console.log("l'erreur "+error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });

    }
});

//router register boutique by admin
router.post('/register/addBoutique/byAdmin',upload.array('photo_boutique',5),upload.array('logo_boutique',2),async(req,res)=>{
    try 
    {
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
                
        let photo_boutique = [];
        let logo_boutique = [];

        if (req.files['photo_boutique'] && req.files['photo_boutique'].length > 0) {
            for (const file of req.files['photo_boutique']) {
                 const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = path.extname(file.originalname);
                const filename = `avatar-${uniqueSuffix}${ext}`;
                const filepath = path.join(uploadDir, filename);
                await fs.writeFile(filepath, file.buffer);

                const photo_boutique_object = {
                    filename: filename,
                    url: `/uploads/photoBoutique/${filename}`,
                    size: file.size,
                    mimetype: file.mimetype
                }

                photo_boutique.push(photo_boutique_object);
            }
        }

        console.log("initialisation de boutique photo success");
        
        if (req.files['logo_boutique'] && req.files['logo_boutique'].length > 0) {
             for (const file of req.files['logo_boutique']) {
                 const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = path.extname(file.originalname);
                const filename = `avatar-${uniqueSuffix}${ext}`;
                const filepath = path.join(uploadDir, filename);
                await fs.writeFile(filepath, file.buffer);

                const logo_boutique_object = {
                    filename: filename,
                    url: `/uploads/logo_boutique/${filename}`,
                    size: file.size,
                    mimetype: file.mimetype
                }

                logo_boutique.push(logo_boutique_object);
            }
        }


        //find last user pour avoir son mail
        const last_user = await UserModel.findOne().sort({_id:-1});
        //console.log(last_user);
        const id_manager = last_user._id;
        const status_boutique = "6986f4f4e38c7e27ea86c045";
        const {nom_boutique,id_categorie,
                location,loyer,description_boutique} = req.body;

        const boutiqueData = {
            
            nom_boutique,
            manager_id:id_manager,
            description_boutique,
            logo:logo_boutique,
            photo_boutique:photo_boutique,
            id_categorie:id_categorie,
            location:location,
            status:status_boutique,
            rating:null,
            loyer
        }
        
        console.log(' Données utilisateur avant création:', JSON.stringify(userData, null, 2));
      
        const newBoutique = new userModel(boutiqueData);

        await newBoutique.save();
        res.status(201).json({
            message: "Utilisateur créé avec succès",
            // user: {
            //     id: newUser._id,
            //     nom_client: newUser.nom_client,
            //     prenom_client: newUser.prenom_client,
            //     email: newUser.email,
            //     avatar: newUser.avatar // ✅ Retourner l'avatar
            // }
        });

    } catch (error) {
         console.error('Erreur complète:', error);
        // console.error('Stack:', error.stack);
        // res.status(500).json({ message: "Erreur serveur", error: error.message });
   
    }
})

// router register boutique
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
});

module.exports = router;