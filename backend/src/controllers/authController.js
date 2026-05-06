const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

function buildSafeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    profileImage: user.profileImage || "",
    skillsOffered: user.skillsOffered || [],
    skillsWanted: user.skillsWanted || [],
    creditBalance: user.creditBalance || 0,
    moneyBalance: user.moneyBalance || 0,
    reliabilityScore: user.reliabilityScore || 0,
    ratingAvg: user.ratingAvg || 0,
    ratingCount: user.ratingCount || 0,
    completedSessions: user.completedSessions || 0,
    disputeCount: user.disputeCount || 0,
    role: user.role,
    isEmailVerified: !!user.isEmailVerified,
    isSuspended: !!user.isSuspended,
    suspensionReason: user.suspensionReason || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function sendVerificationEmail(user) {
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  user.emailVerificationToken = verificationToken;
  user.emailVerificationExpires = emailVerificationExpires;
  await user.save();

  const verifyLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

  await sendEmail({
    to: user.email,
    subject: "Verify your Maharati email",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Verify your email</h2>
        <p>Welcome to Maharati.</p>
        <p>Please verify your email address by clicking the button below:</p>
        <p>
          <a href="${verifyLink}" style="display:inline-block;padding:12px 20px;background:#8b3fe0;color:white;text-decoration:none;border-radius:8px;">
            Verify Email
          </a>
        </p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `,
  });
}

exports.register = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password are required" });
    }

    name = String(name).trim();
    email = String(email).trim().toLowerCase();
    password = String(password);

    if (name.length < 2) {
      return res.status(400).json({ message: "name must be at least 2 characters" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "password must be at least 6 characters" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is missing in environment variables" });
    }

    if (!process.env.FRONTEND_URL) {
      return res.status(500).json({ message: "FRONTEND_URL is missing in environment variables" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      creditBalance: 2,
      isEmailVerified: false,
    });

    try {
      await sendVerificationEmail(user);
    } catch (emailErr) {
      console.error("Verification email error:", emailErr.message);
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Registered successfully. Please verify your email.",
      token,
      user: buildSafeUser(user),
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    email = String(email).trim().toLowerCase();
    password = String(password);

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is missing in environment variables" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        message: user.suspensionReason
          ? `Account suspended: ${user.suspensionReason}`
          : "Your account has been suspended",
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: user.isEmailVerified ? "Logged in" : "Logged in. Please verify your email.",
      token,
      user: buildSafeUser(user),
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    email = String(email).trim().toLowerCase();

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: "If that email exists, a reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your Maharati password",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Reset your password</h2>
          <p>You requested to reset your Maharati password.</p>
          <p>Click the button below to set a new password:</p>
          <p>
            <a href="${resetLink}" style="display:inline-block;padding:12px 20px;background:#8b3fe0;color:white;text-decoration:none;border-radius:8px;">
              Reset Password
            </a>
          </p>
          <p>This link will expire in 1 hour.</p>
        </div>
      `,
    });

    return res.json({
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    let { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "New password is required" });
    }

    password = String(password);

    if (password.length < 6) {
      return res.status(400).json({ message: "password must be at least 6 characters" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or expired" });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetPasswordToken = "";
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({
      message: "Password reset successfully",
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Verification link is invalid or expired" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = "";
    user.emailVerificationExpires = null;
    await user.save();

    return res.json({
      message: "Email verified successfully",
      user: buildSafeUser(user),
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    email = String(email).trim().toLowerCase();

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: "If that email exists, a verification link has been sent.",
      });
    }

    if (user.isEmailVerified) {
      return res.json({
        message: "This email is already verified.",
      });
    }

    await sendVerificationEmail(user);

    return res.json({
      message: "If that email exists, a verification link has been sent.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};