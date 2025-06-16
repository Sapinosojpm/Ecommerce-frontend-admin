import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Send, Paperclip, User, Clock } from 'lucide-react';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const AdminLiveChat = () => {
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SOCKET_URL);
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  // Fetch active chats on component mount
  useEffect(() => {
    const fetchActiveChats = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/chat/admin/active-chats`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setActiveChats(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching active chats:', error);
        setLoading(false);
      }
    };

    fetchActiveChats();
  }, []);

  // Set up socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('new-chat-request', (chatData) => {
      setActiveChats(prev => {
        const existingChat = prev.find(chat => chat.userId === chatData.userId);
        if (existingChat) {
          return prev.map(chat => 
            chat.userId === chatData.userId 
              ? { ...chat, unreadCount: chat.unreadCount + 1 } 
              : chat
          );
        } else {
          return [
            ...prev,
            {
              userId: chatData.userId,
              userName: chatData.userName,
              lastMessage: { message: chatData.initialMessage },
              unreadCount: 1
            }
          ];
        }
      });
    });

    return () => {
      socket.off('new-chat-request');
    };
  }, [socket]);

  // Fetch messages when a chat is selected
  useEffect(() => {
    if (!selectedChat) return;

    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/chat/conversation/${selectedChat.userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setMessages(data);
        markMessagesAsRead(selectedChat.userId);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [selectedChat]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const markMessagesAsRead = async (senderId) => {
    try {
      await axios.put(`${backendUrl}/api/chat/read/${senderId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setActiveChats(prev => 
        prev.map(chat => 
          chat.userId === senderId 
            ? { ...chat, unreadCount: 0 } 
            : chat
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const { data } = await axios.post(`${backendUrl}/api/chat/admin/reply`, {
        userId: selectedChat.userId,
        message: newMessage
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setMessages(prev => [...prev, data]);
      setNewMessage('');
      socket.emit('admin-message', data);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileUpload = async (e) => {
    if (!selectedChat) return;

    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/chat/upload/${selectedChat.userId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setMessages(prev => [...prev, data]);
      socket.emit('admin-message', data);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Chat list sidebar */}
      <div className="flex flex-col bg-white border-r border-gray-200 w-80">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Active Chats</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {activeChats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No active chats
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {activeChats.map(chat => (
                <div
                  key={chat.userId}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedChat?.userId === chat.userId ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {chat.userAvatar ? (
                        <img
                          src={chat.userAvatar}
                          alt={chat.userName}
                          className="object-cover w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-300 rounded-full">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                      {chat.unreadCount > 0 && (
                        <div className="absolute flex items-center justify-center w-5 h-5 text-xs text-white bg-blue-500 rounded-full -top-1 -right-1">
                          {chat.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {chat.userName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {chat.lastMessage?.message || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-col flex-1">
        {selectedChat ? (
          <>
            {/* Chat header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {selectedChat.userAvatar ? (
                  <img
                    src={selectedChat.userAvatar}
                    alt={selectedChat.userName}
                    className="object-cover w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-300 rounded-full">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedChat.userName}
                  </h3>
                  <p className="flex items-center text-sm text-green-500">
                    <div className="w-2 h-2 mr-2 bg-green-500 rounded-full"></div>
                    Active now
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.isAdminMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isAdminMessage
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      
                      {/* Display attachments */}
                      {message.attachments?.map((attachment, idx) => (
                        <div key={idx} className="mt-2">
                          {attachment.type === 'image' ? (
                            <img 
                              src={attachment.url} 
                              alt="Attachment" 
                              className="object-cover max-w-full rounded-lg max-h-48"
                            />
                          ) : (
                            <a 
                              href={attachment.url} 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-3 py-1 text-xs text-gray-700 transition-colors bg-gray-200 rounded hover:bg-gray-300"
                            >
                              Download File
                            </a>
                          )}
                        </div>
                      ))}

                      {/* Display order/product references */}
                      {message.orderReference && (
                        <div className="mt-2">
                          <span className="inline-block px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full">
                            Order #{message.orderReference.orderNumber}
                          </span>
                        </div>
                      )}

                      {message.productReference && (
                        <div className="mt-2">
                          <span className="inline-block px-2 py-1 text-xs text-purple-800 bg-purple-100 rounded-full">
                            Product: {message.productReference.name}
                          </span>
                        </div>
                      )}

                      <div className={`text-xs mt-2 flex items-center ${
                        message.isAdminMessage ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(message.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <label htmlFor="file-upload">
                  <button
                    type="button"
                    className="p-2 text-gray-500 transition-colors rounded-full hover:text-gray-700 hover:bg-gray-100"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                </label>
                
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="flex items-center px-4 py-2 space-x-2 text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 bg-gray-50">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                Select a chat to start messaging
              </h3>
              <p className="text-gray-500">
                Choose a conversation from the sidebar to begin chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLiveChat;