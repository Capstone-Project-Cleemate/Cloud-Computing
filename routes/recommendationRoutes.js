const express = require('express');
const recommendationController = require('../controllers/recommendationController');
const router = express.Router();

router.get('/:latitude/:longitude', recommendationController.getPredictedWeather);
router.post('/prediksi', recommendationController.predictExtremeFluctuation);

module.exports = router;