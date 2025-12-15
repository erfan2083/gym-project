// Backend/middleware/authMiddleware.js
import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "توکن احراز هویت ارسال نشده است" });
    }

    const token = header.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // ما در login توکن را با { id, role } ساختیم
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (err) {
    console.error("authMiddleware error:", err);
    return res.status(401).json({ message: "توکن نامعتبر است" });
  }
};
