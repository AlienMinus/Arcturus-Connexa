import React, { useEffect, useState } from "react";
import ConversationItem from "./ConversationItem";

const ConversationList = ({ onSelectChat, searchTerm = "" }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let interval;
    const loadContacts = async () => {

      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/users', {
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
    return <div className="conversationList">Loading contacts...</div>;
  }

  if (error) {
    return <div className="conversationList">{error}</div>;
  }

  const filteredContacts = contacts.filter(contact => 
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="conversationList">
      {filteredContacts.map((contact) => (
        <ConversationItem
          key={contact.id}
          data={{
            id: contact.id,
            name: contact.name,
            msg: contact.lastMessage || contact.headline || 'Say hello',
            timestamp: contact.lastMessageTimestamp,
            unreadCount: contact.unreadCount,
            avatar: contact.avatar,
          }}
          onClick={() => onSelectChat(contact)}
        />
      ))}
    </div>
  );
};

export default ConversationList;