import express from 'express';
import { validate } from '../controllers/valid/valid.controller.js';

const router = express.Router();

router.post('/validate', validate);

export default router;