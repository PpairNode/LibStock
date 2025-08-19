import React, { useState, useEffect } from "react";
import axios from "./api/axiosConfig";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, Outlet } from "react-router-dom";
import logo from "./logo.svg"; // adjust path if logo is elsewhere
import "./App.css"; // import the CSS you pasted
import ErrorPage from "./pages/ErrorPage";
import LoginPage from "./pages/LoginPage";
import LogoutPage from "./pages/LogoutPage";
import DashbordPage from "./pages/DashboardPage";
import ApiPage from "./pages/ApiPage";
import AddItemPage from "./pages/AddItemPage";
import PrivateRoute from "./pages/PrivateRoute";


const RootPage = () => {
  const [nyTime, setNyTime] = useState("");
  
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
    
    updateTime(); // set immediately
    const interval = setInterval(updateTime, 1000); // update every second
    return () => clearInterval(interval); // cleanup
  }, []);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get("/api/user");
        if (res.status === 200) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  return (
      <div className="App">
        <header className="App-nav">
          <div className="button-group">
            {!isAuthenticated && (
              <Link to="/login" className="nav-button">Login</Link>
            )}
            {isAuthenticated && (
              <Link to="/logout" className="nav-button">Logout</Link>
            )}
            <Link to="/dashboard" className="nav-button">Dashboard</Link>
          </div>
        </header>
        <div className="App-header">
          <h1>Hello from the root page!</h1>
          <img src={logo} className="App-logo" alt="logo" />
          <p style={{ fontSize: "1.2rem", marginTop: "1rem" }}>
            Current Time in New York: <strong>{nyTime}</strong>
          </p>
        </div>
      </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Basic ROUTING (no authentication) */}
        <Route path="/" element={<RootPage />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Private ROUTING (need authentication) */}
        <Route path="/" element={<PrivateRoute><Outlet /></PrivateRoute>}>
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/dashboard" element={<DashbordPage />} />
          <Route path="/api" element={<ApiPage />} />
          <Route path="/api/item/add" element={<AddItemPage />} />
        </Route>

        {/* Catch-all route (last as it uses wildcards) */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
