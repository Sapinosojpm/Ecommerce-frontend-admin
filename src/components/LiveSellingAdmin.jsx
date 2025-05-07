import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  transports: ['websocket'],
  autoConnect: true,
  reconnectionAttempts: 5
});

const LiveStreamHost = () => {
  const localVideoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [permissionError, setPermissionError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const peerConnections = useRef({});
  const pendingIceCandidates = useRef({});
  const chatBoxRef = useRef(null);
  const [apiError, setApiError] = useState(null);
  const [isAlreadyLive, setIsAlreadyLive] = useState(false);


  // Auto-scroll chat
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [comments]);

  // Get available media devices
  const getMediaDevices = async () => {
    try {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error enumerating devices:', error);
    }
  };

  // Check media permissions
  const checkMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionError(null);
      return true;
    } catch (error) {
      console.error('Permission check failed:', error);
      setPermissionError(getPermissionErrorMessage(error));
      return false;
    }
  };

  const getPermissionErrorMessage = (error) => {
    switch (error.name) {
      case 'NotAllowedError':
        return 'Camera/microphone access was denied. Please grant permissions.';
      case 'NotFoundError':
        return 'No media devices found. Please check your camera/microphone.';
      case 'NotReadableError':
        return 'Camera/microphone is already in use by another application.';
      case 'OverconstrainedError':
        return 'Cannot satisfy the requested constraints. Try different settings.';
      default:
        return 'Could not access camera/microphone. Please check your devices.';
    }
  };

  // Update stream status in database - FIXED function
  const updateStreamStatus = async (isLive) => {
    try {
      setApiError(null);
      console.log('Updating stream status to:', isLive);
      
      // Make API call to update status
      const response = await fetch('http://localhost:4000/api/livestream/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isLive })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update stream status: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Stream status updated in database:', data);
      return true;
      
    } catch (error) {
      console.error('Error updating stream status:', error);
      setApiError(`Failed to update stream status. ${error.message}`);
      return false;
    }
  };

  // Start streaming
  const startStream = async () => {
    try {
      const hasPermissions = await checkMediaPermissions();
      if (!hasPermissions) return;
  
      console.log('Requesting media devices...');
      const constraints = {
        video: selectedDevice ? { 
          deviceId: { exact: selectedDevice },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
  
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Update database status first
      const statusUpdated = await updateStreamStatus(true);
      if (!statusUpdated) {
        console.error('Failed to update stream status in database');
        // Stop acquired media stream since we won't proceed
        mediaStream.getTracks().forEach(track => track.stop());
        return;
      }
      
      setStream(mediaStream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }
      
      // Emit both admin-join and stream-started events
      socket.emit('admin-join');
      socket.emit('admin-start-stream');
      
      setIsStreaming(true);
      setPermissionError(null);
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setPermissionError(getPermissionErrorMessage(error));
    }
  };

  // Stop streaming
  const stopStream = async () => {
    // Update database status first
    const statusUpdated = await updateStreamStatus(false);
    if (!statusUpdated) {
      console.error('Failed to update stream status in database, but will stop local stream anyway');
    }
    
    setIsStreaming(false);
    socket.emit('stop-stream');
    stopAllConnections();
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject = null;
    }
    
    console.log('Stream stopped');
  };

  // Toggle streaming
  const toggleStream = () => {
    if (isStreaming) {
      stopStream();
    } else {
      startStream();
    }
  };

  // Create peer connection for a viewer
  const createPeerConnection = async (viewerId) => {
    try {
      if (peerConnections.current[viewerId]) {
        console.log('Closing existing connection for viewer:', viewerId);
        peerConnections.current[viewerId].close();
      }
      
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      });

      peerConnections.current[viewerId] = pc;
      
      // Add local stream tracks to peer connection
      if (stream) {
        stream.getTracks().forEach(track => {
          console.log('Adding track to peer connection:', track.kind);
          pc.addTrack(track, stream);
        });
      }
      
      // ICE candidate handling
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Sending ICE candidate to viewer:', viewerId);
          socket.emit('ice-candidate', {
            target: viewerId,
            candidate: event.candidate
          });
        }
      };
      
      // Connection state monitoring
      pc.onconnectionstatechange = () => {
        console.log(`Connection state for ${viewerId}:`, pc.connectionState);
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          console.log(`Connection to viewer ${viewerId} failed or disconnected`);
          delete peerConnections.current[viewerId];
        }
      };
      
      pc.oniceconnectionstatechange = () => {
        console.log(`ICE connection state for ${viewerId}:`, pc.iceConnectionState);
      };

      // Create and send offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false
      });
      
      await pc.setLocalDescription(offer);
      console.log('Created offer for viewer:', viewerId);
      
      socket.emit('offer', {
        target: viewerId,
        offer: pc.localDescription
      });
      
    } catch (error) {
      console.error('Error creating peer connection:', error);
    }
  };

  // Stop all WebRTC connections
  const stopAllConnections = () => {
    console.log('Stopping all connections');
    Object.keys(peerConnections.current).forEach(viewerId => {
      if (peerConnections.current[viewerId]) {
        peerConnections.current[viewerId].close();
      }
    });
    peerConnections.current = {};
    pendingIceCandidates.current = {};
  };

  // Handle chat comments
  const handlePostComment = () => {
    if (comment.trim()) {
      socket.emit('post-comment', { comment, name: 'Admin' });
      
      // Also save comment to database
      saveCommentToDatabase('Admin', comment);
      
      setComment('');
    }
  };
  
  // Save comment to database
  const saveCommentToDatabase = async (name, comment) => {
    try {
      const response = await fetch('http://localhost:4000/api/livestream/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, comment })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save comment');
      }
      
      console.log('Comment saved to database');
    } catch (error) {
      console.error('Error saving comment:', error);
    }
  };

  // Check stream status on component mount
  useEffect(() => {
    const checkStreamStatus = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/livestream/status');
        if (response.ok) {
          const data = await response.json();
          console.log('Initial stream status:', data);
          if (data.isLive) {
            console.log('Stream is already active in database');
            setIsAlreadyLive(true);
            setIsStreaming(true);
          }
        }
      } catch (error) {
        console.error('Failed to check stream status:', error);
      }
    };
  
    checkStreamStatus();
    getMediaDevices();
  }, []);
  

  // Socket event listeners
  useEffect(() => {
    socket.on('viewer-count', (count) => {
      setViewers(count);
    });

    socket.on('viewer-join', async (viewerId) => {
      console.log('Viewer joined:', viewerId);
      if (isStreaming && stream) {
        createPeerConnection(viewerId);
      }
    });

    socket.on('answer', async ({ viewerId, answer }) => {
      console.log('Received answer from viewer:', viewerId);
      const pc = peerConnections.current[viewerId];
      
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          
          // Add any pending ICE candidates
          if (pendingIceCandidates.current[viewerId]) {
            for (const candidate of pendingIceCandidates.current[viewerId]) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            delete pendingIceCandidates.current[viewerId];
          }
        } catch (error) {
          console.error('Error setting remote description:', error);
        }
      }
    });

    socket.on('ice-candidate', async ({ viewerId, candidate }) => {
      const pc = peerConnections.current[viewerId];
      
      if (pc) {
        try {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            // Store candidate if remote description isn't set yet
            if (!pendingIceCandidates.current[viewerId]) {
              pendingIceCandidates.current[viewerId] = [];
            }
            pendingIceCandidates.current[viewerId].push(candidate);
          }
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

    socket.on('new-comment', (newComment) => {
      setComments(prev => [...prev, newComment]);
    });

    return () => {
      stopAllConnections();
      socket.off('viewer-count');
      socket.off('viewer-join');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('new-comment');
    };
  }, [isStreaming, stream]);

  return (
    <div className="max-w-6xl p-6 mx-auto space-y-6 bg-gray-200 shadow-lg rounded-xl">
      {/* API Error display */}
      {apiError && (
        <div className="p-4 text-center bg-red-100 rounded-md">
          <p className="text-red-800">{apiError}</p>
          <button 
            onClick={() => setApiError(null)}
            className="px-4 py-2 mt-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Permission error display */}
      {permissionError && (
        <div className="p-4 text-center bg-red-100 rounded-md">
          <p className="text-red-800">{permissionError}</p>
          <button 
            onClick={startStream}
            className="px-4 py-2 mt-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            {isStreaming ? 'You\'re Live!' : 'Stream Setup'}
          </h2>
          <p className="text-sm text-gray-600">
            {viewers} {viewers === 1 ? 'viewer' : 'viewers'} watching
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleStream} 
            className={`px-4 py-2 text-white ${isStreaming ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} rounded-md`}
          >
            {isStreaming ? 'Stop Stream' : 'Start Stream'}
          </button>
          {isStreaming && (
            <span className="flex items-center px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-full">
              <span className="w-3 h-3 mr-2 bg-white rounded-full animate-pulse"></span>
              LIVE
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {/* Device selection */}
            {!isStreaming && devices.length > 0 && (
              <div className="p-4 bg-white rounded-lg shadow">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Select Camera
                </label>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {devices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Video preview/stream */}
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full bg-black rounded-lg shadow-md aspect-video"
            />
            
         
          </div>
        </div>

        <div className="space-y-4">
          {/* Live Chat */}
          <div className="p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white">Live Chat</h3>
            <div ref={chatBoxRef} className="h-64 mt-3 space-y-3 overflow-y-auto">
              {comments.map((msg, i) => (
                <div key={i} className="p-2 bg-gray-700 rounded-md shadow-sm">
                  <p className="text-sm font-semibold text-blue-400">
                    {msg.name || 'Anonymous'}
                  </p>
                  <p className="text-sm text-white">{msg.comment}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-gray-400">
                  No messages yet. Be the first to chat!
                </p>
              )}
            </div>
            <div className="flex mt-3">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                className="flex-1 p-2 border border-gray-300 rounded-l-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Send a message..."
              />
              <button
                onClick={handlePostComment}
                className="px-4 py-2 text-white bg-gray-600 rounded-r-md hover:bg-gray-700 disabled:opacity-50"
                disabled={!comment.trim()}
              >
                Send
              </button>
            </div>
          </div>

          {/* Connection info */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800">Stream Info</h3>
            <div className="mt-2 space-y-2 text-sm text-gray-600">
              <p>Status: {isStreaming ? 'Live' : 'Offline'}</p>
              <p>Viewers: {viewers}</p>
              <p>Active connections: {Object.keys(peerConnections.current).length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamHost;