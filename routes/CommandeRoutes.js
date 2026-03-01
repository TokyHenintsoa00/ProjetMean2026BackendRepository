const express = require('express');
const router = express.Router();
const CommandeModel = require('../Models/CommandeModel');
const ProduitModel = require('../Models/ProduitModel');
const authMiddleware = require('../Middleware/verifyToken');
const requireRole = require('../Middleware/requireRole');

// POST creer une commande — client seulement
router.post('/create', authMiddleware, requireRole('client'), async (req, res) => {
    try {
        const { boutique, lignes, adresse_livraison, mode_retrait, note_client } = req.body;
        if (!boutique || !lignes || lignes.length === 0) {
            return res.status(400).json({ message: "boutique et lignes sont requis" });
        }

        let total = 0;
        const lignesFinales = [];

        for (const ligne of lignes) {
            const produit = await ProduitModel.findById(ligne.produit);
            if (!produit) return res.status(404).json({ message: `Produit ${ligne.produit} non trouve` });

            const variante = produit.variantes.id(ligne.variante_id);
            if (!variante) return res.status(404).json({ message: `Variante ${ligne.variante_id} non trouvee` });

            const dernierPrix = variante.historique_prix.length > 0
                ? variante.historique_prix[variante.historique_prix.length - 1]
                : null;
            if (!dernierPrix) {
                return res.status(400).json({ message: `Aucun prix defini pour ${produit.nom_produit}` });
            }

            const prixUnitaire = dernierPrix.prix_ttc || dernierPrix.prix_hors_taxe;
            const sousTotal = prixUnitaire * ligne.quantite;

            const combinaisonLabel = variante.combinaison
                .map(c => `${c.attribut}: ${c.valeur}`)
                .join(', ');

            lignesFinales.push({
                produit: produit._id,
                variante_id: variante._id,
                nom_produit: produit.nom_produit,
                combinaison_label: combinaisonLabel || 'Standard',
                prix_unitaire: prixUnitaire,
                quantite: ligne.quantite,
                sous_total: sousTotal
            });

            total += sousTotal;
        }

        const commande = new CommandeModel({
            client: req.user.id,
            boutique,
            lignes: lignesFinales,
            total,
            adresse_livraison: adresse_livraison || '',
            mode_retrait: mode_retrait || 'livraison',
            note_client: note_client || ''
        });

        await commande.save();
        res.status(201).json({ message: "Commande creee avec succes", commande });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// GET mes commandes — client seulement
router.get('/my-orders', authMiddleware, requireRole('client'), async (req, res) => {
    try {
        const commandes = await CommandeModel.find({ client: req.user.id })
            .populate('boutique', 'nom_boutique')
            .sort({ created_at: -1 });
        res.json(commandes);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// GET commandes de ma boutique — manager seulement
router.get('/boutique-orders', authMiddleware, requireRole('manager'), async (req, res) => {
    try {
        const id_boutique = req.user.id_boutique_user;
        if (!id_boutique) return res.status(404).json({ message: "Aucune boutique associee" });

        const commandes = await CommandeModel.find({ boutique: id_boutique })
            .populate('client', 'nom_client prenom_client email')
            .sort({ created_at: -1 });
        res.json(commandes);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// PUT mettre a jour le statut d'une commande — manager seulement
router.put('/update-status/:id', authMiddleware, requireRole('manager'), async (req, res) => {
    try {
        const { statut } = req.body;
        if (!statut) return res.status(400).json({ message: "statut requis" });

        const commande = await CommandeModel.findByIdAndUpdate(
            req.params.id,
            { $set: { statut, updated_at: Date.now() } },
            { new: true }
        );

        if (!commande) return res.status(404).json({ message: "Commande non trouvee" });
        res.json({ message: "Statut mis a jour", commande });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// GET toutes les commandes — admin seulement
router.get('/all', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const commandes = await CommandeModel.find()
            .populate('client', 'nom_client prenom_client email')
            .populate('boutique', 'nom_boutique')
            .sort({ created_at: -1 });
        res.json(commandes);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// GET stats commandes — admin seulement
router.get('/stats', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const totalCommandes = await CommandeModel.countDocuments();
        const commandesParStatut = await CommandeModel.aggregate([
            { $group: { _id: '$statut', count: { $sum: 1 } } }
        ]);
        const revenueTotal = await CommandeModel.aggregate([
            { $match: { statut: { $ne: 'annulee' } } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const topBoutiques = await CommandeModel.aggregate([
            { $match: { statut: { $ne: 'annulee' } } },
            { $group: { _id: '$boutique', total: { $sum: '$total' }, count: { $sum: 1 } } },
            { $sort: { total: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'boutiques', localField: '_id', foreignField: '_id', as: 'boutique' } },
            { $unwind: '$boutique' },
            { $project: { nom_boutique: '$boutique.nom_boutique', total: 1, count: 1 } }
        ]);

        res.json({
            totalCommandes,
            commandesParStatut,
            revenueTotal: revenueTotal[0]?.total || 0,
            topBoutiques
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// PUT annuler commande — client seulement
router.put('/cancel/:id', authMiddleware, requireRole('client'), async (req, res) => {
    try {
        const commande = await CommandeModel.findById(req.params.id);
        if (!commande) return res.status(404).json({ message: 'Commande non trouvée' });
        if (commande.client.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Non autorisé' });
        }
        if (commande.statut !== 'en_attente') {
            return res.status(400).json({ message: 'Seules les commandes en attente peuvent être annulées' });
        }
        commande.statut = 'annulee';
        commande.updated_at = new Date();
        await commande.save();
        res.json({ message: 'Commande annulée', commande });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// GET commande by ID (client, manager boutique, admin)
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const commande = await CommandeModel.findById(req.params.id)
            .populate('client', 'nom_client prenom_client email')
            .populate('boutique', 'nom_boutique adresse_boutique logo');
        if (!commande) return res.status(404).json({ message: 'Commande non trouvée' });

        const userId = req.user.id.toString();
        const boutiqueUser = req.user.id_boutique_user?.toString();
        const isOwner = commande.client._id.toString() === userId;
        const isBoutiqueManager = boutiqueUser && commande.boutique._id.toString() === boutiqueUser;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isBoutiqueManager && !isAdmin) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }
        res.json(commande);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

module.exports = router;
