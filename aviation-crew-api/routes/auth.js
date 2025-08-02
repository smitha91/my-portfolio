/**
 * Authentication Routes
 * 
 * Handles user registration, login, logout, and password management
 * Provides JWT-based authentication for aviation crew members
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const { users, addUser, findUserByEmployeeId, updateUser } = require('../data/users');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/security');
const { 
    validateUserRegistration, 
    validateUserLogin, 
    validatePasswordUpdate 
} = require('../middleware/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');

const router = express.Router();

/**
 * POST /auth/register
 * Register a new aviation crew member
 */
router.post('/register', 
    authRateLimit,
    validateUserRegistration,
    asyncHandler(async (req, res) => {
        const { 
            employeeId, 
            password, 
            name, 
            role, 
            department, 
            clearanceLevel, 
            airline 
        } = req.body;

        // Check if user already exists
        const existingUser = findUserByEmployeeId(employeeId);
        if (existingUser) {
            throw new AppError('Employee ID already registered', 409, 'USER_EXISTS');
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const newUser = {
            id: uuidv4(),
            employeeId,
            password: hashedPassword,
            name,
            role,
            department,
            clearanceLevel: parseInt(clearanceLevel),
            airline,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: null,
            failedLoginAttempts: 0,
            accountLockedUntil: null
        };

        // Add user to data store
        addUser(newUser);

        logger.info(`New user registered: ${employeeId} (${role})`);

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(newUser);

        // Return user data (excluding password)
        const { password: _, ...userWithoutPassword } = newUser;

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: {
                user: userWithoutPassword,
                accessToken,
                refreshToken,
                expiresIn: process.env.JWT_EXPIRES_IN || '15m'
            }
        });
    })
);

/**
 * POST /auth/login
 * Authenticate user and return JWT token
 */
router.post('/login',
    authRateLimit,
    validateUserLogin,
    asyncHandler(async (req, res) => {
        const { employeeId, password } = req.body;

        // Find user
        const user = findUserByEmployeeId(employeeId);
        if (!user) {
            throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
        }

        // Check if account is locked
        if (user.accountLockedUntil && new Date() < new Date(user.accountLockedUntil)) {
            const lockTimeRemaining = Math.ceil((new Date(user.accountLockedUntil) - new Date()) / 1000 / 60);
            throw new AppError(
                `Account is locked. Try again in ${lockTimeRemaining} minutes.`, 
                423, 
                'ACCOUNT_LOCKED',
                { unlockTime: user.accountLockedUntil }
            );
        }

        // Check if account is active
        if (!user.isActive) {
            throw new AppError('Account is deactivated. Contact administrator.', 401, 'ACCOUNT_DEACTIVATED');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            // Increment failed login attempts
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            
            // Lock account after 5 failed attempts
            if (user.failedLoginAttempts >= 5) {
                user.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
                logger.warn(`Account locked for ${employeeId} due to too many failed attempts`);
            }
            
            user.updatedAt = new Date().toISOString();
            updateUser(user);

            throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
        }

        // Reset failed login attempts on successful login
        user.failedLoginAttempts = 0;
        user.accountLockedUntil = null;
        user.lastLoginAt = new Date().toISOString();
        user.updatedAt = new Date().toISOString();
        updateUser(user);

        logger.info(`User logged in: ${employeeId} (${user.role})`);

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Return user data (excluding password)
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            status: 'success',
            message: 'Login successful',
            data: {
                user: userWithoutPassword,
                accessToken,
                refreshToken,
                expiresIn: process.env.JWT_EXPIRES_IN || '15m'
            }
        });
    })
);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh',
    asyncHandler(async (req, res) => {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw new AppError('Refresh token is required', 400, 'REFRESH_TOKEN_REQUIRED');
        }

        try {
            // Verify refresh token
            const decoded = verifyRefreshToken(refreshToken);
            
            // Find user
            const user = findUserByEmployeeId(decoded.employeeId);
            if (!user || !user.isActive) {
                throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
            }

            // Generate new tokens
            const tokens = generateTokens(user);

            res.json({
                status: 'success',
                message: 'Token refreshed successfully',
                data: {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
                }
            });

        } catch (error) {
            throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
        }
    })
);

/**
 * POST /auth/logout
 * Logout user (invalidate tokens)
 */
router.post('/logout',
    authenticateToken,
    asyncHandler(async (req, res) => {
        // In a real application, you would blacklist the token
        // For this demo, we'll just return success
        
        logger.info(`User logged out: ${req.user.employeeId}`);

        res.json({
            status: 'success',
            message: 'Logout successful'
        });
    })
);

/**
 * GET /auth/profile
 * Get current user profile
 */
router.get('/profile',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const user = findUserByEmployeeId(req.user.employeeId);
        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        // Return user data (excluding password)
        const { password, ...userWithoutPassword } = user;

        res.json({
            status: 'success',
            data: {
                user: userWithoutPassword
            }
        });
    })
);

/**
 * PUT /auth/password
 * Change user password
 */
router.put('/password',
    authenticateToken,
    validatePasswordUpdate,
    asyncHandler(async (req, res) => {
        const { currentPassword, newPassword } = req.body;

        // Find user
        const user = findUserByEmployeeId(req.user.employeeId);
        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
        }

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update user password
        user.password = hashedNewPassword;
        user.updatedAt = new Date().toISOString();
        updateUser(user);

        logger.info(`Password changed for user: ${req.user.employeeId}`);

        res.json({
            status: 'success',
            message: 'Password updated successfully'
        });
    })
);

/**
 * GET /auth/verify
 * Verify token validity
 */
router.get('/verify',
    optionalAuth,
    asyncHandler(async (req, res) => {
        if (!req.user) {
            throw new AppError('No valid token provided', 401, 'NO_VALID_TOKEN');
        }

        res.json({
            status: 'success',
            message: 'Token is valid',
            data: {
                user: req.user,
                isValid: true
            }
        });
    })
);

/**
 * POST /auth/forgot-password
 * Initiate password reset process
 */
router.post('/forgot-password',
    authRateLimit,
    asyncHandler(async (req, res) => {
        const { employeeId } = req.body;

        if (!employeeId) {
            throw new AppError('Employee ID is required', 400, 'EMPLOYEE_ID_REQUIRED');
        }

        const user = findUserByEmployeeId(employeeId);
        if (!user) {
            // Don't reveal if user exists or not
            return res.json({
                status: 'success',
                message: 'If the employee ID exists, a password reset link will be sent to the administrator.'
            });
        }

        // In a real application, you would:
        // 1. Generate a reset token
        // 2. Send email with reset link
        // 3. Store token with expiration

        logger.info(`Password reset requested for: ${employeeId}`);

        res.json({
            status: 'success',
            message: 'If the employee ID exists, a password reset link will be sent to the administrator.'
        });
    })
);

module.exports = router;
