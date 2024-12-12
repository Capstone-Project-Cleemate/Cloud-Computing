require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const recommendationRoutes = require('./routes/recommendationRoutes');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const port = process.env.PORT || 8080; 

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: "Selamat datang di API Cuaca dan Kesehatan!" });
});

app.use('/health', healthRoutes);
app.use('/weather', recommendationRoutes);
app.use('/api', authRoutes);


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
