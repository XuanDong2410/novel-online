import express from 'express';
import { isAdmin, isModerator } from '../middleware/isAdmin.js';
import { protectRoute } from '../middleware/protectRoute.js';

import authRouters from '../routes/auth.route.js';
import novelRouters from '../routes/novel/novel.route.js';
import chapterRouters from '../routes/novel/chapter.route.js';
import movieRouters from '../routes/movie/movie.route.js';
import tvRouters from '../routes/movie/tv.route.js';
import searchRouters from '../routes/movie/search.route.js';
import audioRouters from '../routes/audio.route.js';

import notificationRouters from '../routes/notification.route.js';

import userProfileRouters from '../routes/user/profile.route.js';
import userNovelRouters from '../routes/user/novel.user.route.js';

import moderatorRouters from '../routes/admin/moderator.route.js';
import adminRouters from '../routes/admin/admin.route.js';
import userAdminRouters from '../routes/admin/user.admin.route.js';

export function configureRoutes(app) {
    app.use(express.json());

    // Auth và public routes
    app.use('/api/v1/auth', authRouters);

    // Người dùng bình thường
    app.use('/api/v1/audio', audioRouters);
    app.use('/api/v1/movie', protectRoute, movieRouters);
    app.use('/api/v1/novel', protectRoute, novelRouters);
    app.use('/api/v1/chapter', protectRoute, chapterRouters);
    app.use('/api/v1/tv', protectRoute, tvRouters);
    app.use('/api/v1/search', protectRoute, searchRouters);

    // Notification routes
    app.use('/api/v1/notification', protectRoute, notificationRouters);

    // ============ USER ROUTES =================
    // User profile routes
    app.use('/api/v1/user/profile', protectRoute, userProfileRouters);
    app.use('/api/v1/user/novel', protectRoute, userNovelRouters);
    
    // ============ MODERATOR ROUTES =================
    app.use('/api/v2/admin', protectRoute, isModerator, moderatorRouters);

    // ============ ADMIN ROUTES =================
    app.use('/api/v2/admin', protectRoute, isAdmin, adminRouters);
    app.use('/api/v2/admin', protectRoute, isAdmin, userAdminRouters);
}
