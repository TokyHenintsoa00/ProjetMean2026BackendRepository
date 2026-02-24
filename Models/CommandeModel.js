const mongoose = require('mongoose');

const LigneCommandeSchema = new mongoose.Schema({
    produit: { type: mongoose.Schema.Types.ObjectId, ref: 'Produit', required: true },
    variante_id: { type: mongoose.Schema.Types.ObjectId },
    nom_produit: { type: String, required: true },
    combinaison_label: { type: String, default: '' },
    prix_unitaire: { type: Number, required: true },
    quantite: { type: Number, required: true, min: 1 },
    sous_total: { type: Number, required: true }
});

const CommandeSchema = new mongoose.Schema({
    numero_commande: { type: String, unique: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    boutique: { type: mongoose.Schema.Types.ObjectId, ref: 'Boutique', required: true },
    lignes: [LigneCommandeSchema],
    total: { type: Number, required: true },
    statut: {
        type: String,
        enum: ['en_attente', 'confirmee', 'en_preparation', 'prete', 'livree', 'annulee'],
        default: 'en_attente'
    },
    adresse_livraison: { type: String },
    mode_retrait: {
        type: String,
        enum: ['livraison', 'retrait_boutique'],
        default: 'livraison'
    },
    note_client: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

CommandeSchema.pre('save', async function () {
    if (!this.numero_commande) {
        this.numero_commande = 'CMD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    }
});

module.exports = mongoose.model('Commande', CommandeSchema);
