const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');  
const authRoutes = require('./routes/auth');  

const app = express();
const PORT = 5006;

// Middleware
app.use(cors()); 
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/task_manager', {

})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

// Routes
app.use('/api/users', userRoutes);  
app.use('/api', authRoutes);  

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
