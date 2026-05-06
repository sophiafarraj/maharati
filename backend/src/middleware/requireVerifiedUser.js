module.exports = function requireVerifiedUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      message: "Please verify your email before performing this action.",
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  next();
};