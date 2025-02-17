import express from 'express';
import { 
    getTrending, 
    getTrailers, 
    getDetails, 
    getSimilar, 
    getByCategory 
} from '../../controllers/movies/movies.controller';
const router = express.Router();

router.get("/:type/trending", getTrending);
router.get("/:type/:id/trailers", getTrailers);
router.get("/:type/:id/details", getDetails);
router.get("/:type/:id/similar", getSimilar);
router.get("/:type/:category", getByCategory);

export default router;