import { Request, Response } from 'express';
import { enqueueExecution } from '../services/execution.service';
import AppError from '../utils/AppError';
import { getIO } from '../socket';
import { yjsService } from '../services/yjs.service';

export const runCode = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { language } = req.body;

  if (!language) {
    throw new AppError(400, 'Language is required');
  }

  // Extract the latest code from the in-memory Yjs document
  const doc = await yjsService.getDoc(roomId);
  const text = doc.getText('monaco');
  const code = text.toString();

  if (!code.trim()) {
    throw new AppError(400, 'Code is empty');
  }

  // Notify clients that execution started
  const io = getIO();
  io.to(roomId).emit('execution-started', { user: req.user?.name, language });

  // Add to queue
  await enqueueExecution({ roomId, code, language });

  res.status(202).json({
    success: true,
    message: 'Execution queued successfully',
  });
};
