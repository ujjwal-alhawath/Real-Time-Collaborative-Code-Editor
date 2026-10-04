import mongoose, { Schema, Document } from 'mongoose';
import { Language, Role } from '@codesync/shared';

export interface IRoomMemberDoc {
  user: mongoose.Types.ObjectId;
  role: Role;
  joinedAt: Date;
}

export interface IShareLinkDoc {
  token: string;
  role: Role.Editor | Role.Viewer;
  expiresAt?: Date;
  createdAt: Date;
}

export interface IRoomDocument extends Document {
  _id: mongoose.Types.ObjectId;
  roomId: string;
  name: string;
  owner: mongoose.Types.ObjectId;
  passwordHash?: string;
  language: Language;
  members: IRoomMemberDoc[];
  shareLinks: IShareLinkDoc[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roomMemberSchema = new Schema<IRoomMemberDoc>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(Role),
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const shareLinkSchema = new Schema<IShareLinkDoc>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: [Role.Editor, Role.Viewer],
      required: true,
    },
    expiresAt: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const roomSchema = new Schema<IRoomDocument>(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Room name is required'],
      minlength: [1, 'Room name is required'],
      maxlength: [100, 'Room name must be at most 100 characters'],
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    language: {
      type: String,
      enum: Object.values(Language),
      default: Language.JavaScript,
    },
    members: {
      type: [roomMemberSchema],
      default: [],
    },
    shareLinks: {
      type: [shareLinkSchema],
      default: [],
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as any).passwordHash;
        delete (ret as any).__v;
        return ret;
      },
    },
  },
);

// ── Indexes ──────────────────────────────────
roomSchema.index({ owner: 1 });
roomSchema.index({ 'members.user': 1 });
roomSchema.index({ isActive: 1 });

export const Room = mongoose.model<IRoomDocument>('Room', roomSchema);
