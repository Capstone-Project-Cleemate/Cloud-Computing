// controllers/authController.js
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 8) {
        return res.status(400).json({ error: true, message: "Invalid input" });
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        res.status(201).json({ error: false, message: 'User  Created', userId: userCredential.user.uid });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(400).json({ error: true, message: error.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: true, message: "Invalid input" });
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const token = await user.getIdToken();
        res.json({
            error: false,
            message: "success",
            loginResult: {
                userId: user.uid,
                name: user.displayName || "User ", 
                token: token
            }
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(401).json({ error: true, message: error.message });
    }
};