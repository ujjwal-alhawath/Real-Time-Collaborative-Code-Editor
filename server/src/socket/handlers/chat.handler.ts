import { Server, Socket } from 'socket.io';
import MessageModel from '../../models/Message';
import { logger } from '../../utils/logger';

export const handleChatEvents = (io: Server, socket: Socket) => {
  socket.on('send-message', async ({ roomId, text }) => {
    try {
      const user = socket.data.user;
      
      // Save to database
      const msg = await MessageModel.create({
        room: roomId,
        sender: user._id,
        text,
      });

      // Populate sender name for clients
      const populatedMsg = {
        _id: msg._id,
        text: msg.text,
        createdAt: msg.createdAt,
        sender: {
          _id: user._id,
          name: user.name,
          avatarColor: user.avatarColor,
        }
      };

      // Broadcast to room (including sender to confirm receipt)
      io.to(roomId).emit('new-message', populatedMsg);
    } catch (error) {
      logger.error({ error, roomId }, 'Failed to process chat message');
    }
  });
};
