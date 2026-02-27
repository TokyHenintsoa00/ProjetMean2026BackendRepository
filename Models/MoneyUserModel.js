const mongoose = require('mongoose');

const MoneyUserModel = new mongoose.Schema({
    id_user:{type:mongoose.Schema.Types.ObjectId, ref:'User'},
    money:{type:Number,required:true}
})

module.exports = mongoose.model('MoneyUser',MoneyUserModel);