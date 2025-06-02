// 






const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();

app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
}));

app.use(express.json());
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// 404 handler
app.use((req, res) => {
  console.log(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;