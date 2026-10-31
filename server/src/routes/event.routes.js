import { Router } from 'express';
import { z } from 'zod';
import {
  getEvents,
  getMyEvents,
  getEventById,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
  getEventStats
} from '../controllers/event.controller.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate, objectIdSchema } from '../middleware/validate.js';
import { uploadPoster } from '../middleware/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const createEventSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5000),
  category: z.enum(['workshop', 'seminar', 'webinar', 'conference', 'other']),
  speakerName: z.string().trim().min(2).max(100),
  speakerBio: z.string().trim().max(1000).optional(),
  mode: z.enum(['offline', 'online', 'hybrid']),
  venue: z.string().trim().max(200).optional(),
  meetingLink: z.string().trim().optional(),
  startTime: z.string().datetime({ offset: true }).or(z.string().min(1)),
  endTime: z.string().datetime({ offset: true }).or(z.string().min(1)),
  capacity: z.coerce.number().int().min(1).max(10000)
});

const updateEventSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  category: z.enum(['workshop', 'seminar', 'webinar', 'conference', 'other']).optional(),
  speakerName: z.string().trim().min(2).max(100).optional(),
  speakerBio: z.string().trim().max(1000).optional(),
  mode: z.enum(['offline', 'online', 'hybrid']).optional(),
  venue: z.string().trim().max(200).optional(),
  meetingLink: z.string().trim().optional(),
  startTime: z.string().datetime({ offset: true }).or(z.string().min(1)).optional(),
  endTime: z.string().datetime({ offset: true }).or(z.string().min(1)).optional(),
  capacity: z.coerce.number().int().min(1).max(10000).optional()
});

const idParamSchema = z.object({
  id: objectIdSchema
});

// 1. GET /events (public)
router.get('/', asyncHandler(getEvents));

// 2. GET /events/mine (organizer, admin) - declared before /:id as required
router.get(
  '/mine',
  authenticate,
  requireRole('organizer', 'admin'),
  asyncHandler(getMyEvents)
);

// 3. GET /events/:id (public, optional auth)
router.get(
  '/:id',
  validate({ params: idParamSchema }),
  optionalAuthenticate,
  asyncHandler(getEventById)
);

// 4. POST /events (organizer, admin) - multipart
router.post(
  '/',
  authenticate,
  requireRole('organizer', 'admin'),
  uploadPoster,
  validate({ body: createEventSchema }),
  asyncHandler(createEvent)
);

// 5. PUT /events/:id (owner, admin) - multipart
router.put(
  '/:id',
  authenticate,
  requireRole('organizer', 'admin'),
  validate({ params: idParamSchema }),
  uploadPoster,
  validate({ body: updateEventSchema }),
  asyncHandler(updateEvent)
);

// 6. POST /events/:id/cancel (owner, admin)
router.post(
  '/:id/cancel',
  authenticate,
  requireRole('organizer', 'admin'),
  validate({ params: idParamSchema }),
  asyncHandler(cancelEvent)
);

// 7. DELETE /events/:id (owner, admin)
router.delete(
  '/:id',
  authenticate,
  requireRole('organizer', 'admin'),
  validate({ params: idParamSchema }),
  asyncHandler(deleteEvent)
);

// 8. GET /events/:id/stats (owner, admin)
router.get(
  '/:id/stats',
  authenticate,
  requireRole('organizer', 'admin'),
  validate({ params: idParamSchema }),
  asyncHandler(getEventStats)
);

export default router;
