const mongoose = require('mongoose');

const ProduitModel = new mongoose.Schema({

    id_boutique:{type:mongoose.Schema.Types.ObjectId,
        ref:'BoutiqueModel'},
    
    nom_produit:{type:String,required:true}, //1
    description:{type:String,required:true}, //1
    prix_hors_taxe:{type:Number,required:true}, //1
    prix_ttc:{type:Number,required:true},
    //image de base
    image:{filename: String,
                url: String,
                size: Number,
                mimetype: String}, //1
    id_categorie:{type:mongoose.Schema.Types,ObjectId, //1
                    ref:'CategorieModel'},

    //sous categorie => categorie produit
    sous_categorie:{type:String,required:true},
    //total stock dans variante
    stock:{type:Number,required:true}, //1
    rating:{type:Number, required:true,min:0,max:5}, //null for first insert
    total_avis:{type:Number,required:true}, //null for first insert
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

module.exports = mongoose.model('Produit',ProduitModel);