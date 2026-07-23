import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

/**
 * Rate Limiting Guard
 * Per Volume V Chapter 7 §7.19: Security Operations
 * "Network protection, Access management, Vulnerability scanning"
 *
 * Prevents brute force attacks and API abuse.
 * Limits: 100 requests per minute per IP for general endpoints
 * Limits: 10 requests per minute per IP for auth endpoints
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private static requests: Map<string, RateLimitEntry> = new Map();
  
  // Different limits for different endpoint types
  private static readonly LIMITS = {
    general: { maxRequests: 100, windowMs: 60000 },      // 100/min
    auth: { maxRequests: 10, windowMs: 60000 },           // 10/min (brute force protection)
    ai: { maxRequests: 20, windowMs: 60000 },             // 20/min (AI is expensive)
  };

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection.remoteAddress || 'unknown';
    const path = request.path;
    
    // Determine rate limit category
    let category: keyof typeof RateLimitGuard.LIMITS = 'general';
    if (path.includes('/auth/')) category = 'auth';
    if (path.includes('/ai/')) category = 'ai';
    
    const limit = RateLimitGuard.LIMITS[category];
    const key = `${ip}:${category}`;
    const now = Date.now();
    
    // Clean up expired entries periodically
    if (RateLimitGuard.requests.size > 10000) {
      RateLimitGuard.requests.forEach((entry, k) => {
        if (now > entry.resetTime) RateLimitGuard.requests.delete(k);
      });
    }
    
    let entry = RateLimitGuard.requests.get(key);
    
    if (!entry || now > entry.resetTime) {
      // New window
      entry = { count: 1, resetTime: now + limit.windowMs };
      RateLimitGuard.requests.set(key, entry);
      return true;
    }
    
    if (entry.count >= limit.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    
    entry.count++;
    return true;
  }
}
