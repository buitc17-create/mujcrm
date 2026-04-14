/**
 * AES-256-GCM šifrování SMTP hesel
 *
 * Formát uloženého hesla: "enc:v1:{base64(iv[12] + authTag[16] + ciphertext)}"
 * Zpětná kompatibilita: pokud hodnota NEZAČÍNÁ "enc:v1:", je považována za plaintext
 * a vrácena bez úprav (stará data před nasazením šifrování).
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;   // GCM doporučený nonce
const TAG_LENGTH = 16;  // GCM auth tag
const PREFIX = 'enc:v1:';

function getKey(): Buffer {
  const hex = process.env.EMAIL_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error('Chybí env proměnná EMAIL_ENCRYPTION_KEY');
  }
  const buf = Buffer.from(hex, 'hex');
  if (buf.length !== 32) {
    throw new Error('EMAIL_ENCRYPTION_KEY musí být přesně 64 hex znaků (32 bytes)');
  }
  return buf;
}

/**
 * Zašifruje plaintext heslo.
 * Vrací řetězec ve formátu "enc:v1:{base64}".
 */
export function encryptPassword(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Spojíme iv + authTag + ciphertext do jednoho bufferu
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return PREFIX + combined.toString('base64');
}

/**
 * Dešifruje heslo uložené ve formátu "enc:v1:{base64}".
 * Pokud hodnota NEZAČÍNÁ prefixem (plaintext ze starých záznamů),
 * vrátí ji beze změny — zpětná kompatibilita.
 */
export function decryptPassword(stored: string): string {
  if (!stored || !stored.startsWith(PREFIX)) {
    // Starý plaintext záznam — vrátíme tak jak je
    return stored;
  }

  const key = getKey();
  const combined = Buffer.from(stored.slice(PREFIX.length), 'base64');

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return (
    decipher.update(ciphertext).toString('utf8') +
    decipher.final('utf8')
  );
}

/** Vrací true pokud je heslo zašifrováno naším systémem */
export function isEncrypted(stored: string): boolean {
  return typeof stored === 'string' && stored.startsWith(PREFIX);
}
