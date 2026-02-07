const express = require('express');
const router = express.Router();
const ProduitModel = require('../Models/ProduitModel');
const calculatorFunction = require('../utils/CalculatorFunction');
const authMiddleware = require('../Middleware/verifyToken');
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10Mo max par fichier
});


//register variante de produit
// =>get id produit
// add variante + 





//register produit sans variante
router.post('/register/addProduit',upload.array('photo_user', 1),authMiddlware,async(req,res)=>{

    try 
    {
        //get id_boutique
        const id_boutique = req.user.id;

        const photo = req.files.map(file => ({
            filename: file.originalname,
            url: '', // À remplir si vous sauvegardez sur un serveur de fichiers
            size: file.size,
            mimetype: file.mimetype
        }));

        const produit_content = new ProduitModel({
            id_boutique:id_boutique,
            nom_boutique:req.body.nom_boutique,
            prix_hors_taxe:req.body.prix_hors_taxe,
            image:photo,
            id_categorie:req.body.id_categorie,
            sous_categorie:req.body.sous_categorie,
            stock:req.body.stock,
            rating:null,
            total_avis:null,
            status:req.body.status,
            variante:null
        });

        await produit_content.save();
        res.status(200).json({message:"Role cree"});
        //au debut 
        // rating = 0 
        // total_avis = 0
        //variante = 0
    } catch (error) {
        console.log(error);
    }
})

model.exports = router


/**
 * Calcule la somme totale des produits
 * @param {Array} produits - [{ prix, quantite }]
 * @returns {Number}
 */