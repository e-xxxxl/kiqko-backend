// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const cloudinary = require('../cloudinary'); 
// const Message = require('../models/Message');
// const User = require('../models/User')

// // Add this route to your messageRoutes.js file
// const mongoose = require('mongoose');

// // Multer memory storage
// const storage = multer.memoryStorage();
// const upload = multer({ storage });
// const { onlineUsers, userLastSeen } = require('../index'); // Import from index.js

// // GET messages between two users
// router.get('/:userId1/:userId2', async (req, res) => {
//   const { userId1, userId2 } = req.params;
//   try {
//     const messages = await Message.find({
//       $or: [
//         { sender: userId1, receiver: userId2 },
//         { sender: userId2, receiver: userId1 },
//       ]
//     }).sort({ timestamp: 1 });

//     res.json(messages);
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // POST image upload
// router.post('/upload', upload.single('file'), async (req, res) => {
//   try {
//     const stream = cloudinary.uploader.upload_stream(
//       { resource_type: 'auto' },
//       (error, result) => {
//         if (error) {
//           console.error('Cloudinary Error:', error);
//           console.log("Cloudinary Upload Result:", result);

//           return res.status(500).json({ error: 'Upload failed' });
//         }
//         res.json({ url: result.secure_url });
//       }
//     );

//     stream.end(req.file.buffer);
//   } catch (err) {
//     console.error('Upload error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });


// router.get('/conversations/:userId', async (req, res) => {
//   const { userId } = req.params;
//   console.log(`Fetching conversations for userId: ${userId}`); // Debug log
//   try {
//     // Validate ObjectId
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       console.log(`Invalid userId: ${userId}`);
//       return res.status(400).json({ message: 'Invalid user ID' });
//     }

//     console.log('onlineUsers:', Array.from(onlineUsers.keys())); // Debug log
//     console.log('userLastSeen:', Array.from(userLastSeen.entries())); // Debug log

//     const conversations = await Message.aggregate([
//       {
//         $match: {
//           $or: [
//             { sender: new mongoose.Types.ObjectId(userId) },
//             { receiver: new mongoose.Types.ObjectId(userId) },
//           ],
//         },
//       },
//       {
//         $sort: { timestamp: -1 },
//       },
//       {
//         $group: {
//           _id: {
//             $cond: [
//               { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
//               "$receiver",
//               "$sender",
//             ],
//           },
//           lastMessage: { $first: "$$ROOT" },
//         },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "_id",
//           foreignField: "_id",
//           as: "user",
//         },
//       },
//       {
//         $unwind: {
//           path: "$user",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $project: {
//           user: {
//             _id: 1,
//             username: 1,
//             profilephoto: 1,
//           },
//           lastMessage: {
//             text: 1,
//             attachment: 1,
//             timestamp: 1,
//           },
//           isOnline: {
//             $cond: {
//               if: {
//                 $and: [
//                   {
//                     $in: [
//                       { $toString: "$_id" },
//                       Array.from(onlineUsers.keys()).map(id => id.toString()),
//                     ],
//                   },
//                   {
//                     $eq: [
//                       {
//                         $arrayElemAt: [
//                           Array.from(userLastSeen.entries())
//                             .filter(([id]) => id.toString() === "$_id.toString()")
//                             .map(([, lastSeen]) => lastSeen),
//                           0,
//                         ],
//                       },
//                       null,
//                     ],
//                   },
//                 ],
//               },
//               then: true,
//               else: false,
//             },
//           },
//         },
//       },
//       {
//         $sort: { "lastMessage.timestamp": -1 },
//       },
//     ]);

//     console.log(`Found ${conversations.length} conversations`); // Debug log
//     res.json(conversations);
//   } catch (err) {
//     console.error('Error fetching conversations:', err.stack); // Full stack trace
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// });
// module.exports = router;





const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../cloudinary');
const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

// Getter function to access onlineUsers safely
const getSocketData = () => {
  const index = require('../index');
  return {
    onlineUsers: index.onlineUsers || new Map(),
    userLastSeen: index.userLastSeen || new Map(),
  };
};

const storage = multer.memoryStorage();
const upload = multer({ storage });

// GET conversations for a user
router.get('/conversations/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log(`Fetching conversations for userId: ${userId}`);

  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log(`Invalid userId: ${userId}`);
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Get socket data
    const { onlineUsers, userLastSeen } = getSocketData();

    // Debug logs
    console.log('onlineUsers defined:', !!onlineUsers);
    console.log('onlineUsers keys:', Array.from(onlineUsers.keys()));
    console.log('userLastSeen defined:', !!userLastSeen);
    console.log('userLastSeen entries:', Array.from(userLastSeen.entries()));

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { receiver: new mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
              "$receiver",
              "$sender",
            ],
          },
          lastMessage: { $first: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          user: {
            _id: 1,
            username: { $ifNull: ["$user.username", "Unknown User"] },
            profilephoto: { $ifNull: ["$user.profilephoto", null] },
          },
          lastMessage: {
            text: { $ifNull: ["$lastMessage.text", ""] },
            attachment: { $ifNull: ["$lastMessage.attachment", null] },
            timestamp: "$lastMessage.timestamp",
          },
          isOnline: {
            $cond: {
              if: { $eq: [{ $toString: "$_id" }, userId] },
              then: onlineUsers.has(userId),
              else: onlineUsers.has({ $toString: "$_id" }) || false,
            },
          },
        },
      },
      {
        $sort: { "lastMessage.timestamp": -1 },
      },
    ]).catch((aggErr) => {
      console.error('Aggregation error:', aggErr.stack);
      throw aggErr;
    });

    console.log(`Found ${conversations.length} conversations`);
    res.json(conversations);
  } catch (err) {
    console.error('Error fetching conversations:', err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET messages between two users
router.get('/:userId1/:userId2', async (req, res) => {
  const { userId1, userId2 } = req.params;
  console.log(`Fetching messages between ${userId1} and ${userId2}`);

  try {
    if (!mongoose.Types.ObjectId.isValid(userId1) || !mongoose.Types.ObjectId.isValid(userId2)) {
      console.log(`Invalid user IDs: ${userId1}, ${userId2}`);
      return res.status(400).json({ message: 'Invalid user IDs' });
    }

    const messages = await Message.find({
      $or: [
        { sender: userId1, receiver: userId2 },
        { sender: userId2, receiver: userId1 },
      ],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST image upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary error:', error);
          return res.status(500).json({ message: 'Upload failed', error });
        }
        res.json({ url: result.secure_url });
      }
    );
    stream.end(req.file.buffer);
  } catch (err) {
    console.error('Upload error:', err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;