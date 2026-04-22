import 'server-only';

import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import AdminCredential from '@/models/AdminCredential';
import { sanitizeString } from '@/lib/security';

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;

function normalizeUsername(username: string) {
  return sanitizeString(username, { collapseWhitespace: true, maxLength: 64 });
}

function isBcryptHash(value: string) {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

function isLockoutActive(lockUntil: Date | null | undefined) {
  return Boolean(lockUntil && lockUntil.getTime() > Date.now());
}

function getRetryAfterSeconds(lockUntil: Date) {
  return Math.max(1, Math.ceil((lockUntil.getTime() - Date.now()) / 1000));
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

async function recordFailedLoginAttempt(credential: InstanceType<typeof AdminCredential>) {
  const now = new Date();
  const currentFailures = typeof credential.failedLoginAttempts === 'number'
    ? credential.failedLoginAttempts
    : 0;
  const withinWindow =
    credential.lastFailedLoginAt &&
    now.getTime() - credential.lastFailedLoginAt.getTime() <= LOGIN_WINDOW_MS;

  credential.failedLoginAttempts = withinWindow ? currentFailures + 1 : 1;
  credential.lastFailedLoginAt = now;

  if (credential.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
    credential.lockUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
  }

  await credential.save();

  return {
    failedLoginAttempts: credential.failedLoginAttempts,
    lockUntil: credential.lockUntil,
  };
}

async function resetFailedLoginState(credential: InstanceType<typeof AdminCredential>) {
  if (
    (credential.failedLoginAttempts ?? 0) === 0 &&
    !credential.lastFailedLoginAt &&
    !credential.lockUntil
  ) {
    return;
  }

  credential.failedLoginAttempts = 0;
  credential.lastFailedLoginAt = null;
  credential.lockUntil = null;
  await credential.save();
}

export async function authenticateAdminCredential(username: string, password: string) {
  const credential = await ensureAdminCredential();
  if (isLockoutActive(credential.lockUntil)) {
    return {
      success: false as const,
      code: 'LOCKED' as const,
      retryAfterSeconds: getRetryAfterSeconds(credential.lockUntil as Date),
      lockUntil: credential.lockUntil,
    };
  }

  const validUsername = credential.username === normalizeUsername(username);
  const validPassword = validUsername && await bcrypt.compare(password, credential.passwordHash);

  if (!validPassword) {
    const { lockUntil } = await recordFailedLoginAttempt(credential);
    if (lockUntil && isLockoutActive(lockUntil)) {
      return {
        success: false as const,
        code: 'LOCKED' as const,
        retryAfterSeconds: getRetryAfterSeconds(lockUntil),
        lockUntil,
      };
    }

    return {
      success: false as const,
      code: 'INVALID_CREDENTIALS' as const,
    };
  }

  await resetFailedLoginState(credential);
  return {
    success: true as const,
    credential,
  };
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

  credential.failedLoginAttempts = 0;
  credential.lastFailedLoginAt = null;
  credential.lockUntil = null;
  await credential.save();
  return {
    username: credential.username,
    passwordChanged: Boolean(input.newPassword),
  };
}
