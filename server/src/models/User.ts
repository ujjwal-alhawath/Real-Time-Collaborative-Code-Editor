import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  avatarColor: string;
  googleId?: string;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must be at most 50 characters'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: function (this: IUserDocument) {
        return !this.googleId; // Password not required for OAuth users
      },
      select: false, // Don't return password by default
    },
    avatarColor: {
      type: String,
      required: true,
      default: '#4ECDC4',
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as any).passwordHash;
        delete (ret as any).refreshTokens;
        delete (ret as any).__v;
        return ret;
      },
    },
  },
);

// ── Indexes ──────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });

// ── Instance Methods ─────────────────────────
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model<IUserDocument>('User', userSchema);
