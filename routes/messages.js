const express = require("express");
const Message = require("../models/Message");
const protect = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/messages/conversations  (list of chats with last message)
router.get("/conversations", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "name username avatar")
      .populate("receiver", "name username avatar")
      .sort({ createdAt: -1 });

    const conversationsMap = new Map();

    messages.forEach((msg) => {
      const otherUser =
        msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
      const key = otherUser._id.toString();

      if (!conversationsMap.has(key)) {
        conversationsMap.set(key, {
          user: otherUser,
          lastMessage: msg,
          unreadCount: 0,
        });
      }

      if (msg.receiver._id.toString() === userId && !msg.read) {
        conversationsMap.get(key).unreadCount += 1;
      }
    });

    res.status(200).json(Array.from(conversationsMap.values()));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/messages/:userId  (get full thread with a specific user)
router.get("/:userId", protect, async (req, res) => {
  try {
    const myId = req.user.id;
    const otherId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: otherId },
        { sender: otherId, receiver: myId },
      ],
    })
      .populate("sender", "name username avatar")
      .populate("receiver", "name username avatar")
      .populate("sharedPost", "image caption user")
      .populate("sharedStory", "image user")
      .sort({ createdAt: 1 });

    await Message.updateMany(
      { sender: otherId, receiver: myId, read: false },
      { $set: { read: true } }
    );

    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/messages/:userId  (send a message - text, shared post, or story reply)
router.post("/:userId", protect, async (req, res) => {
  try {
    const { text, sharedPostId, storyId } = req.body;
    const receiverId = req.params.userId;

    if (!text?.trim() && !sharedPostId && !storyId) {
      return res
        .status(400)
        .json({ message: "Message must have text, a shared post, or a story" });
    }

    if (receiverId === req.user.id) {
      return res.status(400).json({ message: "Cannot message yourself" });
    }

    const newMessage = await Message.create({
      sender: req.user.id,
      receiver: receiverId,
      text: text?.trim() || "",
      sharedPost: sharedPostId || undefined,
      sharedStory: storyId || undefined,
    });

    const populatedMessage = await newMessage.populate([
      { path: "sender", select: "name username avatar" },
      { path: "receiver", select: "name username avatar" },
      { path: "sharedPost", select: "image caption user" },
      { path: "sharedStory", select: "image user" },
    ]);

    const io = req.app.get("io");
    io.to(receiverId).emit("newMessage", populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   DELETE /api/messages/:messageId  (unsend a message - sender only)
router.delete("/:messageId", protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only unsend your own messages" });
    }

    const receiverId = message.receiver.toString();

    await message.deleteOne();

    const io = req.app.get("io");
    io.to(receiverId).emit("messageDeleted", { messageId: req.params.messageId });

    res.status(200).json({ message: "Message unsent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;