const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const PannierModel = require('../Models/PanierModel')
const ProduitModel = require('../Models/ProduitModel');
//const authMiddleware = require('../Middleware/verifyToken');
const {authMiddleware,managerMiddleware, clientMiddleware} = require('../Middleware/verifyToken');
const PanierModel = require('../Models/PanierModel');
const PromotionModel = require('../Models/PromotionModel');
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Helper: sauvegarder un fichier image et retourner ses metadonnees
async function saveImageFile(file) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `produit-${uniqueSuffix}${ext}`;
    const uploadDir = path.join(__dirname, '../uploads/produits');
    try { await fs.access(uploadDir); } catch { await fs.mkdir(uploadDir, { recursive: true }); }
    await fs.writeFile(path.join(uploadDir, filename), file.buffer);
    return {
        filename,
        url: `/uploads/produits/${filename}`,
        size: file.size,
        mimetype: file.mimetype
    };
}

// ====================================================================
// ROUTES MODELE PRODUIT
// ====================================================================

// GET tous les produits de la boutique connectee
router.get('/my-products', managerMiddleware, async (req, res) => {
    try {
        const id_boutique = req.user.id_boutique_user;
        if (!id_boutique) return res.status(404).json({ message: "Aucune boutique associee" });
        const produits = await ProduitModel.find({ id_boutique })
            .populate('id_categorie')
            .sort({ created_at: -1 });
        res.json(produits);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// GET un produit par id
router.get('/get/:id', authMiddleware, async (req, res) => {
    try {
        const produit = await ProduitModel.findById(req.params.id).populate('id_categorie');
        if (!produit) return res.status(404).json({ message: "Produit non trouve" });
        res.json(produit);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
}); 

// POST creer un nouveau modele produit (sans prix ni stock — geres separement)
router.post('/create', authMiddleware, upload.array('images', 10), async (req, res) => {
    try {
        const id_boutique = req.user.id_boutique_user;

        const imagesData = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                imagesData.push(await saveImageFile(file));
            }
        }

        const { nom_produit, description, id_categorie, attributs } = req.body;

        let parsedCategories = [];
        if (id_categorie) {
            try { parsedCategories = typeof id_categorie === 'string' ? JSON.parse(id_categorie) : id_categorie; }
            catch { parsedCategories = []; }
        }

        let parsedAttributs = [];
        if (attributs) {
            try { parsedAttributs = typeof attributs === 'string' ? JSON.parse(attributs) : attributs; }
            catch { parsedAttributs = []; }
        }

        // Si aucun attribut → variante par defaut
        const variantes = parsedAttributs.length === 0
            ? [{ combinaison: [], is_default: true, stock: 0, historique_prix: [] }]
            : [];

        const newProduit = new ProduitModel({
            id_boutique,
            nom_produit,
            description,
            images: imagesData,
            id_categorie: parsedCategories,
            attributs: parsedAttributs,
            variantes
        });

        await newProduit.save();
        res.status(201).json({ message: "Produit cree avec succes", produit: newProduit });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// PUT modifier le modele produit (ajoute nouvelles images sans effacer les existantes)
router.put('/update/:id', authMiddleware, upload.array('images', 10), async (req, res) => {
    try {
        const { nom_produit, description, id_categorie, attributs } = req.body;
        const updateData = { updated_at: Date.now() };

        if (nom_produit) updateData.nom_produit = nom_produit;
        if (description !== undefined) updateData.description = description;

        if (id_categorie !== undefined) {
            try { updateData.id_categorie = typeof id_categorie === 'string' ? JSON.parse(id_categorie) : id_categorie; }
            catch { updateData.id_categorie = []; }
        }

        if (attributs !== undefined) {
            try { updateData.attributs = typeof attributs === 'string' ? JSON.parse(attributs) : attributs; }
            catch { updateData.attributs = []; }
        }

        let newImagesData = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                newImagesData.push(await saveImageFile(file));
            }
        }

        let updated;
        if (newImagesData.length > 0) {
            updated = await ProduitModel.findByIdAndUpdate(
                req.params.id,
                { $set: updateData, $push: { images: { $each: newImagesData } } },
                { new: true }
            );
        } else {
            updated = await ProduitModel.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
        }

        if (!updated) return res.status(404).json({ message: "Produit non trouve" });
        res.json({ message: "Produit mis a jour", produit: updated });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// DELETE supprimer une image d'un produit
router.delete('/delete-image/:produit_id', authMiddleware, async (req, res) => {
    try {
        const { image_id } = req.body;
        if (!image_id) return res.status(400).json({ message: "image_id requis" });
        const updated = await ProduitModel.findByIdAndUpdate(
            req.params.produit_id,
            { $pull: { images: { _id: image_id } } },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: "Produit non trouve" });
        res.json({ message: "Image supprimee", produit: updated });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// DELETE supprimer un produit complet
router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const deleted = await ProduitModel.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Produit non trouve" });
        res.json({ message: "Produit supprime avec succes" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// ====================================================================
// ROUTES VARIANTES
// ====================================================================



// POST ajouter une variante a un produit v1
router.post('/variante/V1/add/:id_produit', authMiddleware, async (req, res) => {
    try {
        const { combinaison, reference, stock, prix_hors_taxe, prix_ttc } = req.body;

        const nouvelleVariante = {
            combinaison: combinaison || [],
            is_default: false,
            reference: reference || '',
            stock: Number(stock) || 0,
            historique_prix: []
        };
         const get_prix_ttc = (prix_hors_taxe) * 1.2;
        // Prix initial optionnel
        if (prix_hors_taxe) {
            nouvelleVariante.historique_prix.push({
                prix_hors_taxe: Number(prix_hors_taxe),
                prix_ttc: get_prix_ttc
            });
        }

        const updated = await ProduitModel.findByIdAndUpdate(
            req.params.id_produit,
            { $push: { variantes: nouvelleVariante } },
            { new: true }
        );

        if (!updated) return res.status(404).json({ message: "Produit non trouve" });
        res.json({ message: "Variante ajoutee", produit: updated });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});



// POST ajouter une variante a un produit
router.post('/variante/add/:id_produit', authMiddleware, async (req, res) => {
    try {
        const { combinaison, reference, stock, prix_hors_taxe, prix_ttc } = req.body;

        const nouvelleVariante = {
            combinaison: combinaison || [],
            is_default: false,
            reference: reference || '',
            stock: Number(stock) || 0,
            historique_prix: []
        };

        // Prix initial optionnel
        if (prix_hors_taxe) {
            nouvelleVariante.historique_prix.push({
                prix_hors_taxe: Number(prix_hors_taxe),
                prix_ttc: prix_ttc ? Number(prix_ttc) : null
            });
        }

        const updated = await ProduitModel.findByIdAndUpdate(
            req.params.id_produit,
            { $push: { variantes: nouvelleVariante } },
            { new: true }
        );

        if (!updated) return res.status(404).json({ message: "Produit non trouve" });
        res.json({ message: "Variante ajoutee", produit: updated });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// PUT modifier une variante (combinaison ou reference)
router.put('/variante/update/:id_produit/:id_variante', authMiddleware, async (req, res) => {
    try {
        const { combinaison, reference } = req.body;
        const updateFields = {};
        if (combinaison !== undefined) updateFields['variantes.$[v].combinaison'] = combinaison;
        if (reference !== undefined) updateFields['variantes.$[v].reference'] = reference;

        const updated = await ProduitModel.findByIdAndUpdate(
            req.params.id_produit,
            { $set: updateFields },
            { arrayFilters: [{ 'v._id': req.params.id_variante }], new: true }
        );

        if (!updated) return res.status(404).json({ message: "Produit ou variante non trouve" });
        res.json({ message: "Variante mise a jour", produit: updated });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// DELETE supprimer une variante
router.delete('/variante/delete/:id_produit/:id_variante', authMiddleware, async (req, res) => {
    try {
        const updated = await ProduitModel.findByIdAndUpdate(
            req.params.id_produit,
            { $pull: { variantes: { _id: req.params.id_variante } } },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: "Produit non trouve" });
        res.json({ message: "Variante supprimee", produit: updated });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// ====================================================================
// ROUTES PRIX
// ====================================================================


// POST definir un nouveau prix pour une variante (ajoute a l'historique) V1 ajout valeur reel
router.post('/prix/V1/set/:id_produit/:id_variante', authMiddleware, async (req, res) => {
    try {
        const { prix_hors_taxe, prix_ttc } = req.body;
        if (!prix_hors_taxe) return res.status(400).json({ message: "prix_hors_taxe requis" });

        const get_prix_ttc = (prix_hors_taxe) * 1.2;

        const nouvelleEntree = {
            prix_hors_taxe: Number(prix_hors_taxe),
            prix_ttc: get_prix_ttc,
            created_at: new Date()
        };

        const updated = await ProduitModel.findByIdAndUpdate(
            req.params.id_produit,
            { $push: { 'variantes.$[v].historique_prix': nouvelleEntree } },
            { arrayFilters: [{ 'v._id': req.params.id_variante }], new: true }
        );

        if (!updated) return res.status(404).json({ message: "Produit ou variante non trouve" });
        res.json({ message: "Prix defini", produit: updated });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});


// POST definir un nouveau prix pour une variante (ajoute a l'historique)
router.post('/prix/set/:id_produit/:id_variante', authMiddleware, async (req, res) => {
    try {
        const { prix_hors_taxe, prix_ttc } = req.body;
        if (!prix_hors_taxe) return res.status(400).json({ message: "prix_hors_taxe requis" });

        const nouvelleEntree = {
            prix_hors_taxe: Number(prix_hors_taxe),
            prix_ttc: prix_ttc ? Number(prix_ttc) : null,
            created_at: new Date()
        };

        const updated = await ProduitModel.findByIdAndUpdate(
            req.params.id_produit,
            { $push: { 'variantes.$[v].historique_prix': nouvelleEntree } },
            { arrayFilters: [{ 'v._id': req.params.id_variante }], new: true }
        );

        if (!updated) return res.status(404).json({ message: "Produit ou variante non trouve" });
        res.json({ message: "Prix defini", produit: updated });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// GET historique des prix d'une variante
router.get('/prix/history/:id_produit/:id_variante', authMiddleware, async (req, res) => {
    try {
        const produit = await ProduitModel.findById(req.params.id_produit);
        if (!produit) return res.status(404).json({ message: "Produit non trouve" });

        const variante = produit.variantes.id(req.params.id_variante);
        if (!variante) return res.status(404).json({ message: "Variante non trouvee" });

        const history = [...variante.historique_prix].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        res.json(history);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// ====================================================================
// ROUTES STOCK
// ====================================================================

// PUT mettre a jour le stock d'une variante
router.put('/stock/update/:id_produit/:id_variante', authMiddleware, async (req, res) => {
    try {
        const { stock } = req.body;
        if (stock === undefined || stock === null) return res.status(400).json({ message: "stock requis" });

        const updated = await ProduitModel.findByIdAndUpdate(
            req.params.id_produit,
            { $set: { 'variantes.$[v].stock': Number(stock) } },
            { arrayFilters: [{ 'v._id': req.params.id_variante }], new: true }
        );

        if (!updated) return res.status(404).json({ message: "Produit ou variante non trouve" });
        res.json({ message: "Stock mis a jour", produit: updated });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});



// ====================================================================
// ROUTES PRODUIT SPECIAL CLIENT
// ====================================================================

//get all produit by id boutique
router.get('/getAllProduit/byId',async function(req,res){

    try 
    {
        const {id_boutique} = req.query;

        const findProduitByIdBoutique = await ProduitModel.find({id_boutique:id_boutique});

        res.json(findProduitByIdBoutique);
    } catch (error) {
        console.log(err);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }

});

// ====================================================================
// ROUTES POUR ajout panier de  PRODUIT
// ====================================================================
router.post('/ajout/panier',clientMiddleware,async function(req,res){

    try 
    {   
        //get le id du client depuis le tokken
        const id_user_client = req.user.id;

        const {id_boutique,id_produit,nom_produit,
                taille,quantite,prix_unitaire,total} = req.body;

        const dataPanier = new PannierModel({
            id_acheteur:id_user_client,
            id_boutique,
            id_produit,
            nom_produit,
            taille,
            quantite,
            prix_unitaire,
            total,
            status:"6986f4f4e38c7e27ea86c045"
        });

        await dataPanier.save()
        res.status(200).json({ 
            message: "Panier",
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });

    }


})

//get panier client by id
router.get('/getAll/panier/byId', clientMiddleware, async function(req, res){
    try {
        const id_user_client = req.user.id;
        console.log(id_user_client);
        
        const findPanierClientById = await PanierModel.find({
            id_acheteur: id_user_client,
            //status en attente => non payer 
            status:"6986f4f4e38c7e27ea86c045"
        })
            .populate('id_produit')

        if(!findPanierClientById){
            return res.status(404).json({ message: "Panier introuvable" });
        }

        return res.status(200).json(findPanierClientById);
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({ message: "Erreur serveur" });
    }
})


router.post('/payment/AllPanier/byClient',async function(req,res){

    //payment Money - total panier
    // update status article panier user en paid
    //update stock

})

router.put('/panier/delete',async function(req,res){

    try
    {
        // get id panier pour update en 
        const {_id} = req.body;
        const update_id_panier_to_delete = await PanierModel.findByIdAndUpdate(
            _id,
            {
                //status delete 
                status: new mongoose.Types.ObjectId('69995db6e5af01e96a2a54f0')
            },
            {new:true}
        );

        res.status(200).json({
            message: "Produit supprime dans le panier",
        });

    }
    catch(error){
        console.log(error);
    }
})


// ====================================================================
// ROUTES POUR ajout panier de  Promotion
// ====================================================================



router.post('/promotion', managerMiddleware, async function(req, res) {
    try {
        const id_boutique = req.user.id_boutique;
        const { id_produit, variantes } = req.body;

        // variantes = tableau envoyé par le frontend
        if (!variantes || !Array.isArray(variantes) || variantes.length === 0) {
            return res.status(400).json({ message: "Aucune variante en promotion fournie" });
        }

        // Construit un document PromotionModel par variante
        const docs = variantes.map(v => {
            const prix_remise = v.prix_unitaire * (v.remise / 100);
            return {
                id_boutique,
                id_produit,
                attribut:              v.attribut,
                valeur:                v.valeur,
                prix_unitaire:         v.prix_unitaire,
                remise:                v.remise,
                prix_promotion:        prix_remise,
                date_debut_promotion:  new Date(v.date_debut_promotion),
                date_fin_promotion:    new Date(v.date_fin_promotion),
                created_at:            new Date(),
                updated_at:            new Date(),
            };
        });

        // insertMany → insère toutes les promotions en une seule requête DB
        await PromotionModel.insertMany(docs);

        res.status(200).json({
            message: `${docs.length} promotion(s) enregistrée(s) avec succès`,
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});


// router.post('/promotion',managerMiddleware, async function(req,res){
//     try 
//     {
//         const get_id_boutique = req.user.id_boutique;

//         const {id_produit,attribut,valeur,prix_unitaire,remise,
//                 date_debut_promotion,date_fin_promotion} = req.body

//         const prix_remise = (prix_unitaire) * (remise/100);

//         const dataPromotion = new PromotionModel({
//             id_boutique:get_id_boutique,
//             id_produit,
//             attribut,
//             valeur,
//             prix_unitaire,
//             remise,
//             prix_promotion:prix_remise,
//             date_debut_promotion: new Date(date_debut_promotion),
//             date_fin_promotion: new Date(date_fin_promotion),
//             created_at: new Date(),
//             updated_at: new Date()
//         })

//         await dataPromotion.save();
//         res.status(200).json({ 
//             message: "Promotion sucess",
//         });

//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: "Erreur serveur", error: error.message });
//     }
// })


module.exports = router;
