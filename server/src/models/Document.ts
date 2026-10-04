import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentDoc extends Document {
  _id: mongoose.Types.ObjectId;
  roomId: string;
  fileName: string;
  yjsState: Buffer;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocumentDoc>(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      default: 'main.js',
    },
    yjsState: {
      type: Buffer,
      default: Buffer.alloc(0),
    },
  },
  {
    timestamps: true,
  },
);

// Compound unique index: one doc per file per room
documentSchema.index({ roomId: 1, fileName: 1 }, { unique: true });

export const DocumentModel = mongoose.model<IDocumentDoc>('Document', documentSchema);
