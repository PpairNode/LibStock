import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ApiPage from "./pages/ApiPage";
import LoginPage from "./pages/LoginPage";
import LogoutPage from "./pages/LogoutPage";
import DashbordPage from "./pages/DashboardPage";
import logo from "./logo.svg"; // adjust path if logo is elsewhere
import "./App.css"; // import the CSS you pasted

const RootPage = () => {
  return (
      <div className="App">
        <div className="button-group">
          <Link to="/login" className="nav-button">Login</Link>
          <Link to="/logout" className="nav-button">Logout</Link>
          <Link to="/dashboard" className="nav-button">Dashboard</Link>
        </div>
        <header className="App-header">
          <h1>Hello from the root page!</h1>
          <img src={logo} className="App-logo" alt="logo" />
        </header>
      </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootPage />} />
        <Route path="/api" element={<ApiPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/dashboard" element={<DashbordPage />} />
      </Routes>
    </Router>
  );
};

export default App;
