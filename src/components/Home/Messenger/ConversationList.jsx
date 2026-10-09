import React, { useEffect, useState } from "react";
import { buildApiUrl } from "../../../utils/api";
import ConversationItem from "./ConversationItem";

const ConversationList = ({ onSelectChat, searchTerm = "", activeTab = "focused", filterMode = "all" }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let interval;
    const loadContacts = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(buildApiUrl('/users'), {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        });

        if (!response.ok) {
          const json = await response.json().catch(() => null);
          throw new Error(json?.error || 'Failed to load contacts');
        }

        const data = await response.json();
        setContacts(data.contacts || []);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    loadContacts();
    interval = setInterval(loadContacts, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="conversationList conversationListState">Loading conversations...</div>;
  }

  if (error) {
    return <div className="conversationList conversationListState conversationError">{error}</div>;
  }

  // 1. Sort contacts by most recent message timestamp
  const sortedContacts = [...contacts].sort((a, b) => {
    const timeA = a.lastMessageTimestamp ? new Date(a.lastMessageTimestamp).getTime() : 0;
    const timeB = b.lastMessageTimestamp ? new Date(b.lastMessageTimestamp).getTime() : 0;
    if (timeA && timeB) return timeB - timeA;
    if (timeA) return -1;
    if (timeB) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  // 2. Filter contacts by activeTab: Focused (followers/following/connections) vs Other (non-followers)
  const tabFilteredContacts = sortedContacts.filter((contact) => {
    if (activeTab === "focused") {
      return Boolean(contact.isFocused);
    }
    if (activeTab === "other") {
      return !contact.isFocused;
    }
    return true;
  });

  // 3. Filter by search term & unread filter mode
  const filteredContacts = tabFilteredContacts.filter((contact) => {
    if (filterMode === "unread" && !(contact.unreadCount > 0)) {
      return false;
    }
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(term) ||
      contact.username?.toLowerCase().includes(term) ||
      contact.lastMessage?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="conversationList">
      {filteredContacts.length === 0 ? (
        <div className="conversationEmptyState">
          <p>
            {searchTerm
              ? "No conversations match your search"
              : activeTab === "focused"
              ? "No focused messages yet"
              : "No other messages yet"}
          </p>
          <span className="emptyStateSubtext">
            {searchTerm
              ? "Try searching for a different name or message keyword."
              : activeTab === "focused"
              ? "Conversations with your connections, followers, and following will appear here."
              : "Messages from members outside your network will appear here."}
          </span>
        </div>
      ) : (
        filteredContacts.map((contact) => (
          <ConversationItem
            key={contact.id || contact._id}
            data={{
              id: contact.id || contact._id,
              name: contact.name,
              msg: contact.lastMessage || contact.headline || "Say hello",
              timestamp: contact.lastMessageTimestamp,
              unreadCount: contact.unreadCount,
              avatar: contact.avatar,
            }}
            onClick={() => onSelectChat(contact)}
          />
        ))
      )}
    </div>
  );
};

export default ConversationList;