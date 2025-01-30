import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';

import authRouters from '../routes/auth.route.js';
import novelRouters from '../routes/novel/novel.route.js';
import chapterRouters from '../routes/novel/chapter.route.js';
import movieRouters from '../routes/movie/movie.route.js';
import tvRouters from '../routes/movie/tv.route.js';
import searchRouters from '../routes/movie/search.route.js';

export function configureRoutes(app) {
    app.use(express.json());
    app.use('/api/v1/auth', authRouters);
    app.use('/api/v1/movie', protectRoute, movieRouters);
    app.use('/api/v1/novel', protectRoute, novelRouters);
    app.use('/api/v1/chapter',protectRoute, chapterRouters);
    app.use('/api/v1/tv', protectRoute, tvRouters);
    app.use('/api/v1/search', protectRoute, searchRouters);
//   app.use('/api/v1/valid', validRouters);
}