require('dotenv').config();
const { Firestore } = require('@google-cloud/firestore');

const firestore = new Firestore({
  projectId: process.env.PROJECT_ID,
  keyFilename: process.env.KEY_FILENAME,
});

firestore.listCollections().then(collections => {
    console.log("Koneksi ke Firestore berhasil. Koleksi yang tersedia:");
    collections.forEach(collection => {
        console.log(`- ${collection.id}`);
    });
}).catch(error => {
    console.error("Terjadi kesalahan saat menghubungkan ke Firestore:", error);
});

module.exports = firestore;