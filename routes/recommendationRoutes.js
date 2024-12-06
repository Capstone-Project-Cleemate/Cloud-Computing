const express = require('express');
const recommendationController = require('../controllers/recommendationController');
const router = express.Router();

router.get('/cuaca/:locationId', recommendationController.getWeatherByLocationId); 
router.get('/cuaca/nama/:locationName', recommendationController.getWeatherByLocationName); 
router.get('/cuaca/koordinat/:latitude/:longitude', recommendationController.getWeatherByCoordinates); 

module.exports = router;