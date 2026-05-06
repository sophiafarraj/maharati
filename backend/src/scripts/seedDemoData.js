const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("../models/User");
const Slot = require("../models/Slot");
const Session = require("../models/Session");

const PASSWORD = "Maharati123!";
const SLOT_DURATION_MINUTES = 60;

const firstNames = [
  "Ghida", "Rana", "Karim", "Leila", "Omar", "Maya", "Nour", "Hadi", "Jana", "Yara",
  "Tarek", "Lina", "Ziad", "Sara", "Walid", "Rima", "Dania", "Fadi", "Mira", "Samer",
  "Nadine", "Rami", "Aya", "Khaled", "Layan", "Jad", "Sami", "Farah", "Youssef", "Reem",
  "Ali", "Mariam", "Bassel", "Zeina", "Hussein", "Celine", "Adnan", "Lamar", "Nabil", "Dana",
  "Elie", "Hana", "Maher", "Sahar", "Bilal", "Rita", "Ahmad", "Nancy", "Joseph", "Dima"
];

const lastNames = [
  "Saad", "Ali", "Haddad", "Mansour", "Khalil", "Nader", "Tarek", "Youssef", "Salameh", "Hamdan",
  "Chehab", "Issa", "Khoury", "Farhat", "Mikhael", "Abbas", "Harb", "Diab", "Fares", "Nasr"
];

const skillSets = [
  { offered: ["Programming", "Python"], wanted: ["Graphic Design", "French"] },
  { offered: ["Graphic Design", "Photoshop"], wanted: ["Programming", "English Conversation"] },
  { offered: ["Math", "Physics"], wanted: ["Public Speaking", "UI Design"] },
  { offered: ["English Conversation", "Writing"], wanted: ["Math", "Photoshop"] },
  { offered: ["UI Design", "Figma"], wanted: ["Python", "Math"] },
  { offered: ["French", "Arabic"], wanted: ["Canva", "Writing"] },
  { offered: ["Canva", "Content Creation"], wanted: ["Programming", "French"] },
  { offered: ["Public Speaking", "Presentation Skills"], wanted: ["English Conversation", "Graphic Design"] },
  { offered: ["JavaScript", "React"], wanted: ["Public Speaking", "Photoshop"] },
  { offered: ["Video Editing", "Premiere Pro"], wanted: ["Canva", "English Conversation"] },
];

function atHour(daysFromNow, hour) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function buildEmail(firstName, lastName, index) {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index + 1}@maharati.com`;
}

function buildProfileImage(index) {
  const imgId = ((index % 70) + 1);
  return `https://i.pravatar.cc/300?img=${imgId}`;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  await Session.deleteMany({});
  await Slot.deleteMany({});
  await User.deleteMany({
    email: /@maharati\.com$/i,
  });

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const baseUsers = [];

  for (let i = 0; i < 50; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const fullName = `${firstName} ${lastName}`;
    const email = buildEmail(firstName, lastName, i);
    const skillSet = skillSets[i % skillSets.length];

    baseUsers.push({
      name: fullName,
      email,
      passwordHash,
      role: "user",
      isEmailVerified: true,
      profileImage: buildProfileImage(i + 1),
      skillsOffered: skillSet.offered,
      skillsWanted: skillSet.wanted,
      creditBalance: 6 + (i % 10),
      moneyBalance: 70 + i * 3,
      reliabilityScore: 82 + (i % 18),
      ratingAvg: Number((4 + ((i % 10) * 0.09)).toFixed(1)),
      ratingCount: i % 5,
      completedSessions: i % 6,
      disputeCount: i % 2 === 0 ? 0 : 1,
      isSuspended: false,
      suspendedAt: null,
      suspensionReason: "",
      resetPasswordToken: "",
      resetPasswordExpires: null,
      emailVerificationToken: "",
      emailVerificationExpires: null,
    });
  }

  const specialUsers = [
    {
      name: "Super Admin",
      email: "superadmin@maharati.com",
      passwordHash,
      role: "super_admin",
      isEmailVerified: true,
      profileImage: "https://i.pravatar.cc/300?img=71",
      skillsOffered: [],
      skillsWanted: [],
      creditBalance: 0,
      moneyBalance: 0,
      reliabilityScore: 100,
      ratingAvg: 0,
      ratingCount: 0,
      completedSessions: 0,
      disputeCount: 0,
      isSuspended: false,
      suspendedAt: null,
      suspensionReason: "",
      resetPasswordToken: "",
      resetPasswordExpires: null,
      emailVerificationToken: "",
      emailVerificationExpires: null,
    },
    {
      name: "Admin",
      email: "admin@maharati.com",
      passwordHash,
      role: "admin",
      isEmailVerified: true,
      profileImage: "https://i.pravatar.cc/300?img=72",
      skillsOffered: [],
      skillsWanted: [],
      creditBalance: 0,
      moneyBalance: 0,
      reliabilityScore: 100,
      ratingAvg: 0,
      ratingCount: 0,
      completedSessions: 0,
      disputeCount: 0,
      isSuspended: false,
      suspendedAt: null,
      suspensionReason: "",
      resetPasswordToken: "",
      resetPasswordExpires: null,
      emailVerificationToken: "",
      emailVerificationExpires: null,
    },
  ];

  const users = await User.create([...specialUsers, ...baseUsers]);
  const byEmail = Object.fromEntries(users.map((u) => [u.email, u]));

  const regularUsers = users.filter((u) => u.role === "user");

  const teachers = regularUsers.slice(0, 20);
  const students = regularUsers.slice(20);

  const availableSlots = [];
  const bookedPastSlots = [];
  const bookedFutureSlots = [];

  for (let i = 0; i < teachers.length; i++) {
    const teacher = teachers[i];
    const offeredSkill = teacher.skillsOffered[0];
    const hour = 7 + (i % 15);

    const slot = {
      teacherId: teacher._id,
      skill: offeredSkill,
      startAt: atHour((i % 5) + 1, hour),
      endAt: addHours(atHour((i % 5) + 1, hour), 1),
      durationMinutes: SLOT_DURATION_MINUTES,
      mode: i % 2 === 0 ? "credit" : "money",
      price: i % 2 === 0 ? 2 + (i % 3) : 12 + (i % 8),
      status: "available",
    };

    availableSlots.push(slot);
  }

  for (let i = 0; i < 12; i++) {
    const teacher = teachers[i];
    const offeredSkill = teacher.skillsOffered[0];
    const hour = 9 + (i % 8);

    bookedPastSlots.push({
      teacherId: teacher._id,
      skill: offeredSkill,
      startAt: atHour(-(i % 4) - 1, hour),
      endAt: addHours(atHour(-(i % 4) - 1, hour), 1),
      durationMinutes: SLOT_DURATION_MINUTES,
      mode: i % 2 === 0 ? "credit" : "money",
      price: i % 2 === 0 ? 2 + (i % 3) : 10 + (i % 6),
      status: "booked",
    });
  }

  for (let i = 0; i < 8; i++) {
    const teacher = teachers[12 + i];
    const offeredSkill = teacher.skillsOffered[0];
    const hour = 11 + (i % 7);

    bookedFutureSlots.push({
      teacherId: teacher._id,
      skill: offeredSkill,
      startAt: atHour((i % 3) + 1, hour),
      endAt: addHours(atHour((i % 3) + 1, hour), 1),
      durationMinutes: SLOT_DURATION_MINUTES,
      mode: i % 2 === 0 ? "credit" : "money",
      price: i % 2 === 0 ? 2 + (i % 2) : 14 + (i % 5),
      status: "booked",
    });
  }

  const createdAvailableSlots = await Slot.create(availableSlots);
  const createdBookedPastSlots = await Slot.create(bookedPastSlots);
  const createdBookedFutureSlots = await Slot.create(bookedFutureSlots);

  const sessions = [];

  for (let i = 0; i < createdBookedPastSlots.length; i++) {
    const slot = createdBookedPastSlots[i];
    const student = students[i % students.length];
    const teacher = teachers[i % teachers.length];

    let status = "finished";
    let studentConfirmed = true;
    let teacherConfirmed = true;
    let escrowReleased = true;
    let releasedAt = new Date();
    let autoReleased = false;
    let disputeOpened = false;
    let disputeResolved = false;
    let ratedByStudent = true;
    let ratingReminderSent = true;
    let studentRatingForTeacher = 5 - (i % 2);
    let studentReviewForTeacher = "Very helpful session with clear explanations.";
    let ratingSubmittedAt = new Date();
    let disputeReason = "";
    let refundProcessed = false;

    if (i >= 5 && i < 9) {
      status = "awaiting_confirmation";
      studentConfirmed = false;
      teacherConfirmed = false;
      escrowReleased = false;
      releasedAt = null;
      ratedByStudent = false;
      ratingReminderSent = false;
      studentRatingForTeacher = null;
      studentReviewForTeacher = "";
      ratingSubmittedAt = null;
    }

    if (i >= 9) {
      status = "disputed";
      studentConfirmed = false;
      teacherConfirmed = false;
      escrowReleased = false;
      releasedAt = null;
      disputeOpened = true;
      disputeResolved = false;
      ratedByStudent = false;
      ratingReminderSent = false;
      studentRatingForTeacher = null;
      studentReviewForTeacher = "";
      ratingSubmittedAt = null;
      disputeReason = "Student reported issues during the session.";
      refundProcessed = false;
    }

    sessions.push({
      studentId: student._id,
      teacherId: teacher._id,
      slotId: slot._id,
      skill: slot.skill,
      scheduledAt: slot.startAt,
      endAt: slot.endAt,
      durationMinutes: 60,
      mode: slot.mode,
      escrowAmount: slot.price,
      status,
      studentConfirmed,
      teacherConfirmed,
      meetingLink: "https://meet.google.com/demo-session",
      meetingNotes: "Seeded demo session",
      meetingLinkAddedAt: slot.startAt,
      meetingLinkUpdatedAt: slot.startAt,
      studentRatingForTeacher,
      studentReviewForTeacher,
      ratedByStudent,
      ratingSubmittedAt,
      ratingReminderSent,
      disputeOpened,
      disputeReason,
      disputeResolved,
      disputeResolvedAt: null,
      disputeResolution: "",
      disputeResolvedBy: null,
      cancelledBy: null,
      cancelledAt: null,
      cancellationReason: "",
      refundProcessed,
      escrowReleased,
      releasedAt,
      autoReleaseAt: addHours(slot.endAt, 24),
      autoReleased,
    });
  }

  for (let i = 0; i < createdBookedFutureSlots.length; i++) {
    const slot = createdBookedFutureSlots[i];
    const student = students[(i + 12) % students.length];
    const teacher = teachers[(i + 12) % teachers.length];

    sessions.push({
      studentId: student._id,
      teacherId: teacher._id,
      slotId: slot._id,
      skill: slot.skill,
      scheduledAt: slot.startAt,
      endAt: slot.endAt,
      durationMinutes: 60,
      mode: slot.mode,
      escrowAmount: slot.price,
      status: "booked",
      studentConfirmed: false,
      teacherConfirmed: false,
      meetingLink: "https://meet.google.com/upcoming-demo",
      meetingNotes: "Upcoming seeded demo session",
      meetingLinkAddedAt: new Date(),
      meetingLinkUpdatedAt: new Date(),
      studentRatingForTeacher: null,
      studentReviewForTeacher: "",
      ratedByStudent: false,
      ratingSubmittedAt: null,
      ratingReminderSent: false,
      disputeOpened: false,
      disputeReason: "",
      disputeResolved: false,
      disputeResolvedAt: null,
      disputeResolution: "",
      disputeResolvedBy: null,
      cancelledBy: null,
      cancelledAt: null,
      cancellationReason: "",
      refundProcessed: false,
      escrowReleased: false,
      releasedAt: null,
      autoReleaseAt: addHours(slot.endAt, 24),
      autoReleased: false,
    });
  }

  const createdSessions = await Session.create(sessions);

  const sessionBySlotId = new Map(
    createdSessions.map((session) => [String(session.slotId), session._id])
  );

  for (const slot of [...createdBookedPastSlots, ...createdBookedFutureSlots]) {
    slot.bookedBySessionId = sessionBySlotId.get(String(slot._id)) || null;
    await slot.save();
  }

  console.log("Demo data seeded successfully");
  console.log("");
  console.log("All seeded accounts use the same password:");
  console.log(PASSWORD);
  console.log("");
  console.log("Main logins:");
  console.log("Super Admin: superadmin@maharati.com");
  console.log("Admin: admin@maharati.com");
  console.log("");
  console.log(`Regular users created: ${regularUsers.length}`);
  console.log(`Available slots created: ${createdAvailableSlots.length}`);
  console.log(`Booked past slots created: ${createdBookedPastSlots.length}`);
  console.log(`Booked future slots created: ${createdBookedFutureSlots.length}`);
  console.log(`Sessions created: ${createdSessions.length}`);
  console.log("");
  console.log("Sample users:");
  regularUsers.slice(0, 10).forEach((user) => console.log(user.email));

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});