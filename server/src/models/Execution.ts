import mongoose, { Schema, Document } from 'mongoose';
import { Language, ExecutionStatus } from '@codesync/shared';

export interface IExecutionDocument extends Document {
  _id: mongoose.Types.ObjectId;
  roomId: string;
  user: mongoose.Types.ObjectId;
  language: Language;
  code: string;
  stdin: string;
  stdout: string;
  stderr: string;
  status: ExecutionStatus;
  runtimeMs: number;
  createdAt: Date;
}

const executionSchema = new Schema<IExecutionDocument>(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    language: {
      type: String,
      enum: Object.values(Language),
      required: true,
    },
    code: {
      type: String,
      required: true,
      maxlength: 50000,
    },
    stdin: {
      type: String,
      default: '',
      maxlength: 10000,
    },
    stdout: {
      type: String,
      default: '',
    },
    stderr: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(ExecutionStatus),
      default: ExecutionStatus.Queued,
    },
    runtimeMs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

executionSchema.index({ roomId: 1, createdAt: -1 });
executionSchema.index({ user: 1, createdAt: -1 });

export const Execution = mongoose.model<IExecutionDocument>('Execution', executionSchema);
