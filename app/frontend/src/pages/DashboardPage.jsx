// src/pages/DashboardPage.jsx
import React, { useEffect, useState } from "react";
import axios from "../api/axiosConfig";

const DashboardPage = () => {
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get("/api/dashboard");
        setMessage(response.data.message);
        setUsername(response.data.username);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          window.location.href = "/login";
        } else {
          console.error("Error fetching dashboard:", error.message);
        }
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div>
      <h1>{message}</h1>
      <p>Logged in as: {username}</p>
    </div>
  );
};

export default DashboardPage;
