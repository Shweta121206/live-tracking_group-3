import api from './api';

export interface AnalyticsData {
  vessel_statistics: VesselStatistics;
  speed_analytics: SpeedAnalytics;
  activity_timeline: ActivityTimelineItem[];
  notification_analytics: NotificationAnalytics;
  fleet_overview: FleetOverview;
  destination_analytics: DestinationAnalytics;
}

export interface VesselStatistics {
  total_vessels: number;
  active_vessels: number;
  inactive_vessels: number;
  by_status: { status: string; count: number }[];
  by_type: { vessel_type: string; count: number }[];
  by_country: { flag_country: string; count: number }[];
}

export interface SpeedAnalytics {
  average_speed: number;
  max_speed: number;
  min_speed: number;
  speed_distribution: { range: string; count: number }[];
}

export interface ActivityTimelineItem {
  date: string;
  updates: number;
}

export interface NotificationAnalytics {
  total_notifications: number;
  unread_notifications: number;
  read_notifications: number;
  by_type: { type: string; count: number }[];
  recent_7_days: number;
}

export interface FleetOverview {
  age_distribution: { category: string; count: number }[];
  total_tonnage: number;
  average_tonnage: number;
  total_built_year_known: number;
}

export interface DestinationAnalytics {
  total_with_destination: number;
  total_without_destination: number;
  top_destinations: { destination: string; count: number }[];
}

class AnalyticsService {
  async getAnalytics(): Promise<AnalyticsData> {
    const response = await api.get<{ success: boolean; data: AnalyticsData }>('/vessels/analytics/');
    return response.data.data;
  }
}

export default new AnalyticsService();
