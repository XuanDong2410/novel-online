import express from 'express';
import { 
    getTrending, 
    getTrailers, 
    getDetails, 
    getSimilars, 
    getByCategory 
} from '../controllers/tmdb.controller.js';
const router = express.Router();

router.get("/:type/trending", getTrending);
router.get("/:type/:id/trailers", getTrailers);
router.get("/:type/:id/details", getDetails);
router.get("/:type/:id/similar", getSimilars);
router.get("/:type/:category", getByCategory);

export default router;