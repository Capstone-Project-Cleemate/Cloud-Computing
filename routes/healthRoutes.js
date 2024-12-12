const express = require('express');
const healthController = require('../controllers/healthController');
const router = express.Router();

router.post('/', healthController.getHealthRecommendations); 

module.exports = router;