#!/usr/bin/env bun

import * as QRCode from 'qrcode';

// API endpoint configuration
const API_ENDPOINT = 'http://localhost:8787';

interface CertificateData {
  certificateId?: string;
  recipientName?: string;
  courseName?: string;
  issuerName?: string;
  completionDate?: string;
  [key: string]: any;
}

interface APIResponse {
  success: boolean;
  jwt: string;
  payload: any;
  error?: string;
  message?: string;
}

/**
 * Generate a JWT from certificate data using the API
 */
async function generateJWT(data: CertificateData): Promise<string> {
  try {
    const response = await fetch(`${API_ENDPOINT}/generate-jwt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: APIResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate JWT');
    }

    return result.jwt;
  } catch (error) {
    throw new Error(`Failed to call API: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate QR code from JWT
 */
async function generateQRCode(jwt: string, outputPath?: string): Promise<void> {
  try {
    const qrOptions = {
      width: 300,
      margin: 4,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M' as const
    };

    if (outputPath) {
      // Save to file
      await QRCode.toFile(outputPath, jwt, qrOptions);
      console.log(`✅ QR code saved to: ${outputPath}`);
    } else {
      // Generate data URL and display
      const qrCodeDataURL = await QRCode.toDataURL(jwt, qrOptions);
      console.log('✅ QR Code generated successfully!');
      console.log('📱 QR Code Data URL:');
      console.log(qrCodeDataURL);
      console.log('\n🔑 JWT Token:');
      console.log(jwt);
    }
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    console.log('1. Interactive mode:');
    console.log('   bun run scripts/generate-qr.ts');
    console.log('');
    console.log('2. With JSON data:');
    console.log('   bun run scripts/generate-qr.ts \'{"certificateId":"CERT-123","recipientName":"John Doe"}\'');
    console.log('');
    console.log('3. Save to file:');
    console.log('   bun run scripts/generate-qr.ts \'{"certificateId":"CERT-123"}\' qrcode.png');
    console.log('');
    console.log('🔧 API Endpoint:', API_ENDPOINT);
    return;
  }

  try {
    let certificateData: CertificateData;
    let outputPath: string | undefined;

    if (args[0]) {
      // Parse JSON from command line argument
      try {
        certificateData = JSON.parse(args[0]);
      } catch (error) {
        console.error('❌ Invalid JSON format in first argument');
        return;
      }

      // Optional output path
      outputPath = args[1];
    } else {
      // Interactive mode (you can extend this with prompts if needed)
      certificateData = {
        certificateId: 'CERT-' + Date.now(),
        recipientName: 'John Doe',
        courseName: 'Sample Course',
        issuerName: 'Tech Academy',
        completionDate: new Date().toISOString().split('T')[0]
      };

      console.log('📝 Using sample certificate data:');
      console.log(JSON.stringify(certificateData, null, 2));
    }

    console.log('🔄 Generating JWT...');
    const jwt = await generateJWT(certificateData);

    console.log('🔄 Generating QR code...');
    await generateQRCode(jwt, outputPath);

    console.log('\n✨ Certificate QR code generation completed!');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run the script
main();
