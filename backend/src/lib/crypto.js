import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12; // GCM recommended

function getKey() {
  const secret = process.env.ADMIN_KEY_SECRET || '';
  if (!secret) throw new Error('ADMIN_KEY_SECRET not set');
  return crypto.createHash('sha256').update(secret).digest();
}

export function encrypt(text) {
  if (text == null || text === '') return text;
  const iv = crypto.randomBytes(IV_LEN);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decrypt(payload) {
  if (!payload) return payload;
  try {
    const raw = Buffer.from(payload, 'base64');
    const iv = raw.subarray(0, IV_LEN);
    const tag = raw.subarray(IV_LEN, IV_LEN + 16);
    const data = raw.subarray(IV_LEN + 16);
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    return dec.toString('utf8');
  } catch {
    return null; // decryption failed
  }
}
