const express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const protect = require("../middleware/auth");
const { uploadAvatar } = require("../config/cloudinary");

const router = express.Router();

// @route   GET /api/users/:id  (profile info + their posts)
router.get("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const posts = await Post.find({ user: req.params.id })
      .populate("user", "name username avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        isFollowing: user.followers.includes(req.user.id),
      },
      posts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   PUT /api/users/:id/follow  (toggle follow/unfollow)
router.put("/:id/follow", protect, async (req, res) => {
  try {
    const targetId = req.params.id;

    if (targetId === req.user.id) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const targetUser = await User.findById(targetId);
    const currentUser = await User.findById(req.user.id);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyFollowing = targetUser.followers.includes(req.user.id);

    if (alreadyFollowing) {
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== req.user.id
      );
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetId
      );
    } else {
      targetUser.followers.push(req.user.id);
      currentUser.following.push(targetId);
    }

    await targetUser.save();
    await currentUser.save();

    res.status(200).json({
      following: !alreadyFollowing,
      followersCount: targetUser.followers.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/users/:id/followers  (list of followers)
router.get("/:id/followers", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "followers",
      "name username avatar"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.followers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/users/:id/following  (list of users this user follows)
router.get("/:id/following", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "following",
      "name username avatar"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.following);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/users/me/saved  (get logged-in user's saved posts)
router.get("/me/saved", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "savedPosts",
      populate: { path: "user", select: "name username avatar" },
    });

    res.status(200).json(user.savedPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   PUT /api/users/me/update  (update profile: bio + avatar)
router.put(
  "/me/update",
  protect,
  uploadAvatar.single("avatar"),
  async (req, res) => {
    try {
      const { name, bio } = req.body;
      const updateData = {};

      if (name) updateData.name = name;
      if (bio !== undefined) updateData.bio = bio;
      if (req.file) updateData.avatar = req.file.path;

      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        updateData,
        { new: true }
      ).select("-password");

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

module.exports = router;