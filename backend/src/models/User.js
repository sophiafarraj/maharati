const mongoose = require("mongoose");

function normalizeSkills(skills = []) {
  return [
    ...new Set(
      skills
        .map((s) => String(s).trim())
        .filter(Boolean)
        .map((s) =>
          s
            .toLowerCase()
            .replace(/\s+/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
        )
    ),
  ];
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    profileImage: {
      type: String,
      default: "",
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    resetPasswordToken: {
      type: String,
      default: "",
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    skillsOffered: {
      type: [String],
      default: [],
      set: normalizeSkills,
    },

    skillsWanted: {
      type: [String],
      default: [],
      set: normalizeSkills,
    },

    creditBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    moneyBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    reliabilityScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },

    ratingAvg: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    completedSessions: {
      type: Number,
      default: 0,
      min: 0,
    },

    disputeCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    role: {
      type: String,
      enum: ["user", "admin", "super_admin"],
      default: "user",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      default: "",
    },

    emailVerificationExpires: {
      type: Date,
      default: null,
    },

    isSuspended: {
      type: Boolean,
      default: false,
    },

    suspendedAt: {
      type: Date,
      default: null,
    },

    suspensionReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);