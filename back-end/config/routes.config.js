import { isAdmin, isModerator } from "../middleware/isAdmin.js";
import { protectRoute } from "../middleware/protectRoute.js";

import authRouters from "../routes/auth.route.js";
import novelRouters from "../routes/novel.route.js";
import chapterRouters from "../routes/chapter.route.js";
import attributeRouters from "../routes/attribute.route.js";
import audioRouters from "../routes/audio.route.js";
import moderationRouters from "../routes/moderation.route.js";
import notificationRouters from "../routes/notification.route.js";

//============ import userRouters ================
import novelUserRouters from "../routes/user/novel.user.route.js";
import chapterUserRouters from "../routes/user/chapter.user.route.js";
// User-specific routes
import profileUserRouters from "../routes/user/profile.route.js";
import favoriteUserRouters from "../routes/user/favorite.user.route.js";
import rateUserRouters from "../routes/user/rate.user.route.js";
import reportUserRouters from "../routes/user/report.user.route.js";
import appealUserRouters from "../routes/user/appeal.user.route.js";

//============ import moderatorRouters ================
import moderatorNovelRouters from "../routes/moderator/novel.moderator.route.js";
import moderatorChapterRouters from "../routes/moderator/chapter.moderator.route.js";
import moderatorReportRouters from "../routes/moderator/report.moderator.route.js";
import moderatorLogRouters from "../routes/moderator/log.moderator.route.js";

//============ import adminRouters ================
// import adminRouters from '../routes/admin/admin.route.js';
import userAdminRouters from "../routes/admin/user.admin.route.js";
import novelAdminRouters from "../routes/admin/novel.admin.route.js";
import appealAdminRouters from "../routes/admin/appeal.admin.route.js";
import logAdminRouters from "../routes/admin/log.admin.route.js";
import systemAdminRouters from "../routes/admin/system.admin.route.js";

export function configureRoutes(app) {
  // ============ PROTECT ROUTES =================
  const userRoute = [protectRoute];
  const moderatorRoute = [protectRoute, isModerator];
  const adminRoute = [protectRoute, isAdmin];
  // Auth và public routes
  app.use("/api/v1/auth", authRouters);

  // Người dùng bình thường
  app.use("/api/v1/audio", audioRouters);
  app.use("/api/v1/attribute", attributeRouters);
  app.use("/api/v1/moderation", moderationRouters);
  
  app.use("/api/v1/novel", novelRouters);
  app.use("/api/v1/chapter", chapterRouters);
  // Notification routes
  app.use("/api/v1/notification", userRoute, notificationRouters);

  // ============ USER ROUTES =================

  // User profile routes
  app.use("/api/v1/user/profile", userRoute, profileUserRouters);

  // Novel and chapter routes
  app.use("/api/v1/novels", userRoute, novelUserRouters);
  app.use("/api/v1/chapters", userRoute, chapterUserRouters);

  // User-specific routes
  app.use("/api/v1/favorites", userRoute, favoriteUserRouters);
  app.use("/api/v1/rates", userRoute, rateUserRouters);
  app.use("/api/v1/reports", userRoute, reportUserRouters);
  app.use("/api/v1/appeals", userRoute, appealUserRouters);

  // ============ MODERATOR ROUTES =================
  app.use("/api/v2/moderator/novels", moderatorRoute, moderatorNovelRouters);
  app.use("/api/v2/moderator/chapters", moderatorRoute, moderatorChapterRouters);
  app.use("/api/v2/moderator/reports", moderatorRoute, moderatorReportRouters);
  app.use("/api/v2/moderator/logs", moderatorRoute, moderatorLogRouters);

  // ============ ADMIN ROUTES =================

  app.use("/api/v2/admin/users",adminRoute, userAdminRouters);
  app.use("/api/v2/admin/novels", novelAdminRouters);
  app.use("/api/v2/admin/appeals", adminRoute, appealAdminRouters);
  app.use("/api/v2/admin/logs", adminRoute, logAdminRouters);
  app.use("/api/v2/admin/system", adminRoute, systemAdminRouters);
}
