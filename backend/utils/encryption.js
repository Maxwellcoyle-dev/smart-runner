// Encryption utilities for Garmin credentials
const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Get encryption key from environment variable
 * @returns {Buffer} 32-byte encryption key
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable not set");
  }
  // Key should be 32 bytes (256 bits) for AES-256
  // If provided as hex string, convert to buffer
  if (key.length === 64) {
    // 64 hex characters = 32 bytes
    return Buffer.from(key, "hex");
  }
  // If not hex, use as-is (but warn)
  if (key.length !== 32) {
    console.warn(
      "ENCRYPTION_KEY should be 32 bytes (64 hex characters). Current length:",
      key.length
    );
  }
  return Buffer.from(key, "utf8").slice(0, 32);
}

/**
 * Encrypt text using AES-256-GCM
 * @param {string} text - Text to encrypt
 * @returns {string} Base64-encoded encrypted data
 */
function encrypt(text) {
  if (!text) {
    throw new Error("Cannot encrypt empty text");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Combine: salt + iv + tag + encrypted data
  const combined = Buffer.concat([salt, iv, tag, encrypted]);

  return combined.toString("base64");
}

/**
 * Decrypt text using AES-256-GCM
 * @param {string} encryptedData - Base64-encoded encrypted data
 * @returns {string} Decrypted text
 */
function decrypt(encryptedData) {
  if (!encryptedData) {
    throw new Error("Cannot decrypt empty data");
  }

  const key = getEncryptionKey();
  const data = Buffer.from(encryptedData, "base64");

  // Extract components
  const salt = data.slice(0, SALT_LENGTH);
  const iv = data.slice(SALT_LENGTH, TAG_POSITION);
  const tag = data.slice(TAG_POSITION, ENCRYPTED_POSITION);
  const encrypted = data.slice(ENCRYPTED_POSITION);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

module.exports = { encrypt, decrypt };

