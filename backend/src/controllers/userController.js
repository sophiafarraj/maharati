const User = require("../models/User");

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { name, skillsOffered, skillsWanted } = req.body;

    const update = {};

    if (name !== undefined) {
      const trimmedName = String(name).trim();

      if (trimmedName.length < 2) {
        return res.status(400).json({ message: "name must be at least 2 characters" });
      }

      update.name = trimmedName;
    }

    if (skillsOffered !== undefined) {
      if (!Array.isArray(skillsOffered)) {
        return res.status(400).json({ message: "skillsOffered must be an array of strings" });
      }

      update.skillsOffered = skillsOffered
        .map((s) => String(s).trim())
        .filter(Boolean);
    }

    if (skillsWanted !== undefined) {
      if (!Array.isArray(skillsWanted)) {
        return res.status(400).json({ message: "skillsWanted must be an array of strings" });
      }

      update.skillsWanted = skillsWanted
        .map((s) => String(s).trim())
        .filter(Boolean);
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: update },
      { new: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "Profile updated", user });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const user = await User.findById(req.user.userId).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.profileImage = `/uploads/${req.file.filename}`;
    await user.save();

    return res.json({
      message: "Profile photo uploaded successfully",
      profileImage: user.profileImage,
      user,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.searchTeachers = async (req, res) => {
  try {
    const skill = String(req.query.skill || "").trim();

    const query = {
      role: "user",
      _id: { $ne: req.user.userId },
      skillsOffered: { $exists: true, $ne: [] },
    };

    if (skill) {
      query.skillsOffered = {
        $elemMatch: { $regex: skill, $options: "i" },
      };
    }

    const teachers = await User.find(query)
      .select("-passwordHash")
      .sort({ reliabilityScore: -1, ratingAvg: -1, createdAt: -1 });

    return res.json({ teachers });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};