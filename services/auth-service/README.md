# MedhaOS Authentication & Authorization Service

This service provides OAuth 2.0 authentication, role-based access control (RBAC), and comprehensive audit logging for the MedhaOS Healthcare Intelligence Ecosystem.

## Features

### Authentication (OAuth 2.0)
- User registration and login
- JWT-based access and refresh tokens
- Token rotation for enhanced security
- Multi-factor authentication (MFA) with TOTP
- Password strength validation
- Secure password hashing with bcrypt

### Authorization (RBAC)
- Role-based access control with 5 default roles:
  - `patient`: Access to personal health records
  - `doctor`: Full clinical access
  - `nurse`: Care delivery access
  - `admin`: Full system access
  - `public_health`: Surveillance and analytics access
- Fine-grained permission system (resource:action)
- Direct user permissions for special cases
- Permission inheritance from roles

### Audit Logging
- Comprehensive audit trail for all data access
- Structured logging with user context
- Query API for compliance reporting
- Audit statistics and analytics
- Export functionality for compliance
- Automatic retention policy management

## API Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "patient",
  "phone": "+919876543210"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "mfaToken": "123456"
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Logout
```http
POST /auth/logout
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Setup MFA
```http
POST /auth/mfa/setup
Authorization: Bearer <access-token>
```

#### Enable MFA
```http
POST /auth/mfa/enable
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "token": "123456"
}
```

#### Verify Token
```http
GET /auth/verify
Authorization: Bearer <access-token>
```

### RBAC

#### Get All Roles
```http
GET /rbac/roles
Authorization: Bearer <admin-token>
```

#### Create Permission
```http
POST /rbac/permissions
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "resource": "patients",
  "action": "read",
  "description": "View patient records"
}
```

#### Assign Permission to Role
```http
POST /rbac/roles/doctor/permissions
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "permissionId": "uuid"
}
```

#### Get User Permissions
```http
GET /rbac/users/:userId/permissions
Authorization: Bearer <admin-token>
```

#### Initialize Default Roles
```http
POST /rbac/initialize
Authorization: Bearer <admin-token>
```

### Audit Logging

#### Query Audit Logs
```http
GET /audit/logs?tableName=patients&operation=SELECT&startDate=2024-01-01
Authorization: Bearer <admin-token>
```

#### Get Record Audit Trail
```http
GET /audit/records/patients/:recordId
Authorization: Bearer <token>
```

#### Get User Activity
```http
GET /audit/users/:userId/activity
Authorization: Bearer <admin-token>
```

#### Get My Activity
```http
GET /audit/me/activity
Authorization: Bearer <token>
```

#### Get Audit Statistics
```http
GET /audit/statistics?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <admin-token>
```

#### Export Audit Logs
```http
POST /audit/export?startDate=2024-01-01
Authorization: Bearer <admin-token>
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=3010
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/medhaos_db"
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000,http://localhost:3002
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Installation

```bash
# Install dependencies
npm install

# Run database migrations
cd ../../packages/database
npx prisma migrate dev

# Initialize default roles and permissions
# (Run this after starting the service)
curl -X POST http://localhost:3010/rbac/initialize \
  -H "Authorization: Bearer <admin-token>"
```

## Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

## Security Features

1. **Password Security**
   - Minimum 8 characters
   - Must contain uppercase, lowercase, number, and special character
   - Bcrypt hashing with configurable rounds

2. **Token Security**
   - Short-lived access tokens (15 minutes)
   - Long-lived refresh tokens (7 days)
   - Automatic token rotation
   - Token revocation on logout

3. **MFA Support**
   - TOTP-based (compatible with Google Authenticator, Authy)
   - QR code generation for easy setup
   - Backup codes support

4. **Rate Limiting**
   - 100 requests per 15 minutes per IP
   - Configurable limits

5. **Security Headers**
   - Helmet.js for secure HTTP headers
   - CORS configuration
   - XSS protection

6. **Audit Trail**
   - All data access logged
   - User context captured
   - IP address and user agent tracking
   - Compliance-ready reporting

## Default Permissions

### Patient Role
- `patients:read`, `patients:update`
- `appointments:create`, `appointments:read`, `appointments:update`, `appointments:delete`
- `medications:read`
- `reports:read`

### Doctor Role
- `patients:read`
- `encounters:create`, `encounters:read`, `encounters:update`
- `prescriptions:create`, `prescriptions:read`, `prescriptions:update`
- `diagnostics:create`, `diagnostics:read`
- `reports:read`, `vitals:read`

### Nurse Role
- `patients:read`, `encounters:read`
- `vitals:create`, `vitals:read`
- `medications:read`, `medications:administer`
- `tasks:read`, `tasks:update`
- `prescriptions:read`

### Admin Role
- `users:*`, `facilities:*`
- `reports:create`, `reports:read`
- `audit:read`
- `patients:read`, `encounters:read`

### Public Health Role
- `surveillance:read`, `surveillance:create`
- `outbreaks:read`, `outbreaks:update`
- `analytics:read`, `reports:read`

## Middleware Usage

### Authentication Middleware
```typescript
import { authenticate } from './middleware/auth.middleware';

router.get('/protected', authenticate, (req, res) => {
  // req.user contains { userId, email, role }
});
```

### Authorization Middleware
```typescript
import { authorize } from './middleware/auth.middleware';

router.post('/admin-only', authenticate, authorize('admin'), (req, res) => {
  // Only admins can access
});
```

### Permission Middleware
```typescript
import { requirePermission } from './middleware/permission.middleware';

router.get('/patients', 
  authenticate, 
  requirePermission('patients', 'read'),
  (req, res) => {
    // User must have patients:read permission
  }
);
```

### Audit Middleware
```typescript
import { auditRequest } from './middleware/audit.middleware';

router.post('/patients',
  authenticate,
  auditRequest('patients', 'INSERT'),
  (req, res) => {
    // Request will be automatically audited
  }
);
```

## Compliance

This service is designed to meet:
- ABDM (Ayushman Bharat Digital Mission) requirements
- DISHA Act compliance
- ISO 27001 security standards
- HIPAA-equivalent data protection

## License

MIT
