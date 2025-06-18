import express from 'express';
import { 
    getAttributes,
    getAttributesByType 
} from '../controllers/attribute.controller.js';

const router = express.Router();

router.get('/', getAttributes);
router.get('/:type', getAttributesByType);
export default router;