import 'server-only';

import mongoose from 'mongoose';

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error('Missing required environment variable: MONGODB_URI');
  }
  return uri;
}

export function getMongoTarget(): string {
  try {
    const uri = new URL(getMongoUri());
    return uri.host || 'configured MongoDB deployment';
  } catch {
    return 'configured MongoDB deployment';
  }
}

// Cache the connection across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const cached = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cached;

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(getMongoUri(), {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    }).catch((error: unknown) => {
      cached.promise = null;

      console.error('[MongoDB] Connection failed');
      console.error(error);

      throw error;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export { connectDB };
export default connectDB;
