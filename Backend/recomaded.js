// recommendation.js

const { UserBased } = require('surprise');
const csv = require('csv-parser');
const fs = require('fs');

// Load CSV data
const loadData = (filePath) => {
  const data = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      data.push({
        userId: parseInt(row.user_id),
        itemId: row.destination_name,
        rating: parseInt(row.rating),
      });
    })
    .on('end', () => {
      console.log('CSV data loaded successfully.');
    });
  return data;
};

// Sample CSV data file path
const csvFilePath = 'C:/Users/subar/OneDrive/Desktop/Project.csv';

// Load data from CSV
const data = loadData(csvFilePath);

// Create a UserBased instance
const ub = new UserBased(data);

// Function to get recommendations for a user
const getRecommendations = (userId, topN = 5) => {
  const recommendations = ub.recommend(userId, topN);
  return recommendations;
};

module.exports = { getRecommendations };
