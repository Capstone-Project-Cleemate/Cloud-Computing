const express = require('express');
const recommendationController = require('../controllers/recommendationController');
const router = express.Router();

router.get('/cuaca/:locationId', recommendationController.getWeatherByLocationId); 
router.get('/cuaca/nama/:locationName', recommendationController.getWeatherByLocationName); 
router.get('/cuaca/koordinat/:latitude/:longitude', recommendationController.getWeatherByCoordinates); 
router.post('/prediksi', recommendationController.predictExtremeFluctuation);
router.post('/predict-weather', async (req, res) => {
    const { latitude, longitude, requestTime } = req.body;

    // Log input yang diterima
    console.log("Received request with:", { latitude, longitude, requestTime });

    if (!latitude || !longitude || !requestTime) {
        console.log("Missing parameters: ", { latitude, longitude, requestTime });
        return res.status(400).json({ message: "Latitude, longitude, dan requestTime harus disediakan." });
    }

    try {
        // Panggil fungsi untuk mendapatkan data cuaca berdasarkan koordinat
        const weatherData = await recommendationController.getWeatherByCoordinates({ params: { latitude, longitude } });

        // Log data cuaca yang diterima
        console.log("Weather data received:", weatherData);

        // Pastikan weatherData adalah array
        if (!Array.isArray(weatherData)) {
            console.log("Invalid weather data format:", weatherData);
            return res.status(500).json({ message: "Data cuaca tidak valid." });
        }

        // Filter data cuaca berdasarkan waktu yang diminta
        const filteredData = weatherData.filter(data => {
            const weatherTime = new Date(data.Waktu).toISOString();
            console.log("Comparing weather time:", weatherTime, "with request time:", requestTime);
            return weatherTime === requestTime; // Bandingkan dengan waktu yang diminta
        });

        if (filteredData.length > 0) {
            // Ambil data yang diperlukan
            const { "Kelembapan Udara (%)": humidity, "Suhu Udara (°C)": temperature, "Kecepatan Angin (km/jam)": windSpeed } = filteredData[0];
            console.log("Filtered data found:", { humidity, temperature, windSpeed });
            return res.json({
                humidity,
                temperature,
                windSpeed
            });
        } else {
            console.log("No weather data found for the requested time.");
            return res.status(404).json({ message: "Data cuaca tidak ditemukan untuk waktu yang diminta." });
        }
    } catch (error) {
        console.error("Error during weather prediction:", error);
        return res.status(500).json({ message: "Terjadi kesalahan saat melakukan prediksi cuaca." });
    }
});

module.exports = router;