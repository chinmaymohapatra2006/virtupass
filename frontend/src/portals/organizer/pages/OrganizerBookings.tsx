import React, { useState } from 'react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Card } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { useOrganizerBookings } from '../../../shared/hooks/useApi';
import { Search, Download, CheckCircle2, Ticket, Clock, AlertTriangle } from 'lucide-react';

export const OrganizerBookings: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: bookings = [], isLoading } = useOrganizerBookings();

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.userName.toLowerCase().includes(search.toLowerCase()) ||
      b.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      b.eventTitle.toLowerCase().includes(search.toLowerCase()) ||
      b.ticketCategoryName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED');
  const totalTicketsSold = confirmedBookings.reduce((sum, b) => sum + b.quantity, 0);
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.finalAmount, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Event Bookings & Registrations"
        description="Real-time manifest of student bookings across all your organized college fest events."
        badge={<Badge variant="info">{bookings.length} Total Records</Badge>}
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glass" padding="md">
          <p className="text-[11px] uppercase text-slate-400 font-bold tracking-wider">Confirmed Bookings</p>
          <h3 className="text-2xl font-extrabold text-white mt-1">
            {confirmedBookings.length} <span className="text-xs font-normal text-slate-400">/ {bookings.length}</span>
          </h3>
          <p className="text-xs text-emerald-400 mt-1">{totalTicketsSold} Passes Issued</p>
        </Card>

        <Card variant="glass" padding="md">
          <p className="text-[11px] uppercase text-slate-400 font-bold tracking-wider">Gross Fest Revenue</p>
          <h3 className="text-2xl font-extrabold text-teal-400 mt-1">
            ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Verified Gateway Settlements</p>
        </Card>

        <Card variant="glass" padding="md">
          <p className="text-[11px] uppercase text-slate-400 font-bold tracking-wider">Inventory Hold / Pending</p>
          <h3 className="text-2xl font-extrabold text-amber-400 mt-1">
            {bookings.filter((b) => b.status === 'PENDING_PAYMENT').length}
          </h3>
          <p className="text-xs text-amber-400/80 mt-1">15-minute checkout reservation</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search booking ID, student, event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
            <option value="PAYMENT_FAILED">PAYMENT_FAILED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <span className="text-xs text-slate-400 whitespace-nowrap">
            Showing {filtered.length} of {bookings.length}
          </span>
        </div>
      </div>

      {/* Bookings Table */}
      <Card variant="default" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800 tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Booking Ref</th>
                <th className="px-4 py-3.5">Student Attendee</th>
                <th className="px-4 py-3.5">Event & Tier</th>
                <th className="px-4 py-3.5 text-center">Passes</th>
                <th className="px-4 py-3.5">CGPA Benefit</th>
                <th className="px-4 py-3.5">Total Paid</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    Loading booking manifests...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    No bookings found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-teal-400">{b.id}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white text-xs">{b.userName}</div>
                      <div className="text-slate-400 text-[10px] font-mono">{b.userEmail}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-slate-200 font-medium truncate max-w-xs">{b.eventTitle}</div>
                      <div className="text-[10px] text-slate-400">{b.ticketCategoryName}</div>
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-white">{b.quantity}</td>
                    <td className="px-4 py-3.5">
                      {b.discountPercentage > 0 ? (
                        <span className="text-emerald-400 font-semibold">
                          {b.discountPercentage}% Off (₹{b.discountAmount.toFixed(1)})
                        </span>
                      ) : (
                        <span className="text-slate-500">Standard</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-white">
                      ₹{b.finalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          b.status === 'CONFIRMED'
                            ? 'success'
                            : b.status === 'PENDING_PAYMENT'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {b.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 font-mono text-[10px]">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
