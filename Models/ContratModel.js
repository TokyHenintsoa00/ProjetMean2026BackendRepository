const mongoose = require('mongoose');

const DocumentContratSchema = new mongoose.Schema({
    type: { type: String },   // contrat_signe | avenant | autre
    url:  { type: String },
    date: { type: Date }
});

const LoyerSchema = new mongoose.Schema({
    montant_mensuel:    { type: Number, required: true },
    devise:             { type: String, default: 'MGA' },
    charges_incluses:   { type: Boolean, default: false },
    charges_mensuelles: { type: Number, default: 0 }
});

const ContratSchema = new mongoose.Schema({
    boutique_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Boutique',
        required: true
    },
    box_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Box',
        default: null
    },
    mall_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    date_debut:        { type: Date, required: true },
    date_fin:          { type: Date, required: true },
    duree_mois:        { type: Number, required: true },
    loyer:             { type: LoyerSchema, required: true },
    caution:           { type: Number, default: 0 },
    statut: {
        type: String,
        enum: ['actif', 'expire', 'resilie', 'en_renouvellement'],
        default: 'actif'
    },
    renouvellement_auto: { type: Boolean, default: false },
    documents:           { type: [DocumentContratSchema], default: [] },
    created_at:          { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contrat', ContratSchema);
