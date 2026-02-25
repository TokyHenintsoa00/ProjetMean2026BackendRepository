const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT;
const path = require('path');
// Middleware
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:4200', // URL de votre frontend Angular
    credentials: true, // Permet l'envoi de cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// mongoose.connect('mongodb://127.0.0.1:27017/mall')
//   .then(() => console.log('MongoDB connecté'))
//   .catch(err => console.error(err));

mongoose.connect(process.env.atlas_URL)
  .then(() => console.log('MongoDB connecté'))
  .catch(err => console.error('Erreur MongoDB:', err));

app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/role', require('./routes/RoleRoute'));
app.use('/user',require('./routes/UserRoutes'));
app.use('/categorie',require('./routes/CategorieRoutes'));
app.use('/boutique',require('./routes/BoutiqueRoute'));
app.use('/produit',require('./routes/ProduitRoutes'));
app.use('/commande',require('./routes/CommandeRoutes'));
app.use('/promotion',require('./routes/PromotionRoutes'));
app.use('/status',require('./routes/StatusRoutes'));
app.use('/produit',require('./routes/ProduitRoutes'));
app.use('/dasboard/admin',require('./routes/DashboardAdminRoutes'));
app.listen(PORT, () => console.log(`Serveur démarré sur le port
${PORT}`));