import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaPaperPlane, FaLock } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { buildApiUrl } from "../../../utils/api";
import "./ChatWindow.css";

const ChatWindow = ({ contact, closeChat }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const getInitials = (name) =>
    name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '';

  useEffect(() => {
    let interval;
    const fetchMessages = async () => {
      if (!contact) return;
      try {
        const token = localStorage.getItem('authToken');
        const contactId = contact.id || contact._id;
        const response = await fetch(buildApiUrl(`/messages/${contactId}`), {
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    const token = localStorage.getItem('authToken');
    const messageToSend = newMessage;
    setNewMessage("");

    try {
      const contactId = contact.id || contact._id;
      const response = await fetch(buildApiUrl('/messages'), {
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

  const renderTextWithLinks = (text) => {
    if (!text) return null;
    const urlRegex = /((?:https?:\/\/|www\.)[^\s]+)/gi;
    const parts = text.split(urlRegex);
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

  const renderMessageContent = (content) => {
    if (!content) return null;
    const taleReplyMatch = content.match(/^\[(?:Replied to Tale|Tale Reply):\s*"?(.*?)"?\]\n?([\s\S]*)$/i);
    if (taleReplyMatch) {
      const taleSnippet = taleReplyMatch[1];
      const replyBody = taleReplyMatch[2];
      return (
        <div className="taleReplyMessageWrapper">
          <div className="taleReplyEmbeddedCard">
            <span className="taleReplyEmbedBadge">📖 Tale Story</span>
            <p className="taleReplyEmbedSnippet">{taleSnippet}</p>
          </div>
          {replyBody && <p className="taleReplyMessageText">{renderTextWithLinks(replyBody)}</p>}
        </div>
      );
    }
    return renderTextWithLinks(content);
  };

  if (!contact) return null;
  const targetUsername = contact.username || contact.userId?.username || contact.name || '';
  const profileLink = targetUsername ? `/profile/${encodeURIComponent(targetUsername)}` : '#';

  return (
    <div className="chatWindow">
      <div className="chatHeader">
        <Link
          to={profileLink}
          className="chatHeaderInfo"
          style={{ textDecoration: 'none', color: 'inherit' }}
          title={`View ${contact.name}'s profile`}
        >
          {contact.avatar?.url ? (
            <img src={contact.avatar.url} alt={contact.name} className="chatHeaderAvatar" />
          ) : (
            <div className="chatHeaderAvatar chatHeaderAvatarFallback">
              {getInitials(contact.name) || <CgProfile size={18} />}
            </div>
          )}
          <span>{contact.name}</span>
        </Link>
        <div className="chatHeaderActions">
          <button className="chatBackButton" type="button" onClick={closeChat} aria-label="Back to conversations">
            <FaArrowLeft />
            <span>Back</span>
          </button>
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
