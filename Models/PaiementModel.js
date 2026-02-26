const mongoose = require('mongoose');

const PaiementSchema = new mongoose.Schema({
    contrat_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contrat',
        required: true
    },
    boutique_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Boutique',
        required: true
    },
    periode:          { type: String, required: true },   // "2024-06"
    montant_attendu:  { type: Number, required: true },
    montant_paye:     { type: Number, default: 0 },
    date_echeance:    { type: Date, required: true },
    date_paiement:    { type: Date, default: null },
    mode_paiement: {
        type: String,
        enum: ['especes', 'virement', 'cheque', 'mobile_money'],
        default: 'virement'
    },
    statut: {
        type: String,
        enum: ['paye', 'en_retard', 'partiel', 'impaye'],
        default: 'impaye'
    },
    reference: { type: String, default: '' },
    notes:     { type: String, default: '' },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Paiement', PaiementSchema);
