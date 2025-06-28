import express from 'express';
import { audioQueue } from '../services/queue.service.js';
import { body, validationResult, param } from 'express-validator';
import pino from 'pino';

const router = express.Router();
const logger = pino();

/**
 * POST /generate - Thêm job tạo audio và VTT vào hàng đợi
 */
import { generateDefaultAudio, generateCustomAudio } from '../utils/textToSpeech/generate.js';
import { syncVietnameseVoices } from '../utils/textToSpeech/voiceCache.js';
import Chapter from '../models/chapter.model.js';
import Novel from '../models/novel.model.js';

router.post('/default/:chapterId', async (req, res) => {
  try {
    const { chapterId } = req.params;
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
    const novel = await Novel.findById(chapter.novelId);
    if (!novel) return res.status(404).json({ error: 'Novel not found' });
    const testContent = "Đây là một thử nghiệm âm thanh ngắn. Câu 2 thử nghiệm âm thanh ngắn.";
    // chapter.content,
    // console.log("Testing audio generation: ", testContent);
    const { audioUrl, subtitleFileUrl, voiceConfig, duration, size } = await generateDefaultAudio(
      chapter.content,
      novel.title, 
      chapter.title,
      chapterId
    );

    res.status(201).json({
      audioUrl,
      subtitleFileUrl,
      voiceConfig,
      duration,
      size,
    });
  } catch (error) {
    console.error(`Error in default audio generation: ${error.message}`);
    res.status(500).json({ error: 'Failed to generate default audio' });
  }
});

router.post('/custom/:chapterId', async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { voiceConfig, customConfig } = req.body;
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
    const novel = await Novel.findById(chapter.novelId);
    if (!novel) return res.status(404).json({ error: 'Novel not found' });
    if (!voiceConfig || !voiceConfig.name) return res.status(400).json({ error: 'Voice config required' });

    const { audioFileUrl, subtitleFileUrl, duration, size } = await generateCustomAudio(
      chapter.content,
      novel.title,
      chapter.title,
      chapterId,
      voiceConfig,
      customConfig || {}
    );

    res.status(201).json({
      audioFileUrl,
      subtitleFileUrl,
      voiceConfig,
      duration,
      size,
    });
  } catch (error) {
    console.error(`Error in custom audio generation: ${error.message}`);
    res.status(500).json({ error: 'Failed to generate custom audio' });
  }
});

router.get('/sync-voices', async (req, res) => {
  try {
    const voices = await syncVietnameseVoices();
    res.status(200).json({ voices });
  } catch (error) {
    console.error(`Error syncing voices: ${error.message}`);
    res.status(500).json({ error: 'Failed to sync voices' });
  }
});

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