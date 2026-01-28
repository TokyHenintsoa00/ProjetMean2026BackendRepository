const mongoose = require('mongoose');

const CategorieModel = new mongoose.Schema({
    nom_categorie:{type:String , required:true}
});