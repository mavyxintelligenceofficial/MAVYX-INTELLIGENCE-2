import { Injectable, BadRequestException } from '@nestjs/common';

/**
 * Security Service — password validation and account protection.
 * Per Volume V Chapter 7 §7.19: Security Operations
 * Per Volume VI §1.9: Security Testing
 */

@Injectable()
export class SecurityService {
  // Account lockout tracking (in production, use Redis)
  private static loginAttempts: Map<string, { count: number; lockedUntil: number }> = new Map();
  
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  /**
   * Validate password strength.
   * Requirements:
   * - Minimum 8 characters
   * - At least 1 uppercase letter
   * - At least 1 lowercase letter
   * - At least 1 number
   * - At least 1 special character
   */
  validatePasswordStrength(password: string): void {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least 1 uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least 1 lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least 1 number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least 1 special character');
    }

    // Check for common passwords
    const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123', 'password1'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('This password is too common. Please choose a stronger password.');
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Password does not meet security requirements',
        errors,
      });
    }
  }

  /**
   * Check if an account is locked due to too many failed login attempts.
   */
  isAccountLocked(email: string): boolean {
    const entry = SecurityService.loginAttempts.get(email.toLowerCase());
    if (!entry) return false;

    if (Date.now() > entry.lockedUntil) {
      // Lockout expired
      SecurityService.loginAttempts.delete(email.toLowerCase());
      return false;
    }

    return entry.count >= SecurityService.MAX_LOGIN_ATTEMPTS;
  }

  /**
   * Record a failed login attempt.
   */
  recordFailedAttempt(email: string): void {
    const key = email.toLowerCase();
    const entry = SecurityService.loginAttempts.get(key) || { count: 0, lockedUntil: 0 };
    
    entry.count++;
    
    if (entry.count >= SecurityService.MAX_LOGIN_ATTEMPTS) {
      entry.lockedUntil = Date.now() + SecurityService.LOCKOUT_DURATION_MS;
    }
    
    SecurityService.loginAttempts.set(key, entry);
  }

  /**
   * Clear failed login attempts after successful login.
   */
  clearFailedAttempts(email: string): void {
    SecurityService.loginAttempts.delete(email.toLowerCase());
  }

  /**
   * Get remaining lockout time in seconds.
   */
  getLockoutRemainingSeconds(email: string): number {
    const entry = SecurityService.loginAttempts.get(email.toLowerCase());
    if (!entry || Date.now() > entry.lockedUntil) return 0;
    return Math.ceil((entry.lockedUntil - Date.now()) / 1000);
  }
}
