import api from './api';

export interface Notification {
  id: number;
  type: 'alert' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  vessel_id?: number;
  vessel_name?: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  vessel_status_changes: boolean;
  speed_alerts: boolean;
  geofence_alerts: boolean;
  maintenance_reminders: boolean;
  position_updates_frequency: number; // in minutes
}

export interface ChoiceOption {
  value: string;
  label: string;
}

export interface UserPreferences {
  id?: number;
  theme: string;
  language: string;
  timezone: string;
  date_format: string;
  theme_choices?: ChoiceOption[];
  language_choices?: ChoiceOption[];
  timezone_choices?: ChoiceOption[];
  date_format_choices?: ChoiceOption[];
  created_at?: string;
  updated_at?: string;
}

class NotificationService {
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get('/notifications/');
    return response.data.data || response.data;
  }

  async markAsRead(notificationId: number): Promise<void> {
    await api.patch(`/notifications/${notificationId}/read/`);
  }

  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/mark-all-read/');
  }

  async deleteNotification(notificationId: number): Promise<void> {
    await api.delete(`/notifications/${notificationId}/`);
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await api.get('/settings/notifications/');
    return response.data.data || response.data;
  }

  async updateNotificationSettings(settings: NotificationSettings): Promise<void> {
    await api.put('/settings/notifications/', settings);
  }

  async getUserPreferences(): Promise<UserPreferences> {
    const response = await api.get('/settings/preferences/');
    return response.data.data || response.data;
  }

  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const response = await api.put('/settings/preferences/', preferences);
    return response.data.data || response.data;
  }
}

export default new NotificationService();
