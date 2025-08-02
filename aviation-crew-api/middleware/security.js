/**
 * Security Middleware
 * 
 * Additional security layers for the aviation crew API
 * Includes IP filtering, request sanitization, and security headers
 */

const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { logger } = require('../utils/logger');

/**
 * Enhanced rate limiting for different endpoints
 */
const createRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            error: 'Too many requests',
            message,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests,
        handler: (req, res) => {
            logger.warn(`Rate limit exceeded for IP: ${req.ip}, URL: ${req.originalUrl}`);
            res.status(429).json({
                error: 'Too many requests',
                message,
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil(windowMs / 1000),
                timestamp: new Date().toISOString()
            });
        }
    });
};

/**
 * Strict rate limiting for authentication endpoints
 */
const authRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // 5 attempts
    'Too many authentication attempts. Please try again in 15 minutes.',
    true
);

/**
 * General API rate limiting
 */
const apiRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests
    'Too many API requests. Please try again in 15 minutes.',
    false
);

/**
 * Message sending rate limiting
 */
const messageRateLimit = createRateLimit(
    60 * 1000, // 1 minute
    10, // 10 messages
    'Too many messages sent. Please wait before sending more.',
    false
);

/**
 * Document upload rate limiting
 */
const uploadRateLimit = createRateLimit(
    60 * 60 * 1000, // 1 hour
    20, // 20 uploads
    'Too many file uploads. Please wait before uploading more files.',
    false
);

/**
 * Progressive delay middleware for repeated requests
 * Simple implementation without external dependency
 */
// Global delay map to persist across requests
const delayMap = new Map();

const progressiveDelay = (req, res, next) => {
    // Simple delay implementation - can be enhanced as needed
    const clientIP = req.ip;
    const now = Date.now();
    
    // Clean old entries (older than 15 minutes)
    for (const [ip, data] of delayMap.entries()) {
        if (now - data.lastRequest > 15 * 60 * 1000) {
            delayMap.delete(ip);
        }
    }
    
    // Get or create entry for this IP
    const entry = delayMap.get(clientIP) || { count: 0, lastRequest: now };
    entry.count++;
    entry.lastRequest = now;
    delayMap.set(clientIP, entry);
    
    // Apply delay if too many requests
    if (entry.count > 50) {
        const delay = Math.min((entry.count - 50) * 100, 5000); // Max 5 second delay
        setTimeout(() => next(), delay);
    } else {
        next();
    }
};

/**
 * IP whitelist middleware for admin endpoints
 */
const ipWhitelist = (allowedIPs = []) => {
    return (req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress;
        
        // Allow localhost in development
        if (process.env.NODE_ENV === 'development' && 
            (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1')) {
            return next();
        }

        if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
            logger.warn(`Access denied for IP: ${clientIP}`);
            return res.status(403).json({
                error: 'Access denied',
                message: 'Your IP address is not authorized to access this resource.',
                code: 'IP_NOT_ALLOWED',
                timestamp: new Date().toISOString()
            });
        }

        next();
    };
};

/**
 * Request sanitization middleware
 */
const sanitizeInput = [
    // Prevent NoSQL injection in request body
    body('*').customSanitizer((value) => {
        if (typeof value === 'string') {
            // Remove potential NoSQL operators
            return value.replace(/^\$/, '').replace(/\./g, '_');
        }
        return value;
    }),

    // Additional sanitization for specific fields
    body('employeeId').escape().trim(),
    body('name').escape().trim(),
    body('content').trim(),
    body('title').escape().trim(),
    body('description').escape().trim()
];

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Strict transport security (HTTPS only)
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self'; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none';"
    );
    
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions policy
    res.setHeader('Permissions-Policy', 
        'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
    );

    next();
};

/**
 * Request logging middleware for security monitoring
 */
const securityLogger = (req, res, next) => {
    const logData = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        user: req.user ? req.user.employeeId : 'anonymous'
    };

    // Log sensitive endpoints
    if (req.originalUrl.includes('/auth/') || 
        req.originalUrl.includes('/admin/') ||
        req.method === 'DELETE') {
        logger.info('Security-sensitive request:', logData);
    }

    next();
};

/**
 * Detect and prevent common attack patterns
 */
const attackDetection = (req, res, next) => {
    const url = req.originalUrl.toLowerCase();
    const userAgent = req.get('User-Agent') || '';
    const queryString = JSON.stringify(req.query).toLowerCase();
    const bodyString = JSON.stringify(req.body).toLowerCase();

    // Common SQL injection patterns
    const sqlPatterns = [
        /union.*select/i,
        /insert.*into/i,
        /delete.*from/i,
        /drop.*table/i,
        /exec.*xp_/i,
        /sp_password/i
    ];

    // Common XSS patterns
    const xssPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i,
        /eval\(/i
    ];

    // Path traversal patterns
    const traversalPatterns = [
        /\.\.\//,
        /\.\.\\,/,
        /%2e%2e%2f/i,
        /%252e%252e%252f/i
    ];

    const allPatterns = [...sqlPatterns, ...xssPatterns, ...traversalPatterns];
    const allContent = url + queryString + bodyString + userAgent;

    for (const pattern of allPatterns) {
        if (pattern.test(allContent)) {
            logger.warn('Potential attack detected:', {
                ip: req.ip,
                url: req.originalUrl,
                userAgent,
                pattern: pattern.toString(),
                timestamp: new Date().toISOString()
            });

            return res.status(400).json({
                error: 'Invalid request',
                message: 'Request contains potentially malicious content.',
                code: 'MALICIOUS_REQUEST',
                timestamp: new Date().toISOString()
            });
        }
    }

    next();
};

/**
 * Require HTTPS in production
 */
const requireHTTPS = (req, res, next) => {
    if (process.env.NODE_ENV === 'production' && !req.secure && req.get('X-Forwarded-Proto') !== 'https') {
        return res.redirect(301, `https://${req.get('Host')}${req.url}`);
    }
    next();
};

module.exports = {
    authRateLimit,
    apiRateLimit,
    messageRateLimit,
    uploadRateLimit,
    progressiveDelay,
    ipWhitelist,
    sanitizeInput,
    securityHeaders,
    securityLogger,
    attackDetection,
    requireHTTPS
};
