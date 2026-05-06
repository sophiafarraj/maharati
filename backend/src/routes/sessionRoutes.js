const express = require("express");
const router = express.Router();

const sessionController = require("../controllers/sessionController");
const authMiddleware = require("../middleware/authMiddleware");
const requireVerifiedUser = require("../middleware/requireVerifiedUser");

router.post("/book", authMiddleware, requireVerifiedUser, sessionController.bookSession);
router.get("/booked-sessions", authMiddleware, sessionController.getBookedSessions);
router.get("/my-sessions", authMiddleware, sessionController.getMySessions);
router.patch("/:id/cancel", authMiddleware, sessionController.cancelSession);
router.patch("/:id/dispute", authMiddleware, requireVerifiedUser, sessionController.openDispute);
router.patch("/:id/rate", authMiddleware, requireVerifiedUser, sessionController.rateSession);
router.patch("/:id/meeting-link", authMiddleware, requireVerifiedUser, sessionController.updateMeetingLink);

module.exports = router;