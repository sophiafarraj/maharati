const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.userId).select(
      "_id role isEmailVerified isSuspended"
    );

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (user.isSuspended) {
      return res.status(403).json({ message: "Account is suspended" });
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = authMiddleware;