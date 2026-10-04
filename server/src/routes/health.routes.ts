import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getRedis } from '../config/redis';

const router = Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200: { description: All systems operational }
 *       503: { description: One or more systems are down }
 */
router.get('/', async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {};

  // MongoDB check
  try {
    const state = mongoose.connection.readyState;
    checks['mongodb'] = state === 1 ? 'connected' : 'disconnected';
  } catch {
    checks['mongodb'] = 'error';
  }

  // Redis check
  try {
    const redis = getRedis();
    await redis.ping();
    checks['redis'] = 'connected';
  } catch {
    checks['redis'] = 'error';
  }

  const allHealthy = Object.values(checks).every((v) => v === 'connected');

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    data: {
      status: allHealthy ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks,
    },
  });
});

export default router;
