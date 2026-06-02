import React, { useEffect, useState } from "react";
import ConversationItem from "./ConversationItem";

const ConversationList = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadContacts = async () => {
      setLoading(true);
      setError(null);

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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, []);

  if (loading) {
    return <div className="conversationList">Loading contacts...</div>;
  }

  if (error) {
    return <div className="conversationList">{error}</div>;
  }

  return (
    <div className="conversationList">
      {contacts.map((contact) => (
        <ConversationItem
          key={contact.id}
          data={{
            id: contact.id,
            name: contact.name,
            msg: contact.headline || 'Say hello',
            avatar: contact.avatar,
          }}
        />
      ))}
    </div>
  );
};

export default ConversationList;