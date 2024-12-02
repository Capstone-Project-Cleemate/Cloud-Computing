require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const recommendationRoutes = require('./routes/recommendationRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const port = process.env.PORT || 3000; 

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: "Selamat datang di API Cuaca dan Kesehatan!" });
});

app.use('/cuaca', recommendationRoutes);
app.use('/api/auth', authRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});