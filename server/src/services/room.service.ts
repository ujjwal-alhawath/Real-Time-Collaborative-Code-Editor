import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { Room, IRoomDocument } from '../models';
import { AppError } from '../utils/AppError';
import { CreateRoomInput, UpdateRoomInput, Role, Language } from '@codesync/shared';

const BCRYPT_ROUNDS = 10;

/**
 * Create a new room.
 */
export const createRoom = async (
  userId: string,
  input: CreateRoomInput,
): Promise<IRoomDocument> => {
  const { name, language, password } = input;

  const roomId = nanoid(10);
  let passwordHash: string | undefined;

  if (password) {
    passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  const room = await Room.create({
    roomId,
    name,
    owner: userId,
    language: language || Language.JavaScript,
    passwordHash,
    members: [
      {
        user: userId,
        role: Role.Owner,
        joinedAt: new Date(),
      },
    ],
  });

  return room;
};

/**
 * Get a room by its roomId. Populates member user data.
 */
export const getRoomByRoomId = async (roomId: string): Promise<IRoomDocument> => {
  const room = await Room.findOne({ roomId, isActive: true }).populate(
    'members.user',
    'name email avatarColor',
  ).populate('owner', 'name email avatarColor');

  if (!room) {
    throw AppError.notFound('Room not found');
  }

  return room;
};

/**
 * List rooms for a user (rooms they are a member of).
 */
export const getUserRooms = async (userId: string): Promise<IRoomDocument[]> => {
  const rooms = await Room.find({
    'members.user': userId,
    isActive: true,
  })
    .populate('owner', 'name email avatarColor')
    .populate('members.user', 'name email avatarColor')
    .sort({ updatedAt: -1 })
    .lean();

  return rooms as unknown as IRoomDocument[];
};

/**
 * Join a room. If room has a password, it must be provided.
 */
export const joinRoom = async (
  userId: string,
  roomId: string,
  password?: string,
): Promise<IRoomDocument> => {
  const room = await Room.findOne({ roomId, isActive: true }).select('+passwordHash');

  if (!room) {
    throw AppError.notFound('Room not found');
  }

  // Check if user is already a member
  const isMember = room.members.some(
    (m) => m.user.toString() === userId,
  );
  if (isMember) {
    // Return the room without re-joining
    return getRoomByRoomId(roomId);
  }

  // Check password if room is password-protected
  if (room.passwordHash) {
    if (!password) {
      throw AppError.unauthorized('Room password required');
    }
    const isMatch = await bcrypt.compare(password, room.passwordHash);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid room password');
    }
  }

  // Add user as editor
  room.members.push({
    user: userId as unknown as import('mongoose').Types.ObjectId,
    role: Role.Editor,
    joinedAt: new Date(),
  });
  await room.save();

  return getRoomByRoomId(roomId);
};

/**
 * Leave a room. Owner cannot leave (must delete instead).
 */
export const leaveRoom = async (
  userId: string,
  roomId: string,
): Promise<void> => {
  const room = await Room.findOne({ roomId, isActive: true });
  if (!room) {
    throw AppError.notFound('Room not found');
  }

  if (room.owner.toString() === userId) {
    throw AppError.badRequest('Owner cannot leave the room. Delete it instead.');
  }

  room.members = room.members.filter(
    (m) => m.user.toString() !== userId,
  );
  await room.save();
};

/**
 * Update room settings (owner only).
 */
export const updateRoom = async (
  userId: string,
  roomId: string,
  input: UpdateRoomInput,
): Promise<IRoomDocument> => {
  const room = await Room.findOne({ roomId, isActive: true });
  if (!room) {
    throw AppError.notFound('Room not found');
  }

  if (room.owner.toString() !== userId) {
    throw AppError.forbidden('Only the room owner can update settings');
  }

  if (input.name !== undefined) room.name = input.name;
  if (input.language !== undefined) room.language = input.language;
  await room.save();

  return getRoomByRoomId(roomId);
};

/**
 * Delete a room (owner only). Soft delete by setting isActive to false.
 */
export const deleteRoom = async (
  userId: string,
  roomId: string,
): Promise<void> => {
  const room = await Room.findOne({ roomId, isActive: true });
  if (!room) {
    throw AppError.notFound('Room not found');
  }

  if (room.owner.toString() !== userId) {
    throw AppError.forbidden('Only the room owner can delete the room');
  }

  room.isActive = false;
  await room.save();
};

/**
 * Check if a user is a member of a room and return their role.
 */
export const getMemberRole = async (
  userId: string,
  roomId: string,
): Promise<Role | null> => {
  const room = await Room.findOne({ roomId, isActive: true });
  if (!room) return null;

  const member = room.members.find(
    (m) => m.user.toString() === userId,
  );

  return member?.role ?? null;
};
