const mongoose = require('mongoose');

const EmplacementSchema = new mongoose.Schema({
    nom:         { type: String, required: true },
    type:        { type: String, enum: ['etage', 'zone'], required: true },
    etage_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Emplacement', default: null }, // uniquement pour type=zone
    description: { type: String, default: '' },
    couleur:     { type: String, default: '#64748b' },
    created_at:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Emplacement', EmplacementSchema);
