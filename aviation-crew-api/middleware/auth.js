/**
 * Authentication Middleware
 * 
 * Handles JWT token verification and user authentication
 * Provides role-based access control for aviation crew members
 */

const jwt = require('jsonwebtoken');
const { users } = require('../data/users'); // In-memory user store
const { logger } = require('../utils/logger');

/**
 * Verify JWT token and authenticate user
 * Attaches user object to request for downstream middleware
 */
const authenticateToken = (req, res, next) => {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            error: 'Access denied',
            message: 'No token provided. Please login to access this resource.',
            code: 'NO_TOKEN'
        });
    }

    try {
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user in our data store
        const user = users.find(u => u.employeeId === decoded.employeeId);
        
        if (!user) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Invalid token. User not found.',
                code: 'USER_NOT_FOUND'
            });
        }

        // Check if user account is active
        if (!user.isActive) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Account is deactivated. Please contact administrator.',
                code: 'ACCOUNT_DEACTIVATED'
            });
        }

        // Attach user to request object (excluding password)
        req.user = {
            employeeId: user.employeeId,
            name: user.name,
            role: user.role,
            department: user.department,
            clearanceLevel: user.clearanceLevel,
            airline: user.airline
        };

        logger.info(`Authenticated user: ${user.employeeId} (${user.role})`);
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired',
                message: 'Your session has expired. Please login again.',
                code: 'TOKEN_EXPIRED'
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'Invalid authentication token provided.',
                code: 'INVALID_TOKEN'
            });
        } else {
            logger.error('Authentication error:', error);
            return res.status(500).json({
                error: 'Authentication error',
                message: 'Internal server error during authentication.',
                code: 'AUTH_ERROR'
            });
        }
    }
};

/**
 * Role-based access control middleware
 * Restricts access based on user role
 * 
 * @param {Array} allowedRoles - Array of roles that can access the resource
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please authenticate before accessing this resource.',
                code: 'AUTH_REQUIRED'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            logger.warn(`Access denied for ${req.user.employeeId}: insufficient role (${req.user.role})`);
            return res.status(403).json({
                error: 'Access denied',
                message: `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`,
                code: 'INSUFFICIENT_ROLE',
                userRole: req.user.role,
                requiredRoles: allowedRoles
            });
        }

        next();
    };
};

/**
 * Clearance level access control
 * Restricts access based on security clearance level
 * 
 * @param {number} minClearanceLevel - Minimum clearance level required
 */
const requireClearance = (minClearanceLevel) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please authenticate before accessing this resource.',
                code: 'AUTH_REQUIRED'
            });
        }

        if (req.user.clearanceLevel < minClearanceLevel) {
            logger.warn(`Access denied for ${req.user.employeeId}: insufficient clearance (${req.user.clearanceLevel})`);
            return res.status(403).json({
                error: 'Access denied',
                message: `Insufficient security clearance. Required level: ${minClearanceLevel}`,
                code: 'INSUFFICIENT_CLEARANCE',
                userClearance: req.user.clearanceLevel,
                requiredClearance: minClearanceLevel
            });
        }

        next();
    };
};

/**
 * Department-based access control
 * Restricts access to specific departments
 * 
 * @param {Array} allowedDepartments - Array of departments that can access
 */
const requireDepartment = (allowedDepartments) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please authenticate before accessing this resource.',
                code: 'AUTH_REQUIRED'
            });
        }

        if (!allowedDepartments.includes(req.user.department)) {
            logger.warn(`Access denied for ${req.user.employeeId}: wrong department (${req.user.department})`);
            return res.status(403).json({
                error: 'Access denied',
                message: `Access restricted to: ${allowedDepartments.join(', ')} departments`,
                code: 'DEPARTMENT_RESTRICTED',
                userDepartment: req.user.department,
                allowedDepartments: allowedDepartments
            });
        }

        next();
    };
};

/**
 * Optional authentication middleware
 * Authenticates user if token is present but doesn't require it
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        // No token provided, continue without user context
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = users.find(u => u.employeeId === decoded.employeeId);
        
        if (user && user.isActive) {
            req.user = {
                employeeId: user.employeeId,
                name: user.name,
                role: user.role,
                department: user.department,
                clearanceLevel: user.clearanceLevel,
                airline: user.airline
            };
        }
    } catch (error) {
        // Invalid token, but continue without user context
        logger.warn('Invalid token in optional auth:', error.message);
    }

    next();
};

module.exports = {
    authenticateToken,
    requireRole,
    requireClearance,
    requireDepartment,
    optionalAuth
};
