const mongoose = require("mongoose");

const registrationOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    passwordHash: { type: String, required: true, select: false },
    codeHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    lastSentAt: { type: Date, required: true },
    attempts: { type: Number, default: 0, min: 0, max: 5 },
  },
  { timestamps: true },
);

registrationOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RegistrationOtp", registrationOtpSchema);
