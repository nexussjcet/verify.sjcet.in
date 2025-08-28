# Certificate Tools

A simple and secure API for generating QR codes from signed JWTs and verifying JWTs extracted from QR codes. Perfect for digital certificates, tickets, and secure data verification.

## Features

- 🔐 **JWT Signing**: Sign JSON data with HMAC-SHA256
- 📱 **QR Code Scripts**: Local scripts for QR code generation and verification
- ✅ **JWT Verification**: Verify and decode JWTs from QR codes
- 🛡️ **Security**: Built-in expiration, issuer validation, and unique identifiers
- ⚡ **Fast**: Built with Bun and Hono for optimal performance

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) installed on your system

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd cert-tools

# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env and set your JWT_SECRET
```

### Environment Variables

Create a `.env` file with:

```env
JWT_SECRET=your-secure-secret-key-here
```

### Running the Server

```bash
# Development mode (with hot reload)
bun run dev

# The server will start on http://localhost:3000
```

## API Endpoints

### 1. Generate JWT

**POST** `/generate-jwt`

Accepts JSON data, signs it as a JWT, and returns the signed token.

#### Request

```bash
curl -X POST http://localhost:3000/generate-jwt \
  -H "Content-Type: application/json" \
  -d '{
    "certificateId": "CERT-12345",
    "recipientName": "John Doe",
    "courseName": "Web Development Certification",
    "issuerName": "Tech Academy",
    "completionDate": "2024-01-15"
  }'
```

#### Response

```json
{
  "success": true,
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "payload": {
    "certificateId": "CERT-12345",
    "recipientName": "John Doe",
    "courseName": "Web Development Certification",
    "issuerName": "Tech Academy",
    "completionDate": "2024-01-15",
    "iat": 1705401600,
    "exp": 1705488000,
    "iss": "cert-tools",
    "jti": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### 2. Verify JWT

**POST** `/verify-jwt`

Verifies a JWT extracted from a QR code and returns the decoded data.

#### Request

```bash
curl -X POST http://localhost:3000/verify-jwt \
  -H "Content-Type: application/json" \
  -d '{
    "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

#### Response

```json
{
  "success": true,
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "payload": {
    "certificateId": "CERT-12345",
    "recipientName": "John Doe",
    "courseName": "Web Development Certification",
    "iat": 1705401600,
    "exp": 1705488000,
    "iss": "cert-tools"
  },
  "verified": true
}
```

### 3. Health Check

**GET** `/health`

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 4. JWT Information

**GET** `/jwt-info`

```json
{
  "algorithm": "HS256",
  "issuer": "cert-tools",
  "note": "JWTs are signed with HMAC-SHA256 using a secret key"
}
```

## Local Scripts

This project includes local scripts for QR code operations that work with the API.

### Generate QR Code Script

```bash
# Generate QR code with sample data
bun run generate-qr

# Generate QR code with custom data
bun run generate-qr '{"certificateId":"CERT-123","recipientName":"John Doe"}'

# Save QR code to file
bun run generate-qr '{"certificateId":"CERT-123"}' qrcode.png
```

### Verify QR Code Script

```bash
# Verify JWT from command line
bun run verify-qr "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Verify JWT from file
bun run verify-qr --file jwt.txt
```

## API Usage Examples

### JavaScript/TypeScript

```typescript
// Generate JWT
async function generateJWT(certificateData: any) {
  const response = await fetch('/generate-jwt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(certificateData)
  });

  const result = await response.json();
  return result.jwt;
}

// Verify JWT
async function verifyCertificate(jwt: string) {
  const response = await fetch('/verify-jwt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jwt })
  });

  const result = await response.json();

  if (result.verified) {
    console.log('Certificate is valid:', result.payload);
  } else {
    console.log('Certificate verification failed');
  }

  return result;
}
```

### Python

```python
import requests
import json

# Generate JWT
def generate_jwt(data):
    response = requests.post(
        'http://localhost:3000/generate-jwt',
        headers={'Content-Type': 'application/json'},
        json=data
    )
    return response.json()

# Verify JWT
def verify_jwt(jwt_token):
    response = requests.post(
        'http://localhost:3000/verify-jwt',
        headers={'Content-Type': 'application/json'},
        json={'jwt': jwt_token}
    )
    return response.json()

# Example usage
certificate_data = {
    'certificateId': 'CERT-12345',
    'recipientName': 'John Doe',
    'courseName': 'Python Programming'
}

result = generate_jwt(certificate_data)
print(f"JWT generated: {result['success']}")
```

## Workflow

### Option 1: Using Local Scripts (Recommended)
1. **Create Certificate Data**: Prepare your certificate/ticket data as JSON
2. **Generate QR Code**: Use `bun run generate-qr` with your data
3. **Display/Save QR Code**: The script will generate and save the QR code
4. **Scan QR Code**: Use any QR scanner to extract the JWT
5. **Verify JWT**: Use `bun run verify-qr` with the extracted JWT

### Option 2: Using API Directly
1. **Create Certificate Data**: Prepare your certificate/ticket data as JSON
2. **Generate JWT**: Send data to `/generate-jwt` endpoint
3. **Create QR Code**: Use any QR code library to encode the JWT
4. **Scan QR Code**: Use any QR scanner to extract the JWT
5. **Verify JWT**: Send extracted JWT to `/verify-jwt` for validation

## Security Features

- **HMAC-SHA256**: Cryptographically secure signing algorithm
- **Expiration**: JWTs expire after 24 hours by default
- **Issuer Validation**: All JWTs must be issued by 'cert-tools'
- **Unique IDs**: Each JWT has a unique identifier (jti claim)
- **Timestamp Validation**: Issued-at time prevents replay attacks

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error description",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid input)
- `500`: Internal Server Error

## Development

### Project Structure

```
cert-tools/
├── src/
│   └── index.ts          # Main API server
├── lib/
│   ├── jwt.ts           # JWT signing and verification
│   └── qrcode.ts        # QR code utilities (legacy)
├── scripts/
│   ├── generate-qr.ts   # Local QR code generation script
│   └── verify-qr.ts     # Local QR code verification script
├── .env                 # Environment variables
├── package.json         # Dependencies
└── README.md           # This file
```

### Dependencies

- **hono**: Fast web framework
- **qrcode**: QR code generation (for local scripts)
- **@types/qrcode**: TypeScript definitions

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the API documentation above
- Review the example code

---

Built with ❤️ using Bun and Hono
