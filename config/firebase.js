// config/firestore.js
const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

admin.initializeApp({
    credential: admin.credential.cert(require(process.env.KEY_FILENAME)),
});

module.exports = admin;