const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

// No direct tasks array here, tasks are linked via Task model

module.exports = mongoose.model('User', UserSchema);
