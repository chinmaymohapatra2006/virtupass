import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { inMemoryStore } from '../data/inMemoryStore';
import { env } from '../utils/env';
import {
  User,
  SafeUser,
  AuthTokens,
  TokenPayload,
  RefreshTokenRecord
} from '../types';

export class AuthService {
  /**
   * Register a new student (USER role is enforced by backend)
   */
  public async registerStudent(data: {
    fullName: string;
    email: string;
    password: string;
    studentId: string;
    collegeName: string;
    department: string;
    yearOfStudy: number;
  }): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const normalizedEmail = data.email.trim().toLowerCase();
    const normalizedStudentId = data.studentId.trim().toUpperCase();

    // 1. Check uniqueness of email
    if (inMemoryStore.findUserByEmail(normalizedEmail)) {
      const err: any = new Error('An account with this email address already exists');
      err.statusCode = 409;
      err.code = 'EMAIL_ALREADY_EXISTS';
      throw err;
    }

    // 2. Check uniqueness of student ID
    if (inMemoryStore.findUserByStudentId(normalizedStudentId)) {
      const err: any = new Error('An account with this student ID already exists');
      err.statusCode = 409;
      err.code = 'STUDENT_ID_ALREADY_EXISTS';
      throw err;
    }

    // 3. Hash password securely
    const passwordHash = await bcrypt.hash(data.password, 10);
    const now = new Date().toISOString();

    // 4. Create user record with strict USER role
    const newUser: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: normalizedEmail,
      passwordHash,
      fullName: data.fullName.trim(),
      role: 'USER', // Enforced by backend; client cannot escalate
      status: 'ACTIVE',
      studentId: normalizedStudentId,
      collegeName: data.collegeName.trim(),
      department: data.department.trim(),
      yearOfStudy: Number(data.yearOfStudy),
      isVerified: false,
      createdAt: now,
      updatedAt: now
    };

    inMemoryStore.addUser(newUser);

    // 5. Generate authentication tokens
    const tokens = this.generateTokens(newUser);

    return {
      user: inMemoryStore.toSafeUser(newUser),
      tokens
    };
  }

  /**
   * Register a new organizer (ORGANIZER role is assigned with PENDING_APPROVAL)
   */
  public async registerOrganizer(data: {
    fullName: string;
    email: string;
    password: string;
    organizationName: string;
    contactNumber: string;
    collegeName?: string;
  }): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const normalizedEmail = data.email.trim().toLowerCase();

    // 1. Check uniqueness of email
    if (inMemoryStore.findUserByEmail(normalizedEmail)) {
      const err: any = new Error('An account with this email address already exists');
      err.statusCode = 409;
      err.code = 'EMAIL_ALREADY_EXISTS';
      throw err;
    }

    // 2. Hash password securely
    const passwordHash = await bcrypt.hash(data.password, 10);
    const now = new Date().toISOString();

    // 3. Create organizer record with initial PENDING_APPROVAL status
    const newUser: User = {
      id: `org-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: normalizedEmail,
      passwordHash,
      fullName: data.fullName.trim(),
      role: 'ORGANIZER', // Enforced by backend; public registration cannot grant ADMIN
      status: 'PENDING_APPROVAL',
      organizationName: data.organizationName.trim(),
      contactNumber: data.contactNumber.trim(),
      collegeName: data.collegeName ? data.collegeName.trim() : 'Affiliated College / Society',
      approvalStatus: 'PENDING_APPROVAL',
      isVerified: false,
      createdAt: now,
      updatedAt: now
    };

    inMemoryStore.addUser(newUser);

    // 4. Generate authentication tokens
    const tokens = this.generateTokens(newUser);

    return {
      user: inMemoryStore.toSafeUser(newUser),
      tokens
    };
  }

  /**
   * Login with email and password
   * Returns generic message on failure to prevent account enumeration
   */
  public async login(
    email: string,
    pass: string
  ): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = inMemoryStore.findUserByEmail(normalizedEmail);

    if (!user) {
      const err: any = new Error('Invalid email or password');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      const err: any = new Error('Invalid email or password');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    if (user.status === 'SUSPENDED') {
      const err: any = new Error('This account has been suspended by platform administration');
      err.statusCode = 403;
      err.code = 'ACCOUNT_SUSPENDED';
      throw err;
    }

    const tokens = this.generateTokens(user);

    return {
      user: inMemoryStore.toSafeUser(user),
      tokens
    };
  }

  /**
   * Refresh access token with Refresh Token Rotation
   */
  public async refreshTokens(providedRefreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(
        providedRefreshToken,
        env.JWT_REFRESH_SECRET
      ) as TokenPayload;

      if (decoded.type !== 'refresh') {
        const err: any = new Error('Invalid token type');
        err.statusCode = 401;
        throw err;
      }

      const storedToken = inMemoryStore.findRefreshToken(providedRefreshToken);

      // Check if token exists, is not revoked, and is not expired
      if (!storedToken || storedToken.revoked || storedToken.expiresAt < Date.now()) {
        const err: any = new Error('Refresh token is invalid or has been revoked');
        err.statusCode = 401;
        err.code = 'TOKEN_REVOKED';
        throw err;
      }

      // Invalidate old token (Rotation)
      inMemoryStore.revokeRefreshToken(providedRefreshToken);

      const user = inMemoryStore.findUserById(decoded.userId);
      if (!user) {
        const err: any = new Error('User no longer exists');
        err.statusCode = 401;
        throw err;
      }

      // Generate new pair
      return this.generateTokens(user);
    } catch (err: any) {
      const error: any = new Error(err.message || 'Invalid refresh token');
      error.statusCode = 401;
      error.code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }
  }

  /**
   * Invalidate session / refresh token
   */
  public async logout(refreshToken?: string, userId?: string): Promise<void> {
    if (refreshToken) {
      inMemoryStore.revokeRefreshToken(refreshToken);
    }
    if (userId) {
      inMemoryStore.revokeAllUserTokens(userId);
    }
  }

  /**
   * Helper to sign access & refresh tokens
   */
  private generateTokens(user: User): AuthTokens {
    const accessPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'access'
    };

    const refreshPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh'
    };

    const accessToken = jwt.sign(accessPayload, env.JWT_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any
    });

    const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any
    });

    // 7 days in milliseconds for refresh token
    const refreshExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    inMemoryStore.saveRefreshToken({
      token: refreshToken,
      userId: user.id,
      createdAt: Date.now(),
      expiresAt: refreshExpiresAt,
      revoked: false
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      tokenType: 'Bearer'
    };
  }
}

export const authService = new AuthService();
