/**
 * Sanitizes input by escaping HTML characters.
 * @param input The string to sanitize.
 * @returns The sanitized string.
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (input === undefined || input === null) return '';
  return input
    .replace(/&/g, '&') // Must be first
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;') // Or '''
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates an email address.
 * @param email The email string to validate.
 * @returns True if the email is valid, false otherwise.
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

interface PasswordValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validates a password based on common criteria.
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * @param password The password string to validate.
 * @returns An object with a boolean 'valid' and an optional 'message'.
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  if (!password) {
    return { valid: false, message: 'Wachtwoord is verplicht.' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Wachtwoord moet minimaal 8 tekens lang zijn.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Wachtwoord moet minimaal één hoofdletter bevatten.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Wachtwoord moet minimaal één kleine letter bevatten.' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Wachtwoord moet minimaal één cijfer bevatten.' };
  }
  if (!/[^a-zA-Z0-9]/.test(password)) { // Checks for non-alphanumeric characters
    return { valid: false, message: 'Wachtwoord moet minimaal één speciaal teken bevatten.' };
  }
  return { valid: true, message: 'Wachtwoord is sterk' };
};

/**
 * Validates if a date string is a valid date.
 * @param dateStr The date string to validate.
 * @returns True if valid, false otherwise.
 */
export function validateDateString(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false; // Or true if optional and empty is allowed
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Validates if a duration is a positive number and within a reasonable range.
 * @param duration The duration in minutes.
 * @returns True if valid, false otherwise.
 */
export function validateDuration(duration: number | undefined | null): boolean {
  if (duration === undefined || duration === null) return true; // Assuming duration can be optional
  if (isNaN(duration) || typeof duration !== 'number') return false;
  return duration > 0 && duration <= 480; // Max 8 hours
}

/**
 * Validates if a score is within the 1-20 range (inclusive).
 * @param score The score to validate.
 * @returns True if valid, false otherwise.
 */
export function validateScoreRange(score: number | undefined | null): boolean {
  if (score === undefined || score === null) return true; // Assuming score can be optional
  if (isNaN(score) || typeof score !== 'number') return false;
  return score >= 0 && score <= 20; // Allow 0 if that's a valid "no symptom" score
}

/**
 * Validates a Belgian postal code (4 digits).
 * @param postcode The postal code string.
 * @returns True if valid, false otherwise.
 */
export function validatePostcode(postcode: string | undefined | null): boolean {
  if (!postcode) return true; // Assuming postcode can be optional
  const postcodeRegex = /^[1-9][0-9]{3}$/; // Belgian postcodes don't start with 0
  return postcodeRegex.test(postcode);
}

/**
 * Formats a date or date string to DD/MM/YYYY.
 * @param date The date or string to format.
 * @returns Formatted date string or 'N/A'.
 */
export function formatDate(date: Date | string | undefined | null): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Ongeldige datum';
  return d.toLocaleDateString('nl-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formats a date or date string to HH:MM.
 * @param date The date or string to format.
 * @returns Formatted time string or 'N/A'.
 */
export function formatTime(date: Date | string | undefined | null): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Ongeldige tijd';
  return d.toLocaleTimeString('nl-BE', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formats a date or date string to DD/MM/YYYY HH:MM.
 * @param date The date or string to format.
 * @returns Formatted date-time string or 'N/A'.
 */
export function formatDateTime(date: Date | string | undefined | null): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Ongeldige datum/tijd';
  return `${formatDate(d)} ${formatTime(d)}`;
}