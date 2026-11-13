import crypto from 'crypto';
import QRCode from 'qrcode';
import { inMemoryStore } from '../data/inMemoryStore';
import { Booking, Ticket } from '../types';
import { env } from '../utils/env';

export class TicketService {
  /**
   * Generates secure digital tickets for a confirmed booking.
   * For quantity N, generates N distinct ticket records with unique cryptographic tokens.
   */
  public async generateTicketsForBooking(booking: Booking): Promise<Ticket[]> {
    const event = inMemoryStore.getEventById(booking.eventId);
    if (!event) {
      throw new Error(`Event '${booking.eventId}' not found for ticket generation`);
    }

    const tickets: Ticket[] = [];
    const nowISO = new Date().toISOString();

    for (let i = 1; i <= booking.quantity; i++) {
      // 1. Cryptographically secure random token (32 bytes = 256 bits of entropy)
      const secureToken = crypto.randomBytes(32).toString('hex');
      const ticketId = `tkt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${i}`;
      
      // Clean display ticket number (e.g., VP-TECH-8942-01)
      const eventCode = event.title.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X');
      const ticketNumber = `VP-${eventCode}-${booking.id.slice(-4).toUpperCase()}-${String(i).padStart(2, '0')}`;

      // 2. Compute opaque HMAC signature of token for tamper-proof gate validation
      // NOTE: QR payload contains ZERO personal, academic, or financial details!
      const signature = crypto
        .createHmac('sha256', env.JWT_SECRET)
        .update(`${ticketId}:${secureToken}`)
        .digest('hex')
        .substring(0, 16);

      const qrPayload = `VP:${ticketId}:${signature}`;

      // 3. Generate high-contrast, scan-optimized QR data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 320,
        color: {
          dark: '#030712', // Near black
          light: '#FFFFFF'  // Pure white for rapid optical contrast
        }
      });

      const ticket: Ticket = {
        id: ticketId,
        ticketNumber,
        bookingId: booking.id,
        eventId: event.id,
        eventTitle: event.title,
        collegeName: event.collegeName,
        venue: event.venue,
        eventDate: event.eventDate,
        startTime: event.startTime,
        endTime: event.endTime,
        bannerUrl: event.bannerUrl,
        userId: booking.userId,
        ticketCategoryId: booking.ticketCategoryId,
        ticketCategoryName: booking.ticketCategoryName,
        ticketIndex: i,
        totalTicketsInBooking: booking.quantity,
        secureToken,
        qrPayload,
        qrCodeDataUrl,
        status: 'ACTIVE',
        issuedAt: nowISO
      };

      inMemoryStore.saveTicket(ticket);
      tickets.push(ticket);
    }

    // Update booking with generated ticket IDs
    inMemoryStore.updateBooking(booking.id, {
      ticketIds: tickets.map((t) => t.id)
    });

    return tickets;
  }

  /**
   * Retrieves all tickets owned by the authenticated student.
   */
  public getTicketsByUserId(userId: string): Ticket[] {
    return inMemoryStore.getTicketsByUserId(userId);
  }

  /**
   * Retrieves single ticket by ID with strict ownership or ADMIN enforcement.
   */
  public getTicketById(ticketId: string, requestingUserId: string, requestingUserRole: string): Ticket {
    const ticket = inMemoryStore.getTicketById(ticketId);
    if (!ticket) {
      throw new Error(`Ticket '${ticketId}' not found`);
    }

    if (requestingUserRole !== 'ADMIN' && ticket.userId !== requestingUserId) {
      throw new Error('Unauthorized access to ticket');
    }

    return ticket;
  }

  /**
   * Generates a printable/downloadable clean ticket slip without sensitive personal data.
   */
  public getTicketDownloadData(ticketId: string, requestingUserId: string, requestingUserRole: string) {
    const ticket = this.getTicketById(ticketId, requestingUserId, requestingUserRole);

    return {
      ticketNumber: ticket.ticketNumber,
      eventTitle: ticket.eventTitle,
      collegeName: ticket.collegeName,
      venue: ticket.venue,
      eventDate: ticket.eventDate,
      time: `${ticket.startTime} - ${ticket.endTime}`,
      tier: ticket.ticketCategoryName,
      passNumber: `${ticket.ticketIndex} of ${ticket.totalTicketsInBooking}`,
      qrCodeDataUrl: ticket.qrCodeDataUrl,
      qrVerificationPayload: ticket.qrPayload,
      issuedAt: ticket.issuedAt,
      securityDisclaimer: 'VirtuPass Cryptographic Gate Pass. Valid only for authorized turnstile admission. Tampering or duplication is strictly prohibited.'
    };
  }

  /**
   * Cryptographically verifies an opaque QR payload ("VP:<ticketId>:<signature>").
   * Returns validation result and the ticket object if signature is authentic.
   */
  public verifyQrPayload(payload: string): { valid: boolean; ticket?: Ticket; reason?: string } {
    if (!payload || typeof payload !== 'string') {
      return { valid: false, reason: 'PAYLOAD_REQUIRED' };
    }

    const trimmed = payload.trim();
    if (!trimmed.startsWith('VP:')) {
      return { valid: false, reason: 'INVALID_PREFIX' };
    }

    const parts = trimmed.split(':');
    if (parts.length !== 3) {
      return { valid: false, reason: 'MALFORMED_PAYLOAD' };
    }

    const [, ticketId, signature] = parts;
    const ticket = inMemoryStore.getTicketById(ticketId);
    if (!ticket) {
      return { valid: false, reason: 'TICKET_NOT_FOUND' };
    }

    const expectedSignature = crypto
      .createHmac('sha256', env.JWT_SECRET)
      .update(`${ticket.id}:${ticket.secureToken}`)
      .digest('hex')
      .substring(0, 16);

    if (signature !== expectedSignature) {
      return { valid: false, reason: 'INVALID_SIGNATURE' };
    }

    return { valid: true, ticket };
  }
}

export const ticketService = new TicketService();