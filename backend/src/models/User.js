import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxLength: 60,
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
    },
    emailVerified: { type: Boolean, default: true },
    emailVerificationTokenHash: { type: String, select: false, default: null },
    emailVerificationExpiresAt: { type: Date, select: false, default: null },
    passwordResetTokenHash: { type: String, select: false, default: null },
    passwordResetExpiresAt: { type: Date, select: false, default: null },
    profilePic: {
      type: String,
      default: "",
    },
    bio: { type: String, default: "", maxLength: 200, trim: true },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      maxLength: 30,
    },
    lastSeen: { type: Date, default: Date.now },
    status: { type: String, enum: ["online", "offline", "away", "busy"], default: "offline" },
    notificationPrefs: {
      sound: { type: Boolean, default: true },
      desktop: { type: Boolean, default: false },
      messagePreview: { type: Boolean, default: true },
    },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    mutedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }, //createdAt & updatedAt
);

userSchema.index({ fullName: "text", email: "text" });
userSchema.index({ blockedUsers: 1 });

const User = mongoose.model("User", userSchema);

export default User;
