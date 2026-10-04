import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageDocument extends Document {
  _id: mongoose.Types.ObjectId;
  roomId: string;
  sender: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
}

const messageSchema = new Schema<IMessageDocument>(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: [2000, 'Message must be at most 2000 characters'],
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// For paginated retrieval of messages in a room
messageSchema.index({ roomId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessageDocument>('Message', messageSchema);
