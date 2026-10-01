const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    avatar: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ["CUSTOMER", "SELLER", "ADMIN"],
      default: "CUSTOMER",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    sellerStatus: {
      type: String,
      enum: ["NONE", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"],
      default: "NONE",
      index: true,
    },

    sellerApplication: {
      businessName: {
        type: String,
        trim: true,
        maxlength: 150,
      },

      description: {
        type: String,
        maxlength: 2000,
      },

      reason: {
        type: String,
        maxlength: 1000,
      },

      reviewedAt: {
        type: Date,
        default: null,
      },

      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      rejectionReason: {
        type: String,
        maxlength: 1000,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
