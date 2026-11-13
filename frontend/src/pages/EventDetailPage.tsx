import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEventDetail } from '../shared/hooks/useApi';
import { useAuth } from '../shared/hooks/useAuth';
import { apiClient } from '../shared/services/apiClient';
import { LoadingState } from '../shared/components/LoadingState';
import { ErrorState } from '../shared/components/ErrorState';
import { Card } from '../shared/components/Card';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { Modal } from '../shared/components/Modal';
import {
  Calendar,
  MapPin,
  Users,
  Tag,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { formatCurrency, formatDate } from '../shared/utils/formatters';
import { Booking, BookingQuote, TicketCategory } from '../shared/types';
import { PaymentCheckoutModal } from '../shared/components/PaymentCheckoutModal';

export const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: event, isLoading, isError, refetch } = useEventDetail(eventId || '');

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Quote & Booking flow state
  const [isQuoting, setIsQuoting] = useState<boolean>(false);
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState<boolean>(false);
  const [quoteSecondsLeft, setQuoteSecondsLeft] = useState<number>(600);

  // Booking initiation state
  const [isReserving, setIsReserving] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

  // Auto-select first available category when event loads
  useEffect(() => {
    if (event?.ticketCategories && event.ticketCategories.length > 0 && !selectedCategoryId) {
      const firstAvailable = event.ticketCategories.find((c) => c.remainingAllocation > 0);
      if (firstAvailable) {
        setSelectedCategoryId(firstAvailable.id);
      }
    }
  }, [event, selectedCategoryId]);

  // Quote expiration countdown timer
  useEffect(() => {
    if (!quote || !isQuoteModalOpen) return;

    const interval = setInterval(() => {
      const remainingMs = quote.expiresAt - Date.now();
      if (remainingMs <= 0) {
        setQuoteSecondsLeft(0);
        clearInterval(interval);
      } else {
        setQuoteSecondsLeft(Math.floor(remainingMs / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quote, isQuoteModalOpen]);

  if (isLoading) {
    return <div className="py-24"><LoadingState message="Loading event details..." /></div>;
  }

  if (isError || !event) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4">
        <ErrorState
          title="Event Not Found"
          message={`We could not locate event with ID "${eventId}".`}
          onRetry={() => refetch()}
        />
        <div className="text-center mt-6">
          <Link to="/events">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const selectedCategory: TicketCategory | undefined = event.ticketCategories.find(
    (c) => c.id === selectedCategoryId
  );

  // Live estimated discount calculation for student preview
  const studentCgpa = user?.cgpa;
  const isVerifiedStudent = user?.role === 'USER' && user?.isVerified;
  let estimatedDiscountPct = 0;
  if (isVerifiedStudent && studentCgpa !== undefined) {
    if (studentCgpa > 9.5) estimatedDiscountPct = 20;
    else if (studentCgpa > 9.0) estimatedDiscountPct = 15;
    else if (studentCgpa > 8.5) estimatedDiscountPct = 10;
  }

  const baseUnitPrice = selectedCategory ? selectedCategory.basePrice : 0;
  const estimatedSubtotal = baseUnitPrice * quantity;
  const estimatedDiscountAmount = Math.round((estimatedSubtotal * estimatedDiscountPct) / 100);
  const estimatedFinalAmount = estimatedSubtotal - estimatedDiscountAmount;

  // Handle Quote Request
  const handleRequestQuote = async () => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(`/events/${event.id}`));
      return;
    }

    if (user.role !== 'USER') {
      setQuoteError('Only registered student accounts can generate booking quotes and reserve festival passes.');
      return;
    }

    if (!selectedCategory) {
      setQuoteError('Please select a ticket tier');
      return;
    }

    setIsQuoting(true);
    setQuoteError(null);
    setConfirmedBooking(null);
    setBookingError(null);

    try {
      const generatedQuote = await apiClient.createBookingQuote({
        eventId: event.id,
        ticketCategoryId: selectedCategory.id,
        quantity
      });
      setQuote(generatedQuote);
      setQuoteSecondsLeft(Math.floor((generatedQuote.expiresAt - Date.now()) / 1000));
      setIsQuoteModalOpen(true);
    } catch (err: any) {
      setQuoteError(err.message || 'Failed to generate official booking quote');
    } finally {
      setIsQuoting(false);
    }
  };

  // Handle Booking Confirmation
  const handleConfirmReservation = async () => {
    if (!quote) return;

    setIsReserving(true);
    setBookingError(null);

    try {
      const booking = await apiClient.initiateBooking({
        quoteId: quote.quoteId
      });
      setConfirmedBooking(booking);
      refetch(); // Refresh event inventory
    } catch (err: any) {
      setBookingError(err.message || 'Failed to confirm reservation hold');
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <Link
        to="/events"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Explore Events
      </Link>

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 h-80 shadow-2xl">
        <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-black/30" />

        <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="brand">{event.category}</Badge>
              <Badge variant="neutral">{event.collegeName}</Badge>
              {event.isFeatured && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Featured Festival
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">{event.title}</h1>
            <p className="text-sm text-slate-300 mt-1.5 max-w-2xl">{event.shortDescription}</p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Event Details & Academic Rules */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="default" padding="lg">
            <h3 className="text-lg font-bold text-white mb-3">Event Overview</h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {event.fullDescription}
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold uppercase text-[10px] block">Date & Schedule</span>
                <span className="font-bold text-white text-sm block">{formatDate(event.eventDate)}</span>
                <span className="text-slate-400">{event.startTime} - {event.endTime}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold uppercase text-[10px] block">Campus Venue</span>
                <span className="font-bold text-white text-sm block">{event.venue}</span>
                <span className="text-slate-400">Organized by {event.organizerName}</span>
              </div>
            </div>
          </Card>

          {/* Centralized CGPA Policy Card */}
          <Card variant="glass" padding="md" className="border-brand-500/30">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-brand-500/20 text-brand-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-bold text-white">Centralized Academic Merit Advantage</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  VirtuPass automatically connects with your institutional academic record to apply progressive merit discounts:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
                    <span className="text-emerald-400 font-bold block text-sm">20% OFF</span>
                    <span className="text-slate-400">CGPA &gt; 9.50</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
                    <span className="text-teal-400 font-bold block text-sm">15% OFF</span>
                    <span className="text-slate-400">CGPA 9.01 - 9.50</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
                    <span className="text-cyan-400 font-bold block text-sm">10% OFF</span>
                    <span className="text-slate-400">CGPA 8.51 - 9.00</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
                    <span className="text-slate-400 font-bold block text-sm">Standard</span>
                    <span className="text-slate-500">CGPA ≤ 8.50</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Pass Selection & Booking Card */}
        <div className="space-y-6">
          <Card variant="glass" padding="lg" className="border-slate-800 sticky top-24">
            <h3 className="text-base font-bold text-white mb-4">Select Festival Passes</h3>

            {/* Ticket Tier Cards */}
            <div className="space-y-3">
              {event.ticketCategories.map((category) => {
                const isSoldOut = category.remainingAllocation <= 0;
                const isSelected = selectedCategoryId === category.id;

                return (
                  <div
                    key={category.id}
                    onClick={() => !isSoldOut && setSelectedCategoryId(category.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSoldOut
                        ? 'opacity-50 cursor-not-allowed bg-slate-950/40 border-slate-800'
                        : isSelected
                        ? 'bg-brand-600/15 border-brand-500 ring-1 ring-brand-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-white">{category.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{category.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-base text-white">
                          {formatCurrency(category.basePrice)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className={category.remainingAllocation < 30 ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                        {isSoldOut ? 'Sold out' : `${category.remainingAllocation} passes remaining`}
                      </span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Tag className="w-3 h-3" /> CGPA Eligible
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quantity Selector */}
            {selectedCategory && (
              <div className="mt-5 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Quantity (Max 5)</span>
                  <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer font-bold px-1"
                    >
                      -
                    </button>
                    <span className="text-sm font-bold text-white px-2">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(5, Math.min(selectedCategory.remainingAllocation, q + 1)))}
                      disabled={quantity >= 5 || quantity >= selectedCategory.remainingAllocation}
                      className="text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer font-bold px-1"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Student Verification & Discount Indicator */}
            <div className="mt-5 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Academic Standing:</span>
                {user ? (
                  isVerifiedStudent ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified (CGPA {studentCgpa?.toFixed(2)})
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold">Unverified (0% Discount)</span>
                  )
                ) : (
                  <span className="text-slate-500">Not Logged In</span>
                )}
              </div>

              {/* Price Breakdown Preview */}
              <div className="pt-2 border-t border-slate-800 space-y-1 text-slate-300">
                <div className="flex justify-between text-xs">
                  <span>Subtotal ({quantity} {quantity === 1 ? 'pass' : 'passes'})</span>
                  <span>{formatCurrency(estimatedSubtotal)}</span>
                </div>
                {estimatedDiscountPct > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400 font-medium">
                    <span>Merit Discount ({estimatedDiscountPct}%)</span>
                    <span>-{formatCurrency(estimatedDiscountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-slate-800/80">
                  <span>Estimated Total</span>
                  <span className="text-emerald-400">{formatCurrency(estimatedFinalAmount)}</span>
                </div>
              </div>

              {/* Unverified prompt */}
              {user && !isVerifiedStudent && (
                <div className="mt-2 text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-800/40">
                  Verify your university student ID to unlock up to 20% discount on this booking.{' '}
                  <Link to="/user/verification" className="underline font-semibold hover:text-white">
                    Verify Now
                  </Link>
                </div>
              )}
            </div>

            {quoteError && (
              <div className="mt-4 p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{quoteError}</span>
              </div>
            )}

            {/* Action Button */}
            <div className="mt-5">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isQuoting}
                disabled={!selectedCategory || selectedCategory.remainingAllocation <= 0}
                onClick={handleRequestQuote}
              >
                {user ? 'Get Price Quote & Reserve Pass' : 'Sign In to Reserve Pass'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Quote Confirmation Modal */}
      <Modal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        title={confirmedBooking ? "Pass Reserved Successfully!" : "Review & Lock Booking Quote"}
        maxWidth="md"
      >
        {confirmedBooking ? (
          <div className="space-y-5 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">Temporary Pass Reservation Confirmed</h3>
              <p className="text-xs text-slate-400 mt-1">
                Booking ID: <strong className="text-slate-200 font-mono">{confirmedBooking.id}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <Badge variant="warning">{confirmedBooking.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pass Category:</span>
                <span className="text-white font-semibold">{confirmedBooking.ticketCategoryName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Quantity:</span>
                <span className="text-white font-semibold">{confirmedBooking.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Final Total:</span>
                <span className="text-emerald-400 font-black text-sm">{formatCurrency(confirmedBooking.finalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hold Expires:</span>
                <span className="text-amber-400 font-medium">{formatDate(confirmedBooking.holdExpiresAt)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-brand-950/50 border border-brand-500/30 text-[11px] text-brand-300 text-left">
              <strong>15-Minute Reservation Active:</strong> Your ticket capacity is held in <code>PENDING_PAYMENT</code> status. Proceed to simulated checkout to complete payment and issue dynamic QR entry passes.
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:flex-1"
                onClick={() => {
                  setIsQuoteModalOpen(false);
                  navigate('/user/bookings');
                }}
              >
                View in Bookings
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-500"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => {
                  setIsQuoteModalOpen(false);
                  setIsPaymentModalOpen(true);
                }}
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        ) : quote ? (
          <div className="space-y-5">
            {/* Countdown validity banner */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-400" /> Quote Validity:
              </span>
              <span className={`font-mono font-bold ${quoteSecondsLeft < 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                {Math.floor(quoteSecondsLeft / 60)}m {quoteSecondsLeft % 60}s
              </span>
            </div>

            {/* Official Quote Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Quote ID</span>
                <span className="font-mono text-slate-200">{quote.quoteId}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Pass Category</span>
                <span className="text-white font-medium">{quote.ticketCategoryName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Quantity</span>
                <span className="text-white font-medium">{quote.quantity}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Base Unit Price</span>
                <span className="text-white">{formatCurrency(quote.baseUnitPrice)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="text-white">{formatCurrency(quote.subtotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-medium">
                <span>Academic Merit Discount ({quote.discountPercentage}%)</span>
                <span>-{formatCurrency(quote.discountAmount)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                <span className="font-black text-white">Final Amount Payable</span>
                <span className="font-black text-emerald-400 text-lg">{formatCurrency(quote.finalAmount)}</span>
              </div>
            </div>

            {bookingError && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-300">
                {bookingError}
              </div>
            )}

            <div className="text-[11px] text-slate-400">
              Confirming locks this price and reserves ticket capacity with a <strong>15-minute temporary hold</strong> in <code>PENDING_PAYMENT</code> status.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => setIsQuoteModalOpen(false)}
                disabled={isReserving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                isLoading={isReserving}
                disabled={quoteSecondsLeft <= 0}
                onClick={handleConfirmReservation}
              >
                Confirm & Reserve Pass
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
      {/* Payment Checkout Modal */}
      <PaymentCheckoutModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        booking={confirmedBooking}
        onPaymentSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
};