const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const BoxModel = require('../Models/BoxModel')
router.post('/addBox',async function(req,res){
    try 
    {
        const{num_box,etage,zone,status,boutique_id} = req.body; 
        
        const newBoxData = {
            num_box,etage,
            zone,status,
            boutique_id
        }

        const newBox = new BoxModel(newBoxData);

        await newBox.save();
        console.log("box insert");
        
        
    } catch (error) {
        
    }


});

module.exports = router;