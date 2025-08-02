/**
 * Logger Utility
 * 
 * Centralized logging functionality for the aviation crew API
 * Provides structured logging with different levels and formats
 */

const fs = require('fs');
const path = require('path');

// Log levels
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

// Log level names
const LEVEL_NAMES = {
    0: 'ERROR',
    1: 'WARN',
    2: 'INFO',
    3: 'DEBUG'
};

// ANSI color codes for console output
const COLORS = {
    ERROR: '\x1b[31m', // Red
    WARN: '\x1b[33m',  // Yellow
    INFO: '\x1b[36m',  // Cyan
    DEBUG: '\x1b[35m', // Magenta
    RESET: '\x1b[0m'   // Reset
};

class Logger {
    constructor(options = {}) {
        this.level = LOG_LEVELS[options.level] || LOG_LEVELS.INFO;
        this.enableConsole = options.enableConsole !== false;
        this.enableFile = options.enableFile !== false;
        this.logDirectory = options.logDirectory || './logs';
        this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
        this.maxFiles = options.maxFiles || 5;
        this.enableColors = options.enableColors !== false;
        
        // Create logs directory if it doesn't exist
        if (this.enableFile) {
            this.ensureLogDirectory();
        }
    }

    /**
     * Ensure log directory exists
     */
    ensureLogDirectory() {
        try {
            if (!fs.existsSync(this.logDirectory)) {
                fs.mkdirSync(this.logDirectory, { recursive: true });
            }
        } catch (error) {
            console.error('Failed to create log directory:', error);
            this.enableFile = false;
        }
    }

    /**
     * Format log message
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {Object} metadata - Additional metadata
     * @returns {Object} Formatted log entry
     */
    formatMessage(level, message, metadata = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            ...metadata
        };

        // Add process information in development
        if (process.env.NODE_ENV === 'development') {
            logEntry.pid = process.pid;
            logEntry.memory = process.memoryUsage();
        }

        return logEntry;
    }

    /**
     * Format message for console output
     * @param {Object} logEntry - Log entry object
     * @returns {string} Formatted console message
     */
    formatConsoleMessage(logEntry) {
        const { timestamp, level, message, ...metadata } = logEntry;
        const color = this.enableColors ? COLORS[level] : '';
        const reset = this.enableColors ? COLORS.RESET : '';
        
        let output = `${color}[${timestamp}] ${level}: ${message}${reset}`;
        
        // Add metadata if present
        if (Object.keys(metadata).length > 0) {
            output += `\n${JSON.stringify(metadata, null, 2)}`;
        }
        
        return output;
    }

    /**
     * Write log to file
     * @param {Object} logEntry - Log entry object
     */
    writeToFile(logEntry) {
        if (!this.enableFile) return;

        try {
            const logLine = JSON.stringify(logEntry) + '\n';
            const logFile = path.join(this.logDirectory, `app-${this.getDateString()}.log`);
            
            // Check file size and rotate if necessary
            this.rotateLogFile(logFile);
            
            fs.appendFileSync(logFile, logLine);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    /**
     * Get current date string for log file naming
     * @returns {string} Date string (YYYY-MM-DD)
     */
    getDateString() {
        const now = new Date();
        return now.toISOString().split('T')[0];
    }

    /**
     * Rotate log file if it exceeds max size
     * @param {string} logFile - Path to log file
     */
    rotateLogFile(logFile) {
        try {
            if (!fs.existsSync(logFile)) return;
            
            const stats = fs.statSync(logFile);
            if (stats.size < this.maxFileSize) return;
            
            // Find next available backup number
            let backupNumber = 1;
            let backupFile;
            
            do {
                backupFile = `${logFile}.${backupNumber}`;
                backupNumber++;
            } while (fs.existsSync(backupFile) && backupNumber <= this.maxFiles);
            
            // Remove oldest backup if we've reached max files
            if (backupNumber > this.maxFiles) {
                const oldestBackup = `${logFile}.${this.maxFiles}`;
                if (fs.existsSync(oldestBackup)) {
                    fs.unlinkSync(oldestBackup);
                }
                
                // Shift all backup files
                for (let i = this.maxFiles - 1; i >= 1; i--) {
                    const currentBackup = `${logFile}.${i}`;
                    const nextBackup = `${logFile}.${i + 1}`;
                    
                    if (fs.existsSync(currentBackup)) {
                        fs.renameSync(currentBackup, nextBackup);
                    }
                }
                
                backupFile = `${logFile}.1`;
            }
            
            // Move current log file to backup
            fs.renameSync(logFile, backupFile);
        } catch (error) {
            console.error('Failed to rotate log file:', error);
        }
    }

    /**
     * Log a message at the specified level
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {Object} metadata - Additional metadata
     */
    log(level, message, metadata = {}) {
        const levelValue = LOG_LEVELS[level];
        
        if (levelValue > this.level) return;
        
        const logEntry = this.formatMessage(level, message, metadata);
        
        // Output to console
        if (this.enableConsole) {
            const consoleMessage = this.formatConsoleMessage(logEntry);
            
            switch (level) {
                case 'ERROR':
                    console.error(consoleMessage);
                    break;
                case 'WARN':
                    console.warn(consoleMessage);
                    break;
                default:
                    console.log(consoleMessage);
            }
        }
        
        // Write to file
        this.writeToFile(logEntry);
    }

    /**
     * Log error message
     * @param {string} message - Error message
     * @param {Object} metadata - Additional metadata
     */
    error(message, metadata = {}) {
        this.log('ERROR', message, metadata);
    }

    /**
     * Log warning message
     * @param {string} message - Warning message
     * @param {Object} metadata - Additional metadata
     */
    warn(message, metadata = {}) {
        this.log('WARN', message, metadata);
    }

    /**
     * Log info message
     * @param {string} message - Info message
     * @param {Object} metadata - Additional metadata
     */
    info(message, metadata = {}) {
        this.log('INFO', message, metadata);
    }

    /**
     * Log debug message
     * @param {string} message - Debug message
     * @param {Object} metadata - Additional metadata
     */
    debug(message, metadata = {}) {
        this.log('DEBUG', message, metadata);
    }

    /**
     * Create a child logger with additional context
     * @param {Object} context - Additional context for all log messages
     * @returns {Object} Child logger
     */
    child(context = {}) {
        const parentLogger = this;
        
        return {
            error: (message, metadata = {}) => {
                parentLogger.error(message, { ...context, ...metadata });
            },
            warn: (message, metadata = {}) => {
                parentLogger.warn(message, { ...context, ...metadata });
            },
            info: (message, metadata = {}) => {
                parentLogger.info(message, { ...context, ...metadata });
            },
            debug: (message, metadata = {}) => {
                parentLogger.debug(message, { ...context, ...metadata });
            }
        };
    }

    /**
     * Log HTTP request
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {number} duration - Request duration in ms
     */
    logRequest(req, res, duration) {
        const metadata = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            user: req.user ? req.user.employeeId : 'anonymous'
        };

        const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
        
        if (res.statusCode >= 400) {
            this.warn(message, metadata);
        } else {
            this.info(message, metadata);
        }
    }

    /**
     * Log security event
     * @param {string} event - Security event type
     * @param {Object} details - Event details
     */
    logSecurity(event, details = {}) {
        this.warn(`Security Event: ${event}`, {
            securityEvent: true,
            event,
            ...details,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get current log level
     * @returns {string} Current log level name
     */
    getLevel() {
        return LEVEL_NAMES[this.level];
    }

    /**
     * Set log level
     * @param {string} level - New log level
     */
    setLevel(level) {
        if (LOG_LEVELS.hasOwnProperty(level)) {
            this.level = LOG_LEVELS[level];
        } else {
            throw new Error(`Invalid log level: ${level}`);
        }
    }

    /**
     * Clean up old log files
     * @param {number} daysToKeep - Number of days to keep logs
     */
    cleanupOldLogs(daysToKeep = 30) {
        if (!this.enableFile) return;

        try {
            const files = fs.readdirSync(this.logDirectory);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            files.forEach(file => {
                const filePath = path.join(this.logDirectory, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime < cutoffDate) {
                    fs.unlinkSync(filePath);
                    this.info(`Cleaned up old log file: ${file}`);
                }
            });
        } catch (error) {
            this.error('Failed to cleanup old logs:', error);
        }
    }
}

// Create default logger instance
const logger = new Logger({
    level: process.env.LOG_LEVEL || 'INFO',
    enableConsole: true,
    enableFile: process.env.NODE_ENV === 'production',
    logDirectory: process.env.LOG_DIRECTORY || './logs',
    enableColors: process.env.NODE_ENV !== 'production'
});

// Express middleware for request logging
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.logRequest(req, res, duration);
    });
    
    next();
};

module.exports = {
    Logger,
    logger,
    requestLogger,
    LOG_LEVELS
};
