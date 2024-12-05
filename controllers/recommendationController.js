const { Storage } = require('@google-cloud/storage');
const csv = require('csv-parser');

const storage = new Storage();
const bucketName = process.env.BUCKET_NAME;

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
    ];

    try {

        const allWeatherData = await Promise.all(files.map(fileName => readCSVFromGCS(fileName, locationId)));

        const flattenedData = allWeatherData.flat();

        if (flattenedData.length > 0) {

            const formattedData = flattenedData.map(row => ({
                "ID Lokasi": row[0],
                "Waktu": row[1],
                // "Suhu Udara (Min)": row[2] || null,
                // "Suhu Udara (Max)": row[3] || null,
                // "Kelembapan Udara (Min)": row[4] || null,
                // "Kelembapan Udara (Max)": row[5] || null,
                "Kelembapan Udara (%)": row[6],
                "Suhu Udara (°C)": row[7],
                "Cuaca": weatherCodes[row[8]] || "Tidak Diketahui", 
                "Arah Angin": windDirectionCodes[row[9]] || "Tidak Diketahui", 
                "Kecepatan Angin (km/jam)": row[10]
            }));

            return res.json(formattedData);
        } else {
            return res.status(404).json({ message: " Data cuaca tidak ditemukan untuk lokasi ini." });
        }
    } catch (error) {
        console.error("Error reading CSV files:", error);
        return res.status(500).json({ message: "Terjadi kesalahan saat mengambil data cuaca." });
    }
};
