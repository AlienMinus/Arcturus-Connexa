import React from "react";

const ConversationItem = ({data}) => {
  return (
    <div className="conversationItem">

      <img
        src={`https://i.pravatar.cc/40?u=${data.name}`}
        className="chatAvatar"
        alt=""
      />

      <div className="chatText">

        <h4>{data.name}</h4>

        <p>{data.msg}</p>

      </div>

    </div>
  );
};

export default ConversationItem;