const mongoose = require('mongoose');

const PanierModel = new mongoose.Schema({

    id_acheteur:{type:mongoose.Schema.Types.ObjectId, ref:'User'},
    nom_produit:{type:String,required:true},
    taille:{type:String,required:true},
    quantite:{type:Number,required:true},
    prix_unitaire:{type:Number,required:true},
    total:{type:Number,required:true}


});
module.exports = mongoose.model('Pannier',PanierModel)