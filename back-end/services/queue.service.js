import Queue from 'bull';
import pino from 'pino';
import { generateAudioTask } from '../workers/audio.worker.js';

const logger = pino();

const audioQueue = new Queue('audio-queue', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 10,
  },
});

audioQueue.process(async (job, done) => {
  try {
    logger.info(`Processing job ${job.id} for ${job.data.novelName} - ${job.data.chapterName}`);
    const result = await generateAudioTask(job.data);
    logger.info(`Job ${job.id} completed successfully`);
    done(null, result);
  } catch (err) {
    logger.error(`Job ${job.id} failed: ${err.message}`);
    done(err);
  }
});

audioQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed with error: ${err.message}`);
});

audioQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed with result: ${JSON.stringify(result)}`);
});

export { audioQueue };