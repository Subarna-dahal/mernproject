const express = require('express');
const csv = require('csv-parser');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

let userData = [];

// Read data from CSV file and geocode addresses
fs.createReadStream('C:/Users/subar/OneDrive/Desktop/project.csv')
  .pipe(csv())
  .on('data', async (row) => {
    // Convert latitude and longitude to numbers for numerical comparison
    row.latitude = parseFloat(row.latitude);
    row.longitude = parseFloat(row.longitude);

    // Geocode the address to get latitude and longitude
    const geocodeResponse = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
      params: {
        key: '2f1d27a18b7247cda3f24ae65f4a475d', // Replace with your actual API key
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
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  });

// Endpoint to serve user data with geocoded locations
app.get('/users', (req, res) => {
  res.json(userData);
});

// Endpoint for geocoding user-provided locations
app.get('/geocode', async (req, res) => {
  const { location } = req.query;

  try {
    const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
      params: {
        key: '2f1d27a18b7247cda3f24ae65f4a475d', // Replace with your actual API key
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

// Endpoint to serve filtered user data based on destination and coordinates
app.get('/users/search', (req, res) => {
  try {
    const { destination, coordinates } = req.query;
    const { latitude, longitude } = JSON.parse(coordinates);

    // Filter users based on destination
    const destinationFilteredUsers = userData.filter(user =>
      user.destination_name && user.destination_name.toLowerCase().includes(destination.toLowerCase())
    );

    if (destinationFilteredUsers.length === 0) {
      res.json([]);
      return;
    }

    // Find the nearest location based on coordinates
    const nearestLocation = findNearestLocation(destinationFilteredUsers, latitude, longitude);

    // Filter users based on the nearest location
    const filteredUsers = destinationFilteredUsers.filter(user =>
      user.latitude === nearestLocation.latitude && user.longitude === nearestLocation.longitude
    );

    res.json(filteredUsers);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Function to find the nearest location based on coordinates
function findNearestLocation(locations, targetLatitude, targetLongitude) {
  return locations.reduce((nearest, current) => {
    const distanceToCurrent = calculateDistance(targetLatitude, targetLongitude, current.latitude, current.longitude);
    const distanceToNearest = calculateDistance(targetLatitude, targetLongitude, nearest.latitude, nearest.longitude);

    return distanceToCurrent < distanceToNearest ? current : nearest;
  });
}

// Function to calculate distance between two sets of latitude and longitude coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);  // deg2rad below
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

app.listen(port, () => {
  console.log(`Server listening at http://127.0.0.1:${port}`);
});
