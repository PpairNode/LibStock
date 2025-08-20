// src/pages/LoginPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axiosConfig";
import "./LoginPage.css"

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get("/login");
        if (response.data?.authenticated && response.data.redirect) {
          navigate(response.data.redirect);
        }
      } catch (err) {
        // No-op if not authenticated
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.post("/login", { username, password });
      // Assuming backend responds with { message, redirect }
      const redirectUrl = response.data.redirect || "/dashboard";
      navigate(redirectUrl);
    } catch (err) {
      console.error("Login error:", err);
      if (err.response?.data?.message) {
        setError(`Login failed 1. Please try again. Error: ${err.response.data.message}`);
      } else if (err.response) {
        setError(`Login failed with status ${err.response.status}.`);
      } else if (err.request) {
        setError("No response received from server.");
      } else {
        setError(`Error setting up request: ${err.message}`);
      }
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2 className="login-title">Login</h2>

        {error && <p className="login-error">{error}</p>}

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-input"
          />
        </div>

        <button type="submit" className="login-button">
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
