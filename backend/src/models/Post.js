const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true
    },
    content: {
      type: String
    },
    image: {
      type: String
    },
    images: [
      {
        type: String
      }
    ],
    video: {
      type: String
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorName: {
      type: String
    },
    authorPhoto: {
      type: String
    },
    authorRole: {
      type: String,
      default: 'Alumni'
    },
    authorCompany: {
      type: String
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    comments: [
      {
        id: String,
        text: String,
        content: String,
        authorId: mongoose.Schema.Types.ObjectId,
        authorName: String,
        authorPhoto: String,
        createdAt: { type: Date, default: Date.now },
        likes: []
      }
    ],
    shares: {
      type: Number,
      default: 0
    },
    saves: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    tags: [String],
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: 'posts'
  }
);

// Index for efficient sorting
postSchema.index({ createdAt: -1 });
postSchema.index({ authorId: 1 });

module.exports = mongoose.model('Post', postSchema);
