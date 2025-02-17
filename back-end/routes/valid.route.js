import express from 'express';
import { validate } from '../controllers/vertification/vertification.controller.js';

const router = express.Router();

router.post('/validate', validate);

export default router;