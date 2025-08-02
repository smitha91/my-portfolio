/**
 * Users Data Model
 * 
 * In-memory data store for aviation crew members
 * In a real application, this would be replaced with a database
 */

const bcrypt = require('bcrypt');

// In-memory users storage
let users = [
    {
        id: 'user-001',
        employeeId: 'AA12345',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsbtws5Lm', // password123
        name: 'Captain Sarah Johnson',
        role: 'pilot',
        department: 'flight-operations',
        clearanceLevel: 5,
        airline: 'American Airlines',
        isActive: true,
        createdAt: '2024-01-15T08:00:00.000Z',
        updatedAt: '2024-01-15T08:00:00.000Z',
        lastLoginAt: null,
        failedLoginAttempts: 0,
        accountLockedUntil: null
    },
    {
        id: 'user-002',
        employeeId: 'AA12346',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsbtws5Lm', // password123
        name: 'First Officer Mike Chen',
        role: 'co-pilot',
        department: 'flight-operations',
        clearanceLevel: 4,
        airline: 'American Airlines',
        isActive: true,
        createdAt: '2024-01-15T08:30:00.000Z',
        updatedAt: '2024-01-15T08:30:00.000Z',
        lastLoginAt: null,
        failedLoginAttempts: 0,
        accountLockedUntil: null
    },
    {
        id: 'user-003',
        employeeId: 'AA12347',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsbtws5Lm', // password123
        name: 'Flight Attendant Lisa Martinez',
        role: 'flight-attendant',
        department: 'cabin-crew',
        clearanceLevel: 2,
        airline: 'American Airlines',
        isActive: true,
        createdAt: '2024-01-15T09:00:00.000Z',
        updatedAt: '2024-01-15T09:00:00.000Z',
        lastLoginAt: null,
        failedLoginAttempts: 0,
        accountLockedUntil: null
    },
    {
        id: 'user-004',
        employeeId: 'AB12345',
        password: '$2b$12$.ndLzxB/aSLpsgfPxeRiqeXlinsTcL5b3dJZ/wx4XUvX/QgblU.36', // SecurePass123!
        name: 'Demo Test Pilot',
        role: 'pilot',
        department: 'flight-operations',
        clearanceLevel: 5,
        airline: 'Demo Airlines',
        isActive: true,
        createdAt: '2025-07-30T22:00:00.000Z',
        updatedAt: '2025-07-30T22:00:00.000Z',
        lastLoginAt: null,
        failedLoginAttempts: 0,
        accountLockedUntil: null
    },
    {
        id: 'user-005',
        employeeId: 'AA12348',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsbtws5Lm', // password123
        name: 'Gate Agent Robert Davis',
        role: 'gate-agent',
        department: 'ground-operations',
        clearanceLevel: 2,
        airline: 'American Airlines',
        isActive: true,
        createdAt: '2024-01-15T09:30:00.000Z',
        updatedAt: '2024-01-15T09:30:00.000Z',
        lastLoginAt: null,
        failedLoginAttempts: 0,
        accountLockedUntil: null
    },
    {
        id: 'user-006',
        employeeId: 'AA12349',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsbtws5Lm', // password123
        name: 'Dispatcher Jennifer Wilson',
        role: 'dispatcher',
        department: 'dispatch',
        clearanceLevel: 4,
        airline: 'American Airlines',
        isActive: true,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
        lastLoginAt: null,
        failedLoginAttempts: 0,
        accountLockedUntil: null
    },
    {
        id: 'user-006',
        employeeId: 'DL54321',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsbtws5Lm', // password123
        name: 'Captain James Thompson',
        role: 'pilot',
        department: 'flight-operations',
        clearanceLevel: 5,
        airline: 'Delta Air Lines',
        isActive: true,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
        lastLoginAt: null,
        failedLoginAttempts: 0,
        accountLockedUntil: null
    },
    {
        id: 'user-007',
        employeeId: 'UA98765',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsbtws5Lm', // password123
        name: 'Ground Crew Lead Mark Rodriguez',
        role: 'ground-crew',
        department: 'ground-operations',
        clearanceLevel: 3,
        airline: 'United Airlines',
        isActive: true,
        createdAt: '2024-01-15T11:00:00.000Z',
        updatedAt: '2024-01-15T11:00:00.000Z',
        lastLoginAt: null,
        failedLoginAttempts: 0,
        accountLockedUntil: null
    }
];

/**
 * Add a new user to the data store
 * @param {Object} user - User object to add
 */
const addUser = (user) => {
    users.push(user);
};

/**
 * Find user by employee ID
 * @param {string} employeeId - Employee ID to search for
 * @returns {Object|null} User object or null if not found
 */
const findUserByEmployeeId = (employeeId) => {
    return users.find(user => user.employeeId === employeeId) || null;
};

/**
 * Find user by ID
 * @param {string} id - User ID to search for
 * @returns {Object|null} User object or null if not found
 */
const findUserById = (id) => {
    return users.find(user => user.id === id) || null;
};

/**
 * Update user data
 * @param {Object} updatedUser - Updated user object
 * @returns {boolean} True if user was updated, false otherwise
 */
const updateUser = (updatedUser) => {
    const index = users.findIndex(user => user.id === updatedUser.id);
    if (index !== -1) {
        users[index] = { ...users[index], ...updatedUser };
        return true;
    }
    return false;
};

/**
 * Delete user (soft delete by setting isActive to false)
 * @param {string} id - User ID to delete
 * @returns {boolean} True if user was deleted, false otherwise
 */
const deleteUser = (id) => {
    const user = findUserById(id);
    if (user) {
        user.isActive = false;
        user.updatedAt = new Date().toISOString();
        return updateUser(user);
    }
    return false;
};

/**
 * Get all users (excluding passwords)
 * @param {Object} filters - Optional filters
 * @returns {Array} Array of users
 */
const getAllUsers = (filters = {}) => {
    let filteredUsers = users.filter(user => user.isActive);

    // Apply filters
    if (filters.role) {
        filteredUsers = filteredUsers.filter(user => user.role === filters.role);
    }

    if (filters.department) {
        filteredUsers = filteredUsers.filter(user => user.department === filters.department);
    }

    if (filters.airline) {
        filteredUsers = filteredUsers.filter(user => user.airline === filters.airline);
    }

    if (filters.clearanceLevel) {
        filteredUsers = filteredUsers.filter(user => user.clearanceLevel >= filters.clearanceLevel);
    }

    // Remove passwords from response
    return filteredUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    });
};

/**
 * Get users by role
 * @param {string} role - Role to filter by
 * @returns {Array} Array of users with the specified role
 */
const getUsersByRole = (role) => {
    return getAllUsers({ role });
};

/**
 * Get users by department
 * @param {string} department - Department to filter by
 * @returns {Array} Array of users in the specified department
 */
const getUsersByDepartment = (department) => {
    return getAllUsers({ department });
};

/**
 * Get users by airline
 * @param {string} airline - Airline to filter by
 * @returns {Array} Array of users from the specified airline
 */
const getUsersByAirline = (airline) => {
    return getAllUsers({ airline });
};

/**
 * Search users by name or employee ID
 * @param {string} query - Search query
 * @returns {Array} Array of matching users
 */
const searchUsers = (query) => {
    const lowercaseQuery = query.toLowerCase();
    const matchingUsers = users.filter(user => 
        user.isActive && (
            user.name.toLowerCase().includes(lowercaseQuery) ||
            user.employeeId.toLowerCase().includes(lowercaseQuery)
        )
    );

    // Remove passwords from response
    return matchingUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    });
};

/**
 * Get user statistics
 * @returns {Object} User statistics
 */
const getUserStats = () => {
    const activeUsers = users.filter(user => user.isActive);
    const totalUsers = activeUsers.length;

    // Count by role
    const byRole = {};
    const byDepartment = {};
    const byAirline = {};
    const byClearanceLevel = {};

    activeUsers.forEach(user => {
        // Role statistics
        byRole[user.role] = (byRole[user.role] || 0) + 1;

        // Department statistics
        byDepartment[user.department] = (byDepartment[user.department] || 0) + 1;

        // Airline statistics
        byAirline[user.airline] = (byAirline[user.airline] || 0) + 1;

        // Clearance level statistics
        byClearanceLevel[user.clearanceLevel] = (byClearanceLevel[user.clearanceLevel] || 0) + 1;
    });

    return {
        total: totalUsers,
        byRole,
        byDepartment,
        byAirline,
        byClearanceLevel
    };
};

/**
 * Validate user data
 * @param {Object} userData - User data to validate
 * @returns {Object} Validation result
 */
const validateUserData = (userData) => {
    const errors = [];

    // Required fields
    const requiredFields = ['employeeId', 'name', 'role', 'department', 'clearanceLevel', 'airline'];
    requiredFields.forEach(field => {
        if (!userData[field]) {
            errors.push(`${field} is required`);
        }
    });

    // Employee ID format
    if (userData.employeeId && !/^[A-Z]{2,3}\d{3,7}$/.test(userData.employeeId)) {
        errors.push('Employee ID must follow format: 2-3 letters followed by 3-7 digits');
    }

    // Valid roles
    const validRoles = ['pilot', 'co-pilot', 'flight-attendant', 'gate-agent', 'ground-crew', 'dispatcher'];
    if (userData.role && !validRoles.includes(userData.role)) {
        errors.push('Invalid role specified');
    }

    // Valid departments
    const validDepartments = ['flight-operations', 'cabin-crew', 'ground-operations', 'dispatch', 'maintenance'];
    if (userData.department && !validDepartments.includes(userData.department)) {
        errors.push('Invalid department specified');
    }

    // Clearance level
    if (userData.clearanceLevel && (userData.clearanceLevel < 1 || userData.clearanceLevel > 5)) {
        errors.push('Clearance level must be between 1 and 5');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Check if employee ID is available
 * @param {string} employeeId - Employee ID to check
 * @returns {boolean} True if available, false if taken
 */
const isEmployeeIdAvailable = (employeeId) => {
    return !findUserByEmployeeId(employeeId);
};

/**
 * Reset user password (admin function)
 * @param {string} employeeId - Employee ID
 * @param {string} newPassword - New password
 * @returns {boolean} True if password was reset, false otherwise
 */
const resetUserPassword = async (employeeId, newPassword) => {
    const user = findUserByEmployeeId(employeeId);
    if (!user) {
        return false;
    }

    try {
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        user.password = hashedPassword;
        user.updatedAt = new Date().toISOString();
        user.failedLoginAttempts = 0;
        user.accountLockedUntil = null;
        
        return updateUser(user);
    } catch (error) {
        return false;
    }
};

/**
 * Lock/unlock user account
 * @param {string} employeeId - Employee ID
 * @param {boolean} locked - True to lock, false to unlock
 * @returns {boolean} True if operation was successful, false otherwise
 */
const setUserLockStatus = (employeeId, locked) => {
    const user = findUserByEmployeeId(employeeId);
    if (!user) {
        return false;
    }

    if (locked) {
        user.accountLockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    } else {
        user.accountLockedUntil = null;
        user.failedLoginAttempts = 0;
    }

    user.updatedAt = new Date().toISOString();
    return updateUser(user);
};

module.exports = {
    users,
    addUser,
    findUserByEmployeeId,
    findUserById,
    updateUser,
    deleteUser,
    getAllUsers,
    getUsersByRole,
    getUsersByDepartment,
    getUsersByAirline,
    searchUsers,
    getUserStats,
    validateUserData,
    isEmployeeIdAvailable,
    resetUserPassword,
    setUserLockStatus
};
