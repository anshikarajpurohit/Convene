import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export async function seedAdmin() {
  const existingAdmin = await User.findOne({ email: env.ADMIN_EMAIL.toLowerCase().trim() });
  if (existingAdmin) {
    console.log(`ℹ️ Admin already exists: ${existingAdmin.email}`);
    return existingAdmin;
  }

  const passwordHash = await User.hashPassword(env.ADMIN_PASSWORD);
  const admin = await User.create({
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL.toLowerCase().trim(),
    passwordHash,
    role: 'admin',
    isActive: true
  });

  console.log(`✅ Admin created successfully: ${admin.email}`);
  return admin;
}

export async function runSeed() {
  await connectDB();
  console.log('🌱 Starting seed...');

  try {
    await seedAdmin();
    console.log('✨ Seed completed successfully.');
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

// If executed directly from command line
if (process.argv[1]?.endsWith('seed.js')) {
  runSeed();
}
