const mongoose = require('mongoose');

const CategorieModel = new mongoose.Schema({
    nom: { type: String, required: true },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categorie',
        default: null
    }
});

module.exports = mongoose.model('Categorie',CategorieModel);