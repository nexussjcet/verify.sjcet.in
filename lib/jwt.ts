import { subtle } from 'crypto';

export interface JWTPayload {
  [key: string]: any;
}

export interface JWTOptions {
  algorithm?: string;
  expiresIn?: string;
  issuer?: string;
  audience?: string;
  subject?: string;
}

export interface JWTVerifyOptions {
  issuer?: string;
  audience?: string;
  algorithms?: string[];
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(data: string): string {
  return btoa(data)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64 URL decode
 */
function base64UrlDecode(data: string): string {
  let padded = data.replace(/-/g, '+').replace(/_/g, '/');
  const padding = 4 - (padded.length % 4);
  if (padding !== 4) {
    padded += '='.repeat(padding);
  }
  return atob(padded);
}

/**
 * Convert ArrayBuffer to base64url
 */
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return base64UrlEncode(binary);
}

/**
 * Parse expiration time string to seconds
 */
function parseExpirationTime(expiresIn: string): number {
  const units: Record<string, number> = {
    's': 1,
    'm': 60,
    'h': 3600,
    'd': 86400
  };
  
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error('Invalid expiration time format');
  }
  
  const [, value, unit] = match;
  return parseInt(value) * units[unit];
}

/**
 * Get JWT secret from environment
 */
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

/**
 * Sign a JWT with HMAC SHA-256
 */
export async function signJWT(
  payload: JWTPayload,
  secret?: string,
  options: JWTOptions = {}
): Promise<string> {
  try {
    const jwtSecret = secret || getJWTSecret();
    
    // Create header
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    // Process payload
    const now = Math.floor(Date.now() / 1000);
    const processedPayload: any = {
      ...payload,
      iat: now,
      jti: crypto.randomUUID()
    };

    // Add standard claims
    if (options.issuer) {
      processedPayload.iss = options.issuer;
    }
    if (options.audience) {
      processedPayload.aud = options.audience;
    }
    if (options.subject) {
      processedPayload.sub = options.subject;
    }
    if (options.expiresIn) {
      processedPayload.exp = now + parseExpirationTime(options.expiresIn);
    }

    // Encode header and payload
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(processedPayload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    // Import secret key for HMAC
    const key = await subtle.importKey(
      'raw',
      new TextEncoder().encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Sign with HMAC
    const signature = await subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(signingInput)
    );

    const encodedSignature = arrayBufferToBase64Url(signature);
    
    return `${signingInput}.${encodedSignature}`;
  } catch (error) {
    throw new Error(`Failed to sign JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify and decode a JWT with HMAC SHA-256
 */
export async function verifyJWT(
  token: string,
  secret?: string,
  options: JWTVerifyOptions = {}
): Promise<JWTPayload> {
  try {
    const jwtSecret = secret || getJWTSecret();
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    
    // Decode header and payload
    const header = JSON.parse(base64UrlDecode(encodedHeader));
    const payload = JSON.parse(base64UrlDecode(encodedPayload));

    // Check algorithm
    if (header.alg !== 'HS256') {
      throw new Error(`Unsupported algorithm: ${header.alg}`);
    }

    if (options.algorithms && !options.algorithms.includes(header.alg)) {
      throw new Error(`Algorithm ${header.alg} not allowed`);
    }

    // Import secret key for HMAC
    const key = await subtle.importKey(
      'raw',
      new TextEncoder().encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Verify signature
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    
    // Convert base64url signature to ArrayBuffer
    const signatureData = encodedSignature.replace(/-/g, '+').replace(/_/g, '/');
    const paddedSignature = signatureData + '='.repeat((4 - signatureData.length % 4) % 4);
    const signature = new Uint8Array(
      atob(paddedSignature)
        .split('')
        .map(char => char.charCodeAt(0))
    );

    const isValid = await subtle.verify(
      'HMAC',
      key,
      signature,
      new TextEncoder().encode(signingInput)
    );

    if (!isValid) {
      throw new Error('Invalid JWT signature');
    }

    // Check standard claims
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < now) {
      throw new Error('JWT has expired');
    }
    
    if (payload.nbf && payload.nbf > now) {
      throw new Error('JWT not yet valid');
    }
    
    if (options.issuer && payload.iss !== options.issuer) {
      throw new Error(`Expected issuer ${options.issuer}, got ${payload.iss}`);
    }
    
    if (options.audience && payload.aud !== options.audience) {
      throw new Error(`Expected audience ${options.audience}, got ${payload.aud}`);
    }

    return payload;
  } catch (error) {
    throw new Error(`Failed to verify JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decode a JWT without verification (unsafe - use only for inspection)
 */
export function decodeJWTUnsafe(token: string): {
  header: any;
  payload: JWTPayload;
  signature: string;
} {
  try {
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const [headerB64, payloadB64, signature] = parts;
    
    const header = JSON.parse(base64UrlDecode(headerB64));
    const payload = JSON.parse(base64UrlDecode(payloadB64));
    
    return {
      header,
      payload,
      signature
    };
  } catch (error) {
    throw new Error(`Failed to decode JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a JWT is expired
 */
export function isJWTExpired(token: string): boolean {
  try {
    const { payload } = decodeJWTUnsafe(token);
    
    if (!payload.exp) {
      return false;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    throw new Error(`Failed to check JWT expiration: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a certificate payload with standard fields
 */
export function createCertificatePayload(data: {
  certificateId: string;
  recipientName: string;
  recipientEmail?: string;
  courseName: string;
  issuerName: string;
  issueDate: Date;
  expirationDate?: Date;
  metadata?: Record<string, any>;
}): JWTPayload {
  const payload: JWTPayload = {
    certificateId: data.certificateId,
    recipientName: data.recipientName,
    courseName: data.courseName,
    issuerName: data.issuerName,
    issueDate: data.issueDate.toISOString(),
    type: 'certificate'
  };

  if (data.recipientEmail) {
    payload.recipientEmail = data.recipientEmail;
  }

  if (data.expirationDate) {
    payload.expirationDate = data.expirationDate.toISOString();
  }

  if (data.metadata) {
    payload.metadata = data.metadata;
  }

  return payload;
}