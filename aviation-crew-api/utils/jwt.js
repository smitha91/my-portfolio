/**
 * JWT Utilities
 * 
 * Helper functions for JSON Web Token operations
 * Handles token generation, verification, and refresh logic
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generate access and refresh tokens for a user
 * @param {Object} user - User object
 * @returns {Object} Object containing accessToken and refreshToken
 */
const generateTokens = (user) => {
    const payload = {
        employeeId: user.employeeId,
        name: user.name,
        role: user.role,
        department: user.department,
        clearanceLevel: user.clearanceLevel,
        airline: user.airline
    };

    // Generate access token (short-lived)
    const accessToken = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { 
            expiresIn: process.env.JWT_EXPIRES_IN || '15m',
            issuer: 'aviation-crew-api',
            audience: 'aviation-crew'
        }
    );

    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign(
        { 
            employeeId: user.employeeId,
            type: 'refresh',
            tokenId: crypto.randomUUID()
        },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { 
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
            issuer: 'aviation-crew-api',
            audience: 'aviation-crew'
        }
    );

    return {
        accessToken,
        refreshToken
    };
};

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET, {
            issuer: 'aviation-crew-api',
            audience: 'aviation-crew'
        });
    } catch (error) {
        throw new Error(`Invalid access token: ${error.message}`);
    }
};

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(
            token, 
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            {
                issuer: 'aviation-crew-api',
                audience: 'aviation-crew'
            }
        );

        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }

        return decoded;
    } catch (error) {
        throw new Error(`Invalid refresh token: ${error.message}`);
    }
};

/**
 * Extract token from authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    
    return parts[1];
};

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const decodeToken = (token) => {
    try {
        return jwt.decode(token, { complete: true });
    } catch (error) {
        throw new Error(`Failed to decode token: ${error.message}`);
    }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
const isTokenExpired = (token) => {
    try {
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) return true;
        
        const currentTime = Math.floor(Date.now() / 1000);
        return decoded.exp < currentTime;
    } catch (error) {
        return true;
    }
};

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {Date|null} Expiration date or null
 */
const getTokenExpiration = (token) => {
    try {
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) return null;
        
        return new Date(decoded.exp * 1000);
    } catch (error) {
        return null;
    }
};

/**
 * Create a token blacklist entry (for logout)
 * Note: In a real application, you would store this in a database or Redis
 * @param {string} token - JWT token to blacklist
 * @param {Date} expiresAt - When the blacklist entry expires
 */
const blacklistToken = (token, expiresAt = null) => {
    // In memory blacklist for demo purposes
    // In production, use Redis or database
    if (!global.tokenBlacklist) {
        global.tokenBlacklist = new Map();
    }
    
    const expiry = expiresAt || getTokenExpiration(token) || new Date(Date.now() + 24 * 60 * 60 * 1000);
    global.tokenBlacklist.set(token, expiry);
    
    // Clean up expired entries
    cleanupBlacklist();
};

/**
 * Check if token is blacklisted
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is blacklisted
 */
const isTokenBlacklisted = (token) => {
    if (!global.tokenBlacklist) return false;
    
    const expiry = global.tokenBlacklist.get(token);
    if (!expiry) return false;
    
    if (new Date() > expiry) {
        global.tokenBlacklist.delete(token);
        return false;
    }
    
    return true;
};

/**
 * Clean up expired blacklist entries
 */
const cleanupBlacklist = () => {
    if (!global.tokenBlacklist) return;
    
    const now = new Date();
    for (const [token, expiry] of global.tokenBlacklist.entries()) {
        if (now > expiry) {
            global.tokenBlacklist.delete(token);
        }
    }
};

/**
 * Generate a secure random secret
 * @param {number} length - Length of the secret in bytes
 * @returns {string} Base64 encoded secret
 */
const generateSecret = (length = 32) => {
    return crypto.randomBytes(length).toString('base64');
};

/**
 * Create JWT with custom claims
 * @param {Object} payload - Token payload
 * @param {Object} options - JWT options
 * @returns {string} Signed JWT
 */
const createCustomToken = (payload, options = {}) => {
    const defaultOptions = {
        expiresIn: '1h',
        issuer: 'aviation-crew-api',
        audience: 'aviation-crew'
    };
    
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { ...defaultOptions, ...options }
    );
};

/**
 * Validate token format
 * @param {string} token - Token to validate
 * @returns {boolean} True if token format is valid
 */
const isValidTokenFormat = (token) => {
    if (!token || typeof token !== 'string') return false;
    
    // JWT should have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Each part should be base64url encoded
    try {
        for (const part of parts) {
            Buffer.from(part, 'base64url');
        }
        return true;
    } catch (error) {
        return false;
    }
};

/**
 * Get token time remaining
 * @param {string} token - JWT token
 * @returns {number} Seconds remaining until expiration (-1 if expired/invalid)
 */
const getTokenTimeRemaining = (token) => {
    try {
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) return -1;
        
        const currentTime = Math.floor(Date.now() / 1000);
        const timeRemaining = decoded.exp - currentTime;
        
        return Math.max(0, timeRemaining);
    } catch (error) {
        return -1;
    }
};

module.exports = {
    generateTokens,
    verifyAccessToken,
    verifyRefreshToken,
    extractTokenFromHeader,
    decodeToken,
    isTokenExpired,
    getTokenExpiration,
    blacklistToken,
    isTokenBlacklisted,
    cleanupBlacklist,
    generateSecret,
    createCustomToken,
    isValidTokenFormat,
    getTokenTimeRemaining
};
