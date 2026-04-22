import 'server-only';

type PlainObject = Record<string, unknown>;

const MAX_SANITIZE_DEPTH = 8;
const DEFAULT_STRING_MAX_LENGTH = 10000;

function isPlainObject(value: unknown): value is PlainObject {
  return Boolean(value) && Object.getPrototypeOf(value) === Object.prototype;
}

export function sanitizeString(
  value: string,
  options: {
    trim?: boolean;
    maxLength?: number;
    collapseWhitespace?: boolean;
  } = {}
) {
  const { trim = true, maxLength = DEFAULT_STRING_MAX_LENGTH, collapseWhitespace = false } = options;

  let sanitized = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  if (trim) {
    sanitized = sanitized.trim();
  }
  if (collapseWhitespace) {
    sanitized = sanitized.replace(/\s+/g, ' ');
  }

  return sanitized.slice(0, maxLength);
}

export function sanitizeInput<T>(value: T, depth = 0): T {
  if (depth > MAX_SANITIZE_DEPTH) {
    return value;
  }

  if (typeof value === 'string') {
    return sanitizeString(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeInput(entry, depth + 1)) as T;
  }

  if (isPlainObject(value)) {
    const sanitizedEntries = Object.entries(value).map(([key, entry]) => [
      key,
      sanitizeInput(entry, depth + 1),
    ]);
    return Object.fromEntries(sanitizedEntries) as T;
  }

  return value;
}

export async function readSanitizedJsonObject<T extends PlainObject>(request: Request): Promise<T | null> {
  const body = await request.json().catch(() => null);
  if (!isPlainObject(body)) {
    return null;
  }

  return sanitizeInput(body) as T;
}

export function sanitizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => sanitizeString(entry))
    .filter(Boolean);
}

export function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return sanitizeString(forwardedFor.split(',')[0] ?? '', { collapseWhitespace: true, maxLength: 120 });
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return sanitizeString(realIp, { collapseWhitespace: true, maxLength: 120 });
  }

  return '';
}

export function getUserAgent(request: Request) {
  return sanitizeString(request.headers.get('user-agent') ?? '', {
    collapseWhitespace: true,
    maxLength: 512,
  });
}
