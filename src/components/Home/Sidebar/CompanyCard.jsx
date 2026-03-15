import React from "react";

const CompanyCard = () => {
  return (
    <div className="card companyCard">

      <img
        src="https://cdn-icons-png.flaticon.com/512/5968/5968705.png"
        className="companyLogo"
        alt=""
      />

      <h4>Aerial.Vue Corporation</h4>

      <div className="companyStats">
        <div>
          <span>Activity</span>
          <b>0</b>
        </div>

        <div>
          <span>Page visitors</span>
          <b>0</b>
        </div>
      </div>

      <button className="btn">Try Premium Page</button>

      <button className="btnOutline">
        Advertise on LinkedIn
      </button>

    </div>
  );
};

export default CompanyCard;