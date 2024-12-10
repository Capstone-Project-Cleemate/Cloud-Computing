const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const csv = require('csv-parser');
const https = require('https');
const tf = require('@tensorflow/tfjs-node');
const haversine = require('haversine-distance');

const storage = new Storage();
const bucketName = process.env.BUCKET_NAME;

let geofeatures = {};

let model;

const loadModel = async () => {
    model = await tf.loadLayersModel('https://storage.googleapis.com/cleemate-bucket/model.json');
};

loadModel().then(() => {
    console.log("Model loaded successfully");
}).catch(err => {
    console.error("Error loading model:", err);
});

exports.predictExtremeFluctuation = async (req, res) => {
    const {
        temp_change,
        wind_speed_change,
        humidity_change,
    } = req.body;

    if ([temp_change, wind_speed_change, humidity_change].some(value => value === null || value === undefined)) {
        return res.status(400).json({ message: "Data tidak lengkap." });
    }

    const inputFeatures = [
        0,
        0, 
        0, 
        temp_change,
        wind_speed_change,
        humidity_change,
        0,
        0,
        0,
        0,
        0, 
        0, 
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0 
    ];

    const expectedFeatures = 22; 
    if (inputFeatures.length !== expectedFeatures) {
        return res.status(400).json({
            message: `Jumlah fitur input tidak sesuai. Diharapkan ${expectedFeatures} fitur, tetapi mendapatkan ${inputFeatures.length}.`
        });
    }

    try {
        const inputData = tf.tensor2d([inputFeatures]);

        const prediction = model.predict(inputData);
        const predictedValue = prediction.dataSync()[0]; 

        const resultMessage = (
            Math.abs(temp_change) > 5 || 
            Math.abs(wind_speed_change) > 10 || 
            Math.abs(humidity_change) > 10 ||
            predictedValue < 0.2
        ) ? "Terdapat fluktuasi ekstrem." : "Tidak terdapat fluktuasi ekstrem.";
        
        return res.json({ hasil: resultMessage });
    } catch (error) {
        console.error("Error during prediction:", error);
        return res.status(500).json({ message: "Terjadi kesalahan saat melakukan prediksi." });
    }
};

const loadGeofeatures = async () => {
    return new Promise((resolve, reject) => {
        const results = {};
        https.get('https://storage.googleapis.com/cleemate-bucket/kecamatan_geofeatures.csv', (response) => {
            response.pipe(csv({ separator: ';', headers: ['locationId', 'locationName', 'kabupaten', 'provinsi', 'latitude', 'longitude'] }))
                .on('data', (data) => {

                    if (data.locationId && data.locationName && data.kabupaten && data.provinsi && data.latitude && data.longitude) {
                        const { locationId, locationName, kabupaten, provinsi, latitude, longitude } = data;
                        results[locationId] = {
                            locationId,
                            name: locationName,
                            kabupaten: kabupaten,
                            provinsi: provinsi,
                            latitude: latitude,
                            longitude: longitude
                        };
                    } else {
                        console.warn("Data tidak valid:", data); 
                    }
                })
                .on('end', () => {
                    geofeatures = results;
                    // console.log("Total geofeatures loaded:", Object.keys(geofeatures).length);
                    // console.log("Geofeatures:", geofeatures); 
                    resolve();
                })
                .on('error', (error) => {
                    console.error("Error loading geofeatures:", error);
                    reject(error);
                });
        });
    });
};

exports.getWeatherByLocationName = async (req, res) => {
    const locationName = req.params.locationName.toLowerCase();

    if (Object.keys(geofeatures).length === 0) {
        await loadGeofeatures();
    }

    const locationId = Object.keys(geofeatures).find(id => 
        geofeatures[id].name.toLowerCase() === locationName
    );

    if (!locationId) {
        return res.status(404).json({ message: "Lokasi tidak ditemukan." });
    }

    // console.log("Found location ID:", locationId);

    return this.getWeatherByLocationId({ params: { locationId } }, res);
};

exports.getWeatherByCoordinates = async (req, res) => {
    const { latitude, longitude } = req.params;

    if (Object.keys(geofeatures).length === 0) {
        await loadGeofeatures();
    }

    let closestLocation = null;
    let closestDistance = Infinity;

    // Loop through geofeatures to find the closest location
    for (const locationId in geofeatures) {
        const location = geofeatures[locationId];
        const locCoords = {
            latitude: parseFloat(location.latitude),
            longitude: parseFloat(location.longitude)
        };

        const userCoords = {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
        };

        const distance = haversine(locCoords, userCoords);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestLocation = locationId;
        }
    }

    if (!closestLocation) {
        return res.status(404).json({ message: "Lokasi tidak ditemukan." });
    }

    // Mengambil cuaca berdasarkan lokasi terdekat
    return exports.getWeatherByLocationId({ params: { locationId: closestLocation } }, res);
};

const weatherCodes = {
    0: "Cerah / Clear Skies",
    1: "Cerah Berawan / Partly Cloudy",
    2: "Cerah Berawan / Partly Cloudy",
    3: "Berawan / Mostly Cloudy",
    4: "Berawan Tebal / Overcast",
    5: "Udara Kabur / Haze",
    10: "Asap / Smoke",
    45: "Kabut / Fog",
    60: "Hujan Ringan / Light Rain",
    61: "Hujan Sedang / Rain",
    63: "Hujan Lebat / Heavy Rain",
    80: "Hujan Lokal / Isolated Shower",
    95: "Hujan Petir / Severe Thunderstorm",
    97: "Hujan Petir / Severe Thunderstorm"
};

const windDirectionCodes = {
    "N": "North",
    "NE": "Northeast",
    "E": "East",
    "SE": "Southeast",
    "S": "South",
    "SW": "Southwest",
    "W": "West",
    "NW": "Northwest"
};

async function readCSVFromGCS(fileName, locationId) {
    const results = [];
    const file = storage.bucket(bucketName).file(fileName);
    const stream = file.createReadStream();

    return new Promise((resolve, reject) => {
        stream
            .pipe(csv({ separator: ';', headers: false }))
            .on('data', (data) => {
                if (data[0] === locationId) { 
                    results.push(data);
                }
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

exports.getWeatherByLocationId = async (req, res) => {
    const locationId = req.params.locationId;

    const files = [
        'kecamatanforecast-aceh.csv',
        'kecamatanforecast-bali.csv',
        'kecamatanforecast-babel.csv',
        'kecamatanforecast-banten.csv',
        'kecamatanforecast-bengkulu.csv',
        'kecamatanforecast-jogyakarta.csv',
        'kecamatanforecast-jakarta.csv',
        'kecamatanforecast-gorontalo.csv',
        'kecamatanforecast-jambi.csv',
        'kecamatanforecast-jawabarat.csv',
        'kecamatanforecast-jawatengah.csv',
        'kecamatanforecast-jawatimur.csv',
        'kecamatanforecast-kalbar.csv',
        'kecamatanforecast-kalsel.csv',
        'kecamatanforecast-kalteng.csv',
        'kecamatanforecast-kaltim.csv',
        'kecamatanforecast-kaluta.csv',
        'kecamatanforecast-kepriau.csv',
        'kecamatanforecast-lampung.csv',
        'kecamatanforecast-maluku.csv',
        'kecamatanforecast-malut.csv',
        'kecamatanforecast-ntb.csv',
        'kecamatanforecast-ntt.csv',
        'kecamatanforecast-papua.csv',
        'kecamatanforecast-papuabarat.csv',
        'kecamatanforecast-riau.csv',
        'kecamatanforecast-sulbar.csv',
        'kecamatanforecast-sulsel.csv',
        'kecamatanforecast-sulteng.csv',
        'kecamatanforecast-sultenggara.csv',
        'kecamatanforecast-sulut.csv',
        'kecamatanforecast-sumbar.csv',
        'kecamatanforecast-sumsel.csv',
        'kecamatanforecast-sumut.csv',
        'kecamatanforecast-jakarta.csv',
        'kecamatanforecast-jambi.csv',
        'kecamatanforecast-sumut.csv',
        'kecamatanforecast-jawatimur.csv',
        'kecamatanforecast-jawatengah.csv',
    ];

    try {
        const allWeatherData = await Promise.all(files.map(fileName => readCSVFromGCS(fileName, locationId)));

        const flattenedData = allWeatherData.flat();

        if (flattenedData.length > 0) {
            // Ambil tanggal saat ini
            const today = new Date();
            const fiveDaysFromNow = new Date();
            fiveDaysFromNow.setDate(today.getDate() + 5);

            const formattedData = flattenedData
                .map(row => ({
                    "ID Lokasi": row[0],
                    "Waktu": new Date(row[1]), // Pastikan ini adalah objek Date
                    "Kelembapan Udara (%)": row[6],
                    "Suhu Udara (°C)": row[7],
                    "Cuaca": weatherCodes[row[8]] || "Tidak Diketahui",
                    "Arah Angin": windDirectionCodes[row[9]] || "Tidak Diketahui",
                    "Kecepatan Angin (km/jam)": row[10],
                }))
                .filter(data => data.Waktu >= today && data.Waktu <= fiveDaysFromNow); // Filter data untuk 5 hari ke depan

            if (formattedData.length > 0) {
                return formattedData;
            } else {
                return res.status(404).json({ message: "Data cuaca tidak ditemukan untuk lokasi ini dalam 5 hari ke depan." });
            }
        } else {
            return res.status(404).json({ message: "Data cuaca tidak ditemukan untuk lokasi ini." });
        }
    } catch (error) {
        console.error("Error reading CSV files:", error);
        return res.status(500).json({ message: "Terjadi kesalahan saat mengambil data cuaca." });
    }
};
