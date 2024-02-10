
const express = require('express');
const csv = require('csv-parser');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');
// const ConnectDB=require('./connectdb/database');
// const User =require('./connectdb/Userprofile');
const app = express();
const port = 3001;
app.use(cors());
app.use(express.json());
//const { getRecommendations } = require('./recomaded.js');
let userData = [];
//ConnectDB()
const processCSV = async () => {
  try {
    const responseStream = fs.createReadStream('C:/Users/subar/OneDrive/Desktop/Project.csv').pipe(csv());

    for await (const row of responseStream) {
      row.latitude = parseFloat(row.latitude);
      row.longitude = parseFloat(row.longitude);

      const geocodeResponse = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
        params: {
          key: '2f1d27a18b7247cda3f24ae65f4a475d',
          q: row.address,
        },
      });

      const { results } = geocodeResponse.data;

      if (results.length > 0) {
        const { lat, lng } = results[0].geometry;
        row.latitude = lat;
        row.longitude = lng;
      } else {
        console.error(`No results found for geocoding address: ${row.address}`);
      }

      userData.push(row);
    }

    console.log('CSV file successfully processed');
  } catch (error) {
    console.error('Error processing CSV:', error);
  }
};

processCSV();
// app.get('/ai/recommend', async (req, res) => {
//   try {
//     const userId = parseInt(req.query.userId);
//     const recommendations = await recommendationModule.getRecommendations(userId);
//     res.json(recommendations);
//   } catch (error) {
//     console.error('Error in AI operations:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });


app.get('/users', (req, res) => {
  res.json(userData);
});

app.get('/geocode', async (req, res) => {
  const { location } = req.query;

  try {
    const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
      params: {
        key: '2f1d27a18b7247cda3f24ae65f4a475d',
        q: location,
      },
    });

    const { results } = response.data;

    if (results.length > 0) {
      const { lat, lng } = results[0].geometry;
      res.json({ latitude: lat, longitude: lng });
    } else {
      console.error('No results found for the provided location.');
      res.status(404).json({ error: 'Location not found' });
    }
  } catch (error) {
    console.error('Error fetching location coordinates:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.get('/users/search', (req, res) => {
  try {
    const { destination, location } = req.query;
    
    const { latitude, longitude } = JSON.parse(location || '{}'); 

    const destinationFilteredUsers = userData.filter(user =>
      user.destination_name && user.destination_name.toLowerCase().includes(destination.toLowerCase())
    );

    if (destinationFilteredUsers.length === 0) {
      res.json([]);
      return;
    }

    // Find the nearest location based on address proximity
    const nearestLocation = findNearestLocation(destinationFilteredUsers, latitude, longitude);

    // Filter users based on the nearest location
    const filteredUsers = destinationFilteredUsers.filter(user =>
      // Check if latitude and longitude are within a small range of the nearest location
      Math.abs(user.latitude - nearestLocation.latitude) < 0.0001 &&
      Math.abs(user.longitude - nearestLocation.longitude) < 0.0001
    );

    res.json(filteredUsers);
  } catch (error) {
    console.error('Error searching users:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




function findNearestLocation(locations, targetLatitude, targetLongitude) {
  return locations.reduce((nearest, current) => {
    const distanceToCurrent = calculateDistance(targetLatitude, targetLongitude, current.latitude, current.longitude);
    const distanceToNearest = calculateDistance(targetLatitude, targetLongitude, nearest.latitude, nearest.longitude);

    return distanceToCurrent < distanceToNearest ? current : nearest;
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
// app.post('/userdata', async (req, res) => {
//   const formData = req.body;

//   try {
//     let user = await User.findOne({ username: formData.username });

//     if (!user) {
//       user = new User(formData);
//     } else {
//       // Update existing user's preferences
//       user.address = formData.address;
//       user.gender = formData.gender;
//       user.destination_name = formData.currentLocation; // Assuming you want to update currentLocation
//       // You may want to handle updating destinationRatings similarly
//     }

//     await user.save();
//     res.status(200).json({ message: 'Preferences updated successfully' });
//   } catch (error) {
//     console.error('Error updating preferences:', error.message);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

app.listen(port, () => {
  console.log(`Server listening at http://127.0.0.1:${port}`);
});
