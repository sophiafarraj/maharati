const User = require("../models/User");

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({
      role: { $in: ["admin", "super_admin"] },
    })
      .select(
        "-passwordHash -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires"
      )
      .sort({ role: 1, createdAt: -1 });

    return res.json({ admins });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

exports.makeAdmin = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select(
      "-passwordHash -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin" || user.role === "super_admin") {
      return res.status(400).json({ message: "User is already an admin" });
    }

    user.role = "admin";
    await user.save();

    return res.json({
      message: "User promoted to admin successfully",
      user,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

exports.removeAdmin = async (req, res) => {
  try {
    const userId = req.params.id;

    if (String(req.user.userId) === String(userId)) {
      return res.status(400).json({
        message: "Super admin cannot remove their own access",
      });
    }

    const user = await User.findById(userId).select(
      "-passwordHash -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(400).json({ message: "Only admin users can be demoted" });
    }

    user.role = "user";
    await user.save();

    return res.json({
      message: "Admin removed successfully",
      user,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};