// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import axios from "../api/axiosConfig";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [username, setUsername] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch username on load
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const response = await axios.get("/user");
        setUsername(response.data.username);
        setIsAuthenticated(true);
      } catch (err) {
        setUsername(null);
        setIsAuthenticated(false);
      }
    };

    fetchUsername();
  }, []);

  return (
    <AuthContext.Provider
      value={{ username, setUsername, isAuthenticated, setIsAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => useContext(AuthContext);
