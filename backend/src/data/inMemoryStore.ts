import bcrypt from 'bcryptjs';
import {
  User,
  SafeUser,
  UserStatus,
  OrganizerApprovalStatus,
  RefreshTokenRecord,
  CaptchaChallenge,
  OtpChallenge,
  VerificationRecord,
  Event,
  BookingQuote,
  Booking,
  PaymentRecord,
  Ticket,
  AttendanceRecord,
  AuditLog,
  AdminAnalytics,
  OrganizerAnalytics
} from '../types';
import { INITIAL_EVENTS } from './mockData';

/**
 * In-Memory Structured Store for VirtuPass Platform
 * 
 * Non-negotiable architectural restriction:
 * No database (No Mongo, Postgres, MySQL, SQLite, Supabase, Prisma, Drizzle).
 * All data lives in structured in-memory memory structures (Maps/Arrays).
 * NOTE: Data resets whenever the backend server restarts.
 */
class InMemoryStore {
  private users: Map<string, User> = new Map();
  private usersByEmail: Map<string, string> = new Map(); // email -> userId
  private usersByStudentId: Map<string, string> = new Map(); // studentId -> userId
  private refreshTokens: Map<string, RefreshTokenRecord> = new Map(); // token -> Record
  private captchas: Map<string, CaptchaChallenge> = new Map();
  private otps: Map<string, OtpChallenge> = new Map();
  private verifications: Map<string, VerificationRecord> = new Map(); // verificationId -> Record
  private userVerifications: Map<string, string> = new Map(); // userId -> verificationId
  private events: Map<string, Event> = new Map();
  private quotes: Map<string, BookingQuote> = new Map(); // quoteId -> BookingQuote
  private bookings: Map<string, Booking> = new Map(); // bookingId -> Booking
  private payments: Map<string, PaymentRecord> = new Map(); // paymentId -> PaymentRecord
  private paymentsByIdempotencyKey: Map<string, string> = new Map(); // idempotencyKey -> paymentId
  private paymentsByBookingId: Map<string, string[]> = new Map(); // bookingId -> paymentIds[]
  private tickets: Map<string, Ticket> = new Map(); // ticketId -> Ticket
  private ticketsByToken: Map<string, string> = new Map(); // secureToken -> ticketId
  private ticketsByNumber: Map<string, string> = new Map(); // ticketNumber -> ticketId
  private ticketsByBookingId: Map<string, string[]> = new Map(); // bookingId -> ticketIds[]
  private ticketsByUserId: Map<string, string[]> = new Map(); // userId -> ticketIds[]
  private attendance: Map<string, AttendanceRecord> = new Map(); // attendanceId -> AttendanceRecord
  private auditLogs: AuditLog[] = [];

  constructor() {
    this.seed();
  }

  private seed(): void {
    // Standard bcrypt salt factor 10 for password hashing
    const demoPasswordHash = bcrypt.hashSync('Demo@123', 10);

    // 1. Seed Student Demo Account
    const studentUser: User = {
      id: 'usr-demo-student',
      email: 'student@virtupass.demo',
      passwordHash: demoPasswordHash,
      fullName: 'Aarav Sharma',
      role: 'USER',
      status: 'ACTIVE',
      studentId: 'VIT20260001',
      collegeName: 'Vellore Institute of Technology',
      department: 'Computer Science & Engineering',
      yearOfStudy: 3,
      isVerified: true,
      cgpa: 9.72,
      academicTier: 'Tier 1',
      verifiedAt: '2026-11-10T10:00:00Z',
      createdAt: '2026-11-01T08:00:00Z',
      updatedAt: '2026-11-10T10:00:00Z'
    };
    this.addUser(studentUser);

    // Seed verification record for student demo
    const studentVerification: VerificationRecord = {
      id: 'vrf-demo-student',
      userId: studentUser.id,
      studentId: 'VIT20260001',
      state: 'VERIFIED',
      verifiedCgpa: 9.72,
      verifiedTier: 'Tier 1',
      discountPercentage: 35,
      academicRecord: {
        studentId: 'VIT20260001',
        studentName: 'Aarav Sharma',
        institution: 'Vellore Institute of Technology',
        department: 'Computer Science & Engineering',
        academicYear: 'Year 3 (2024-2027)',
        cgpa: 9.72,
        status: 'ACTIVE',
        meritTier: 'Tier 1',
        discountPercentage: 35
      },
      startedAt: '2026-11-10T09:55:00Z',
      completedAt: '2026-11-10T10:00:00Z'
    };
    this.saveVerification(studentVerification);

    // 2. Seed Administrator Demo Account
    const adminUser: User = {
      id: 'usr-demo-admin',
      email: 'admin@virtupass.demo',
      passwordHash: demoPasswordHash,
      fullName: 'Priya Sundaram',
      role: 'ADMIN',
      status: 'ACTIVE',
      collegeName: 'VirtuPass Core Platform Team',
      isVerified: true,
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-01T08:00:00Z'
    };
    this.addUser(adminUser);

    // 3. Seed Organizer Demo Account
    const organizerUser: User = {
      id: 'usr-demo-organizer',
      email: 'organizer@virtupass.demo',
      passwordHash: demoPasswordHash,
      fullName: 'Vikramaditya Rao',
      role: 'ORGANIZER',
      status: 'ACTIVE',
      organizationName: 'Spider Tech Club & CSE Dept',
      collegeName: 'National Institute of Technology, Trichy',
      contactNumber: '+91 94444 12345',
      approvalStatus: 'APPROVED',
      isVerified: true,
      createdAt: '2026-10-15T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z'
    };
    this.addUser(organizerUser);

    // 4. Seed Pending Organizer (for Admin moderation queue)
    const pendingOrganizer: User = {
      id: 'usr-demo-org-pending',
      email: 'pending.organizer@virtupass.demo',
      passwordHash: demoPasswordHash,
      fullName: 'Dr. Ananya Sengupta',
      role: 'ORGANIZER',
      status: 'PENDING_APPROVAL',
      organizationName: 'ACM Student Chapter & Robotics Club',
      collegeName: 'BITS Pilani',
      contactNumber: '+91 98765 43210',
      approvalStatus: 'PENDING_APPROVAL',
      isVerified: false,
      createdAt: '2026-11-12T14:30:00Z',
      updatedAt: '2026-11-12T14:30:00Z'
    };
    this.addUser(pendingOrganizer);

    // 5. Seed Suspended Organizer (for Admin moderation)
    const suspendedOrganizer: User = {
      id: 'usr-demo-org-suspended',
      email: 'suspended.organizer@virtupass.demo',
      passwordHash: demoPasswordHash,
      fullName: 'Rahul Deshmukh',
      role: 'ORGANIZER',
      status: 'SUSPENDED',
      organizationName: 'Apex Unofficial Society',
      collegeName: 'Delhi University',
      contactNumber: '+91 91111 22222',
      approvalStatus: 'APPROVED',
      isVerified: false,
      createdAt: '2026-10-20T10:00:00Z',
      updatedAt: '2026-11-05T12:00:00Z'
    };
    this.addUser(suspendedOrganizer);

    // 6. Seed Additional Student Users
    const studentRohan: User = {
      id: 'usr-student-rohan',
      email: 'rohan.verma@vit.ac.in',
      passwordHash: demoPasswordHash,
      fullName: 'Rohan Verma',
      role: 'USER',
      status: 'ACTIVE',
      studentId: 'VIT20260099',
      collegeName: 'Vellore Institute of Technology',
      department: 'Electrical & Electronics',
      yearOfStudy: 4,
      isVerified: true,
      cgpa: 8.92,
      academicTier: 'Tier 2',
      verifiedAt: '2026-11-11T12:00:00Z',
      createdAt: '2026-11-05T09:00:00Z',
      updatedAt: '2026-11-11T12:00:00Z'
    };
    this.addUser(studentRohan);

    const studentSuspended: User = {
      id: 'usr-student-suspended',
      email: 'suspended.student@virtupass.demo',
      passwordHash: demoPasswordHash,
      fullName: 'Karan Mehra',
      role: 'USER',
      status: 'SUSPENDED',
      collegeName: 'IIT Delhi',
      isVerified: false,
      createdAt: '2026-11-02T11:00:00Z',
      updatedAt: '2026-11-08T15:00:00Z'
    };
    this.addUser(studentSuspended);

    // Seed Events
    INITIAL_EVENTS.forEach((event) => {
      this.events.set(event.id, { ...event });
    });

    // Seed a Pending Event waiting for Admin Moderation
    const pendingEvent: Event = {
      id: 'evt-ai-summit-2026',
      title: 'National AI & Quantum Computing Summit 2026',
      shortDescription: 'Cutting-edge talks, quantum algorithm hackathons, and GPU-accelerated computing workshops.',
      fullDescription: 'Three days of immersion into deep neural architectures, quantum teleportation simulation, and edge intelligence. Features distinguished keynote speakers from global AI labs.',
      category: 'Technical',
      organizerId: organizerUser.id,
      organizerName: organizerUser.organizationName || organizerUser.fullName,
      collegeName: organizerUser.collegeName || 'National Institute of Technology, Trichy',
      venue: 'Pragyan Convention Hall & Supercomputer Lab',
      eventDate: '2027-01-20T09:00:00Z',
      startTime: '09:00 AM',
      endTime: '06:00 PM',
      bannerUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      ticketSaleStart: '2026-12-01T00:00:00Z',
      ticketSaleEnd: '2027-01-19T23:59:59Z',
      status: 'PENDING_APPROVAL',
      approvalStatus: 'PENDING_APPROVAL',
      totalCapacity: 500,
      remainingCapacity: 500,
      isFeatured: false,
      createdAt: '2026-11-12T16:00:00Z',
      updatedAt: '2026-11-12T16:00:00Z',
      ticketCategories: [
        {
          id: 'tc-ai-summit-delegate',
          name: 'Delegate Pass',
          description: 'Access to keynotes and paper presentations.',
          basePrice: 599,
          basePricePaise: 59900,
          totalAllocation: 350,
          remainingAllocation: 350,
          saleStart: '2026-12-01T00:00:00Z',
          saleEnd: '2027-01-19T23:59:59Z',
          isActive: true
        },
        {
          id: 'tc-ai-summit-vip',
          name: 'VIP Lab Access Pass',
          description: 'Terminal workstation access and speaker lounge access.',
          basePrice: 1299,
          basePricePaise: 129900,
          totalAllocation: 150,
          remainingAllocation: 150,
          saleStart: '2026-12-01T00:00:00Z',
          saleEnd: '2027-01-19T23:59:59Z',
          isActive: true
        }
      ]
    };
    this.events.set(pendingEvent.id, pendingEvent);

    // Seed Initial Booking for Demo Student (Pending Payment hold)
    const initialBooking: Booking = {
      id: 'bk-demo-seed-001',
      userId: studentUser.id,
      userName: studentUser.fullName,
      userEmail: studentUser.email,
      eventId: 'evt-technova-2026',
      eventTitle: 'TechNova 2026: National Technology & AI Symposium',
      ticketCategoryId: 'tc-tn-general',
      ticketCategoryName: 'Student General Pass',
      quantity: 1,
      baseUnitPrice: 499,
      subtotal: 499,
      discountPercentage: 20,
      discountAmount: 99.8,
      finalAmount: 399.2,
      currency: 'INR',
      quoteId: 'quo-demo-seed-001',
      status: 'PENDING_PAYMENT',
      holdExpiresAt: new Date(Date.now() + 14 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.saveBooking(initialBooking);

    // Seed Initial Audit Logs
    this.auditLogs.push(
      {
        id: 'aud-001',
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        actorRole: 'ADMIN',
        action: 'ORGANIZER_APPROVED',
        entityType: 'ORGANIZER',
        entityId: organizerUser.id,
        timestamp: '2026-10-16T11:20:00Z',
        metadata: { organization: organizerUser.organizationName }
      },
      {
        id: 'aud-002',
        actorId: organizerUser.id,
        actorEmail: organizerUser.email,
        actorRole: 'ORGANIZER',
        action: 'EVENT_SUBMITTED',
        entityType: 'EVENT',
        entityId: 'evt-technova-2026',
        timestamp: '2026-11-01T08:30:00Z',
        metadata: { title: 'TechNova 2026' }
      },
      {
        id: 'aud-003',
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        actorRole: 'ADMIN',
        action: 'EVENT_APPROVED',
        entityType: 'EVENT',
        entityId: 'evt-technova-2026',
        timestamp: '2026-11-01T10:00:00Z',
        metadata: { title: 'TechNova 2026', status: 'PUBLISHED' }
      },
      {
        id: 'aud-004',
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        actorRole: 'ADMIN',
        action: 'USER_SUSPENDED',
        entityType: 'USER',
        entityId: studentSuspended.id,
        timestamp: '2026-11-08T15:00:00Z',
        metadata: { reason: 'Violation of student conduct policy' }
      },
      {
        id: 'aud-005',
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        actorRole: 'ADMIN',
        action: 'ORGANIZER_SUSPENDED',
        entityType: 'ORGANIZER',
        entityId: suspendedOrganizer.id,
        timestamp: '2026-11-05T12:00:00Z',
        metadata: { reason: 'Unverified student society registration' }
      }
    );

    // Seed Sample Attendance Record for TechNova
    const sampleAttendance: AttendanceRecord = {
      id: 'att-seed-001',
      ticketId: 'tkt-seed-sample-01',
      ticketNumber: 'VP-TECH-DEMO-01',
      bookingId: 'bk-seed-sample-01',
      eventId: 'evt-technova-2026',
      eventTitle: 'TechNova 2026: National Technology & AI Symposium',
      organizerId: organizerUser.id,
      attendeeName: 'Rohan Verma',
      attendeeEmail: 'rohan.verma@vit.ac.in',
      ticketCategoryName: 'Student General Pass',
      gateName: 'Turnstile A (Main Gate)',
      deviceInfo: 'Handheld Laser Scanner #04',
      scanResult: 'ADMITTED',
      scannedAt: '2026-11-13T09:15:00Z',
      scannedBy: organizerUser.id
    };
    this.attendance.set(sampleAttendance.id, sampleAttendance);
  }

  // --- USER OPERATIONS ---
  public addUser(user: User): User {
    this.users.set(user.id, user);
    this.usersByEmail.set(user.email.toLowerCase(), user.id);
    if (user.studentId) {
      this.usersByStudentId.set(user.studentId.toUpperCase(), user.id);
    }
    return user;
  }

  public findUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  public findUserByEmail(email: string): User | undefined {
    const id = this.usersByEmail.get(email.toLowerCase());
    return id ? this.users.get(id) : undefined;
  }

  public findUserByStudentId(studentId: string): User | undefined {
    const id = this.usersByStudentId.get(studentId.toUpperCase());
    return id ? this.users.get(id) : undefined;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.users.set(id, updatedUser);

    if (updates.email) {
      this.usersByEmail.delete(user.email.toLowerCase());
      this.usersByEmail.set(updates.email.toLowerCase(), id);
    }
    if (updates.studentId) {
      if (user.studentId) this.usersByStudentId.delete(user.studentId.toUpperCase());
      this.usersByStudentId.set(updates.studentId.toUpperCase(), id);
    }

    return updatedUser;
  }

  public getAllSafeUsers(): SafeUser[] {
    return Array.from(this.users.values()).map(this.toSafeUser);
  }

  public toSafeUser(user: User): SafeUser {
    const { passwordHash, ...safe } = user;
    return safe;
  }

  // --- REFRESH TOKEN OPERATIONS ---
  public saveRefreshToken(record: RefreshTokenRecord): void {
    this.refreshTokens.set(record.token, record);
  }

  public findRefreshToken(token: string): RefreshTokenRecord | undefined {
    return this.refreshTokens.get(token);
  }

  public revokeRefreshToken(token: string): void {
    const record = this.refreshTokens.get(token);
    if (record) {
      record.revoked = true;
      this.refreshTokens.set(token, record);
    }
  }

  public revokeAllUserTokens(userId: string): void {
    for (const [token, record] of this.refreshTokens.entries()) {
      if (record.userId === userId) {
        record.revoked = true;
        this.refreshTokens.set(token, record);
      }
    }
  }

  // --- CAPTCHA CHALLENGES ---
  public saveCaptcha(challenge: CaptchaChallenge): void {
    this.captchas.set(challenge.challengeId, challenge);
  }

  public getCaptcha(challengeId: string): CaptchaChallenge | undefined {
    return this.captchas.get(challengeId);
  }

  public updateCaptcha(challengeId: string, updates: Partial<CaptchaChallenge>): void {
    const existing = this.captchas.get(challengeId);
    if (existing) {
      this.captchas.set(challengeId, { ...existing, ...updates });
    }
  }

  // --- OTP CHALLENGES ---
  public saveOtp(challenge: OtpChallenge): void {
    this.otps.set(challenge.challengeId, challenge);
  }

  public getOtp(challengeId: string): OtpChallenge | undefined {
    return this.otps.get(challengeId);
  }

  public updateOtp(challengeId: string, updates: Partial<OtpChallenge>): void {
    const existing = this.otps.get(challengeId);
    if (existing) {
      this.otps.set(challengeId, { ...existing, ...updates });
    }
  }

  // --- ACADEMIC VERIFICATION RECORDS ---
  public saveVerification(record: VerificationRecord): void {
    this.verifications.set(record.id, record);
    this.userVerifications.set(record.userId, record.id);
  }

  public getVerificationByUserId(userId: string): VerificationRecord | undefined {
    const verificationId = this.userVerifications.get(userId);
    return verificationId ? this.verifications.get(verificationId) : undefined;
  }

  public getVerificationById(id: string): VerificationRecord | undefined {
    return this.verifications.get(id);
  }

  public getVerificationHistory(userId: string): VerificationRecord[] {
    return Array.from(this.verifications.values()).filter((v) => v.userId === userId);
  }

  public updateVerification(id: string, updates: Partial<VerificationRecord>): VerificationRecord | undefined {
    const existing = this.verifications.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.verifications.set(id, updated);
    return updated;
  }

  // --- EVENT OPERATIONS ---
  public getAllEvents(): Event[] {
    return Array.from(this.events.values());
  }

  public getEventById(id: string): Event | undefined {
    return this.events.get(id);
  }

  public getEventsByOrganizer(organizerId: string): Event[] {
    return Array.from(this.events.values()).filter((e) => e.organizerId === organizerId);
  }

  public createEvent(event: Event): Event {
    this.events.set(event.id, event);
    return event;
  }

  public updateEvent(id: string, updates: Partial<Event>): Event | undefined {
    const existing = this.events.get(id);
    if (!existing) return undefined;
    const updated: Event = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.events.set(id, updated);
    return updated;
  }

  public deleteEvent(id: string): boolean {
    return this.events.delete(id);
  }

  // --- ATOMIC CAPACITY & INVENTORY MANAGEMENT ---
  public reserveTicketCapacity(eventId: string, ticketCategoryId: string, quantity: number): boolean {
    const event = this.events.get(eventId);
    if (!event) return false;

    const category = event.ticketCategories.find((tc) => tc.id === ticketCategoryId);
    if (!category) return false;

    if (category.remainingAllocation < quantity || event.remainingCapacity < quantity) {
      return false;
    }

    category.remainingAllocation -= quantity;
    event.remainingCapacity -= quantity;

    if (category.remainingAllocation === 0) {
      category.isActive = false;
    }

    event.updatedAt = new Date().toISOString();
    return true;
  }

  public releaseTicketCapacity(eventId: string, ticketCategoryId: string, quantity: number): void {
    const event = this.events.get(eventId);
    if (!event) return;

    const category = event.ticketCategories.find((tc) => tc.id === ticketCategoryId);
    if (category) {
      category.remainingAllocation = Math.min(category.totalAllocation, category.remainingAllocation + quantity);
      if (category.remainingAllocation > 0) {
        category.isActive = true;
      }
    }

    event.remainingCapacity = Math.min(event.totalCapacity, event.remainingCapacity + quantity);
    event.updatedAt = new Date().toISOString();
  }

  // --- QUOTE OPERATIONS ---
  public saveQuote(quote: BookingQuote): void {
    this.quotes.set(quote.quoteId, quote);
  }

  public getQuote(quoteId: string): BookingQuote | undefined {
    const quote = this.quotes.get(quoteId);
    if (!quote) return undefined;
    // Check if expired
    if (Date.now() > quote.expiresAt) {
      this.quotes.delete(quoteId);
      return undefined;
    }
    return quote;
  }

  public deleteQuote(quoteId: string): void {
    this.quotes.delete(quoteId);
  }

  // --- BOOKING OPERATIONS ---
  public saveBooking(booking: Booking): Booking {
    this.bookings.set(booking.id, booking);
    return booking;
  }

  public getBooking(bookingId: string): Booking | undefined {
    return this.bookings.get(bookingId);
  }

  public getBookingById(bookingId: string): Booking | undefined {
    return this.bookings.get(bookingId);
  }

  public getBookingsByUserId(userId: string): Booking[] {
    return Array.from(this.bookings.values())
      .filter((b) => b.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllBookings(): Booking[] {
    return Array.from(this.bookings.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public updateBooking(bookingId: string, updates: Partial<Booking>): Booking | undefined {
    const existing = this.bookings.get(bookingId);
    if (!existing) return undefined;
    const updated: Booking = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.bookings.set(bookingId, updated);
    return updated;
  }

  public sweepExpiredBookings(): number {
    const now = Date.now();
    let swept = 0;
    for (const booking of this.bookings.values()) {
      if (booking.status === 'PENDING_PAYMENT') {
        const holdExpiry = new Date(booking.holdExpiresAt).getTime();
        if (now > holdExpiry) {
          booking.status = 'EXPIRED';
          booking.updatedAt = new Date().toISOString();
          this.releaseTicketCapacity(booking.eventId, booking.ticketCategoryId, booking.quantity);
          swept++;
        }
      }
    }
    return swept;
  }

  // --- PAYMENT OPERATIONS ---
  public savePayment(payment: PaymentRecord): PaymentRecord {
    this.payments.set(payment.paymentId, payment);
    this.paymentsByIdempotencyKey.set(payment.idempotencyKey, payment.paymentId);
    
    const existingForBooking = this.paymentsByBookingId.get(payment.bookingId) || [];
    if (!existingForBooking.includes(payment.paymentId)) {
      existingForBooking.push(payment.paymentId);
      this.paymentsByBookingId.set(payment.bookingId, existingForBooking);
    }
    return payment;
  }

  public getPaymentById(paymentId: string): PaymentRecord | undefined {
    return this.payments.get(paymentId);
  }

  public getPaymentByIdempotencyKey(key: string): PaymentRecord | undefined {
    const paymentId = this.paymentsByIdempotencyKey.get(key);
    return paymentId ? this.payments.get(paymentId) : undefined;
  }

  public getPaymentsByUserId(userId: string): PaymentRecord[] {
    return Array.from(this.payments.values())
      .filter((p) => p.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getPaymentsByBookingId(bookingId: string): PaymentRecord[] {
    const paymentIds = this.paymentsByBookingId.get(bookingId) || [];
    return paymentIds
      .map((id) => this.payments.get(id))
      .filter((p): p is PaymentRecord => p !== undefined);
  }

  public getAllPayments(): PaymentRecord[] {
    return Array.from(this.payments.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public updatePayment(paymentId: string, updates: Partial<PaymentRecord>): PaymentRecord | undefined {
    const existing = this.payments.get(paymentId);
    if (!existing) return undefined;
    const updated: PaymentRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.payments.set(paymentId, updated);
    return updated;
  }

  // --- TICKET OPERATIONS ---
  public saveTicket(ticket: Ticket): Ticket {
    this.tickets.set(ticket.id, ticket);
    this.ticketsByToken.set(ticket.secureToken, ticket.id);
    this.ticketsByNumber.set(ticket.ticketNumber.toUpperCase(), ticket.id);

    const existingForBooking = this.ticketsByBookingId.get(ticket.bookingId) || [];
    if (!existingForBooking.includes(ticket.id)) {
      existingForBooking.push(ticket.id);
      this.ticketsByBookingId.set(ticket.bookingId, existingForBooking);
    }

    const existingForUser = this.ticketsByUserId.get(ticket.userId) || [];
    if (!existingForUser.includes(ticket.id)) {
      existingForUser.push(ticket.id);
      this.ticketsByUserId.set(ticket.userId, existingForUser);
    }

    return ticket;
  }

  public getTicketById(ticketId: string): Ticket | undefined {
    return this.tickets.get(ticketId);
  }

  public getTicketByToken(secureToken: string): Ticket | undefined {
    const ticketId = this.ticketsByToken.get(secureToken);
    return ticketId ? this.tickets.get(ticketId) : undefined;
  }

  public getTicketByNumber(ticketNumber: string): Ticket | undefined {
    const ticketId = this.ticketsByNumber.get(ticketNumber.toUpperCase().trim());
    return ticketId ? this.tickets.get(ticketId) : undefined;
  }

  public getTicketsByBookingId(bookingId: string): Ticket[] {
    const ticketIds = this.ticketsByBookingId.get(bookingId) || [];
    return ticketIds
      .map((id) => this.tickets.get(id))
      .filter((t): t is Ticket => t !== undefined);
  }

  public getTicketsByUserId(userId: string): Ticket[] {
    const ticketIds = this.ticketsByUserId.get(userId) || [];
    return ticketIds
      .map((id) => this.tickets.get(id))
      .filter((t): t is Ticket => t !== undefined)
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  }

  public getAllTickets(): Ticket[] {
    return Array.from(this.tickets.values()).sort(
      (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
    );
  }

  public updateTicket(ticketId: string, updates: Partial<Ticket>): Ticket | undefined {
    const existing = this.tickets.get(ticketId);
    if (!existing) return undefined;
    const updated: Ticket = {
      ...existing,
      ...updates
    };
    this.tickets.set(ticketId, updated);
    return updated;
  }

  public revokeTicket(ticketId: string, reason: string): Ticket | undefined {
    const existing = this.tickets.get(ticketId);
    if (!existing) return undefined;
    const updated: Ticket = {
      ...existing,
      status: 'REVOKED'
    };
    this.tickets.set(ticketId, updated);
    return updated;
  }

  // --- ATTENDANCE OPERATIONS ---
  public saveAttendance(record: AttendanceRecord): AttendanceRecord {
    this.attendance.set(record.id, record);
    return record;
  }

  public getAttendanceById(id: string): AttendanceRecord | undefined {
    return this.attendance.get(id);
  }

  public getAttendanceByEventId(eventId: string): AttendanceRecord[] {
    return Array.from(this.attendance.values())
      .filter((a) => a.eventId === eventId)
      .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
  }

  public getAttendanceByTicketId(ticketId: string): AttendanceRecord[] {
    return Array.from(this.attendance.values())
      .filter((a) => a.ticketId === ticketId)
      .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
  }

  public getAttendanceByOrganizerId(organizerId: string): AttendanceRecord[] {
    return Array.from(this.attendance.values())
      .filter((a) => a.organizerId === organizerId)
      .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
  }

  public getAllAttendance(): AttendanceRecord[] {
    return Array.from(this.attendance.values()).sort(
      (a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
    );
  }

  // --- AUDIT LOG OPERATIONS ---
  public addAuditLog(log: AuditLog): AuditLog {
    this.auditLogs.unshift(log); // Most recent first
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop(); // Cap memory growth
    }
    return log;
  }

  public getAuditLogs(
    filter?: { action?: string; entityType?: string; actorId?: string },
    limit: number = 50
  ): AuditLog[] {
    let logs = this.auditLogs;
    if (filter) {
      if (filter.action) {
        logs = logs.filter((l) => l.action === filter.action);
      }
      if (filter.entityType) {
        logs = logs.filter((l) => l.entityType === filter.entityType);
      }
      if (filter.actorId) {
        logs = logs.filter((l) => l.actorId === filter.actorId);
      }
    }
    return logs.slice(0, limit);
  }

  // --- USER & ORGANIZER MANAGEMENT ---
  public getAllUsers(query?: { search?: string; role?: string; status?: string }): SafeUser[] {
    let users = Array.from(this.users.values());
    if (query?.role) {
      users = users.filter((u) => u.role === query.role);
    }
    if (query?.status) {
      users = users.filter((u) => u.status === query.status);
    }
    if (query?.search && query.search.trim()) {
      const q = query.search.toLowerCase().trim();
      users = users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.collegeName && u.collegeName.toLowerCase().includes(q)) ||
          (u.studentId && u.studentId.toLowerCase().includes(q)) ||
          (u.organizationName && u.organizationName.toLowerCase().includes(q))
      );
    }
    return users.map(this.toSafeUser);
  }

  public getAllOrganizers(): SafeUser[] {
    return Array.from(this.users.values())
      .filter((u) => u.role === 'ORGANIZER')
      .map(this.toSafeUser);
  }

  public updateUserStatus(userId: string, status: UserStatus): SafeUser | undefined {
    const user = this.users.get(userId);
    if (!user) return undefined;
    user.status = status;
    user.updatedAt = new Date().toISOString();
    this.users.set(userId, user);

    // If suspended, invalidate all refresh tokens immediately
    if (status === 'SUSPENDED') {
      this.revokeAllUserTokens(userId);
    }

    return this.toSafeUser(user);
  }

  public updateOrganizerApproval(
    userId: string,
    status: OrganizerApprovalStatus,
    rejectionReason?: string
  ): SafeUser | undefined {
    const user = this.users.get(userId);
    if (!user || user.role !== 'ORGANIZER') return undefined;

    user.approvalStatus = status;
    user.updatedAt = new Date().toISOString();
    this.users.set(userId, user);

    return this.toSafeUser(user);
  }

  // --- ANALYTICS ENGINES ---
  public getAdminAnalytics(): AdminAnalytics {
    const allUsers = Array.from(this.users.values());
    const students = allUsers.filter((u) => u.role === 'USER');
    const organizers = allUsers.filter((u) => u.role === 'ORGANIZER');
    const pendingOrgApprovals = organizers.filter((o) => o.approvalStatus === 'PENDING_APPROVAL').length;
    const allEvents = Array.from(this.events.values());
    const pendingEventApprovals = allEvents.filter((e) => e.status === 'PENDING_APPROVAL').length;
    const publishedEvents = allEvents.filter((e) => e.status === 'PUBLISHED').length;

    const allBookings = Array.from(this.bookings.values());
    const confirmedBookings = allBookings.filter((b) => b.status === 'CONFIRMED');

    const allPayments = Array.from(this.payments.values());
    const successfulPayments = allPayments.filter((p) => p.status === 'SUCCESS');
    const totalRevenuePaise = successfulPayments.reduce((acc, p) => acc + p.amountPaise, 0);
    const totalRevenueINR = totalRevenuePaise / 100;

    const allTickets = Array.from(this.tickets.values());
    const usedTickets = allTickets.filter((t) => t.status === 'USED');

    const allAtt = Array.from(this.attendance.values());
    const duplicateScans = allAtt.filter((a) => a.scanResult === 'DUPLICATE').length;

    const attendanceRate = allTickets.length > 0 
      ? Number(((usedTickets.length / allTickets.length) * 100).toFixed(1))
      : 0;

    return {
      totalUsers: allUsers.length,
      totalStudents: students.length,
      totalOrganizers: organizers.length,
      pendingOrganizerApprovals: pendingOrgApprovals,
      pendingEventApprovals: pendingEventApprovals,
      totalEvents: allEvents.length,
      publishedEvents,
      totalBookings: allBookings.length,
      confirmedBookings: confirmedBookings.length,
      totalTicketsIssued: allTickets.length,
      totalTicketsUsed: usedTickets.length,
      attendanceRate,
      totalRevenuePaise,
      totalRevenueINR,
      duplicateScanAttempts: duplicateScans
    };
  }

  public getOrganizerAnalytics(organizerId: string): OrganizerAnalytics {
    const organizerEvents = Array.from(this.events.values()).filter((e) => e.organizerId === organizerId);
    const eventIds = new Set(organizerEvents.map((e) => e.id));
    const publishedEvents = organizerEvents.filter((e) => e.status === 'PUBLISHED').length;

    const organizerBookings = Array.from(this.bookings.values()).filter((b) => eventIds.has(b.eventId));
    const confirmedBookings = organizerBookings.filter((b) => b.status === 'CONFIRMED');

    // Revenue from confirmed payments for organizer's events
    const confirmedBookingIds = new Set(confirmedBookings.map((b) => b.id));
    const organizerPayments = Array.from(this.payments.values()).filter(
      (p) => confirmedBookingIds.has(p.bookingId) && p.status === 'SUCCESS'
    );
    const totalRevenuePaise = organizerPayments.reduce((acc, p) => acc + p.amountPaise, 0);
    const totalRevenueINR = totalRevenuePaise / 100;

    const organizerTickets = Array.from(this.tickets.values()).filter((t) => eventIds.has(t.eventId));
    const admittedAttendance = Array.from(this.attendance.values()).filter(
      (a) => eventIds.has(a.eventId) && a.scanResult === 'ADMITTED'
    );

    const attendanceRate = organizerTickets.length > 0
      ? Number(((admittedAttendance.length / organizerTickets.length) * 100).toFixed(1))
      : 0;

    return {
      organizerId,
      totalEvents: organizerEvents.length,
      publishedEvents,
      totalBookings: organizerBookings.length,
      totalTicketsSold: organizerTickets.length,
      totalAttendeesAdmitted: admittedAttendance.length,
      attendanceRate,
      totalRevenuePaise,
      totalRevenueINR
    };
  }

  // --- SYSTEM STATS ---
  public getSystemStats() {
    const allUsers = Array.from(this.users.values());
    const students = allUsers.filter((u) => u.role === 'USER');
    const organizers = allUsers.filter((u) => u.role === 'ORGANIZER');
    const verifiedStudents = students.filter((s) => s.isVerified);

    return {
      totalRegisteredUsers: students.length + 4820,
      totalOrganizers: organizers.length + 64,
      totalVerifiedStudents: verifiedStudents.length + 3840,
      totalEvents: this.events.size,
      totalTicketsSold: 14290,
      pendingApprovals: organizers.filter((o) => o.approvalStatus === 'PENDING_APPROVAL').length + 7,
      totalRevenueINR: 1845000,
      isDatabaseActive: false,
      storageEngine: 'In-Memory Structured Store (Volatile)'
    };
  }
}

export const inMemoryStore = new InMemoryStore();
