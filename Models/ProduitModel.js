const mongoose = require('mongoose');

const ProduitModel = new mongoose.Schema({

    id_boutique:{type:mongoose.Schema.Types.ObjectId,
        ref:'BoutiqueModel'},
    
    nom_produit:{type:String,required:true},
    description:{type:String,required:true},
    prix_hors_taxe:{type:Number,required:true},
    prix_ttc:{type:Number,required:true},
    //image de base
    image:{filename: String,
                url: String,
                size: Number,
                mimetype: String},
    id_categorie:{type:mongoose.Schema.Types,ObjectId,
                    ref:'CategorieModel'},
    
    //total stock dans variante
    stock:{type:Number,required:true},
    rating:{type:Number, required:true,min:0,max:5},
    total_avis:{type:Number,required:true},
    status:{type:mongoose.Schema.Types.ObjectId,
            ref:'StatusModel',
    },
    variante:[{
        image:[{filename: String,
                url: String,
                size: Number,
                mimetype: String}],
        type: {type: String, required: true},
        stock: {type: Number, required: true},
        prix_ttc: {type: Number, required: true},
        prix_hors_taxe: {type: Number, required: true}
    }]
});