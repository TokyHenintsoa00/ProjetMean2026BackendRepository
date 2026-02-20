const mongoose = require('mongoose');

const PanierModel = new mongoose.Schema({

    id_acheteur:{type:mongoose.Schema.Types.ObjectId, ref:'User'},
    id_boutique:{type:mongoose.Schema.Types.ObjectId, ref:'Boutique'},
    id_produit:{type:mongoose.Schema.Types.ObjectId,ref:'Produit'},
    nom_produit:{type:String,required:true},
    taille:{type:String,required:true},
    quantite:{type:Number,required:true},
    prix_unitaire:{type:Number,required:true},
    total:{type:Number,required:true},
    status:{type:mongoose.Schema.Types.ObjectId,ref:'Status'}

});
module.exports = mongoose.model('Pannier',PanierModel)