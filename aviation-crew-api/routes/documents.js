/**
 * Documents Routes
 * 
 * Handles secure document sharing for aviation crew members
 * Provides access control, version management, and audit trails
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const { 
    documents, 
    addDocument, 
    findDocumentById, 
    findDocumentsByUser, 
    findDocumentsByFlight,
    updateDocument,
    deleteDocument 
} = require('../data/documents');
const { authenticateToken, requireClearance, requireRole } = require('../middleware/auth');
const { uploadRateLimit } = require('../middleware/security');
const { 
    validateDocument, 
    validatePagination, 
    validateSearch 
} = require('../middleware/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { encryptFile, decryptFile } = require('../utils/encryption');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Maximum 5 files per request
    },
    fileFilter: (req, file, cb) => {
        // Allowed file types
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new AppError('File type not allowed', 400, 'INVALID_FILE_TYPE'), false);
        }
    }
});

/**
 * POST /documents
 * Upload a new document
 */
router.post('/',
    authenticateToken,
    uploadRateLimit,
    upload.array('files', 5),
    validateDocument,
    asyncHandler(async (req, res) => {
        const {
            title,
            description = '',
            category,
            accessLevel,
            flightNumber = null,
            expiresAt = null
        } = req.body;

        if (!req.files || req.files.length === 0) {
            throw new AppError('No files uploaded', 400, 'NO_FILES');
        }

        // Check user's clearance level
        if (parseInt(accessLevel) > req.user.clearanceLevel) {
            throw new AppError(
                'Insufficient clearance to set this access level', 
                403, 
                'INSUFFICIENT_CLEARANCE'
            );
        }

        const uploadedDocuments = [];

        for (const file of req.files) {
            // Encrypt file content
            const encrypted = encryptFile(file.buffer);

            // Create document record
            const newDocument = {
                id: uuidv4(),
                title: req.files.length > 1 ? `${title} - ${file.originalname}` : title,
                description,
                category,
                accessLevel: parseInt(accessLevel),
                flightNumber,
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                encryptedContent: encrypted.encryptedContent,
                encryptionKey: encrypted.key,
                uploadedBy: req.user.employeeId,
                uploaderName: req.user.name,
                uploaderRole: req.user.role,
                status: 'active',
                downloadCount: 0,
                expiresAt,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                accessLog: [{
                    action: 'uploaded',
                    employeeId: req.user.employeeId,
                    name: req.user.name,
                    timestamp: new Date().toISOString(),
                    details: 'Document uploaded'
                }]
            };

            // Add document to data store
            addDocument(newDocument);
            uploadedDocuments.push(newDocument);

            logger.info(`Document uploaded: ${newDocument.id} by ${req.user.employeeId}`, {
                title: newDocument.title,
                category,
                accessLevel,
                fileSize: file.size
            });
        }

        // Return document data (excluding encryption details)
        const responseDocuments = uploadedDocuments.map(doc => {
            const { encryptedContent, encryptionKey, ...docResponse } = doc;
            return docResponse;
        });

        res.status(201).json({
            status: 'success',
            message: `${uploadedDocuments.length} document(s) uploaded successfully`,
            data: {
                documents: responseDocuments
            }
        });
    })
);

/**
 * GET /documents
 * Get documents accessible to current user
 */
router.get('/',
    authenticateToken,
    validatePagination,
    validateSearch,
    asyncHandler(async (req, res) => {
        const {
            category,
            flightNumber,
            q: searchQuery,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Filter documents by user's clearance level
        let userDocuments = documents.filter(doc => 
            doc.accessLevel <= req.user.clearanceLevel && 
            doc.status === 'active'
        );

        // Check expiration
        userDocuments = userDocuments.filter(doc => {
            if (!doc.expiresAt) return true;
            return new Date() < new Date(doc.expiresAt);
        });

        // Apply filters
        if (category) {
            userDocuments = userDocuments.filter(doc => doc.category === category);
        }

        if (flightNumber) {
            userDocuments = userDocuments.filter(doc => doc.flightNumber === flightNumber);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            userDocuments = userDocuments.filter(doc =>
                doc.title.toLowerCase().includes(query) ||
                doc.description.toLowerCase().includes(query) ||
                doc.fileName.toLowerCase().includes(query)
            );
        }

        // Sort documents
        userDocuments.sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];
            
            if (sortOrder === 'desc') {
                return bValue > aValue ? 1 : -1;
            } else {
                return aValue > bValue ? 1 : -1;
            }
        });

        // Implement pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedDocuments = userDocuments.slice(startIndex, endIndex);

        // Remove sensitive data from response
        const responseDocuments = paginatedDocuments.map(doc => {
            const { encryptedContent, encryptionKey, ...docResponse } = doc;
            return docResponse;
        });

        const totalDocuments = userDocuments.length;
        const totalPages = Math.ceil(totalDocuments / limit);

        res.json({
            status: 'success',
            data: {
                documents: responseDocuments,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalDocuments,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                filters: {
                    category,
                    flightNumber,
                    searchQuery,
                    sortBy,
                    sortOrder
                }
            }
        });
    })
);

/**
 * GET /documents/:id
 * Get document details by ID
 */
router.get('/:id',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const document = findDocumentById(id);

        if (!document) {
            throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
        }

        // Check access permissions
        if (document.accessLevel > req.user.clearanceLevel) {
            throw new AppError('Insufficient clearance to access this document', 403, 'ACCESS_DENIED');
        }

        // Check if document is expired
        if (document.expiresAt && new Date() > new Date(document.expiresAt)) {
            throw new AppError('Document has expired', 410, 'DOCUMENT_EXPIRED');
        }

        // Log access
        document.accessLog.push({
            action: 'viewed',
            employeeId: req.user.employeeId,
            name: req.user.name,
            timestamp: new Date().toISOString(),
            details: 'Document details viewed'
        });
        updateDocument(document);

        // Remove sensitive data from response
        const { encryptedContent, encryptionKey, ...documentResponse } = document;

        res.json({
            status: 'success',
            data: {
                document: documentResponse
            }
        });
    })
);

/**
 * GET /documents/:id/download
 * Download document file
 */
router.get('/:id/download',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const document = findDocumentById(id);

        if (!document) {
            throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
        }

        // Check access permissions
        if (document.accessLevel > req.user.clearanceLevel) {
            throw new AppError('Insufficient clearance to download this document', 403, 'DOWNLOAD_ACCESS_DENIED');
        }

        // Check if document is expired
        if (document.expiresAt && new Date() > new Date(document.expiresAt)) {
            throw new AppError('Document has expired', 410, 'DOCUMENT_EXPIRED');
        }

        try {
            // Decrypt file content
            const decryptedContent = decryptFile(document.encryptedContent, document.encryptionKey);

            // Update download count and log access
            document.downloadCount += 1;
            document.accessLog.push({
                action: 'downloaded',
                employeeId: req.user.employeeId,
                name: req.user.name,
                timestamp: new Date().toISOString(),
                details: 'Document downloaded'
            });
            document.updatedAt = new Date().toISOString();
            updateDocument(document);

            logger.info(`Document downloaded: ${id} by ${req.user.employeeId}`);

            // Set appropriate headers for file download
            res.setHeader('Content-Type', document.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
            res.setHeader('Content-Length', decryptedContent.length);

            res.send(decryptedContent);

        } catch (error) {
            logger.error('Failed to decrypt document:', error);
            throw new AppError('Failed to decrypt document', 500, 'DECRYPTION_FAILED');
        }
    })
);

/**
 * PUT /documents/:id
 * Update document metadata
 */
router.put('/:id',
    authenticateToken,
    validateDocument,
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const document = findDocumentById(id);

        if (!document) {
            throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
        }

        // Only uploader or high clearance users can update
        if (document.uploadedBy !== req.user.employeeId && req.user.clearanceLevel < 4) {
            throw new AppError('Insufficient permissions to update this document', 403, 'UPDATE_ACCESS_DENIED');
        }

        const {
            title,
            description,
            category,
            accessLevel,
            flightNumber,
            expiresAt
        } = req.body;

        // Check user's clearance for new access level
        if (accessLevel && parseInt(accessLevel) > req.user.clearanceLevel) {
            throw new AppError(
                'Insufficient clearance to set this access level', 
                403, 
                'INSUFFICIENT_CLEARANCE'
            );
        }

        // Update document
        if (title) document.title = title;
        if (description !== undefined) document.description = description;
        if (category) document.category = category;
        if (accessLevel) document.accessLevel = parseInt(accessLevel);
        if (flightNumber !== undefined) document.flightNumber = flightNumber;
        if (expiresAt !== undefined) document.expiresAt = expiresAt;
        
        document.updatedAt = new Date().toISOString();
        
        // Log update
        document.accessLog.push({
            action: 'updated',
            employeeId: req.user.employeeId,
            name: req.user.name,
            timestamp: new Date().toISOString(),
            details: 'Document metadata updated'
        });

        updateDocument(document);

        logger.info(`Document updated: ${id} by ${req.user.employeeId}`);

        // Remove sensitive data from response
        const { encryptedContent, encryptionKey, ...documentResponse } = document;

        res.json({
            status: 'success',
            message: 'Document updated successfully',
            data: {
                document: documentResponse
            }
        });
    })
);

/**
 * DELETE /documents/:id
 * Delete document
 */
router.delete('/:id',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const document = findDocumentById(id);

        if (!document) {
            throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
        }

        // Only uploader or admin can delete
        if (document.uploadedBy !== req.user.employeeId && req.user.clearanceLevel < 5) {
            throw new AppError('Insufficient permissions to delete this document', 403, 'DELETE_ACCESS_DENIED');
        }

        // Soft delete (mark as inactive)
        document.status = 'deleted';
        document.updatedAt = new Date().toISOString();
        document.accessLog.push({
            action: 'deleted',
            employeeId: req.user.employeeId,
            name: req.user.name,
            timestamp: new Date().toISOString(),
            details: 'Document deleted'
        });

        updateDocument(document);

        logger.info(`Document deleted: ${id} by ${req.user.employeeId}`);

        res.json({
            status: 'success',
            message: 'Document deleted successfully'
        });
    })
);

/**
 * GET /documents/flight/:flightNumber
 * Get all documents for a specific flight
 */
router.get('/flight/:flightNumber',
    authenticateToken,
    requireRole(['pilot', 'co-pilot', 'flight-attendant', 'dispatcher']),
    validatePagination,
    asyncHandler(async (req, res) => {
        const { flightNumber } = req.params;
        const { page = 1, limit = 20 } = req.query;

        let flightDocuments = findDocumentsByFlight(flightNumber);

        // Filter by clearance level
        flightDocuments = flightDocuments.filter(doc => 
            doc.accessLevel <= req.user.clearanceLevel && 
            doc.status === 'active'
        );

        // Check expiration
        flightDocuments = flightDocuments.filter(doc => {
            if (!doc.expiresAt) return true;
            return new Date() < new Date(doc.expiresAt);
        });

        // Sort by creation date (newest first)
        flightDocuments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Implement pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedDocuments = flightDocuments.slice(startIndex, endIndex);

        // Remove sensitive data from response
        const responseDocuments = paginatedDocuments.map(doc => {
            const { encryptedContent, encryptionKey, ...docResponse } = doc;
            return docResponse;
        });

        const totalDocuments = flightDocuments.length;
        const totalPages = Math.ceil(totalDocuments / limit);

        res.json({
            status: 'success',
            data: {
                flightNumber,
                documents: responseDocuments,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalDocuments,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });
    })
);

/**
 * GET /documents/categories
 * Get available document categories
 */
router.get('/meta/categories',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const categories = [
            {
                value: 'flight-plan',
                label: 'Flight Plan',
                description: 'Flight planning documents and route information',
                minClearance: 2
            },
            {
                value: 'weather',
                label: 'Weather',
                description: 'Weather reports and forecasts',
                minClearance: 1
            },
            {
                value: 'maintenance',
                label: 'Maintenance',
                description: 'Aircraft maintenance logs and reports',
                minClearance: 3
            },
            {
                value: 'crew-manifest',
                label: 'Crew Manifest',
                description: 'Crew assignments and schedules',
                minClearance: 2
            },
            {
                value: 'safety',
                label: 'Safety',
                description: 'Safety reports and procedures',
                minClearance: 2
            },
            {
                value: 'operational',
                label: 'Operational',
                description: 'General operational documents',
                minClearance: 1
            }
        ];

        // Filter categories by user's clearance level
        const accessibleCategories = categories.filter(cat => 
            cat.minClearance <= req.user.clearanceLevel
        );

        res.json({
            status: 'success',
            data: {
                categories: accessibleCategories
            }
        });
    })
);

module.exports = router;
