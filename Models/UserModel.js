const mongoose = require('mongoose');

const UserModel = new mongoose.Schema({

    nom:{type:String,required:true},
    prenom:{type:String,required:true},
    date_naissance:{type:Date,required:true},
    role:{type:mongoose.Schema.Types.ObjectId,
            ref:'RoleModel'},
    numero_telephone:{type:number , required:true},
    avatar:{filename:String,url:String,size:Number,mintype:String},
    is_active:{type:boolean , required:true},
    created_at:{type:Date , reqired:true},
    updated_at:{type:Date , reqired:true}

});