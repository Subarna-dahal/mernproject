
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  address: { type: String, required: true },
  gender: { type: String, required: true },
  destination_name: { type: String, required: true },
  
    
});

const User = mongoose.model('User', userSchema);

module.exports = User;
