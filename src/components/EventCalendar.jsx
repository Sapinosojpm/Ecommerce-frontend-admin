import React, { useState, useEffect } from 'react';
import { backendUrl } from '../App';

const EventCalendar = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch events from the backend
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/events`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
      } else {
        setError("Failed to load events");
      }
    } catch (err) {
      setError("Error fetching events.");
    }
    setLoading(false);
  };

  // Submit new event
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDateTime || !endDateTime) {
      alert('Please select both start and end date for the event.');
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          startDate: startDateTime,
          endDate: endDateTime,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Event added successfully!');
        setTitle('');
        setDescription('');
        setStartDateTime('');
        setEndDateTime('');
        fetchEvents();
      } else {
        alert('Failed to add event.');
      }
    } catch (error) {
      alert('Error adding event.');
    }
  };

  // Delete event
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${backendUrl}/api/events/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        alert('Event deleted successfully!');
        fetchEvents();
      } else {
        alert('Failed to delete event.');
      }
    } catch (error) {
      alert('Error deleting event.');
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  if (loading) return <div className="text-center py-4">Loading...</div>;
  if (error) return <div className="text-center text-red-600 py-4">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6 text-center">Event Calendar Management</h2>

      {/* Event Form */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-100 p-6 rounded-lg shadow-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter event title"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter event description"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
          <input
            type="datetime-local"
            value={startDateTime}
            onChange={(e) => setStartDateTime(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
          <input
            type="datetime-local"
            value={endDateTime}
            onChange={(e) => setEndDateTime(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full p-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-all duration-300"
        >
          Add Event
        </button>
      </form>

      {/* Event List */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Event List</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {events.length === 0 ? (
            <p className="text-center text-gray-600 col-span-2">No events available.</p>
          ) : (
            events.map((event) => (
              <div key={event._id} className="p-4 border rounded-lg shadow-lg bg-white">
                <h4 className="text-lg font-bold mb-2">{event.title}</h4>
                <p className="text-sm text-gray-600">
                  {new Date(event.startDate).toLocaleString()} - {new Date(event.endDate).toLocaleString()}
                </p>
                <p className="text-gray-700 mb-3">{event.description}</p>
                <button
                  onClick={() => handleDelete(event._id)}
                  className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-300"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;
