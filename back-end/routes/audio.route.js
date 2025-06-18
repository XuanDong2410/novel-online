import express from 'express';
import { audioQueue } from '../services/queue.service.js';
import { body, validationResult, param } from 'express-validator';
import pino from 'pino';

const router = express.Router();
const logger = pino();

/**
 * POST /generate - Thêm job tạo audio và VTT vào hàng đợi
 */
router.post(
  '/generate',
  [
    body('content').notEmpty().withMessage('Content is required'),
    body('novelName').notEmpty().withMessage('Novel name is required'),
    body('chapterName').notEmpty().withMessage('Chapter name is required'),
    body('voiceReq').isObject().withMessage('Voice configuration is required'),
    body('voiceReq.languageCode').notEmpty().withMessage('Voice language code is required'),
    body('voiceReq.name').notEmpty().withMessage('Voice name is required'),
    body('voiceReq.ssmlGender').isIn(['MALE', 'FEMALE', 'NEUTRAL']).withMessage('Invalid voice gender'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, novelName, chapterName, voiceReq } = req.body;
    try {
      const job = await audioQueue.add({ content, novelName, chapterName, voiceReq });
      logger.info(`Job ${job.id} added to queue for ${novelName} - ${chapterName}`);
      res.json({ jobId: job.id });
    } catch (err) {
      logger.error(`Failed to add job: ${err.message}`);
      res.status(500).json({ error: 'Failed to process request' });
    }
  }
);

/**
 * GET /status/:jobId - Kiểm tra trạng thái job
 */
router.get(
  '/status/:jobId',
  [param('jobId').isString().notEmpty().withMessage('Job ID is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { jobId } = req.params;
    try {
      const job = await audioQueue.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      const state = await job.getState();
      const result = job.returnvalue || {};
      res.json({ jobId, state, ...result });
    } catch (err) {
      logger.error(`Failed to get job status ${jobId}: ${err.message}`);
      res.status(500).json({ error: 'Failed to get job status' });
    }
  }
);

// Middleware xử lý lỗi
router.use((err, req, res, next) => {
  logger.error(`Error in audio route: ${err.stack}`);
  res.status(500).json({ error: 'Internal server error' });
});

export default router;