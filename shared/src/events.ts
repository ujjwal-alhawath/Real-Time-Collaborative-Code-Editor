/**
 * Socket.io event name constants.
 * Shared between client and server to prevent typos.
 */
export const SocketEvents = {
  // ── Connection ──────────────────────────────
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',

  // ── Yjs CRDT Sync ──────────────────────────
  YJS_UPDATE: 'yjs-update',
  YJS_AWARENESS: 'yjs-awareness',
  YJS_SYNC_REQUEST: 'yjs-sync-request',
  YJS_SYNC_RESPONSE: 'yjs-sync-response',

  // ── Editor ──────────────────────────────────
  LANGUAGE_CHANGE: 'language-change',
  LANGUAGE_CHANGED: 'language-changed',
  FILE_SWITCH: 'file-switch',
  FILE_SWITCHED: 'file-switched',

  // ── Code Execution ─────────────────────────
  RUN_CODE: 'run-code',
  EXECUTION_OUTPUT: 'execution-output',
  EXECUTION_STATUS: 'execution-status',

  // ── Chat ────────────────────────────────────
  CHAT_MESSAGE: 'chat-message',
  CHAT_HISTORY: 'chat-history',

  // ── Roles & Permissions ────────────────────
  ROLE_UPDATED: 'role-updated',

  // ── Presence ────────────────────────────────
  PRESENCE_UPDATE: 'presence-update',

  // ── Errors ──────────────────────────────────
  ERROR: 'error',
} as const;

export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];
