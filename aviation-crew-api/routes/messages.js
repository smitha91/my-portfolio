/**
 * Messages Routes
 * 
 * Handles secure messaging between aviation crew members
 * Provides encrypted messaging with priority levels and flight context
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const { 
    messages, 
    addMessage, 
    findMessageById, 
    findMessagesByUser, 
    findMessagesByFlight,
    updateMessage,
    deleteMessage 
} = require('../data/messages');
const { findUserByEmployeeId } = require('../data/users');
const { authenticateToken, requireRole, requireClearance } = require('../middleware/auth');
const { messageRateLimit } = require('../middleware/security');
const { 
    validateMessage, 
    validateEmployeeId, 
    validatePagination 
} = require('../middleware/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { encryptMessage, decryptMessage } = require('../utils/encryption');

/**
 * POST /messages
 * Send a new message
 */
router.post('/',
    authenticateToken,
    messageRateLimit,
    validateMessage,
    asyncHandler(async (req, res) => {
        const {
            recipientId,
            content,
            priority = 'normal',
            isEncrypted = true,
            flightNumber = null,
            category = 'general'
        } = req.body;

        // Verify recipient exists
        const recipient = findUserByEmployeeId(recipientId);
        if (!recipient) {
            throw new AppError('Recipient not found', 404, 'RECIPIENT_NOT_FOUND');
        }

        if (!recipient.isActive) {
            throw new AppError('Recipient account is inactive', 400, 'RECIPIENT_INACTIVE');
        }

        // Encrypt message content if requested
        let messageContent = content;
        let encryptionKey = null;

        if (isEncrypted) {
            const encrypted = encryptMessage(content);
            messageContent = encrypted.encryptedContent;
            encryptionKey = encrypted.key;
        }

        // Create new message
        const newMessage = {
            id: uuidv4(),
            senderId: req.user.employeeId,
            senderName: req.user.name,
            senderRole: req.user.role,
            recipientId,
            recipientName: recipient.name,
            recipientRole: recipient.role,
            content: messageContent,
            originalContent: content, // Store original for demo purposes
            isEncrypted,
            encryptionKey,
            priority,
            category,
            flightNumber,
            status: 'sent',
            readAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Add message to data store
        addMessage(newMessage);

        logger.info(`Message sent from ${req.user.employeeId} to ${recipientId}`, {
            messageId: newMessage.id,
            priority,
            isEncrypted,
            flightNumber
        });

        // Return message data (excluding encryption key)
        const { encryptionKey: _, originalContent: __, ...messageResponse } = newMessage;

        res.status(201).json({
            status: 'success',
            message: 'Message sent successfully',
            data: {
                message: messageResponse
            }
        });
    })
);

/**
 * GET /messages
 * Get messages for current user (inbox/outbox)
 */
router.get('/',
    authenticateToken,
    validatePagination,
    asyncHandler(async (req, res) => {
        const {
            type = 'all', // 'sent', 'received', 'all'
            priority,
            flightNumber,
            category,
            page = 1,
            limit = 20,
            unreadOnly = false
        } = req.query;

        let userMessages = [];
        const employeeId = req.user.employeeId;

        // Filter messages based on type
        switch (type) {
            case 'sent':
                userMessages = messages.filter(msg => msg.senderId === employeeId);
                break;
            case 'received':
                userMessages = messages.filter(msg => msg.recipientId === employeeId);
                break;
            default:
                userMessages = messages.filter(msg => 
                    msg.senderId === employeeId || msg.recipientId === employeeId
                );
        }

        // Apply additional filters
        if (priority) {
            userMessages = userMessages.filter(msg => msg.priority === priority);
        }

        if (flightNumber) {
            userMessages = userMessages.filter(msg => msg.flightNumber === flightNumber);
        }

        if (category) {
            userMessages = userMessages.filter(msg => msg.category === category);
        }

        if (unreadOnly === 'true') {
            userMessages = userMessages.filter(msg => 
                msg.recipientId === employeeId && !msg.readAt
            );
        }

        // Sort by creation date (newest first)
        userMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Implement pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedMessages = userMessages.slice(startIndex, endIndex);

        // Decrypt messages for the current user
        const processedMessages = paginatedMessages.map(msg => {
            const processedMsg = { ...msg };
            
            // Remove encryption key and original content from response
            delete processedMsg.encryptionKey;
            delete processedMsg.originalContent;

            // Decrypt content if user is the recipient and message is encrypted
            if (msg.recipientId === employeeId && msg.isEncrypted && msg.encryptionKey) {
                try {
                    processedMsg.content = decryptMessage(msg.content, msg.encryptionKey);
                } catch (error) {
                    logger.error('Failed to decrypt message:', error);
                    processedMsg.content = '[Encrypted message - decryption failed]';
                }
            }

            return processedMsg;
        });

        const totalMessages = userMessages.length;
        const totalPages = Math.ceil(totalMessages / limit);

        res.json({
            status: 'success',
            data: {
                messages: processedMessages,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalMessages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                filters: {
                    type,
                    priority,
                    flightNumber,
                    category,
                    unreadOnly
                }
            }
        });
    })
);

/**
 * GET /messages/:id
 * Get a specific message by ID
 */
router.get('/:id',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const message = findMessageById(id);

        if (!message) {
            throw new AppError('Message not found', 404, 'MESSAGE_NOT_FOUND');
        }

        // Check if user has access to this message
        const employeeId = req.user.employeeId;
        if (message.senderId !== employeeId && message.recipientId !== employeeId) {
            throw new AppError('Access denied', 403, 'MESSAGE_ACCESS_DENIED');
        }

        // Mark as read if user is the recipient
        if (message.recipientId === employeeId && !message.readAt) {
            message.readAt = new Date().toISOString();
            message.updatedAt = new Date().toISOString();
            updateMessage(message);
        }

        // Prepare response
        const responseMessage = { ...message };
        delete responseMessage.encryptionKey;
        delete responseMessage.originalContent;

        // Decrypt content if user is the recipient and message is encrypted
        if (message.recipientId === employeeId && message.isEncrypted && message.encryptionKey) {
            try {
                responseMessage.content = decryptMessage(message.content, message.encryptionKey);
            } catch (error) {
                logger.error('Failed to decrypt message:', error);
                responseMessage.content = '[Encrypted message - decryption failed]';
            }
        }

        res.json({
            status: 'success',
            data: {
                message: responseMessage
            }
        });
    })
);

/**
 * PUT /messages/:id/read
 * Mark a message as read
 */
router.put('/:id/read',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const message = findMessageById(id);

        if (!message) {
            throw new AppError('Message not found', 404, 'MESSAGE_NOT_FOUND');
        }

        // Only recipient can mark message as read
        if (message.recipientId !== req.user.employeeId) {
            throw new AppError('Access denied', 403, 'MESSAGE_ACCESS_DENIED');
        }

        if (message.readAt) {
            throw new AppError('Message already marked as read', 400, 'MESSAGE_ALREADY_READ');
        }

        // Mark as read
        message.readAt = new Date().toISOString();
        message.updatedAt = new Date().toISOString();
        updateMessage(message);

        res.json({
            status: 'success',
            message: 'Message marked as read'
        });
    })
);

/**
 * DELETE /messages/:id
 * Delete a message
 */
router.delete('/:id',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const message = findMessageById(id);

        if (!message) {
            throw new AppError('Message not found', 404, 'MESSAGE_NOT_FOUND');
        }

        // Only sender can delete their message
        if (message.senderId !== req.user.employeeId) {
            throw new AppError('Access denied. Only message sender can delete.', 403, 'DELETE_ACCESS_DENIED');
        }

        // Check if message can be deleted (e.g., not read yet or within time limit)
        const messageAge = Date.now() - new Date(message.createdAt).getTime();
        const maxDeleteTime = 5 * 60 * 1000; // 5 minutes

        if (message.readAt && messageAge > maxDeleteTime) {
            throw new AppError('Cannot delete read message after 5 minutes', 400, 'DELETE_TIME_EXPIRED');
        }

        // Delete message
        const deleted = deleteMessage(id);
        if (!deleted) {
            throw new AppError('Failed to delete message', 500, 'DELETE_FAILED');
        }

        logger.info(`Message deleted: ${id} by ${req.user.employeeId}`);

        res.json({
            status: 'success',
            message: 'Message deleted successfully'
        });
    })
);

/**
 * GET /messages/flight/:flightNumber
 * Get all messages for a specific flight
 */
router.get('/flight/:flightNumber',
    authenticateToken,
    requireRole(['pilot', 'co-pilot', 'dispatcher']),
    validatePagination,
    asyncHandler(async (req, res) => {
        const { flightNumber } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const flightMessages = findMessagesByFlight(flightNumber);

        // Sort by creation date (newest first)
        flightMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Implement pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedMessages = flightMessages.slice(startIndex, endIndex);

        // Process messages (remove sensitive data)
        const processedMessages = paginatedMessages.map(msg => {
            const processedMsg = { ...msg };
            delete processedMsg.encryptionKey;
            delete processedMsg.originalContent;
            
            // Don't decrypt - show that messages are encrypted
            if (msg.isEncrypted) {
                processedMsg.content = '[Encrypted Message]';
            }
            
            return processedMsg;
        });

        const totalMessages = flightMessages.length;
        const totalPages = Math.ceil(totalMessages / limit);

        res.json({
            status: 'success',
            data: {
                flightNumber,
                messages: processedMessages,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalMessages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });
    })
);

/**
 * GET /messages/unread/count
 * Get count of unread messages for current user
 */
router.get('/unread/count',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const unreadMessages = messages.filter(msg => 
            msg.recipientId === req.user.employeeId && !msg.readAt
        );

        // Count by priority
        const priorityCounts = {
            urgent: 0,
            high: 0,
            normal: 0,
            low: 0
        };

        unreadMessages.forEach(msg => {
            priorityCounts[msg.priority] = (priorityCounts[msg.priority] || 0) + 1;
        });

        res.json({
            status: 'success',
            data: {
                totalUnread: unreadMessages.length,
                byPriority: priorityCounts
            }
        });
    })
);

module.exports = router;
