const mongoose = require('mongoose');

const UserModel = new mongoose.Schema({

    nom_client:{type:String,required:true},
    prenom_client:{type:String,required:true},
    date_naissance:{type:Date,required:true},
    role:{type:mongoose.Schema.Types.ObjectId,
            ref:'RoleModel'},
    numero_telephone:{type:Number , required:true},
    avatar:{filename:String,url:String,size:Number,mintype:String},
    is_active:{type:Boolean , required:true},
    created_at:{type:Date , reqired:true},
    updated_at:{type:Date , reqired:true}

});

module.exports = mongoose.model('User',UserModel);