const mongoose = require('mongoose');

const BoxModel = new mongoose.Schema({

    num_box:{type:String,required:true},
    etage:{type:String , required:true},
    zone:{type:String , required:true},
    status:{type:mongoose.Schema.Types.ObjectId,ref:'Status'},
    boutique_id:{type:mongoose.Schema.Types.ObjectId,ref:'Boutique'},
    created_at:{type:Date,required:true }
});

module.exports = mongoose.model('Box',BoxModel);