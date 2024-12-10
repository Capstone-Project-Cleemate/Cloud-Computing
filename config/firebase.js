const admin = require('firebase-admin');
const serviceAccount = require('../cleemate.json'); // Path ke file Service Account Key

// Local Pakai Ini
// Ambil Service Account Key dari console google cleemate
// if (!admin.apps.length) {
//     admin.initializeApp({
//         credential: admin.credential.cert(serviceAccount),
//     });
// }


if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(), 
    });
}

module.exports = admin;
