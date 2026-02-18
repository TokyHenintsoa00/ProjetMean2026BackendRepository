const express = require('express');
const router = express.Router();
const CategorieModel = require('../Models/CategorieModel');

router.post('/register/categorie',async(req,res)=>{
    try 
    {
        const {nom,parent} = req.body;
        const categorie = new CategorieModel( {
            nom,
            parent
        });

        await categorie.save();
        res.status(200).json({message:"Role cree"});
    } catch (error) {
        console.log(error);
    }
});


// Categories racines uniquement (pour le choix de boutique)
router.get('/getAll/boutique',async(req,res)=>{
    try {
        const categorie = await CategorieModel.find({parent:null});
        res.json(categorie);
    } catch(error){
        console.log("l'erreur "+error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
})

// Arbre hierarchique complet (pour le choix de categorie produit)
router.get('/tree', async (req, res) => {
    try {
        const allCategories = await CategorieModel.find();

        const buildTree = (parentId) => {
            return allCategories
                .filter(cat => {
                    if (parentId === null) return !cat.parent;
                    return cat.parent && cat.parent.toString() === parentId.toString();
                })
                .map(cat => ({
                    id: cat._id,
                    nom: cat.nom,
                    enfants: buildTree(cat._id)
                }));
        };

        const tree = buildTree(null);
        res.json(tree);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

module.exports = router;