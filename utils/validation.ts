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
