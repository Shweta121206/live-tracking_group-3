import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
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

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'operator' | 'analyst' | 'admin';
  phone_number?: string;
  organization?: string;
  department?: string;
  position?: string;
  is_verified: boolean;
  last_login?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login/', credentials);
      console.log('Login response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Login failed');
      }
      
      const data = response.data.data;
      
      if (!data || !data.access_token) {
        throw new Error('Invalid response format from server');
      }
      
      // Store tokens and user info
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  register: async (data: RegisterData): Promise<any> => {
    const response = await api.post('/auth/register/', data);
    const responseData = response.data.data;
    
    // Only store tokens if they exist (operator role gets auto-approved)
    if (responseData.access_token) {
      localStorage.setItem('access_token', responseData.access_token);
      localStorage.setItem('refresh_token', responseData.refresh_token);
      localStorage.setItem('user', JSON.stringify(responseData.user));
    }
    
    return responseData;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        return null;
      }
    }
    return null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile/');
    return response.data.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/auth/profile/', data);
    const user = response.data.data;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await api.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: newPassword,
    });
  },

  getDemoUsers: async (): Promise<Array<{email: string, role: string, name: string, password_hint: string}>> => {
    const response = await api.get('/auth/demo-users/');
    return response.data.data || response.data;
  },
};

export default authService;
