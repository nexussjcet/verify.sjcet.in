import * as QRCode from 'qrcode';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Generate a QR code from a JWT string
 * @param jwt - The JWT string to encode in the QR code
 * @param options - QR code generation options
 * @returns Promise<string> - Base64 encoded PNG image
 */
export async function generateQRCodeFromJWT(
  jwt: string,
  options: QRCodeOptions = {}
): Promise<string> {
  try {
    const qrOptions = {
      width: options.width || 300,
      margin: options.margin || 4,
      color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#FFFFFF'
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'M'
    };

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(jwt, qrOptions);

    // Return base64 string without data URL prefix
    return qrCodeDataURL.split(',')[1];
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a QR code as SVG from a JWT string
 * @param jwt - The JWT string to encode in the QR code
 * @param options - QR code generation options
 * @returns Promise<string> - SVG string
 */
export async function generateQRCodeSVGFromJWT(
  jwt: string,
  options: QRCodeOptions = {}
): Promise<string> {
  try {
    const qrOptions = {
      width: options.width || 300,
      margin: options.margin || 4,
      color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#FFFFFF'
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'M'
    };

    return await QRCode.toString(jwt, {
      type: 'svg',
      ...qrOptions
    });
  } catch (error) {
    throw new Error(`Failed to generate QR code SVG: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decode a JWT from a QR code image buffer
 * For now, this is a placeholder that requires manual QR code reading
 * In a production environment, you would use a QR code reader library
 * @param imageBuffer - Buffer containing the QR code image
 * @returns Promise<string> - The decoded JWT string
 */
export async function decodeJWTFromQRCode(imageBuffer: Buffer): Promise<string> {
  // This is a simplified implementation
  // In a real application, you would use a QR code reading library like jsQR
  // For now, we'll throw an error indicating this needs to be implemented
  throw new Error('QR code decoding not implemented. Please use a QR code reader to extract the JWT manually.');
}

/**
 * Validate if a string has the basic JWT format (three parts separated by dots)
 * @param jwt - String to validate
 * @returns boolean - True if the string has JWT format
 */
export function isValidJWTFormat(jwt: string): boolean {
  const parts = jwt.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

/**
 * Mock function for decoding JWT from QR code string
 * This would normally handle different input formats
 * @param imageData - Image URL or base64 string
 * @returns Promise<string> - The decoded JWT string
 */
export async function decodeJWTFromQRCodeString(imageData: string): Promise<string> {
  throw new Error('QR code decoding from string not implemented. Please use a QR code reader to extract the JWT manually.');
}
