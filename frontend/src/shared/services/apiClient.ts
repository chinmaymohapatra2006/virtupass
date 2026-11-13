import {
  ApiResponse,
  AuthTokens,
  Booking,
  BookingQuote,
  Event,
  HealthStatus,
  MockAcademicRecord,
  PaymentRecord,
  SafeUser,
  SystemInfo,
  Ticket,
  VerificationRecord,
  AttendanceRecord,
  AuditLog,
  AdminAnalytics,
  OrganizerAnalytics,
  ScanResult
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export interface EventFilterParams {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  availableOnly?: boolean;
  sortBy?: 'date_asc' | 'date_desc' | 'price_asc' | 'price_desc' | 'featured';
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshTokenVal: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    try {
      this.accessToken = localStorage.getItem('virtupass_access_token');
      this.refreshTokenVal = localStorage.getItem('virtupass_refresh_token');
    } catch {
      // Ignore if localStorage is unavailable
    }
  }

  public setTokens(tokens: AuthTokens | null): void {
    if (tokens) {
      this.accessToken = tokens.accessToken;
      this.refreshTokenVal = tokens.refreshToken;
      try {
        localStorage.setItem('virtupass_access_token', tokens.accessToken);
        localStorage.setItem('virtupass_refresh_token', tokens.refreshToken);
      } catch {}
    } else {
      this.accessToken = null;
      this.refreshTokenVal = null;
      try {
        localStorage.removeItem('virtupass_access_token');
        localStorage.removeItem('virtupass_refresh_token');
      } catch {}
    }
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {})
    };

    if (this.accessToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Handle 401 Unauthorized - attempt token refresh if not already calling auth endpoints
      if (
        response.status === 401 &&
        this.refreshTokenVal &&
        !endpoint.includes('/auth/login') &&
        !endpoint.includes('/auth/refresh')
      ) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryRes = await fetch(url, { ...options, headers });
          const retryJson = (await retryRes.json()) as ApiResponse<T>;
          if (!retryRes.ok || !retryJson.success) {
            throw new Error(retryJson.error?.message || `Request failed with status ${retryRes.status}`);
          }
          return retryJson.data;
        }
      }

      const json = (await response.json()) as ApiResponse<T>;

      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || `Request failed with status ${response.status}`);
      }

      return json.data;
    } catch (err: any) {
      console.warn(`[ApiClient] Request failed for ${url}:`, err.message);
      throw err;
    }
  }

  private async tryRefreshToken(): Promise<boolean> {
    if (!this.refreshTokenVal) return false;
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshTokenVal })
      });
      const json = (await response.json()) as ApiResponse<AuthTokens>;
      if (response.ok && json.success) {
        this.setTokens(json.data);
        return true;
      }
    } catch {
      // Refresh failed
    }
    this.setTokens(null);
    return false;
  }

  // --- AUTHENTICATION APIS ---
  public async login(
    email: string,
    pass: string
  ): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const data = await this.request<{ user: SafeUser; tokens: AuthTokens }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass })
    });
    this.setTokens(data.tokens);
    return data;
  }

  public async registerStudent(payload: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    studentId: string;
    collegeName: string;
    department: string;
    yearOfStudy: number;
  }): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const data = await this.request<{ user: SafeUser; tokens: AuthTokens }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    this.setTokens(data.tokens);
    return data;
  }

  public async registerOrganizer(payload: {
    fullName: string;
    organizationName: string;
    email: string;
    contactNumber: string;
    collegeName?: string;
    password: string;
    confirmPassword: string;
  }): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const data = await this.request<{ user: SafeUser; tokens: AuthTokens }>(
      '/auth/register/organizer',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );
    this.setTokens(data.tokens);
    return data;
  }

  public async getMe(): Promise<SafeUser> {
    return this.request<SafeUser>('/auth/me');
  }

  public async logout(): Promise<void> {
    try {
      if (this.refreshTokenVal) {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshTokenVal })
        });
      }
    } catch {
      // Ignore logout errors
    } finally {
      this.setTokens(null);
    }
  }

  // --- ACADEMIC VERIFICATION APIS ---
  public async startVerification(
    studentId: string,
    institution?: string
  ): Promise<{
    verificationId: string;
    state: string;
    captcha: { challengeId: string; question: string };
  }> {
    return this.request<{
      verificationId: string;
      state: string;
      captcha: { challengeId: string; question: string };
    }>('/verification/start', {
      method: 'POST',
      body: JSON.stringify({ studentId, institution })
    });
  }

  public async verifyCaptcha(
    challengeId: string,
    answer: string
  ): Promise<{
    success: boolean;
    verificationState: string;
    otpChallengeId: string;
    devOtpMessage?: string;
  }> {
    return this.request<{
      success: boolean;
      verificationState: string;
      otpChallengeId: string;
      devOtpMessage?: string;
    }>('/verification/captcha', {
      method: 'POST',
      body: JSON.stringify({ challengeId, answer })
    });
  }

  public async verifyOtp(
    challengeId: string,
    otp: string
  ): Promise<{ success: boolean; verificationState: string }> {
    return this.request<{ success: boolean; verificationState: string }>('/verification/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ challengeId, otp })
    });
  }

  public async completeVerification(): Promise<{
    success: boolean;
    verificationState: string;
    verifiedCgpa: number;
    verifiedTier: string;
    discountPercentage: number;
    academicSummary: any;
  }> {
    return this.request<any>('/verification/complete', {
      method: 'POST'
    });
  }

  public async getVerificationStatus(): Promise<VerificationRecord | { state: string }> {
    return this.request<any>('/verification/status');
  }

  public async getVerificationHistory(): Promise<VerificationRecord[]> {
    return this.request<VerificationRecord[]>('/verification/history');
  }

  public async getSampleUniversityRecords(): Promise<MockAcademicRecord[]> {
    return this.request<MockAcademicRecord[]>('/verification/sample-records');
  }

  // --- HEALTH & SYSTEM APIS ---
  public async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/health');
  }

  public async getSystemInfo(): Promise<SystemInfo> {
    return this.request<SystemInfo>('/system/info');
  }

  public async getSystemStats(): Promise<any> {
    return this.request<any>('/system/info');
  }

  // --- EVENT DISCOVERY APIS ---
  public async getEvents(filters: EventFilterParams = {}): Promise<Event[]> {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.availableOnly) params.append('availableOnly', 'true');
    if (filters.sortBy) params.append('sortBy', filters.sortBy);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<Event[]>(`/events${queryString}`);
  }

  public async getEventById(id: string): Promise<Event> {
    return this.request<Event>(`/events/${id}`);
  }

  // --- BOOKING WORKFLOW APIS ---
  public async createBookingQuote(payload: {
    eventId: string;
    ticketCategoryId: string;
    quantity: number;
  }): Promise<BookingQuote> {
    return this.request<BookingQuote>('/bookings/quote', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async initiateBooking(payload: { quoteId: string }): Promise<Booking> {
    return this.request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async getMyBookings(status?: string): Promise<Booking[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request<Booking[]>(`/bookings/my${query}`);
  }

  public async getBookingById(bookingId: string): Promise<Booking> {
    return this.request<Booking>(`/bookings/${bookingId}`);
  }

  // --- PAYMENT APIS ---
  public async createPayment(payload: {
    bookingId: string;
    paymentMethod: string;
    idempotencyKey: string;
  }): Promise<PaymentRecord> {
    return this.request<PaymentRecord>('/payments/create', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async getPaymentById(paymentId: string): Promise<PaymentRecord> {
    return this.request<PaymentRecord>(`/payments/${paymentId}`);
  }

  public async processPayment(
    paymentId: string,
    outcome: string = 'SUCCESS',
    method?: string
  ): Promise<{
    payment: PaymentRecord;
    booking: Booking;
    tickets: Ticket[];
    message: string;
  }> {
    return this.request<any>(`/payments/${paymentId}/process`, {
      method: 'POST',
      body: JSON.stringify({ outcome, method })
    });
  }

  public async verifyPayment(paymentId: string): Promise<{
    payment: PaymentRecord;
    booking: Booking;
    tickets: Ticket[];
    message: string;
  }> {
    return this.request<any>(`/payments/${paymentId}/verify`, {
      method: 'POST'
    });
  }

  public async cancelPayment(paymentId: string): Promise<PaymentRecord> {
    return this.request<PaymentRecord>(`/payments/${paymentId}/cancel`, {
      method: 'POST'
    });
  }

  public async getMyPayments(): Promise<PaymentRecord[]> {
    return this.request<PaymentRecord[]>('/payments/my');
  }

  // --- TICKET APIS ---
  public async getMyTickets(): Promise<Ticket[]> {
    return this.request<Ticket[]>('/tickets/my');
  }

  public async getTicketById(ticketId: string): Promise<Ticket> {
    return this.request<Ticket>(`/tickets/${ticketId}`);
  }

  public async getTicketQr(ticketId: string): Promise<{
    ticketId: string;
    ticketNumber: string;
    qrPayload: string;
    qrCodeDataUrl: string;
    status: string;
  }> {
    return this.request<any>(`/tickets/${ticketId}/qr`);
  }

  public async downloadTicket(ticketId: string): Promise<any> {
    return this.request<any>(`/tickets/${ticketId}/download`);
  }

  // --- ORGANIZER APIS ---
  public async getOrganizerEvents(): Promise<Event[]> {
    return this.request<Event[]>('/organizer/events');
  }

  public async createOrganizerEvent(payload: any): Promise<Event> {
    return this.request<Event>('/organizer/events', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async submitOrganizerEvent(eventId: string): Promise<Event> {
    return this.request<Event>(`/organizer/events/${eventId}/submit`, {
      method: 'POST'
    });
  }

  public async getOrganizerAnalytics(): Promise<OrganizerAnalytics> {
    return this.request<OrganizerAnalytics>('/organizer/analytics/overview');
  }

  public async getOrganizerBookings(): Promise<Booking[]> {
    return this.request<Booking[]>('/organizer/bookings');
  }

  public async getOrganizerTickets(): Promise<Ticket[]> {
    return this.request<Ticket[]>('/organizer/tickets');
  }

  // --- ATTENDANCE & GATE SCANNER APIS ---
  public async scanGateTicket(payload: {
    tokenOrPayload: string;
    eventId: string;
    gateName?: string;
    deviceInfo?: string;
  }): Promise<{
    scanResult: ScanResult;
    message: string;
    ticket?: Ticket;
    attendance?: AttendanceRecord;
    attendee?: any;
    previousScanAt?: string;
    previousGate?: string;
  }> {
    const url = `${this.baseUrl}/attendance/scan`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const json = await response.json();
    if (response.ok) {
      return json.data;
    }

    // In case of duplicate/invalid/wrong event, return detailed scan object with message
    if (json.data) {
      return json.data;
    }

    throw new Error(json.error?.message || 'Scanning failed');
  }

  public async getAttendance(filters?: {
    eventId?: string;
    search?: string;
    scanResult?: ScanResult;
  }): Promise<AttendanceRecord[]> {
    const params = new URLSearchParams();
    if (filters?.eventId) params.set('eventId', filters.eventId);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.scanResult) params.set('scanResult', filters.scanResult);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<AttendanceRecord[]>(`/attendance${query}`);
  }

  public async getAttendanceStats(eventId?: string): Promise<{
    totalScans: number;
    admitted: number;
    duplicates: number;
    invalid: number;
    wrongEvent: number;
    admittedRate: number;
  }> {
    const query = eventId ? `?eventId=${eventId}` : '';
    return this.request<any>(`/attendance/stats${query}`);
  }

  public getAttendanceExportUrl(eventId?: string): string {
    const query = eventId ? `?eventId=${eventId}` : '';
    return `${this.baseUrl}/attendance/export${query}`;
  }

  // --- ADMIN APIS ---
  public async getAdminAnalytics(): Promise<AdminAnalytics> {
    return this.request<AdminAnalytics>('/admin/analytics/overview');
  }

  public async getAdminEvents(): Promise<Event[]> {
    return this.request<Event[]>('/admin/events');
  }

  public async approveAdminEvent(eventId: string): Promise<Event> {
    return this.request<Event>(`/admin/events/${eventId}/approve`, {
      method: 'POST'
    });
  }

  public async rejectAdminEvent(eventId: string, reason: string): Promise<Event> {
    return this.request<Event>(`/admin/events/${eventId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  public async publishAdminEvent(eventId: string): Promise<Event> {
    return this.request<Event>(`/admin/events/${eventId}/publish`, {
      method: 'POST'
    });
  }

  public async cancelAdminEvent(eventId: string, reason?: string): Promise<Event> {
    return this.request<Event>(`/admin/events/${eventId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  public async getAdminUsers(filters?: { search?: string; role?: string; status?: string }): Promise<SafeUser[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.role) params.set('role', filters.role);
    if (filters?.status) params.set('status', filters.status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<SafeUser[]>(`/admin/users${query}`);
  }

  public async updateUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<SafeUser> {
    return this.request<SafeUser>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  public async getAdminOrganizers(): Promise<SafeUser[]> {
    return this.request<SafeUser[]>('/admin/organizers');
  }

  public async approveOrganizer(organizerId: string): Promise<SafeUser> {
    return this.request<SafeUser>(`/admin/organizers/${organizerId}/approve`, {
      method: 'POST'
    });
  }

  public async rejectOrganizer(organizerId: string, reason?: string): Promise<SafeUser> {
    return this.request<SafeUser>(`/admin/organizers/${organizerId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  public async updateOrganizerStatus(organizerId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<SafeUser> {
    return this.request<SafeUser>(`/admin/organizers/${organizerId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  public async getAdminTickets(filters?: { search?: string; status?: string; eventId?: string }): Promise<Ticket[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.eventId) params.set('eventId', filters.eventId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Ticket[]>(`/admin/tickets${query}`);
  }

  public async revokeAdminTicket(ticketId: string, reason: string): Promise<Ticket> {
    return this.request<Ticket>(`/admin/tickets/${ticketId}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  public async getAdminBookings(): Promise<Booking[]> {
    return this.request<Booking[]>('/admin/bookings');
  }

  public async getAdminSummary(): Promise<any> {
    return this.request<any>('/admin/summary');
  }

  public async getAdminAuditLogs(filters?: {
    action?: string;
    entityType?: string;
    actorId?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (filters?.action) params.set('action', filters.action);
    if (filters?.entityType) params.set('entityType', filters.entityType);
    if (filters?.actorId) params.set('actorId', filters.actorId);
    if (filters?.limit) params.set('limit', filters.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<AuditLog[]>(`/admin/audit${query}`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export { API_BASE_URL };