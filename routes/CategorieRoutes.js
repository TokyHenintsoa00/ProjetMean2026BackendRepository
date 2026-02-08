const express = require('express');
const router = express.Router();
const CategorieModel = require('../Models/CategorieModel');

// CREATE
router.post('/register/categorie', async (req, res) => {
    try {
        const { nom, parent } = req.body;
        const categorie = new CategorieModel({
            nom,
            parent: parent || null
        });
        await categorie.save();
        res.status(200).json({ message: "Categorie cree" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// READ ALL
router.get('/getAll', async (req, res) => {
    try {
        const categorie = await CategorieModel.find().populate('parent');
        res.json(categorie);
    } catch (error) {
        console.log("l'erreur " + error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// READ ONE
router.get('/get/:id', async (req, res) => {
    try {
        const categorie = await CategorieModel.findById(req.params.id).populate('parent');
        if (!categorie) {
            return res.status(404).json({ message: "Categorie non trouvee" });
        }
        res.json(categorie);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// GET children of a category
router.get('/getChildren/:id', async (req, res) => {
    try {
        const children = await CategorieModel.find({ parent: req.params.id });
        res.json(children);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// GET root categories (no parent)
router.get('/getRoots', async (req, res) => {
    try {
        const roots = await CategorieModel.find({ parent: null });
        res.json(roots);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// GET tree (nested format with sous_categorie)
router.get('/getTree', async (req, res) => {
    try {
        const allCategories = await CategorieModel.find().lean();

        function buildTree(parentId) {
            return allCategories
                .filter(cat => String(cat.parent) === String(parentId))
                .map(cat => {
                    const children = buildTree(cat._id);
                    return {
                        _id: cat._id,
                        nom: cat.nom,
                        sous_categorie: children.length > 0 ? children : null,
                        __v: cat.__v
                    };
                });
        }

        const tree = buildTree(null);
        res.json(tree);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// UPDATE
router.put('/update/:id', async (req, res) => {
    try {
        const { nom, parent } = req.body;
        const categorie = await CategorieModel.findByIdAndUpdate(
            req.params.id,
            { nom, parent: parent || null },
            { new: true }
        );
        if (!categorie) {
            return res.status(404).json({ message: "Categorie non trouvee" });
        }
        res.status(200).json({ message: "Categorie mise a jour", categorie });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// DELETE
router.delete('/delete/:id', async (req, res) => {
    try {
        const categorie = await CategorieModel.findById(req.params.id);
        if (!categorie) {
            return res.status(404).json({ message: "Categorie non trouvee" });
        }
        // Reassign children to the deleted category's parent
        await CategorieModel.updateMany(
            { parent: req.params.id },
            { parent: categorie.parent }
        );
        await CategorieModel.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Categorie supprimee" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

module.exports = router;
