const mongoose = require('mongoose');

const BoutiqueManagerModel = new mongoose.Schema({
    boutique:{type:mongoose.Schema.Types.ObjectId,
            ref:'BoutiqueModel'},
    total_commande:{type:Number , required:true},
    chiffre_affaire:{type:Number , required:true},
    benefice:{type:Number , required:true},
    benefice_nett:{type:Number , required:true}
});