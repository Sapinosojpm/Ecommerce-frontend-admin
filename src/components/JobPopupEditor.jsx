import React, { useState, useEffect } from "react";
import { backendUrl } from "../App";

const JobPopupEditor = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  /** Toggle modal visibility */
  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

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

  // Helper to upload image to S3 and return the URL
  const uploadImageToS3 = async (file) => {
    if (!file) return null;
    try {
      const presignRes = await fetch(`${backendUrl}/api/upload/presigned-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileType: file.type }),
      });
      if (!presignRes.ok) throw new Error('Failed to get S3 pre-signed URL');
      const { uploadUrl, fileUrl } = await presignRes.json();
      const s3Res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file,
      });
      if (!s3Res.ok) throw new Error('Failed to upload file to S3');
      return fileUrl;
    } catch (err) {
      alert('Image upload to S3 failed.');
      return null;
    }
  };

  /** Handle job submission */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      alert("Please fill in all fields.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    let imageUrl = '';
    if (image) {
      imageUrl = await uploadImageToS3(image);
      if (!imageUrl) {
        setUploadError('Image upload to S3 failed.');
        setUploading(false);
        return;
      }
    }
    try {
      const res = await fetch(`${backendUrl}/api/job-posting`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          image: imageUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Job posting added successfully!");
        setTitle("");
        setDescription("");
        setImage(null);
        setImagePreview(null);
        setIsOpen(false);
        fetchJobs();
      } else {
        setUploadError('Failed to add job.');
      }
    } catch (error) {
      setUploadError('Error adding job.');
    }
    setUploading(false);
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

  if (loading) return <div className="py-4 text-center">Loading...</div>;
  if (error)
    return <div className="py-4 text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl p-4 mx-auto">
      <h2 className="mb-6 text-2xl font-bold text-center text-indigo-800">
        Job Posting Editor
      </h2>
      <button
        onClick={openModal}
        className="px-4 py-2 mb-4 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
      >
        Add New Job Posting
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg p-6 mx-4 bg-white shadow-2xl rounded-xl">
            {/* Job Posting Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div
                onClick={closeModal}
                className="relative z-50 flex justify-end text-xl text-gray-700 cursor-pointer margin-5 hover:text-black"
              >
                ✕
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Job Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Job Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Upload Job Image
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    setImage(e.target.files[0]);
                    if (e.target.files[0]) {
                      setImagePreview(URL.createObjectURL(e.target.files[0]));
                    } else {
                      setImagePreview(null);
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-32 mt-2 object-contain border rounded"
                  />
                )}
                {uploadError && (
                  <div className="mt-2 text-sm text-red-600">{uploadError}</div>
                )}
              </div>

              <button
                type="submit"
                className="w-full p-3 text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 disabled:bg-gray-400"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Add Job Posting'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Job Listings */}
      <div className="mt-8">

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {jobs.length === 0 ? (
            <p className="col-span-2 text-center text-gray-600">
              No job postings available.
            </p>
          ) : (
            jobs.map((job) => (
              <div
                key={job._id}
                className="relative p-4 bg-white border rounded-lg shadow-lg"
              >
                <h4 className="mb-2 text-lg font-bold">{job.title}</h4>
                <p className="mb-3 text-gray-600">{job.description}</p>
                {job.image && (
                  <img
                    src={
                      job.image?.startsWith('http')
                        ? job.image
                        : `${backendUrl}${job.image || ''}`
                    }
                    alt="Job"
                    className="object-cover w-full h-40 mb-2 rounded-lg"
                  />
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => handleDelete(job._id)}
                    className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>

                {/* View Applicants Button */}
                <button
                  onClick={() => fetchApplicants(job._id)}
                  className="w-full p-2 mt-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  View Applicants
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      
      <div>
          {/* Applicants Table */}
      {selectedJob && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-indigo-700">
            Applicants for Job
          </h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border border-collapse border-gray-300">
              <thead>
                <tr className="text-white bg-indigo-700">
                   <th className="p-3 border">Name</th>
                  <th className="p-3 border">Position</th>
                  <th className="p-3 border">Address</th>
                  <th className="p-3 border">Experience</th>
                  <th className="p-3 border">Resume</th>
                </tr>
              </thead>
              <tbody>
                {applicants.length > 0 ? (
                  applicants.map((applicant) => (
                    <tr key={applicant._id} className="hover:bg-gray-100">
                     
                      <td className="p-3 bg-gray-200 border border-gray-300">
                        {applicant.firstName} {applicant.lastName}
                      </td>
                       <td className="p-3 border">{applicant.jobTitle}</td>
                      <td className="p-3 border">{applicant.address}</td>
                      <td className="p-3 border">{applicant.experience}</td>
                      <td className="flex justify-center p-3 border">
                        <a
                          href={applicant.resume && applicant.resume.startsWith('http') ? applicant.resume : `${backendUrl}/${applicant.resume}`}
                          className="px-2 py-1 text-indigo-600 border border-indigo-600 rounded-lg underline-none hover:bg-indigo-900 hover:text-white"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Resume
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-3 text-center border">
                      No applicants yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      </div>
      
    </div>
  );
};

export default JobPopupEditor;
