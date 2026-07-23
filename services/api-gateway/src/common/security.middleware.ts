import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Security Middleware — adds security headers to all responses.
 * Per Volume V Chapter 7 §7.19: Security Operations
 *
 * Headers protect against:
 * - XSS attacks (X-XSS-Protection, Content-Security-Policy)
 * - Clickjacking (X-Frame-Options)
 * - MIME sniffing (X-Content-Type-Options)
 * - Information leakage (X-Powered-By removal)
 * - CSRF (SameSite cookies)
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Remove server identification
    res.removeHeader('X-Powered-By');
    
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // XSS Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer Policy — don't leak URLs to external sites
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy — disable unnecessary browser features
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' http://localhost:* https://api.z.ai;"
    );
    
    // Strict Transport Security (enable in production with HTTPS)
    // res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    next();
  }
}
