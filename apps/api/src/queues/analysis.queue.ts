import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

export const analysisQueue = new Queue('analysis', {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export default analysisQueue;
