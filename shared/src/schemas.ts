import { z } from 'zod';
import { Language, Role } from './enums';

// ── Auth Schemas ──────────────────────────────
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

// ── Room Schemas ──────────────────────────────
export const createRoomSchema = z.object({
  name: z
    .string()
    .min(1, 'Room name is required')
    .max(100, 'Room name must be at most 100 characters')
    .trim(),
  language: z.nativeEnum(Language).default(Language.JavaScript),
  password: z
    .string()
    .min(4, 'Room password must be at least 4 characters')
    .max(64, 'Room password must be at most 64 characters')
    .optional(),
});

export const joinRoomSchema = z.object({
  password: z.string().optional(),
});

export const updateRoomSchema = z.object({
  name: z
    .string()
    .min(1, 'Room name is required')
    .max(100, 'Room name must be at most 100 characters')
    .trim()
    .optional(),
  language: z.nativeEnum(Language).optional(),
});

// ── Share Link Schemas ────────────────────────
export const createShareLinkSchema = z.object({
  role: z.enum([Role.Editor, Role.Viewer]),
  expiresInHours: z.number().min(1).max(720).optional(), // max 30 days
});

// ── Chat Schemas ──────────────────────────────
export const chatMessageSchema = z.object({
  text: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message must be at most 2000 characters')
    .trim(),
});

// ── File Schemas ──────────────────────────────
export const createFileSchema = z.object({
  fileName: z
    .string()
    .min(1, 'File name is required')
    .max(255, 'File name must be at most 255 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'File name contains invalid characters')
    .trim(),
});

export const renameFileSchema = z.object({
  fileName: z
    .string()
    .min(1, 'File name is required')
    .max(255, 'File name must be at most 255 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'File name contains invalid characters')
    .trim(),
});

// ── Execution Schemas ─────────────────────────
export const executeCodeSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50000, 'Code must be at most 50000 characters'),
  language: z.nativeEnum(Language),
  stdin: z.string().max(10000, 'Stdin must be at most 10000 characters').default(''),
});

// ── Snapshot Schemas ──────────────────────────
export const createSnapshotSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  label: z.string().max(100, 'Label must be at most 100 characters').optional(),
});

// ── Pagination Schema ─────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Inferred Types ────────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type CreateFileInput = z.infer<typeof createFileSchema>;
export type RenameFileInput = z.infer<typeof renameFileSchema>;
export type ExecuteCodeInput = z.infer<typeof executeCodeSchema>;
export type CreateSnapshotInput = z.infer<typeof createSnapshotSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
