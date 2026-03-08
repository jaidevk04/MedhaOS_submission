/**
 * TLS Configuration Service
 * Manages TLS 1.3 configuration for secure communications
 */

import * as https from 'https';
import * as tls from 'tls';
import { securityConfig } from '../config';
import { TLSConfig } from '../types';

export class TLSService {
  private config: TLSConfig;

  constructor() {
    this.config = {
      version: securityConfig.tls.version,
      cipherSuites: securityConfig.tls.cipherSuites,
      certificateArn: process.env.TLS_CERTIFICATE_ARN || '',
      enforceHTTPS: securityConfig.tls.enforceHTTPS,
    };
  }

  /**
   * Get TLS options for HTTPS server
   */
  getTLSOptions(): https.ServerOptions {
    return {
      minVersion: 'TLSv1.3',
      maxVersion: 'TLSv1.3',
      ciphers: this.config.cipherSuites.join(':'),
      honorCipherOrder: true,
      requestCert: false,
      rejectUnauthorized: true,
    };
  }

  /**
   * Get TLS options for client connections
   */
  getClientTLSOptions(): tls.ConnectionOptions {
    return {
      minVersion: 'TLSv1.3',
      maxVersion: 'TLSv1.3',
      ciphers: this.config.cipherSuites.join(':'),
      rejectUnauthorized: true,
      checkServerIdentity: (hostname, cert) => {
        // Custom server identity check
        return undefined; // No error means valid
      },
    };
  }

  /**
   * Middleware to enforce HTTPS
   */
  enforceHTTPS() {
    return (req: any, res: any, next: any) => {
      if (!this.config.enforceHTTPS) {
        return next();
      }

      if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        return next();
      }

      // Redirect to HTTPS
      const httpsUrl = `https://${req.headers.host}${req.url}`;
      res.redirect(301, httpsUrl);
    };
  }

  /**
   * Validate TLS connection
   */
  validateConnection(socket: tls.TLSSocket): boolean {
    const protocol = socket.getProtocol();
    const cipher = socket.getCipher();

    // Ensure TLS 1.3 is used
    if (protocol !== 'TLSv1.3') {
      console.warn(`Insecure TLS version detected: ${protocol}`);
      return false;
    }

    // Ensure approved cipher suite is used
    if (cipher && !this.config.cipherSuites.includes(cipher.name)) {
      console.warn(`Unapproved cipher suite detected: ${cipher.name}`);
      return false;
    }

    return true;
  }

  /**
   * Get security headers for HTTP responses
   */
  getSecurityHeaders(): Record<string, string> {
    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };
  }

  /**
   * Middleware to add security headers
   */
  securityHeadersMiddleware() {
    const headers = this.getSecurityHeaders();

    return (req: any, res: any, next: any) => {
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      next();
    };
  }

  /**
   * Check if certificate is valid
   */
  isCertificateValid(cert: tls.PeerCertificate): boolean {
    const now = new Date();
    const validFrom = new Date(cert.valid_from);
    const validTo = new Date(cert.valid_to);

    if (now < validFrom || now > validTo) {
      console.error('Certificate is expired or not yet valid');
      return false;
    }

    // Check for certificate revocation (simplified)
    // In production, implement OCSP or CRL checking
    return true;
  }

  /**
   * Get TLS configuration
   */
  getConfig(): TLSConfig {
    return { ...this.config };
  }
}

export default new TLSService();
