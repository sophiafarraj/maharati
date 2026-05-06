const User = require("../models/User");
const Session = require("../models/Session");
const Slot = require("../models/Slot");
const createNotification = require("../utils/createNotification");

function normalizeSkill(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function uniqueSkills(values = []) {
  return [...new Set(values.map(normalizeSkill).filter(Boolean))];
}

exports.getAdminDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalSlots,
      totalSessions,
      totalDisputes,
      totalFinishedSessions,
      totalCancelledSessions,
      totalSuspendedUsers,
      totalVerifiedUsers,
      totalBookedSessions,
      totalAwaitingConfirmationSessions,
      totalAvailableSlots,
      totalBookedSlots,
      totalAdmins,
      totalSuperAdmins,
    ] = await Promise.all([
      User.countDocuments(),
      Slot.countDocuments(),
      Session.countDocuments(),
      Session.countDocuments({ status: "disputed" }),
      Session.countDocuments({ status: "finished" }),
      Session.countDocuments({ status: "cancelled" }),
      User.countDocuments({ isSuspended: true }),
      User.countDocuments({ isEmailVerified: true }),
      Session.countDocuments({ status: "booked" }),
      Session.countDocuments({ status: "awaiting_confirmation" }),
      Slot.countDocuments({ status: "available" }),
      Slot.countDocuments({ status: "booked" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "super_admin" }),
    ]);

    return res.json({
      stats: {
        totalUsers,
        totalSlots,
        totalSessions,
        totalDisputes,
        totalFinishedSessions,
        totalCancelledSessions,
        totalSuspendedUsers,
        totalVerifiedUsers,
        totalBookedSessions,
        totalAwaitingConfirmationSessions,
        totalAvailableSlots,
        totalBookedSlots,
        totalAdmins,
        totalSuperAdmins,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select(
        "-passwordHash -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires"
      )
      .sort({ createdAt: -1 });

    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const requesterRole = req.user.role;
    const requesterUserId = req.user.userId;

    const {
      name,
      email,
      creditBalance,
      moneyBalance,
      reliabilityScore,
      isEmailVerified,
      role,
      skillsOffered,
      skillsWanted,
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (typeof name === "string") {
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        return res.status(400).json({ message: "Name must be at least 2 characters" });
      }
      user.name = trimmedName;
    }

    if (typeof email === "string") {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) {
        return res.status(400).json({ message: "Email is required" });
      }

      const existingUser = await User.findOne({
        email: trimmedEmail,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      user.email = trimmedEmail;
    }

    if (typeof creditBalance === "number") {
      user.creditBalance = Math.max(0, creditBalance);
    }

    if (typeof moneyBalance === "number") {
      user.moneyBalance = Math.max(0, moneyBalance);
    }

    if (typeof reliabilityScore === "number") {
      user.reliabilityScore = Math.max(0, Math.min(100, reliabilityScore));
    }

    if (typeof isEmailVerified === "boolean") {
      user.isEmailVerified = isEmailVerified;
    }

    if (typeof role === "string") {
      if (requesterRole !== "super_admin") {
        return res.status(403).json({
          message: "Only super admin can change user roles",
        });
      }

      if (!["user", "admin", "super_admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      if (String(requesterUserId) === String(user._id) && role !== "super_admin") {
        return res.status(400).json({
          message: "Super admin cannot remove their own super admin role",
        });
      }

      user.role = role;
    }

    if (Array.isArray(skillsOffered)) {
      user.skillsOffered = uniqueSkills(skillsOffered);
    }

    if (Array.isArray(skillsWanted)) {
      user.skillsWanted = uniqueSkills(skillsWanted);
    }

    await user.save();

    const safeUser = await User.findById(user._id).select(
      "-passwordHash -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires"
    );

    return res.json({
      message: "User updated successfully",
      user: safeUser,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { isSuspended, suspensionReason } = req.body;

    if (String(req.user.userId) === String(userId)) {
      return res.status(400).json({ message: "Admin cannot suspend their own account" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "super_admin" && req.user.role !== "super_admin") {
      return res.status(403).json({
        message: "Only super admin can suspend a super admin",
      });
    }

    user.isSuspended = !!isSuspended;
    user.suspensionReason = user.isSuspended ? String(suspensionReason || "").trim() : "";
    user.suspendedAt = user.isSuspended ? new Date() : null;

    await user.save();

    try {
      await createNotification({
        userId: user._id,
        type: user.isSuspended ? "admin_account_suspended" : "admin_account_unsuspended",
        title: user.isSuspended ? "Account suspended" : "Account restored",
        message: user.isSuspended
          ? user.suspensionReason
            ? `Your account has been suspended. Reason: ${user.suspensionReason}`
            : "Your account has been suspended by an admin."
          : "Your account suspension has been removed by an admin.",
      });
    } catch (notificationErr) {
      console.error("Notification error after suspendUser:", notificationErr.message);
    }

    const safeUser = await User.findById(user._id).select(
      "-passwordHash -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires"
    );

    return res.json({
      message: user.isSuspended
        ? "User suspended successfully"
        : "User unsuspended successfully",
      user: safeUser,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getAllSessions = async (req, res) => {
  try {
    const status = String(req.query.status || "").trim();

    const query = {};
    if (status) {
      query.status = status;
    }

    const sessions = await Session.find(query)
      .populate("studentId", "name email profileImage isSuspended")
      .populate("teacherId", "name email profileImage isSuspended")
      .populate("slotId")
      .populate("disputeResolvedBy", "name email")
      .sort({ createdAt: -1 });

    return res.json({ sessions });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getAllDisputes = async (req, res) => {
  try {
    const disputes = await Session.find({
      $or: [{ status: "disputed" }, { disputeOpened: true }],
    })
      .populate("studentId", "name email profileImage")
      .populate("teacherId", "name email profileImage")
      .populate("slotId")
      .populate("disputeResolvedBy", "name email")
      .sort({ updatedAt: -1 });

    return res.json({ disputes });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.resolveDispute = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const adminUserId = req.user.userId;
    const { resolution } = req.body;

    if (!["refund_student", "release_to_teacher"].includes(resolution)) {
      return res.status(400).json({
        message: "Resolution must be refund_student or release_to_teacher",
      });
    }

    const sessionDoc = await Session.findById(sessionId);

    if (!sessionDoc) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (sessionDoc.status !== "disputed" && !sessionDoc.disputeOpened) {
      return res.status(400).json({ message: "Only disputed sessions can be resolved" });
    }

    if (sessionDoc.disputeResolved) {
      return res.status(400).json({ message: "Dispute already resolved" });
    }

    if (resolution === "refund_student") {
      if (!sessionDoc.refundProcessed) {
        if (sessionDoc.mode === "credit") {
          await User.updateOne(
            { _id: sessionDoc.studentId },
            { $inc: { creditBalance: sessionDoc.escrowAmount } }
          );
        } else {
          await User.updateOne(
            { _id: sessionDoc.studentId },
            { $inc: { moneyBalance: sessionDoc.escrowAmount } }
          );
        }
      }

      sessionDoc.refundProcessed = true;
      sessionDoc.status = "cancelled";
      sessionDoc.escrowReleased = false;
    }

    if (resolution === "release_to_teacher") {
      if (!sessionDoc.escrowReleased) {
        if (sessionDoc.mode === "credit") {
          await User.updateOne(
            { _id: sessionDoc.teacherId },
            { $inc: { creditBalance: sessionDoc.escrowAmount } }
          );
        } else {
          await User.updateOne(
            { _id: sessionDoc.teacherId },
            { $inc: { moneyBalance: sessionDoc.escrowAmount } }
          );
        }

        await User.updateOne(
          { _id: sessionDoc.teacherId },
          { $inc: { completedSessions: 1, reliabilityScore: 1 } }
        );

        await User.updateOne(
          { _id: sessionDoc.studentId },
          { $inc: { completedSessions: 1, reliabilityScore: 1 } }
        );
      }

      sessionDoc.escrowReleased = true;
      sessionDoc.releasedAt = new Date();
      sessionDoc.status = "finished";
    }

    sessionDoc.disputeOpened = true;
    sessionDoc.disputeResolved = true;
    sessionDoc.disputeResolvedAt = new Date();
    sessionDoc.disputeResolution = resolution;
    sessionDoc.disputeResolvedBy = adminUserId;

    await sessionDoc.save();

    try {
      await createNotification({
        userId: sessionDoc.studentId,
        type: "dispute_resolved",
        title: "Dispute resolved",
        message:
          resolution === "refund_student"
            ? `Your dispute for ${sessionDoc.skill} was resolved with a refund.`
            : `Your dispute for ${sessionDoc.skill} was resolved by admin.`,
        sessionId: sessionDoc._id,
        slotId: sessionDoc.slotId,
      });

      await createNotification({
        userId: sessionDoc.teacherId,
        type: "dispute_resolved",
        title: "Dispute resolved",
        message:
          resolution === "release_to_teacher"
            ? `The dispute for ${sessionDoc.skill} was resolved in your favor.`
            : `The dispute for ${sessionDoc.skill} was resolved by admin.`,
        sessionId: sessionDoc._id,
        slotId: sessionDoc.slotId,
      });
    } catch (notificationErr) {
      console.error("Notification error after resolveDispute:", notificationErr.message);
    }

    return res.json({
      message: "Dispute resolved successfully",
      session: sessionDoc,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getAdmins = async (req, res) => {
  try {
    const admins = await User.find({
      role: { $in: ["admin", "super_admin"] },
    })
      .select(
        "-passwordHash -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires"
      )
      .sort({ createdAt: -1 });

    return res.json({ admins });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.promoteToAdmin = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select(
      "-passwordHash -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin" || user.role === "super_admin") {
      return res.status(400).json({ message: "User already has admin access" });
    }

    user.role = "admin";
    await user.save();

    try {
      await createNotification({
        userId: user._id,
        type: "admin_role_granted",
        title: "Admin access granted",
        message: "Your account has been promoted to admin by the super admin.",
      });
    } catch (notificationErr) {
      console.error("Notification error after promoteToAdmin:", notificationErr.message);
    }

    return res.json({
      message: "User promoted to admin successfully",
      user,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.removeAdminRole = async (req, res) => {
  try {
    const userId = req.params.id;

    if (String(req.user.userId) === String(userId)) {
      return res.status(400).json({
        message: "Super admin cannot remove their own role",
      });
    }

    const user = await User.findById(userId).select(
      "-passwordHash -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(400).json({ message: "Only admin users can be downgraded here" });
    }

    user.role = "user";
    await user.save();

    try {
      await createNotification({
        userId: user._id,
        type: "admin_role_removed",
        title: "Admin access removed",
        message: "Your admin access has been removed by the super admin.",
      });
    } catch (notificationErr) {
      console.error("Notification error after removeAdminRole:", notificationErr.message);
    }

    return res.json({
      message: "Admin role removed successfully",
      user,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};