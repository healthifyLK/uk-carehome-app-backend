import * as crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key', 'utf-8');
const iv = Buffer.from(process.env.ENCRYPTION_IV || 'your-16-char-iv!', 'utf-8');

export function encryptField(text: string): string {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decryptField(text: string): string {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(text, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}