import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { Send, User, MessageCircle } from 'lucide-react';

const Chat: React.FC = () => {
  const { token, user } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all users to chat with
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/chat/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Filter out current user
          setUsers(data.filter((u: any) => u.id !== user?.id));
        }
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    };
    if (token) fetchUsers();
  }, [token, user]);

  // Fetch messages when a user is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) return;
      try {
        const res = await fetch(`/api/chat/messages?with_user_id=${selectedUser.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
          scrollToBottom();
        }
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    };

    fetchMessages();
    // In a real app, you'd use WebSockets here. For now, simple polling:
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedUser, token]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiver_id: selectedUser.id,
          content: newMessage
        })
      });
      
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setNewMessage('');
        scrollToBottom();
      }
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 h-[calc(100vh-100px)] flex gap-6">
      {/* User List Sidebar */}
      <div className="w-1/3 bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {users.map(u => (
            <div 
              key={u.id} 
              onClick={() => setSelectedUser(u)}
              className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-colors ${
                selectedUser?.id === u.id ? 'bg-blue-500/20 border border-blue-500/30' : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center font-bold text-sm uppercase">
                {u.name?.substring(0, 2) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{u.name}</div>
                <div className="text-xs text-gray-500 truncate">{u.email}</div>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="text-center text-gray-500 py-10">No other users found.</div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl flex flex-col overflow-hidden">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-white/10 flex items-center gap-4 bg-white/[0.02]">
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center font-bold uppercase">
                {selectedUser.name?.substring(0, 2) || 'U'}
              </div>
              <div>
                <h3 className="font-bold">{selectedUser.name}</h3>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Say hi to start the conversation!
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-4 rounded-2xl ${
                        isMe 
                          ? 'bg-blue-600 text-white rounded-tr-sm' 
                          : 'bg-zinc-800 text-gray-200 rounded-tl-sm'
                      }`}>
                        {msg.content}
                        <div className={`text-[10px] mt-2 opacity-50 ${isMe ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/[0.02] border-t border-white/10">
              <div className="flex items-center gap-4 bg-black border border-white/10 rounded-full p-2 pr-4">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent border-none focus:outline-none px-4 text-white"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
            <p>Select a user to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;