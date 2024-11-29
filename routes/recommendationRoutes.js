const express = require('express');
const recommendationController = require('../controllers/recommendationController');
const router = express.Router();

router.post('/', recommendationController.saveRecommendation);

router.get('/:locationId', recommendationController.getRecommendationByLocationId);

module.exports = router;