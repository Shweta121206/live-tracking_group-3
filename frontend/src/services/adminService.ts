import api from './api';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'admin' | 'analyst' | 'operator';
  phone_number?: string;
  organization?: string;
  department?: string;
  position?: string;
  is_verified: boolean;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  date_joined?: string;
}

export interface SystemStats {
  total_users: number;
  active_users: number;
  total_vessels: number;
  total_notifications: number;
  recent_logins: RecentLogin[];
  user_activity: UserActivity[];
}

export interface RecentLogin {
  user_email: string;
  user_name: string;
  login_time: string;
  ip_address?: string;
}

export interface UserActivity {
  date: string;
  logins: number;
  registrations: number;
}

export interface CreateUserData {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  role: string;
  phone_number?: string;
  organization?: string;
  department?: string;
  position?: string;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  role?: string;
  phone_number?: string;
  organization?: string;
  department?: string;
  position?: string;
  is_active?: boolean;
  is_verified?: boolean;
}

class AdminService {
  async getAllUsers(): Promise<User[]> {
    const response = await api.get('/auth/users/');
    // Handle nested response structure
    const data = response.data.results?.data || response.data.data || response.data;
    return Array.isArray(data) ? data : [];
  }

  async getPendingUsers(): Promise<User[]> {
    const response = await api.get('/auth/users/', { params: { status: 'pending' } });
    // Handle nested response structure
    const data = response.data.results?.data || response.data.data || response.data;
    return Array.isArray(data) ? data : [];
  }

  async getUserById(id: number): Promise<User> {
    const response = await api.get<{ success: boolean; data: User }>(`/auth/users/${id}/`);
    return response.data.data;
  }

  async approveUser(id: number): Promise<User> {
    const response = await api.patch<{ success: boolean; data: User }>(`/auth/users/${id}/`, { is_active: true });
    return response.data.data;
  }

  async createUser(userData: CreateUserData): Promise<User> {
    console.log('AdminService: Creating user with data:', { ...userData, password: '***', password_confirm: '***' });
    try {
      const response = await api.post<{ success: boolean; data: { user: User } }>('/auth/register/', userData);
      console.log('AdminService: Create user response:', response.data);
      return response.data.data.user;
    } catch (error: any) {
      console.error('AdminService: Create user error:', error.response?.data || error.message);
      throw error;
    }
  }

  async updateUser(id: number, userData: UpdateUserData): Promise<User> {
    const response = await api.patch<{ success: boolean; data: User }>(`/auth/users/${id}/`, userData);
    return response.data.data;
  }

  async deleteUser(id: number): Promise<void> {
    console.log('AdminService: Deleting user with id:', id);
    try {
      const response = await api.delete(`/auth/users/${id}/`);
      console.log('AdminService: Delete response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('AdminService: Delete error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getSystemStats(): Promise<SystemStats> {
    // Mock data for now - can be replaced with real API endpoint
    const users = await this.getAllUsers();
    const vesselsResponse = await api.get('/vessels/');
    const notificationsResponse = await api.get('/notifications/');
    
    return {
      total_users: users.length,
      active_users: users.filter(u => u.is_active).length,
      total_vessels: vesselsResponse.data.data.results?.length || vesselsResponse.data.data.length || 0,
      total_notifications: notificationsResponse.data.data.length || 0,
      recent_logins: users
        .filter(u => u.last_login)
        .sort((a, b) => new Date(b.last_login!).getTime() - new Date(a.last_login!).getTime())
        .slice(0, 10)
        .map(u => ({
          user_email: u.email,
          user_name: u.full_name,
          login_time: u.last_login!,
        })),
      user_activity: this.generateMockActivity(),
    };
  }

  private generateMockActivity(): UserActivity[] {
    const activity: UserActivity[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      activity.push({
        date: date.toISOString().split('T')[0],
        logins: Math.floor(Math.random() * 20) + 5,
        registrations: Math.floor(Math.random() * 5),
      });
    }
    
    return activity;
  }
}

export default new AdminService();
