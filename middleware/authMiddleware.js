
const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.applicationDefault() 
});

exports.authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: true, message: "Unauthorized" });
    }

    try {
        const user = await admin.auth().verifyIdToken(token);
        req.user = user; 
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ error: true, message: "Unauthorized" });
    }
};