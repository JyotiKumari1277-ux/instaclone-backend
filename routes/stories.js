const express = require("express");
const Story = require("../models/Story");
const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");
const protect = require("../middleware/auth");
const { uploadPost } = require("../config/cloudinary");

const router = express.Router();

// @route   POST /api/stories  (upload a new story)
router.post("/", protect, uploadPost.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const newStory = await Story.create({
      user: req.user.id,
      image: req.file.path,
    });

    const populatedStory = await newStory.populate(
      "user",
      "name username avatar"
    );

    res.status(201).json(populatedStory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/stories/from-post/:postId  (add an existing post to your story)
router.post("/from-post/:postId", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newStory = await Story.create({
      user: req.user.id,
      image: post.image,
      sourcePost: post._id,
    });

    const populatedStory = await newStory.populate([
      { path: "user", select: "name username avatar" },
      { path: "sourcePost", select: "image caption user" },
    ]);

    res.status(201).json(populatedStory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/stories  (get all active stories, grouped by user)
router.get("/", protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    const userIds = [...currentUser.following, req.user.id];

    const stories = await Story.find({ user: { $in: userIds } })
      .populate("user", "name username avatar")
      .populate({
        path: "sourcePost",
        select: "image caption user",
        populate: { path: "user", select: "username avatar" },
      })
      .sort({ createdAt: -1 });

    const grouped = {};
    stories.forEach((story) => {
      const uid = story.user._id.toString();
      if (!grouped[uid]) {
        grouped[uid] = {
          user: story.user,
          stories: [],
        };
      }
      grouped[uid].stories.push(story);
    });

    res.status(200).json(Object.values(grouped));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   PUT /api/stories/:id/view  (mark story as viewed)
router.put("/:id/view", protect, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    if (!story.viewers.includes(req.user.id)) {
      story.viewers.push(req.user.id);
      await story.save();
    }

    res.status(200).json({ message: "Marked as viewed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/stories/:id/viewers  (get viewers + likes list - owner only)
router.get("/:id/viewers", protect, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate("viewers", "name username avatar")
      .populate("likes", "name username avatar");

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    if (story.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const likedIds = new Set(story.likes.map((u) => u._id.toString()));

    const viewersList = story.viewers.map((u) => ({
      ...u.toObject(),
      liked: likedIds.has(u._id.toString()),
    }));

    res.status(200).json({
      viewCount: story.viewers.length,
      likeCount: story.likes.length,
      viewers: viewersList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   PUT /api/stories/:id/like  (toggle like/unlike on a story)
router.put("/:id/like", protect, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    const alreadyLiked = story.likes.includes(req.user.id);

    if (alreadyLiked) {
      story.likes = story.likes.filter(
        (userId) => userId.toString() !== req.user.id
      );
    } else {
      story.likes.push(req.user.id);

      if (story.user.toString() !== req.user.id) {
        const notification = await Notification.create({
          recipient: story.user,
          sender: req.user.id,
          type: "story_like",
          story: story._id,
        });

        const populatedNotif = await notification.populate(
          "sender",
          "name username avatar"
        );

        const io = req.app.get("io");
        io.to(story.user.toString()).emit("newNotification", populatedNotif);
      }
    }

    await story.save();

    res.status(200).json({
      likesCount: story.likes.length,
      liked: !alreadyLiked,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   DELETE /api/stories/:id  (delete own story)
router.delete("/:id", protect, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    if (story.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await story.deleteOne();
    res.status(200).json({ message: "Story deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;