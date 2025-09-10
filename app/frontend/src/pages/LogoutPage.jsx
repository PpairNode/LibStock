// src/pages/LogoutPage.jsx
import React, { useEffect } from "react";
import axios from "../api/axiosConfig";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";


const LogoutPage = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated, setUsername } = useAuth();

  useEffect(() => {
    const logout = async () => {
      try {
        const response = await axios.post("/logout");

        if (response.status === 200) {
          setIsAuthenticated(false);
          setUsername(null);
          navigate("/login");
        }
      } catch (error) {
        console.error("Logout failed:", error.message);
      }
    };

    logout();
  }, [navigate, setIsAuthenticated, setUsername]);

  return <p>Logging out...</p>;
};

export default LogoutPage;
