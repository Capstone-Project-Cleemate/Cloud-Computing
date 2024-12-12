const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const csv = require('csv-parser');
const https = require('https');
const tf = require('@tensorflow/tfjs-node');
const Fuse = require('fuse.js');
const fileName = 'base.csv';

const storage = new Storage();
const bucketName = process.env.BUCKET_NAME;

let model;

const loadModel = async () => {
    model = await tf.loadLayersModel('https://storage.googleapis.com/cleemate-bucket/model.json');
};

loadModel().then(() => {
    console.log("Model loaded successfully");
}).catch(err => {
    console.error("Error loading model:", err);
});

exports.predictExtremeFluctuation = async (req, res) => {
    const {
        temp_change,
        wind_speed_change,
        humidity_change,
    } = req.body;

    if ([temp_change, wind_speed_change, humidity_change].some(value => value === null || value === undefined)) {
        return res.status(400).json({ message: "Data tidak lengkap." });
    }

    const inputFeatures = [
        0,
        0, 
        0, 
        temp_change,
        wind_speed_change,
        humidity_change,
        0,
        0,
        0,
        0,
        0, 
        0, 
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0 
    ];

    const expectedFeatures = 22; 
    if (inputFeatures.length !== expectedFeatures) {
        return res.status(400).json({
            message: `Jumlah fitur input tidak sesuai. Diharapkan ${expectedFeatures} fitur, tetapi mendapatkan ${inputFeatures.length}.`
        });
    }

    try {
        const inputData = tf.tensor2d([inputFeatures]);

        const prediction = model.predict(inputData);
        const predictedValue = prediction.dataSync()[0]; 

        const resultMessage = (
            Math.abs(temp_change) > 5 || 
            Math.abs(wind_speed_change) > 10 || 
            Math.abs(humidity_change) > 10 ||
            predictedValue < 0.2
        ) ? "Terdapat fluktuasi ekstrem." : "Tidak terdapat fluktuasi ekstrem.";
        
        return res.json({ hasil: resultMessage });
    } catch (error) {
        console.error("Error during prediction:", error);
        return res.status(500).json({ message: "Terjadi kesalahan saat melakukan prediksi." });
    }
};

exports.getPredictedWeather = async (req, res) => {
  const latitude = parseFloat(req.params.latitude);
  const longitude = parseFloat(req.params.longitude);
  const apiKey = 'AIzaSyDxeY9AMwraG4z0FavHoLCpSHPK5P2fxZI';

  console.log(`Mencari kecamatan untuk koordinat: Latitude = ${latitude}, Longitude = ${longitude}`);

  const options = {
    method: 'GET',
    hostname: 'maps.googleapis.com',
    path: `/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`,
    port: 443,
  };

  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(data);
        });
      });

      req.on('error', (error) => {
        console.error('Error saat mengirim permintaan ke Google Maps API:', error);
        reject(error);
      });

      req.end();
    });

    const jsonData = JSON.parse(response);

    if (jsonData.results && jsonData.results.length > 0) {
      let kecamatan = null;

      for (let component of jsonData.results[0].address_components) {
        if (component.types.includes('sublocality_level_3')) {
          kecamatan = component.long_name;
          break;
        }
      }

      if (!kecamatan) {
        for (let component of jsonData.results[0].address_components) {
          if (component.types.includes('administrative_area_level_4')) {
            kecamatan = component.long_name;
            break;
          }
        }
      }

      if (kecamatan) {
        const normalizedKecamatanName = kecamatan.replace('Kota ', '').toLowerCase();

        // Mengambil data CSV dari Google Cloud Storage
        const csvData = [];
        const file = storage.bucket(bucketName).file(fileName);

        const readStream = file.createReadStream();
        readStream.pipe(csv())
          .on('data', (data) => {
            csvData.push(data);
          })
          .on('end', async () => {
            const fuseOptions = {
              keys: [Object.keys(csvData[0])[1]],
              threshold: 0.1,
              includeScore: true,
            };

            const fuse = new Fuse(csvData, fuseOptions);
            const matchedKecamatan = fuse.search(normalizedKecamatanName);

            if (matchedKecamatan.length > 0) {
              const closestMatch = matchedKecamatan[0].item;
              const kodeWilayah = closestMatch['11'];
              const weatherOptions = {
                method: 'GET',
                hostname: 'api.bmkg.go.id',
                path: `/publik/prakiraan-cuaca?adm4=${kodeWilayah}`,
                port: 443,
              };

              try {
                const weatherResponse = await new Promise((resolve, reject) => {
                  const req = https.request(weatherOptions, (res) => {
                    let data = '';
                    res.on('data', (chunk) => {
                      data += chunk;
                    });
                    res.on('end', () => {
                      resolve(data);
                    });
                  });

                  req.on('error', (error) => {
                    reject(error);
                  });

                  req.end();
                });

                const weatherData = JSON.parse(weatherResponse);

                if (weatherData.data && weatherData.data.length > 0) {
                  const cuaca = weatherData.data[0];

                  const temp = cuaca['t']; 
                  const humidity = cuaca['hu']; 
                  const windSpeed = cuaca['ws'];

                  const temp_change = Math.abs(temp - req.body.temp_change);
                  const wind_speed_change = Math.abs(windSpeed - req.body.wind_speed_change);
                  const humidity_change = Math.abs(humidity - req.body.humidity_change);

                  const inputFeatures = [
                    0, 0, 0, temp_change, wind_speed_change, humidity_change, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                  ];

                  const expectedFeatures = 22;
                  if (inputFeatures.length !== expectedFeatures) {
                    return res.status(400).json({
                      message: `Jumlah fitur input tidak sesuai. Diharapkan ${expectedFeatures} fitur, tetapi mendapatkan ${inputFeatures.length}.`
                    });
                  }

                  try {
                    const inputData = tf.tensor2d([inputFeatures]);
                    const prediction = model.predict(inputData);
                    const predictedValue = prediction.dataSync()[0];

                    const resultMessage = (
                      Math.abs(temp_change) > 5 || 
                      Math.abs(wind_speed_change) > 10 || 
                      Math.abs(humidity_change) > 10 ||
                      predictedValue < 0.2
                    ) ? "Terdapat fluktuasi ekstrem." : "Tidak terdapat fluktuasi ekstrem.";

                    let diseases = [];
                    let suggestions = [];

                    if (resultMessage === "Terdapat fluktuasi ekstrem.") {
                      if (Math.abs(temp_change) > 5) {
                        diseases.push("Flu atau Pilek");
                        suggestions.push("Perbanyak konsumsi vitamin C dan jaga kebersihan.");
                      }
                      if (humidity_change > 10) {
                        diseases.push("Demam Berdarah");
                        diseases.push("Infeksi Saluran Pernapasan Akut (ISPA)");
                        diseases.push("Penyakit Kulit");
                        diseases.push("Tifus");
                        suggestions.push("Pastikan lingkungan bersih dan bebas genangan air.");
                      }
                      if (wind_speed_change > 10) {
                        diseases.push("Asma");
                        diseases.push("Alergi");
                        suggestions.push("Hindari aktivitas di luar ruangan saat cuaca buruk.");
                      }
                    } else {
                      diseases.push("Kondisi cuaca stabil, risiko penyakit rendah.");
                      suggestions.push("Tetap jaga pola hidup sehat dan konsumsi makanan bergizi.");
                    }

                    return res.json({
                      resultMessage,
                      diseases, 
                      suggestions, 
                      kecamatan,
                      cuaca
                    });
                  } catch (error) {
                    console.error("Error during prediction:", error);
                    return res.status(500).json({ message: "Terjadi kesalahan saat melakukan prediksi." });
                  }
                } else {
                  return res.status(404).json({
                    message: "Data cuaca tidak ditemukan untuk kode wilayah ini.",
                  });
                }
              } catch (weatherError) {
                console.error("Error saat mengambil data cuaca:", weatherError);
                return res.status(500).json({ message: "Gagal mengambil data cuaca." });
              }
            } else {
              return res.status(404).json({ message: "Kode wilayah tidak ditemukan di CSV." });
            }
          })
          .on('error', (error) => {
            console.error('Terjadi kesalahan saat membaca file CSV dari GCS:', error);
            return res.status(500).json({ message: "Gagal membaca file CSV dari GCS." });
          });
      } else {
        return res.status(404).json({ message: "Kecamatan tidak ditemukan dalam data Google Maps." });
      }
    } else {
      return res.status(404).json({ message: "Data kecamatan tidak ditemukan untuk koordinat ini." });
    }
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    return res.status(500).json({ message: "Terjadi kesalahan saat mengambil data kecamatan." });
  }
};

