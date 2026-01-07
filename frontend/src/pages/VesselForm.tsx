import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import vesselService from '../services/vesselService';

const VesselForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    mmsi: '',
    imo_number: '',
    vessel_name: '',
    call_sign: '',
    vessel_type: 'cargo',
    flag_country: '',
    built_year: '',
    gross_tonnage: '',
    latitude: '',
    longitude: '',
    speed_over_ground: '',
    course_over_ground: '',
    heading: '',
    destination: '',
    status: 'underway',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.mmsi || !formData.vessel_name || !formData.latitude || !formData.longitude) {
        throw new Error('Please fill in all required fields (MMSI, Vessel Name, Latitude, Longitude)');
      }

      // Prepare data for API
      const vesselData: any = {
        mmsi: formData.mmsi,
        vessel_name: formData.vessel_name,
        vessel_type: formData.vessel_type,
        flag_country: formData.flag_country,
        latitude: formData.latitude,
        longitude: formData.longitude,
        status: formData.status,
      };

      // Add optional fields if provided
      if (formData.imo_number) vesselData.imo_number = formData.imo_number;
      if (formData.call_sign) vesselData.call_sign = formData.call_sign;
      if (formData.built_year) vesselData.built_year = parseInt(formData.built_year);
      if (formData.gross_tonnage) vesselData.gross_tonnage = parseFloat(formData.gross_tonnage);
      if (formData.speed_over_ground) vesselData.speed_over_ground = formData.speed_over_ground;
      if (formData.course_over_ground) vesselData.course_over_ground = formData.course_over_ground;
      if (formData.heading) vesselData.heading = parseInt(formData.heading);
      if (formData.destination) vesselData.destination = formData.destination;

      const response = await vesselService.createVessel(vesselData);
      navigate(`/vessels/${response.id}`);
    } catch (err: any) {
      console.error('Failed to create vessel:', err);
      setError(err.message || err.response?.data?.error?.message || 'Failed to create vessel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 text-white">Add New Vessel</h1>
          <p className="mt-1 text-sm text-gray-600 text-white">
            Enter vessel information to add it to the tracking system
          </p>
        </div>
        <button
          onClick={() => navigate('/vessels')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MMSI <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="mmsi"
                value={formData.mmsi}
                onChange={handleChange}
                required
                pattern="[0-9]{9}"
                placeholder="9 digit number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IMO Number
              </label>
              <input
                type="text"
                name="imo_number"
                value={formData.imo_number}
                onChange={handleChange}
                pattern="[0-9]{7}"
                placeholder="7 digit number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vessel Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="vessel_name"
                value={formData.vessel_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Call Sign
              </label>
              <input
                type="text"
                name="call_sign"
                value={formData.call_sign}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vessel Type <span className="text-red-500">*</span>
              </label>
              <select
                name="vessel_type"
                value={formData.vessel_type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cargo">Cargo</option>
                <option value="tanker">Tanker</option>
                <option value="passenger">Passenger</option>
                <option value="fishing">Fishing</option>
                <option value="tug">Tug</option>
                <option value="military">Military</option>
                <option value="sailing">Sailing</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flag Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="flag_country"
                value={formData.flag_country}
                onChange={handleChange}
                required
                placeholder="e.g., USA, UK, China"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Built Year
              </label>
              <input
                type="number"
                name="built_year"
                value={formData.built_year}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gross Tonnage
              </label>
              <input
                type="number"
                name="gross_tonnage"
                value={formData.gross_tonnage}
                onChange={handleChange}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Position Information */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Position Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                required
                placeholder="e.g., 35.6762"
                pattern="-?[0-9]+\.?[0-9]*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                required
                placeholder="e.g., 139.6503"
                pattern="-?[0-9]+\.?[0-9]*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Speed Over Ground (knots)
              </label>
              <input
                type="text"
                name="speed_over_ground"
                value={formData.speed_over_ground}
                onChange={handleChange}
                placeholder="e.g., 12.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Over Ground (degrees)
              </label>
              <input
                type="text"
                name="course_over_ground"
                value={formData.course_over_ground}
                onChange={handleChange}
                placeholder="e.g., 145.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heading (degrees)
              </label>
              <input
                type="number"
                name="heading"
                value={formData.heading}
                onChange={handleChange}
                min="0"
                max="359"
                placeholder="0-359"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="underway">Underway</option>
                <option value="at_anchor">At Anchor</option>
                <option value="moored">Moored</option>
                <option value="not_under_command">Not Under Command</option>
                <option value="restricted_maneuverability">Restricted Maneuverability</option>
                <option value="aground">Aground</option>
                <option value="fishing">Fishing</option>
                <option value="under_sail">Under Sail</option>
              </select>
            </div>
          </div>
        </div>

        {/* Destination */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Destination</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination Port
            </label>
            <input
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              placeholder="e.g., Port of Singapore"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/vessels')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Vessel'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VesselForm;
