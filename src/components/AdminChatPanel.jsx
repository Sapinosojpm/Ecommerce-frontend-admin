// AdminChatPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const AdminChatPanel = () => {
  const [activeChats, setActiveChats] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Use the special admin token from environment variables
    const adminToken = process.env.REACT_APP_ADMIN_SECRET_TOKEN;
    if (!adminToken) {
      console.error('Admin token not configured');
      return;
    }

    const newSocket = io(process.env.REACT_APP_API_URL, {
      auth: { token: adminToken },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    // Setup event listeners
    newSocket.on('connect', () => {
      console.log('Admin connected to chat server');
      newSocket.emit('authenticate', adminToken);
    });

    newSocket.on('user-connected', (userId) => {
      setOnlineUsers(prev => [...new Set([...prev, userId])]);
    });

    newSocket.on('user-disconnected', (userId) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    newSocket.on('chat-message', (message) => {
      if (message.sender === selectedUser) {
        setMessages(prev => [...prev, message]);
      }
      if (!activeChats.includes(message.sender)) {
        setActiveChats(prev => [...prev, message.sender]);
      }
    });

    newSocket.on('user-typing', ({ userId, typing }) => {
      if (userId === selectedUser) {
        setIsTyping(typing);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);



  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedUser && socket) {
      // Load chat history for selected user
      socket.emit('get-chat-history', selectedUser, (history) => {
        setMessages(history);
      });
    }
  }, [selectedUser, socket]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !socket) return;

    const message = {
      sender: 'admin',
      recipient: selectedUser,
      text: newMessage,
      timestamp: new Date().toISOString(),
      isAdmin: true
    };

    socket.emit('chat-message', message);
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (socket && selectedUser) {
      socket.emit('admin-typing', { userId: selectedUser, typing: e.target.value.length > 0 });
    }
  };

  return (
    <div className="fixed bottom-0 right-0 z-50 w-full overflow-hidden bg-white rounded-t-lg shadow-lg md:w-96">
      <div className="flex items-center justify-between p-3 text-white bg-gray-800">
        <h3 className="font-semibold">Admin Chat Panel</h3>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 text-xs bg-green-500 rounded-full">
            {onlineUsers.length} Online
          </span>
        </div>
      </div>

      <div className="flex h-96">
        {/* User list */}
        <div className="w-1/3 overflow-y-auto border-r border-gray-200">
          {activeChats.length === 0 ? (
            <div className="p-3 text-center text-gray-500">
              No active chats
            </div>
          ) : (
            activeChats.map(userId => (
              <div
                key={userId}
                onClick={() => setSelectedUser(userId)}
                className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                  selectedUser === userId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      onlineUsers.includes(userId) ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  ></div>
                  <span className="truncate">User {userId.slice(0, 6)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat area */}
        <div className="flex flex-col w-2/3">
          {selectedUser ? (
            <>
              <div className="flex-1 p-3 overflow-y-auto bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No messages yet
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`mb-2 flex ${
                        msg.isAdmin ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs p-2 rounded-lg ${
                          msg.isAdmin
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p className="mt-1 text-xs opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {isTyping && (
                  <div className="flex justify-start mb-2">
                    <div className="p-2 text-gray-800 bg-gray-200 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200">
                <div className="flex">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-500 rounded-r-lg hover:bg-blue-600 disabled:bg-gray-400"
                    disabled={!newMessage.trim()}
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a user to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatPanel;