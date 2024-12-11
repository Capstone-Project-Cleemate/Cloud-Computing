const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword , updatePassword} = require('firebase/auth');
const { getFirestore, doc, setDoc, getDoc, updateDoc } = require('firebase/firestore');

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
const db = getFirestore(app);

exports.register = async (req, res) => {
    console.log(req.body);
    const { name, email, password } = req.body;
    

    if (!name || !email || !password || password.length < 8) {
        return res.status(400).json({ error: true, message: "Invalid input" });
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;

        await setDoc(doc(db, 'users', userId), {
            name: name,
            email: email,
            createdAt: new Date()
        });

        res.status(201).json({ error: false, message: 'User  Created' });
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

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        res.json({
            error: false,
            message: "success",
            loginResult: {
                userId: user.uid,
                name: userData.name || "User ",
                token: token
            }
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(401).json({ error: true, message: error.message });
    }
};

exports.getUserProfile = async (req, res) => {
    const userId = req.user.uid; 

    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
            return res.status(404).json({ error: true, message: "User  not found." });
        }

        const userData = userDoc.data();
        res.json({
            error: false,
            user: {
                id: userId,
                name: userData.name,
                email: userData.email,
                createdAt: userData.createdAt
            }
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: true, message: "Error fetching user profile." });
    }
};

exports.updateUserProfile = async (req, res) => {
    const userId = req.user.uid; 
    const { name, email, password } = req.body; 

    const auth = getAuth(); 

    try {
        if (name && typeof name !== 'string') {
            return res.status(400).json({ error: true, message: "Name must be a string." });
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: true, message: "Invalid email format." });
        }

        if (password && password.length < 8) {
            return res.status(400).json({ error: true, message: "Password must be at least 8 characters long." });
        }

        const updates = {};

        if (name) {
            updates.name = name;
        }
        if (email) {
            updates.email = email;
        }

        if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, 'users', userId), updates);
        }

        if (password) {
            const user = auth.currentUser ; 
            if (user) {
                await updatePassword(user, password); 
            } else {
                return res.status(401).json({ error: true, message: "User  not authenticated." });
            }
        }

        res.json({ error: false, message: "Profile updated successfully." });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: true, message: "Error updating user profile." });
    }
};