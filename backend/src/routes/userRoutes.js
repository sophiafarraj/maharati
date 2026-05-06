const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.get("/me", authMiddleware, userController.getMe);
router.patch("/me", authMiddleware, userController.updateMe);
router.patch(
  "/me/photo",
  authMiddleware,
  upload.single("profileImage"),
  userController.uploadProfilePhoto
);
router.get("/search", authMiddleware, userController.searchTeachers);

module.exports = router;