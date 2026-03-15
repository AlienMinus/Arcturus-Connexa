import React from "react";
import { IoNewspaperSharp } from "react-icons/io5";

const LinkedInNews = () => {
  const news = [
    "Adobe CEO Shantanu Narayen steps...",
    "Top finance experts to follow",
    "Top tech & startup experts to follow",
    "Top marketing experts to follow",
    "Young workforce fuels GCCs"
  ];

  return (
    <div className="card newsCard">

      <h3>LinkedIn News</h3>

      <p className="subTitle">Top stories</p>

      <ul>
        {news.map((item, index) => (
          <li key={index} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <IoNewspaperSharp size={16} style={{ marginTop: "4px", color: "#ce02a2ed" }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <span className="showMore">Show more</span>

    </div>
  );
};

export default LinkedInNews;