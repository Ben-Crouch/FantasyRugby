import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Chat = ({ leagueId, isActive, onUnreadCountChange }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState(null);
  const [lastReadTimestamp, setLastReadTimestamp] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Calculate unread messages count
  const calculateUnreadCount = (messages, lastReadTimestamp) => {
    if (!lastReadTimestamp || !messages.length) return 0;
    
    const unreadMessages = messages.filter(msg => {
      // Don't count messages from the current user
      if (msg.user_id === user?.id) return false;
      // Count messages newer than last read timestamp
      return new Date(msg.timestamp) > new Date(lastReadTimestamp);
    });
    
    return unreadMessages.length;
  };

  // Check for new messages only
  const checkForNewMessages = async () => {
    if (!leagueId || !isActive || !lastMessageTimestamp) return;
    
    try {
      const response = await fetch(`http://localhost:8001/api/leagues/${leagueId}/chat/messages/?limit=50&offset=0`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          // Find new messages since last timestamp
          const newMessages = data.messages.filter(msg => 
            new Date(msg.timestamp) > new Date(lastMessageTimestamp)
          );
          
          if (newMessages.length > 0) {
            setMessages(prev => [...prev, ...newMessages]);
            setLastMessageTimestamp(newMessages[newMessages.length - 1].timestamp);
            scrollToBottom();
          }
        }
      }
    } catch (error) {
      console.error('Error checking for new messages:', error);
    }
  };

  // Load messages
  const loadMessages = async (reset = false) => {
    if (!leagueId || !isActive) return;
    
    setLoading(true);
    try {
      const currentOffset = reset ? 0 : offset;
      const response = await fetch(`http://localhost:8001/api/leagues/${leagueId}/chat/messages/?limit=50&offset=${currentOffset}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (reset) {
          setMessages(data.messages || []);
          setOffset(50);
          // Set the timestamp of the newest message
          if (data.messages && data.messages.length > 0) {
            setLastMessageTimestamp(data.messages[0].timestamp);
            // Set last read timestamp to current time when actively viewing chat
            if (isActive) {
              setLastReadTimestamp(new Date().toISOString());
            }
          }
        } else {
          setMessages(prev => [...prev, ...(data.messages || [])]);
          setOffset(prev => prev + 50);
        }
        setHasMore(data.has_more || false);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load participants
  const loadParticipants = async () => {
    if (!leagueId || !isActive) return;
    
    try {
      const response = await fetch(`http://localhost:8001/api/leagues/${leagueId}/chat/participants/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants || []);
        
        // Set last read timestamp from participant data
        const currentUserParticipant = data.participants?.find(p => p.user_id === user?.id);
        if (currentUserParticipant?.last_read_at) {
          setLastReadTimestamp(currentUserParticipant.last_read_at);
        }
      }
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  // Join chat
  const joinChat = async () => {
    if (!user?.id || !leagueId) return;
    
    try {
      const response = await fetch(`http://localhost:8001/api/leagues/${leagueId}/chat/participants/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ user_id: user.id })
      });
      
      if (response.ok) {
        console.log('Joined chat successfully');
      }
    } catch (error) {
      console.error('Error joining chat:', error);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.id || sending) return;
    
    setSending(true);
    try {
      const response = await fetch(`http://localhost:8001/api/leagues/${leagueId}/chat/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          user_id: user.id,
          message: newMessage.trim(),
          message_type: 'text'
        })
      });
      
      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
        setLastMessageTimestamp(newMsg.timestamp);
        setNewMessage('');
        scrollToBottom();
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Update read status
  const updateReadStatus = async () => {
    if (!user?.id || !leagueId) return;
    
    try {
      await fetch(`http://localhost:8001/api/leagues/${leagueId}/chat/users/${user.id}/read-status/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Error updating read status:', error);
    }
  };

  // Load data on mount and when leagueId changes
  useEffect(() => {
    if (leagueId && isActive) {
      joinChat();
      loadMessages(true);
      loadParticipants();
    }
  }, [leagueId, isActive]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!leagueId || !isActive) return;
    
    const interval = setInterval(() => {
      checkForNewMessages();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [leagueId, isActive, lastMessageTimestamp]);

  // Update read status when messages change
  useEffect(() => {
    if (messages.length > 0) {
      updateReadStatus();
    }
  }, [messages]);

  // Update unread count and notify parent
  useEffect(() => {
    const count = calculateUnreadCount(messages, lastReadTimestamp);
    setUnreadCount(count);
    if (onUnreadCountChange) {
      onUnreadCountChange(count);
    }
  }, [messages, lastReadTimestamp, user?.id]);

  // Mark messages as read when chat becomes active
  useEffect(() => {
    if (isActive) {
      const currentTime = new Date().toISOString();
      setLastReadTimestamp(currentTime);
      // Update read status on server
      updateReadStatus();
    }
  }, [isActive]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (!isActive) return null;

  return (
    <div className="card" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-light)',
        backgroundColor: 'var(--neutral-50)',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: 'var(--databricks-blue)', fontSize: '18px' }}>
            💬 League Chat
          </h3>
          <div style={{ fontSize: '14px', color: 'var(--neutral-600)' }}>
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column' // Normal column direction
      }}>
        {loading && messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--neutral-600)', padding: '20px' }}>
            Loading messages...
          </div>
        )}
        
        {messages.length === 0 && !loading && (
          <div style={{ textAlign: 'center', color: 'var(--neutral-600)', padding: '20px' }}>
            No messages yet. Start the conversation!
          </div>
        )}
        
        {messages.slice().reverse().map((message, index) => (
          <div
            key={`${message.id}-${index}`}
            style={{
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: message.user_id === user?.id ? 'var(--databricks-light-blue)' : 'var(--neutral-100)',
              alignSelf: message.user_id === user?.id ? 'flex-end' : 'flex-start',
              maxWidth: '70%',
              wordWrap: 'break-word'
            }}
          >
            <div style={{
              fontSize: '12px',
              color: 'var(--neutral-600)',
              marginBottom: '4px',
              fontWeight: '600'
            }}>
              {message.username} • {formatTimestamp(message.timestamp)}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--neutral-800)',
              lineHeight: '1.4'
            }}>
              {message.message}
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border-light)',
        backgroundColor: 'var(--neutral-50)',
        borderRadius: '0 0 8px 8px'
      }}>
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid var(--border-light)',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white'
            }}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            style={{
              padding: '10px 20px',
              backgroundColor: sending ? 'var(--neutral-300)' : 'var(--databricks-blue)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: sending ? 'not-allowed' : 'pointer',
              opacity: sending ? 0.6 : 1
            }}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
