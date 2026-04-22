type ApiErrorDetails = {
  message: string;
  status: number;
};

type ErrorWithCode = Error & { code?: number; errors?: Record<string, { message?: string }> };

function collectValidationMessages(error: ErrorWithCode): string[] {
  if (!error.errors) return [];
  return Object.values(error.errors)
    .map((entry) => entry?.message)
    .filter((message): message is string => Boolean(message));
}

export function getApiErrorDetails(error: unknown, fallbackMessage: string): ApiErrorDetails {
  if (!(error instanceof Error)) {
    return { message: fallbackMessage, status: 500 };
  }

  const err = error as ErrorWithCode;

  if (err.name === 'ValidationError') {
    const messages = collectValidationMessages(err);
    return {
      message: messages.length > 0 ? messages.join(' ') : 'Validation failed.',
      status: 400,
    };
  }

  if (err.code === 11000) {
    return {
      message: 'A project with this slug already exists. Choose a different slug.',
      status: 409,
    };
  }

  if (err.name === 'CastError') {
    return { message: 'Invalid project identifier.', status: 400 };
  }

  if (err.name === 'MongooseServerSelectionError' || /ECONNREFUSED/i.test(err.message)) {
    return {
      message: err.message || fallbackMessage,
      status: 503,
    };
  }

  return { message: err.message || fallbackMessage, status: 500 };
}
