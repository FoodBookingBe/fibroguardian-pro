import { z, ZodError, ZodSchema } from 'zod';
import { ReflectieFormData, TaskLog } from '@/types';

/**
 * Validates and sanitizes API input data using Zod schemas.
 * This function provides a consistent way to validate and sanitize input data
 * across all API routes, with detailed error messages.
 * 
 * @param data The unknown input data to validate
 * @param schema The Zod schema to validate against
 * @returns An object with either the validated data or an error message
 * 
 * @example
 * // Define a schema
 * const userSchema = z.object({
 *   name: z.string().min(2).max(50),
 *   email: z.string().email(),
 *   age: z.number().int().positive().optional()
 * });
 * 
 * // Validate input
 * const { data, error } = validateAndSanitizeApiInput(req.body, userSchema);
 * if (error) {
 *   return NextResponse.json(formatApiError(400, error), { status: 400 });
 * }
 * // Use validated data
 * const _user = data;
 */
export function validateAndSanitizeApiInput<T>(
  data: unknown, 
  schema: ZodSchema<T>
): { data: T | null; error: string | null } {
  try {
    const validatedData = schema.parse(data);
    return { data: validatedData, error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessage = error.errors.map(e => 
        `${e.path.join('.') || 'input'}: ${e.message}`
      ).join('; ');
      return { data: null, error: errorMessage };
    }
    // Catch other unexpected errors
    console.error("Validation error (non-Zod):", error);
    return { data: null, error: 'Invalid input data due to an unexpected error.' };
  }
}

/**
 * Common Zod schemas for reuse across the application
 */
export const commonSchemas = {
  /**
   * Schema for validating date strings in ISO format (YYYY-MM-DD)
   */
  isoDateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in ISO format (YYYY-MM-DD)"
  }),

  /**
   * Schema for validating score ranges (0-20)
   */
  scoreRange: z.number().int().min(0).max(20).optional(),

  /**
   * Schema for validating UUIDs
   */
  uuid: z.string().uuid({
    message: "Invalid UUID format"
  }),

  /**
   * Schema for validating email addresses
   */
  email: z.string().email({
    message: "Invalid email address"
  }),

  /**
   * Schema for validating pagination parameters
   */
  pagination: z.object({
    limit: z.number().int().positive().default(20),
    offset: z.number().int().nonnegative().default(0)
  }).optional()
};

/**
 * Specific schemas for different API endpoints
 */
export const _apiSchemas = {
  /**
   * Schema for validating reflectie input
   */
  reflectie: z.object({
    datum: commonSchemas.isoDateString,
    stemming: z.string().optional(),
    notitie: z.string().optional(),
    pijn_score: commonSchemas.scoreRange,
    vermoeidheid_score: commonSchemas.scoreRange
  }),

  /**
   * Schema for validating task log input
   */
  taskLog: z.object({
    task_id: commonSchemas.uuid,
    start_tijd: z.string().datetime({
      message: "Start tijd moet een geldige ISO datetime string zijn"
    }),
    eind_tijd: z.string().datetime({
      message: "Eind tijd moet een geldige ISO datetime string zijn"
    }).optional(),
    energie_voor: commonSchemas.scoreRange,
    energie_na: commonSchemas.scoreRange,
    pijn_score: commonSchemas.scoreRange,
    vermoeidheid_score: commonSchemas.scoreRange,
    stemming: z.string().optional(),
    hartslag: z.number().int().positive().optional(),
    notitie: z.string().optional()
  }),
  
  /**
   * Schema for validating task log creation (minimal required fields)
   */
  taskLogCreate: z.object({
    task_id: commonSchemas.uuid,
    start_tijd: z.string().datetime({
      message: "Start tijd moet een geldige ISO datetime string zijn"
    }),
    energie_voor: commonSchemas.scoreRange.optional()
  })
};
