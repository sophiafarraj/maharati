const mongoose = require("mongoose");

const recurringAvailabilitySchema = new mongoose.Schema(
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

    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
      index: true,
    },

    startTime: {
      type: String,
      required: true,
      trim: true,
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

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

recurringAvailabilitySchema.index(
  { teacherId: 1, skill: 1, dayOfWeek: 1, startTime: 1, mode: 1, price: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.RecurringAvailability ||
  mongoose.model("RecurringAvailability", recurringAvailabilitySchema);