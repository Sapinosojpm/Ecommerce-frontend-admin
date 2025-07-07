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
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
        <b>Instructions:</b> Connect your Facebook account to manage and post to your Facebook Pages directly from this dashboard.<br/>
        <ul className="list-disc pl-5 mt-2">
          <li>Click <b>Connect Facebook Page</b> and complete the login.</li>
          <li>After connecting, select a page and write your message to post.</li>
          <li>If you don't see your pages, click <b>Refresh Pages</b>.</li>
        </ul>
      </div>
      {!connected ? (
        <>
          <button
            onClick={connectFacebook}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
          >
            Connect Facebook Page
          </button>
          <div className="mt-4 text-gray-600 text-sm">
            <b>Why can't I post?</b><br/>
            You need to connect your Facebook account first. Make sure pop-ups are allowed in your browser.
          </div>
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
            <div className="mb-4 text-yellow-700 bg-yellow-50 border border-yellow-200 p-3 rounded">
              <b>No pages found.</b> Make sure your Facebook account has at least one page you manage.<br/>
              <span className="text-xs">Try reconnecting or check your Facebook permissions.</span>
            </div>
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
          <form onSubmit={handlePost} className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
            <label className="block mb-2 font-medium">Select Page:</label>
            <select
              className="w-full mb-2 p-2 border rounded"
              value={selectedPage}
              onChange={e => setSelectedPage(e.target.value)}
              disabled={pages.length === 0}
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
              disabled={pages.length === 0}
            />
            <button
              type="submit"
              className={`px-4 py-2 w-full rounded mt-2 ${pages.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              disabled={pages.length === 0}
            >
              Post to Facebook Page
            </button>
          </form>
          {postResult && <div className="text-green-600 mb-2">{postResult}</div>}
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </>
      )}
      <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
        <b>Need help?</b> <br/>
        - Make sure you are an admin of the Facebook Page.<br/>
        - If you see errors, try reconnecting your Facebook account.<br/>
        - If the post fails, check your Facebook Page permissions and try again.<br/>
        - For further issues, contact your system administrator.
      </div>
    </div>
  );
};

export default FacebookManager; 