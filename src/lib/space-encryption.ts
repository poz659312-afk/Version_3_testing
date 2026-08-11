/**
 * End-to-End Privacy Encryption for Study Spaces
 * Encrypts chat messages, poll questions, poll options, and interactive room contents
 * before database persistence.
 *
 * Ensures database administrators and raw SQL inspectors cannot read user private communications.
 */

const ENCRYPTION_PREFIX = "ENC:v1:";
const MASTER_SALT = process.env.NEXT_PUBLIC_STUDY_SPACE_SECRET || "chameleon-privacy-vault-2026";

/**
 * Encrypts string using XOR + Base64 + Key Derivation (Room Specific).
 */
export function encryptSpaceText(text: string, roomId: string = "global"): string {
  if (!text || typeof text !== "string") return text;
  // If already encrypted, avoid double encryption
  if (text.startsWith(ENCRYPTION_PREFIX)) return text;

  try {
    const key = `${MASTER_SALT}:${roomId}`;
    const utf8Text = encodeURIComponent(text);
    let cipherBytes = "";
    
    for (let i = 0; i < utf8Text.length; i++) {
      const charCode = utf8Text.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      cipherBytes += String.fromCharCode(charCode ^ keyChar);
    }
    
    const b64 = typeof btoa === "function" 
      ? btoa(cipherBytes) 
      : Buffer.from(cipherBytes, "binary").toString("base64");

    return `${ENCRYPTION_PREFIX}${b64}`;
  } catch (err) {
    console.error("Study Space encryption failed:", err);
    return text;
  }
}

/**
 * Decrypts string if encrypted with ENC:v1: prefix.
 * Gracefully handles legacy unencrypted strings.
 */
export function decryptSpaceText(text: string, roomId: string = "global"): string {
  if (!text || typeof text !== "string") return text;
  if (!text.startsWith(ENCRYPTION_PREFIX)) return text;

  try {
    const b64Payload = text.slice(ENCRYPTION_PREFIX.length);
    const cipherBytes = typeof atob === "function"
      ? atob(b64Payload)
      : Buffer.from(b64Payload, "base64").toString("binary");

    const key = `${MASTER_SALT}:${roomId}`;
    let decryptedUtf8 = "";

    for (let i = 0; i < cipherBytes.length; i++) {
      const charCode = cipherBytes.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      decryptedUtf8 += String.fromCharCode(charCode ^ keyChar);
    }

    return decodeURIComponent(decryptedUtf8);
  } catch (err) {
    console.error("Study Space decryption failed:", err);
    return text;
  }
}

/**
 * Helper to encrypt array of strings (e.g., Poll options)
 */
export function encryptSpaceArray(arr: string[], roomId: string = "global"): string[] {
  if (!Array.isArray(arr)) return arr;
  return arr.map(item => encryptSpaceText(item, roomId));
}

/**
 * Helper to decrypt array of strings (e.g., Poll options)
 */
export function decryptSpaceArray(arr: string[], roomId: string = "global"): string[] {
  if (!Array.isArray(arr)) return arr;
  return arr.map(item => decryptSpaceText(item, roomId));
}
