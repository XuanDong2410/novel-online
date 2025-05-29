export const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied - Admin only"
    });
  }
  next();
};
export const isModerator = (req, res, next) => {
  if (!["moderator", "admin"].includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied - Moderator or Admin only"
    });
  }
  next();
};