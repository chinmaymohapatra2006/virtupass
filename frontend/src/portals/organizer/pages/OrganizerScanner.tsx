import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Card } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { useOrganizerEvents, useOrganizerTickets } from '../../../shared/hooks/useApi';
import { apiClient } from '../../../shared/services/apiClient';
import {
  ScanLine,
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Zap,
  Volume2,
  VolumeX,
  History,
  QrCode,
  MapPin,
  Calendar,
  Sparkles
} from 'lucide-react';

export const OrganizerScanner: React.FC = () => {
  const { data: events = [], isLoading: eventsLoading } = useOrganizerEvents();
  const { data: tickets = [] } = useOrganizerTickets();

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [gateName, setGateName] = useState<string>('Turnstile A (Main Gate)');
  const [manualCode, setManualCode] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [scanResult, setScanResult] = useState<any>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  // Auto-select first event when events load
  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  // Audio synthesize feedback
  const playSound = (type: 'success' | 'error') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
        osc.frequency.setValueAtTime(160, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // AudioCtx policy ignored
    }
  };

  const handleScanSubmit = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;
    if (!selectedEventId) {
      alert('Please select an event before scanning');
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      const response = await apiClient.scanGateTicket({
        tokenOrPayload: codeToVerify.trim(),
        eventId: selectedEventId,
        gateName,
        deviceInfo: 'Gate Optical Reader #01'
      });

      const outcome = {
        success: response.scanResult === 'ADMITTED',
        scanResult: response.scanResult,
        message: response.message,
        ticket: response.ticket,
        attendee: response.attendee,
        previousScanAt: response.previousScanAt,
        previousGate: response.previousGate,
        timestamp: new Date().toLocaleTimeString(),
        rawInput: codeToVerify
      };

      setScanResult(outcome);
      setRecentScans((prev) => [outcome, ...prev.slice(0, 9)]);

      if (outcome.success) {
        playSound('success');
      } else {
        playSound('error');
      }
    } catch (err: any) {
      const failureOutcome = {
        success: false,
        scanResult: 'INVALID',
        message: err.message || 'Scanning validation failed',
        timestamp: new Date().toLocaleTimeString(),
        rawInput: codeToVerify
      };
      setScanResult(failureOutcome);
      setRecentScans((prev) => [failureOutcome, ...prev.slice(0, 9)]);
      playSound('error');
    } finally {
      setIsScanning(false);
      setManualCode('');
    }
  };

  // Find sample ticket for quick demonstration
  const eventTickets = tickets.filter((t) => t.eventId === selectedEventId);
  const activeSampleTicket = eventTickets.find((t) => t.status === 'ACTIVE') || tickets[0];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Event Gate QR Scanner"
        description="High-speed optical entry validator. Scan attendee mobile screen tickets or enter code manually."
        badge={<Badge variant="success">Turnstile Gate Online</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold"
              title={soundEnabled ? 'Mute turnstile chime' : 'Enable turnstile chime'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-teal-400" />
                  <span>Audio Chime On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-500" />
                  <span>Muted</span>
                </>
              )}
            </button>
          </div>
        }
      />

      {/* Gate Configuration Bar */}
      <Card variant="glass" padding="md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Active Event Roster
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setScanResult(null);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              {eventsLoading ? (
                <option value="">Loading events...</option>
              ) : events.length === 0 ? (
                <option value="">No events available</option>
              ) : (
                events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.ticketCategories.length} categories)
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Checkpoint / Gate Name
            </label>
            <input
              type="text"
              value={gateName}
              onChange={(e) => setGateName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50 font-mono"
              placeholder="e.g. Turnstile A (Main Gate)"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Optical Viewfinder Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card
            variant="default"
            padding="none"
            className="overflow-hidden bg-slate-950 border-teal-500/30 flex flex-col items-center justify-center p-6 min-h-[380px] relative shadow-2xl"
          >
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
              <span className="text-xs font-mono font-bold text-teal-300 tracking-wider">
                LASER CAM • {gateName.toUpperCase()}
              </span>
            </div>

            {/* Optical Targeting Reticle */}
            <div className="relative w-64 h-64 border-2 border-dashed border-teal-400/40 rounded-3xl flex items-center justify-center p-4 bg-teal-950/10">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-400 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-400 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-400 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-400 rounded-br-xl" />

              {/* Laser scanning beam animation */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_14px_#2dd4bf] animate-bounce" />

              <div className="text-center space-y-2 pointer-events-none">
                <Camera className="w-10 h-10 text-teal-400 mx-auto opacity-80" />
                <p className="text-xs font-semibold text-slate-200">Align VirtuPass QR inside target</p>
                <p className="text-[10px] text-slate-500 font-mono">HMAC-SHA256 Cryptographic Token</p>
              </div>
            </div>

            {/* Quick Demo Simulator Buttons */}
            <div className="mt-5 w-full space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                Quick Simulation Actions (Real Backend Validation)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isScanning || !activeSampleTicket}
                  onClick={() => {
                    if (activeSampleTicket) {
                      handleScanSubmit(activeSampleTicket.qrPayload);
                    }
                  }}
                  leftIcon={<Zap className="w-3.5 h-3.5 text-teal-400" />}
                  className="text-xs justify-center"
                >
                  Scan Valid Pass
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={isScanning || !activeSampleTicket}
                  onClick={() => {
                    if (activeSampleTicket) {
                      // Attempt to scan the same pass twice to demonstrate duplicate detection
                      handleScanSubmit(activeSampleTicket.qrPayload);
                    }
                  }}
                  className="text-xs justify-center border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                >
                  Test Duplicate Scan
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={isScanning}
                  onClick={() => handleScanSubmit('VP:tkt-counterfeit-999:tampered_signature')}
                  className="text-xs justify-center border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
                >
                  Test Counterfeit QR
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={isScanning}
                  onClick={() => {
                    // Send an invalid ticket number
                    handleScanSubmit('VP-WRONG-9999-01');
                  }}
                  className="text-xs justify-center border-slate-700 text-slate-400"
                >
                  Test Unknown Code
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Manual Code Input & Scan Verification Card (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card variant="glass" padding="md">
            <h4 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-teal-400" />
              <span>Manual Ticket Code Verification</span>
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              If an attendee's screen has a glare, cracked glass, or camera cannot focus, input the ticket number or token:
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleScanSubmit(manualCode);
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="e.g. VP-TECH-8YYF-01 or paste VP:... QR string"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="font-mono text-xs uppercase"
              />
              <Button
                type="submit"
                variant="primary"
                isLoading={isScanning}
                disabled={!manualCode.trim()}
              >
                Verify
              </Button>
            </form>
          </Card>

          {/* Validation Feedback Display */}
          {scanResult ? (
            <Card
              variant="default"
              padding="md"
              className={
                scanResult.scanResult === 'ADMITTED'
                  ? 'border-emerald-500/60 bg-emerald-950/25 shadow-emerald-500/20 shadow-xl'
                  : scanResult.scanResult === 'DUPLICATE'
                  ? 'border-amber-500/60 bg-amber-950/25 shadow-amber-500/20 shadow-xl'
                  : 'border-rose-500/60 bg-rose-950/25 shadow-rose-500/20 shadow-xl'
              }
            >
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  {scanResult.scanResult === 'ADMITTED' ? (
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                  ) : scanResult.scanResult === 'DUPLICATE' ? (
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/40">
                      <AlertTriangle className="w-7 h-7" />
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 ring-2 ring-rose-500/40">
                      <XCircle className="w-7 h-7" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-white">
                        {scanResult.scanResult === 'ADMITTED'
                          ? 'ENTRY GRANTED • ADMITTED'
                          : scanResult.scanResult === 'DUPLICATE'
                          ? 'DUPLICATE ENTRY REJECTED'
                          : scanResult.scanResult === 'WRONG_EVENT'
                          ? 'WRONG EVENT TICKET'
                          : scanResult.scanResult === 'REVOKED'
                          ? 'TICKET REVOKED'
                          : 'ENTRY DENIED • INVALID PASS'}
                      </h4>
                      <Badge
                        variant={
                          scanResult.scanResult === 'ADMITTED'
                            ? 'success'
                            : scanResult.scanResult === 'DUPLICATE'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {scanResult.scanResult}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">{scanResult.message}</p>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-slate-400">{scanResult.timestamp}</span>
              </div>

              {scanResult.scanResult === 'ADMITTED' && scanResult.attendee && (
                <div className="mt-4 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Attendee Name</span>
                      <span className="font-bold text-white text-sm">{scanResult.attendee.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Ticket Tier</span>
                      <span className="font-bold text-teal-300 text-sm">{scanResult.attendee.tier}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Institution</span>
                      <span className="font-medium text-slate-300">{scanResult.attendee.college || 'Verified University'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Ticket Number</span>
                      <span className="font-mono font-bold text-emerald-400">{scanResult.ticket?.ticketNumber}</span>
                    </div>
                  </div>
                </div>
              )}

              {scanResult.scanResult === 'DUPLICATE' && (
                <div className="mt-3 bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200">
                  <p className="font-bold">Turnstile Security Alert:</p>
                  <p className="mt-1">
                    This ticket was already admitted at <span className="font-mono font-bold">{scanResult.previousGate || 'Gate'}</span> at{' '}
                    <span className="font-mono font-bold">
                      {scanResult.previousScanAt ? new Date(scanResult.previousScanAt).toLocaleTimeString() : 'Earlier'}
                    </span>
                    . Parallel entry has been atomically blocked.
                  </p>
                </div>
              )}
            </Card>
          ) : (
            <Card variant="glass" padding="md" className="text-center py-8">
              <ScanLine className="w-10 h-10 text-slate-600 mx-auto mb-2 animate-pulse" />
              <p className="text-sm font-semibold text-slate-300">Ready to Scan</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Point reader at pass QR or click one of the quick simulation buttons above to test real gate verification.
              </p>
            </Card>
          )}

          {/* Recent Scans Live Stream */}
          {recentScans.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-teal-400" />
                <span>Recent Gate Activity ({recentScans.length})</span>
              </h5>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {recentScans.map((scan, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          scan.scanResult === 'ADMITTED'
                            ? 'bg-emerald-400'
                            : scan.scanResult === 'DUPLICATE'
                            ? 'bg-amber-400'
                            : 'bg-rose-400'
                        }`}
                      />
                      <span className="font-mono text-slate-300 font-medium">
                        {scan.ticket?.ticketNumber || scan.rawInput.substring(0, 18)}
                      </span>
                      <span className="text-[10px] text-slate-500">({scan.scanResult})</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">{scan.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
