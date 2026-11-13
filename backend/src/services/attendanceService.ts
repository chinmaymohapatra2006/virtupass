import { inMemoryStore } from '../data/inMemoryStore';
import { ticketService } from './ticketService';
import { auditService } from './auditService';
import { AttendanceRecord, ScanResult, Ticket, UserRole } from '../types';

export interface ScanTicketInput {
  organizerId: string;
  userRole: UserRole;
  eventId: string;
  tokenOrPayload: string;
  gateName?: string;
  deviceInfo?: string;
}

export interface ScanValidationResult {
  success: boolean;
  scanResult: ScanResult;
  message: string;
  ticket?: Ticket;
  attendance?: AttendanceRecord;
  attendee?: {
    name: string;
    email: string;
    college?: string;
    studentId?: string;
    cgpa?: number;
    tier: string;
  };
  previousScanAt?: string;
  previousGate?: string;
}

export class AttendanceService {
  /**
   * High-speed atomic gate entry validation.
   * Prevents double-entry in backend memory, rejects invalid signatures, and flags wrong-event passes.
   */
  public async validateAndRecordScan(input: ScanTicketInput): Promise<ScanValidationResult> {
    const { organizerId, userRole, eventId, tokenOrPayload, gateName = 'Main Turnstile', deviceInfo } = input;

    // 1. Validate Target Event
    const event = inMemoryStore.getEventById(eventId);
    if (!event) {
      throw new Error(`Target event '${eventId}' not found`);
    }

    // Role check: Organizers can only scan for their own events. Admins can scan across all events.
    if (userRole === 'ORGANIZER' && event.organizerId !== organizerId) {
      throw new Error('Access denied: You can only validate entry for your own events');
    }

    const raw = (tokenOrPayload || '').trim();
    if (!raw) {
      return {
        success: false,
        scanResult: 'INVALID',
        message: 'No QR payload or ticket token provided'
      };
    }

    // 2. Resolve Ticket
    let ticket: Ticket | undefined;

    if (raw.startsWith('VP:')) {
      // Cryptographic QR payload verification
      const verifyResult = ticketService.verifyQrPayload(raw);
      if (!verifyResult.valid || !verifyResult.ticket) {
        this.recordScanFailure({
          eventId,
          eventTitle: event.title,
          organizerId: event.organizerId,
          scannedBy: organizerId,
          gateName,
          deviceInfo,
          scanResult: 'INVALID',
          reason: `Tampered or invalid QR payload (${verifyResult.reason})`
        });
        return {
          success: false,
          scanResult: 'INVALID',
          message: 'Counterfeit or tampered ticket QR code detected.'
        };
      }
      ticket = verifyResult.ticket;
    } else {
      // Token or Ticket Number fallback
      ticket = inMemoryStore.getTicketByToken(raw);
      if (!ticket) {
        ticket = inMemoryStore.getTicketByNumber(raw);
      }
      if (!ticket) {
        ticket = inMemoryStore.getTicketById(raw);
      }
    }

    if (!ticket) {
      this.recordScanFailure({
        eventId,
        eventTitle: event.title,
        organizerId: event.organizerId,
        scannedBy: organizerId,
        gateName,
        deviceInfo,
        scanResult: 'INVALID',
        reason: 'Ticket not found in platform registry'
      });
      return {
        success: false,
        scanResult: 'INVALID',
        message: 'Ticket not found. This ticket has not been issued by VirtuPass.'
      };
    }

    const booking = inMemoryStore.getBookingById(ticket.bookingId);
    const attendeeUser = inMemoryStore.findUserById(ticket.userId);
    const attendeeName = attendeeUser?.fullName || booking?.userName || 'Attendee';
    const attendeeEmail = attendeeUser?.email || booking?.userEmail || '';

    // 3. Validate Event Matching (Prevent cross-event ticket fraud)
    if (ticket.eventId !== eventId) {
      this.recordScanFailure({
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        bookingId: ticket.bookingId,
        eventId,
        eventTitle: event.title,
        organizerId: event.organizerId,
        attendeeName,
        attendeeEmail,
        ticketCategoryName: ticket.ticketCategoryName,
        scannedBy: organizerId,
        gateName,
        deviceInfo,
        scanResult: 'WRONG_EVENT',
        reason: `Pass belongs to '${ticket.eventTitle}', not '${event.title}'`
      });

      return {
        success: false,
        scanResult: 'WRONG_EVENT',
        ticket,
        message: `Wrong Event! This ticket is issued for "${ticket.eventTitle}". Entry denied.`
      };
    }

    // 4. Validate Revocation Status
    if (ticket.status === 'REVOKED') {
      this.recordScanFailure({
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        bookingId: ticket.bookingId,
        eventId: event.id,
        eventTitle: event.title,
        organizerId: event.organizerId,
        attendeeName,
        attendeeEmail,
        ticketCategoryName: ticket.ticketCategoryName,
        scannedBy: organizerId,
        gateName,
        deviceInfo,
        scanResult: 'REVOKED',
        reason: 'Ticket has been revoked by platform administration'
      });

      return {
        success: false,
        scanResult: 'REVOKED',
        ticket,
        message: 'This pass has been REVOKED by administration and is void.'
      };
    }

    // 5. ATOMIC DUPLICATE SCAN CHECK
    if (ticket.status === 'USED') {
      this.recordScanFailure({
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        bookingId: ticket.bookingId,
        eventId: event.id,
        eventTitle: event.title,
        organizerId: event.organizerId,
        attendeeName,
        attendeeEmail,
        ticketCategoryName: ticket.ticketCategoryName,
        scannedBy: organizerId,
        gateName,
        deviceInfo,
        scanResult: 'DUPLICATE',
        reason: `Pass already admitted at ${ticket.entryCheckpoint} on ${ticket.usedAt}`,
        previousScanAt: ticket.usedAt,
        previousGate: ticket.entryCheckpoint
      });

      return {
        success: false,
        scanResult: 'DUPLICATE',
        ticket,
        previousScanAt: ticket.usedAt,
        previousGate: ticket.entryCheckpoint,
        message: `DUPLICATE SCAN: Pass was already admitted at ${ticket.entryCheckpoint || 'Gate'} (${new Date(ticket.usedAt || '').toLocaleTimeString()}). Entry denied.`
      };
    }

    if (ticket.status !== 'ACTIVE') {
      return {
        success: false,
        scanResult: 'INVALID',
        ticket,
        message: `Ticket is not active (status: ${ticket.status})`
      };
    }

    // 6. ATOMIC SUCCESSFUL ADMISSION
    // Synchronously mutate ticket status to USED to prevent parallel race conditions
    const nowISO = new Date().toISOString();
    ticket.status = 'USED';
    ticket.usedAt = nowISO;
    ticket.entryCheckpoint = gateName;
    inMemoryStore.updateTicket(ticket.id, ticket);

    const record: AttendanceRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      bookingId: ticket.bookingId,
      eventId: event.id,
      eventTitle: event.title,
      organizerId: event.organizerId,
      attendeeName,
      attendeeEmail,
      ticketCategoryName: ticket.ticketCategoryName,
      gateName,
      deviceInfo,
      scanResult: 'ADMITTED',
      scannedAt: nowISO,
      scannedBy: organizerId
    };

    inMemoryStore.saveAttendance(record);

    // Audit Log
    auditService.logAction({
      actorId: organizerId,
      actorRole: userRole,
      action: 'GATE_SCAN_ADMITTED',
      entityType: 'ATTENDANCE',
      entityId: record.id,
      metadata: {
        ticketNumber: ticket.ticketNumber,
        eventTitle: event.title,
        gate: gateName,
        attendee: attendeeName
      }
    });

    return {
      success: true,
      scanResult: 'ADMITTED',
      message: 'Admission verified! Turnstile unlocked.',
      ticket,
      attendance: record,
      attendee: {
        name: attendeeName,
        email: attendeeEmail,
        college: attendeeUser?.collegeName,
        studentId: attendeeUser?.studentId,
        cgpa: attendeeUser?.cgpa,
        tier: ticket.ticketCategoryName
      }
    };
  }

  /**
   * Helper to log scan failures and create attendance audit records
   */
  private recordScanFailure(params: {
    ticketId?: string;
    ticketNumber?: string;
    bookingId?: string;
    eventId: string;
    eventTitle: string;
    organizerId: string;
    attendeeName?: string;
    attendeeEmail?: string;
    ticketCategoryName?: string;
    scannedBy: string;
    gateName: string;
    deviceInfo?: string;
    scanResult: ScanResult;
    reason: string;
    previousScanAt?: string;
    previousGate?: string;
  }): void {
    const record: AttendanceRecord = {
      id: `att-err-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ticketId: params.ticketId || 'UNKNOWN_TICKET',
      ticketNumber: params.ticketNumber || 'UNKNOWN_NUMBER',
      bookingId: params.bookingId || 'UNKNOWN_BOOKING',
      eventId: params.eventId,
      eventTitle: params.eventTitle,
      organizerId: params.organizerId,
      attendeeName: params.attendeeName || 'Unknown Attendee',
      attendeeEmail: params.attendeeEmail || '',
      ticketCategoryName: params.ticketCategoryName || 'General',
      gateName: params.gateName,
      deviceInfo: params.deviceInfo,
      scanResult: params.scanResult,
      scannedAt: new Date().toISOString(),
      scannedBy: params.scannedBy,
      failureReason: params.reason,
      previousScanAt: params.previousScanAt,
      previousGate: params.previousGate
    };

    inMemoryStore.saveAttendance(record);

    auditService.logAction({
      actorId: params.scannedBy,
      actorRole: 'ORGANIZER',
      action: 'GATE_SCAN_REJECTED',
      entityType: 'ATTENDANCE',
      entityId: record.id,
      metadata: {
        reason: params.reason,
        result: params.scanResult,
        ticketNumber: params.ticketNumber,
        gate: params.gateName
      }
    });
  }

  /**
   * Retrieves attendance records scoped to organizer or platform-wide for admin.
   */
  public getAttendance(params: {
    userId: string;
    role: UserRole;
    eventId?: string;
    search?: string;
    scanResult?: ScanResult;
  }): AttendanceRecord[] {
    let records: AttendanceRecord[] = [];

    if (params.role === 'ADMIN') {
      records = params.eventId
        ? inMemoryStore.getAttendanceByEventId(params.eventId)
        : inMemoryStore.getAllAttendance();
    } else {
      // Organizer: scoped strictly to events they own
      records = params.eventId
        ? inMemoryStore.getAttendanceByEventId(params.eventId).filter((a) => a.organizerId === params.userId)
        : inMemoryStore.getAttendanceByOrganizerId(params.userId);
    }

    if (params.scanResult) {
      records = records.filter((r) => r.scanResult === params.scanResult);
    }

    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      records = records.filter(
        (r) =>
          r.ticketNumber.toLowerCase().includes(q) ||
          r.attendeeName.toLowerCase().includes(q) ||
          r.attendeeEmail.toLowerCase().includes(q) ||
          r.eventTitle.toLowerCase().includes(q) ||
          r.gateName.toLowerCase().includes(q)
      );
    }

    return records;
  }

  /**
   * Generates summary attendance statistics.
   */
  public getAttendanceStats(params: { userId: string; role: UserRole; eventId?: string }) {
    const records = this.getAttendance({ userId: params.userId, role: params.role, eventId: params.eventId });
    const admitted = records.filter((r) => r.scanResult === 'ADMITTED').length;
    const duplicates = records.filter((r) => r.scanResult === 'DUPLICATE').length;
    const invalid = records.filter((r) => r.scanResult === 'INVALID' || r.scanResult === 'REVOKED').length;
    const wrongEvent = records.filter((r) => r.scanResult === 'WRONG_EVENT').length;

    return {
      totalScans: records.length,
      admitted,
      duplicates,
      invalid,
      wrongEvent,
      admittedRate: records.length > 0 ? Number(((admitted / records.length) * 100).toFixed(1)) : 0
    };
  }

  /**
   * Generates formatted CSV string for turnstile attendance report.
   */
  public generateAttendanceCsv(params: { userId: string; role: UserRole; eventId?: string }): string {
    const records = this.getAttendance({ userId: params.userId, role: params.role, eventId: params.eventId });

    const headers = [
      'Record ID',
      'Ticket Number',
      'Attendee Name',
      'Attendee Email',
      'Event Title',
      'Pass Tier',
      'Gate Name',
      'Result',
      'Scan Time',
      'Notes'
    ];

    const rows = records.map((r) => [
      `"${r.id}"`,
      `"${r.ticketNumber}"`,
      `"${r.attendeeName.replace(/"/g, '""')}"`,
      `"${r.attendeeEmail}"`,
      `"${r.eventTitle.replace(/"/g, '""')}"`,
      `"${r.ticketCategoryName}"`,
      `"${r.gateName}"`,
      `"${r.scanResult}"`,
      `"${r.scannedAt}"`,
      `"${(r.failureReason || '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  }
}

export const attendanceService = new AttendanceService();
