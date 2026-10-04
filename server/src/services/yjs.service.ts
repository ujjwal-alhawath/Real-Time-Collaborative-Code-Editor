import * as Y from 'yjs';
import { logger } from '../utils/logger';
import DocumentModel from '../models/Document';

class YjsManager {
  private docs = new Map<string, Y.Doc>();
  private saveTimeouts = new Map<string, NodeJS.Timeout>();

  async getDoc(roomId: string): Promise<Y.Doc> {
    if (this.docs.has(roomId)) {
      return this.docs.get(roomId)!;
    }

    const doc = new Y.Doc();
    this.docs.set(roomId, doc);

    // Load from DB
    try {
      const dbDoc = await DocumentModel.findOne({ room: roomId }).lean();
      if (dbDoc && dbDoc.content) {
        Y.applyUpdate(doc, new Uint8Array(dbDoc.content.buffer));
      }
    } catch (error) {
      logger.error({ error, roomId }, 'Failed to load Yjs doc from DB');
    }

    // When document updates, debounce save to MongoDB
    doc.on('update', (update) => {
      this.scheduleSave(roomId, doc);
    });

    return doc;
  }

  private scheduleSave(roomId: string, doc: Y.Doc) {
    if (this.saveTimeouts.has(roomId)) {
      clearTimeout(this.saveTimeouts.get(roomId)!);
    }

    const timeout = setTimeout(async () => {
      try {
        const state = Y.encodeStateAsUpdate(doc);
        await DocumentModel.findOneAndUpdate(
          { room: roomId },
          { 
            room: roomId,
            content: Buffer.from(state),
            language: 'javascript' // default, updated separately
          },
          { upsert: true, new: true }
        );
        logger.debug(`Saved Yjs doc for room ${roomId}`);
      } catch (error) {
        logger.error({ error, roomId }, 'Failed to save Yjs doc to DB');
      }
      this.saveTimeouts.delete(roomId);
    }, 5000); // Save after 5 seconds of inactivity

    this.saveTimeouts.set(roomId, timeout);
  }

  applyUpdate(roomId: string, update: Uint8Array): void {
    const doc = this.docs.get(roomId);
    if (doc) {
      Y.applyUpdate(doc, update);
    }
  }

  encodeStateVector(roomId: string): Uint8Array | null {
    const doc = this.docs.get(roomId);
    if (!doc) return null;
    return Y.encodeStateVector(doc);
  }
}

export const yjsService = new YjsManager();
