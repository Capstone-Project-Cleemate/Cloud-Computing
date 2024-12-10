// routes/authRoutes.js
const express = require('express');
const { register, login, getUserProfile, updateUserProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Rute untuk Registrasi
router.post('/register', register);

// Rute untuk Login
router.post('/login', login);

// Rute untuk mengambil profil pengguna
router.get('/profile', authenticate, getUserProfile);

// Rute untuk memperbarui profil pengguna
router.put('/profile', authenticate, updateUserProfile);

module.exports = router;