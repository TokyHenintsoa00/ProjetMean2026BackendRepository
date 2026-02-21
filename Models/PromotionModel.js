const mongoose = require('mongoose');

const PromotionModel = new mongoose.Schema({
    id_boutique:{type:mongoose.Schema.Types.ObjectId, ref:'Boutique'},
    id_produit:{type:mongoose.Schema.Types.ObjectId,ref:'Produit'},
    attribut:{type:String,required:true},
    valeur:{type:String,required:true},
    prix_unitaire:{type:Number,required:true},
    remise:{type:Number,required:true},
    prix_promotion:{type:Number,required:true},
    date_debut_promotion:{type:Date,required:true},
    date_fin_promotion:{type:Date,required:true},
    created_at:{type:Date,required:true},   
    updated_at:{type:Date,required:true}
});

module.exports = mongoose.model('Promotion', PromotionModel);