const mongoose = require('mongoose');

const BoutiqueModel = new mongoose.Schema({
    //user id
    nom_boutique:{type:String,required:true},
    //ref: id user dans model USER
    manager_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'},

    description_boutique:{type:String,required:true},
    
    logo:[{
        filename: String,
        url: String,
        size: Number,
        mimetype: String
    }],
    
    

    photo_boutique:[{
        filename: String,
        url: String,
        size: Number,
        mimetype: String
    }],

    id_categorie:[{type:mongoose.Schema.Types.ObjectId,
        ref:'Categorie'
    }],

    location:{type:String ,required:false},

    horaires: [{
        jour: { type: String, required: true, enum: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] },
        ouverture: { type: String },
        fermeture: { type: String },
        est_ferme: { type: Boolean, default: false }
    }],


    
    // commission: {type: Number, required: true},

    //active |pending|suspend
    // status:{type:mongoose.Schema.Types.ObjectId,
    //     ref:'StatusModel',
    // },
    status:{type:mongoose.Schema.Types.ObjectId,
        ref:'Status'
    },

    commission: { type: Number, required: false },

    rating:{type: Number,required:false,min:0,max:5},

    loyer:{type: Number,required:false},

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }

    //total_charge_commercial:{type: Number, required:true}
});
module.exports = mongoose.model('Boutique',BoutiqueModel);