import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import { generateTokenPair, verifyToken } from '../utils/jwt';
import { generateMFASecret, verifyMFAToken, generateMFAQRCode } from '../utils/mfa';

const prisma = new PrismaClient();

export interface RegisterUserInput {
  email: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'doctor' | 'nurse' | 'admin' | 'public_health';
}

export interface LoginInput {
  email: string;
  password: string;
  mfaToken?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterUserInput) {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(input.password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: input.email },
          ...(input.phone ? [{ phone: input.phone }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new Error('User with this email or phone already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * Login user and generate tokens
   */
  async login(input: LoginInput) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await comparePassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Check MFA if enabled
    if (user.mfaEnabled) {
      if (!input.mfaToken) {
        return {
          requiresMFA: true,
          userId: user.id,
        };
      }

      if (!user.mfaSecret) {
        throw new Error('MFA is enabled but secret is not configured');
      }

      const isMFAValid = verifyMFAToken(input.mfaToken, user.mfaSecret);
      if (!isMFAValid) {
        throw new Error('Invalid MFA token');
      }
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Calculate expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt,
        deviceId: input.deviceId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      requiresMFA: false,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(input: RefreshTokenInput) {
    // Verify refresh token
    let decoded;
    try {
      decoded = verifyToken(input.refreshToken);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Check if refresh token exists and is not revoked
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: input.refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new Error('Refresh token not found');
    }

    if (storedToken.isRevoked) {
      throw new Error('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new Error('Refresh token has expired');
    }

    // Check if user is still active
    if (!storedToken.user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Revoke old refresh token (rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Generate new token pair
    const tokens = generateTokenPair({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    });

    // Calculate expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store new refresh token
    await prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        token: tokens.refreshToken,
        expiresAt,
        deviceId: input.deviceId || storedToken.deviceId,
        ipAddress: input.ipAddress || storedToken.ipAddress,
        userAgent: input.userAgent || storedToken.userAgent,
      },
    });

    return {
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        firstName: storedToken.user.firstName,
        lastName: storedToken.user.lastName,
        role: storedToken.user.role,
      },
      tokens,
    };
  }

  /**
   * Logout user by revoking refresh token
   */
  async logout(refreshToken: string) {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      throw new Error('Refresh token not found');
    }

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    return { message: 'Logged out successfully' };
  }

  /**
   * Setup MFA for user
   */
  async setupMFA(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.mfaEnabled) {
      throw new Error('MFA is already enabled');
    }

    // Generate MFA secret
    const { secret, otpauthUrl } = generateMFASecret(user.email);

    // Generate QR code
    const qrCode = await generateMFAQRCode(otpauthUrl);

    // Store secret (not enabled yet)
    await prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    return {
      secret,
      qrCode,
    };
  }

  /**
   * Enable MFA after verification
   */
  async enableMFA(userId: string, token: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.mfaEnabled) {
      throw new Error('MFA is already enabled');
    }

    if (!user.mfaSecret) {
      throw new Error('MFA secret not found. Please setup MFA first');
    }

    // Verify token
    const isValid = verifyMFAToken(token, user.mfaSecret);
    if (!isValid) {
      throw new Error('Invalid MFA token');
    }

    // Enable MFA
    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    return { message: 'MFA enabled successfully' };
  }

  /**
   * Disable MFA
   */
  async disableMFA(userId: string, token: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.mfaEnabled) {
      throw new Error('MFA is not enabled');
    }

    if (!user.mfaSecret) {
      throw new Error('MFA secret not found');
    }

    // Verify token
    const isValid = verifyMFAToken(token, user.mfaSecret);
    if (!isValid) {
      throw new Error('Invalid MFA token');
    }

    // Disable MFA
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
      },
    });

    return { message: 'MFA disabled successfully' };
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string) {
    try {
      const decoded = verifyToken(token);
      
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

export const authService = new AuthService();
