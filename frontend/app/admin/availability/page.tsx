'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  getAvailability,
  getAdminVehicles,
  getVehicleSubunits,
  updateSubunitStatus,
  createAvailabilityNote,
  deleteAvailabilityNote,
} from '@/lib/api';

export default function AdminAvailabilityPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedSubunit, setSelectedSubunit] = useState('');
  const [availabilityData, setAvailabilityData] = useState<any>(null);
  const [subunits, setSubunits] = useState<any[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
    note: '',
    note_type: 'maintenance' as 'maintenance' | 'blocked' | 'special',
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    loadAvailability();
    if (selectedVehicle) {
      loadSubunits();
    } else {
      setSubunits([]);
    }
  }, [selectedVehicle, month, year]);

  const loadVehicles = async () => {
    try {
      const data = await getAdminVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const loadAvailability = async () => {
    try {
      const data = await getAvailability({
        vehicle_id: selectedVehicle,
        month,
        year,
      });
      setAvailabilityData(data);
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const loadSubunits = async () => {
    try {
      const data = await getVehicleSubunits(selectedVehicle);
      setSubunits(data);
    } catch (error) {
      console.error('Error loading subunits:', error);
    }
  };

  const handleStatusChange = async (subunitId: string, newStatus: string) => {
    if (!confirm(`Change status to ${newStatus}?`)) return;
    try {
      await updateSubunitStatus(subunitId, newStatus);
      loadSubunits();
      loadAvailability();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error updating status');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!noteForm.startDate) {
      alert('Please select a start date');
      return;
    }

    try {
      // Determine date range
      const startDate = new Date(noteForm.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = noteForm.endDate ? new Date(noteForm.endDate) : new Date(noteForm.startDate);
      endDate.setHours(0, 0, 0, 0);
      
      if (endDate < startDate) {
        alert('End date cannot be before start date');
        return;
      }
      
      // Create notes for each date in the range
      const date = new Date(startDate);
      const datesToBlock: Date[] = [];
      
      while (date <= endDate) {
        datesToBlock.push(new Date(date));
        date.setDate(date.getDate() + 1);
      }

      // Create a note for each date
      const promises = datesToBlock.map((date) =>
        createAvailabilityNote({
          vehicle_id: selectedVehicle || undefined,
          vehicle_subunit_id: selectedSubunit || undefined,
          note_date: date.toISOString().split('T')[0],
          note: noteForm.note,
          note_type: noteForm.note_type,
        })
      );

      await Promise.all(promises);
      
      setShowNoteModal(false);
      setNoteForm({ startDate: null, endDate: null, note: '', note_type: 'maintenance' });
      setSelectedSubunit('');
      loadAvailability();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error creating availability note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this availability note?')) return;
    try {
      await deleteAvailabilityNote(noteId);
      loadAvailability();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error deleting note');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'rented':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'damaged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'special':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Generate calendar days for the month
  const getDaysInMonth = () => {
    const days = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month - 1, i));
    }
    return days;
  };

  const isDateBooked = (date: Date) => {
    if (!availabilityData?.bookings) return false;
    const dateStr = date.toISOString().split('T')[0];
    return availabilityData.bookings.some((booking: any) => {
      // Only show as booked if status is pending, confirmed, or active (not cancelled or completed)
      const activeStatuses = ['pending', 'confirmed', 'active'];
      const bookingStatus = booking.booking_status || booking.status;
      if (!activeStatuses.includes(bookingStatus)) return false;
      
      const pickup = new Date(booking.pickup_date).toISOString().split('T')[0];
      const dropoff = new Date(booking.dropoff_date).toISOString().split('T')[0];
      return dateStr >= pickup && dateStr <= dropoff;
    });
  };

  const isDateBlocked = (date: Date) => {
    if (!availabilityData?.availability_notes) return false;
    const dateStr = date.toISOString().split('T')[0];
    return availabilityData.availability_notes.some((note: any) => {
      const noteDate = new Date(note.note_date).toISOString().split('T')[0];
      return noteDate === dateStr && note.note_type === 'blocked';
    });
  };

  const isDateInMaintenance = (date: Date) => {
    if (!availabilityData?.availability_notes) return false;
    const dateStr = date.toISOString().split('T')[0];
    return availabilityData.availability_notes.some((note: any) => {
      const noteDate = new Date(note.note_date).toISOString().split('T')[0];
      return noteDate === dateStr && note.note_type === 'maintenance';
    });
  };

  const getNotesForDate = (date: Date) => {
    if (!availabilityData?.availability_notes) return [];
    const dateStr = date.toISOString().split('T')[0];
    return availabilityData.availability_notes.filter((note: any) => {
      const noteDate = new Date(note.note_date).toISOString().split('T')[0];
      return noteDate === dateStr;
    });
  };

  const getBookingsForDate = (date: Date) => {
    if (!availabilityData?.bookings) return [];
    const dateStr = date.toISOString().split('T')[0];
    const activeStatuses = ['pending', 'confirmed', 'active'];
    return availabilityData.bookings.filter((booking: any) => {
      // Only show bookings with active statuses
      const bookingStatus = booking.booking_status || booking.status;
      if (!activeStatuses.includes(bookingStatus)) return false;
      
      const pickup = new Date(booking.pickup_date).toISOString().split('T')[0];
      const dropoff = new Date(booking.dropoff_date).toISOString().split('T')[0];
      return dateStr >= pickup && dateStr <= dropoff;
    });
  };

  const selectedVehicleData = availabilityData?.vehicles?.find((v: any) => v.id === selectedVehicle);

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-8">Availability Management</h1>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle</label>
            <select
              value={selectedVehicle}
              onChange={(e) => {
                setSelectedVehicle(e.target.value);
                setSelectedSubunit('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Vehicles</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} {vehicle.model} ({vehicle.year})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(year, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* All Vehicles Overview */}
      {!selectedVehicle && availabilityData?.vehicles && availabilityData.vehicles.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">All Vehicles - Status Overview</h2>
            <p className="text-sm text-gray-500">Click on a vehicle to view its details</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Available
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Rented
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Maintenance
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Damaged
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {availabilityData.vehicles.map((vehicle: any) => (
                  <tr
                    key={vehicle.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedVehicle(vehicle.id);
                      setSelectedSubunit('');
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {vehicle.make} {vehicle.model} ({vehicle.year})
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      {vehicle.total_subunits || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {vehicle.available_subunits || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {vehicle.rented_subunits || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {vehicle.maintenance_subunits || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        {vehicle.damaged_subunits || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vehicle Status Summary */}
      {selectedVehicle && selectedVehicleData && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {selectedVehicleData.make} {selectedVehicleData.model} ({selectedVehicleData.year}) - Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold">{selectedVehicleData.total_subunits || 0}</p>
              <p className="text-sm text-gray-600">Total Units</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">
                {selectedVehicleData.available_subunits || 0}
              </p>
              <p className="text-sm text-gray-600">Available</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-700">{selectedVehicleData.rented_subunits || 0}</p>
              <p className="text-sm text-gray-600">Rented</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-700">
                {selectedVehicleData.maintenance_subunits || 0}
              </p>
              <p className="text-sm text-gray-600">Maintenance</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-700">{selectedVehicleData.damaged_subunits || 0}</p>
              <p className="text-sm text-gray-600">Damaged</p>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Subunits */}
      {selectedVehicle && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Vehicle Units</h2>
            <button
              onClick={() => setShowNoteModal(true)}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 text-sm"
            >
              Block Date
            </button>
          </div>
          {subunits.length === 0 ? (
            <p className="text-gray-500">No vehicle units found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      License Plate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">VIN</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mileage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subunits.map((subunit) => (
                    <tr key={subunit.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        {subunit.license_plate}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {subunit.vin || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {subunit.location_name
                          ? `${subunit.location_name}, ${subunit.location_city}`
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {subunit.mileage?.toLocaleString() || 0} km
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subunit.status)}`}>
                          {subunit.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={subunit.status}
                          onChange={(e) => handleStatusChange(subunit.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded border ${getStatusColor(subunit.status)}`}
                        >
                          <option value="available">Available</option>
                          <option value="rented">Rented</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="damaged">Damaged</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bookings List (when viewing all vehicles) */}
      {!selectedVehicle && availabilityData?.bookings && availabilityData.bookings.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Bookings for Selected Period</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Booking #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    License Plate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pickup Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Dropoff Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {availabilityData.bookings.map((booking: any) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {booking.booking_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {vehicles.find((v) => v.id === booking.vehicle_id)?.make}{' '}
                      {vehicles.find((v) => v.id === booking.vehicle_id)?.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{booking.license_plate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{booking.customer_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(booking.pickup_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(booking.dropoff_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          booking.booking_status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : booking.booking_status === 'active'
                              ? 'bg-blue-100 text-blue-800'
                              : booking.booking_status === 'completed'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {booking.booking_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {selectedVehicle && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Calendar View</h2>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-700 py-2">
                {day}
              </div>
            ))}
            {getDaysInMonth().map((date, index) => {
              const isBooked = isDateBooked(date);
              const isBlocked = isDateBlocked(date);
              const isMaintenance = isDateInMaintenance(date);
              const notes = getNotesForDate(date);
              const bookings = getBookingsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();

              // Determine background color: blocked (red) > maintenance (orange) > booked (yellow) > available (green)
              let bgColor = 'bg-green-100'; // Available (default) - darker green
              if (isBlocked) {
                bgColor = 'bg-red-200'; // Blocked - darker red
              } else if (isMaintenance) {
                bgColor = 'bg-orange-200'; // Maintenance - darker orange
              } else if (isBooked) {
                bgColor = 'bg-yellow-200'; // Booked - darker yellow
              }

              return (
                <div
                  key={index}
                  className={`min-h-20 p-2 border-2 rounded border-gray-300 ${bgColor}`}
                >
                  <div className="text-sm font-medium mb-1">{date.getDate()}</div>
                  {notes.length > 0 && (
                    <div className="space-y-1">
                      {notes.map((note: any) => (
                        <div
                          key={note.id}
                          className={`text-xs px-1 py-0.5 rounded ${getNoteTypeColor(note.note_type)}`}
                          title={note.note}
                        >
                          {note.note_type}
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="ml-1 text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {bookings.length > 0 && (
                    <div className="text-xs text-blue-600 mt-1">
                      {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border-2 border-gray-300 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-200 border-2 border-gray-300 rounded"></div>
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-200 border-2 border-gray-300 rounded"></div>
              <span>Maintenance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-200 border-2 border-gray-300 rounded"></div>
              <span>Blocked</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Availability Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => {
              setShowNoteModal(false);
              setNoteForm({ startDate: null, endDate: null, note: '', note_type: 'maintenance' });
              setSelectedSubunit('');
            }}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4">Block/Add Availability Note</h2>
              <form onSubmit={handleAddNote} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apply to Specific Unit (optional)
                  </label>
                  <select
                    value={selectedSubunit}
                    onChange={(e) => setSelectedSubunit(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All Units (Vehicle Level)</option>
                    {subunits.map((subunit) => (
                      <option key={subunit.id} value={subunit.id}>
                        {subunit.license_plate}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range * <span className="text-gray-500 text-xs">(Select start and end dates)</span>
                  </label>
                  <DatePicker
                    selected={noteForm.startDate}
                    onChange={(dates: [Date | null, Date | null] | null) => {
                      if (dates) {
                        const [start, end] = dates;
                        setNoteForm({
                          ...noteForm,
                          startDate: start,
                          endDate: end || start,
                        });
                      } else {
                        setNoteForm({
                          ...noteForm,
                          startDate: null,
                          endDate: null,
                        });
                      }
                    }}
                    startDate={noteForm.startDate}
                    endDate={noteForm.endDate}
                    selectsRange
                    minDate={new Date()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select date range"
                    required
                  />
                  {noteForm.startDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      {noteForm.startDate.toLocaleDateString()}
                      {noteForm.endDate && noteForm.endDate !== noteForm.startDate
                        ? ` - ${noteForm.endDate.toLocaleDateString()}`
                        : ' (single date)'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Note Type *</label>
                  <select
                    value={noteForm.note_type}
                    onChange={(e) =>
                      setNoteForm({
                        ...noteForm,
                        note_type: e.target.value as 'maintenance' | 'blocked' | 'special',
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="maintenance">Maintenance</option>
                    <option value="blocked">Blocked</option>
                    <option value="special">Special</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Note *</label>
                  <textarea
                    value={noteForm.note}
                    onChange={(e) => setNoteForm({ ...noteForm, note: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                  >
                    Add Note
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNoteModal(false);
                      setNoteForm({ startDate: null, endDate: null, note: '', note_type: 'maintenance' });
                      setSelectedSubunit('');
                    }}
                    className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
