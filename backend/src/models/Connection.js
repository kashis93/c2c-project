const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Compound index for unique connections
connectionSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });

module.exports = mongoose.model('Connection', connectionSchema);
