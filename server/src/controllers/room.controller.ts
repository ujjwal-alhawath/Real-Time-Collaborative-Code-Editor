import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as roomService from '../services/room.service';
import { CreateRoomInput, UpdateRoomInput, JoinRoomInput } from '@codesync/shared';

/**
 * POST /api/v1/rooms
 */
export const createRoom = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = req.body as CreateRoomInput;
  const room = await roomService.createRoom(req.userId!, input);

  res.status(201).json({
    success: true,
    data: { room },
  });
});

/**
 * GET /api/v1/rooms
 */
export const getUserRooms = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const rooms = await roomService.getUserRooms(req.userId!);

  res.status(200).json({
    success: true,
    data: { rooms },
  });
});

/**
 * GET /api/v1/rooms/:roomId
 */
export const getRoom = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { roomId } = req.params;
  const room = await roomService.getRoomByRoomId(roomId!);

  res.status(200).json({
    success: true,
    data: { room },
  });
});

/**
 * PATCH /api/v1/rooms/:roomId
 */
export const updateRoom = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { roomId } = req.params;
  const input = req.body as UpdateRoomInput;
  const room = await roomService.updateRoom(req.userId!, roomId!, input);

  res.status(200).json({
    success: true,
    data: { room },
  });
});

/**
 * DELETE /api/v1/rooms/:roomId
 */
export const deleteRoom = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { roomId } = req.params;
  await roomService.deleteRoom(req.userId!, roomId!);

  res.status(200).json({
    success: true,
    message: 'Room deleted successfully',
  });
});

/**
 * POST /api/v1/rooms/:roomId/join
 */
export const joinRoom = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { roomId } = req.params;
  const { password } = req.body as JoinRoomInput;
  const room = await roomService.joinRoom(req.userId!, roomId!, password);

  res.status(200).json({
    success: true,
    data: { room },
  });
});

/**
 * POST /api/v1/rooms/:roomId/leave
 */
export const leaveRoom = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { roomId } = req.params;
  await roomService.leaveRoom(req.userId!, roomId!);

  res.status(200).json({
    success: true,
    message: 'Left the room successfully',
  });
});
