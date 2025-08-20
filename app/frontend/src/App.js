// App.jsx
import React, { useState, useEffect } from "react";
import axios from "./api/axiosConfig";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";

import Layout from "./components/Layout";
import RootPage from "./pages/RootPage";
import ErrorPage from "./pages/ErrorPage";
import LoginPage from "./pages/LoginPage";
import LogoutPage from "./pages/LogoutPage";
import PrivateRoute from "./pages/PrivateRoute";
import DashboardPage from "./pages/DashboardPage";
import AddItemPage from "./pages/AddItemPage";
import EditItemPage from "./pages/EditItemPage";
import CategoryPage from "./pages/CategoryPage";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get("/api/user");
        if (res.status === 200) setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  return (
    <Router>
      <Layout isAuthenticated={isAuthenticated}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<RootPage />} />
          <Route path="/error" element={<ErrorPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Private routes */}
          <Route path="/" element={<PrivateRoute><Outlet /></PrivateRoute>}>
            <Route path="/logout" element={<LogoutPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/item/add" element={<AddItemPage />} />
            <Route path="/item/update/:id" element={<EditItemPage />} />
            <Route path="/category/add" element={<CategoryPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
