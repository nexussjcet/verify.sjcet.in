import { Hono } from 'hono'
import { signJWT, verifyJWT } from '../lib/jwt'

interface Env {
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Env }>();

// No key initialization needed - using JWT_SECRET from .env

app.get('/', (c) => {
  return c.text('Certificate Tools API - QR Code & JWT Service: https://github.com/nexussjcet/verify.sjcet.in')
})

// Route 1: Accept JSON, sign it as JWT, and return the JWT
app.post('/generate-jwt', async (c) => {
  try {

    const body = await c.req.json()

    if (!body || typeof body !== 'object') {
      return c.json({ error: 'Invalid JSON payload' }, 400)
    }

    // Add timestamp to the payload
    const payload = {
      ...body,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours expiration
    }

    // Sign the JWT
    const jwt = await signJWT(payload, c.env.JWT_SECRET, {
      issuer: 'cert-tools',
      expiresIn: '24h'
    })

    return c.json({
      success: true,
      jwt,
      payload
    })

  } catch (error) {
    console.error('Error generating JWT:', error)
    return c.json({
      error: 'Failed to generate JWT',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Route 2: Accept JWT string directly (extracted from QR code), verify and return data
app.post('/verify-jwt', async (c) => {
  try {

    const body = await c.req.json()

    if (!body.jwt) {
      return c.json({ error: 'No JWT provided' }, 400)
    }

    // Verify the JWT
    const payload = await verifyJWT(body.jwt, c.env.JWT_SECRET, {
      issuer: 'cert-tools',
      algorithms: ['HS256']
    })

    return c.json({
      success: true,
      jwt: body.jwt,
      payload,
      verified: true
    })

  } catch (error) {
    console.error('Error verifying JWT:', error)
    return c.json({
      error: 'Failed to verify JWT',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// Get JWT info endpoint
app.get('/jwt-info', async (c) => {
  return c.json({
    algorithm: 'HS256',
    issuer: 'cert-tools',
    note: 'JWTs are signed with HMAC-SHA256 using a secret key'
  })
})

export default app
