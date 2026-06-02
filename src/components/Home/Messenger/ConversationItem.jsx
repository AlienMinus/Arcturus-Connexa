import React from "react";

const ConversationItem = ({ data }) => {
  const getInitials = (name) =>
    name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '';

  return (
    <div className="conversationItem">

      {data.avatar?.url ? (
        <img
          src={data.avatar.url}
          className="chatAvatar"
          alt={data.name}
        />
      ) : (
        <div className="chatAvatar chatAvatarFallback">
          {getInitials(data.name)}
        </div>
      )}

      <div className="chatText">

        <h4>{data.name}</h4>

        <p>{data.msg}</p>

      </div>

    </div>
  );
};

export default ConversationItem;