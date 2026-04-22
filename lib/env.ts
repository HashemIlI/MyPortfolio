function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getJwtSecret(): string {
  const value = readEnv('JWT_SECRET');
  if (value) return value;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }

  return 'dev-only-jwt-secret-change-me';
}
