const mongoose = require('mongoose');

const HistoriquePrixSchema = new mongoose.Schema({
    prix_hors_taxe: { type: Number, required: true },
    prix_ttc: { type: Number },
    created_at: { type: Date, default: Date.now }
});

const VarianteSchema = new mongoose.Schema({
    combinaison: [{ attribut: String, valeur: String }],
    is_default: { type: Boolean, default: false },
    reference: { type: String },
    stock: { type: Number, default: 0 },
    historique_prix: [HistoriquePrixSchema]
});

const ProduitSchema = new mongoose.Schema({
    id_boutique: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Boutique',
        required: true
    },
    nom_produit: { type: String, required: true },
    description: { type: String },
    images: [{
        filename: String,
        url: String,
        size: Number,
        mimetype: String
    }],
    id_categorie: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categorie'
    }],
    // Types de variantes (ex: [{nom:'Taille', valeurs:['S','M','L']}])
    attributs: [{
        nom: { type: String, required: true },
        valeurs: [String]
    }],
    // SKUs : chaque combinaison avec son stock et historique de prix
    variantes: [VarianteSchema],
    status: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Status'
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Produit', ProduitSchema);
