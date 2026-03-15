import React, { useState } from "react";
import { FaCaretDown } from "react-icons/fa";

const FeedSort = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("Top");
  const options = ["Top", "Recent"];

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    setIsOpen(false);
  };

  return (
    <div className="feedSort">
      <div className="divider"></div>
      <div className="feedSortDropdown">
        <span onClick={() => setIsOpen(!isOpen)}>
          Sort by: <b>{selectedOption}</b> <FaCaretDown />
        </span>
        {isOpen && (
          <ul className="dropdownMenu">
            {options.map((option) => (
              <li key={option} onClick={() => handleOptionClick(option)}>
                {option}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FeedSort;