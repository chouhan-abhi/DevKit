import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import "./Header.css";
import { INITIAL_TAB_STATE, MoonImage, SunImage } from "../../Utils/constants";

// Utility for unique tab IDs
const generateRandomId = () => Date.now();

// TabBar Component
const TabBar = React.memo(function TabBar({ tabs, activeTabId, onTabClick, onTabClose, onTabAdd }) {
  return (
    <nav className="tabs-bar" aria-label="Tab Bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab${tab.id === activeTabId ? " active" : ""}`}
          tabIndex={0}
          aria-selected={tab.id === activeTabId}
          onClick={() => onTabClick(tab.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onTabClick(tab.id);
          }}
        >
          <span>{tab.title}</span>
          <button
            className="close-btn"
            aria-label={`Close ${tab.title}`}
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
          >
            <b>x</b>
          </button>
        </div>
      ))}
      <button
        className="new-tab-button"
        aria-label="Add new tab"
        onClick={onTabAdd}
      >
        +
      </button>
    </nav>
  );
});

TabBar.propTypes = {
  tabs: PropTypes.array.isRequired,
  activeTabId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onTabClick: PropTypes.func.isRequired,
  onTabClose: PropTypes.func.isRequired,
  onTabAdd: PropTypes.func.isRequired,
};

// DarkModeSwitch Component
const DarkModeSwitch = React.memo(function DarkModeSwitch() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "";
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <button
      className="header-content"
      aria-label="Toggle dark mode"
      onClick={() => setDarkMode((prev) => !prev)}
      style={{ background: "none", border: "none", cursor: "pointer" }}
    >
      <img
        className="toggle-switch"
        src={darkMode ? SunImage : MoonImage}
        alt={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      />
    </button>
  );
});

// Main Header Component
function Header({ tabs, setTabs, activeTabId, setActiveTabId }) {
  const [nextId, setNextId] = useState(2);

  // Add new tab
  const addTab = useCallback(() => {
    const newGeneratedId = generateRandomId();
    const newTab = {
      id: newGeneratedId,
      title: `Tab ${nextId}`,
      content: null,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newGeneratedId);
    setNextId((id) => id + 1);
  }, [nextId, setTabs, setActiveTabId]);

  // Close tab
  const closeTab = useCallback(
    (id) => {
      setTabs((prevTabs) => {
        const updated = prevTabs.filter((tab) => tab.id !== id);
        if (id === activeTabId && updated.length > 0) {
          setActiveTabId(updated[updated.length - 1].id);
        }
        if (updated.length === 0) {
          setActiveTabId(1);
          return [INITIAL_TAB_STATE];
        }
        return updated;
      });
    },
    [activeTabId, setTabs, setActiveTabId]
  );

  // Switch tab
  const handleTabClick = useCallback(
    (id) => setActiveTabId(id),
    [setActiveTabId]
  );

  return (
    <header className="header">
      <div className="tabs-wrapper">
        <span
          className="title"
          tabIndex={0}
          role="link"
          aria-label="DevKit Home"
          onClick={() => window.open("https://github.com/chouhan-abhi/Introduction", "_blank")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") window.open("https://github.com/chouhan-abhi/Introduction", "_blank");
          }}
        >
          DevKit
        </span>
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={handleTabClick}
          onTabClose={closeTab}
          onTabAdd={addTab}
        />
      </div>
      <DarkModeSwitch />
    </header>
  );
}

Header.propTypes = {
  tabs: PropTypes.array.isRequired,
  setTabs: PropTypes.func.isRequired,
  activeTabId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setActiveTabId: PropTypes.func.isRequired,
};

export default Header;
