#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';
import jsQR from "jsqr";
import { Jimp } from "jimp";

// API endpoint configuration
const API_ENDPOINT = 'http://localhost:8787';

interface APIResponse {
  success: boolean;
  jwt: string;
  payload: any;
  verified: boolean;
  error?: string;
  message?: string;
}

/**
 * Verify a JWT using the API
 */
async function verifyJWT(jwt: string): Promise<APIResponse> {
  try {
    const response = await fetch(`${API_ENDPOINT}/verify-jwt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jwt }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: APIResponse = await response.json();
    return result;
  } catch (error) {
    throw new Error(`Failed to call API: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract JWT from a QR code image using jsQR
 */
async function extractJWTFromQRImage(imagePath: string): Promise<string> {
  try {
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    console.log(`📷 Reading QR code from image: ${imagePath}`);

    // Read and process the image
    const image = await Jimp.read(imagePath);

    // Try multiple processing approaches for better QR detection
    const processingAttempts = [
      // Original image
      { image: image.clone(), description: "original" },
      // Grayscale
      { image: image.clone().greyscale(), description: "grayscale" },
      // Increased contrast
      { image: image.clone().greyscale().contrast(0.3), description: "high contrast" },
      // Normalized brightness
      { image: image.clone().greyscale().normalize(), description: "normalized" },
      // Blur reduction (sharpen)
      { image: image.clone().greyscale().convolute([
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
      ]), description: "sharpened" }
    ];

    let qrResult = null;
    let usedProcessing = "";

    // Try different image processing approaches
    for (const attempt of processingAttempts) {
      const { data, width, height } = attempt.image.bitmap;

      // Convert RGBA to RGB (jsQR expects Uint8ClampedArray)
      const rgbaData = new Uint8ClampedArray(data);

      // Decode QR code
      qrResult = jsQR(rgbaData, width, height, {
        inversionAttempts: "dontInvert", // Try without color inversion first
      });

      if (qrResult) {
        usedProcessing = attempt.description;
        break;
      }

      // If no result, try with inversion attempts
      qrResult = jsQR(rgbaData, width, height, {
        inversionAttempts: "attemptBoth", // Try both normal and inverted
      });

      if (qrResult) {
        usedProcessing = `${attempt.description} (with inversion)`;
        break;
      }
    }

    if (!qrResult) {
      throw new Error('No QR code found in the image. Please ensure the image contains a clear, well-lit QR code. Try using a higher resolution image or better lighting.');
    }

    console.log(`✅ QR code successfully decoded using ${usedProcessing} processing`);

    const jwt = qrResult.data.trim();

    // Log QR code location for debugging
    console.log(`📍 QR code found at coordinates: (${qrResult.location.topLeftCorner.x}, ${qrResult.location.topLeftCorner.y})`);

    // Validate that the QR code contains a JWT
    if (!isValidJWTFormat(jwt)) {
      throw new Error(`QR code does not contain a valid JWT format. Found content: "${jwt.substring(0, 100)}${jwt.length > 100 ? '...' : ''}"`);
    }

    return jwt;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract JWT from QR image: ${error.message}`);
    }
    throw new Error('Failed to extract JWT from QR image: Unknown error');
  }
}

/**
 * Extract JWT from a text file (assuming it contains just the JWT)
 */
function extractJWTFromFile(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8').trim();

    // Check if it looks like a JWT (three parts separated by dots)
    const parts = content.split('.');
    if (parts.length === 3 && parts.every(part => part.length > 0)) {
      return content;
    } else {
      throw new Error('File does not contain a valid JWT format');
    }
  } catch (error) {
    throw new Error(`Failed to read JWT from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate JWT format
 */
function isValidJWTFormat(jwt: string): boolean {
  const parts = jwt.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

/**
 * Format and display verification results
 */
function displayResults(result: APIResponse): void {
  console.log('\n📋 Verification Results:');
  console.log('========================');

  if (result.success && result.verified) {
    console.log('✅ Status: VALID');
    console.log('🔐 JWT verified successfully');

    console.log('\n📄 Certificate Data:');
    console.log('-------------------');

    const payload = result.payload;

    // Display common certificate fields
    if (payload.certificateId) {
      console.log(`📜 Certificate ID: ${payload.certificateId}`);
    }
    if (payload.recipientName) {
      console.log(`👤 Recipient: ${payload.recipientName}`);
    }
    if (payload.courseName) {
      console.log(`🎓 Course: ${payload.courseName}`);
    }
    if (payload.issuerName) {
      console.log(`🏢 Issuer: ${payload.issuerName}`);
    }
    if (payload.completionDate) {
      console.log(`📅 Completion Date: ${payload.completionDate}`);
    }

    // Display JWT metadata
    console.log('\n🔧 JWT Metadata:');
    console.log('---------------');
    if (payload.iss) {
      console.log(`🏷️  Issuer: ${payload.iss}`);
    }
    if (payload.iat) {
      console.log(`⏰ Issued At: ${new Date(payload.iat * 1000).toLocaleString()}`);
    }
    if (payload.exp) {
      console.log(`⏳ Expires At: ${new Date(payload.exp * 1000).toLocaleString()}`);
    }
    if (payload.jti) {
      console.log(`🆔 JWT ID: ${payload.jti}`);
    }

    // Display any additional fields
    const commonFields = ['certificateId', 'recipientName', 'courseName', 'issuerName', 'completionDate', 'iss', 'iat', 'exp', 'jti'];
    const additionalFields = Object.keys(payload).filter(key => !commonFields.includes(key));

    if (additionalFields.length > 0) {
      console.log('\n📎 Additional Data:');
      console.log('------------------');
      additionalFields.forEach(key => {
        console.log(`${key}: ${JSON.stringify(payload[key])}`);
      });
    }

  } else {
    console.log('❌ Status: INVALID');
    console.log('🚫 JWT verification failed');

    if (result.error) {
      console.log(`💥 Error: ${result.error}`);
    }
    if (result.message) {
      console.log(`📝 Details: ${result.message}`);
    }
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('📋 Usage Examples:');
    console.log('');
    console.log('1. Verify JWT from command line:');
    console.log('   bun run scripts/verify-qr.ts "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."');
    console.log('');
    console.log('2. Verify JWT from text file:');
    console.log('   bun run scripts/verify-qr.ts --file jwt.txt');
    console.log('');
    console.log('3. Verify JWT from QR code image:');
    console.log('   bun run scripts/verify-qr.ts --qr-image qr-code.png');
    console.log('   bun run scripts/verify-qr.ts --qr-image qr-code.jpg');
    console.log('');
    console.log('4. Interactive verification:');
    console.log('   bun run scripts/verify-qr.ts --interactive');
    console.log('');
    console.log('📷 Supported image formats: PNG, JPEG, GIF, BMP, TIFF');
    console.log('💡 Tips for best QR code scanning results:');
    console.log('   - Ensure good lighting and high contrast');
    console.log('   - Use high resolution images (at least 300x300 pixels)');
    console.log('   - Avoid blurry or distorted images');
    console.log('   - Make sure the entire QR code is visible in the image');
    console.log('');
    console.log('🔧 API Endpoint:', API_ENDPOINT);
    return;
  }

  try {
    let jwt: string;

    if (args[0] === '--file' && args[1]) {
      // Read JWT from text file
      console.log(`📂 Reading JWT from file: ${args[1]}`);
      jwt = extractJWTFromFile(args[1]);
      console.log('✅ JWT extracted from file');
    } else if (args[0] === '--qr-image' && args[1]) {
      // Read JWT from QR code image
      jwt = await extractJWTFromQRImage(args[1]);
    } else if (args[0] === '--interactive') {
      // Interactive mode - show instructions for manual extraction
      console.log('🔍 Interactive mode');
      console.log('📱 To verify a certificate from a QR code:');
      console.log('');
      console.log('Option 1 - Use this script directly:');
      console.log('  bun run scripts/verify-qr.ts --qr-image /path/to/qr-code.png');
      console.log('');
      console.log('Option 2 - Manual extraction:');
      console.log('  1. Use any QR code scanner app to scan the code');
      console.log('  2. Copy the JWT string from the scanner');
      console.log('  3. Run: bun run scripts/verify-qr.ts "your-jwt-here"');
      console.log('');
      console.log('💡 The QR code should contain a JWT token for certificate verification');
      console.log('');
      console.log('🔧 Troubleshooting QR code issues:');
      console.log('   - Ensure image is clear and well-lit');
      console.log('   - Try different image formats (PNG recommended)');
      console.log('   - Check that the entire QR code is visible');
      console.log('   - Use higher resolution images if possible');
      return;
    } else {
      // JWT provided as argument
      jwt = args[0];
    }

    // Validate JWT format
    if (!isValidJWTFormat(jwt)) {
      console.error('❌ Invalid JWT format. Expected format: xxx.yyy.zzz');
      return;
    }

    console.log('🔄 Verifying JWT...');
    console.log(`🔑 JWT: ${jwt.substring(0, 50)}...`);

    const result = await verifyJWT(jwt);
    displayResults(result);

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run the script
main();
