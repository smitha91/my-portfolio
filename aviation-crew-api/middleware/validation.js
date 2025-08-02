/**
 * Input Validation Middleware
 * 
 * Provides validation functions for API endpoints
 * Validates request data format, required fields, and data types
 */

const { body, param, query, validationResult } = require('express-validator');
const { logger } = require('../utils/logger');

/**
 * Handle validation errors
 * Formats and returns validation error messages
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
            field: error.path,
            message: error.msg,
            value: error.value,
            location: error.location
        }));

        logger.warn('Validation errors:', formattedErrors);
        
        return res.status(400).json({
            error: 'Validation failed',
            message: 'Please check your input data and try again.',
            code: 'VALIDATION_ERROR',
            details: formattedErrors
        });
    }
    
    next();
};

/**
 * User registration validation rules
 */
const validateUserRegistration = [
    body('employeeId')
        .isLength({ min: 6, max: 10 })
        .withMessage('Employee ID must be 6-10 characters long')
        .matches(/^[A-Z]{2,3}\d{3,7}$/)
        .withMessage('Employee ID must follow format: 2-3 letters followed by 3-7 digits (e.g., AA12345)'),
    
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('name')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be 2-50 characters long')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
    
    body('role')
        .isIn(['pilot', 'co-pilot', 'flight-attendant', 'gate-agent', 'ground-crew', 'dispatcher'])
        .withMessage('Invalid role specified'),
    
    body('department')
        .isIn(['flight-operations', 'cabin-crew', 'ground-operations', 'dispatch', 'maintenance'])
        .withMessage('Invalid department specified'),
    
    body('clearanceLevel')
        .isInt({ min: 1, max: 5 })
        .withMessage('Clearance level must be an integer between 1 and 5'),
    
    body('airline')
        .isLength({ min: 2, max: 50 })
        .withMessage('Airline name must be 2-50 characters long')
        .matches(/^[a-zA-Z\s&'-]+$/)
        .withMessage('Airline name can only contain letters, spaces, ampersands, hyphens, and apostrophes'),
    
    handleValidationErrors
];

/**
 * User login validation rules
 */
const validateUserLogin = [
    body('employeeId')
        .notEmpty()
        .withMessage('Employee ID is required')
        .isLength({ min: 6, max: 10 })
        .withMessage('Invalid employee ID format'),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 1 })
        .withMessage('Password cannot be empty'),
    
    handleValidationErrors
];

/**
 * Message sending validation rules
 */
const validateMessage = [
    body('recipientId')
        .notEmpty()
        .withMessage('Recipient ID is required')
        .isLength({ min: 6, max: 10 })
        .withMessage('Invalid recipient ID format'),
    
    body('content')
        .notEmpty()
        .withMessage('Message content is required')
        .isLength({ min: 1, max: 2000 })
        .withMessage('Message content must be 1-2000 characters long'),
    
    body('priority')
        .optional()
        .isIn(['low', 'normal', 'high', 'urgent'])
        .withMessage('Priority must be one of: low, normal, high, urgent'),
    
    body('isEncrypted')
        .optional()
        .isBoolean()
        .withMessage('isEncrypted must be a boolean value'),
    
    body('flightNumber')
        .optional()
        .matches(/^[A-Z]{2,3}\d{1,4}[A-Z]?$/)
        .withMessage('Flight number must follow format: 2-3 letters followed by 1-4 digits and optional letter (e.g., AA123, DL1234A)'),
    
    handleValidationErrors
];

/**
 * Document upload validation rules
 */
const validateDocument = [
    body('title')
        .notEmpty()
        .withMessage('Document title is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Document title must be 1-100 characters long'),
    
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Document description cannot exceed 500 characters'),
    
    body('category')
        .isIn(['flight-plan', 'weather', 'maintenance', 'crew-manifest', 'safety', 'operational'])
        .withMessage('Invalid document category'),
    
    body('accessLevel')
        .isInt({ min: 1, max: 5 })
        .withMessage('Access level must be an integer between 1 and 5'),
    
    body('flightNumber')
        .optional()
        .matches(/^[A-Z]{2,3}\d{1,4}[A-Z]?$/)
        .withMessage('Flight number must follow format: 2-3 letters followed by 1-4 digits and optional letter'),
    
    body('expiresAt')
        .optional()
        .isISO8601()
        .withMessage('Expiration date must be a valid ISO 8601 date'),
    
    handleValidationErrors
];

/**
 * Flight number parameter validation
 */
const validateFlightNumber = [
    param('flightNumber')
        .matches(/^[A-Z]{2,3}\d{1,4}[A-Z]?$/)
        .withMessage('Flight number must follow format: 2-3 letters followed by 1-4 digits and optional letter'),
    
    handleValidationErrors
];

/**
 * Employee ID parameter validation
 */
const validateEmployeeId = [
    param('employeeId')
        .matches(/^[A-Z]{2,3}\d{3,7}$/)
        .withMessage('Employee ID must follow format: 2-3 letters followed by 3-7 digits'),
    
    handleValidationErrors
];

/**
 * Pagination query validation
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be an integer between 1 and 100'),
    
    handleValidationErrors
];

/**
 * Search query validation
 */
const validateSearch = [
    query('q')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be 1-100 characters long'),
    
    query('category')
        .optional()
        .isIn(['flight-plan', 'weather', 'maintenance', 'crew-manifest', 'safety', 'operational'])
        .withMessage('Invalid search category'),
    
    query('flightNumber')
        .optional()
        .matches(/^[A-Z]{2,3}\d{1,4}[A-Z]?$/)
        .withMessage('Flight number must follow format: 2-3 letters followed by 1-4 digits and optional letter'),
    
    handleValidationErrors
];

/**
 * Password update validation
 */
const validatePasswordUpdate = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Password confirmation does not match new password');
            }
            return true;
        }),
    
    handleValidationErrors
];

/**
 * Profile update validation
 */
const validateProfileUpdate = [
    body('name')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be 2-50 characters long')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
    
    body('department')
        .optional()
        .isIn(['flight-operations', 'cabin-crew', 'ground-operations', 'dispatch', 'maintenance'])
        .withMessage('Invalid department specified'),
    
    handleValidationErrors
];

module.exports = {
    validateUserRegistration,
    validateUserLogin,
    validateMessage,
    validateDocument,
    validateFlightNumber,
    validateEmployeeId,
    validatePagination,
    validateSearch,
    validatePasswordUpdate,
    validateProfileUpdate,
    handleValidationErrors
};
