/**
 * Centrale tool voor invoervalidatie en sanitatie
 * Beschermt tegen XSS, injectieaanvallen, en andere beveiligingsproblemen
 */

// RegEx patronen voor validatie
const patterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  postcode: /^\d{4}$/,                      // Belgische postcodes zijn 4 cijfers
  telefoon: /^(\+32|0)(\d{1})(\d{8})$/,     // Belgisch telefoonnummer
  datum: /^\d{4}-\d{2}-\d{2}$/,             // YYYY-MM-DD
  tijd: /^\d{2}:\d{2}(:\d{2})?$/,           // HH:MM of HH:MM:SS
  getal: /^\d+(\.\d+)?$/,                   // Geheel of decimaal getal
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  alfanumeriek: /^[a-zA-Z0-9]+$/,
  // Adjusted for ES5 compatibility (less precise for Unicode, but broadly allows common text chars)
  tekst: /^[a-zA-Z0-9\s!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]+$/,
};

export interface ValidationResult { // Exporting for use in other modules if needed
  isValid: boolean;
  message?: string;
}

// Validatiefuncties voor verschillende soorten invoer
export const validate = {
  email: (value: string): ValidationResult => {
    if (!value) return { isValid: false, message: 'E-mailadres is verplicht.' }; // Consistent message
    if (!patterns.email.test(value)) {
      return { isValid: false, message: 'Ongeldig e-mailadres formaat.' };
    }
    return { isValid: true };
  },

  postcode: (value: string): ValidationResult => {
    if (!value) return { isValid: true }; // Assuming postcode is optional
    if (!patterns.postcode.test(value)) {
      return { isValid: false, message: 'Ongeldige postcode (vereist 4 cijfers).' };
    }
    return { isValid: true };
  },

  password: (value: string): ValidationResult => {
    if (!value) return { isValid: false, message: 'Wachtwoord is verplicht.' };
    if (value.length < 8) {
      return { isValid: false, message: 'Wachtwoord moet minimaal 8 tekens lang zijn.' };
    }
    
    let score = 0;
    if (/[a-z]/.test(value)) score++; 
    if (/[A-Z]/.test(value)) score++; 
    if (/\d/.test(value)) score++;    
    if (/[^a-zA-Z0-9\s]/.test(value)) score++; // Check for non-alphanumeric, non-whitespace
    
    if (score < 3) { // Requiring at least 3 out of 4 categories (e.g. lowercase, uppercase, number OR lowercase, number, special)
      return { isValid: false, message: 'Wachtwoord is te zwak. Gebruik een combinatie van hoofdletters, kleine letters, cijfers en speciale tekens.' };
    }
    
    return { isValid: true };
  },

  date: (value: string): ValidationResult => {
    if (!value) return { isValid: true }; // Assuming date is optional
    if (!patterns.datum.test(value)) {
      return { isValid: false, message: 'Ongeldige datumnotatie (gebruik JJJJ-MM-DD).' };
    }
    const date = new Date(value);
    // Check if the date string itself was valid by comparing constructed date back to input parts
    const [year, month, day] = value.split('-').map(Number);
    if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day || isNaN(date.getTime())) {
      return { isValid: false, message: 'Ongeldige datum.' };
    }
    return { isValid: true };
  },

  number: (value: string | number | undefined | null, min?: number, max?: number): ValidationResult => {
    if (value === undefined || value === null || value === '') return { isValid: true }; // Optional
    const num = Number(value);
    
    if (isNaN(num)) {
      return { isValid: false, message: 'Voer een geldig getal in.' };
    }
    if (min !== undefined && num < min) {
      return { isValid: false, message: `Getal moet minimaal ${min} zijn.` };
    }
    if (max !== undefined && num > max) {
      return { isValid: false, message: `Getal mag maximaal ${max} zijn.` };
    }
    return { isValid: true };
  },

  text: (value: string | undefined | null, options?: { minLength?: number; maxLength?: number; required?: boolean, pattern?: RegExp, patternMessage?: string }): ValidationResult => {
    const { minLength, maxLength, required = false, pattern, patternMessage } = options || {};

    if (required && (value === undefined || value === null || value.trim() === '')) {
        return { isValid: false, message: 'Dit veld is verplicht.' };
    }
    if (!value && !required) return { isValid: true }; // Optional and empty is fine
    if (!value) return { isValid: false, message: 'Ongeldige invoer.'}; // Should not happen if required is handled

    if (minLength !== undefined && value.length < minLength) {
      return { isValid: false, message: `Tekst moet minimaal ${minLength} tekens bevatten.` };
    }
    if (maxLength !== undefined && value.length > maxLength) {
      return { isValid: false, message: `Tekst mag maximaal ${maxLength} tekens bevatten.` };
    }
    if (pattern && !pattern.test(value)) {
        return { isValid: false, message: patternMessage || 'Ongeldig formaat.' };
    }
    // Basic check against potentially harmful characters if no specific pattern is given
    // This is a very broad check and might be too restrictive.
    // if (!patterns.tekst.test(value)) {
    //   return { isValid: false, message: 'Ongeldige tekens gebruikt.' };
    // }
    return { isValid: true };
  }
};

export const sanitize = {
  html: (value: string | undefined | null): string => {
    if (!value) return '';
    // Order matters: & first
    return value
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#x27;') 
      .replace(/\//g, '&#x2F;');
  },

  // General input sanitization: trim and remove control characters (except common whitespace like space, tab, newline)
  input: (value: string | undefined | null): string => {
    if (!value) return '';
    // Remove control characters except for tab, newline, carriage return
    // \p{C} matches all control characters. [^\S\r\n\t] matches non-whitespace excluding \r, \n, \t.
    // This regex aims to remove invisible or problematic control chars.
    return value.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
  },

  queryParam: (value: string | undefined | null): string => {
    if (!value) return '';
    return value.replace(/[^a-zA-Z0-9\-_.~]/g, ''); // Allow more common URL characters
  },

  // Basic SQL sanitization (parameterized queries are always preferred!)
  sql: (value: string | number | undefined | null): string => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'number') return String(value); // Numbers are generally safe
    // For strings, escape single quotes by doubling them up. This is a very basic measure.
    // WARNING: This is NOT a substitute for parameterized queries/prepared statements.
    return value.replace(/'/g, "''");
  }
};

// Validates a complete form and returns all errors
export function validateForm<T extends Record<string, any>>(
  formData: T,
  validationRules: Partial<Record<keyof T, (value: any, formData?: T) => ValidationResult>> // formData optional for cross-field validation
): Record<string, string | undefined> { // Simpler return type
  const errors: Record<string, string | undefined> = {};
  
  for (const field in validationRules) {
    if (Object.prototype.hasOwnProperty.call(validationRules, field)) {
      const rule = validationRules[field as keyof T];
      if (rule) {
        const result = rule(formData[field as keyof T], formData);
        if (!result.isValid) {
          errors[field] = result.message;
        }
      }
    }
  }
  return errors;
}