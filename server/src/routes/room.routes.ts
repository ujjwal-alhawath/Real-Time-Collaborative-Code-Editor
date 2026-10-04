import { Router } from 'express';
import * as roomController from '../controllers/room.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createRoomSchema, updateRoomSchema, joinRoomSchema } from '@codesync/shared';

const router = Router();

// All room routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/rooms:
 *   post:
 *     summary: Create a new room
 *     tags: [Rooms]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               language: { type: string, enum: [javascript, typescript, python, cpp, java] }
 *               password: { type: string }
 *     responses:
 *       201: { description: Room created }
 */
router.post('/', validate(createRoomSchema), roomController.createRoom);

/**
 * @swagger
 * /api/v1/rooms:
 *   get:
 *     summary: List rooms the current user belongs to
 *     tags: [Rooms]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of rooms }
 */
router.get('/', roomController.getUserRooms);

/**
 * @swagger
 * /api/v1/rooms/{roomId}:
 *   get:
 *     summary: Get room details
 *     tags: [Rooms]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Room details }
 *       404: { description: Room not found }
 */
router.get('/:roomId', roomController.getRoom);

/**
 * @swagger
 * /api/v1/rooms/{roomId}:
 *   patch:
 *     summary: Update room settings (owner only)
 *     tags: [Rooms]
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:roomId', validate(updateRoomSchema), roomController.updateRoom);

/**
 * @swagger
 * /api/v1/rooms/{roomId}:
 *   delete:
 *     summary: Delete a room (owner only)
 *     tags: [Rooms]
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/:roomId', roomController.deleteRoom);

/**
 * @swagger
 * /api/v1/rooms/{roomId}/join:
 *   post:
 *     summary: Join a room
 *     tags: [Rooms]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/:roomId/join', validate(joinRoomSchema), roomController.joinRoom);

/**
 * @swagger
 * /api/v1/rooms/{roomId}/leave:
 *   post:
 *     summary: Leave a room
 *     tags: [Rooms]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/:roomId/leave', roomController.leaveRoom);

export default router;
