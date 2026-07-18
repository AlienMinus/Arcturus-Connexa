import React, { useState, useEffect, useRef } from "react";
import { FaTimes, FaPaperPlane, FaLock } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import "./ChatWindow.css";

const ChatWindow = ({ contact, closeChat }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let interval;
    const fetchMessages = async () => {
      if (!contact) return;
      try {
        const token = localStorage.getItem('authToken');
        const contactId = contact.id || contact._id;
        // Assuming your API supports fetching conversation with a user by ID
        const response = await fetch(`/api/messages/${contactId}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        });

        if (!response.ok) throw new Error("Failed to load messages");
        const data = await response.json();
        setMessages(data.messages || data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchMessages();
    interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [contact]);

  useEffect(() => {
    // Auto-scroll to bottom whenever messages update
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    const token = localStorage.getItem('authToken');
    const messageToSend = newMessage;
    setNewMessage("");

    try {
      const contactId = contact.id || contact._id;
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({
          receiverId: contactId,
          content: messageToSend,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      const savedMessage = await response.json();
      
      setMessages(prev => [...prev, savedMessage.message || savedMessage]);
    } catch (err) {
      console.error(err);
      alert("Failed to send message");
    }
  };

  const renderMessageContent = (content) => {
    if (!content) return null;
    const urlRegex = /((?:https?:\/\/|www\.)[^\s]+)/gi;
    const parts = content.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        const href = part.startsWith('www.') ? `https://${part}` : part;
        return (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline', fontWeight: '500' }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  if (!contact) return null;

  return (
    <div className="chatWindow">
      <div className="chatHeader">
        <div className="chatHeaderInfo">
          {contact.avatar?.url ? (
            <img src={contact.avatar.url} alt={contact.name} className="chatHeaderAvatar" />
          ) : (
            <CgProfile className="chatHeaderAvatar chatAvatarFallback" />
          )}
          <span>{contact.name}</span>
        </div>
        <div className="chatHeaderActions">
          <FaTimes style={{ cursor: "pointer" }} onClick={closeChat} color="#666" />
        </div>
      </div>

      <div className="chatMessages">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '7px', color: '#666', padding: '12px 10px', textAlign: 'center' }}>
          <FaLock size={6} />
          <span>Messages are end-to-end encrypted. No one outside of this chat can read them.</span>
        </div>
        {loading ? (
          <div className="loadingMessages">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="noMessages">No messages yet. Say hello!</div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId !== (contact.id || contact._id);
            return (
              <div key={msg._id || msg.id || idx} className={`messageBubble ${isMe ? 'sent' : 'received'}`}>
                <p>{renderMessageContent(msg.content)}</p>
                <span className="messageTime">
                  {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatInputArea">
        <textarea
          placeholder="Write a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button 
          onClick={handleSend} 
          disabled={!newMessage.trim()}
          className="sendBtn"
        >
          <FaPaperPlane size={14} style={{ marginLeft: "-2px" }} />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;