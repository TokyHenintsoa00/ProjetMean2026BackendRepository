const mongoose = require('mongoose');

const BoxSchema = new mongoose.Schema({
    numero: { type: String, required: true },
    etage: { type: String, default: 'RDC' },
    superficie: { type: Number },
    mall_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    boutique_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Boutique', default: null },
    statut: {
        type: String,
        enum: ['libre', 'occupe', 'en_travaux'],
        default: 'libre'
    },
    description: { type: String, default: '' },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Box', BoxSchema);
