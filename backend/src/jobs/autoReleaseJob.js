const Session = require("../models/Session");
const User = require("../models/User");
const createNotification = require("../utils/createNotification");

async function runAutoRelease() {
  try {
    const now = new Date();

    const releasableSessions = await Session.find({
      status: "awaiting_confirmation",
      escrowReleased: false,
      disputeOpened: false,
      autoReleaseAt: { $ne: null, $lte: now },
    }).limit(50);

    for (const session of releasableSessions) {
      if (session.mode === "credit") {
        await User.updateOne(
          { _id: session.teacherId },
          { $inc: { creditBalance: session.escrowAmount } }
        );
      } else {
        await User.updateOne(
          { _id: session.teacherId },
          { $inc: { moneyBalance: session.escrowAmount } }
        );
      }

      await User.updateOne(
        { _id: session.teacherId },
        { $inc: { completedSessions: 1, reliabilityScore: 1 } }
      );

      await User.updateOne(
        { _id: session.studentId },
        { $inc: { completedSessions: 1, reliabilityScore: 1 } }
      );

      session.escrowReleased = true;
      session.releasedAt = new Date();
      session.autoReleased = true;
      session.status = "finished";

      await session.save();

      try {
        await createNotification({
          userId: session.studentId,
          type: "session_finished",
          title: "Session auto-completed",
          message: `Your ${session.skill} session was completed automatically after the confirmation window ended.`,
          sessionId: session._id,
          slotId: session.slotId,
        });

        await createNotification({
          userId: session.teacherId,
          type: "session_finished",
          title: "Session auto-completed",
          message: `Your ${session.skill} session was completed automatically after the confirmation window ended.`,
          sessionId: session._id,
          slotId: session.slotId,
        });

        if (!session.ratedByStudent && !session.ratingReminderSent) {
          await createNotification({
            userId: session.studentId,
            type: "review_requested",
            title: "Leave a review",
            message: `Please rate and review your ${session.skill} instructor.`,
            sessionId: session._id,
            slotId: session.slotId,
          });

          session.ratingReminderSent = true;
          await session.save();
        }
      } catch (notificationErr) {
        console.error("Auto-release notification error:", notificationErr.message);
      }
    }
  } catch (err) {
    console.error("Auto-release job error:", err.message);
  }
}

function startAutoReleaseJob() {
  runAutoRelease();
  setInterval(runAutoRelease, 60 * 1000);
}

module.exports = startAutoReleaseJob;