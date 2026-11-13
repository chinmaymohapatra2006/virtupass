import React, { useState } from 'react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Card } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { LoadingState } from '../../../shared/components/LoadingState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { EmptyState } from '../../../shared/components/EmptyState';
import { useMyBookings } from '../../../shared/hooks/useApi';
import { PaymentCheckoutModal } from '../../../shared/components/PaymentCheckoutModal';
import { Booking } from '../../../shared/types';
import { Receipt, Clock, ArrowRight, ShieldCheck, CreditCard, QrCode } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import { Link, useNavigate } from 'react-router-dom';

export const UserBookings: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);

  const { data: bookings, isLoading, isError, refetch } = useMyBookings(
    statusFilter === 'ALL' ? undefined : statusFilter
  );

  const filterTabs = ['ALL', 'PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED'];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return <Badge variant="warning" className="flex items-center gap-1"><Clock className="w-3 h-3" /> PENDING PAYMENT</Badge>;
      case 'PAYMENT_PROCESSING':
        return <Badge variant="brand" className="flex items-center gap-1"><Clock className="w-3 h-3" /> PROCESSING</Badge>;
      case 'CONFIRMED':
        return <Badge variant="success">CONFIRMED</Badge>;
      case 'PAYMENT_FAILED':
        return <Badge variant="danger">PAYMENT FAILED</Badge>;
      case 'EXPIRED':
        return <Badge variant="danger">EXPIRED</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral">CANCELLED</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        title="My Bookings & Pass Orders"
        description="Review your active festival pass reservations, hold timers, completed transactions, and CGPA merit savings."
      />

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              statusFilter === tab
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <LoadingState message="Fetching your orders and reservations from VirtuPass store..." />
      ) : isError ? (
        <ErrorState
          title="Could not load bookings"
          message="Ensure your student session is active and the backend server is reachable."
          onRetry={() => refetch()}
        />
      ) : (bookings || []).length === 0 ? (
        <EmptyState
          title="No reservations or orders found"
          description="You haven't reserved any festival passes yet. Browse campus events to unlock verified CGPA discounts."
          actionText="Browse Campus Events"
          onAction={() => window.location.href = '/events'}
        />
      ) : (
        <div className="space-y-4">
          {(bookings || []).map((b) => {
            const isHoldActive =
              (b.status === 'PENDING_PAYMENT' || b.status === 'PAYMENT_PROCESSING') &&
              new Date(b.holdExpiresAt).getTime() > Date.now();

            return (
              <Card key={b.id} variant="default" padding="md" className="border-slate-800 bg-slate-900/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-800 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-800 text-brand-400 shrink-0">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-200">{b.id}</span>
                        {getStatusBadge(b.status)}
                      </div>
                      <span className="text-[11px] text-slate-400">Created: {formatDate(b.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Amount</span>
                    <span className="text-lg font-black text-white block">{formatCurrency(b.finalAmount)}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="md:col-span-2 space-y-2">
                    <h4 className="text-base font-bold text-white">{b.eventTitle}</h4>
                    <p className="text-slate-300 font-medium">
                      Pass Tier: <span className="text-white">{b.ticketCategoryName}</span> ({b.quantity} {b.quantity === 1 ? 'ticket' : 'tickets'})
                    </p>

                    {isHoldActive && (
                      <div className="inline-flex items-center gap-2 text-[11px] text-amber-300 bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-800/40">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>15-min Hold Active until: <strong>{new Date(b.holdExpiresAt).toLocaleTimeString()}</strong></span>
                      </div>
                    )}

                    {b.paymentId && (
                      <p className="text-[11px] text-slate-400 font-mono">
                        Payment Ref: {b.paymentId}
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Base Unit</span>
                      <span>{formatCurrency(b.baseUnitPrice)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal ({b.quantity}x)</span>
                      <span>{formatCurrency(b.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> CGPA Merit Discount ({b.discountPercentage}%)
                      </span>
                      <span>-{formatCurrency(b.discountAmount)}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold pt-1.5 border-t border-slate-800">
                      <span>Final Net</span>
                      <span className="text-emerald-400">{formatCurrency(b.finalAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <span>Quote Reference: <span className="font-mono text-slate-300">{b.quoteId}</span></span>
                  
                  <div className="flex items-center gap-2">
                    {/* Pay Now Button for Pending Payment */}
                    {(b.status === 'PENDING_PAYMENT' || b.status === 'PAYMENT_PROCESSING') && isHoldActive && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500"
                        leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedBookingForPayment(b)}
                      >
                        Pay & Issue Passes
                      </Button>
                    )}

                    {/* View Tickets Button for Confirmed */}
                    {b.status === 'CONFIRMED' && (
                      <Link to="/user/tickets">
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<QrCode className="w-3.5 h-3.5" />}
                        >
                          View QR Passes ({b.quantity})
                        </Button>
                      </Link>
                    )}

                    <Link to={`/events/${b.eventId}`}>
                      <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        Fest Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Payment Checkout Modal */}
      <PaymentCheckoutModal
        isOpen={Boolean(selectedBookingForPayment)}
        onClose={() => setSelectedBookingForPayment(null)}
        booking={selectedBookingForPayment}
        onPaymentSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
};