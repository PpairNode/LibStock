// src/pages/LogoutPage.jsx
import React, { useEffect } from "react";
import axios from "../api/axiosConfig";
import { useNavigate } from "react-router-dom";

const LogoutPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      try {
        const response = await axios.post("/api/logout");
        console.log(response.data.message);
        navigate("/login");
      } catch (error) {
        console.error("Logout failed:", error.message);
      }
    };

    logout();
  }, [navigate]);

  return <p>Logging out...</p>;
};

export default LogoutPage;
