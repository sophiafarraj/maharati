const Slot = require("../models/Slot");
const Session = require("../models/Session");
const User = require("../models/User");
const RecurringAvailability = require("../models/RecurringAvailability");
const SLOT_DURATION_MINUTES = 60;

function normalizeSkill(skill) {
  return String(skill)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
function isAllowedStartTimeString(startTime) {
  return /^([01]\d|2[0-3]):00$/.test(String(startTime || "").trim());
}

function getNextOccurrencesForWeekday(dayOfWeek, startTime, count = 4) {
  const [hours, minutes] = String(startTime).split(":").map(Number);
  const now = new Date();
  const occurrences = [];

  const cursor = new Date(now);
  cursor.setSeconds(0, 0);

  while (occurrences.length < count) {
    const candidate = new Date(cursor);
    candidate.setHours(hours, minutes, 0, 0);

    const diff = (dayOfWeek - candidate.getDay() + 7) % 7;
    candidate.setDate(candidate.getDate() + diff);

    if (diff === 0 && candidate <= now) {
      candidate.setDate(candidate.getDate() + 7);
    }

    const duplicate = occurrences.some(
      (d) => d.getTime() === candidate.getTime()
    );

    if (!duplicate) {
      occurrences.push(candidate);
    }

    cursor.setDate(candidate.getDate() + 1);
  }

  return occurrences;
}

function isAllowedHourlyStart(date) {
  return (
    date.getMinutes() === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0
  );
}

exports.createSlot = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { skill, startAt, mode, price } = req.body;

    if (!skill || !startAt || !mode || price === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!["credit", "money"].includes(mode)) {
      return res.status(400).json({ message: "Invalid mode" });
    }

    const teacher = await User.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const normalizedSkill = normalizeSkill(skill);

    if (!teacher.skillsOffered.includes(normalizedSkill)) {
      return res.status(400).json({
        message: "Skill must be one of your profile skills",
      });
    }

    const start = new Date(startAt);

    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: "Invalid start time" });
    }

    if (start < new Date()) {
      return res.status(400).json({
        message: "Cannot create slot in the past",
      });
    }

    if (!isAllowedHourlyStart(start)) {
      return res.status(400).json({
        message: "Slots must start exactly on the hour, like 09:00 or 10:00",
      });
    }

    const end = new Date(start.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);

    const slot = await Slot.create({
      teacherId,
      skill: normalizedSkill,
      startAt: start,
      endAt: end,
      durationMinutes: SLOT_DURATION_MINUTES,
      mode,
      price: Number(price),
      status: "available",
    });

    return res.status(201).json({
      message: "Slot created successfully",
      slot,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
exports.createRecurringAvailability = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { skill, dayOfWeek, startTime, mode, price } = req.body;

    if (
      !skill ||
      dayOfWeek === undefined ||
      !startTime ||
      !mode ||
      price === undefined
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const numericDayOfWeek = Number(dayOfWeek);

    if (!Number.isInteger(numericDayOfWeek) || numericDayOfWeek < 0 || numericDayOfWeek > 6) {
      return res.status(400).json({ message: "Invalid dayOfWeek" });
    }

    if (!["credit", "money"].includes(mode)) {
      return res.status(400).json({ message: "Invalid mode" });
    }

    if (!isAllowedStartTimeString(startTime)) {
      return res.status(400).json({
        message: "Recurring slots must start exactly on the hour, like 15:00 or 18:00",
      });
    }

    const teacher = await User.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const normalizedSkill = normalizeSkill(skill);

    if (!teacher.skillsOffered.includes(normalizedSkill)) {
      return res.status(400).json({
        message: "Skill must be one of your profile skills",
      });
    }

    const recurringRule = await RecurringAvailability.create({
      teacherId,
      skill: normalizedSkill,
      dayOfWeek: numericDayOfWeek,
      startTime,
      mode,
      price: Number(price),
      isActive: true,
    });

    const futureDates = getNextOccurrencesForWeekday(numericDayOfWeek, startTime, 4);

    const createdSlots = [];

    for (const start of futureDates) {
      const existingSlot = await Slot.findOne({
        teacherId,
        startAt: start,
      });

      if (existingSlot) continue;

      const end = new Date(start.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);

      const slot = await Slot.create({
        teacherId,
        skill: normalizedSkill,
        startAt: start,
        endAt: end,
        durationMinutes: SLOT_DURATION_MINUTES,
        mode,
        price: Number(price),
        status: "available",
      });

      createdSlots.push(slot);
    }

    return res.status(201).json({
      message: "Recurring weekly availability created successfully",
      recurringAvailability: recurringRule,
      createdSlotsCount: createdSlots.length,
      slots: createdSlots,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: "An identical recurring weekly availability already exists",
      });
    }

    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
exports.getMySlots = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const now = new Date();

    await Slot.updateMany(
      {
        teacherId,
        status: "available",
        startAt: { $lte: now },
      },
      {
        $set: { status: "cancelled" },
      }
    );

    const slots = await Slot.find({ teacherId }).sort({ startAt: 1 });

    return res.json({ slots });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getTutorSlots = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const now = new Date();

    const slots = await Slot.find({
      teacherId,
      status: "available",
      startAt: { $gt: now },
    }).sort({ startAt: 1 });

    return res.json({ slots });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateSlot = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const slotId = req.params.id;
    const { skill, startAt, mode, price } = req.body;

    const slot = await Slot.findById(slotId);

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    if (String(slot.teacherId) !== String(teacherId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (slot.status !== "available") {
      return res.status(400).json({
        message: "Only available slots can be updated",
      });
    }

    const existingSession = await Session.findOne({
      slotId: slot._id,
      status: { $in: ["booked"] },
    });

    if (existingSession) {
      return res.status(400).json({
        message: "Slot already booked",
      });
    }

    const teacher = await User.findById(teacherId);

    if (skill !== undefined) {
      const normalizedSkill = normalizeSkill(skill);

      if (!teacher.skillsOffered.includes(normalizedSkill)) {
        return res.status(400).json({
          message: "Skill must be one of your profile skills",
        });
      }

      slot.skill = normalizedSkill;
    }

    if (startAt !== undefined) {
      const start = new Date(startAt);

      if (isNaN(start.getTime())) {
        return res.status(400).json({ message: "Invalid start time" });
      }

      if (start < new Date()) {
        return res.status(400).json({
          message: "Cannot move slot to the past",
        });
      }

      if (!isAllowedHourlyStart(start)) {
        return res.status(400).json({
          message: "Slots must start exactly on the hour, like 09:00 or 10:00",
        });
      }

      slot.startAt = start;
      slot.endAt = new Date(
        start.getTime() + SLOT_DURATION_MINUTES * 60 * 1000
      );
    }

    if (mode !== undefined) {
      if (!["credit", "money"].includes(mode)) {
        return res.status(400).json({ message: "Invalid mode" });
      }
      slot.mode = mode;
    }

    if (price !== undefined) {
      slot.price = Number(price);
    }

    await slot.save();

    return res.json({
      message: "Slot updated successfully",
      slot,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.deleteSlot = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const slotId = req.params.id;

    const slot = await Slot.findById(slotId);

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    if (String(slot.teacherId) !== String(teacherId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (slot.status === "booked") {
      return res.status(400).json({
        message: "Booked slots cannot be deleted",
      });
    }

    const existingSession = await Session.findOne({
      slotId: slot._id,
      status: "booked",
    });

    if (existingSession) {
      return res.status(400).json({
        message: "Slot already booked",
      });
    }

    slot.status = "cancelled";
    await slot.save();

    return res.json({
      message: "Slot cancelled successfully",
      slot,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};