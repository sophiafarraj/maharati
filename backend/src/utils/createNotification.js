const Notification = require("../models/Notification");

async function createNotification({
  userId,
  type,
  title,
  message,
  sessionId = null,
  slotId = null,
}) {
  return Notification.create({
    userId,
    type,
    title,
    message,
    sessionId,
    slotId,
  });
}

module.exports = createNotification;