/**
 * Crew Routes
 * 
 * Handles crew member management and information
 * Provides endpoints for crew listings, profiles, and team management
 */

const express = require('express');

const { 
    getAllUsers, 
    getUsersByRole, 
    getUsersByDepartment, 
    searchUsers, 
    getUserStats,
    findUserByEmployeeId 
} = require('../data/users');
const { authenticateToken, requireRole, requireClearance } = require('../middleware/auth');
const { 
    validateEmployeeId, 
    validatePagination, 
    validateSearch,
    validateProfileUpdate 
} = require('../middleware/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * GET /crew
 * Get all crew members (with filters)
 */
router.get('/',
    authenticateToken,
    validatePagination,
    asyncHandler(async (req, res) => {
        const {
            role,
            department,
            airline,
            clearanceLevel,
            page = 1,
            limit = 20,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        // Build filters
        const filters = {};
        if (role) filters.role = role;
        if (department) filters.department = department;
        if (airline) filters.airline = airline;
        if (clearanceLevel) filters.clearanceLevel = parseInt(clearanceLevel);

        // Get filtered users
        let crewMembers = getAllUsers(filters);

        // Sort crew members
        crewMembers.sort((a, b) => {
            const aValue = a[sortBy] || '';
            const bValue = b[sortBy] || '';
            
            if (sortOrder === 'desc') {
                return bValue > aValue ? 1 : -1;
            } else {
                return aValue > bValue ? 1 : -1;
            }
        });

        // Implement pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedCrew = crewMembers.slice(startIndex, endIndex);

        const totalCrew = crewMembers.length;
        const totalPages = Math.ceil(totalCrew / limit);

        res.json({
            status: 'success',
            data: {
                crew: paginatedCrew,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCrew,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                filters: {
                    role,
                    department,
                    airline,
                    clearanceLevel,
                    sortBy,
                    sortOrder
                }
            }
        });
    })
);

/**
 * GET /crew/search
 * Search crew members by name or employee ID
 */
router.get('/search',
    authenticateToken,
    validateSearch,
    validatePagination,
    asyncHandler(async (req, res) => {
        const { q: query, page = 1, limit = 20 } = req.query;

        if (!query) {
            throw new AppError('Search query is required', 400, 'SEARCH_QUERY_REQUIRED');
        }

        // Search users
        const searchResults = searchUsers(query);

        // Implement pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedResults = searchResults.slice(startIndex, endIndex);

        const totalResults = searchResults.length;
        const totalPages = Math.ceil(totalResults / limit);

        res.json({
            status: 'success',
            data: {
                crew: paginatedResults,
                searchQuery: query,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalResults,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });
    })
);

/**
 * GET /crew/:employeeId
 * Get specific crew member details
 */
router.get('/:employeeId',
    authenticateToken,
    validateEmployeeId,
    asyncHandler(async (req, res) => {
        const { employeeId } = req.params;
        
        const crewMember = findUserByEmployeeId(employeeId);
        if (!crewMember) {
            throw new AppError('Crew member not found', 404, 'CREW_MEMBER_NOT_FOUND');
        }

        if (!crewMember.isActive) {
            throw new AppError('Crew member account is inactive', 404, 'CREW_MEMBER_INACTIVE');
        }

        // Remove sensitive information
        const { password, failedLoginAttempts, accountLockedUntil, ...safeCrewMember } = crewMember;

        // Only show personal details to the user themselves or higher clearance
        if (req.user.employeeId !== employeeId && req.user.clearanceLevel < 3) {
            // Limited info for other crew members
            const limitedInfo = {
                employeeId: safeCrewMember.employeeId,
                name: safeCrewMember.name,
                role: safeCrewMember.role,
                department: safeCrewMember.department,
                airline: safeCrewMember.airline
            };
            
            return res.json({
                status: 'success',
                data: {
                    crewMember: limitedInfo
                }
            });
        }

        res.json({
            status: 'success',
            data: {
                crewMember: safeCrewMember
            }
        });
    })
);

/**
 * GET /crew/role/:role
 * Get crew members by role
 */
router.get('/role/:role',
    authenticateToken,
    validatePagination,
    asyncHandler(async (req, res) => {
        const { role } = req.params;
        const { page = 1, limit = 20 } = req.query;

        // Validate role
        const validRoles = ['pilot', 'co-pilot', 'flight-attendant', 'gate-agent', 'ground-crew', 'dispatcher'];
        if (!validRoles.includes(role)) {
            throw new AppError('Invalid role specified', 400, 'INVALID_ROLE');
        }

        // Get crew members by role
        const crewMembers = getUsersByRole(role);

        // Implement pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedCrew = crewMembers.slice(startIndex, endIndex);

        const totalCrew = crewMembers.length;
        const totalPages = Math.ceil(totalCrew / limit);

        res.json({
            status: 'success',
            data: {
                role,
                crew: paginatedCrew,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCrew,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });
    })
);

/**
 * GET /crew/department/:department
 * Get crew members by department
 */
router.get('/department/:department',
    authenticateToken,
    validatePagination,
    asyncHandler(async (req, res) => {
        const { department } = req.params;
        const { page = 1, limit = 20 } = req.query;

        // Validate department
        const validDepartments = ['flight-operations', 'cabin-crew', 'ground-operations', 'dispatch', 'maintenance'];
        if (!validDepartments.includes(department)) {
            throw new AppError('Invalid department specified', 400, 'INVALID_DEPARTMENT');
        }

        // Get crew members by department
        const crewMembers = getUsersByDepartment(department);

        // Implement pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedCrew = crewMembers.slice(startIndex, endIndex);

        const totalCrew = crewMembers.length;
        const totalPages = Math.ceil(totalCrew / limit);

        res.json({
            status: 'success',
            data: {
                department,
                crew: paginatedCrew,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCrew,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });
    })
);

/**
 * GET /crew/stats
 * Get crew statistics (requires elevated permissions)
 */
router.get('/meta/stats',
    authenticateToken,
    requireClearance(3),
    asyncHandler(async (req, res) => {
        const stats = getUserStats();

        res.json({
            status: 'success',
            data: {
                statistics: stats,
                generatedAt: new Date().toISOString()
            }
        });
    })
);

/**
 * PUT /crew/:employeeId/profile
 * Update crew member profile (own profile or admin)
 */
router.put('/:employeeId/profile',
    authenticateToken,
    validateEmployeeId,
    validateProfileUpdate,
    asyncHandler(async (req, res) => {
        const { employeeId } = req.params;
        const { name, department } = req.body;

        // Check if user can update this profile
        if (req.user.employeeId !== employeeId && req.user.clearanceLevel < 4) {
            throw new AppError('Insufficient permissions to update this profile', 403, 'UPDATE_PERMISSION_DENIED');
        }

        const crewMember = findUserByEmployeeId(employeeId);
        if (!crewMember) {
            throw new AppError('Crew member not found', 404, 'CREW_MEMBER_NOT_FOUND');
        }

        if (!crewMember.isActive) {
            throw new AppError('Cannot update inactive crew member', 400, 'CREW_MEMBER_INACTIVE');
        }

        // Update allowed fields
        if (name) crewMember.name = name;
        if (department) crewMember.department = department;
        crewMember.updatedAt = new Date().toISOString();

        // In a real app, this would save to database
        // For now, the object is updated in memory

        logger.info(`Profile updated for ${employeeId} by ${req.user.employeeId}`);

        // Remove sensitive information from response
        const { password, failedLoginAttempts, accountLockedUntil, ...safeCrewMember } = crewMember;

        res.json({
            status: 'success',
            message: 'Profile updated successfully',
            data: {
                crewMember: safeCrewMember
            }
        });
    })
);

/**
 * GET /crew/roles/available
 * Get available roles and departments
 */
router.get('/meta/roles',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const roles = [
            {
                value: 'pilot',
                label: 'Pilot',
                department: 'flight-operations',
                description: 'Aircraft captain responsible for flight operations',
                minClearance: 4,
                maxClearance: 5
            },
            {
                value: 'co-pilot',
                label: 'Co-Pilot / First Officer',
                department: 'flight-operations',
                description: 'First officer assisting the captain',
                minClearance: 3,
                maxClearance: 4
            },
            {
                value: 'flight-attendant',
                label: 'Flight Attendant',
                department: 'cabin-crew',
                description: 'Cabin crew responsible for passenger safety and service',
                minClearance: 1,
                maxClearance: 3
            },
            {
                value: 'gate-agent',
                label: 'Gate Agent',
                department: 'ground-operations',
                description: 'Ground staff handling passenger check-in and boarding',
                minClearance: 1,
                maxClearance: 3
            },
            {
                value: 'ground-crew',
                label: 'Ground Crew',
                department: 'ground-operations',
                description: 'Ground support and baggage handling staff',
                minClearance: 1,
                maxClearance: 3
            },
            {
                value: 'dispatcher',
                label: 'Flight Dispatcher',
                department: 'dispatch',
                description: 'Flight planning and coordination specialist',
                minClearance: 3,
                maxClearance: 5
            }
        ];

        const departments = [
            {
                value: 'flight-operations',
                label: 'Flight Operations',
                description: 'Pilots and flight crew operations'
            },
            {
                value: 'cabin-crew',
                label: 'Cabin Crew',
                description: 'Flight attendants and cabin service'
            },
            {
                value: 'ground-operations',
                label: 'Ground Operations',
                description: 'Ground support and passenger services'
            },
            {
                value: 'dispatch',
                label: 'Flight Dispatch',
                description: 'Flight planning and coordination'
            },
            {
                value: 'maintenance',
                label: 'Maintenance',
                description: 'Aircraft maintenance and technical support'
            }
        ];

        res.json({
            status: 'success',
            data: {
                roles,
                departments
            }
        });
    })
);

/**
 * GET /crew/online
 * Get currently active/online crew members (simulated)
 */
router.get('/status/online',
    authenticateToken,
    asyncHandler(async (req, res) => {
        // Simulate online status - in a real app, this would track actual sessions
        const allCrew = getAllUsers();
        
        // Randomly mark some crew as "online" for demo purposes
        const onlineCrew = allCrew.filter(() => Math.random() > 0.6);
        
        // Add simulated status information
        const crewWithStatus = onlineCrew.map(crew => ({
            ...crew,
            status: 'online',
            lastSeen: new Date().toISOString(),
            location: crew.department === 'flight-operations' ? 'Flight Deck' : 
                     crew.department === 'cabin-crew' ? 'Cabin' :
                     crew.department === 'ground-operations' ? 'Terminal' :
                     crew.department === 'dispatch' ? 'Operations Center' : 'Unknown'
        }));

        res.json({
            status: 'success',
            data: {
                onlineCrew: crewWithStatus,
                totalOnline: crewWithStatus.length,
                lastUpdated: new Date().toISOString()
            }
        });
    })
);

module.exports = router;
