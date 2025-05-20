const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); // ✅ Import userRoutes
// const profileRouter = require('./routes/profile');
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend origin
  credentials: true,               // Allow cookies/auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Best practice to explicitly list allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Best practice to explicitly list allowed headers
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // ✅ Add this line
// Make sure to import and use the profile routes



// DB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

module.exports = app;
