const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');  // Correct the import here
const authRoutes = require('./routes/auth');  // Import auth routes

const app = express();
const PORT = 5006;

// Middleware
app.use(cors()); 
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/task_manager', {
  // No need for useNewUrlParser or useUnifiedTopology
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

// Routes
app.use('/api/users', userRoutes);  // Use the userRoutes here
app.use('/api', authRoutes);  // Register auth routes directly under /api

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
