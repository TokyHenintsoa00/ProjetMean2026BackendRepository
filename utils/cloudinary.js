const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

/**
 * Upload un buffer vers Cloudinary.
 * @param {Buffer} buffer  - contenu du fichier en mémoire
 * @param {string} folder  - dossier Cloudinary (ex: 'mall/boutique')
 * @returns {Promise<{secure_url: string, public_id: string}>}
 */
function uploadToCloud(buffer, folder) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'auto' },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(buffer);
    });
}

module.exports = { cloudinary, uploadToCloud };
