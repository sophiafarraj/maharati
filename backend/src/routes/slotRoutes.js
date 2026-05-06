const express = require("express");
const router = express.Router();

const slotController = require("../controllers/slotController");
const authMiddleware = require("../middleware/authMiddleware");
const requireVerifiedUser = require("../middleware/requireVerifiedUser");
router.post(
  "/recurring",
  authMiddleware,
  requireVerifiedUser,
  slotController.createRecurringAvailability
);
router.post("/", authMiddleware, requireVerifiedUser, slotController.createSlot);
router.get("/my-slots", authMiddleware, slotController.getMySlots);
router.get("/tutor/:teacherId", authMiddleware, slotController.getTutorSlots);
router.patch("/:id", authMiddleware, requireVerifiedUser, slotController.updateSlot);
router.delete("/:id", authMiddleware, requireVerifiedUser, slotController.deleteSlot);

module.exports = router;