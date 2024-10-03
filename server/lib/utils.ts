import crypto from 'crypto';

/**
 * Generates a random hexadecimal string of the specified length.
 * @param length The length of the generated string.
 */
export function generateRandomHexName(length: number = 16): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * Generates a short URL-friendly string of the specified length.
 * @param length The length of the generated string.
 */
export function generateShortUrlString(length: number = 6): string {
  const bytes = crypto.randomBytes(Math.ceil((length * 3) / 4));
  return bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').slice(0, length);
}

/**
 * Checks if the given text is likely a URL.
 * @param text The text to check.
 */
export function isLikelyUrl(text: string): boolean {
  // Regular expression for standard URLs
  const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
  
  // Check for various protocols
  const protocolPattern = /^(https?|ftp|file|mailto|tel|sms|data):/i;
  
  // Check for domain-like structure
  const domainPattern = /^[\w-]+(\.[\w-]+)+/;
  
  // Check for IP address
  const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
  
  // Check for localhost
  const localhostPattern = /^localhost(:\d+)?/i;

  return (
    urlPattern.test(text) ||
    protocolPattern.test(text) ||
    domainPattern.test(text) ||
    ipPattern.test(text) ||
    localhostPattern.test(text)
  );
}

/**
 * Sleeps for the specified number of milliseconds.
 * @param ms The number of milliseconds to sleep.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
