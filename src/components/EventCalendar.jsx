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
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => {
    setIsOpen(true);
  }
  const closeModal = () => {
    setIsOpen(false);
  }


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

  if (loading) return <div className="py-4 text-center">Loading...</div>;
  if (error) return <div className="py-4 text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl p-4 mx-auto">
      <h2 className="mb-6 text-2xl font-semibold text-center">Event Calendar Management</h2>

      <button onClick={openModal} className="px-4 py-2 mb-4 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
        Add New Event 
        </button>

        {isOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <form onSubmit={handleSubmit} className="relative w-full max-w-lg p-6 mx-4 space-y-4 bg-white shadow-2xl rounded-xl">
      <button onClick={closeModal} className="absolute z-50 text-xl text-gray-800 top-4 right-4 hover:text-black">x</button>
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Event Title</label>
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
        <label className="block mb-1 text-sm font-medium text-gray-700">Event Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter event description"
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
          required
        />
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Start Date & Time</label>
        <input
          type="datetime-local"
          value={startDateTime}
          onChange={(e) => setStartDateTime(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
          required
        />
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">End Date & Time</label>
        <input
          type="datetime-local"
          value={endDateTime}
          onChange={(e) => setEndDateTime(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-700"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full p-3 text-white transition-all duration-300 bg-indigo-700 rounded-lg hover:bg-indigo-800"
      >
        Add Event
      </button>
    </form>
  </div>
)}


      {/* Event List */}
      <div className="mt-8">
        <h3 className="mb-4 text-xl font-semibold">Event List</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {events.length === 0 ? (
            <p className="col-span-2 text-center text-gray-600">No events available.</p>
          ) : (
            events.map((event) => (
              <div key={event._id} className="p-4 bg-white border rounded-lg shadow-lg">
                <h4 className="mb-2 text-lg font-bold">{event.title}</h4>
                <p className="text-sm text-gray-600">
                  {new Date(event.startDate).toLocaleString()} - {new Date(event.endDate).toLocaleString()}
                </p>
                <p className="mb-3 text-gray-700">{event.description}</p>
                <button
                  onClick={() => handleDelete(event._id)}
                  className="w-full px-4 py-2 text-white transition-all duration-300 bg-red-500 rounded-lg hover:bg-red-600"
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
