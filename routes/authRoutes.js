// routes/authRoutes.js
const express = require('express');
const { register, login } = require('../controllers/authController');

const router = express.Router();

// Rute untuk Registrasi
router.post('/register', register);

// Rute untuk Login
router.post('/login', login);

module.exports = router;