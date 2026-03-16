import { z } from 'zod';

export const csvRowSchema = z.object({
  gameId: z.string().min(1, 'Game ID is required'),
  level: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
  diamond: z.string().transform(val => val ? parseInt(val) : 0).default('0'),
  server: z.string().optional(),
  gender: z.string().optional(),
  characterNames: z.string().min(1, 'At least one character name is required'), // Comma-separated
  basePrice: z.string().transform(val => parseFloat(val)),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  email: z.string().email().optional(),
});

export const bulkUploadSchema = z.array(csvRowSchema);

export type CSVRowInput = z.infer<typeof csvRowSchema>;
