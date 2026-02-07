const mongoose = require('mongoose');

const CategorieModel = new mongoose.Schema({
    nom_categorie:{type:String , required:true},
    commission: {
        type: Number,
        required: true,
            min: 0,
            max: 100
    },

});

module.exports = mongoose.model('Categorie',CategorieModel);