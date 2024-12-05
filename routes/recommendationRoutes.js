const express = require('express');
const recommendationController = require('../controllers/recommendationController');
const router = express.Router();

router.get('/cuaca/:locationId', recommendationController.getWeatherByLocationId); 

module.exports = router;