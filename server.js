const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:4200', // URL de votre frontend Angular
    credentials: true, // Permet l'envoi de cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/mall')
  .then(() => console.log('MongoDB connecté'))
  .catch(err => console.error(err));

// mongoose.connect('mongodb+srv://projetmean_db_user:ghBVzF5ZfPjdNTDf@cluster0.mqn9zli.mongodb.net/?appName=Cluster0')
//   .then(() => console.log('MongoDB connecté'))
//   .catch(err => console.error(err));


app.use('/role', require('./routes/RoleRoute'));
app.use('/user',require('./routes/UserRoutes'));
app.use('/categorie',require('./routes/CategorieRoutes'));
app.use('/boutique',require('./routes/BoutiqueRoute'));
app.use('/status',require('./routes/StatusRoutes'));
app.listen(PORT, () => console.log(`Serveur démarré sur le port
${PORT}`));