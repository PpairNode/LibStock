// src/pages/LoginPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "../api/axiosConfig";
import "./LoginPage.css"
import { useTranslation } from 'react-i18next';
import { useAuth } from "../components/AuthContext";


const LoginPage = () => {
  const { setUsername, setIsAuthenticated } = useAuth();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [usernameInput, setUsernameInput] = useState("");
  const { t, i18n } = useTranslation();
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
      const response = await axios.post("/login", { username: usernameInput, password });
      if (response.status === 200) {
        setIsAuthenticated(true);
        setUsername(usernameInput);
        const redirectUrl = response.data.redirect || "/dashboard";
        navigate(redirectUrl);
      }
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
        <h2 className="login-title">{t('login_text')}</h2>

        {error && <p className="login-error">{error}</p>}

        <div className="form-group">
          <label htmlFor="username">{t('username')}</label>
          <input
            id="username"
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            required
            autoFocus
            className="form-input"
          />
        </div>

        <div className="form-group" style={{ position: "relative" }}>
          <label htmlFor="password">{t('password')}</label>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-input"
            style={{ paddingRight: "2.5rem" }}
          />
          <span className="password-toggle" onClick={() => setShowPassword(prev => !prev)}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <button type="submit" className="login-button">
          {t('login')}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
