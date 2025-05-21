const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

router.get('/:userId1/:userId2', async (req, res) => {
  const { userId1, userId2 } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { sender: userId1, receiver: userId2 },
        { sender: userId2, receiver: userId1 },
      ]
    }).sort({ timestamp: 1 }); // sort by oldest first

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
