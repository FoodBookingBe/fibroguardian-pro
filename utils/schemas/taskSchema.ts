import { z } from 'zod';

// Define a Zod schema for creating a new task
// This schema should align with the 'Insert' type for the 'tasks' table in types/database.ts
// and the expected payload for the POST /api/tasks endpoint.
export const createTaskSchema = z.object({
  user_id: z.string().uuid({ message: 'Ongeldige gebruikers-ID (UUID).' }),
  type: z.string().min(1, { message: 'Type is verplicht.' }),
  titel: z.string().min(1, { message: 'Titel is verplicht.' }),
  beschrijving: z.string().nullable().optional(),
  duur: z.number().int().positive('Duur moet een positief getal zijn.').nullable().optional(),
  hartslag_doel: z.number().int().positive('Hartslag doel moet een positief getal zijn.').nullable().optional(),
  herhaal_patroon: z.string().nullable().optional(),
  dagen_van_week: z.array(z.string()).nullable().optional(),
  metingen: z.array(z.string()).nullable().optional(),
  notities: z.string().nullable().optional(),
  labels: z.array(z.string()).nullable().optional(),
  specialist_id: z.string().uuid({ message: 'Ongeldige specialist-ID (UUID).' }).nullable().optional(),
  // created_at and updated_at are typically handled by the database
});

// Schema for updating a task (all fields optional)
export const updateTaskSchema = z.object({
  user_id: z.string().uuid({ message: 'Ongeldige gebruikers-ID (UUID).' }).optional(),
  type: z.string().min(1, { message: 'Type is verplicht.' }).optional(),
  titel: z.string().min(1, { message: 'Titel is verplicht.' }).optional(),
  beschrijving: z.string().nullable().optional(),
  duur: z.number().int().positive('Duur moet een positief getal zijn.').nullable().optional(),
  hartslag_doel: z.number().int().positive('Hartslag doel moet een positief getal zijn.').nullable().optional(),
  herhaal_patroon: z.string().nullable().optional(),
  dagen_van_week: z.array(z.string()).nullable().optional(),
  metingen: z.array(z.string()).nullable().optional(),
  notities: z.string().nullable().optional(),
  labels: z.array(z.string()).nullable().optional(),
  specialist_id: z.string().uuid({ message: 'Ongeldige specialist-ID (UUID).' }).nullable().optional(),
}).partial(); // All fields are optional for updates
