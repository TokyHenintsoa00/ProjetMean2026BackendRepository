const mongoose = require('mongoose');
const RoleModel = new mongoose.Schema({
    nom_role:{type:String , required:true}
});

module.exports = mongoose.model('RoleUser',RoleModel);