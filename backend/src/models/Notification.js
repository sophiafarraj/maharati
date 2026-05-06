const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "slot_booked",
        "slot_booked_teacher_notice",
        "meeting_link_added",
        "meeting_link_updated",
        "session_finished",
        "review_requested",
        "new_review",
        "session_cancelled",
        "dispute_opened",
        "admin_account_suspended",
        "admin_account_unsuspended",
        "session_awaiting_confirmation",
"session_partial_confirmation",
      ],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);