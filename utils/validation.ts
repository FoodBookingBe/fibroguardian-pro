/**
 * Sanitizes input by escaping HTML characters to prevent XSS attacks.
 * @param input The string to sanitize.
 * @returns The sanitized string.
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (input === undefined || input === null) return '';
  
  // Convert to string in case a number or other type is passed
  const stringInput = String(input);
  
  return stringInput
    .replace(/&/g, '&amp;') // Must be first to avoid double-escaping
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#96;'); // Backtick for template strings
}

/**
 * Validates an email address using a more comprehensive regex.
 * This regex checks for:
 * - Proper format with @ and domain
 * - No invalid characters
 * - Proper domain structure
 * - Length limitations
 * 
 * @param email The email string to validate.
 * @returns True if the email is valid, false otherwise.
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  
  // Trim the email to remove any leading/trailing whitespace
  const trimmedEmail = email.trim();
  
  // Check length constraints
  if (trimmedEmail.length > 254) return false;
  
  // More comprehensive email regex that follows RFC 5322 standards
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  
  return emailRegex.test(trimmedEmail);
};

interface PasswordValidationResult {
  valid: boolean;
  message?: string;
  strength?: 'weak' | 'medium' | 'strong' | 'very-strong';
}

// Common passwords that should be rejected
const COMMON_PASSWORDS = [
  'password', 'wachtwoord', '123456', '12345678', 'qwerty', 'welkom', 'welkom01',
  'admin', 'letmein', 'fibroguardian', 'fibro123', 'guardian', 'password123'
];

/**
 * Validates a password based on comprehensive criteria.
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - Not a common password
 * - Provides strength indicator
 * 
 * @param password The password string to validate.
 * @returns An object with validation results including validity, message, and strength.
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  if (!password) {
    return { valid: false, message: 'Wachtwoord is verplicht.', strength: 'weak' };
  }
  
  // Check for common passwords (case insensitive)
  if (COMMON_PASSWORDS.some(commonPw => password.toLowerCase() === commonPw)) {
    return { 
      valid: false, 
      message: 'Dit wachtwoord is te vaak gebruikt. Kies een sterker wachtwoord.', 
      strength: 'weak' 
    };
  }
  
  // Basic requirements checks
  if (password.length < 8) {
    return { 
      valid: false, 
      message: 'Wachtwoord moet minimaal 8 tekens lang zijn.', 
      strength: 'weak' 
    };
  }
  
  const hasUppercase = /[A-Z]/.test(password);
  if (!hasUppercase) {
    return { 
      valid: false, 
      message: 'Wachtwoord moet minimaal één hoofdletter bevatten.', 
      strength: 'weak' 
    };
  }
  
  const hasLowercase = /[a-z]/.test(password);
  if (!hasLowercase) {
    return { 
      valid: false, 
      message: 'Wachtwoord moet minimaal één kleine letter bevatten.', 
      strength: 'weak' 
    };
  }
  
  const hasDigit = /\d/.test(password);
  if (!hasDigit) {
    return { 
      valid: false, 
      message: 'Wachtwoord moet minimaal één cijfer bevatten.', 
      strength: 'weak' 
    };
  }
  
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);
  if (!hasSpecialChar) {
    return { 
      valid: false, 
      message: 'Wachtwoord moet minimaal één speciaal teken bevatten.', 
      strength: 'weak' 
    };
  }
  
  // Calculate password strength
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong' = 'medium';
  let score = 0;
  
  // Length bonus
  if (password.length >= 12) score += 2;
  else if (password.length >= 10) score += 1;
  
  // Character variety bonus
  if (/[A-Z].*[A-Z]/.test(password)) score += 1; // At least 2 uppercase
  if (/[a-z].*[a-z].*[a-z]/.test(password)) score += 1; // At least 3 lowercase
  if (/\d.*\d/.test(password)) score += 1; // At least 2 digits
  if (/[^a-zA-Z0-9].*[^a-zA-Z0-9]/.test(password)) score += 1; // At least 2 special chars
  
  // Determine strength based on score
  if (score >= 5) strength = 'very-strong';
  else if (score >= 3) strength = 'strong';
  
  return { 
    valid: true, 
    message: strength === 'very-strong' 
      ? 'Wachtwoord is zeer sterk!' 
      : strength === 'strong' 
        ? 'Wachtwoord is sterk' 
        : 'Wachtwoord voldoet aan de minimale eisen',
    strength 
  };
};

/**
 * Validates if a date string is a valid date.
 * This function performs more thorough validation than just checking if it can be parsed.
 * 
 * @param dateStr The date string to validate.
 * @param options Optional configuration for validation
 * @returns True if valid, false otherwise.
 */
export function validateDateString(
  dateStr: string | undefined | null, 
  options: { 
    allowEmpty?: boolean; 
    minDate?: Date; 
    maxDate?: Date;
    format?: 'ISO' | 'EU' | 'US' | 'any';
  } = {}
): boolean {
  // Handle empty values based on options
  if (!dateStr || dateStr.trim() === '') {
    return options.allowEmpty === true;
  }
  
  // Default format is 'any'
  const format = options.format || 'any';
  let date: Date | null = null;
  
  // Format-specific validation
  if (format === 'ISO' || format === 'any') {
    // ISO format (YYYY-MM-DD)
    if (format === 'ISO' || /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const parts = dateStr.split('-').map(Number);
      // Check if month and day are valid
      if (parts[1] < 1 || parts[1] > 12) return false;
      
      // Get days in month (accounting for leap years)
      const daysInMonth = new Date(parts[0], parts[1], 0).getDate();
      if (parts[2] < 1 || parts[2] > daysInMonth) return false;
      
      date = new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }
  
  if ((format === 'EU' || format === 'any') && !date) {
    // European format (DD/MM/YYYY or DD-MM-YYYY)
    const euMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (euMatch) {
      const day = parseInt(euMatch[1], 10);
      const month = parseInt(euMatch[2], 10);
      const year = parseInt(euMatch[3], 10);
      
      // Check if month and day are valid
      if (month < 1 || month > 12) return false;
      
      // Get days in month (accounting for leap years)
      const daysInMonth = new Date(year, month, 0).getDate();
      if (day < 1 || day > daysInMonth) return false;
      
      date = new Date(year, month - 1, day);
    }
  }
  
  if ((format === 'US' || format === 'any') && !date) {
    // US format (MM/DD/YYYY)
    const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usMatch) {
      const month = parseInt(usMatch[1], 10);
      const day = parseInt(usMatch[2], 10);
      const year = parseInt(usMatch[3], 10);
      
      // Check if month and day are valid
      if (month < 1 || month > 12) return false;
      
      // Get days in month (accounting for leap years)
      const daysInMonth = new Date(year, month, 0).getDate();
      if (day < 1 || day > daysInMonth) return false;
      
      date = new Date(year, month - 1, day);
    }
  }
  
  // If no specific format matched, try generic parsing
  if (!date && format === 'any') {
    date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
  }
  
  // If we couldn't parse the date in any format, it's invalid
  if (!date) return false;
  
  // Check min/max constraints if provided
  if (options.minDate && date < options.minDate) return false;
  if (options.maxDate && date > options.maxDate) return false;
  
  return true;
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
