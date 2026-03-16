import { z } from 'zod';

export const loginCredentialsSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  email: z.string().email().optional(),
  additionalInfo: z.record(z.string()).optional(),
});

export const accountCreateSchema = z.object({
  gameId: z.string().min(1, 'Game is required'),
  level: z.number().int().positive().optional(),
  diamond: z.number().int().min(0).default(0),
  server: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().transform(val => val || undefined),
  characterIds: z.array(z.string()).min(1, 'At least one character is required'),
  basePrice: z.number().positive('Base price must be positive'),
  credentials: loginCredentialsSchema,
});

export const accountUpdateSchema = z.object({
  level: z.number().int().positive().optional(),
  diamond: z.number().int().min(0).optional(),
  server: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  characterIds: z.array(z.string()).min(1).optional(),
  basePrice: z.number().positive().optional(),
  credentials: loginCredentialsSchema.optional(),
});

export const accountFilterSchema = z.object({
  gameId: z.string().optional(),
  characterIds: z.array(z.string()).optional(),
  diamondMin: z.number().int().min(0).optional(),
  diamondMax: z.number().int().min(0).optional(),
  levelMin: z.number().int().positive().optional(),
  levelMax: z.number().int().positive().optional(),
  server: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export type LoginCredentialsInput = z.infer<typeof loginCredentialsSchema>;
export type AccountCreateInput = z.infer<typeof accountCreateSchema>;
export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;
export type AccountFilterInput = z.infer<typeof accountFilterSchema>;
