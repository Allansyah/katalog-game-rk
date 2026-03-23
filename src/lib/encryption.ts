import crypto from "crypto";

// AES-256-CBC encryption for credentials
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16; // For AES, this is always 16

// Get encryption key from environment or generate a default one
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (key) {
    // If key is provided as hex string, convert to buffer
    if (key.length === 64) {
      return Buffer.from(key, "hex");
    }
    // If key is provided as string, hash it to get 32 bytes
    return crypto.createHash("sha256").update(key).digest();
  }
  // Fallback for development - should not be used in production
  console.warn(
    "WARNING: Using default encryption key. Set ENCRYPTION_KEY in environment!"
  );
  return crypto
    .createHash("sha256")
    .update("default-encryption-key-change-in-production")
    .digest();
}

/**
 * Login credentials interface
 * All fields are stored encrypted in the database
 */
export interface LoginCredentials {
  // Primary credentials
  username?: string;
  password?: string;

  // Email credentials
  email?: string;
  emailPassword?: string;

  // Security questions
  secretQuestion?: string;
  secretAnswer?: string;

  // Personal info
  firstName?: string;
  lastName?: string;
  accountCountry?: string;
  dateOfBirth?: string; // Format: YYYY-MM-DD or any format

  // Additional notes
  additionalNote?: string;

  // Legacy field for backward compatibility
  additionalInfo?: Record<string, string>;
}

export interface EncryptedData {
  iv: string;
  encryptedData: string;
}

/**
 * Encrypt login credentials using AES-256-CBC
 */
export function encryptCredentials(credentials: LoginCredentials): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const jsonString = JSON.stringify(credentials);
  let encrypted = cipher.update(jsonString, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Combine IV and encrypted data
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt login credentials
 */
export function decryptCredentials(encryptedString: string): LoginCredentials {
  const key = getEncryptionKey();
  const parts = encryptedString.split(":");

  if (parts.length !== 2) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const encryptedData = parts[1];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
}

/**
 * Generate a random alphanumeric string
 */
function generateRandomAlphanumeric(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars: I, O, 0, 1
  let result = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}

/**
 * Generate a unique public ID for an account
 * Format: GAMECODE-XXXXX-XXX
 * Example: WW-A7B2K-X9M
 *
 * - GAMECODE: 2-3 letter game code (uppercase)
 * - XXXXX: 5 random alphanumeric characters
 * - XXX: 3 random alphanumeric characters
 */
export function generatePublicId(gameCode: string): string {
  const code = gameCode.toUpperCase().substring(0, 3);
  const middle = generateRandomAlphanumeric(5);
  const suffix = generateRandomAlphanumeric(3);
  return `${code}-${middle}-${suffix}`;
}

/**
 * Generate a random password
 */
export function generateRandomPassword(length: number = 12): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
}
