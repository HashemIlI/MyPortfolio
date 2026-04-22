const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('Missing .env.local');
  }

  const envText = fs.readFileSync(envPath, 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const index = trimmed.indexOf('=');
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function main() {
  const username = process.argv[2];
  const newPassword = process.argv[3];

  if (!username || !newPassword) {
    throw new Error('Usage: node scripts/reset-admin-password.cjs <username> <new-password>');
  }

  if (newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters.');
  }

  loadEnvFile();

  if (!process.env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI in .env.local');
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  const collection = mongoose.connection.db.collection('admincredentials');
  const existing = await collection.findOne({ username: username.trim() });
  if (!existing) {
    throw new Error(`Admin credential not found for username: ${username}`);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await collection.updateOne(
    { _id: existing._id },
    {
      $set: {
        username: username.trim(),
        passwordHash,
        updatedAt: new Date(),
      },
      $unset: { password: '' },
    }
  );

  console.log(`Reset password for admin username: ${username.trim()}`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error.message || error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
