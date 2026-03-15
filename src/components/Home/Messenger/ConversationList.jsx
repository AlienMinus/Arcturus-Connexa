import React from "react";
import ConversationItem from "./ConversationItem";

const ConversationList = () => {

  const conversations = [
    {name:"Amity University Online", msg:"Want a career boost?"},
    {name:"Barsa Priyadarshini", msg:"We are associated with..."},
    {name:"Suman Barik", msg:"Ok bhai"},
    {name:"Dorka Horváth", msg:"Looking to connect..."},
    {name:"Ipsita Priyadarsani", msg:"Hi, Ipsita"}
  ];

  return (
    <div className="conversationList">

      {conversations.map((c,i)=>(
        <ConversationItem key={i} data={c}/>
      ))}

    </div>
  );
};

export default ConversationList;