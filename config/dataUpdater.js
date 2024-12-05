// dataUpdater.js
require('dotenv').config();
const https = require('https');
const fs = require('fs'); 
const fsPromises = require('fs').promises;
const path = require('path');
const { Storage } = require('@google-cloud/storage');

const bucketName = process.env.BUCKET_NAME; 

const files = [
    { name: 'kecamatanforecast-aceh.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-aceh.csv' },
    { name: 'kecamatanforecast-bali.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-bali.csv' },
    { name: 'kecamatanforecast-babel.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-babel.csv' },
    { name: 'kecamatanforecast-banten.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-banten.csv' },
    { name: 'kecamatanforecast-bengkulu.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-bengkulu.csv' },
    { name: 'kecamatanforecast-jogyakarta.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-jogyakarta.csv' },
    { name: 'kecamatanforecast-jakarta.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-jakarta.csv' },
    { name: 'kecamatanforecast-gorontalo.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-gorontalo.csv' },
    { name: 'kecamatanforecast-jambi.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-jambi.csv' },
    { name: 'kecamatanforecast-jawabarat.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-jawabarat.csv' },
];

const storage = new Storage();

async function downloadCSV(file) {
    const filePath = path.join(__dirname, file.name);

    return new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(filePath);
        https.get(file.url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${file.url}' (${response.statusCode})`));
                return;
            }
            response.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close(resolve); // Selesai menulis file
            });
        }).on('error', (err) => {
            fs.unlink(filePath).catch(() => {}); // Hapus file jika terjadi kesalahan
            reject(err);
        });
    });
}

async function uploadToGCS(file) {
    const filePath = path.join(__dirname, file.name);

    await storage.bucket(bucketName).upload(filePath, {
        destination: file.name, 
        resumable: false, 
    });

    console.log(`File ${file.name} diunggah ke ${bucketName}.`);

    await fsPromises.unlink(filePath);
    console.log(`File ${file.name} berhasil dihapus dari lokal.`);
}

async function updateData() {
    for (const file of files) {
        await downloadCSV(file);
        await uploadToGCS(file);
    }
}

// Update CSV setiap 10 hari sekali
const cron = require('node-cron');
cron.schedule('0 0 */10 * *', () => {
    console.log('Menjalankan pembaruan data...');
    updateData().catch(console.error);
});

updateData().catch(console.error);