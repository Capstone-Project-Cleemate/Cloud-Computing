// routes/protectedRoutes.js
const express = require('express');
const { verifyToken } = require('../controllers/authController');
const router = express.Router();

router.get('/protected', verifyToken, (req, res) => {
    res.send(`Hello ${req.user.email}, you have access to this protected route!`);
});

module.exports = router;