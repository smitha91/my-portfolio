# Aviation Crew Communication API

A secure, role-based communication API designed for aviation flight crew members including pilots, flight attendants, and gate agents. Features encrypted messaging, secure document sharing, and comprehensive authentication.

## 🚀 Features

### 🔐 Security & Authentication
- **JWT-based authentication** with role-based access control
- **Password encryption** using bcrypt
- **Message encryption** for sensitive communications
- **Rate limiting** to prevent abuse
- **Input validation** and sanitization

### 👥 Role-Based Access Control
- **Pilots**: Full access to flight documents, crew communications
- **Flight Attendants**: Access to safety docs, passenger manifests, crew chat
- **Gate Agents**: Access to boarding info, delay notifications, ground crew chat

### 💬 Communication Features
- **Encrypted messaging** between crew members
- **Role-specific channels** (cockpit, cabin, ground)
- **Secure document sharing** for flight plans, safety briefings
- **Real-time notifications** for critical updates

### 📊 Additional Features
- **Flight manifest management**
- **Security incident reporting**
- **Crew scheduling integration**
- **Audit logging** for compliance

## 🛠️ Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Crypto** - Message encryption
- **Helmet** - Security headers
- **Rate Limiting** - API protection

## 📋 API Endpoints

### Authentication
```
POST /api/auth/login          # User login
POST /api/auth/register       # User registration (admin only)
POST /api/auth/refresh        # Refresh JWT token
POST /api/auth/logout         # User logout
```

### Messages
```
GET  /api/messages            # Get messages (role-filtered)
POST /api/messages            # Send encrypted message
PUT  /api/messages/:id        # Update message status
DELETE /api/messages/:id      # Delete message (sender only)
```

### Documents
```
GET  /api/documents           # Get documents (role-based)
POST /api/documents           # Upload secure document
GET  /api/documents/:id       # Download specific document
DELETE /api/documents/:id     # Delete document (authorized only)
```

### Users & Crew
```
GET  /api/crew                # Get crew roster (role-filtered)
GET  /api/crew/profile        # Get current user profile
PUT  /api/crew/profile        # Update user profile
GET  /api/crew/schedule       # Get crew schedule
```

## 🔑 User Roles & Permissions

### Pilot
- Access all flight documents
- Send/receive all crew communications
- Manage flight plans and weather reports
- Access emergency procedures

### Flight Attendant
- Access safety and passenger documents
- Communicate with pilots and other cabin crew
- View passenger manifests
- Report safety incidents

### Gate Agent
- Access boarding and gate information
- Communicate with ground crew
- Manage passenger boarding status
- Send delay/gate change notifications

## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone [repository-url]
cd aviation-crew-api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Seed the database with sample data
npm run seed

# Start development server
npm run dev
```

### Environment Variables
```
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=24h
ENCRYPTION_KEY=your-32-character-encryption-key
NODE_ENV=development
```

## 📱 Usage Examples

### Login
```javascript
POST /api/auth/login
{
  "employeeId": "PIL001",
  "password": "securePassword123"
}
```

### Send Encrypted Message
```javascript
POST /api/messages
Headers: Authorization: Bearer <jwt-token>
{
  "recipients": ["FA002", "GA001"],
  "subject": "Weather Update",
  "content": "Turbulence expected at FL350",
  "priority": "high",
  "channel": "crew"
}
```

### Access Flight Documents
```javascript
GET /api/documents?type=flight_plan&flight=UA1234
Headers: Authorization: Bearer <jwt-token>
```

## 🔒 Security Features

- **Encrypted storage** of sensitive messages
- **Role-based document access** 
- **Audit trails** for compliance
- **Rate limiting** on all endpoints
- **Input validation** and sanitization
- **Secure headers** via Helmet
- **CORS protection**

## 🧪 Testing

```bash
# Run all tests
npm test

# Test specific endpoint
npm test -- --grep "authentication"
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Ashley Smith** - Full Stack Developer

Demonstrating secure API development, encryption, authentication, and role-based access control in a real-world aviation context.
