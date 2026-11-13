import { useQuery } from '@tanstack/react-query';
import { apiClient, EventFilterParams } from '../services/apiClient';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.getHealth(),
    refetchInterval: 30000,
    retry: 1
  });
}

export function useSystemInfo() {
  return useQuery({
    queryKey: ['system-info'],
    queryFn: () => apiClient.getSystemInfo(),
    staleTime: 60000
  });
}

export function useSystemStats() {
  return useQuery({
    queryKey: ['system-stats'],
    queryFn: () => apiClient.getSystemStats(),
    staleTime: 30000
  });
}

export function useEvents(filters: EventFilterParams = {}) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => apiClient.getEvents(filters),
    staleTime: 30000
  });
}

export function useEventDetail(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => apiClient.getEventById(id),
    enabled: Boolean(id)
  });
}

export function useMyBookings(status?: string) {
  return useQuery({
    queryKey: ['my-bookings', status],
    queryFn: () => apiClient.getMyBookings(status),
    staleTime: 10000
  });
}

export function useBookingDetail(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => apiClient.getBookingById(id),
    enabled: Boolean(id)
  });
}

export function useMyTickets() {
  return useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => apiClient.getMyTickets(),
    staleTime: 10000
  });
}

export function useTicketDetail(ticketId: string) {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => apiClient.getTicketById(ticketId),
    enabled: Boolean(ticketId)
  });
}

export function useMyPayments() {
  return useQuery({
    queryKey: ['my-payments'],
    queryFn: () => apiClient.getMyPayments(),
    staleTime: 15000
  });
}

export function useOrganizerEvents() {
  return useQuery({
    queryKey: ['organizer-events'],
    queryFn: () => apiClient.getOrganizerEvents(),
    staleTime: 15000
  });
}

export function useAdminEvents() {
  return useQuery({
    queryKey: ['admin-events'],
    queryFn: () => apiClient.getAdminEvents(),
    staleTime: 15000
  });
}

export function useAdminBookings() {
  return useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => apiClient.getAdminBookings(),
    staleTime: 15000
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiClient.getAdminUsers(),
    staleTime: 30000
  });
}

export function useAdminSummary() {
  return useQuery({
    queryKey: ['admin-summary'],
    queryFn: () => apiClient.getAdminSummary(),
    staleTime: 30000
  });
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => apiClient.getAdminAnalytics(),
    staleTime: 10000
  });
}

export function useOrganizerAnalytics() {
  return useQuery({
    queryKey: ['organizer-analytics'],
    queryFn: () => apiClient.getOrganizerAnalytics(),
    staleTime: 10000
  });
}

export function useAdminOrganizers() {
  return useQuery({
    queryKey: ['admin-organizers'],
    queryFn: () => apiClient.getAdminOrganizers(),
    staleTime: 15000
  });
}

export function useAdminTickets(filters?: { search?: string; status?: string; eventId?: string }) {
  return useQuery({
    queryKey: ['admin-tickets', filters],
    queryFn: () => apiClient.getAdminTickets(filters),
    staleTime: 10000
  });
}

export function useAdminAuditLogs(filters?: { action?: string; entityType?: string; actorId?: string; limit?: number }) {
  return useQuery({
    queryKey: ['admin-audit-logs', filters],
    queryFn: () => apiClient.getAdminAuditLogs(filters),
    staleTime: 10000
  });
}

export function useAttendance(filters?: { eventId?: string; search?: string; scanResult?: any }) {
  return useQuery({
    queryKey: ['attendance', filters],
    queryFn: () => apiClient.getAttendance(filters),
    staleTime: 10000
  });
}

export function useAttendanceStats(eventId?: string) {
  return useQuery({
    queryKey: ['attendance-stats', eventId],
    queryFn: () => apiClient.getAttendanceStats(eventId),
    staleTime: 10000
  });
}

export function useOrganizerBookings() {
  return useQuery({
    queryKey: ['organizer-bookings'],
    queryFn: () => apiClient.getOrganizerBookings(),
    staleTime: 10000
  });
}

export function useOrganizerTickets() {
  return useQuery({
    queryKey: ['organizer-tickets'],
    queryFn: () => apiClient.getOrganizerTickets(),
    staleTime: 10000
  });
}