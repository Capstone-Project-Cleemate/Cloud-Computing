require('dotenv').config();
const { Firestore } = require('@google-cloud/firestore');

const firestore = new Firestore({
  projectId: process.env.PROJECT_ID,
  keyFilename: process.env.KEY_FILENAME,
});

module.exports = firestore;