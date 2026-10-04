import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';
import { yjsService } from '../../services/yjs.service';
import { logger } from '../../utils/logger';

// Store presence state in memory for now
// Map<roomId, Map<socketId, any>>
const awareness = new Map<string, Map<string, any>>();

export const handleRoomEvents = (io: Server, socket: Socket) => {
  socket.on('join-room', async ({ roomId }) => {
    socket.join(roomId);
    logger.info(`User ${socket.data.user?.name} joined room ${roomId}`);
    
    // Initialize Yjs doc
    const doc = await yjsService.getDoc(roomId);
    
    // Send full state to the newly joined client
    const state = Y.encodeStateAsUpdate(doc);
    socket.emit('yjs-sync-step-1', Buffer.from(state));

    if (!awareness.has(roomId)) {
      awareness.set(roomId, new Map());
    }

    // Broadcast user joined
    socket.to(roomId).emit('user-joined', {
      user: socket.data.user,
      socketId: socket.id,
    });
  });

  socket.on('yjs-update', ({ roomId, update }: { roomId: string, update: Buffer }) => {
    // 1. Apply to server-side doc
    yjsService.applyUpdate(roomId, new Uint8Array(update));
    // 2. Broadcast to others in the room
    socket.to(roomId).emit('yjs-update', update);
  });

  socket.on('awareness-update', ({ roomId, update }: { roomId: string, update: Buffer }) => {
    // Broadcast binary awareness update to others
    socket.to(roomId).emit('awareness-update', update);
  });

  socket.on('disconnecting', () => {
    const rooms = Array.from(socket.rooms);
    for (const roomId of rooms) {
      if (roomId !== socket.id) {
        // Broadcast user left
        socket.to(roomId).emit('user-left', {
          user: socket.data.user,
          socketId: socket.id,
        });

        // Clean up awareness
        const roomAwareness = awareness.get(roomId);
        if (roomAwareness) {
          roomAwareness.delete(socket.id);
        }
      }
    }
  });
};
