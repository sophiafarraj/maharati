const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const superAdminMiddleware = require("../middleware/superAdminMiddleware");
const adminController = require("../controllers/adminController");

router.use(authMiddleware, adminMiddleware);

router.get("/stats", adminController.getAdminDashboardStats);

router.get("/users", adminController.getAllUsers);
router.patch("/users/:id", adminController.updateUser);
router.patch("/users/:id/suspend", adminController.suspendUser);

router.get("/sessions", adminController.getAllSessions);

router.get("/disputes", adminController.getAllDisputes);
router.patch("/disputes/:id/resolve", adminController.resolveDispute);

router.get("/admins", superAdminMiddleware, adminController.getAdmins);
router.patch("/admins/:id/promote", superAdminMiddleware, adminController.promoteToAdmin);
router.patch("/admins/:id/remove", superAdminMiddleware, adminController.removeAdminRole);

module.exports = router;