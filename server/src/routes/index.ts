import { Router } from 'express';
import authRoutes from './auth.routes';
import roomRoutes from './room.routes';
import healthRoutes from './health.routes';
import executionRoutes from './execution.routes';
import chatRoutes from './chat.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);
router.use('/rooms', executionRoutes);
router.use('/rooms/:roomId/messages', chatRoutes);
router.use('/health', healthRoutes);

export default router;
