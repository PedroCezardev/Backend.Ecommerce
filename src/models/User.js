const mongoose = require("../../config/db");

const User = mongoose.model('User', {
  name: {
    type: String, 
  }, 
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  cartData: {
    type: Object,
  },
  date: {
    type: Date,
    default: Date.now,
  }
});

module.exports = User;