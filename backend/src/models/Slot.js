const mongoose = require("mongoose");

const SLOT_DURATION_MINUTES = 60;

const slotSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    skill: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    startAt: {
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
      default: SLOT_DURATION_MINUTES,
      enum: [SLOT_DURATION_MINUTES],
    },

    mode: {
      type: String,
      enum: ["credit", "money"],
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["available", "booked", "cancelled"],
      default: "available",
      index: true,
    },

    bookedBySessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
    },
  },
  { timestamps: true }
);

slotSchema.index({ teacherId: 1, startAt: 1 }, { unique: true });
slotSchema.index({ status: 1, startAt: 1 });

slotSchema.pre("validate", function () {
  if (this.startAt) {
    const start = new Date(this.startAt);
    this.endAt = new Date(start.getTime() + this.durationMinutes * 60 * 1000);
  }
});

module.exports = mongoose.models.Slot || mongoose.model("Slot", slotSchema);