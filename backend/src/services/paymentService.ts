import { inMemoryStore } from '../data/inMemoryStore';
import { mockPaymentProvider, SimulatedOutcome } from './mockPaymentProvider';
import { ticketService } from './ticketService';
import { Booking, PaymentMethod, PaymentRecord, Ticket } from '../types';

export interface CreatePaymentInput {
  bookingId: string;
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
}

export interface PaymentVerificationResponse {
  payment: PaymentRecord;
  booking: Booking;
  tickets: Ticket[];
  message: string;
}

export class PaymentService {
  /**
   * Initiates a payment session for a held booking in PENDING_PAYMENT status.
   * Enforces backend-authoritative pricing and idempotency key protection.
   */
  public async createPayment(userId: string, input: CreatePaymentInput): Promise<PaymentRecord> {
    const user = inMemoryStore.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'USER') {
      throw new Error('Only student USER accounts can initiate checkout');
    }

    // 1. Idempotency Check: Return existing record if key has already been executed
    if (input.idempotencyKey) {
      const existingPayment = inMemoryStore.getPaymentByIdempotencyKey(input.idempotencyKey);
      if (existingPayment) {
        if (existingPayment.userId !== userId) {
          throw new Error('Idempotency key conflict: key belongs to another account');
        }
        return existingPayment;
      }
    }

    // 2. Refresh inventory holds
    inMemoryStore.sweepExpiredBookings();

    // 3. Retrieve authoritative booking record from backend memory
    const booking = inMemoryStore.getBooking(input.bookingId);
    if (!booking) {
      throw new Error(`Booking '${input.bookingId}' not found`);
    }

    if (booking.userId !== userId) {
      throw new Error('Unauthorized: Booking belongs to a different student');
    }

    if (booking.status === 'CONFIRMED') {
      throw new Error('This booking has already been paid and confirmed');
    }

    if (booking.status === 'EXPIRED' || booking.status === 'CANCELLED') {
      throw new Error('Booking has expired or was cancelled. Please select new passes.');
    }

    if (booking.status !== 'PENDING_PAYMENT' && booking.status !== 'PAYMENT_PROCESSING') {
      throw new Error(`Invalid booking status '${booking.status}' for payment creation`);
    }

    // 4. Validate hold duration
    const holdExpiresTimestamp = new Date(booking.holdExpiresAt).getTime();
    if (Date.now() > holdExpiresTimestamp) {
      // Release inventory immediately
      booking.status = 'EXPIRED';
      inMemoryStore.updateBooking(booking.id, { status: 'EXPIRED' });
      inMemoryStore.releaseTicketCapacity(booking.eventId, booking.ticketCategoryId, booking.quantity);
      throw new Error('The 15-minute reservation hold on these tickets has expired');
    }

    // 5. Authoritative backend currency calculation in integer Paise
    const amountINR = booking.finalAmount;
    const amountPaise = Math.round(booking.finalAmount * 100);

    // 6. Create session with payment provider
    const session = await mockPaymentProvider.createSession({
      amountPaise,
      currency: 'INR',
      orderReference: booking.id,
      customerEmail: user.email,
      metadata: {
        userId,
        bookingId: booking.id,
        eventTitle: booking.eventTitle,
        category: booking.ticketCategoryName,
        quantity: booking.quantity
      }
    });

    const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowISO = new Date().toISOString();

    const paymentRecord: PaymentRecord = {
      paymentId,
      bookingId: booking.id,
      userId,
      provider: 'MOCK_GATEWAY',
      providerTxnRef: session.providerTxnRef,
      amountPaise,
      amountINR,
      currency: 'INR',
      status: 'CREATED',
      paymentMethod: input.paymentMethod,
      idempotencyKey: input.idempotencyKey || `idem-${Date.now()}`,
      checkoutUrl: session.checkoutUrl,
      createdAt: nowISO,
      updatedAt: nowISO
    };

    inMemoryStore.savePayment(paymentRecord);

    // Transition booking to PAYMENT_PROCESSING
    inMemoryStore.updateBooking(booking.id, {
      paymentId,
      status: 'PAYMENT_PROCESSING'
    });

    return paymentRecord;
  }

  /**
   * Simulates processing checkout outcome (for demo / dev mode).
   */
  public async processPayment(
    paymentId: string,
    userId: string,
    outcome: SimulatedOutcome = 'SUCCESS',
    method?: PaymentMethod
  ): Promise<PaymentVerificationResponse> {
    const payment = inMemoryStore.getPaymentById(paymentId);
    if (!payment) {
      throw new Error(`Payment '${paymentId}' not found`);
    }

    if (payment.userId !== userId) {
      throw new Error('Unauthorized access to payment');
    }

    // If already confirmed/successful, return idempotent response
    if (payment.status === 'SUCCESS') {
      const booking = inMemoryStore.getBooking(payment.bookingId)!;
      const tickets = inMemoryStore.getTicketsByBookingId(booking.id);
      return {
        payment,
        booking,
        tickets,
        message: 'Payment already verified and tickets issued'
      };
    }

    // Process on mock provider
    await mockPaymentProvider.processPayment(
      payment.providerTxnRef,
      outcome,
      method || payment.paymentMethod
    );

    if (method) {
      payment.paymentMethod = method;
    }

    // Trigger independent server-side verification
    return this.verifyPayment(paymentId, userId);
  }

  /**
   * Server-authoritative payment verification.
   * Never trusts client status: checks the provider's registered transaction outcome.
   * Only a verified SUCCESS will confirm the booking and generate cryptographically signed QR tickets.
   */
  public async verifyPayment(paymentId: string, userId: string): Promise<PaymentVerificationResponse> {
    const payment = inMemoryStore.getPaymentById(paymentId);
    if (!payment) {
      throw new Error(`Payment '${paymentId}' not found`);
    }

    if (payment.userId !== userId) {
      throw new Error('Unauthorized: Payment belongs to another user');
    }

    const booking = inMemoryStore.getBooking(payment.bookingId);
    if (!booking) {
      throw new Error(`Booking '${payment.bookingId}' associated with payment not found`);
    }

    // Idempotency: If booking is already confirmed, return current tickets safely without reissuing!
    if (booking.status === 'CONFIRMED' && payment.status === 'SUCCESS') {
      const tickets = inMemoryStore.getTicketsByBookingId(booking.id);
      return {
        payment,
        booking,
        tickets,
        message: 'Payment verified: booking confirmed and tickets are active'
      };
    }

    // Query payment gateway server-to-server
    const verifyResult = await mockPaymentProvider.verifyTransaction(
      payment.providerTxnRef,
      payment.amountPaise
    );

    const nowISO = new Date().toISOString();

    if (verifyResult.status === 'SUCCESS') {
      // 1. Mark payment SUCCESS
      const updatedPayment = inMemoryStore.updatePayment(payment.paymentId, {
        status: 'SUCCESS',
        verifiedAt: nowISO,
        failureReason: undefined
      })!;

      // 2. Mark booking CONFIRMED
      const updatedBooking = inMemoryStore.updateBooking(booking.id, {
        status: 'CONFIRMED',
        paymentId: payment.paymentId
      })!;

      // 3. Generate secure digital QR tickets (one unique ticket per quantity)
      const tickets = await ticketService.generateTicketsForBooking(updatedBooking);

      return {
        payment: updatedPayment,
        booking: updatedBooking,
        tickets,
        message: 'Payment successfully processed! Digital QR passes have been generated.'
      };
    } else if (verifyResult.status === 'FAILED') {
      // Mark payment FAILED
      const updatedPayment = inMemoryStore.updatePayment(payment.paymentId, {
        status: 'FAILED',
        failureReason: verifyResult.failureReason || 'Transaction was declined by the bank'
      })!;

      // Mark booking PAYMENT_FAILED and restore inventory
      const updatedBooking = inMemoryStore.updateBooking(booking.id, {
        status: 'PAYMENT_FAILED'
      })!;

      inMemoryStore.releaseTicketCapacity(booking.eventId, booking.ticketCategoryId, booking.quantity);

      return {
        payment: updatedPayment,
        booking: updatedBooking,
        tickets: [],
        message: 'Payment failed. Held ticket allocation has been released.'
      };
    } else if (verifyResult.status === 'CANCELLED') {
      // Mark payment CANCELLED
      const updatedPayment = inMemoryStore.updatePayment(payment.paymentId, {
        status: 'CANCELLED',
        failureReason: verifyResult.failureReason || 'Transaction aborted by customer'
      })!;

      // Mark booking CANCELLED and restore inventory
      const updatedBooking = inMemoryStore.updateBooking(booking.id, {
        status: 'CANCELLED'
      })!;

      inMemoryStore.releaseTicketCapacity(booking.eventId, booking.ticketCategoryId, booking.quantity);

      return {
        payment: updatedPayment,
        booking: updatedBooking,
        tickets: [],
        message: 'Payment cancelled. Held ticket allocation has been released.'
      };
    } else {
      // PENDING
      const updatedPayment = inMemoryStore.updatePayment(payment.paymentId, {
        status: 'PENDING'
      })!;

      return {
        payment: updatedPayment,
        booking,
        tickets: [],
        message: 'Payment is awaiting settlement. Passes will be issued upon gateway confirmation.'
      };
    }
  }

  /**
   * Cancels payment and releases held inventory.
   */
  public async cancelPayment(paymentId: string, userId: string): Promise<PaymentRecord> {
    const payment = inMemoryStore.getPaymentById(paymentId);
    if (!payment) {
      throw new Error(`Payment '${paymentId}' not found`);
    }

    if (payment.userId !== userId) {
      throw new Error('Unauthorized access to payment');
    }

    if (payment.status === 'SUCCESS') {
      throw new Error('Cannot cancel an already completed and confirmed transaction');
    }

    const booking = inMemoryStore.getBooking(payment.bookingId);
    if (booking && booking.status !== 'CONFIRMED') {
      inMemoryStore.updateBooking(booking.id, { status: 'CANCELLED' });
      inMemoryStore.releaseTicketCapacity(booking.eventId, booking.ticketCategoryId, booking.quantity);
    }

    const updated = inMemoryStore.updatePayment(paymentId, {
      status: 'CANCELLED',
      failureReason: 'Cancelled by customer'
    });

    return updated!;
  }

  public getPaymentById(paymentId: string, requestingUserId: string, requestingUserRole: string): PaymentRecord {
    const payment = inMemoryStore.getPaymentById(paymentId);
    if (!payment) {
      throw new Error(`Payment '${paymentId}' not found`);
    }

    if (requestingUserRole !== 'ADMIN' && payment.userId !== requestingUserId) {
      throw new Error('Unauthorized access to payment record');
    }

    return payment;
  }

  public getUserPayments(userId: string): PaymentRecord[] {
    return inMemoryStore.getPaymentsByUserId(userId);
  }
}

export const paymentService = new PaymentService();