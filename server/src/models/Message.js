const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["TEXT", "IMAGE", "FILE", "PRODUCT", "ORDER"],
      default: "TEXT",
    },

    content: {
      type: String,
      default: "",
    },

    attachmentUrl: {
      type: String,
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

messageSchema.index({
  conversation: 1,
  createdAt: 1,
});

module.exports = mongoose.model("Message", messageSchema);
