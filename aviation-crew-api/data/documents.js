/**
 * Documents Data Model
 * 
 * In-memory data store for secure document sharing
 * In a real application, this would be replaced with a database
 */

// In-memory documents storage
let documents = [
    {
        id: 'doc-001',
        title: 'AA1234 Flight Plan',
        description: 'Complete flight plan for AA1234 from JFK to LAX',
        category: 'flight-plan',
        accessLevel: 4,
        flightNumber: 'AA1234',
        fileName: 'AA1234-flight-plan.pdf',
        fileSize: 2458621,
        mimeType: 'application/pdf',
        encryptedContent: 'encrypted_content_base64_string_here',
        encryptionKey: 'encryption_key_base64_here',
        uploadedBy: 'AA12349',
        uploaderName: 'Dispatcher Jennifer Wilson',
        uploaderRole: 'dispatcher',
        status: 'active',
        downloadCount: 3,
        expiresAt: null,
        createdAt: '2024-01-15T12:00:00.000Z',
        updatedAt: '2024-01-15T12:00:00.000Z',
        accessLog: [
            {
                action: 'uploaded',
                employeeId: 'AA12349',
                name: 'Dispatcher Jennifer Wilson',
                timestamp: '2024-01-15T12:00:00.000Z',
                details: 'Document uploaded'
            },
            {
                action: 'downloaded',
                employeeId: 'AA12345',
                name: 'Captain Sarah Johnson',
                timestamp: '2024-01-15T13:15:00.000Z',
                details: 'Document downloaded'
            }
        ]
    },
    {
        id: 'doc-002',
        title: 'Weather Report - Chicago Area',
        description: 'Current weather conditions and forecast for Chicago airspace',
        category: 'weather',
        accessLevel: 1,
        flightNumber: 'AA1234',
        fileName: 'chicago-weather-report.pdf',
        fileSize: 1024576,
        mimeType: 'application/pdf',
        encryptedContent: 'encrypted_weather_content_base64_string_here',
        encryptionKey: 'weather_encryption_key_base64_here',
        uploadedBy: 'AA12349',
        uploaderName: 'Dispatcher Jennifer Wilson',
        uploaderRole: 'dispatcher',
        status: 'active',
        downloadCount: 5,
        expiresAt: '2024-01-16T12:00:00.000Z',
        createdAt: '2024-01-15T11:30:00.000Z',
        updatedAt: '2024-01-15T11:30:00.000Z',
        accessLog: [
            {
                action: 'uploaded',
                employeeId: 'AA12349',
                name: 'Dispatcher Jennifer Wilson',
                timestamp: '2024-01-15T11:30:00.000Z',
                details: 'Document uploaded'
            }
        ]
    },
    {
        id: 'doc-003',
        title: 'Aircraft Maintenance Log - N123AA',
        description: 'Maintenance inspection report for aircraft N123AA',
        category: 'maintenance',
        accessLevel: 3,
        flightNumber: 'AA1234',
        fileName: 'N123AA-maintenance-log.xlsx',
        fileSize: 512000,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        encryptedContent: 'encrypted_maintenance_content_base64_string_here',
        encryptionKey: 'maintenance_encryption_key_base64_here',
        uploadedBy: 'AA12350',
        uploaderName: 'Maintenance Chief Tom Anderson',
        uploaderRole: 'maintenance',
        status: 'active',
        downloadCount: 2,
        expiresAt: null,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
        accessLog: [
            {
                action: 'uploaded',
                employeeId: 'AA12350',
                name: 'Maintenance Chief Tom Anderson',
                timestamp: '2024-01-15T10:00:00.000Z',
                details: 'Document uploaded'
            }
        ]
    },
    {
        id: 'doc-004',
        title: 'Crew Manifest - AA1234',
        description: 'Complete crew assignments and contact information for flight AA1234',
        category: 'crew-manifest',
        accessLevel: 2,
        flightNumber: 'AA1234',
        fileName: 'AA1234-crew-manifest.docx',
        fileSize: 256000,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        encryptedContent: 'encrypted_crew_content_base64_string_here',
        encryptionKey: 'crew_encryption_key_base64_here',
        uploadedBy: 'AA12348',
        uploaderName: 'Gate Agent Robert Davis',
        uploaderRole: 'gate-agent',
        status: 'active',
        downloadCount: 4,
        expiresAt: '2024-01-17T00:00:00.000Z',
        createdAt: '2024-01-15T09:00:00.000Z',
        updatedAt: '2024-01-15T09:00:00.000Z',
        accessLog: [
            {
                action: 'uploaded',
                employeeId: 'AA12348',
                name: 'Gate Agent Robert Davis',
                timestamp: '2024-01-15T09:00:00.000Z',
                details: 'Document uploaded'
            }
        ]
    },
    {
        id: 'doc-005',
        title: 'Safety Briefing - Winter Operations',
        description: 'Updated safety procedures for winter weather operations',
        category: 'safety',
        accessLevel: 1,
        flightNumber: null,
        fileName: 'winter-operations-safety.pdf',
        fileSize: 3072000,
        mimeType: 'application/pdf',
        encryptedContent: 'encrypted_safety_content_base64_string_here',
        encryptionKey: 'safety_encryption_key_base64_here',
        uploadedBy: 'AA12351',
        uploaderName: 'Safety Officer Maria Garcia',
        uploaderRole: 'safety-officer',
        status: 'active',
        downloadCount: 12,
        expiresAt: '2024-03-01T00:00:00.000Z',
        createdAt: '2024-01-10T08:00:00.000Z',
        updatedAt: '2024-01-10T08:00:00.000Z',
        accessLog: [
            {
                action: 'uploaded',
                employeeId: 'AA12351',
                name: 'Safety Officer Maria Garcia',
                timestamp: '2024-01-10T08:00:00.000Z',
                details: 'Document uploaded'
            }
        ]
    }
];

/**
 * Add a new document to the data store
 * @param {Object} document - Document object to add
 */
const addDocument = (document) => {
    documents.push(document);
};

/**
 * Find document by ID
 * @param {string} id - Document ID to search for
 * @returns {Object|null} Document object or null if not found
 */
const findDocumentById = (id) => {
    return documents.find(document => document.id === id) || null;
};

/**
 * Find documents by user (uploaded by)
 * @param {string} employeeId - Employee ID to search for
 * @returns {Array} Array of documents uploaded by the user
 */
const findDocumentsByUser = (employeeId) => {
    return documents.filter(document => 
        document.uploadedBy === employeeId && document.status === 'active'
    );
};

/**
 * Find documents by flight number
 * @param {string} flightNumber - Flight number to search for
 * @returns {Array} Array of documents for the flight
 */
const findDocumentsByFlight = (flightNumber) => {
    return documents.filter(document => 
        document.flightNumber === flightNumber && document.status === 'active'
    );
};

/**
 * Update document data
 * @param {Object} updatedDocument - Updated document object
 * @returns {boolean} True if document was updated, false otherwise
 */
const updateDocument = (updatedDocument) => {
    const index = documents.findIndex(document => document.id === updatedDocument.id);
    if (index !== -1) {
        documents[index] = { ...documents[index], ...updatedDocument };
        return true;
    }
    return false;
};

/**
 * Delete document (soft delete by setting status to 'deleted')
 * @param {string} id - Document ID to delete
 * @returns {boolean} True if document was deleted, false otherwise
 */
const deleteDocument = (id) => {
    const document = findDocumentById(id);
    if (document) {
        document.status = 'deleted';
        document.updatedAt = new Date().toISOString();
        return updateDocument(document);
    }
    return false;
};

/**
 * Get all documents with filters
 * @param {Object} filters - Optional filters
 * @returns {Array} Array of filtered documents
 */
const getAllDocuments = (filters = {}) => {
    let filteredDocuments = documents.filter(doc => doc.status === 'active');

    // Apply filters
    if (filters.category) {
        filteredDocuments = filteredDocuments.filter(doc => doc.category === filters.category);
    }

    if (filters.flightNumber) {
        filteredDocuments = filteredDocuments.filter(doc => doc.flightNumber === filters.flightNumber);
    }

    if (filters.uploadedBy) {
        filteredDocuments = filteredDocuments.filter(doc => doc.uploadedBy === filters.uploadedBy);
    }

    if (filters.accessLevel) {
        filteredDocuments = filteredDocuments.filter(doc => doc.accessLevel <= filters.accessLevel);
    }

    if (filters.startDate) {
        filteredDocuments = filteredDocuments.filter(doc => 
            new Date(doc.createdAt) >= new Date(filters.startDate)
        );
    }

    if (filters.endDate) {
        filteredDocuments = filteredDocuments.filter(doc => 
            new Date(doc.createdAt) <= new Date(filters.endDate)
        );
    }

    // Filter out expired documents
    const now = new Date();
    filteredDocuments = filteredDocuments.filter(doc => 
        !doc.expiresAt || new Date(doc.expiresAt) > now
    );

    return filteredDocuments;
};

/**
 * Search documents by title, description, or filename
 * @param {string} query - Search query
 * @param {Object} userContext - User context for access level filtering
 * @returns {Array} Array of matching documents
 */
const searchDocuments = (query, userContext = {}) => {
    const lowercaseQuery = query.toLowerCase();
    let searchDocuments = documents.filter(doc => doc.status === 'active');

    // Filter by access level if user context provided
    if (userContext.clearanceLevel) {
        searchDocuments = searchDocuments.filter(doc => 
            doc.accessLevel <= userContext.clearanceLevel
        );
    }

    // Filter out expired documents
    const now = new Date();
    searchDocuments = searchDocuments.filter(doc => 
        !doc.expiresAt || new Date(doc.expiresAt) > now
    );

    return searchDocuments.filter(doc => 
        doc.title.toLowerCase().includes(lowercaseQuery) ||
        doc.description.toLowerCase().includes(lowercaseQuery) ||
        doc.fileName.toLowerCase().includes(lowercaseQuery) ||
        (doc.flightNumber && doc.flightNumber.toLowerCase().includes(lowercaseQuery))
    );
};

/**
 * Get documents by category
 * @param {string} category - Document category
 * @param {number} maxAccessLevel - Maximum access level to filter by
 * @returns {Array} Array of documents in the category
 */
const getDocumentsByCategory = (category, maxAccessLevel = 5) => {
    return getAllDocuments({ category, accessLevel: maxAccessLevel });
};

/**
 * Get recently uploaded documents
 * @param {number} days - Number of days to look back
 * @param {number} maxAccessLevel - Maximum access level to filter by
 * @returns {Array} Array of recent documents
 */
const getRecentDocuments = (days = 7, maxAccessLevel = 5) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return getAllDocuments({ 
        startDate: startDate.toISOString(),
        accessLevel: maxAccessLevel
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * Get document statistics
 * @param {string} employeeId - Employee ID (optional, for user-specific stats)
 * @returns {Object} Document statistics
 */
const getDocumentStats = (employeeId = null) => {
    let targetDocuments = documents.filter(doc => doc.status === 'active');

    if (employeeId) {
        targetDocuments = findDocumentsByUser(employeeId);
    }

    const stats = {
        total: targetDocuments.length,
        totalSize: targetDocuments.reduce((sum, doc) => sum + doc.fileSize, 0),
        byCategory: {},
        byAccessLevel: {},
        byMimeType: {},
        totalDownloads: targetDocuments.reduce((sum, doc) => sum + doc.downloadCount, 0),
        expiringWithin7Days: 0
    };

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    targetDocuments.forEach(doc => {
        // Category statistics
        stats.byCategory[doc.category] = (stats.byCategory[doc.category] || 0) + 1;

        // Access level statistics
        stats.byAccessLevel[doc.accessLevel] = (stats.byAccessLevel[doc.accessLevel] || 0) + 1;

        // MIME type statistics
        stats.byMimeType[doc.mimeType] = (stats.byMimeType[doc.mimeType] || 0) + 1;

        // Expiring documents
        if (doc.expiresAt && new Date(doc.expiresAt) <= sevenDaysFromNow) {
            stats.expiringWithin7Days++;
        }
    });

    return stats;
};

/**
 * Validate document data
 * @param {Object} documentData - Document data to validate
 * @returns {Object} Validation result
 */
const validateDocumentData = (documentData) => {
    const errors = [];

    // Required fields
    const requiredFields = ['title', 'category', 'accessLevel'];
    requiredFields.forEach(field => {
        if (!documentData[field]) {
            errors.push(`${field} is required`);
        }
    });

    // Title length
    if (documentData.title && documentData.title.length > 100) {
        errors.push('Title cannot exceed 100 characters');
    }

    // Description length
    if (documentData.description && documentData.description.length > 500) {
        errors.push('Description cannot exceed 500 characters');
    }

    // Valid categories
    const validCategories = ['flight-plan', 'weather', 'maintenance', 'crew-manifest', 'safety', 'operational'];
    if (documentData.category && !validCategories.includes(documentData.category)) {
        errors.push('Invalid category specified');
    }

    // Access level
    if (documentData.accessLevel && (documentData.accessLevel < 1 || documentData.accessLevel > 5)) {
        errors.push('Access level must be between 1 and 5');
    }

    // Flight number format
    if (documentData.flightNumber && !/^[A-Z]{2,3}\d{1,4}[A-Z]?$/.test(documentData.flightNumber)) {
        errors.push('Invalid flight number format');
    }

    // Expiration date
    if (documentData.expiresAt) {
        const expiryDate = new Date(documentData.expiresAt);
        if (isNaN(expiryDate.getTime())) {
            errors.push('Invalid expiration date format');
        } else if (expiryDate <= new Date()) {
            errors.push('Expiration date must be in the future');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Log document access
 * @param {string} documentId - Document ID
 * @param {string} action - Action performed ('viewed', 'downloaded', etc.)
 * @param {Object} user - User object
 * @param {string} details - Additional details
 * @returns {boolean} True if logged successfully
 */
const logDocumentAccess = (documentId, action, user, details = '') => {
    const document = findDocumentById(documentId);
    if (!document) {
        return false;
    }

    const logEntry = {
        action,
        employeeId: user.employeeId,
        name: user.name,
        timestamp: new Date().toISOString(),
        details
    };

    document.accessLog.push(logEntry);
    document.updatedAt = new Date().toISOString();

    return updateDocument(document);
};

/**
 * Get expiring documents
 * @param {number} days - Number of days ahead to check
 * @param {number} maxAccessLevel - Maximum access level to filter by
 * @returns {Array} Array of expiring documents
 */
const getExpiringDocuments = (days = 7, maxAccessLevel = 5) => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return documents.filter(doc => 
        doc.status === 'active' &&
        doc.accessLevel <= maxAccessLevel &&
        doc.expiresAt &&
        new Date(doc.expiresAt) <= futureDate &&
        new Date(doc.expiresAt) > now
    ).sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt));
};

/**
 * Clean up expired documents
 * @returns {number} Number of documents cleaned up
 */
const cleanupExpiredDocuments = () => {
    const now = new Date();
    let cleanedCount = 0;

    documents.forEach(doc => {
        if (doc.expiresAt && new Date(doc.expiresAt) <= now && doc.status === 'active') {
            doc.status = 'expired';
            doc.updatedAt = new Date().toISOString();
            cleanedCount++;
        }
    });

    return cleanedCount;
};

/**
 * Get most downloaded documents
 * @param {number} limit - Number of documents to return
 * @param {number} maxAccessLevel - Maximum access level to filter by
 * @returns {Array} Array of most downloaded documents
 */
const getMostDownloadedDocuments = (limit = 10, maxAccessLevel = 5) => {
    return documents
        .filter(doc => 
            doc.status === 'active' && 
            doc.accessLevel <= maxAccessLevel
        )
        .sort((a, b) => b.downloadCount - a.downloadCount)
        .slice(0, limit);
};

/**
 * Get document access history
 * @param {string} documentId - Document ID
 * @returns {Array} Array of access log entries
 */
const getDocumentAccessHistory = (documentId) => {
    const document = findDocumentById(documentId);
    return document ? document.accessLog : [];
};

module.exports = {
    documents,
    addDocument,
    findDocumentById,
    findDocumentsByUser,
    findDocumentsByFlight,
    updateDocument,
    deleteDocument,
    getAllDocuments,
    searchDocuments,
    getDocumentsByCategory,
    getRecentDocuments,
    getDocumentStats,
    validateDocumentData,
    logDocumentAccess,
    getExpiringDocuments,
    cleanupExpiredDocuments,
    getMostDownloadedDocuments,
    getDocumentAccessHistory
};
