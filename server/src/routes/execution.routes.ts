import { Router } from 'express';
import { runCode } from '../controllers/execution.controller';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

router.post('/:roomId/execute', asyncHandler(runCode));

export default router;
