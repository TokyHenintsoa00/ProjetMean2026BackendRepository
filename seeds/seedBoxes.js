/**
 * Seed script — Box collection
 * Usage: node seeds/seedBoxes.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Box = require('../Models/BoxModel');

const boxes = [
    // ── Rez-de-chaussée ──────────────────────────────────────
    { numero: 'A-001', etage: 'RDC',     superficie: 45,  statut: 'libre',      description: 'Angle entrée principale, forte visibilité' },
    { numero: 'A-002', etage: 'RDC',     superficie: 38,  statut: 'occupe',     description: 'Proche caisse centrale' },
    { numero: 'A-003', etage: 'RDC',     superficie: 52,  statut: 'libre',      description: 'Face allée centrale' },
    { numero: 'A-004', etage: 'RDC',     superficie: 30,  statut: 'libre',      description: 'Box compact côté nord' },
    { numero: 'B-001', etage: 'RDC',     superficie: 60,  statut: 'occupe',     description: 'Grand espace, zone alimentaire' },
    { numero: 'B-002', etage: 'RDC',     superficie: 40,  statut: 'libre',      description: 'Proche sortie de secours ouest' },
    { numero: 'B-003', etage: 'RDC',     superficie: 35,  statut: 'en_travaux', description: 'Rénovation en cours' },
    { numero: 'B-004', etage: 'RDC',     superficie: 48,  statut: 'libre',      description: 'Bon flux piétonnier' },
    { numero: 'C-001', etage: 'RDC',     superficie: 55,  statut: 'occupe',     description: 'Zone restauration' },
    { numero: 'C-002', etage: 'RDC',     superficie: 42,  statut: 'libre',      description: 'Angle sud-est' },

    // ── Étage 1 ──────────────────────────────────────────────
    { numero: 'A-101', etage: 'Étage 1', superficie: 50,  statut: 'libre',      description: 'Vue sur atrium central' },
    { numero: 'A-102', etage: 'Étage 1', superficie: 36,  statut: 'occupe',     description: 'Près escalator nord' },
    { numero: 'A-103', etage: 'Étage 1', superficie: 44,  statut: 'libre',      description: 'Accès ascenseur direct' },
    { numero: 'B-101', etage: 'Étage 1', superficie: 58,  statut: 'libre',      description: 'Grande vitrine donnant sur galerie' },
    { numero: 'B-102', etage: 'Étage 1', superficie: 32,  statut: 'libre',      description: 'Box intérieur calme' },
    { numero: 'B-103', etage: 'Étage 1', superficie: 47,  statut: 'occupe',     description: 'Zone mode & textile' },
    { numero: 'C-101', etage: 'Étage 1', superficie: 65,  statut: 'libre',      description: 'Angle sud, très lumineux' },
    { numero: 'C-102', etage: 'Étage 1', superficie: 39,  statut: 'en_travaux', description: 'Mise aux normes électriques' },

    // ── Étage 2 ──────────────────────────────────────────────
    { numero: 'A-201', etage: 'Étage 2', superficie: 70,  statut: 'libre',      description: 'Grand espace showroom' },
    { numero: 'A-202', etage: 'Étage 2', superficie: 45,  statut: 'libre',      description: 'Box lumineux côté est' },
    { numero: 'B-201', etage: 'Étage 2', superficie: 80,  statut: 'occupe',     description: 'Zone high-tech & informatique' },
    { numero: 'B-202', etage: 'Étage 2', superficie: 55,  statut: 'libre',      description: 'Face terrasse panoramique' },
    { numero: 'C-201', etage: 'Étage 2', superficie: 48,  statut: 'libre',      description: 'Calme, idéal services' },
    { numero: 'C-202', etage: 'Étage 2', superficie: 60,  statut: 'libre',      description: 'Proche food court terrasse' },
];

async function seed() {
    try {
        await mongoose.connect(process.env.atlas_URL);
        console.log('✔  MongoDB connecté');

        const existing = await Box.countDocuments();
        if (existing > 0) {
            console.log(`ℹ  ${existing} box(es) déjà présents. Suppression et ré-insertion...`);
            await Box.deleteMany({});
        }

        const inserted = await Box.insertMany(boxes);
        console.log(`✔  ${inserted.length} boxes insérés avec succès !\n`);

        // Résumé par étage
        const summary = {};
        inserted.forEach(b => {
            summary[b.etage] = (summary[b.etage] || 0) + 1;
        });
        Object.entries(summary).forEach(([etage, count]) => {
            console.log(`   ${etage.padEnd(10)} → ${count} box(es)`);
        });

        console.log('\nStatuts :');
        const statuts = { libre: 0, occupe: 0, en_travaux: 0 };
        inserted.forEach(b => statuts[b.statut]++);
        console.log(`   Libre      → ${statuts.libre}`);
        console.log(`   Occupé     → ${statuts.occupe}`);
        console.log(`   En travaux → ${statuts.en_travaux}`);

    } catch (err) {
        console.error('✖  Erreur :', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✔  Déconnecté.');
    }
}

seed();
