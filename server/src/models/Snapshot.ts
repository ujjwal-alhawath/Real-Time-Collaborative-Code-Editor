import mongoose, { Schema, Document } from 'mongoose';

export interface ISnapshotDocument extends Document {
  _id: mongoose.Types.ObjectId;
  roomId: string;
  fileName: string;
  content: string;
  label?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const snapshotSchema = new Schema<ISnapshotDocument>(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      maxlength: 100,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

snapshotSchema.index({ roomId: 1, fileName: 1, createdAt: -1 });

export const Snapshot = mongoose.model<ISnapshotDocument>('Snapshot', snapshotSchema);
