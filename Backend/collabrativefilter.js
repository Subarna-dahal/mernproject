
const UserUser = (userData, userId, destination) => {
  const reader = new Reader({ line_protocol: 'user item rating', skip_lines: 1 });
  const data = new Dataset.loadFromCSV('C:/Users/subar/OneDrive/Desktop/project.csv', { reader, skipEmptyLines: true, header: true });

  // Filter data based on destination and user
  const filteredData = userData.filter(row => row.user === userId && row.destination === destination);

  const sim_options = {
    name: 'cosine',
    user_based: true,
  };

  const algo = new KNNWithZScore(sim_options);

  // Assuming you have modified your dataset structure to include destination
  algo.fit(data.build_full_trainset());

  const recommendations = [];

  const userItems = data.df['item'].unique();
  userItems.forEach(item => {
    const prediction = algo.predict(userId, item);
    recommendations.push({ user: prediction.uid, item: prediction.iid, rating: prediction.est });
  });

  return recommendations;
};

module.exports = { UserUser };
