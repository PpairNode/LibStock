// RootPage.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import '../components/Translation';
import "../App.css"


const RootPage = () => {
  const [nyTime, setNyTime] = useState("");
  const { t } = useTranslation();

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
      <h1>{t('welcome_page_text')}</h1>
      <img src='/logo.svg' className="App-logo" alt="logo" />
      <p style={{ fontSize: "1.2rem", marginTop: "1rem" }}>
        {t('current_time_text')} New York: <strong>{nyTime}</strong>
      </p>
    </div>
  );
};

export default RootPage;
