module.exports = function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!["admin", "super_admin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Admin access only" });
  }

  next();
};