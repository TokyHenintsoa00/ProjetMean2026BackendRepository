const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/mall')
  .then(() => console.log('MongoDB connecté'))
  .catch(err => console.error(err));

app.use('/role', require('./routes/RoleRoute'));
app.use('/user',require('./routes/UserRoutes'));
app.use('/categorie',require('./routes/CategorieRoutes'));
app.use('/boutique',require('./routes/BoutiqueRoute'));
app.listen(PORT, () => console.log(`Serveur démarré sur le port
${PORT}`));