const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("./src/models/User");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  await User.deleteOne({ email: "admin@maharati.com" });

  const passwordHash = await bcrypt.hash("Admin123!", 10);

  await User.create({
    name: "Admin",
    email: "admin@maharati.com",
    passwordHash,
    role: "admin",
    isEmailVerified: true,
    profileImage: "",
    skillsOffered: [],
    skillsWanted: [],
    creditBalance: 0,
    moneyBalance: 0,
    reliabilityScore: 100,
    ratingAvg: 0,
    ratingCount: 0,
    completedSessions: 0,
    disputeCount: 0,
    isSuspended: false,
    suspendedAt: null,
    suspensionReason: "",
    resetPasswordToken: "",
    resetPasswordExpires: null,
    emailVerificationToken: "",
    emailVerificationExpires: null,
  });

  console.log("Admin recreated successfully");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});