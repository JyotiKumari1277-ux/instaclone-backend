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