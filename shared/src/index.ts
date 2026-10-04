// ── Enums ─────────────────────────────────────
export { Language, Role, ExecutionStatus } from './enums';

// ── Types ─────────────────────────────────────
export type {
  IUser,
  IUserWithPassword,
  IRoomMember,
  IShareLink,
  IRoom,
  IDocument,
  ISnapshot,
  IMessage,
  IExecution,
  ApiResponse,
  PaginatedResponse,
  AuthTokens,
  LoginResponse,
  RegisterResponse,
  PresenceUser,
} from './types';

// ── Socket Events ─────────────────────────────
export { SocketEvents } from './events';
export type { SocketEventName } from './events';

// ── Validation Schemas ────────────────────────
export {
  registerSchema,
  loginSchema,
  createRoomSchema,
  joinRoomSchema,
  updateRoomSchema,
  createShareLinkSchema,
  chatMessageSchema,
  createFileSchema,
  renameFileSchema,
  executeCodeSchema,
  createSnapshotSchema,
  paginationSchema,
} from './schemas';

export type {
  RegisterInput,
  LoginInput,
  CreateRoomInput,
  JoinRoomInput,
  UpdateRoomInput,
  CreateShareLinkInput,
  ChatMessageInput,
  CreateFileInput,
  RenameFileInput,
  ExecuteCodeInput,
  CreateSnapshotInput,
  PaginationInput,
} from './schemas';
