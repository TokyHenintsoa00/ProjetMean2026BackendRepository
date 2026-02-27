const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const boutiqueModel = require('../Models/BoutiqueModel');
const multer = require('multer');
const CategorieModel = require('../Models/CategorieModel');
const storage = multer.memoryStorage();
const path = require('path');
const UserModel = require('../Models/UserModel');
const BoutiqueModel = require('../Models/BoutiqueModel');
const { validationResult } = require('express-validator');
const fs = require('fs').promises;
const authMiddleware = require('../Middleware/verifyToken');
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

//boutique avec status active
router.get('/getAll/status/active',async function(req,res){
    try {
        const boutique = await boutiqueModel.find({
             status: new mongoose.Types.ObjectId("6986f4cce38c7e27ea86c043")
        })
        .populate('status')
        .populate('id_categorie')
        res.json(boutique);
    } catch (error) {
        console.log("l'erreur "+error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });

    }
});

// get tous les boutique non valide v=>boutique:pendding

// get avec toutes les infos 
router.get('/getAll/content',async function(req,res){
    try {
        const boutique = await boutiqueModel.find()
            .populate('id_categorie')
            .populate('manager_id')
        res.json(boutique);
    } catch (error) {
        console.log("l'erreur "+error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });

    }
    
});

//get toutes les demande de boutique en attente
router.get('/getAll/status/pending',async function(req,res){
    try {
           const boutique = await boutiqueModel.find({
             status: new mongoose.Types.ObjectId("6986f4f4e38c7e27ea86c045")
            })
            .populate('id_categorie')
            .populate('manager_id')
            res.json(boutique);
    } catch (error) {
        console.log("l'erreur "+error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });

    }
});


// get avec toutes les infos V1
//avec status en ligne et suspend
router.get('/getAll/content/V1',async function(req,res){
    try {
            //status active and suspend 
            const boutique = await boutiqueModel.find({
                status: { 
                    $in: [
                            new mongoose.Types.ObjectId("6986f4cce38c7e27ea86c043"),
                            new mongoose.Types.ObjectId("6986f513e38c7e27ea86c047")
                        ]
                }
            })
                .populate('id_categorie')
                .populate('manager_id')
                .populate('status')
                res.json(boutique);
    } catch (error) {
        console.log("l'erreur "+error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });

    }
})

//router register boutique by admin

// router.post('/register/boutique/byAdmin',upload.array('photo_voiture', 10),async function(req,res){
//     try 
//     {
//         //%comission en fonction du categorie de boutique
//         //=>comission type categirue et insert dans new boutique
//         const categorie = {id_categorie:req.body.id_categorie}
//         const id_categorie = categorie.id_categorie;
//         const find_comission = await CategorieModel.findById(id_categorie);
//         const comission = find_comission.commission;
//         //console.log(comisssion);
        
//         const newBoutique = new boutiqueModel({
//             nom_boutique:req.body.nom_boutique,
//             manager_id : req.body.manager_id,
//             description: req.body.description,
//             logo: req.body.logo,
//             photo_boutique:req.body.photo_boutique,
//             id_categorie:req.body.id_categorie,
//             location:req.body.location,
//             status:null,
//             rating:null,
//             loyer:req.body.loyer
//         });

//         await newBoutique.save();
//         console.log("insertion boutique reussie");
//         res.status(200).json({ message: "Utilisateur créé avec succès" });
//     } catch (error) {
//         console.log("l'erreur "+error);
//         res.status(500).json({ message: "Erreur serveur", error: error.message });

//     }
// });

//uplouad array dans un tab =>tsy afaka manao upload.array 2 fois dans une meme routes
const uploadMultiple = upload.fields([
    { name: 'photo_boutique', maxCount: 5 },
    { name: 'logo_boutique', maxCount: 1 }
]);

//demande de boutique par le client
router.post('/register/demandeBoutique/client',uploadMultiple,async(req,res)=>{
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
        
        let photo_boutique = [];
        let logo_boutique = [];
        
        if (req.files['photo_boutique'] && req.files['photo_boutique'].length > 0) {
            for (const file of req.files['photo_boutique']) {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = path.extname(file.originalname);
                const filename = `photo_boutique-${uniqueSuffix}${ext}`;
                const uploadDir = path.join(__dirname, '../uploads/boutique');
                try {
                    await fs.access(uploadDir);
                } catch {
                    await fs.mkdir(uploadDir, { recursive: true });
                }
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
                const filename = `logo_boutique-${uniqueSuffix}${ext}`;
                const uploadDir = path.join(__dirname, '../uploads/logo');
                try {
                    await fs.access(uploadDir);
                } catch {
                    await fs.mkdir(uploadDir, { recursive: true });
                }
                const filepath = path.join(uploadDir, filename);
                await fs.writeFile(filepath, file.buffer);

                const logo_boutique_object = {
                    filename: filename,
                    url: `/uploads/logoboutique/${filename}`,
                    size: file.size,
                    mimetype: file.mimetype
                }

                logo_boutique.push(logo_boutique_object);
            }
        }

        console.log("Logo boutique traité:", logo_boutique.length);
        
        // Find last user pour avoir son mail
        const last_user = await UserModel.findOne().sort({_id:-1});
        
        const id_manager = last_user._id;
        const status_boutique = "6986f4f4e38c7e27ea86c045";
        
        const {nom_boutique, id_categorie, description_boutique, horaires} = req.body;

        // 🔥 CORRECTION : Parser les horaires si c'est une string JSON
        let parsedHoraires = horaires;
        if (typeof horaires === 'string') {
            try {
                parsedHoraires = JSON.parse(horaires);
                console.log('✅ Horaires parsés:', parsedHoraires);
            } catch (error) {
                console.error('❌ Erreur lors du parsing des horaires:', error);
                return res.status(400).json({
                    message: "Format des horaires invalide",
                    error: error.message
                });
            }
        }

        const boutiqueData = {
            nom_boutique,
            manager_id: id_manager,
            description_boutique,
            logo: logo_boutique,
            photo_boutique: photo_boutique,
            id_categorie: id_categorie,
            location: null,
            horaires: parsedHoraires, // 🔥 Utiliser les horaires parsés
            commission: null,
            status: status_boutique,
            rating: null,
            loyer: null
        }
        
        console.log('📝 Données boutique avant création:', JSON.stringify(boutiqueData, null, 2));
      
        const newBoutique = new BoutiqueModel(boutiqueData);

        await newBoutique.save();
        
        res.status(201).json({
            message: "Boutique créée avec succès",
            boutique: {
                id: newBoutique._id,
                nom_boutique: newBoutique.nom_boutique,
                logo: newBoutique.logo,
                photo_boutique: newBoutique.photo_boutique,
                horaires: newBoutique.horaires
            }
        });

    } catch (error) {
        console.error('Erreur complète:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({ 
            message: "Erreur serveur", 
            error: error.message 
        });
    }
});


//router register boutique by admin
router.post('/register/addBoutique/byAdmin',uploadMultiple,async(req,res)=>{
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
                const filename = `photo_boutique-${uniqueSuffix}${ext}`;
                const uploadDir = path.join(__dirname, '../uploads/boutique');
                 try {
                    await fs.access(uploadDir);
                } catch {
                    await fs.mkdir(uploadDir, { recursive: true });
                }
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
                const filename = `logo_boutique-${uniqueSuffix}${ext}`;
                const uploadDir = path.join(__dirname, '../uploads/logo');
                 try {
                    await fs.access(uploadDir);
                } catch {
                    await fs.mkdir(uploadDir, { recursive: true });
                }
                const filepath = path.join(uploadDir, filename);
                await fs.writeFile(filepath, file.buffer);

                const logo_boutique_object = {
                    filename: filename,
                    url: `/uploads/logoboutique/${filename}`,
                    size: file.size,
                    mimetype: file.mimetype
                }

                logo_boutique.push(logo_boutique_object);
            }
        }

        console.log("Logo boutique traité:", logo_boutique.length);
        //find last user pour avoir son mail
        const last_user = await UserModel.findOne().sort({_id:-1});
        //console.log(last_user);
        
        const id_manager = last_user._id;
        const status_boutique = "6986f4cce38c7e27ea86c043";
        
        const {nom_boutique,id_categorie,
                description_boutique,horaires,commission} = req.body;

        let parsedHoraires = horaires;
        if (typeof horaires === 'string') {
            try {
                parsedHoraires = JSON.parse(horaires);
                console.log('✅ Horaires parsés:', parsedHoraires);
            } catch (error) {
                console.error('❌ Erreur lors du parsing des horaires:', error);
                return res.status(400).json({
                    message: "Format des horaires invalide",
                    error: error.message
                });
            }
        }

        const boutiqueData = {
            
            nom_boutique,
            manager_id:id_manager,
            description_boutique,
            logo:logo_boutique,
            photo_boutique:photo_boutique,
            id_categorie:id_categorie,
            horaires:parsedHoraires,
            commission:commission,
            status:status_boutique,
            rating:null,
        }
        
        console.log(' Données utilisateur avant création:', JSON.stringify(boutiqueData, null, 2));
      
        const newBoutique = new BoutiqueModel(boutiqueData);

        await newBoutique.save();
        res.status(201).json({
            message: "Utilisateur créé avec succès",
            boutique: {
                id: newBoutique._id,
                nom_boutique: newBoutique.nom_boutique,
                logo: newBoutique.logo,
                photo_boutique: newBoutique.photo_boutique
            }
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

//suspend account
router.put('/update/status/to/suspend',async function(req,res){
   
    try {
        
        const {_id} = req.body;
        const update_active_boutique = await BoutiqueModel.findByIdAndUpdate(
            _id,
            {
                status: new mongoose.Types.ObjectId('6986f513e38c7e27ea86c047')
            },
            { new: true } 
        );    

         if (!update_active_boutique) {
            return res.status(404).json({
                message: "Utilisateur non trouvé"
            });
        }

        res.status(200).json({
            message: "Compte active avec succès",
            user: update_active_boutique
        });  

        

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message:"error serveur",
            error:error.message
        });
    }
    
});

//activation de boutique
router.put('/update/status/to/active',async function(req,res){
    try 
    {
        const {_id} = req.body;
        const update_active_boutique = await BoutiqueModel.findByIdAndUpdate(
            _id,
            {
                status: new mongoose.Types.ObjectId('6986f4cce38c7e27ea86c043')
            },
            { new: true } 
        );    

         if (!update_active_boutique) {
            return res.status(404).json({
                message: "Utilisateur non trouvé"
            });
        }

        res.status(200).json({
            message: "Compte active avec succès",
            user: update_active_boutique
        });    

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message:"error serveur",
            error:error.message
        });
    }
})

//update location and loyer
router.put('/update/location/and/loyer',async function(req,res){
    try {
        const { _id, location, loyer, commission } = req.body;
        
       
        if (!_id) {
            return res.status(400).json({ 
                error: 'ID requis' 
            });
        }
        
        if (!location && !loyer && !commission) {
            return res.status(400).json({ 
                error: 'Au moins location ou loyer ou comission doit être fourni' 
            });
        }
        
       
        const updateData = {};
        if (location) updateData.location = location;
        if (loyer) updateData.loyer = loyer;
        if(commission) updateData.commission = commission;
        const update = await BoutiqueModel.findByIdAndUpdate(
            _id,
            {$set:updateData},
            { new: true }
        );

         res.status(200).json({
            message: "update de location et loyer",
            user: update
        });  

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message:"error serveur",
            error:error.message
        });
    }
})

router.get('/getInfo/byId',async function(req,res){

    try {
            const {id} = req.query;
            const getInfo = await BoutiqueModel.findById(id)
                .populate('status')
                .populate('id_categorie')
            res.json(getInfo);
        }
    catch (error) {
        console.log(error);

    }



})

// ============ GESTION MA BOUTIQUE (manager connecte) ============

// Recuperer la boutique du manager connecte
router.get('/my-boutique', authMiddleware, async function(req, res) {
    try {
        const id_boutique = req.user.id_boutique_user;
        if (!id_boutique) {
            return res.status(404).json({ message: "Aucune boutique associee a ce compte" });
        }
        const boutique = await BoutiqueModel.findById(id_boutique)
            .populate('status')
            .populate('id_categorie');
        if (!boutique) {
            return res.status(404).json({ message: "Boutique non trouvee" });
        }
        res.json(boutique);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// Mettre a jour les informations de base de la boutique
router.put('/update/info', authMiddleware, async function(req, res) {
    try {
        const id_boutique = req.user.id_boutique_user;
        const { nom_boutique, description_boutique, location, id_categorie } = req.body;

        const updateData = {};
        if (nom_boutique) updateData.nom_boutique = nom_boutique;
        if (description_boutique) updateData.description_boutique = description_boutique;
        if (location !== undefined) updateData.location = location;
        if (id_categorie !== undefined) {
            // Accepte un tableau ou une chaine JSON
            try {
                updateData.id_categorie = typeof id_categorie === 'string' ? JSON.parse(id_categorie) : id_categorie;
            } catch { updateData.id_categorie = []; }
        }
        updateData.updated_at = Date.now();

        const updated = await BoutiqueModel.findByIdAndUpdate(
            id_boutique,
            { $set: updateData },
            { new: true }
        ).populate('status').populate('id_categorie');

        if (!updated) {
            return res.status(404).json({ message: "Boutique non trouvee" });
        }

        res.status(200).json({ message: "Informations mises a jour", boutique: updated });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// Mettre a jour les horaires d'ouverture
router.put('/update/horaires', authMiddleware, async function(req, res) {
    try {
        const id_boutique = req.user.id_boutique_user;
        let { horaires } = req.body;

        if (typeof horaires === 'string') {
            horaires = JSON.parse(horaires);
        }

        const updated = await BoutiqueModel.findByIdAndUpdate(
            id_boutique,
            { $set: { horaires: horaires, updated_at: Date.now() } },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Boutique non trouvee" });
        }

        res.status(200).json({ message: "Horaires mis a jour", boutique: updated });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// Ajouter des photos a la galerie
router.put('/update/photos', authMiddleware, uploadMultiple, async function(req, res) {
    try {
        const id_boutique = req.user.id_boutique_user;

        let new_photos = [];
        let new_logo = [];

        if (req.files['photo_boutique'] && req.files['photo_boutique'].length > 0) {
            for (const file of req.files['photo_boutique']) {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = path.extname(file.originalname);
                const filename = `photo_boutique-${uniqueSuffix}${ext}`;
                const uploadDir = path.join(__dirname, '../uploads/boutique');
                try { await fs.access(uploadDir); } catch { await fs.mkdir(uploadDir, { recursive: true }); }
                const filepath = path.join(uploadDir, filename);
                await fs.writeFile(filepath, file.buffer);
                new_photos.push({
                    filename: filename,
                    url: `/uploads/boutique/${filename}`,
                    size: file.size,
                    mimetype: file.mimetype
                });
            }
        }

        if (req.files['logo_boutique'] && req.files['logo_boutique'].length > 0) {
            for (const file of req.files['logo_boutique']) {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = path.extname(file.originalname);
                const filename = `logo_boutique-${uniqueSuffix}${ext}`;
                const uploadDir = path.join(__dirname, '../uploads/logo');
                try { await fs.access(uploadDir); } catch { await fs.mkdir(uploadDir, { recursive: true }); }
                const filepath = path.join(uploadDir, filename);
                await fs.writeFile(filepath, file.buffer);
                new_logo.push({
                    filename: filename,
                    url: `/uploads/logo/${filename}`,
                    size: file.size,
                    mimetype: file.mimetype
                });
            }
        }

        const updateOps = { updated_at: Date.now() };
        const pushOps = {};

        if (new_photos.length > 0) {
            pushOps.photo_boutique = { $each: new_photos };
        }
        if (new_logo.length > 0) {
            // Remplacer le logo
            updateOps.logo = new_logo;
        }

        const updateQuery = { $set: updateOps };
        if (Object.keys(pushOps).length > 0) {
            updateQuery.$push = pushOps;
        }

        const updated = await BoutiqueModel.findByIdAndUpdate(id_boutique, updateQuery, { new: true });

        if (!updated) {
            return res.status(404).json({ message: "Boutique non trouvee" });
        }

        res.status(200).json({ message: "Photos mises a jour", boutique: updated });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// Supprimer une photo de la galerie
router.put('/delete/photo', authMiddleware, async function(req, res) {
    try {
        const id_boutique = req.user.id_boutique_user;
        const { photo_id } = req.body;

        const updated = await BoutiqueModel.findByIdAndUpdate(
            id_boutique,
            {
                $pull: { photo_boutique: { _id: photo_id } },
                $set: { updated_at: Date.now() }
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Boutique non trouvee" });
        }

        res.status(200).json({ message: "Photo supprimee", boutique: updated });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

module.exports = router;