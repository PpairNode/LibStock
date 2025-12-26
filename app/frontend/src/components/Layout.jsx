// Layout.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axiosConfig";
import "./Layout.css";
import "../components/Translation";
import { useTranslation } from 'react-i18next';
import { useAuth } from "../components/AuthContext";


const Layout = ({ children }) => {
  const { username, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language-chosen', lng);
  };

  return (
    <>
      <header className="App-nav">
        <Link to="/" className="logo-link">
          <img src='/logo.svg' alt="Logo" className="nav-logo" />
        </Link>

        
        <div className="button-group">
          {isAuthenticated ? (
            <p style={{ color: "white" }} >{t('logged_in_as')}<strong>{username}</strong></p>
          ) : (
            <p style={{ color: "white" }} >{t('not_logged_in')}</p>
          )}

          <Link to="/" className="nav-button"><strong>{t('home')}</strong></Link>
          {!isAuthenticated && (
            <>
                <Link to="/login" className="nav-button"><strong>{t('login')}</strong></Link>
            </>
          )}
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className="nav-button"><strong>{t('dashboard')}</strong></Link>
              <Link to="/logout" className="nav-button"><strong>{t('logout')}</strong></Link>
            </>
          )}

          <p style={{ color: "white"}}>{t('current_language')}</p>
          <button title="English" className="nav-flag-button" onClick={() => changeLanguage('en')}>
            <img src="/flags/us.png" alt="English" style={{ width: '100%', height: '100%' }} />
          </button>
          <button title="French" className="nav-flag-button" onClick={() => changeLanguage('fr')}>
            <img src="/flags/fr.png" alt="French" style={{ width: '100%', height: '100%' }} />
          </button>
        </div>
      </header>

      <main className="App-content">
        {children}
      </main>

      <footer className="App-footer">
        © 2025 LibStock
      </footer>
    </>
  );
};

export default Layout;
