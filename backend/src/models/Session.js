const mongoose = require("mongoose");

const SESSION_DURATION_MINUTES = 60;
const AUTO_RELEASE_HOURS = 24;

const sessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      required: true,
      index: true,
      unique: true,
    },

    skill: {
      type: String,
      required: true,
      trim: true,
    },

    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },

    endAt: {
      type: Date,
      required: true,
    },

    durationMinutes: {
      type: Number,
      default: SESSION_DURATION_MINUTES,
      enum: [SESSION_DURATION_MINUTES],
    },

    mode: {
      type: String,
      enum: ["credit", "money"],
      required: true,
    },

    escrowAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["booked", "awaiting_confirmation", "finished", "disputed", "cancelled"],
      default: "booked",
      index: true,
    },

    studentConfirmed: {
      type: Boolean,
      default: false,
    },

    teacherConfirmed: {
      type: Boolean,
      default: false,
    },

    meetingLink: {
      type: String,
      default: "",
      trim: true,
    },

    meetingNotes: {
      type: String,
      default: "",
      trim: true,
    },

    meetingLinkAddedAt: {
      type: Date,
      default: null,
    },

    meetingLinkUpdatedAt: {
      type: Date,
      default: null,
    },

    studentRatingForTeacher: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    studentReviewForTeacher: {
      type: String,
      default: "",
      trim: true,
    },

    ratedByStudent: {
      type: Boolean,
      default: false,
    },

    ratingSubmittedAt: {
      type: Date,
      default: null,
    },

    ratingReminderSent: {
      type: Boolean,
      default: false,
    },

    disputeOpened: {
      type: Boolean,
      default: false,
    },

    disputeReason: {
      type: String,
      default: "",
      trim: true,
    },

    disputeResolved: {
      type: Boolean,
      default: false,
    },

    disputeResolvedAt: {
      type: Date,
      default: null,
    },

    disputeResolution: {
      type: String,
      enum: ["", "refund_student", "release_to_teacher"],
      default: "",
    },

    disputeResolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      default: "",
      trim: true,
    },

    refundProcessed: {
      type: Boolean,
      default: false,
    },

    escrowReleased: {
      type: Boolean,
      default: false,
    },

    releasedAt: {
      type: Date,
      default: null,
    },

    autoReleaseAt: {
      type: Date,
      default: null,
    },

    autoReleased: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ teacherId: 1, status: 1 });
sessionSchema.index({ studentId: 1, status: 1 });
sessionSchema.index({ slotId: 1, status: 1 });

sessionSchema.pre("validate", function () {
  if (this.scheduledAt) {
    const start = new Date(this.scheduledAt);
    this.endAt = new Date(start.getTime() + this.durationMinutes * 60 * 1000);
  }

  if (this.endAt && !this.autoReleaseAt) {
    this.autoReleaseAt = new Date(
      new Date(this.endAt).getTime() + AUTO_RELEASE_HOURS * 60 * 60 * 1000
    );
  }
});

module.exports =
  mongoose.models.Session || mongoose.model("Session", sessionSchema);