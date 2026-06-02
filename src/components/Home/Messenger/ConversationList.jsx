import React from "react";
import ConversationItem from "./ConversationItem";

const ConversationList = () => {

  const conversations = [
    { id: "conv-001", name: "Amity University Online", msg: "Want a career boost?" },
    { id: "conv-002", name: "Barsa Priyadarshini", msg: "We are associated with..." },
    { id: "conv-003", name: "Suman Barik", msg: "Ok bhai" },
    { id: "conv-004", name: "Dorka Horváth", msg: "Looking to connect..." },
    { id: "conv-005", name: "Ipsita Priyadarsani", msg: "Hi, Ipsita" },
  ];

  return (
    <div className="conversationList">

      {conversations.map((c) => (
        <ConversationItem key={c.id} data={c} />
      ))}

    </div>
  );
};

export default ConversationList;