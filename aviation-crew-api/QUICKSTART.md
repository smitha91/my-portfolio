# Aviation Crew Communication API - Quick Start Guide

## Overview
A comprehensive Node.js/Express API for secure aviation crew communication with advanced security features including JWT authentication, role-based access control, message encryption, and document sharing.

## Features
- 🔐 **JWT Authentication** - Secure token-based authentication
- 👥 **Role-Based Access Control** - Different permissions for pilots, flight attendants, etc.
- 🔒 **Message Encryption** - End-to-end encrypted communications
- 📁 **Secure Document Sharing** - Encrypted file uploads with access controls
- 🛡️ **Advanced Security** - Rate limiting, input validation, CORS protection
- 📊 **Comprehensive Logging** - Request tracking and security monitoring

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=7d
API_PREFIX=/api
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=INFO
```

### 3. Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new crew member
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/password` - Change password

### Messages
- `POST /api/messages` - Send encrypted message
- `GET /api/messages` - Get user messages (inbox/outbox)
- `GET /api/messages/:id` - Get specific message
- `PUT /api/messages/:id/read` - Mark message as read
- `DELETE /api/messages/:id` - Delete message
- `GET /api/messages/flight/:flightNumber` - Get flight messages
- `GET /api/messages/unread/count` - Get unread message count

### Documents
- `POST /api/documents` - Upload secure document
- `GET /api/documents` - Get accessible documents
- `GET /api/documents/:id` - Get document details
- `GET /api/documents/:id/download` - Download document file
- `PUT /api/documents/:id` - Update document metadata
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/flight/:flightNumber` - Get flight documents

### Crew Management
- `GET /api/crew` - Get crew members list
- `GET /api/crew/search` - Search crew members
- `GET /api/crew/:employeeId` - Get crew member details
- `GET /api/crew/role/:role` - Get crew by role
- `GET /api/crew/department/:department` - Get crew by department
- `GET /api/crew/meta/stats` - Get crew statistics

## Testing the API

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Register a New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "AB12345",
    "password": "SecurePass123!",
    "name": "Test Pilot",
    "role": "pilot",
    "department": "flight-operations",
    "clearanceLevel": 5,
    "airline": "Test Airlines"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "AA12345",
    "password": "password123"
  }'
```

### 4. Send a Message (requires JWT token)
```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "recipientId": "AA12346",
    "content": "Flight update: Weather conditions improving",
    "priority": "high",
    "flightNumber": "AA1234"
  }'
```

## Demo Users
The API comes with pre-seeded demo users (password: `password123`):

- **AA12345** - Captain Sarah Johnson (Pilot, Clearance 5)
- **AA12346** - First Officer Mike Chen (Co-Pilot, Clearance 4)
- **AA12347** - Flight Attendant Lisa Martinez (Flight Attendant, Clearance 2)
- **AA12348** - Gate Agent Robert Davis (Gate Agent, Clearance 2)
- **AA12349** - Dispatcher Jennifer Wilson (Dispatcher, Clearance 4)

## User Roles & Permissions

### Clearance Levels
- **Level 1**: Basic access (weather reports, general communications)
- **Level 2**: Standard crew access (crew manifests, operational docs)
- **Level 3**: Supervisory access (maintenance logs, crew management)
- **Level 4**: Management access (flight plans, administrative functions)
- **Level 5**: Full access (all documents, user management)

### Role Capabilities
- **Pilots**: Full flight operations access, crew coordination
- **Flight Attendants**: Cabin operations, safety communications
- **Gate Agents**: Passenger services, boarding coordination
- **Dispatchers**: Flight planning, route management
- **Ground Crew**: Ground operations, equipment coordination

## Security Features

### JWT Authentication
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Secure token verification and refresh

### Message Encryption
- AES-256-GCM encryption for sensitive messages
- Unique encryption keys per message
- Optional encryption based on content sensitivity

### Rate Limiting
- 100 requests per 15 minutes per IP (general)
- 5 authentication attempts per 15 minutes
- 10 messages per minute
- 20 file uploads per hour

### Input Validation
- Comprehensive data validation
- SQL injection protection
- XSS prevention
- File type validation for uploads

## Development

### Project Structure
```
aviation-crew-api/
├── middleware/          # Authentication, validation, security
├── routes/             # API endpoint handlers
├── utils/              # Utilities (JWT, encryption, logging)
├── data/               # Mock database (in-memory)
├── logs/               # Application logs
├── server.js           # Main application file
└── package.json        # Dependencies and scripts
```

### Adding New Features
1. Create route handlers in `routes/`
2. Add middleware for validation/security
3. Update data models in `data/`
4. Add utility functions in `utils/`
5. Test endpoints thoroughly

## Deployment

### Environment Variables
Ensure all required environment variables are set:
- `JWT_SECRET` - Strong secret for JWT signing
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `NODE_ENV=production` - For production optimizations

### Security Considerations
- Use HTTPS in production
- Set strong JWT secrets
- Configure proper CORS origins
- Enable request logging
- Set up proper rate limiting
- Regular security audits

## Troubleshooting

### Common Issues
1. **Port already in use**: Change PORT in `.env`
2. **JWT errors**: Check JWT_SECRET configuration
3. **File upload issues**: Verify multer configuration
4. **Rate limiting**: Check rate limit settings

### Logs
Check application logs in the `logs/` directory for detailed error information.

## Support
For technical support or questions about the Aviation Crew API, please check the documentation or create an issue in the project repository.
