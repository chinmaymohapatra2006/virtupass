import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { apiClient } from '../services/apiClient';
import { formatCurrency } from '../utils/formatters';
import { Booking, PaymentMethod, PaymentRecord, Ticket } from '../types';
import {
  CreditCard,
  Smartphone,
  Building,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onPaymentSuccess?: (result: { payment: PaymentRecord; booking: Booking; tickets: Ticket[] }) => void;
}

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  isOpen,
  onClose,
  booking,
  onPaymentSuccess
}) => {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('UPI');
  const [testOutcome, setTestOutcome] = useState<'SUCCESS' | 'FAILED' | 'CANCELLED' | 'PENDING'>('SUCCESS');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    payment: PaymentRecord;
    booking: Booking;
    tickets: Ticket[];
  } | null>(null);

  if (!booking) return null;

  const paymentMethods: { id: PaymentMethod; name: string; subtitle: string; icon: any }[] = [
    { id: 'UPI', name: 'Instant UPI', subtitle: 'Google Pay, PhonePe, Paytm, BHIM', icon: Smartphone },
    { id: 'CARD', name: 'Debit / Credit Card', subtitle: 'Visa, Mastercard, RuPay', icon: CreditCard },
    { id: 'NET_BANKING', name: 'Net Banking', subtitle: 'All Major Indian Banks', icon: Building },
    { id: 'WALLET', name: 'Digital Wallet', subtitle: 'Paytm, Amazon Pay, Mobikwik', icon: Wallet }
  ];

  const handlePay = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Create payment session on backend with idempotency key
      const idempotencyKey = `idem-${booking.id}-${Date.now()}`;
      const paymentRecord = await apiClient.createPayment({
        bookingId: booking.id,
        paymentMethod: selectedMethod,
        idempotencyKey
      });

      // 2. Simulate transaction execution on mock payment provider with selected test outcome
      const result = await apiClient.processPayment(
        paymentRecord.paymentId,
        testOutcome,
        selectedMethod
      );

      if (testOutcome === 'SUCCESS') {
        setSuccessResult(result);
        if (onPaymentSuccess) {
          onPaymentSuccess(result);
        }
      } else if (testOutcome === 'FAILED') {
        setErrorMessage('Payment simulation resulted in bank decline. Ticket hold has been released.');
      } else if (testOutcome === 'CANCELLED') {
        setErrorMessage('Payment simulation was cancelled by customer. Inventory hold released.');
      } else {
        setErrorMessage('Payment is currently pending settlement at the gateway.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccessResult(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title={successResult ? "Payment Successful & Tickets Issued!" : "Simulated Payment Checkout"}
      maxWidth="md"
    >
      {successResult ? (
        <div className="space-y-5 text-center py-2">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-xl font-black text-white">Payment Verified & Passes Issued!</h3>
            <p className="text-xs text-slate-400 mt-1">
              Transaction ID: <span className="font-mono text-slate-200">{successResult.payment.providerTxnRef}</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Festival:</span>
              <span className="text-white font-bold">{successResult.booking.eventTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pass Category:</span>
              <span className="text-white font-semibold">{successResult.booking.ticketCategoryName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Paid:</span>
              <span className="text-emerald-400 font-black text-sm">{formatCurrency(successResult.payment.amountINR)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tickets Generated:</span>
              <span className="text-white font-bold">{successResult.tickets.length} Digital Pass(es)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-brand-950/40 border border-brand-500/30 text-xs text-brand-300 text-left flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              Dynamic encrypted QR passes have been deposited in your <strong>Digital Ticket Vault</strong> with anti-counterfeit tokens ready for gate entry.
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleResetAndClose}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => {
                handleResetAndClose();
                navigate('/user/tickets');
              }}
            >
              Open Digital Pass Vault
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Prominent Demo Mode Disclaimer */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-200">Demo Payment Mode</strong>
              <span>This is a simulated collegiate checkout. No real financial credentials are required and no real money will be transferred.</span>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <h4 className="font-bold text-white text-sm">{booking.eventTitle}</h4>
                <p className="text-slate-400">{booking.ticketCategoryName} • {booking.quantity} ticket(s)</p>
              </div>
              <Badge variant="warning">{booking.status}</Badge>
            </div>

            <div className="flex justify-between text-slate-400 pt-1">
              <span>Subtotal:</span>
              <span>{formatCurrency(booking.subtotal)}</span>
            </div>

            {booking.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Academic Merit Discount ({booking.discountPercentage}%):</span>
                <span>-{formatCurrency(booking.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm">
              <span className="font-extrabold text-white">Amount Due:</span>
              <span className="font-black text-emerald-400 text-lg">{formatCurrency(booking.finalAmount)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select Simulated Payment Channel
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {paymentMethods.map((m) => {
                const Icon = m.icon;
                const isSelected = selectedMethod === m.id;

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'bg-brand-600/15 border-brand-500 ring-1 ring-brand-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-brand-500/20 text-brand-400' : 'bg-slate-800 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white">{m.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{m.subtitle}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Developer / Demo Test Outcome Controller */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Demo Test Outcome Control
              </span>
              <span className="text-[10px] text-slate-500">Configurable</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
              {[
                { id: 'SUCCESS', label: 'Success', color: 'hover:border-emerald-500' },
                { id: 'FAILED', label: 'Fail / Decline', color: 'hover:border-red-500' },
                { id: 'CANCELLED', label: 'Cancel', color: 'hover:border-amber-500' },
                { id: 'PENDING', label: 'Pending', color: 'hover:border-cyan-500' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTestOutcome(opt.id as any)}
                  className={`px-2 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    testOutcome === opt.id
                      ? 'bg-brand-600 text-white border-brand-500 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 ' + opt.color
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              className="flex-1"
              onClick={handleResetAndClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500"
              isLoading={isProcessing}
              onClick={handlePay}
            >
              Simulate Pay {formatCurrency(booking.finalAmount)}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};