import { inMemoryStore } from '../data/inMemoryStore';
import { mockUniversityService } from './mockUniversityService';
import { env } from '../utils/env';
import {
  VerificationRecord,
  CaptchaChallenge,
  OtpChallenge,
  SafeUser
} from '../types';

export class VerificationService {
  /**
   * Step 1: Initiate academic verification
   * Creates a new verification record and issues a CAPTCHA challenge
   */
  public async startVerification(
    user: SafeUser,
    studentId: string
  ): Promise<{
    verificationId: string;
    state: string;
    captcha: { challengeId: string; question: string };
  }> {
    const normalizedStudentId = studentId.trim().toUpperCase();

    // 1. Generate human-readable CAPTCHA challenge
    const num1 = Math.floor(Math.random() * 20) + 10;
    const num2 = Math.floor(Math.random() * 15) + 3;
    const answer = (num1 + num2).toString();
    const challengeId = `cap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const captchaChallenge: CaptchaChallenge = {
      challengeId,
      userId: user.id,
      question: `Calculate security verification code: ${num1} + ${num2} = ?`,
      answer,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0,
      maxAttempts: 3,
      verified: false
    };

    inMemoryStore.saveCaptcha(captchaChallenge);

    // 2. Create or reset verification record
    const verificationId = `vrf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const verificationRecord: VerificationRecord = {
      id: verificationId,
      userId: user.id,
      studentId: normalizedStudentId,
      state: 'CAPTCHA_PENDING',
      captchaId: challengeId,
      startedAt: new Date().toISOString()
    };

    inMemoryStore.saveVerification(verificationRecord);

    return {
      verificationId,
      state: 'CAPTCHA_PENDING',
      captcha: {
        challengeId,
        question: captchaChallenge.question
      }
    };
  }

  /**
   * Step 2: Validate CAPTCHA and issue OTP challenge
   */
  public async verifyCaptcha(
    userId: string,
    challengeId: string,
    answer: string
  ): Promise<{
    success: boolean;
    verificationState: string;
    otpChallengeId: string;
    devOtpMessage?: string;
  }> {
    const captcha = inMemoryStore.getCaptcha(challengeId);
    if (!captcha || captcha.userId !== userId) {
      const err: any = new Error('Invalid or expired CAPTCHA session');
      err.statusCode = 400;
      err.code = 'INVALID_CAPTCHA_SESSION';
      throw err;
    }

    if (Date.now() > captcha.expiresAt) {
      const err: any = new Error('CAPTCHA challenge has expired. Please refresh.');
      err.statusCode = 400;
      err.code = 'CAPTCHA_EXPIRED';
      throw err;
    }

    if (captcha.attempts >= captcha.maxAttempts) {
      const err: any = new Error('Maximum CAPTCHA attempts exceeded. Please restart verification.');
      err.statusCode = 429;
      err.code = 'CAPTCHA_MAX_ATTEMPTS';
      throw err;
    }

    // Check answer (trimmed)
    if (captcha.answer !== answer.trim()) {
      inMemoryStore.updateCaptcha(challengeId, { attempts: captcha.attempts + 1 });
      const remaining = captcha.maxAttempts - (captcha.attempts + 1);
      const err: any = new Error(`Incorrect CAPTCHA answer. ${remaining} attempts remaining.`);
      err.statusCode = 400;
      err.code = 'INCORRECT_CAPTCHA';
      throw err;
    }

    // Mark CAPTCHA verified
    inMemoryStore.updateCaptcha(challengeId, { verified: true });

    // Advance verification record to OTP_PENDING
    const verification = inMemoryStore.getVerificationByUserId(userId);
    if (!verification) {
      const err: any = new Error('Verification session not found');
      err.statusCode = 404;
      throw err;
    }

    // Generate 6-digit OTP
    const user = inMemoryStore.findUserById(userId);
    const otp = env.NODE_ENV === 'production'
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : '123456'; // Deterministic dev OTP as specified in Prompt 9

    const otpChallengeId = `otp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const otpChallenge: OtpChallenge = {
      challengeId: otpChallengeId,
      userId,
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0,
      maxAttempts: 3,
      verified: false,
      sentToEmail: user?.email || 'registered email'
    };

    inMemoryStore.saveOtp(otpChallenge);

    inMemoryStore.updateVerification(verification.id, {
      state: 'OTP_PENDING',
      otpId: otpChallengeId
    });

    return {
      success: true,
      verificationState: 'OTP_PENDING',
      otpChallengeId,
      devOtpMessage: env.NODE_ENV !== 'production'
        ? `[SIMULATION DEMO] OTP sent to ${otpChallenge.sentToEmail}. Use demo code: ${otp}`
        : undefined
    };
  }

  /**
   * Step 3: Verify OTP code
   */
  public async verifyOtp(
    userId: string,
    challengeId: string,
    enteredOtp: string
  ): Promise<{ success: boolean; verificationState: string }> {
    const otpRecord = inMemoryStore.getOtp(challengeId);
    if (!otpRecord || otpRecord.userId !== userId) {
      const err: any = new Error('Invalid or expired OTP session');
      err.statusCode = 400;
      err.code = 'INVALID_OTP_SESSION';
      throw err;
    }

    if (Date.now() > otpRecord.expiresAt) {
      const err: any = new Error('OTP has expired. Please request a new code.');
      err.statusCode = 400;
      err.code = 'OTP_EXPIRED';
      throw err;
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      const err: any = new Error('Maximum OTP attempts exceeded. Please restart verification.');
      err.statusCode = 429;
      err.code = 'OTP_MAX_ATTEMPTS';
      throw err;
    }

    // Verify OTP value
    if (otpRecord.otp !== enteredOtp.trim()) {
      inMemoryStore.updateOtp(challengeId, { attempts: otpRecord.attempts + 1 });
      const remaining = otpRecord.maxAttempts - (otpRecord.attempts + 1);
      const err: any = new Error(`Incorrect OTP code. ${remaining} attempts remaining.`);
      err.statusCode = 400;
      err.code = 'INCORRECT_OTP';
      throw err;
    }

    // Mark OTP verified
    inMemoryStore.updateOtp(challengeId, { verified: true });

    // Transition state to ACADEMIC_LOOKUP
    const verification = inMemoryStore.getVerificationByUserId(userId);
    if (!verification) {
      const err: any = new Error('Verification session not found');
      err.statusCode = 404;
      throw err;
    }

    inMemoryStore.updateVerification(verification.id, {
      state: 'ACADEMIC_LOOKUP'
    });

    return {
      success: true,
      verificationState: 'ACADEMIC_LOOKUP'
    };
  }

  /**
   * Step 4: Complete verification and retrieve mock university record
   */
  public async completeVerification(userId: string): Promise<{
    success: boolean;
    verificationState: string;
    verifiedCgpa: number;
    verifiedTier: string;
    discountPercentage: number;
    academicSummary: {
      studentId: string;
      studentName: string;
      institution: string;
      department: string;
    };
  }> {
    const verification = inMemoryStore.getVerificationByUserId(userId);
    if (!verification) {
      const err: any = new Error('No active verification session found');
      err.statusCode = 404;
      throw err;
    }

    // Enforce state machine transition: Cannot skip OTP or CAPTCHA
    if (verification.state !== 'ACADEMIC_LOOKUP') {
      const err: any = new Error(
        `Cannot complete verification from current state: '${verification.state}'. Complete CAPTCHA and OTP first.`
      );
      err.statusCode = 400;
      err.code = 'INVALID_STATE_TRANSITION';
      throw err;
    }

    // Look up mock record from MockUniversityService
    const mockRecord = await mockUniversityService.lookupRecord(verification.studentId);
    if (!mockRecord) {
      inMemoryStore.updateVerification(verification.id, {
        state: 'FAILED',
        errorMessage: `Student ID '${verification.studentId}' was not found in the university database.`
      });
      const err: any = new Error(
        `Student ID '${verification.studentId}' not found in supported university records. Try sample IDs (e.g., VIT20260001 to VIT20260005).`
      );
      err.statusCode = 404;
      err.code = 'STUDENT_RECORD_NOT_FOUND';
      throw err;
    }

    if (mockRecord.status !== 'ACTIVE') {
      inMemoryStore.updateVerification(verification.id, {
        state: 'FAILED',
        errorMessage: `Academic record for '${verification.studentId}' is suspended or inactive.`
      });
      const err: any = new Error('Academic record is not active.');
      err.statusCode = 403;
      err.code = 'INACTIVE_ACADEMIC_RECORD';
      throw err;
    }

    // Calculate discount tier
    const discountInfo = mockUniversityService.calculateDiscountTier(mockRecord.cgpa);
    const completedAt = new Date().toISOString();

    // Update verification record
    inMemoryStore.updateVerification(verification.id, {
      state: 'VERIFIED',
      verifiedCgpa: mockRecord.cgpa,
      verifiedTier: discountInfo.tier,
      discountPercentage: discountInfo.percentage,
      academicRecord: mockRecord,
      completedAt
    });

    // Update user record with verified academic identity
    inMemoryStore.updateUser(userId, {
      isVerified: true,
      cgpa: mockRecord.cgpa,
      academicTier: discountInfo.tier,
      collegeName: mockRecord.institution,
      department: mockRecord.department,
      verifiedAt: completedAt
    });

    return {
      success: true,
      verificationState: 'VERIFIED',
      verifiedCgpa: mockRecord.cgpa,
      verifiedTier: discountInfo.tier,
      discountPercentage: discountInfo.percentage,
      academicSummary: {
        studentId: mockRecord.studentId,
        studentName: mockRecord.studentName,
        institution: mockRecord.institution,
        department: mockRecord.department
      }
    };
  }

  /**
   * Get current verification status for a user
   */
  public async getVerificationStatus(userId: string): Promise<VerificationRecord | { state: string }> {
    const verification = inMemoryStore.getVerificationByUserId(userId);
    if (!verification) {
      return { state: 'NOT_STARTED' };
    }
    return verification;
  }

  /**
   * Get verification history for a user
   */
  public async getVerificationHistory(userId: string): Promise<VerificationRecord[]> {
    return inMemoryStore.getVerificationHistory(userId);
  }
}

export const verificationService = new VerificationService();
