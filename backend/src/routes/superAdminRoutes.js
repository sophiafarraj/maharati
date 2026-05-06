const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const superAdminMiddleware = require("../middleware/superAdminMiddleware");
const superAdminController = require("../controllers/superAdminController");

router.use(authMiddleware, superAdminMiddleware);

router.get("/admins", superAdminController.getAllAdmins);
router.patch("/users/:id/make-admin", superAdminController.makeAdmin);
router.patch("/admins/:id/remove-admin", superAdminController.removeAdmin);

module.exports = router;