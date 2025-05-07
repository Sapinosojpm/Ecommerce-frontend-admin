import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import toast styles
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css"; // Import Leaflet styles
import { backendUrl } from "../App"; // Ensure this is correctly set

const AdminLocationEditor = () => {
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState(14.5995); // Default latitude (e.g., Manila)
  const [longitude, setLongitude] = useState(120.9842); // Default longitude (e.g., Manila)

  useEffect(() => {
    // Fetch location data from the backend
    axios
      .get(`${backendUrl}/api/location`)
      .then((res) => {
        const fetchedLatitude = parseFloat(res.data.latitude);
        const fetchedLongitude = parseFloat(res.data.longitude);

        // Check if the fetched values are valid numbers
        if (!isNaN(fetchedLatitude) && !isNaN(fetchedLongitude)) {
          setLatitude(fetchedLatitude);
          setLongitude(fetchedLongitude);
        } else {
          toast.error("Invalid location data received.");
        }

        setName(res.data.name);
      })
      .catch((error) => {
        toast.error("Error fetching location data!");
        console.error(error);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ensure latitude and longitude are valid numbers before updating
      if (isNaN(latitude) || isNaN(longitude)) {
        toast.error("Invalid latitude or longitude values!");
        return;
      }

      await axios.put(`${backendUrl}/api/location`, { name, latitude, longitude });
      toast.success("Location updated successfully!");
    } catch (error) {
      toast.error("Failed to update location!");
    }
  };

  return (
    <div className="p-4 bg-white rounded-md shadow-md">
      <h2 className="mb-4 text-xl font-bold">Edit Map Location</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label className="block text-sm font-medium">Location Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium">Latitude:</label>
          <input
            type="text"
            value={latitude}
            onChange={(e) => setLatitude(parseFloat(e.target.value))}
            className="w-full p-2 border rounded-md"
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium">Longitude:</label>
          <input
            type="text"
            value={longitude}
            onChange={(e) => setLongitude(parseFloat(e.target.value))}
            className="w-full p-2 border rounded-md"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600"
        >
          Save Location
        </button>
      </form>

      {/* Map */}
      <div className="mt-4">
        <h3 className="text-lg font-medium">Map Location Preview:</h3>
        <MapContainer
          center={[latitude, longitude]}
          zoom={13}
          style={{ height: "300px", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[latitude, longitude]}>
            <Popup>{name}</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};

export default AdminLocationEditor;
