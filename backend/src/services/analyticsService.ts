import { inMemoryStore } from '../data/inMemoryStore';
import { AdminAnalytics, OrganizerAnalytics } from '../types';

export class AnalyticsService {
  /**
   * Platform-wide analytics for Admin Portal.
   */
  public getAdminOverview(): AdminAnalytics {
    return inMemoryStore.getAdminAnalytics();
  }

  /**
   * Scoped performance metrics for Organizer Portal.
   */
  public getOrganizerOverview(organizerId: string): OrganizerAnalytics {
    return inMemoryStore.getOrganizerAnalytics(organizerId);
  }
}

export const analyticsService = new AnalyticsService();
