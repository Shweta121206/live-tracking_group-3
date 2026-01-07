import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import vesselService, { Vessel } from '../services/vesselService';
import { format } from 'date-fns';

const Vessels: React.FC = () => {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadVessels();
  }, [searchQuery, filterType, filterStatus]);

  const loadVessels = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.query = searchQuery;
      if (filterType) params.vessel_type = filterType;
      if (filterStatus) params.status = filterStatus;

      const response = await vesselService.getVessels(params);
      setVessels(response.results);
    } catch (error) {
      console.error('Failed to load vessels:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      underway: 'bg-green-100 text-green-800',
      at_anchor: 'bg-blue-100 text-blue-800',
      moored: 'bg-gray-100 text-gray-800',
      not_under_command: 'bg-red-100 text-red-800',
      restricted_maneuverability: 'bg-yellow-100 text-yellow-800',
      aground: 'bg-red-100 text-red-800',
      fishing: 'bg-purple-100 text-purple-800',
      under_sail: 'bg-cyan-100 text-cyan-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Vessels</h1>
          <p className="mt-1 text-sm text-white">
            Manage and track all maritime vessels
          </p>
        </div>
        <Link
          to="/vessels/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Add Vessel
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name, MMSI, or IMO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="underway">Underway</option>
              <option value="at_anchor">At Anchor</option>
              <option value="moored">Moored</option>
              <option value="not_under_command">Not Under Command</option>
              <option value="restricted_maneuverability">Restricted Maneuverability</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vessels Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vessel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Speed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Destination
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Update
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vessels.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  No vessels found
                </td>
              </tr>
            ) : (
              vessels.filter(v => v.id && !isNaN(v.id)).map((vessel) => (
                <tr key={vessel.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{vessel.vessel_name}</div>
                    <div className="text-sm text-gray-500">MMSI: {vessel.mmsi}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {vessel.vessel_type.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(vessel.status)}`}>
                      {vessel.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vessel.current_coordinates[0].toFixed(4)}, {vessel.current_coordinates[1].toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vessel.speed_over_ground ? `${vessel.speed_over_ground} kn` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vessel.destination || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vessel.last_position_update
                      ? format(new Date(vessel.last_position_update), 'MMM d, HH:mm')
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/vessels/${vessel.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Vessels;
