import 'server-only';

import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import AdminCredential from '@/models/AdminCredential';

function normalizeUsername(username: string) {
  return username.trim();
}

function isBcryptHash(value: string) {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

async function migrateLegacyPasswordIfNeeded(credential: InstanceType<typeof AdminCredential>) {
  const legacyPassword = credential.get('password');
  const storedHash = typeof credential.passwordHash === 'string' ? credential.passwordHash : '';

  if (storedHash && isBcryptHash(storedHash)) {
    if (legacyPassword) {
      credential.set('password', undefined);
      await credential.save();
    }
    return credential;
  }

  const sourcePassword =
    typeof legacyPassword === 'string' && legacyPassword.trim()
      ? legacyPassword.trim()
      : storedHash.trim();

  if (!sourcePassword) {
    throw new Error('Admin credential is missing a usable password in MongoDB.');
  }

  credential.passwordHash = await bcrypt.hash(sourcePassword, 12);
  credential.set('password', undefined);
  await credential.save();

  return credential;
}

export async function ensureAdminCredential() {
  await connectDB();

  const credential = await AdminCredential.findOne().sort({ createdAt: 1 }).exec();
  if (!credential) {
    throw new Error('Admin account is not initialized in MongoDB.');
  }

  credential.username = normalizeUsername(credential.username);
  return migrateLegacyPasswordIfNeeded(credential);
}

export async function getAdminCredentialSummary() {
  const credential = await ensureAdminCredential();
  return { username: credential.username };
}

export async function validateAdminCredential(username: string, password: string) {
  const credential = await ensureAdminCredential();
  const validUsername = credential.username === normalizeUsername(username);
  if (!validUsername) return null;

  const validPassword = await bcrypt.compare(password, credential.passwordHash);
  if (!validPassword) return null;

  return credential;
}

export async function updateAdminCredential(input: {
  username: string;
  currentPassword: string;
  newPassword?: string;
}) {
  const credential = await ensureAdminCredential();

  const currentPasswordValid = await bcrypt.compare(input.currentPassword, credential.passwordHash);
  if (!currentPasswordValid) {
    throw new Error('Current password is incorrect.');
  }

  const nextUsername = normalizeUsername(input.username);
  if (!nextUsername || nextUsername.length < 3) {
    throw new Error('Username must be at least 3 characters.');
  }

  credential.username = nextUsername;

  if (input.newPassword) {
    if (input.newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters.');
    }
    credential.passwordHash = await bcrypt.hash(input.newPassword, 12);
  }

  await credential.save();
  return { username: credential.username };
}
