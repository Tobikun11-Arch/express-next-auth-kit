import type {NormalizedApiError} from './types';

function isNormalizedApiError(error: unknown): error is NormalizedApiError {
  return (
    !!error &&
    typeof error === 'object' &&
    'message' in error &&
    'code' in error &&
    typeof (error as Record<string, unknown>).message === 'string' &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}

function hasStringMessage(error: unknown): error is {message: string} {
  return (
    !!error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function getDuplicateKeyFriendlyMessage(rawMessage: string): string | null {
  const msg = rawMessage.toLowerCase();

  if (!msg.includes('e11000') && !msg.includes('duplicate key')) return null;

  if (
    msg.includes('phonenumber') ||
    msg.includes('phoneNumber_1'.toLowerCase())
  ) {
    return 'Phone number already exists.';
  }

  if (msg.includes('email') || msg.includes('email_1')) {
    return 'Email already exists.';
  }

  return 'Account already exists.';
}

export function getFriendlyErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (!error) return fallback;

  if (isNormalizedApiError(error)) {
    switch (error.code) {
      case 'EMAIL_EXISTS':
        return 'Email already exists.';
      case 'PHONE_EXISTS':
        return 'Phone number already exists.';
      case 'INVALID_CREDENTIALS':
        return 'Invalid email/phone number or password.';
      case 'NOT_VERIFIED':
        return 'Your email is not verified yet. Please verify your email to continue.';
      case 'INVALID_CODE':
        return 'Invalid verification code.';
      case 'EXPIRED_CODE':
        return 'Verification code expired or invalid. Please request a new code.';
      case 'USER_NOT_FOUND':
        return 'User not found.';
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection and try again.';
      default:
        break;
    }

    const duplicateKeyMessage = getDuplicateKeyFriendlyMessage(error.message);
    if (duplicateKeyMessage) return duplicateKeyMessage;

    if (error.message.includes('at least 8 character')) {
      return 'Password must be at least 8 characters.';
    }

    if (error.message.toLowerCase().includes('invalid email')) {
      return 'Please enter a valid email address.';
    }

    return error.message || fallback;
  }

  if (hasStringMessage(error)) {
    const msg = error.message;

    const duplicateKeyMessage = getDuplicateKeyFriendlyMessage(msg);
    if (duplicateKeyMessage) return duplicateKeyMessage;

    if (msg.includes('at least 8 character')) {
      return 'Password must be at least 8 characters.';
    }
    return msg;
  }

  return fallback;
}
