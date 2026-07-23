import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

/**
 * Input Validation & Sanitization Pipe
 * Per Volume V Chapter 7 §7.19: Security Operations
 * "Vulnerability scanning, Security updates"
 *
 * Prevents:
 * - SQL injection (input length limits, character filtering)
 * - XSS attacks (HTML tag stripping)
 * - Command injection (special character filtering)
 * - Buffer overflow (length limits)
 */

@Injectable()
export class InputValidationPipe implements PipeTransform {
  private static readonly MAX_INPUT_LENGTH = 1000;
  
  // Patterns that indicate potential attacks
  private static readonly DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,  // Script tags
    /javascript:/gi,                                          // JavaScript protocol
    /on\w+\s*=/gi,                                            // Event handlers
    /union\s+select/gi,                                       // SQL injection
    /drop\s+table/gi,                                         // SQL injection
    /;\s*rm\s+/gi,                                            // Command injection
    /\.\.\//g,                                                // Path traversal
  ];

  transform(value: any): any {
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }
    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value);
    }
    return value;
  }

  private sanitizeString(input: string): string {
    // Length check
    if (input.length > InputValidationPipe.MAX_INPUT_LENGTH) {
      throw new BadRequestException('Input exceeds maximum length');
    }

    // Check for dangerous patterns
    for (const pattern of InputValidationPipe.DANGEROUS_PATTERNS) {
      if (pattern.test(input)) {
        throw new BadRequestException('Input contains potentially dangerous content');
      }
    }

    // Basic HTML entity encoding for display safety
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  private sanitizeObject(obj: any): any {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}
