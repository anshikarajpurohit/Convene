import cron from 'node-cron';

export function startReminderCron() {
  // Runs every hour at minute 0
  return cron.schedule('0 * * * *', async () => {
    try {
      await processUpcomingEventReminders();
    } catch (err) {
      console.error('Reminder cron error:', err);
    }
  });
}

export async function processUpcomingEventReminders() {
  // Logic will be expanded in Phase 5 with Event and Registration models
  return { processed: 0 };
}
