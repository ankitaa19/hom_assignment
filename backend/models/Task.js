const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  text: { type: String, required: true },
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'low' },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  timestamp: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});


module.exports = mongoose.model('Task', TaskSchema);
