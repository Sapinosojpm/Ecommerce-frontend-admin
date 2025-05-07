import React, { useState, useEffect } from "react";
import { backendUrl } from "../App";

const JobPopupEditor = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  /** Fetch job postings from the backend */
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/job-posting`);
      const data = await res.json();
      setJobs(data);
    } catch (error) {
      setError("Error fetching job listings.");
    }
    setLoading(false);
  };

  /** Fetch applicants for a selected job */
  const fetchApplicants = async (jobId) => {
    setSelectedJob(jobId);
    try {
      const res = await fetch(`${backendUrl}/api/job-applications/${jobId}`);
      const data = await res.json();
      setApplicants(data);
    } catch (error) {
      setApplicants([]);
    }
  };

  /** Handle job submission */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      alert("Please fill in all fields.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    if (image) formData.append("image", image);

    try {
      const res = await fetch(`${backendUrl}/api/job-posting`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        alert("Job posting added successfully!");
        setTitle("");
        setDescription("");
        setImage(null);
        fetchJobs();
      } else {
        alert("Failed to add job.");
      }
    } catch (error) {
      alert("Error adding job.");
    }
  };

  /** Handle job deletion */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;

    try {
      const res = await fetch(`${backendUrl}/api/job-posting/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        alert("Job posting removed successfully!");
        setJobs(jobs.filter((job) => job._id !== id));
      } else {
        alert("Failed to remove job.");
      }
    } catch (error) {
      alert("Error removing job.");
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  if (loading) return <div className="text-center py-4">Loading...</div>;
  if (error) return <div className="text-center text-red-600 py-4">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6 text-center">Job Posting Editor</h2>

      {/* Job Posting Form */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-100 p-6 rounded-lg shadow-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Job Image</label>
          <input
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>

        <button type="submit" className="w-full p-3 bg-green-700 text-white rounded-lg hover:bg-green-800">
          Add Job Posting
        </button>
      </form>

      {/* Job Listings */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Job Listings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {jobs.length === 0 ? (
            <p className="text-center text-gray-600 col-span-2">No job postings available.</p>
          ) : (
            jobs.map((job) => (
              <div key={job._id} className="p-4 border rounded-lg shadow-lg bg-white relative">
                <h4 className="text-lg font-bold mb-2">{job.title}</h4>
                <p className="text-gray-600 mb-3">{job.description}</p>
                {job.image && (
                  <img
                    src={`${backendUrl}/${job.image.replace(/\\/g, "/")}`} // Ensure proper path formatting
                    alt="Job"
                    className="w-full h-40 object-cover mb-3 rounded-lg shadow-md"
                  />
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => handleDelete(job._id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>

                {/* View Applicants Button */}
                <button
                  onClick={() => fetchApplicants(job._id)}
                  className="w-full mt-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View Applicants
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Applicants Table */}
      {selectedJob && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-green-700">Applicants for Job</h3>
          <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-green-700 text-white">
                  <th className="p-3 border">Position</th>
                  <th className="p-3 border">Name</th>
                  <th className="p-3 border">Address</th>
                  <th className="p-3 border">Experience</th>
                  <th className="p-3 border">Resume</th>
                </tr>
              </thead>
              <tbody>
                {applicants.length > 0 ? (
                  applicants.map((applicant) => (
                    <tr key={applicant._id} className="hover:bg-gray-100">
                      <td className="p-3 border">{applicant.jobTitle}</td>
                      <td className="p-3 border">{applicant.firstName} {applicant.lastName}</td>
                      <td className="p-3 border">{applicant.address}</td>
                      <td className="p-3 border">{applicant.experience}</td>
                      <td className="p-3 border">
                        <a href={`${backendUrl}/${applicant.resume}`} className="text-blue-600 underline" target="_blank">
                          View Resume
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="text-center p-3 border">No applicants yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPopupEditor;
