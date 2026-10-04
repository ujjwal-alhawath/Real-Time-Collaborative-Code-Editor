import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import MessageModel from '../models/Message';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router({ mergeParams: true }); // Merges params from parent router to get roomId

router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  
  const messages = await MessageModel.find({ room: roomId })
    .populate('sender', 'name avatarColor')
    .sort({ createdAt: 1 })
    .limit(50)
    .lean();
    
  res.status(200).json({
    success: true,
    data: {
      messages,
    },
  });
}));

export default router;
