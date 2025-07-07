import React, { useState, useEffect } from 'react';

// Use environment variable or fallback to relative path
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const FACEBOOK_AUTH_URL = BACKEND_URL + '/api/auth/facebook';
const FACEBOOK_PAGES_URL = BACKEND_URL + '/api/facebook/pages';
const FACEBOOK_POST_URL = BACKEND_URL + '/api/facebook/post';
const PRODUCT_LIST_URL = BACKEND_URL + '/api/product/list';

const FacebookManager = () => {
  const [pages, setPages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPage, setSelectedPage] = useState('');
  const [postMessage, setPostMessage] = useState('');
  const [postResult, setPostResult] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(PRODUCT_LIST_URL, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      } else {
        setProducts([]);
      }
    } catch (err) {
      setProducts([]);
    }
  };

  const handleProductChange = (e) => {
    const productId = e.target.value;
    setSelectedProduct(productId);
    if (!productId) {
      setPostMessage('');
      return;
    }
    const product = products.find(p => p._id === productId);
    if (product) {
      const msg = `New Product: ${product.name}\nPrice: $${product.finalPrice ?? product.price}\n${product.description ?? ''}`;
      setPostMessage(msg);
    }
  };

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
    let product = null;
    if (selectedProduct) {
      product = products.find(p => p._id === selectedProduct);
      if (product) {
        product = {
          name: product.name,
          price: product.finalPrice ?? product.price,
          description: product.description,
          imageUrl: Array.isArray(product.image) ? product.image[0] : product.image
        };
      }
    }
    try {
      const res = await fetch(FACEBOOK_POST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pageId: selectedPage, message: postMessage, product })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to post');
      setPostResult('Successfully posted! Post ID: ' + data.id);
      setPostMessage('');
      setSelectedProduct('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-xl p-6 mx-auto bg-white rounded shadow">
      <h2 className="mb-4 text-2xl font-bold">Facebook Page Manager</h2>
      <div className="p-3 mb-4 text-sm text-blue-800 border border-blue-200 rounded bg-blue-50">
        <b>Instructions:</b> Connect your Facebook account to manage and post to your Facebook Pages directly from this dashboard.<br/>
        <ul className="pl-5 mt-2 list-disc">
          <li>Click <b>Connect Facebook Page</b> and complete the login.</li>
          <li>After connecting, select a page and product, then write or edit your message to post.</li>
          <li>If you don't see your pages, click <b>Refresh Pages</b>.</li>
        </ul>
      </div>
      {!connected ? (
        <>
          <button
            onClick={connectFacebook}
            className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Connect Facebook Page
          </button>
          <div className="mt-4 text-sm text-gray-600">
            <b>Why can't I post?</b><br/>
            You need to connect your Facebook account first. Make sure pop-ups are allowed in your browser.
          </div>
          {error && <div className="mt-2 text-red-500">{error}</div>}
        </>
      ) : (
        <>
          <button
            onClick={fetchPages}
            className="px-3 py-1 mb-4 bg-gray-200 rounded"
          >
            Refresh Pages
          </button>
          <h3 className="mb-2 text-lg font-semibold">Your Facebook Pages:</h3>
          {loading ? (
            <div>Loading...</div>
          ) : pages.length === 0 ? (
            <div className="p-3 mb-4 text-yellow-700 border border-yellow-200 rounded bg-yellow-50">
              <b>No pages found.</b> Make sure your Facebook account has at least one page you manage.<br/>
              <span className="text-xs">Try reconnecting or check your Facebook permissions.</span>
            </div>
          ) : (
            <ul className="pl-6 mb-4 list-disc">
              {pages.map((page) => (
                <li key={page.id} className="mb-2">
                  <span className="font-medium">{page.name}</span> (ID: {page.id})
                </li>
              ))}
            </ul>
          )}

          {/* Post to Page Form */}
          <form onSubmit={handlePost} className="p-4 mb-4 border border-gray-200 rounded bg-gray-50">
            <label className="block mb-2 font-medium">Select Page:</label>
            <select
              className="w-full p-2 mb-2 border rounded"
              value={selectedPage}
              onChange={e => setSelectedPage(e.target.value)}
              disabled={pages.length === 0}
            >
              <option value="">-- Select a Page --</option>
              {pages.map(page => (
                <option key={page.id} value={page.id}>{page.name}</option>
              ))}
            </select>

            <label className="block mb-2 font-medium">Select Product (optional):</label>
            <select
              className="w-full p-2 mb-2 border rounded"
              value={selectedProduct}
              onChange={handleProductChange}
              disabled={products.length === 0}
            >
              <option value="">-- Select a Product --</option>
              {products.map(product => (
                <option key={product._id} value={product._id}>{product.name}</option>
              ))}
            </select>

            <label className="block mb-2 font-medium">Message:</label>
            <textarea
              className="w-full p-2 mb-2 border rounded"
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
          {postResult && <div className="mb-2 text-green-600">{postResult}</div>}
          {error && <div className="mt-2 text-red-500">{error}</div>}
        </>
      )}
      <div className="p-3 mt-6 text-xs text-gray-600 border border-gray-200 rounded bg-gray-50">
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