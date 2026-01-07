import api from './api';

export interface Vessel {
  id: number;
  mmsi: string;
  imo_number?: string;
  vessel_name: string;
  call_sign?: string;
  vessel_type: string;
  flag_country: string;
  built_year?: number;
  gross_tonnage?: number;
  status: string;
  current_coordinates: [number, number];
  latitude: string;
  longitude: string;
  speed_over_ground?: string;
  course_over_ground?: string;
  heading?: number;
  destination?: string;
  eta?: string;
  last_position_update?: string;
  is_tracked: boolean;
  distance_from_destination?: number;
  created_at: string;
  updated_at: string;
}

export interface VesselPosition {
  id: number;
  vessel: number;
  vessel_name: string;
  coordinates: [number, number];
  latitude: string;
  longitude: string;
  speed_over_ground?: string;
  course_over_ground?: string;
  heading?: number;
  navigational_status?: string;
  timestamp: string;
  data_source: string;
}

export interface VesselDetail extends Vessel {
  recent_positions: VesselPosition[];
  notes_count: number;
  active_route: any;
}

export interface VesselSearchParams {
  query?: string;
  vessel_type?: string;
  status?: string;
  flag_country?: string;
  is_tracked?: boolean;
  min_speed?: number;
  max_speed?: number;
  min_lat?: number;
  max_lat?: number;
  min_lon?: number;
  max_lon?: number;
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

const vesselService = {
  getVessels: async (params?: VesselSearchParams): Promise<PaginatedResponse<Vessel>> => {
    const response = await api.get('/vessels/', { params });
    return response.data.data;
  },

  getVessel: async (id: number): Promise<VesselDetail> => {
    const response = await api.get(`/vessels/${id}/`);
    return response.data.data;
  },

  createVessel: async (data: Partial<Vessel>): Promise<Vessel> => {
    const response = await api.post('/vessels/', data);
    return response.data.data;
  },

  updateVessel: async (id: number, data: Partial<Vessel>): Promise<Vessel> => {
    const response = await api.put(`/vessels/${id}/`, data);
    return response.data.data;
  },

  deleteVessel: async (id: number): Promise<void> => {
    await api.delete(`/vessels/${id}/`);
  },

  getVesselTrack: async (
    id: number,
    startTime?: string,
    endTime?: string
  ): Promise<VesselPosition[]> => {
    const response = await api.get(`/vessels/${id}/track/`, {
      params: { start_time: startTime, end_time: endTime },
    });
    return response.data.data.positions;
  },

  updatePosition: async (id: number, latitude: number, longitude: number): Promise<Vessel> => {
    const response = await api.post(`/vessels/${id}/update_position/`, {
      latitude,
      longitude,
    });
    return response.data.data;
  },

  getStatistics: async (id: number, days?: number): Promise<any> => {
    const response = await api.get(`/vessels/${id}/statistics/`, {
      params: { days },
    });
    return response.data.data;
  },

  getFleetStatistics: async (): Promise<any> => {
    const response = await api.get('/vessels/fleet_statistics/');
    return response.data.data;
  },

  getMapView: async (
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number
  ): Promise<Vessel[]> => {
    const response = await api.get('/vessels/map_view/', {
      params: {
        min_lat: minLat,
        max_lat: maxLat,
        min_lon: minLon,
        max_lon: maxLon,
      },
    });
    return response.data.data;
  },

  /**
   * Get real-time vessel positions from FREE AISHub API
   * Updates every few seconds to show live ship movements
   * Accessible to: Operators (for tracking), Analysts (for map analytics), Admins
   */
  getRealtimePositions: async (
    minLat?: number,
    maxLat?: number,
    minLon?: number,
    maxLon?: number
  ): Promise<any> => {
    try {
      const params: any = {
        min_lat: minLat !== undefined ? minLat : -90,
        max_lat: maxLat !== undefined ? maxLat : 90,
        min_lon: minLon !== undefined ? minLon : -180,
        max_lon: maxLon !== undefined ? maxLon : 180,
      };
      
      const response = await api.get('/vessels/realtime_positions/', { params });
      
      // Validate response structure
      if (response.data?.data?.vessels) {
        return response.data.data;
      }
      
      // Fallback if response structure is different
      if (Array.isArray(response.data?.data)) {
        return {
          vessels: response.data.data,
          count: response.data.data.length,
          source: 'aishub_free',
          timestamp: new Date().toISOString(),
        };
      }
      
      return response.data.data || { vessels: [], count: 0, source: 'unknown' };
    } catch (error: any) {
      console.error('Error fetching real-time positions:', error);
      
      // Provide better error message
      if (error.response?.status === 403) {
        const permissionError = new Error('You do not have permission to view real-time vessel positions');
        throw Object.assign(permissionError, { response: error.response });
      }
      
      throw error;
    }
  },

  /**
   * Update a specific vessel's position from live AIS data
   * Only accessible to Operators and Admins
   */
  updateFromAIS: async (id: number): Promise<Vessel> => {
    try {
      const response = await api.post(`/vessels/${id}/update_from_ais/`);
      return response.data.data.vessel;
    } catch (error: any) {
      console.error(`Error updating vessel ${id} from AIS:`, error);
      if (error.response?.status === 403) {
        const permissionError = new Error('You do not have permission to update vessel positions from AIS data');
        throw Object.assign(permissionError, { response: error.response });
      }
      throw error;
    }
  },
};

export default vesselService;
