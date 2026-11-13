import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './shared/hooks/useAuth';
import { ProtectedRoute } from './shared/components/ProtectedRoute';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { UserLayout } from './portals/user/layouts/UserLayout';
import { AdminLayout } from './portals/admin/layouts/AdminLayout';
import { OrganizerLayout } from './portals/organizer/layouts/OrganizerLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { ExploreEventsPage } from './pages/ExploreEventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// User Portal Pages
import { UserDashboard } from './portals/user/pages/UserDashboard';
import { UserVerification } from './portals/user/pages/UserVerification';
import { UserEvents } from './portals/user/pages/UserEvents';
import { UserTickets } from './portals/user/pages/UserTickets';
import { UserBookings } from './portals/user/pages/UserBookings';
import { UserProfile } from './portals/user/pages/UserProfile';

// Admin Portal Pages
import { AdminDashboard } from './portals/admin/pages/AdminDashboard';
import { AdminUsers } from './portals/admin/pages/AdminUsers';
import { AdminOrganizers } from './portals/admin/pages/AdminOrganizers';
import { AdminEvents } from './portals/admin/pages/AdminEvents';
import { AdminTickets } from './portals/admin/pages/AdminTickets';
import { AdminAttendance } from './portals/admin/pages/AdminAttendance';
import { AdminAudit } from './portals/admin/pages/AdminAudit';

// Organizer Portal Pages
import { OrganizerDashboard } from './portals/organizer/pages/OrganizerDashboard';
import { OrganizerEvents } from './portals/organizer/pages/OrganizerEvents';
import { OrganizerCreateEvent } from './portals/organizer/pages/OrganizerCreateEvent';
import { OrganizerBookings } from './portals/organizer/pages/OrganizerBookings';
import { OrganizerAttendance } from './portals/organizer/pages/OrganizerAttendance';
import { OrganizerScanner } from './portals/organizer/pages/OrganizerScanner';
import { OrganizerProfile } from './portals/organizer/pages/OrganizerProfile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60, // 1 minute
      retry: 1
    }
  }
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Route Group */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/events" element={<ExploreEventsPage />} />
              <Route path="/events/:eventId" element={<EventDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Student User Portal (Protected for USER role) */}
            <Route
              path="/user"
              element={
                <ProtectedRoute allowedRoles={['USER']}>
                  <UserLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/user/dashboard" replace />} />
              <Route path="dashboard" element={<UserDashboard />} />
              <Route path="verification" element={<UserVerification />} />
              <Route path="events" element={<UserEvents />} />
              <Route path="tickets" element={<UserTickets />} />
              <Route path="bookings" element={<UserBookings />} />
              <Route path="profile" element={<UserProfile />} />
            </Route>

            {/* Admin Portal (Protected for ADMIN role) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="organizers" element={<AdminOrganizers />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="tickets" element={<AdminTickets />} />
              <Route path="attendance" element={<AdminAttendance />} />
              <Route path="audit" element={<AdminAudit />} />
            </Route>

            {/* Organizer Portal (Protected for ORGANIZER role) */}
            <Route
              path="/organizer"
              element={
                <ProtectedRoute allowedRoles={['ORGANIZER']}>
                  <OrganizerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/organizer/dashboard" replace />} />
              <Route path="dashboard" element={<OrganizerDashboard />} />
              <Route path="events" element={<OrganizerEvents />} />
              <Route path="events/new" element={<OrganizerCreateEvent />} />
              <Route path="bookings" element={<OrganizerBookings />} />
              <Route path="attendance" element={<OrganizerAttendance />} />
              <Route path="scanner" element={<OrganizerScanner />} />
              <Route path="profile" element={<OrganizerProfile />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
