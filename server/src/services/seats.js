import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { User } from '../models/User.js';
import crypto from 'crypto';
import { sendWaitlistPromotedEmail } from './mailer.js';

export async function promoteWaitlist(eventId) {
  let promotedCount = 0;

  while (true) {
    const now = new Date();

    // 1. Atomically try to claim a seat on the event
    const event = await Event.findOneAndUpdate(
      {
        _id: eventId,
        status: 'published',
        startTime: { $gt: now },
        $expr: { $lt: ['$confirmedCount', '$capacity'] }
      },
      { $inc: { confirmedCount: 1 } },
      { new: true }
    );

    if (!event) {
      // No seats available
      break;
    }

    // 2. Atomically claim the oldest waitlisted registration (FIFO order)
    const newQrToken = crypto.randomBytes(32).toString('hex');
    const registration = await Registration.findOneAndUpdate(
      { event: eventId, status: 'waitlisted' },
      {
        status: 'confirmed',
        qrToken: newQrToken,
        $unset: { queuedAt: 1 }
      },
      {
        sort: { queuedAt: 1 },
        new: true
      }
    ).populate('user');

    if (!registration) {
      // No waitlisted users found; compensate by releasing the claimed seat
      await Event.findByIdAndUpdate(eventId, { $inc: { confirmedCount: -1 } });
      break;
    }

    promotedCount++;
    // Send email to the promoted registrant
    if (registration.user) {
      sendWaitlistPromotedEmail(registration.user, event);
    }
  }

  return promotedCount;
}
