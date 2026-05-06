const Session = require("../models/Session");
const Slot = require("../models/Slot");
const User = require("../models/User");
const createNotification = require("../utils/createNotification");

function hasStarted(sessionDoc) {
  return Date.now() >= new Date(sessionDoc.scheduledAt).getTime();
}

function hasEnded(sessionDoc) {
  return Date.now() >= new Date(sessionDoc.endAt).getTime();
}

function isPastAutoReleaseWindow(sessionDoc) {
  if (!sessionDoc.autoReleaseAt) return false;
  return Date.now() > new Date(sessionDoc.autoReleaseAt).getTime();
}

async function releaseEscrowAndComplete(sessionDoc, { autoReleased = false } = {}) {
  if (sessionDoc.escrowReleased) {
    if (sessionDoc.status !== "finished") {
      sessionDoc.status = "finished";
      await sessionDoc.save();
    }
    return sessionDoc;
  }

  if (sessionDoc.mode === "credit") {
    await User.updateOne(
      { _id: sessionDoc.teacherId },
      {
        $inc: {
          creditBalance: sessionDoc.escrowAmount,
          completedSessions: 1,
          reliabilityScore: 1,
        },
      }
    );
  } else {
    await User.updateOne(
      { _id: sessionDoc.teacherId },
      {
        $inc: {
          moneyBalance: sessionDoc.escrowAmount,
          completedSessions: 1,
          reliabilityScore: 1,
        },
      }
    );
  }

  await User.updateOne(
    { _id: sessionDoc.studentId },
    { $inc: { completedSessions: 1, reliabilityScore: 1 } }
  );

  sessionDoc.escrowReleased = true;
  sessionDoc.releasedAt = new Date();
  sessionDoc.autoReleased = autoReleased;
  sessionDoc.status = "finished";

  await sessionDoc.save();

  try {
    await createNotification({
      userId: sessionDoc.studentId,
      type: "session_finished",
      title: autoReleased ? "Session auto-completed" : "Session finished",
      message: autoReleased
        ? `Your ${sessionDoc.skill} session was completed automatically after the confirmation window ended.`
        : `Your ${sessionDoc.skill} session has been confirmed and finished.`,
      sessionId: sessionDoc._id,
      slotId: sessionDoc.slotId,
    });

    await createNotification({
      userId: sessionDoc.teacherId,
      type: "session_finished",
      title: autoReleased ? "Session auto-completed" : "Session finished",
      message: autoReleased
        ? `Your ${sessionDoc.skill} session was completed automatically after the confirmation window ended.`
        : `Your ${sessionDoc.skill} session has been confirmed and finished.`,
      sessionId: sessionDoc._id,
      slotId: sessionDoc.slotId,
    });

    if (!sessionDoc.ratedByStudent && !sessionDoc.ratingReminderSent) {
      await createNotification({
        userId: sessionDoc.studentId,
        type: "review_requested",
        title: "Leave a review",
        message: `Please rate and review your ${sessionDoc.skill} instructor.`,
        sessionId: sessionDoc._id,
        slotId: sessionDoc.slotId,
      });

      sessionDoc.ratingReminderSent = true;
      await sessionDoc.save();
    }
  } catch (notificationErr) {
    console.error("Notification error after completing session:", notificationErr.message);
  }

  return sessionDoc;
}

async function moveToAwaitingConfirmationIfNeeded(sessionDoc) {
  if (!sessionDoc) return sessionDoc;

  if (
    sessionDoc.status === "booked" &&
    hasEnded(sessionDoc) &&
    !sessionDoc.disputeOpened &&
    !sessionDoc.escrowReleased
  ) {
    sessionDoc.status = "awaiting_confirmation";
    await sessionDoc.save();

    try {
      await createNotification({
        userId: sessionDoc.studentId,
        type: "session_awaiting_confirmation",
        title: "Confirm session completion",
        message: `Your ${sessionDoc.skill} session has ended. Please confirm completion or open a dispute if needed.`,
        sessionId: sessionDoc._id,
        slotId: sessionDoc.slotId,
      });

      await createNotification({
        userId: sessionDoc.teacherId,
        type: "session_awaiting_confirmation",
        title: "Confirm session completion",
        message: `Your ${sessionDoc.skill} session has ended. Please confirm completion or open a dispute if needed.`,
        sessionId: sessionDoc._id,
        slotId: sessionDoc.slotId,
      });
    } catch (notificationErr) {
      console.error("Notification error after awaiting confirmation:", notificationErr.message);
    }
  }

  if (
    sessionDoc.status === "awaiting_confirmation" &&
    sessionDoc.studentConfirmed &&
    sessionDoc.teacherConfirmed &&
    !sessionDoc.disputeOpened
  ) {
    await releaseEscrowAndComplete(sessionDoc, { autoReleased: false });
  }

  return sessionDoc;
}

exports.updateMeetingLink = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.userId;
    const { meetingLink, meetingNotes } = req.body;

    const sessionDoc = await Session.findById(sessionId);

    if (!sessionDoc) {
      return res.status(404).json({ message: "Session not found" });
    }

    await moveToAwaitingConfirmationIfNeeded(sessionDoc);

    if (String(sessionDoc.teacherId) !== String(userId)) {
      return res.status(403).json({ message: "Only the teacher can update the meeting link" });
    }

    if (
      ["awaiting_confirmation", "finished", "cancelled", "disputed"].includes(sessionDoc.status) ||
      hasEnded(sessionDoc)
    ) {
      return res.status(400).json({
        message: "Meeting link cannot be updated after the session has ended",
      });
    }

    const trimmedLink = String(meetingLink || "").trim();
    const trimmedNotes = String(meetingNotes || "").trim();

    if (!trimmedLink) {
      return res.status(400).json({ message: "Meeting link is required" });
    }

    const hadExistingLink = !!sessionDoc.meetingLink;

    sessionDoc.meetingLink = trimmedLink;
    sessionDoc.meetingNotes = trimmedNotes;

    if (!hadExistingLink) {
      sessionDoc.meetingLinkAddedAt = new Date();
    }

    sessionDoc.meetingLinkUpdatedAt = new Date();

    await sessionDoc.save();

    try {
      await createNotification({
        userId: sessionDoc.studentId,
        type: hadExistingLink ? "meeting_link_updated" : "meeting_link_added",
        title: hadExistingLink ? "Meeting link updated" : "Meeting link added",
        message: hadExistingLink
          ? `The meeting link for your ${sessionDoc.skill} session has been updated.`
          : `The meeting link for your ${sessionDoc.skill} session is now available.`,
        sessionId: sessionDoc._id,
        slotId: sessionDoc.slotId,
      });
    } catch (notificationErr) {
      console.error("Notification error after updateMeetingLink:", notificationErr.message);
    }

    return res.json({
      message: hadExistingLink
        ? "Meeting link updated successfully"
        : "Meeting link added successfully",
      session: sessionDoc,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.bookSession = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { slotId } = req.body;

    if (!slotId) {
      return res.status(400).json({ message: "slotId is required" });
    }

    const slot = await Slot.findById(slotId);

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    if (slot.status !== "available") {
      return res.status(400).json({
        message: "This slot has just been booked by another learner.",
      });
    }

    if (String(slot.teacherId) === String(studentId)) {
      return res.status(400).json({ message: "You cannot book your own slot" });
    }

    if (new Date(slot.startAt).getTime() < Date.now()) {
      return res.status(400).json({ message: "Past slots cannot be booked" });
    }

    const existingSession = await Session.findOne({
      slotId,
      studentId,
      status: { $in: ["booked", "awaiting_confirmation", "finished", "disputed"] },
    });

    if (existingSession) {
      return res.status(400).json({
        message: "You have already booked this slot.",
      });
    }

    const student = await User.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.isSuspended) {
      return res.status(403).json({
        message: student.suspensionReason
          ? `Account suspended: ${student.suspensionReason}`
          : "Your account has been suspended",
      });
    }

    if (!student.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email before booking a session.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    const isProfileComplete =
      student.name &&
      Array.isArray(student.skillsOffered) &&
      student.skillsOffered.length > 0 &&
      Array.isArray(student.skillsWanted) &&
      student.skillsWanted.length > 0;

    if (!isProfileComplete) {
      return res.status(403).json({
        message: "Please complete your profile before booking a session.",
        code: "PROFILE_INCOMPLETE",
      });
    }

    const amount = slot.price;

    if (slot.mode === "credit") {
      if ((student.creditBalance || 0) < amount) {
        return res.status(400).json({
          message: "Not enough credits to book this session.",
          shortageType: "credit",
        });
      }

      student.creditBalance -= amount;
      await student.save();
    } else {
      if ((student.moneyBalance || 0) < amount) {
        return res.status(400).json({
          message: "Not enough money to book this session.",
          shortageType: "money",
        });
      }

      student.moneyBalance -= amount;
      await student.save();
    }

    slot.status = "booked";
    await slot.save();

    const autoReleaseAt = new Date(new Date(slot.endAt).getTime() + 30 * 60 * 1000);

    const sessionDoc = await Session.create({
      studentId,
      teacherId: slot.teacherId,
      slotId: slot._id,
      skill: slot.skill,
      scheduledAt: slot.startAt,
      endAt: slot.endAt,
      durationMinutes: slot.durationMinutes || 60,
      mode: slot.mode,
      escrowAmount: slot.price,
      status: "booked",
      studentConfirmed: false,
      teacherConfirmed: false,
      autoReleaseAt,
    });

    slot.bookedBySessionId = sessionDoc._id;
    await slot.save();

    try {
      await createNotification({
        userId: studentId,
        type: "slot_booked",
        title: "Slot booked successfully",
        message: `Your ${slot.skill} slot has been booked successfully.`,
        sessionId: sessionDoc._id,
        slotId: slot._id,
      });

      await createNotification({
        userId: slot.teacherId,
        type: "slot_booked_teacher_notice",
        title: "A slot has been booked",
        message: `Your ${slot.skill} slot has been booked by a learner.`,
        sessionId: sessionDoc._id,
        slotId: slot._id,
      });
    } catch (notificationErr) {
      console.error("Notification error after bookSession:", notificationErr.message);
    }

    return res.status(201).json({
      message: "Slot booked successfully",
      session: sessionDoc,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.confirmSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.userId;

    const sessionDoc = await Session.findById(sessionId);

    if (!sessionDoc) {
      return res.status(404).json({ message: "Session not found" });
    }

    const isStudent = String(sessionDoc.studentId) === String(userId);
    const isTeacher = String(sessionDoc.teacherId) === String(userId);

    if (!isStudent && !isTeacher) {
      return res.status(403).json({ message: "You are not part of this session" });
    }

    await moveToAwaitingConfirmationIfNeeded(sessionDoc);

    if (!hasEnded(sessionDoc)) {
      return res.status(400).json({
        message: "Session can only be confirmed after the end time has passed",
      });
    }

    if (isPastAutoReleaseWindow(sessionDoc)) {
      return res.status(400).json({
        message: "The confirmation window has ended for this session",
      });
    }

    if (!["awaiting_confirmation", "booked"].includes(sessionDoc.status)) {
      return res.status(400).json({
        message: "This session cannot be confirmed in its current state",
      });
    }

    if (sessionDoc.disputeOpened || sessionDoc.status === "disputed") {
      return res.status(400).json({
        message: "Disputed sessions cannot be confirmed",
      });
    }

    if (isStudent) {
      sessionDoc.studentConfirmed = true;
    }

    if (isTeacher) {
      sessionDoc.teacherConfirmed = true;
    }

    if (sessionDoc.status === "booked" && hasEnded(sessionDoc)) {
      sessionDoc.status = "awaiting_confirmation";
    }

    await sessionDoc.save();

    if (sessionDoc.studentConfirmed && sessionDoc.teacherConfirmed) {
      await releaseEscrowAndComplete(sessionDoc, { autoReleased: false });

      return res.json({
        message: "Both participants confirmed. Session finished successfully.",
        session: sessionDoc,
      });
    }

    try {
      const otherUserId = isStudent ? sessionDoc.teacherId : sessionDoc.studentId;

      await createNotification({
        userId: otherUserId,
        type: "session_partial_confirmation",
        title: "Session partially confirmed",
        message: `The other participant confirmed completion for your ${sessionDoc.skill} session.`,
        sessionId: sessionDoc._id,
        slotId: sessionDoc.slotId,
      });
    } catch (notificationErr) {
      console.error("Notification error after confirmSession:", notificationErr.message);
    }

    return res.json({
      message: "Your confirmation has been recorded. Waiting for the other participant.",
      session: sessionDoc,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getBookedSessions = async (req, res) => {
  try {
    const teacherId = req.user.userId;

    let sessions = await Session.find({
      teacherId,
      status: { $in: ["booked", "awaiting_confirmation", "finished", "disputed", "cancelled"] },
    })
      .populate("studentId", "name email ratingAvg ratingCount reliabilityScore profileImage")
      .populate("slotId")
      .sort({ scheduledAt: 1 });

    sessions = await Promise.all(sessions.map((s) => moveToAwaitingConfirmationIfNeeded(s)));

    return res.json({ sessions });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getMySessions = async (req, res) => {
  try {
    const userId = req.user.userId;

    let sessions = await Session.find({
      $or: [{ studentId: userId }, { teacherId: userId }],
    })
      .populate("studentId", "name email profileImage")
      .populate("teacherId", "name email ratingAvg ratingCount profileImage")
      .populate("slotId")
      .sort({ scheduledAt: -1 });

    sessions = await Promise.all(sessions.map((s) => moveToAwaitingConfirmationIfNeeded(s)));

    return res.json({ sessions });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.cancelSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.userId;
    const { reason } = req.body;

    const sessionDoc = await Session.findById(sessionId);

    if (!sessionDoc) {
      return res.status(404).json({ message: "Session not found" });
    }

    const isStudent = String(sessionDoc.studentId) === String(userId);
    const isTeacher = String(sessionDoc.teacherId) === String(userId);

    if (!isStudent && !isTeacher) {
      return res.status(403).json({ message: "You are not part of this session" });
    }

    await moveToAwaitingConfirmationIfNeeded(sessionDoc);

    if (sessionDoc.status === "cancelled") {
      return res.status(400).json({ message: "Session already cancelled" });
    }

    if (["finished", "awaiting_confirmation", "disputed"].includes(sessionDoc.status)) {
      return res.status(400).json({ message: "This session can no longer be cancelled" });
    }

    if (Date.now() >= new Date(sessionDoc.scheduledAt).getTime()) {
      return res.status(400).json({
        message: "Cancellation is only allowed before the session start time",
      });
    }

    if (!sessionDoc.refundProcessed && !sessionDoc.escrowReleased) {
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

      sessionDoc.refundProcessed = true;
    }

    const penalty = isTeacher ? -5 : -3;

    await User.updateOne(
      { _id: userId },
      { $inc: { reliabilityScore: penalty } }
    );

    sessionDoc.status = "cancelled";
    sessionDoc.cancelledBy = userId;
    sessionDoc.cancelledAt = new Date();
    sessionDoc.cancellationReason = reason || "";
    await sessionDoc.save();

    const slotDoc = await Slot.findById(sessionDoc.slotId);
    if (slotDoc && slotDoc.status === "booked") {
      slotDoc.status = "available";
      slotDoc.bookedBySessionId = null;
      await slotDoc.save();
    }

    try {
      const otherUserId = isStudent ? sessionDoc.teacherId : sessionDoc.studentId;

      await createNotification({
        userId: otherUserId,
        type: "session_cancelled",
        title: "Session cancelled",
        message: `Your ${sessionDoc.skill} session was cancelled before it started.`,
        sessionId: sessionDoc._id,
        slotId: sessionDoc.slotId,
      });
    } catch (notificationErr) {
      console.error("Notification error after cancelSession:", notificationErr.message);
    }

    return res.json({
      message: "Session cancelled successfully",
      session: sessionDoc,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.openDispute = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.userId;
    const { reason } = req.body;

    const sessionDoc = await Session.findById(sessionId);

    if (!sessionDoc) {
      return res.status(404).json({ message: "Session not found" });
    }

    const isStudent = String(sessionDoc.studentId) === String(userId);
    const isTeacher = String(sessionDoc.teacherId) === String(userId);

    if (!isStudent && !isTeacher) {
      return res.status(403).json({ message: "You are not part of this session" });
    }

    await moveToAwaitingConfirmationIfNeeded(sessionDoc);

    if (!hasEnded(sessionDoc)) {
      return res.status(400).json({
        message: "Dispute can only be opened after the session end time has passed",
      });
    }

    if (isPastAutoReleaseWindow(sessionDoc)) {
      return res.status(400).json({
        message: "The dispute window has ended for this session",
      });
    }

    if (!["awaiting_confirmation", "booked"].includes(sessionDoc.status)) {
      return res.status(400).json({
        message: "Dispute is only allowed before the session is finalized",
      });
    }

    if (sessionDoc.disputeOpened) {
      return res.status(400).json({ message: "Dispute already opened" });
    }

    sessionDoc.disputeOpened = true;
    sessionDoc.disputeReason = reason || "";
    sessionDoc.status = "disputed";

    await sessionDoc.save();

    await User.updateOne(
      { _id: userId },
      { $inc: { disputeCount: 1 } }
    );

    try {
      const otherUserId = isStudent ? sessionDoc.teacherId : sessionDoc.studentId;

      await createNotification({
        userId: otherUserId,
        type: "dispute_opened",
        title: "Dispute opened",
        message: `A dispute was opened for your ${sessionDoc.skill} session.`,
        sessionId: sessionDoc._id,
        slotId: sessionDoc.slotId,
      });
    } catch (notificationErr) {
      console.error("Notification error after openDispute:", notificationErr.message);
    }

    return res.json({
      message: "Dispute opened",
      session: sessionDoc,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.rateSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.userId;
    const { rating, review } = req.body;

    const numericRating = Number(rating);

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const sessionDoc = await Session.findById(sessionId);

    if (!sessionDoc) {
      return res.status(404).json({ message: "Session not found" });
    }

    await moveToAwaitingConfirmationIfNeeded(sessionDoc);

    if (sessionDoc.status !== "finished") {
      return res.status(400).json({ message: "You can only rate a finished session" });
    }

    if (String(sessionDoc.studentId) !== String(userId)) {
      return res.status(403).json({ message: "Only the student can rate this session" });
    }

    if (sessionDoc.ratedByStudent) {
      return res.status(400).json({ message: "Session already rated" });
    }

    const teacher = await User.findById(sessionDoc.teacherId);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const currentAvg = teacher.ratingAvg || 0;
    const currentCount = teacher.ratingCount || 0;
    const newCount = currentCount + 1;
    const newAvg = (currentAvg * currentCount + numericRating) / newCount;

    teacher.ratingAvg = Number(newAvg.toFixed(2));
    teacher.ratingCount = newCount;
    await teacher.save();

    sessionDoc.studentRatingForTeacher = numericRating;
    sessionDoc.studentReviewForTeacher = String(review || "").trim();
    sessionDoc.ratedByStudent = true;
    sessionDoc.ratingSubmittedAt = new Date();
    await sessionDoc.save();

    try {
      await createNotification({
        userId: sessionDoc.teacherId,
        type: "new_review",
        title: "New review received",
        message: `You received a ${numericRating}-star review for your ${sessionDoc.skill} session.`,
        sessionId: sessionDoc._id,
        slotId: sessionDoc.slotId,
      });
    } catch (notificationErr) {
      console.error("Notification error after rateSession:", notificationErr.message);
    }

    return res.json({
      message: "Rating submitted successfully",
      session: sessionDoc,
      teacher: {
        _id: teacher._id,
        ratingAvg: teacher.ratingAvg,
        ratingCount: teacher.ratingCount,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};