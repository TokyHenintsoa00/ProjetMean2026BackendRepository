const mongoose = require('mongoose');

const BoutiqueModel = new mongoose.Schema({
    //user id
    nom_boutique:{type:String,required:true},
    //ref: id user dans model USER
    manager_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'UserModel'},

    description:{type:String,required:true},
    
    logo:{  filename: String,
            url: String,
            size: Number,
            mimetype: String},
    
    photo_boutique:[{   filename: String,
                url: String,
                size: Number,
                mimetype: String}],

    id_categorie:{type:mongoose.Schema.Types.ObjectId,
        ref:'CategorieModel'
    },

    location:{type:String ,required:true},
    
    commission: {type: Number, required: true},

    //active |pending|suspend
    // status:{type:mongoose.Schema.Types.ObjectId,
    //     ref:'StatusModel',
    // },
    status:{type:String,required:true},
    rating:{type: Number,required:true,min:0,max:5},

    loyer:{type: Number,required:true},

    //total_charge_commercial:{type: Number, required:true}
});
module.exports = mongoose.model('Boutique',BoutiqueModel);