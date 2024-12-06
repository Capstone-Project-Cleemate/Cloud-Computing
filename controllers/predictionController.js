const tf = require('@tensorflow/tfjs-node');

let model;

const loadModel = async () => {
    model = await tf.loadLayersModel('https://storage.googleapis.com/cleemate-bucket/cleemate-model.h5');
};

loadModel().then(() => {
    console.log("Model loaded successfully.");
}).catch(err => {
    console.error("Error loading model:", err);
});

const predictExtremeFluctuation = async (weatherData) => {
    const {
        humidity,
        temperature,
        windSpeed,
        tempChange = 0,
        windSpeedChange = 0,
        humidityChange = 0,
        tempPreviousDay = 0,
        windSpeedPreviousDay = 0,
        humidityPreviousDay = 0,
        rollingTemp = 0,
        rollingWind = 0,
        rollingHumidity = 0,
        weatherCode = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    } = weatherData;

    const inputTensor = tf.tensor2d([[humidity, temperature, windSpeed, tempChange, windSpeedChange, humidityChange, tempPreviousDay, windSpeedPreviousDay, humidityPreviousDay, rollingTemp, rollingWind, rollingHumidity, ...weatherCode]]);

    const prediction = model.predict(inputTensor);
    const predictedValue = prediction.dataSync()[0] > 0.5 ? 1 : 0;

    return predictedValue;
};

module.exports = {
    predictExtremeFluctuation,
};