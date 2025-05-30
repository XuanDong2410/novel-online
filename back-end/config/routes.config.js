import express from 'express';
import { isAdmin, isModerator } from '../middleware/isAdmin.js';
import { protectRoute } from '../middleware/protectRoute.js';

import authRouters from '../routes/auth.route.js';
import novelRouters from '../routes/novel/novel.route.js';
import chapterRouters from '../routes/novel/chapter.route.js';

import audioRouters from '../routes/audio.route.js';

import notificationRouters from '../routes/notification.route.js';

import userProfileRouters from '../routes/user/profile.route.js';
import userFavoriteRouters from '../routes/user/favorite.user.route.js';
import userRateRouters from '../routes/user/rate.user.route.js';
import userReportRouters from '../routes/user/report.user.route.js';

import moderatorRouters from '../routes/moderator/moderator.route.js';
import moderatorReportRouters from '../routes/moderator/report.moderator.route.js';
// import adminRouters from '../routes/admin/admin.route.js';
import userAdminRouters from '../routes/admin/user.admin.route.js';

export function configureRoutes(app) {
    app.use(express.json());

    // Auth và public routes
    app.use('/api/v1/auth', authRouters);

    // Người dùng bình thường
    app.use('/api/v1/audio', audioRouters);
    
    // Notification routes
    app.use('/api/v1/notification', protectRoute, notificationRouters);
    
    // ============ USER ROUTES =================

    // User profile routes
    app.use('/api/v1/user/profile', protectRoute, userProfileRouters);

    // Novel and chapter routes
    app.use('/api/v1/novel', protectRoute, novelRouters);
    app.use('/api/v1/chapter', protectRoute, chapterRouters);

    // User-specific routes
    app.use('/api/v1/user/favorite', protectRoute, userFavoriteRouters);
    app.use('/api/v1/user/rate', protectRoute, userRateRouters);
    app.use('/api/v1/user/report', protectRoute, userReportRouters);
    
    // ============ MODERATOR ROUTES =================
    app.use('/api/v2/admin', protectRoute, isModerator, moderatorRouters);
    app.use('/api/v2/moderator/report', protectRoute, isModerator, moderatorReportRouters);

    // ============ ADMIN ROUTES =================

    app.use('/api/v2/admin', protectRoute, isAdmin, userAdminRouters);
}
