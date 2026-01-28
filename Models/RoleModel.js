const mongoose = require('mongoose');
const RoleMode = new mongoose.Schema({
    nom_role:{type:String , required:true}
});