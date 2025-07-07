import React, { useState } from 'react';

const FACEBOOK_AUTH_URL = '/api/auth/facebook';
const FACEBOOK_PAGES_URL = '/api/facebook/pages';
const FACEBOOK_POST_URL = '/api/facebook/post';

const FacebookManager = () => {
  const [pages, setPages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPage, setSelectedPage] = useState('');
  const [postMessage, setPostMessage] = useState('');
  const [postResult, setPostResult] = useState(null);

  const connectFacebook = () => {
    // Open Facebook OAuth in a new window
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const authWindow = window.open(
      FACEBOOK_AUTH_URL,
      'Facebook Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Poll to check if the window is closed, then try to fetch pages
    const timer = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(timer);
        fetchPages();
      }
    }, 1000);
  };

  const fetchPages = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(FACEBOOK_PAGES_URL, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Not authenticated or error fetching pages');
      const data = await res.json();
      setPages(data.data || []);
      setConnected(true);
    } catch (err) {
      setError(err.message);
      setConnected(false);
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    setPostResult(null);
    setError('');
    if (!selectedPage || !postMessage) {
      setError('Please select a page and enter a message.');
      return;
    }
    try {
      const res = await fetch(FACEBOOK_POST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pageId: selectedPage, message: postMessage })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to post');
      setPostResult('Successfully posted! Post ID: ' + data.id);
      setPostMessage('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Facebook Page Manager</h2>
      {!connected ? (
        <>
          <button
            onClick={connectFacebook}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Connect Facebook Page
          </button>
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </>
      ) : (
        <>
          <button
            onClick={fetchPages}
            className="px-3 py-1 bg-gray-200 rounded mb-4"
          >
            Refresh Pages
          </button>
          <h3 className="text-lg font-semibold mb-2">Your Facebook Pages:</h3>
          {loading ? (
            <div>Loading...</div>
          ) : pages.length === 0 ? (
            <div>No pages found.</div>
          ) : (
            <ul className="list-disc pl-6 mb-4">
              {pages.map((page) => (
                <li key={page.id} className="mb-2">
                  <span className="font-medium">{page.name}</span> (ID: {page.id})
                </li>
              ))}
            </ul>
          )}

          {/* Post to Page Form */}
          <form onSubmit={handlePost} className="mb-4 p-4 bg-gray-50 rounded">
            <label className="block mb-2 font-medium">Select Page:</label>
            <select
              className="w-full mb-2 p-2 border rounded"
              value={selectedPage}
              onChange={e => setSelectedPage(e.target.value)}
            >
              <option value="">-- Select a Page --</option>
              {pages.map(page => (
                <option key={page.id} value={page.id}>{page.name}</option>
              ))}
            </select>
            <label className="block mb-2 font-medium">Message:</label>
            <textarea
              className="w-full mb-2 p-2 border rounded"
              rows={3}
              value={postMessage}
              onChange={e => setPostMessage(e.target.value)}
              placeholder="Write your post here..."
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Post to Facebook Page
            </button>
          </form>
          {postResult && <div className="text-green-600 mb-2">{postResult}</div>}
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </>
      )}
    </div>
  );
};

export default FacebookManager; 