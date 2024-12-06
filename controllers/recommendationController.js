const { predictExtremeFluctuation } = require('./predictionController');
const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const csv = require('csv-parser');
const https = require('https');

const storage = new Storage();
const bucketName = process.env.BUCKET_NAME;

let geofeatures = {};

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
                    console.log("Total geofeatures loaded:", Object.keys(geofeatures).length);
                    console.log("Geofeatures:", geofeatures); 
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

    console.log("Found location ID:", locationId);

    return this.getWeatherByLocationId({ params: { locationId } }, res);
};

exports.getWeatherByCoordinates = async (req, res) => {
    const { latitude, longitude } = req.params;

    if (Object.keys(geofeatures).length === 0) {
        await loadGeofeatures();
    }

    const locationId = Object.keys(geofeatures).find(id => 
        geofeatures[id].latitude === latitude && geofeatures[id].longitude === longitude
    );

    if (!locationId) {
        return res.status(404).json({ message: "Lokasi tidak ditemukan." });
    }

    console.log("Found location ID:", locationId);

    return this.getWeatherByLocationId({ params: { locationId } }, res);
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
            const formattedData = flattenedData.map(row => ({
                "ID Lokasi": row[0],
                "Waktu": row[1],
                "Kelembapan Udara (%)": row[6],
                "Suhu Udara (°C)": row[7],
                "Cuaca": weatherCodes[row[8]] || "Tidak Diketahui", 
                "Arah Angin": windDirectionCodes[row[9]] || "Tidak Diketahui", 
                "Kecepatan Angin (km/jam)": row[10],
            }));

            const prediction = await predictExtremeFluctuation(weatherData);

            return res.json(formattedData);
        } else {
            return res.status(404).json({ message: "Data cuaca tidak ditemukan untuk lokasi ini." });
        }
    } catch (error) {
        console.error("Error reading CSV files:", error);
        return res.status(500).json({ message: "Terjadi kesalahan saat mengambil data cuaca." });
    }
};