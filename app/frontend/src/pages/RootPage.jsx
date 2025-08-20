// RootPage.jsx
import React, { useState, useEffect } from "react";
import logo from "../logo.svg";
import "../App.css"


const RootPage = () => {
  const [nyTime, setNyTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const options = {
        timeZone: "America/New_York",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZoneName: "short",
      };
      const time = new Intl.DateTimeFormat("en-US", options).format(new Date());
      setNyTime(time);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App-content">
      <h1>Hello from the root page!</h1>
      <img src={logo} className="App-logo" alt="logo" />
      <p style={{ fontSize: "1.2rem", marginTop: "1rem" }}>
        Current Time in New York: <strong>{nyTime}</strong>
      </p>
    </div>
  );
};

export default RootPage;
