export type UserRole = 'USER' | 'ADMIN' | 'ORGANIZER';
export type UserStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED';
export type OrganizerApprovalStatus = 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';

export type VerificationState =
  | 'NOT_STARTED'
  | 'CAPTCHA_PENDING'
  | 'OTP_PENDING'
  | 'ACADEMIC_LOOKUP'
  | 'VERIFIED'
  | 'FAILED'
  | 'EXPIRED';

export type EventCategory =
  | 'Technical'
  | 'Cultural'
  | 'Music'
  | 'Dance'
  | 'Sports'
  | 'Gaming'
  | 'Workshop'
  | 'Seminar'
  | 'Entrepreneurship'
  | 'Other';

export type EventStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'CANCELLED'
  | 'COMPLETED';

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_PROCESSING'
  | 'CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED';

export type PaymentMethod =
  | 'UPI'
  | 'CARD'
  | 'NET_BANKING'
  | 'WALLET';

export type TicketStatus =
  | 'ACTIVE'
  | 'USED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REVOKED';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  
  // Student attributes
  studentId?: string;
  collegeName?: string;
  department?: string;
  yearOfStudy?: number;
  isVerified: boolean;
  cgpa?: number;
  academicTier?: string;
  verifiedAt?: string;

  // Organizer attributes
  organizationName?: string;
  contactNumber?: string;
  approvalStatus?: OrganizerApprovalStatus;

  createdAt: string;
  updatedAt: string;
}

export type SafeUser = Omit<User, 'passwordHash'>;

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface RefreshTokenRecord {
  token: string;
  userId: string;
  expiresAt: number; // timestamp
  createdAt: number;
  revoked: boolean;
}

export interface CaptchaChallenge {
  challengeId: string;
  userId: string;
  question: string;
  answer: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
}

export interface OtpChallenge {
  challengeId: string;
  userId: string;
  otp: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
  sentToEmail: string;
}

export interface MockAcademicRecord {
  studentId: string;
  studentName: string;
  institution: string;
  department: string;
  academicYear: string;
  cgpa: number;
  status: 'ACTIVE' | 'SUSPENDED';
  meritTier: 'Tier 1' | 'Tier 2' | 'Standard';
  discountPercentage: number;
}

export interface VerificationRecord {
  id: string;
  userId: string;
  studentId: string;
  state: VerificationState;
  captchaId?: string;
  otpId?: string;
  verifiedCgpa?: number;
  verifiedTier?: string;
  discountPercentage?: number;
  academicRecord?: MockAcademicRecord;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface TicketCategory {
  id: string;
  name: string;
  description: string;
  basePrice: number; // In INR
  basePricePaise: number; // In Paise (safe integer math)
  totalAllocation: number;
  remainingAllocation: number;
  saleStart: string;
  saleEnd: string;
  isActive: boolean;
}

export interface Event {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: EventCategory;
  organizerId: string;
  organizerName: string;
  collegeName: string;
  venue: string;
  eventDate: string; // ISO string
  startTime: string;
  endTime: string;
  bannerUrl: string;
  ticketSaleStart: string;
  ticketSaleEnd: string;
  status: EventStatus;
  approvalStatus: 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';
  rejectionReason?: string;
  ticketCategories: TicketCategory[];
  totalCapacity: number;
  remainingCapacity: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookingQuote {
  quoteId: string;
  userId: string;
  eventId: string;
  eventTitle: string;
  ticketCategoryId: string;
  ticketCategoryName: string;
  quantity: number;
  baseUnitPrice: number;
  baseUnitPricePaise: number;
  subtotal: number;
  subtotalPaise: number;
  verifiedCgpa?: number;
  isVerifiedStudent: boolean;
  discountPercentage: number;
  discountAmount: number;
  discountAmountPaise: number;
  finalAmount: number;
  finalAmountPaise: number;
  currency: 'INR';
  expiresAt: number; // Timestamp
  createdAt: number;
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  eventId: string;
  eventTitle: string;
  ticketCategoryId: string;
  ticketCategoryName: string;
  quantity: number;
  baseUnitPrice: number;
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  finalAmount: number;
  currency: 'INR';
  quoteId: string;
  status: BookingStatus;
  holdExpiresAt: string; // ISO Timestamp
  paymentId?: string;
  ticketIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  paymentId: string;
  bookingId: string;
  userId: string;
  provider: 'MOCK_GATEWAY' | 'RAZORPAY_SIMULATED';
  providerTxnRef: string;
  amountPaise: number; // In Paise (safe integer math)
  amountINR: number;
  currency: 'INR';
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
  failureReason?: string;
  checkoutUrl?: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string; // E.g. "VP-TN26-8942-01"
  bookingId: string;
  eventId: string;
  eventTitle: string;
  collegeName: string;
  venue: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  bannerUrl: string;
  userId: string;
  ticketCategoryId: string;
  ticketCategoryName: string;
  ticketIndex: number; // 1 of 3
  totalTicketsInBooking: number;
  secureToken: string; // Cryptographic token
  qrPayload: string; // Opaque security token (NO PII/academic data)
  qrCodeDataUrl: string; // Base64 data URL
  status: TicketStatus;
  issuedAt: string;
  usedAt?: string;
  entryCheckpoint?: string;
}

export interface SystemInfo {
  application: string;
  version: string;
  environment: string;
  tagline: string;
  portals: ('user' | 'admin' | 'organizer')[];
  architecture: string;
  timestamp: string;
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptimeSeconds: number;
  service: string;
  version: string;
  memoryUsage: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  };
}

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  college: string;
  cgpa?: number;
  isVerified: boolean;
}

export type ScanResult = 'ADMITTED' | 'DUPLICATE' | 'INVALID' | 'WRONG_EVENT' | 'REVOKED';

export interface AttendanceRecord {
  id: string;
  ticketId: string;
  ticketNumber: string;
  bookingId: string;
  eventId: string;
  eventTitle: string;
  organizerId: string;
  attendeeName: string;
  attendeeEmail: string;
  ticketCategoryName: string;
  gateName: string;
  deviceInfo?: string;
  scanResult: ScanResult;
  scannedAt: string;
  scannedBy: string; // Organizer or Admin ID
  failureReason?: string;
  previousScanAt?: string;
  previousGate?: string;
}

export type AuditAction = 
  | 'USER_SUSPENDED'
  | 'USER_REACTIVATED'
  | 'ORGANIZER_APPROVED'
  | 'ORGANIZER_REJECTED'
  | 'ORGANIZER_SUSPENDED'
  | 'ORGANIZER_REACTIVATED'
  | 'EVENT_SUBMITTED'
  | 'EVENT_APPROVED'
  | 'EVENT_REJECTED'
  | 'EVENT_PUBLISHED'
  | 'EVENT_CANCELLED'
  | 'TICKET_REVOKED'
  | 'GATE_SCAN_ADMITTED'
  | 'GATE_SCAN_REJECTED';

export type AuditEntityType = 'USER' | 'ORGANIZER' | 'EVENT' | 'TICKET' | 'ATTENDANCE' | 'SYSTEM';

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail?: string;
  actorRole: UserRole;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AdminAnalytics {
  totalUsers: number;
  totalStudents: number;
  totalOrganizers: number;
  pendingOrganizerApprovals: number;
  pendingEventApprovals: number;
  totalEvents: number;
  publishedEvents: number;
  totalBookings: number;
  confirmedBookings: number;
  totalTicketsIssued: number;
  totalTicketsUsed: number;
  attendanceRate: number; // Percentage, e.g. 75.5%
  totalRevenuePaise: number;
  totalRevenueINR: number;
  duplicateScanAttempts: number;
}

export interface OrganizerAnalytics {
  organizerId: string;
  totalEvents: number;
  publishedEvents: number;
  totalBookings: number;
  totalTicketsSold: number;
  totalAttendeesAdmitted: number;
  attendanceRate: number;
  totalRevenuePaise: number;
  totalRevenueINR: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: Record<string, unknown>;
}
