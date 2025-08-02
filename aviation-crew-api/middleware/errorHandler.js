/**
 * Error Handling Middleware
 * 
 * Centralized error handling for the aviation crew API
 * Provides consistent error responses and logging
 */

const { logger } = require('../utils/logger');

/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
    constructor(message, statusCode, code = null, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.code = code;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Global error handling middleware
 * Catches all errors and formats them consistently
 */
const globalErrorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error details
    logger.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        user: req.user ? req.user.employeeId : 'unauthenticated'
    });

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token. Please login again.';
        error = new AppError(message, 401, 'INVALID_TOKEN');
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Your session has expired. Please login again.';
        error = new AppError(message, 401, 'TOKEN_EXPIRED');
    }

    // Mongoose/MongoDB errors (if using MongoDB in future)
    if (err.name === 'CastError') {
        const message = 'Invalid ID format provided.';
        error = new AppError(message, 400, 'INVALID_ID');
    }

    if (err.code === 11000) {
        const duplicateField = Object.keys(err.keyValue)[0];
        const message = `Duplicate value for field: ${duplicateField}. Please use another value.`;
        error = new AppError(message, 400, 'DUPLICATE_VALUE');
    }

    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(val => val.message);
        const message = `Invalid input data: ${errors.join('. ')}`;
        error = new AppError(message, 400, 'VALIDATION_ERROR', errors);
    }

    // Express validation errors
    if (err.type === 'entity.parse.failed') {
        const message = 'Invalid JSON format in request body.';
        error = new AppError(message, 400, 'INVALID_JSON');
    }

    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        const message = 'File size too large. Maximum allowed size is 10MB.';
        error = new AppError(message, 400, 'FILE_TOO_LARGE');
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        const message = 'Unexpected file field. Please check file upload format.';
        error = new AppError(message, 400, 'UNEXPECTED_FILE');
    }

    // Rate limiting errors
    if (err.statusCode === 429) {
        const message = 'Too many requests. Please try again later.';
        error = new AppError(message, 429, 'RATE_LIMIT_EXCEEDED');
    }

    // Send error response
    sendErrorResponse(error, req, res);
};

/**
 * Send formatted error response
 */
const sendErrorResponse = (err, req, res) => {
    const statusCode = err.statusCode || 500;
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Operational errors - send error details
    if (err.isOperational) {
        const errorResponse = {
            status: err.status || 'error',
            error: err.message,
            code: err.code || 'UNKNOWN_ERROR',
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method
        };

        // Add error details if available
        if (err.details) {
            errorResponse.details = err.details;
        }

        // Add stack trace in development
        if (isDevelopment) {
            errorResponse.stack = err.stack;
        }

        return res.status(statusCode).json(errorResponse);
    }

    // Programming errors - don't leak error details in production
    if (isDevelopment) {
        return res.status(statusCode).json({
            status: 'error',
            error: err.message,
            code: 'INTERNAL_ERROR',
            stack: err.stack,
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method
        });
    }

    // Production error response - generic message
    res.status(500).json({
        status: 'error',
        error: 'Something went wrong on the server. Please try again later.',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
    });
};

/**
 * 404 error handler for undefined routes
 */
const notFoundHandler = (req, res, next) => {
    const message = `Route ${req.originalUrl} not found on this server.`;
    const error = new AppError(message, 404, 'ROUTE_NOT_FOUND');
    next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Authentication error handler
 */
const authErrorHandler = (err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            status: 'fail',
            error: 'Invalid authentication credentials.',
            code: 'UNAUTHORIZED',
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method
        });
    }
    next(err);
};

/**
 * CORS error handler
 */
const corsErrorHandler = (err, req, res, next) => {
    if (err.message && err.message.includes('CORS')) {
        return res.status(403).json({
            status: 'fail',
            error: 'CORS policy violation. Origin not allowed.',
            code: 'CORS_ERROR',
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method
        });
    }
    next(err);
};

/**
 * Database connection error handler
 */
const dbErrorHandler = (err, req, res, next) => {
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        logger.error('Database connection error:', err);
        return res.status(503).json({
            status: 'error',
            error: 'Database service unavailable. Please try again later.',
            code: 'DATABASE_UNAVAILABLE',
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method
        });
    }
    next(err);
};

module.exports = {
    AppError,
    globalErrorHandler,
    notFoundHandler,
    asyncHandler,
    authErrorHandler,
    corsErrorHandler,
    dbErrorHandler
};
