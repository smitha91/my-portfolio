/**
 * Messages Data Model
 * 
 * In-memory data store for secure crew communications
 * In a real application, this would be replaced with a database
 */

// In-memory messages storage
let messages = [
    {
        id: 'msg-001',
        senderId: 'AA12345',
        senderName: 'Captain Sarah Johnson',
        senderRole: 'pilot',
        recipientId: 'AA12346',
        recipientName: 'First Officer Mike Chen',
        recipientRole: 'co-pilot',
        content: 'Weather update for flight AA1234 - expect turbulence over Chicago area around 2:30 PM EST.',
        originalContent: 'Weather update for flight AA1234 - expect turbulence over Chicago area around 2:30 PM EST.',
        isEncrypted: false,
        encryptionKey: null,
        priority: 'high',
        category: 'weather',
        flightNumber: 'AA1234',
        status: 'sent',
        readAt: '2024-01-15T14:15:00.000Z',
        createdAt: '2024-01-15T14:10:00.000Z',
        updatedAt: '2024-01-15T14:15:00.000Z'
    },
    {
        id: 'msg-002',
        senderId: 'AA12349',
        senderName: 'Dispatcher Jennifer Wilson',
        senderRole: 'dispatcher',
        recipientId: 'AA12345',
        recipientName: 'Captain Sarah Johnson',
        recipientRole: 'pilot',
        content: 'Flight plan revision: Route change due to air traffic. New routing via WYNDE waypoint.',
        originalContent: 'Flight plan revision: Route change due to air traffic. New routing via WYNDE waypoint.',
        isEncrypted: false,
        encryptionKey: null,
        priority: 'urgent',
        category: 'flight-plan',
        flightNumber: 'AA1234',
        status: 'sent',
        readAt: null,
        createdAt: '2024-01-15T13:45:00.000Z',
        updatedAt: '2024-01-15T13:45:00.000Z'
    },
    {
        id: 'msg-003',
        senderId: 'AA12347',
        senderName: 'Flight Attendant Lisa Martinez',
        senderRole: 'flight-attendant',
        recipientId: 'AA12345',
        recipientName: 'Captain Sarah Johnson',
        recipientRole: 'pilot',
        content: 'Cabin secure for takeoff. All passengers seated and belted.',
        originalContent: 'Cabin secure for takeoff. All passengers seated and belted.',
        isEncrypted: false,
        encryptionKey: null,
        priority: 'normal',
        category: 'safety',
        flightNumber: 'AA1234',
        status: 'sent',
        readAt: '2024-01-15T15:02:00.000Z',
        createdAt: '2024-01-15T15:00:00.000Z',
        updatedAt: '2024-01-15T15:02:00.000Z'
    },
    {
        id: 'msg-004',
        senderId: 'AA12348',
        senderName: 'Gate Agent Robert Davis',
        senderRole: 'gate-agent',
        recipientId: 'AA12345',
        recipientName: 'Captain Sarah Johnson',
        recipientRole: 'pilot',
        content: 'Final passenger count: 156 passengers, 8 crew. Boarding complete.',
        originalContent: 'Final passenger count: 156 passengers, 8 crew. Boarding complete.',
        isEncrypted: false,
        encryptionKey: null,
        priority: 'normal',
        category: 'operational',
        flightNumber: 'AA1234',
        status: 'sent',
        readAt: null,
        createdAt: '2024-01-15T14:55:00.000Z',
        updatedAt: '2024-01-15T14:55:00.000Z'
    }
];

/**
 * Add a new message to the data store
 * @param {Object} message - Message object to add
 */
const addMessage = (message) => {
    messages.push(message);
};

/**
 * Find message by ID
 * @param {string} id - Message ID to search for
 * @returns {Object|null} Message object or null if not found
 */
const findMessageById = (id) => {
    return messages.find(message => message.id === id) || null;
};

/**
 * Find messages by user (sent or received)
 * @param {string} employeeId - Employee ID to search for
 * @param {string} type - 'sent', 'received', or 'all'
 * @returns {Array} Array of messages
 */
const findMessagesByUser = (employeeId, type = 'all') => {
    switch (type) {
        case 'sent':
            return messages.filter(message => message.senderId === employeeId);
        case 'received':
            return messages.filter(message => message.recipientId === employeeId);
        default:
            return messages.filter(message => 
                message.senderId === employeeId || message.recipientId === employeeId
            );
    }
};

/**
 * Find messages by flight number
 * @param {string} flightNumber - Flight number to search for
 * @returns {Array} Array of messages for the flight
 */
const findMessagesByFlight = (flightNumber) => {
    return messages.filter(message => message.flightNumber === flightNumber);
};

/**
 * Update message data
 * @param {Object} updatedMessage - Updated message object
 * @returns {boolean} True if message was updated, false otherwise
 */
const updateMessage = (updatedMessage) => {
    const index = messages.findIndex(message => message.id === updatedMessage.id);
    if (index !== -1) {
        messages[index] = { ...messages[index], ...updatedMessage };
        return true;
    }
    return false;
};

/**
 * Delete message
 * @param {string} id - Message ID to delete
 * @returns {boolean} True if message was deleted, false otherwise
 */
const deleteMessage = (id) => {
    const index = messages.findIndex(message => message.id === id);
    if (index !== -1) {
        messages.splice(index, 1);
        return true;
    }
    return false;
};

/**
 * Get all messages with filters
 * @param {Object} filters - Optional filters
 * @returns {Array} Array of filtered messages
 */
const getAllMessages = (filters = {}) => {
    let filteredMessages = messages;

    // Apply filters
    if (filters.senderId) {
        filteredMessages = filteredMessages.filter(message => message.senderId === filters.senderId);
    }

    if (filters.recipientId) {
        filteredMessages = filteredMessages.filter(message => message.recipientId === filters.recipientId);
    }

    if (filters.priority) {
        filteredMessages = filteredMessages.filter(message => message.priority === filters.priority);
    }

    if (filters.category) {
        filteredMessages = filteredMessages.filter(message => message.category === filters.category);
    }

    if (filters.flightNumber) {
        filteredMessages = filteredMessages.filter(message => message.flightNumber === filters.flightNumber);
    }

    if (filters.unreadOnly) {
        filteredMessages = filteredMessages.filter(message => !message.readAt);
    }

    if (filters.startDate) {
        filteredMessages = filteredMessages.filter(message => 
            new Date(message.createdAt) >= new Date(filters.startDate)
        );
    }

    if (filters.endDate) {
        filteredMessages = filteredMessages.filter(message => 
            new Date(message.createdAt) <= new Date(filters.endDate)
        );
    }

    return filteredMessages;
};

/**
 * Search messages by content
 * @param {string} query - Search query
 * @param {string} userId - User ID to limit search to their messages
 * @returns {Array} Array of matching messages
 */
const searchMessages = (query, userId = null) => {
    const lowercaseQuery = query.toLowerCase();
    let searchMessages = messages;

    // Limit to user's messages if userId provided
    if (userId) {
        searchMessages = findMessagesByUser(userId);
    }

    return searchMessages.filter(message => 
        message.content.toLowerCase().includes(lowercaseQuery) ||
        message.senderName.toLowerCase().includes(lowercaseQuery) ||
        message.recipientName.toLowerCase().includes(lowercaseQuery) ||
        (message.flightNumber && message.flightNumber.toLowerCase().includes(lowercaseQuery))
    );
};

/**
 * Get unread message count for a user
 * @param {string} employeeId - Employee ID
 * @returns {number} Number of unread messages
 */
const getUnreadCount = (employeeId) => {
    return messages.filter(message => 
        message.recipientId === employeeId && !message.readAt
    ).length;
};

/**
 * Get unread messages by priority for a user
 * @param {string} employeeId - Employee ID
 * @returns {Object} Object with priority counts
 */
const getUnreadByPriority = (employeeId) => {
    const unreadMessages = messages.filter(message => 
        message.recipientId === employeeId && !message.readAt
    );

    const priorityCounts = {
        urgent: 0,
        high: 0,
        normal: 0,
        low: 0
    };

    unreadMessages.forEach(message => {
        priorityCounts[message.priority] = (priorityCounts[message.priority] || 0) + 1;
    });

    return priorityCounts;
};

/**
 * Mark message as read
 * @param {string} messageId - Message ID
 * @param {string} employeeId - Employee ID (must be recipient)
 * @returns {boolean} True if marked as read, false otherwise
 */
const markAsRead = (messageId, employeeId) => {
    const message = findMessageById(messageId);
    if (!message || message.recipientId !== employeeId) {
        return false;
    }

    if (!message.readAt) {
        message.readAt = new Date().toISOString();
        message.updatedAt = new Date().toISOString();
        return updateMessage(message);
    }

    return true;
};

/**
 * Mark multiple messages as read
 * @param {Array} messageIds - Array of message IDs
 * @param {string} employeeId - Employee ID (must be recipient)
 * @returns {number} Number of messages marked as read
 */
const markMultipleAsRead = (messageIds, employeeId) => {
    let markedCount = 0;
    
    messageIds.forEach(messageId => {
        if (markAsRead(messageId, employeeId)) {
            markedCount++;
        }
    });

    return markedCount;
};

/**
 * Get conversation between two users
 * @param {string} user1Id - First user's employee ID
 * @param {string} user2Id - Second user's employee ID
 * @returns {Array} Array of messages in conversation
 */
const getConversation = (user1Id, user2Id) => {
    return messages.filter(message => 
        (message.senderId === user1Id && message.recipientId === user2Id) ||
        (message.senderId === user2Id && message.recipientId === user1Id)
    ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

/**
 * Get message statistics
 * @param {string} employeeId - Employee ID (optional, for user-specific stats)
 * @returns {Object} Message statistics
 */
const getMessageStats = (employeeId = null) => {
    let targetMessages = messages;

    if (employeeId) {
        targetMessages = findMessagesByUser(employeeId);
    }

    const stats = {
        total: targetMessages.length,
        sent: targetMessages.filter(msg => msg.senderId === employeeId).length,
        received: targetMessages.filter(msg => msg.recipientId === employeeId).length,
        unread: employeeId ? getUnreadCount(employeeId) : 0,
        byPriority: {
            urgent: 0,
            high: 0,
            normal: 0,
            low: 0
        },
        byCategory: {},
        byStatus: {
            sent: 0,
            delivered: 0,
            read: 0
        }
    };

    targetMessages.forEach(message => {
        // Priority statistics
        stats.byPriority[message.priority] = (stats.byPriority[message.priority] || 0) + 1;

        // Category statistics
        stats.byCategory[message.category] = (stats.byCategory[message.category] || 0) + 1;

        // Status statistics
        if (message.readAt) {
            stats.byStatus.read++;
        } else {
            stats.byStatus.sent++;
        }
    });

    return stats;
};

/**
 * Validate message data
 * @param {Object} messageData - Message data to validate
 * @returns {Object} Validation result
 */
const validateMessageData = (messageData) => {
    const errors = [];

    // Required fields
    const requiredFields = ['recipientId', 'content'];
    requiredFields.forEach(field => {
        if (!messageData[field]) {
            errors.push(`${field} is required`);
        }
    });

    // Content length
    if (messageData.content && messageData.content.length > 2000) {
        errors.push('Message content cannot exceed 2000 characters');
    }

    // Valid priorities
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (messageData.priority && !validPriorities.includes(messageData.priority)) {
        errors.push('Invalid priority specified');
    }

    // Valid categories
    const validCategories = ['general', 'flight-plan', 'weather', 'safety', 'operational', 'maintenance'];
    if (messageData.category && !validCategories.includes(messageData.category)) {
        errors.push('Invalid category specified');
    }

    // Flight number format
    if (messageData.flightNumber && !/^[A-Z]{2,3}\d{1,4}[A-Z]?$/.test(messageData.flightNumber)) {
        errors.push('Invalid flight number format');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Clean up old messages (older than specified days)
 * @param {number} daysToKeep - Number of days to keep messages
 * @returns {number} Number of messages cleaned up
 */
const cleanupOldMessages = (daysToKeep = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const initialCount = messages.length;
    messages = messages.filter(message => 
        new Date(message.createdAt) > cutoffDate
    );

    return initialCount - messages.length;
};

/**
 * Get messages requiring attention (urgent/high priority unread)
 * @param {string} employeeId - Employee ID
 * @returns {Array} Array of urgent/high priority unread messages
 */
const getMessagesRequiringAttention = (employeeId) => {
    return messages.filter(message => 
        message.recipientId === employeeId && 
        !message.readAt && 
        (message.priority === 'urgent' || message.priority === 'high')
    );
};

module.exports = {
    messages,
    addMessage,
    findMessageById,
    findMessagesByUser,
    findMessagesByFlight,
    updateMessage,
    deleteMessage,
    getAllMessages,
    searchMessages,
    getUnreadCount,
    getUnreadByPriority,
    markAsRead,
    markMultipleAsRead,
    getConversation,
    getMessageStats,
    validateMessageData,
    cleanupOldMessages,
    getMessagesRequiringAttention
};
