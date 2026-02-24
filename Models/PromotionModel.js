const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema({
    nom: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type_reduction: {
        type: String,
        enum: ['pourcentage', 'montant_fixe'],
        required: true
    },
    valeur_reduction: { type: Number, required: true, min: 0 },
    date_debut: { type: Date, required: true },
    date_fin: { type: Date, required: true },
    boutique: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Boutique',
        required: true
    },
    produits: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Produit'
    }],
    actif: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Virtual: is this promotion currently active based on dates
PromotionSchema.virtual('is_active_now').get(function () {
    const now = new Date();
    return this.actif && this.date_debut <= now && this.date_fin >= now;
});

module.exports = mongoose.model('Promotion', PromotionSchema);
