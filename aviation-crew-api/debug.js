// Debug script to test imports
try {
    console.log('Testing imports...');
    
    console.log('1. Testing express...');
    const express = require('express');
    console.log('✓ Express loaded');
    
    console.log('2. Testing errorHandler...');
    const { globalErrorHandler } = require('./middleware/errorHandler');
    console.log('✓ ErrorHandler loaded');
    
    console.log('3. Testing auth routes...');
    const authRoutes = require('./routes/auth');
    console.log('✓ Auth routes loaded');
    
    console.log('4. Testing message routes...');
    const messageRoutes = require('./routes/messages');
    console.log('✓ Message routes loaded');
    
    console.log('5. Testing document routes...');
    const documentRoutes = require('./routes/documents');
    console.log('✓ Document routes loaded');
    
    console.log('6. Testing crew routes...');
    const crewRoutes = require('./routes/crew');
    console.log('✓ Crew routes loaded');
    
    console.log('7. Testing logger...');
    const { logger } = require('./utils/logger');
    console.log('✓ Logger loaded');
    
    console.log('All imports successful!');
    
} catch (error) {
    console.error('Error found:', error.message);
    console.error('Stack:', error.stack);
}
