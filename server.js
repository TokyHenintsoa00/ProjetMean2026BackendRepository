const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.FRONTEND_URL || 'http://localhost:4200';
app.use(cors({
  origin: allowedOrigins.split(',').map(o => o.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB
mongoose.connect(process.env.atlas_URL)
  .then(() => console.log('MongoDB connecté'))
  .catch(err => console.error('Erreur connexion MongoDB:', err));

// Health check pour Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/role', require('./routes/RoleRoute'));
app.use('/user', require('./routes/UserRoutes'));
app.use('/categorie', require('./routes/CategorieRoutes'));
app.use('/boutique', require('./routes/BoutiqueRoute'));
app.use('/status', require('./routes/StatusRoutes'));

app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));