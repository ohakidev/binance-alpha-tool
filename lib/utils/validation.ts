import { z } from "zod";

// API validation schemas
export const airdropSchema = z.object({
  name: z.string().min(1).max(100),
  symbol: z.string().min(1).max(20),
  chain: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  eligibility: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  snapshotDate: z.string().datetime().optional(),
  claimStartDate: z.string().datetime().optional(),
  claimEndDate: z.string().datetime().optional(),
  estimatedValue: z.number().positive().optional(),
  websiteUrl: z.string().url().optional(),
  twitterUrl: z.string().url().optional(),
});

export const userSchema = z.object({
  name: z.string().min(1).max(100),
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  telegramId: z.string().max(50).optional(),
});

export const incomeEntrySchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(1).max(10),
  source: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  date: z.string().datetime(),
});

// Validation helper
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// Safe error message (don't leak internal details)
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    const issues = error.issues
      .map((e: { message: string }) => e.message)
      .join(", ");
    return `Validation error: ${issues}`;
  }

  if (error instanceof Error) {
    // Only expose safe error messages in production
    if (process.env.NODE_ENV === "production") {
      return "An error occurred";
    }
    return error.message;
  }

  return "Unknown error";
}

// Sanitize user input
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential XSS tags
    .substring(0, 1000); // Limit length
}

// Validate wallet address
export function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Validate telegram ID
export function isValidTelegramId(id: string): boolean {
  return /^\d{1,15}$/.test(id);
}
