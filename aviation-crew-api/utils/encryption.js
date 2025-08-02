/**
 * Encryption Utilities
 * 
 * Provides encryption and decryption functions for secure data handling
 * Uses AES-256-GCM for message and file encryption
 */

const crypto = require('crypto');

// Encryption algorithm
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const TAG_LENGTH = 16; // 128 bits

/**
 * Generate a random encryption key
 * @returns {string} Base64 encoded encryption key
 */
const generateKey = () => {
    return crypto.randomBytes(KEY_LENGTH).toString('base64');
};

/**
 * Generate a random initialization vector
 * @returns {Buffer} Random IV
 */
const generateIV = () => {
    return crypto.randomBytes(IV_LENGTH);
};

/**
 * Encrypt text data
 * @param {string} text - Text to encrypt
 * @param {string} keyBase64 - Base64 encoded encryption key (optional, will generate if not provided)
 * @returns {Object} Object containing encrypted data and key
 */
const encryptText = (text, keyBase64 = null) => {
    try {
        // Generate key if not provided
        const key = keyBase64 ? Buffer.from(keyBase64, 'base64') : crypto.randomBytes(KEY_LENGTH);
        const iv = generateIV();
        
        // Create cipher
        const cipher = crypto.createCipherGCM(ALGORITHM, key, iv);
        cipher.setAAD(Buffer.from('aviation-crew-api', 'utf8')); // Additional authenticated data
        
        // Encrypt the text
        let encrypted = cipher.update(text, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        
        // Get authentication tag
        const tag = cipher.getAuthTag();
        
        return {
            encryptedContent: encrypted,
            key: key.toString('base64'),
            iv: iv.toString('base64'),
            tag: tag.toString('base64')
        };
    } catch (error) {
        throw new Error(`Encryption failed: ${error.message}`);
    }
};

/**
 * Decrypt text data
 * @param {string} encryptedContent - Base64 encoded encrypted content
 * @param {string} keyBase64 - Base64 encoded encryption key
 * @param {string} ivBase64 - Base64 encoded initialization vector
 * @param {string} tagBase64 - Base64 encoded authentication tag
 * @returns {string} Decrypted text
 */
const decryptText = (encryptedContent, keyBase64, ivBase64, tagBase64) => {
    try {
        const key = Buffer.from(keyBase64, 'base64');
        const iv = Buffer.from(ivBase64, 'base64');
        const tag = Buffer.from(tagBase64, 'base64');
        
        // Create decipher
        const decipher = crypto.createDecipherGCM(ALGORITHM, key, iv);
        decipher.setAAD(Buffer.from('aviation-crew-api', 'utf8'));
        decipher.setAuthTag(tag);
        
        // Decrypt the content
        let decrypted = decipher.update(encryptedContent, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        throw new Error(`Decryption failed: ${error.message}`);
    }
};

/**
 * Encrypt message content (simplified version for messages)
 * @param {string} message - Message to encrypt
 * @returns {Object} Object containing encrypted message and key
 */
const encryptMessage = (message) => {
    try {
        const key = crypto.randomBytes(KEY_LENGTH);
        const iv = generateIV();
        
        const cipher = crypto.createCipherGCM(ALGORITHM, key, iv);
        cipher.setAAD(Buffer.from('aviation-message', 'utf8'));
        
        let encrypted = cipher.update(message, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const tag = cipher.getAuthTag();
        
        // Combine IV, encrypted content, and tag
        const combined = iv.toString('hex') + ':' + encrypted + ':' + tag.toString('hex');
        
        return {
            encryptedContent: combined,
            key: key.toString('base64')
        };
    } catch (error) {
        throw new Error(`Message encryption failed: ${error.message}`);
    }
};

/**
 * Decrypt message content
 * @param {string} encryptedMessage - Encrypted message (IV:content:tag format)
 * @param {string} keyBase64 - Base64 encoded encryption key
 * @returns {string} Decrypted message
 */
const decryptMessage = (encryptedMessage, keyBase64) => {
    try {
        const key = Buffer.from(keyBase64, 'base64');
        
        // Split the combined format
        const parts = encryptedMessage.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted message format');
        }
        
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const tag = Buffer.from(parts[2], 'hex');
        
        const decipher = crypto.createDecipherGCM(ALGORITHM, key, iv);
        decipher.setAAD(Buffer.from('aviation-message', 'utf8'));
        decipher.setAuthTag(tag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        throw new Error(`Message decryption failed: ${error.message}`);
    }
};

/**
 * Encrypt file data
 * @param {Buffer} fileBuffer - File data as buffer
 * @returns {Object} Object containing encrypted file and key
 */
const encryptFile = (fileBuffer) => {
    try {
        const key = crypto.randomBytes(KEY_LENGTH);
        const iv = generateIV();
        
        const cipher = crypto.createCipherGCM(ALGORITHM, key, iv);
        cipher.setAAD(Buffer.from('aviation-document', 'utf8'));
        
        const encrypted = Buffer.concat([
            cipher.update(fileBuffer),
            cipher.final()
        ]);
        
        const tag = cipher.getAuthTag();
        
        // Combine IV, encrypted content, and tag
        const combined = Buffer.concat([iv, encrypted, tag]);
        
        return {
            encryptedContent: combined.toString('base64'),
            key: key.toString('base64')
        };
    } catch (error) {
        throw new Error(`File encryption failed: ${error.message}`);
    }
};

/**
 * Decrypt file data
 * @param {string} encryptedFileBase64 - Base64 encoded encrypted file
 * @param {string} keyBase64 - Base64 encoded encryption key
 * @returns {Buffer} Decrypted file buffer
 */
const decryptFile = (encryptedFileBase64, keyBase64) => {
    try {
        const key = Buffer.from(keyBase64, 'base64');
        const combined = Buffer.from(encryptedFileBase64, 'base64');
        
        // Extract IV, encrypted content, and tag
        const iv = combined.slice(0, IV_LENGTH);
        const tag = combined.slice(-TAG_LENGTH);
        const encrypted = combined.slice(IV_LENGTH, -TAG_LENGTH);
        
        const decipher = crypto.createDecipherGCM(ALGORITHM, key, iv);
        decipher.setAAD(Buffer.from('aviation-document', 'utf8'));
        decipher.setAuthTag(tag);
        
        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);
        
        return decrypted;
    } catch (error) {
        throw new Error(`File decryption failed: ${error.message}`);
    }
};

/**
 * Generate a hash of data
 * @param {string|Buffer} data - Data to hash
 * @param {string} algorithm - Hash algorithm (default: sha256)
 * @returns {string} Hex encoded hash
 */
const generateHash = (data, algorithm = 'sha256') => {
    try {
        const hash = crypto.createHash(algorithm);
        hash.update(data);
        return hash.digest('hex');
    } catch (error) {
        throw new Error(`Hash generation failed: ${error.message}`);
    }
};

/**
 * Generate HMAC signature
 * @param {string} data - Data to sign
 * @param {string} secret - Secret key
 * @param {string} algorithm - HMAC algorithm (default: sha256)
 * @returns {string} Hex encoded HMAC
 */
const generateHMAC = (data, secret, algorithm = 'sha256') => {
    try {
        const hmac = crypto.createHmac(algorithm, secret);
        hmac.update(data);
        return hmac.digest('hex');
    } catch (error) {
        throw new Error(`HMAC generation failed: ${error.message}`);
    }
};

/**
 * Verify HMAC signature
 * @param {string} data - Original data
 * @param {string} signature - HMAC signature to verify
 * @param {string} secret - Secret key
 * @param {string} algorithm - HMAC algorithm (default: sha256)
 * @returns {boolean} True if signature is valid
 */
const verifyHMAC = (data, signature, secret, algorithm = 'sha256') => {
    try {
        const expectedSignature = generateHMAC(data, secret, algorithm);
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch (error) {
        return false;
    }
};

/**
 * Generate a secure random string
 * @param {number} length - Length of the string in bytes
 * @param {string} encoding - Encoding format (default: hex)
 * @returns {string} Random string
 */
const generateRandomString = (length = 32, encoding = 'hex') => {
    return crypto.randomBytes(length).toString(encoding);
};

/**
 * Derive key from password using PBKDF2
 * @param {string} password - Password to derive from
 * @param {string} salt - Salt value (optional, will generate if not provided)
 * @param {number} iterations - Number of iterations (default: 100000)
 * @returns {Object} Object containing derived key and salt
 */
const deriveKey = (password, salt = null, iterations = 100000) => {
    try {
        const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(16);
        const key = crypto.pbkdf2Sync(password, saltBuffer, iterations, KEY_LENGTH, 'sha256');
        
        return {
            key: key.toString('base64'),
            salt: saltBuffer.toString('hex'),
            iterations
        };
    } catch (error) {
        throw new Error(`Key derivation failed: ${error.message}`);
    }
};

/**
 * Create encrypted backup of sensitive data
 * @param {Object} data - Data to backup
 * @param {string} password - Backup password
 * @returns {string} Encrypted backup string
 */
const createEncryptedBackup = (data, password) => {
    try {
        const { key, salt } = deriveKey(password);
        const jsonData = JSON.stringify(data);
        const encrypted = encryptText(jsonData, key);
        
        return JSON.stringify({
            salt,
            data: encrypted
        });
    } catch (error) {
        throw new Error(`Backup creation failed: ${error.message}`);
    }
};

/**
 * Restore from encrypted backup
 * @param {string} backupString - Encrypted backup string
 * @param {string} password - Backup password
 * @returns {Object} Restored data
 */
const restoreFromBackup = (backupString, password) => {
    try {
        const backup = JSON.parse(backupString);
        const { key } = deriveKey(password, backup.salt);
        const decrypted = decryptText(
            backup.data.encryptedContent,
            key,
            backup.data.iv,
            backup.data.tag
        );
        
        return JSON.parse(decrypted);
    } catch (error) {
        throw new Error(`Backup restoration failed: ${error.message}`);
    }
};

module.exports = {
    generateKey,
    encryptText,
    decryptText,
    encryptMessage,
    decryptMessage,
    encryptFile,
    decryptFile,
    generateHash,
    generateHMAC,
    verifyHMAC,
    generateRandomString,
    deriveKey,
    createEncryptedBackup,
    restoreFromBackup
};
