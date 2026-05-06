const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, notificationController.getMyNotifications);
router.patch("/:id/read", authMiddleware, notificationController.markOneAsRead);
router.patch("/read-all", authMiddleware, notificationController.markAllAsRead);

module.exports = router;