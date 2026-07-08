const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");
const protect = require("../middleware/auth");
const { uploadPost } = require("../config/cloudinary");

const router = express.Router();

// @route   POST /api/posts  (create a post)
router.post("/", protect, uploadPost.single("image"), async (req, res) => {
  try {
    const { caption } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const newPost = await Post.create({
      user: req.user.id,
      image: req.file.path, // Cloudinary URL
      caption: caption || "",
    });

    const populatedPost = await newPost.populate(
      "user",
      "name username avatar"
    );

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/posts  (feed - all posts, newest first)
router.get("/", protect, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name username avatar")
      .populate("comments.user", "name username avatar")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   PUT /api/posts/:id/like  (toggle like/unlike)
router.put("/:id/like", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadyLiked = post.likes.includes(req.user.id);

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (userId) => userId.toString() !== req.user.id
      );
    } else {
      post.likes.push(req.user.id);
    }

    await post.save();

    res.status(200).json({
      likesCount: post.likes.length,
      liked: !alreadyLiked,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/posts/:id/comment  (add a comment)
router.post("/:id/comment", protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({ user: req.user.id, text });
    await post.save();

    const populatedPost = await post.populate(
      "comments.user",
      "name username avatar"
    );

    res.status(201).json(populatedPost.comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   DELETE /api/posts/:postId/comment/:commentId  (delete own comment)
router.delete("/:postId/comment/:commentId", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    comment.deleteOne();
    await post.save();

    const populatedPost = await post.populate(
      "comments.user",
      "name username avatar"
    );

    res.status(200).json(populatedPost.comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   PUT /api/posts/:id/save  (toggle save/unsave bookmark)
router.put("/:id/save", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const postId = req.params.id;

    const alreadySaved = user.savedPosts.includes(postId);

    if (alreadySaved) {
      user.savedPosts = user.savedPosts.filter(
        (id) => id.toString() !== postId
      );
    } else {
      user.savedPosts.push(postId);
    }

    await user.save();

    res.status(200).json({
      saved: !alreadySaved,
      savedPosts: user.savedPosts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   DELETE /api/posts/:id  (delete own post)
router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await post.deleteOne();
    res.status(200).json({ message: "Post deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;