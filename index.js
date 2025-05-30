// const http = require('http');
// const app = require('./app');
// const { Server } = require('socket.io');
// const mongoose = require('mongoose');
// const Message = require('./models/Message'); // import your Message model

// const PORT = process.env.PORT || 5000;

// // Create raw HTTP server
// const server = http.createServer(app);

// // Set up Socket.IO server
// const io = new Server(server, {
//   cors: {
//     origin: "*", // Allow all origins
//     methods: ["GET", "POST"],
//     credentials: false, // Must be false if origin is "*"
//   },
// });

// // Track online users and their last seen timestamps
// const onlineUsers = new Map();  // userId -> socketId
// const userLastSeen = new Map(); // userId -> ISO timestamp

// // Map messageId to sender socketId for delivery confirmation
// const messageSenderMap = new Map();

// io.on('connection', (socket) => {
//   console.log('🔌 Client connected:', socket.id);

//  socket.on('register', (userId) => {
//   console.log(`Registering user: ${userId} with socket ${socket.id}`);
//   onlineUsers.set(userId, socket.id);
//   userLastSeen.set(userId, null);
//   console.log('Current onlineUsers:', Array.from(onlineUsers.keys()));
//   io.emit('user_last_seen', { userId, lastSeen: null });
// });

//   // Typing indicator event: relay typing status from sender to receiver
//   socket.on('typing', ({ from, to, typing = true }) => {
//     const receiverSocketId = onlineUsers.get(to);
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit('typing', typing ? from : null);
//     }
//   });

//   socket.on('send_message', async (data) => {
//     console.log('📨 Message from client:', data);

//     try {
//       const message = new Message({
//         sender: new mongoose.Types.ObjectId(data.sender),
//         receiver: new mongoose.Types.ObjectId(data.receiver),
//         text: data.text,
//         timestamp: data.timestamp || new Date(), // Use provided timestamp
//         // optionally add attachment field here if you want
//         attachment: data.attachment || null,
//       });

//       const savedMessage = await message.save();
//       console.log('💾 Message saved:', savedMessage);

//       messageSenderMap.set(savedMessage._id.toString(), socket.id);

//       // Send saved message back to sender
//       socket.emit('receive_message', savedMessage);

//       // Send message to receiver if online
//       const receiverSocketId = onlineUsers.get(data.receiver);
//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit('receive_message', savedMessage);
//       }
//     } catch (err) {
//       console.error('❌ Error saving message:', err);
//     }
//   });

//   // When receiver confirms message was delivered
//   socket.on('message_delivered', (messageId) => {
//     console.log(`✅ Message delivered confirmed for: ${messageId}`);
//     const senderSocketId = messageSenderMap.get(messageId);
//     if (senderSocketId) {
//       io.to(senderSocketId).emit('message_delivered_confirm', messageId);
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log('❌ Client disconnected:', socket.id);
//     const userId = socket.userId;
//     if (userId) {
//       onlineUsers.delete(userId);
//       const now = new Date().toISOString();
//       userLastSeen.set(userId, now);

//       // Broadcast last seen update for disconnected user
//       io.emit('user_last_seen', { userId, lastSeen: now });
//     }
//   });
// });

// // Export for use in routes

// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => {
//   console.log('✅ MongoDB connected');
//   server.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
//   });
// })
// .catch((err) => {
//   console.error('❌ MongoDB connection error:', err);
// });
// module.exports = { io, onlineUsers, userLastSeen, messageSenderMap };




const http = require('http');
const app = require('./app');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Message = require('./models/Message');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5000"],
    methods: ["GET", "POST"],
    credentials: false,
  },
});

// Initialize onlineUsers and userLastSeen
const onlineUsers = new Map();
const userLastSeen = new Map();
const messageSenderMap = new Map();

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('register', (userId) => {
    console.log(`Registering user: ${userId} with socket ${socket.id}`);
    onlineUsers.set(userId, socket.id);
    userLastSeen.set(userId, null);
    console.log('Current onlineUsers:', Array.from(onlineUsers.keys()));
    io.emit('user_last_seen', { userId, lastSeen: null });
  });

  socket.on('typing', ({ from, to, typing = true }) => {
    const receiverSocketId = onlineUsers.get(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing', typing ? from : null);
    }
  });

  socket.on('send_message', async (data) => {
    console.log('📨 Message from client:', data);

    try {
      const message = new Message({
        sender: new mongoose.Types.ObjectId(data.sender),
        receiver: new mongoose.Types.ObjectId(data.receiver),
        text: data.text,
        timestamp: data.timestamp || new Date(),
        attachment: data.attachment || null,
      });

      const savedMessage = await message.save();
      console.log('💾 Message saved:', savedMessage);

      messageSenderMap.set(savedMessage._id.toString(), socket.id);

      socket.emit('receive_message', savedMessage);

      const receiverSocketId = onlineUsers.get(data.receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', savedMessage);
      }
    } catch (err) {
      console.error('❌ Error saving message:', err);
    }
  });

  socket.on('message_delivered', (messageId) => {
    console.log(`✅ Message delivered confirmed for: ${messageId}`);
    const senderSocketId = messageSenderMap.get(messageId);
    if (senderSocketId) {
      io.to(senderSocketId).emit('message_delivered_confirm', messageId);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    const userId = socket.userId;
    if (userId) {
      onlineUsers.delete(userId);
      const now = new Date().toISOString();
      userLastSeen.set(userId, now);
      io.emit('user_last_seen', { userId, lastSeen: now });
    }
  });
});

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

// Export after initialization
module.exports = { io, onlineUsers, userLastSeen, messageSenderMap };