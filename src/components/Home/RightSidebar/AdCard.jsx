import React from "react";

const AdCard = () => {
  return (
    <div className="card adCard">

      <img
        src="https://cdn-icons-png.flaticon.com/512/5968/5968705.png"
        className="adLogo"
        alt=""
      />

      <h4>Piraeus</h4>

      <p>
        Manas R., Get the latest on Piraeus News,
        Jobs, and More!
      </p>

      <button className="followBtn">
        Follow
      </button>

    </div>
  );
};

export default AdCard;