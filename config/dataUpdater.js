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
    { name: 'kecamatanforecast-jawatengah.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-jawatengah.csv' },
    { name: 'kecamatanforecast-jawatimur.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-jawatimur.csv' },
    { name: 'kecamatanforecast-kalbar.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-kalbar.csv' },
    { name: 'kecamatanforecast-kalsel.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-kalsel.csv' },
    { name: 'kecamatanforecast-kalteng.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-kalteng.csv' },
    { name: 'kecamatanforecast-kaltim.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-kaltim.csv' },
    { name: 'kecamatanforecast-kaluta.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-kaluta.csv' },
    { name: 'kecamatanforecast-kepriau.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-kepriau.csv' },
    { name: 'kecamatanforecast-lampung.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-lampung.csv' },
    { name: 'kecamatanforecast-maluku.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-maluku.csv' },
    { name: 'kecamatanforecast-malut.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-malut.csv' },
    { name: 'kecamatanforecast-ntb.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-ntb.csv' },
    { name: 'kecamatanforecast-ntt .csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-ntt.csv' },
    { name: 'kecamatanforecast-papua.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-papua.csv' },
    { name: 'kecamatanforecast-papuabarat.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-papuabarat.csv' },
    { name: 'kecamatanforecast-riau.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-riau.csv' },
    { name: 'kecamatanforecast-sulbar.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-sulbar.csv' },
    { name: 'kecamatanforecast-sulsel.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-sulsel.csv' },
    { name: 'kecamatanforecast-sulteng.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-sulteng.csv' },
    { name: 'kecamatanforecast-sultenggara.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-sultenggara.csv' },
    { name: 'kecamatanforecast-sulut.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-sulut.csv' },
    { name: 'kecamatanforecast-sumbar.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-sumbar.csv' },
    { name: 'kecamatanforecast-sumsel.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-sumsel.csv' },
    { name: 'kecamatanforecast-sumut.csv', url: 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/CSV/kecamatanforecast-sumut.csv' },
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

// Update CSV setiap 3 hari sekali
const cron = require('node-cron');
cron.schedule('0 0 */3 * *', () => {
    console.log('Menjalankan pembaruan data...');
    updateData().catch(console.error);
});

updateData().catch(console.error);
