// src/components/PrivateRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "../api/axiosConfig";

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get("/api/user");
        setIsAuthenticated(true);
      } catch (err) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) return <p>Loading...</p>;

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
