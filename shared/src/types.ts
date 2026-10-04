import { Language, Role, ExecutionStatus } from './enums';

// ── User ──────────────────────────────────────
export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatarColor: string;
  googleId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUserWithPassword extends IUser {
  passwordHash: string;
  refreshTokens: string[];
}

// ── Room ──────────────────────────────────────
export interface IRoomMember {
  user: string | IUser;
  role: Role;
  joinedAt: string;
}

export interface IShareLink {
  token: string;
  role: Role.Editor | Role.Viewer;
  expiresAt?: string;
  createdAt: string;
}

export interface IRoom {
  _id: string;
  roomId: string;
  name: string;
  owner: string | IUser;
  passwordHash?: string;
  language: Language;
  members: IRoomMember[];
  shareLinks: IShareLink[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Document (Yjs State) ──────────────────────
export interface IDocument {
  _id: string;
  roomId: string;
  fileName: string;
  yjsState: Buffer | Uint8Array;
  updatedAt: string;
}

// ── Snapshot ──────────────────────────────────
export interface ISnapshot {
  _id: string;
  roomId: string;
  fileName: string;
  content: string;
  label?: string;
  createdBy: string | IUser;
  createdAt: string;
}

// ── Message ──────────────────────────────────
export interface IMessage {
  _id: string;
  roomId: string;
  sender: string | IUser;
  text: string;
  createdAt: string;
}

// ── Execution ────────────────────────────────
export interface IExecution {
  _id: string;
  roomId: string;
  user: string | IUser;
  language: Language;
  code: string;
  stdin: string;
  stdout: string;
  stderr: string;
  status: ExecutionStatus;
  runtimeMs: number;
  createdAt: string;
}

// ── API Response ─────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── Auth ─────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
}

export interface LoginResponse {
  user: IUser;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: IUser;
  tokens: AuthTokens;
}

// ── Presence ─────────────────────────────────
export interface PresenceUser {
  userId: string;
  name: string;
  avatarColor: string;
  cursor?: {
    lineNumber: number;
    column: number;
  };
  isTyping?: boolean;
}
