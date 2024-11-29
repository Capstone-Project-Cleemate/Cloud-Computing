const firestore = require('../config/firestore');

exports.saveRecommendation = async (req, res) => {
    const { locationId, humidity, temperature, timestamp, weatherCode, windDirection, windSpeed, recommendations } = req.body;

    try {
        await firestore.collection('recommendations').doc(locationId).set({
            locationId: locationId,
            humidity: humidity,
            temperature: temperature,
            timestamp: timestamp,
            weatherCode: weatherCode,
            windDirection: windDirection,
            windSpeed: windSpeed,
        });

        res.status(201).json({ message: "Rekomendasi berhasil disimpan." });
    } catch (error) {
        console.error("Error saving recommendation:", error);
        res.status(500).json({ message: "Terjadi kesalahan saat menyimpan rekomendasi." });
    }
};

exports.getRecommendationByLocationId = async (req, res) => {
    const locationId = req.params.locationId;
    console.log("Mencari rekomendasi untuk locationId:", locationId);

    try {
        const snapshot = await firestore.collection('recommendations').doc(locationId).get();

        if (!snapshot.exists) {
            return res.status(404).json({ message: "Rekomendasi tidak ditemukan untuk locationId tersebut." });
        }

        const data = snapshot.data();

        res.json({
            locationId: data.locationId,
            humidity: data.humidity,
            temperature: data.temperature,
            timestamp: data.timestamp,
            weatherCode: data.weatherCode,
            windDirection: data.windDirection,
            windSpeed: data.windSpeed,
        });
    } catch (error) {
        console.error("Error getting recommendation:", error);
        res.status(500).json({ message: "Terjadi kesalahan saat mengambil rekomendasi." });
    }
};