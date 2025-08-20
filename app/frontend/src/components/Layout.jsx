// Layout.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./Layout.css";
import logo from "../logo.svg";

const Layout = ({ children, isAuthenticated }) => {
  return (
    <>
      <header className="App-nav">
        <Link to="/" className="logo-link">
          <img src={logo} alt="Logo" className="nav-logo" />
        </Link>

        <div className="button-group">
          <Link to="/" className="nav-button">Home</Link>
          {!isAuthenticated && (
            <>
                <Link to="/login" className="nav-button">Login</Link>
            </>
          )}
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className="nav-button">Dashboard</Link>
              <Link to="/logout" className="nav-button">Logout</Link>
            </>
          )}
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
