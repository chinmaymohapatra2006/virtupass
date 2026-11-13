import React, { useState } from 'react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Card } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { LoadingState } from '../../../shared/components/LoadingState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { EmptyState } from '../../../shared/components/EmptyState';
import { useMyTickets } from '../../../shared/hooks/useApi';
import { Ticket } from '../../../shared/types';
import {
  QrCode,
  Download,
  Printer,
  ShieldCheck,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  Maximize2,
  ExternalLink
} from 'lucide-react';
import { formatDate } from '../../../shared/utils/formatters';
import { Link } from 'react-router-dom';

export const UserTickets: React.FC = () => {
  const { data: tickets, isLoading, isError, refetch } = useMyTickets();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const activeTickets = tickets || [];

  const handlePrint = (ticket: Ticket) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print ticket');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>VirtuPass - ${ticket.ticketNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #111; }
            .ticket-card { border: 2px dashed #000; padding: 25px; border-radius: 12px; max-width: 550px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 15px; }
            .logo { font-size: 20px; font-weight: 900; letter-spacing: -0.5px; }
            .badge { background: #000; color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; }
            .body { display: flex; gap: 20px; margin-top: 20px; }
            .qr { width: 140px; height: 140px; }
            .details { flex: 1; }
            .event-title { font-size: 18px; font-weight: 800; margin: 0 0 5px 0; }
            .meta { font-size: 12px; color: #444; margin-bottom: 12px; }
            .row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
            .disclaimer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 10px; color: #666; }
          </style>
        </head>
        <body>
          <div class="ticket-card">
            <div class="header">
              <div class="logo">VIRTU<span style="color:#0ea5e9">PASS</span></div>
              <div class="badge">ENTRY PASS: ${ticket.ticketNumber}</div>
            </div>
            <div class="body">
              <img class="qr" src="${ticket.qrCodeDataUrl}" alt="Gate Pass QR" />
              <div class="details">
                <h2 class="event-title">${ticket.eventTitle}</h2>
                <div class="meta">${ticket.collegeName}</div>
                <div class="row"><strong>Pass Tier:</strong> <span>${ticket.ticketCategoryName}</span></div>
                <div class="row"><strong>Pass Index:</strong> <span>${ticket.ticketIndex} of ${ticket.totalTicketsInBooking}</span></div>
                <div class="row"><strong>Date:</strong> <span>${new Date(ticket.eventDate).toLocaleDateString()}</span></div>
                <div class="row"><strong>Time:</strong> <span>${ticket.startTime} - ${ticket.endTime}</span></div>
                <div class="row"><strong>Venue:</strong> <span>${ticket.venue}</span></div>
                <div class="row"><strong>Booking Ref:</strong> <span>${ticket.bookingId}</span></div>
              </div>
            </div>
            <div class="disclaimer">
              VirtuPass Cryptographic Gate Pass • Present this dynamic pass at campus security checkpoints. Unaltered, verified turnstile entry token.
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        title="Digital Pass Vault"
        description="Your verified collegiate entry tickets with scan-optimized dynamic QR codes ready for turnstile admission."
        badge={
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> {activeTickets.length} Active Digital Pass{activeTickets.length === 1 ? '' : 'es'}
          </span>
        }
      />

      {/* Security Architecture Notice */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-brand-950/70 via-slate-900 to-slate-950 border border-brand-500/30 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5 text-slate-300">
          <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span>
            <strong className="text-white">Anti-Counterfeit Protection:</strong> QR payloads contain opaque cryptographic signatures only. No student PII or academic data is ever exposed in the QR payload.
          </span>
        </div>
        <Link to="/user/bookings" className="text-brand-400 hover:text-brand-300 font-semibold shrink-0 text-xs flex items-center gap-1">
          Booking Orders <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {isLoading ? (
        <LoadingState message="Fetching active tickets from your VirtuPass vault..." />
      ) : isError ? (
        <ErrorState
          title="Could not load tickets"
          message="Ensure your student session is active and valid."
          onRetry={() => refetch()}
        />
      ) : activeTickets.length === 0 ? (
        <EmptyState
          title="No digital passes issued yet"
          description="Your vault is currently empty. Complete checkout on any reserved festival booking to issue your verified digital QR passes."
          actionText="Browse Campus Fests"
          onAction={() => window.location.href = '/events'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeTickets.map((ticket) => (
            <Card
              key={ticket.id}
              variant="glass"
              padding="none"
              className="overflow-hidden border-brand-500/30 flex flex-col justify-between hover:border-brand-500/60 transition-all duration-300 bg-slate-900/60"
            >
              {/* Ticket Header Banner */}
              <div className="bg-gradient-to-r from-brand-950 via-slate-900 to-indigo-950 p-5 border-b border-brand-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold tracking-wider text-brand-300">
                      {ticket.ticketNumber}
                    </span>
                    <Badge variant="brand" size="sm">
                      Pass {ticket.ticketIndex} of {ticket.totalTicketsInBooking}
                    </Badge>
                  </div>
                  <Badge variant="success">{ticket.status}</Badge>
                </div>
                <h3 className="text-lg font-bold text-white mt-2 leading-snug line-clamp-1">{ticket.eventTitle}</h3>
                <p className="text-xs text-brand-300/80 mt-0.5">{ticket.collegeName}</p>
              </div>

              {/* Ticket Body with high-contrast QR */}
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Clickable QR Box */}
                  <div
                    onClick={() => setSelectedTicket(ticket)}
                    className="w-28 h-28 bg-white p-2 rounded-2xl flex flex-col items-center justify-center shadow-lg cursor-pointer hover:ring-2 hover:ring-brand-400 transition-all shrink-0 group"
                    title="Click to view full-screen gate pass"
                  >
                    <img
                      src={ticket.qrCodeDataUrl}
                      alt={`QR code for ${ticket.ticketNumber}`}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 text-xs space-y-2">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Pass Category</span>
                      <span className="font-bold text-white text-sm">{ticket.ticketCategoryName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Booking Order</span>
                      <span className="font-mono text-xs text-slate-300">{ticket.bookingId}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Cryptographic Token
                    </div>
                  </div>
                </div>

                {/* Event Schedule & Location */}
                <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{formatDate(ticket.eventDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{ticket.startTime} - {ticket.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{ticket.venue}</span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSelectedTicket(ticket)}
                  leftIcon={<Maximize2 className="w-3.5 h-3.5" />}
                >
                  Full-Screen Gate Pass
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                  onClick={() => handlePrint(ticket)}
                >
                  Print Slip
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Fullscreen Gate Pass Modal */}
      {selectedTicket && (
        <Modal
          isOpen={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          title="Digital Gate Entry Pass"
          description="Present this dynamic high-contrast QR code at campus security gates"
          maxWidth="md"
        >
          <div className="flex flex-col items-center text-center p-3">
            {/* High contrast QR box */}
            <div className="w-60 h-60 bg-white p-4 rounded-3xl shadow-2xl flex items-center justify-center mb-4 ring-4 ring-brand-500/20">
              <img
                src={selectedTicket.qrCodeDataUrl}
                alt="Gate Pass QR"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-extrabold tracking-widest text-brand-400">
                {selectedTicket.ticketNumber}
              </span>
              <Badge variant="success">ACTIVE</Badge>
            </div>

            <h4 className="text-base font-black text-white">{selectedTicket.eventTitle}</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedTicket.ticketCategoryName} • Pass {selectedTicket.ticketIndex} of {selectedTicket.totalTicketsInBooking}
            </p>

            <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 w-full text-xs text-slate-300 space-y-1 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Campus Venue:</span>
                <span className="text-white font-medium">{selectedTicket.venue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Event Time:</span>
                <span className="text-white font-medium">{selectedTicket.startTime} - {selectedTicket.endTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cryptographic Token:</span>
                <span className="font-mono text-emerald-400 text-[10px]">
                  {selectedTicket.secureToken.substring(0, 16)}...
                </span>
              </div>
            </div>

            <div className="mt-5 w-full flex items-center gap-3">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={() => handlePrint(selectedTicket)}
              >
                Print Pass Slip
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setSelectedTicket(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};