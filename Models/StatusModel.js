const mongoose = require('mongoose');

const StatusModel = new mongoose.Schema({

    nom_status:{type:String,required:true},
    class_css:{type:String,required:true}
});

module.exports = mongoose.model('Status',StatusModel);