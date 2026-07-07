const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
      default: "", // Cloudinary URL
    },
    followers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],
    following: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],
    savedPosts: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
