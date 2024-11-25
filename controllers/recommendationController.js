const firestore = require('../config/firestore');

exports.addRecommendation = async (req, res) => {
  try {
    const recommendationData = req.body;
    const recommendationRef = await firestore.collection('recommendations').add(recommendationData);
    res.status(201).send(`Recommendation added with ID: ${recommendationRef.id}`);
  } catch (error) {
    console.error('Error adding recommendation: ', error);
    res.status(500).send('Error adding recommendation');
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const recommendationsSnapshot = await firestore.collection('recommendations').get();
    const recommendations = recommendationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations: ', error);
    res.status(500).send('Error fetching recommendations');
  }
};