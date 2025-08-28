# Certificate Tools

A simple and secure API for generating QR codes from signed JWTs and verifying JWTs extracted from QR codes. Perfect for digital certificates, tickets, and secure data verification.

## Features

- 🔐 **JWT Signing**: Sign JSON data with HMAC-SHA256
- 📱 **QR Code Generation**: Create QR codes containing signed JWTs
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

### 1. Generate QR Code

**POST** `/generate-qr`

Accepts JSON data, signs it as a JWT, and returns a QR code.

#### Request

```bash
curl -X POST http://localhost:3000/generate-qr \
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
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
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

## Usage Examples

### JavaScript/TypeScript

```typescript
// Generate QR Code
async function generateCertificateQR(certificateData: any) {
  const response = await fetch('/generate-qr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(certificateData)
  });

  const result = await response.json();

  // Display QR code
  const img = document.createElement('img');
  img.src = result.qrCode;
  document.body.appendChild(img);

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

# Generate QR Code
def generate_qr(data):
    response = requests.post(
        'http://localhost:3000/generate-qr',
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

result = generate_qr(certificate_data)
print(f"QR Code generated: {result['success']}")
```

## Workflow

1. **Create Certificate Data**: Prepare your certificate/ticket data as JSON
2. **Generate QR Code**: Send data to `/generate-qr` endpoint
3. **Display QR Code**: Show the returned base64 QR code image
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
│   └── qrcode.ts        # QR code generation
├── .env                 # Environment variables
├── package.json         # Dependencies
└── README.md           # This file
```

### Dependencies

- **hono**: Fast web framework
- **qrcode**: QR code generation
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
