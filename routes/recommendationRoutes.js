const express = require('express');
const { addRecommendation, getRecommendations } = require('../controllers/recommendationController');

const router = express.Router();

router.post('/', addRecommendation);
router.get('/', getRecommendations);

module.exports = router;