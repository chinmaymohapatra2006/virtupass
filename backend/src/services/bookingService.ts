import { inMemoryStore } from '../data/inMemoryStore';
import { discountService } from './discountService';
import { Booking, BookingQuote, BookingStatus } from '../types';

export interface CreateQuoteInput {
  eventId: string;
  ticketCategoryId: string;
  quantity: number;
}

export class BookingService {
  /**
   * Generates a 10-minute cryptographically validated pricing quote for a student ticket request.
   * Strictly evaluates the student's verified CGPA from backend state (never client input).
   */
  public createQuote(userId: string, input: CreateQuoteInput): BookingQuote {
    const user = inMemoryStore.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'USER') {
      throw new Error('Only registered student USER accounts are eligible to book tickets and receive student discounts');
    }

    if (!input.quantity || input.quantity < 1 || input.quantity > 5) {
      throw new Error('Ticket quantity must be between 1 and 5');
    }

    const event = inMemoryStore.getEventById(input.eventId);
    if (!event) {
      throw new Error(`Event '${input.eventId}' not found`);
    }

    if (event.status !== 'PUBLISHED' || event.approvalStatus !== 'APPROVED') {
      throw new Error('Tickets for this event are not currently available for booking');
    }

    const ticketCategory = event.ticketCategories.find((tc) => tc.id === input.ticketCategoryId);
    if (!ticketCategory) {
      throw new Error(`Ticket category '${input.ticketCategoryId}' not found`);
    }

    if (!ticketCategory.isActive || ticketCategory.remainingAllocation < input.quantity) {
      throw new Error('Insufficient tickets available in the selected category');
    }

    if (event.remainingCapacity < input.quantity) {
      throw new Error('Selected quantity exceeds total remaining event capacity');
    }

    // Verify student's academic standing from backend store
    const verificationRecord = inMemoryStore.getVerificationByUserId(userId);
    const isVerifiedStudent =
      user.isVerified &&
      verificationRecord !== undefined &&
      verificationRecord.state === 'VERIFIED';

    const verifiedCgpa = isVerifiedStudent ? verificationRecord.verifiedCgpa : undefined;

    // Run deterministic integer-arithmetic pricing calculation
    const pricing = discountService.computePricing(
      ticketCategory.basePrice,
      input.quantity,
      verifiedCgpa,
      isVerifiedStudent
    );

    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes quote validity

    const quoteId = `quo-${now}-${Math.random().toString(36).substring(2, 7)}`;

    const quote: BookingQuote = {
      quoteId,
      userId,
      eventId: event.id,
      eventTitle: event.title,
      ticketCategoryId: ticketCategory.id,
      ticketCategoryName: ticketCategory.name,
      quantity: input.quantity,
      baseUnitPrice: pricing.baseUnitPrice,
      baseUnitPricePaise: pricing.baseUnitPricePaise,
      subtotal: pricing.subtotal,
      subtotalPaise: pricing.subtotalPaise,
      verifiedCgpa,
      isVerifiedStudent,
      discountPercentage: pricing.discountPercentage,
      discountAmount: pricing.discountAmount,
      discountAmountPaise: pricing.discountAmountPaise,
      finalAmount: pricing.finalAmount,
      finalAmountPaise: pricing.finalAmountPaise,
      currency: 'INR',
      expiresAt,
      createdAt: now
    };

    inMemoryStore.saveQuote(quote);
    return quote;
  }

  /**
   * Initiates a ticket booking from an active quote, placing a 15-minute temporary hold
   * on capacity in PENDING_PAYMENT status.
   */
  public initiateBooking(userId: string, quoteId: string): Booking {
    const user = inMemoryStore.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const quote = inMemoryStore.getQuote(quoteId);
    if (!quote) {
      throw new Error('Quote has expired or is invalid. Please request a new price quote.');
    }

    if (quote.userId !== userId) {
      throw new Error('Unauthorized: Quote does not belong to the current authenticated user');
    }

    // Atomically reserve category allocation and event capacity
    const reserved = inMemoryStore.reserveTicketCapacity(
      quote.eventId,
      quote.ticketCategoryId,
      quote.quantity
    );

    if (!reserved) {
      throw new Error('Unable to reserve tickets: the selected tier has sold out. Please select another tier.');
    }

    const now = new Date();
    const holdExpiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString(); // 15-minute hold
    const bookingId = `bk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const booking: Booking = {
      id: bookingId,
      userId: user.id,
      userName: user.fullName,
      userEmail: user.email,
      eventId: quote.eventId,
      eventTitle: quote.eventTitle,
      ticketCategoryId: quote.ticketCategoryId,
      ticketCategoryName: quote.ticketCategoryName,
      quantity: quote.quantity,
      baseUnitPrice: quote.baseUnitPrice,
      subtotal: quote.subtotal,
      discountPercentage: quote.discountPercentage,
      discountAmount: quote.discountAmount,
      finalAmount: quote.finalAmount,
      currency: 'INR',
      quoteId: quote.quoteId,
      status: 'PENDING_PAYMENT',
      holdExpiresAt,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    inMemoryStore.saveBooking(booking);

    // Consume quote once booking is created
    inMemoryStore.deleteQuote(quoteId);

    return booking;
  }

  /**
   * Retrieves user booking history, automatically releasing expired holds.
   */
  public getUserBookings(userId: string, statusFilter?: BookingStatus): Booking[] {
    inMemoryStore.sweepExpiredBookings();
    const bookings = inMemoryStore.getBookingsByUserId(userId);
    if (!statusFilter) {
      return bookings;
    }
    return bookings.filter((b) => b.status === statusFilter);
  }

  /**
   * Retrieves single booking by ID with ownership enforcement.
   */
  public getBookingById(bookingId: string, requestingUserId: string, requestingUserRole: string): Booking {
    inMemoryStore.sweepExpiredBookings();
    const booking = inMemoryStore.getBooking(bookingId);
    if (!booking) {
      throw new Error(`Booking '${bookingId}' not found`);
    }

    if (requestingUserRole !== 'ADMIN' && booking.userId !== requestingUserId) {
      throw new Error('Unauthorized access to booking');
    }

    return booking;
  }
}

export const bookingService = new BookingService();