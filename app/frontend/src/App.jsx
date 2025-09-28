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
import ContainerPage from "./pages/ContainerPage";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get("/user");
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
          <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />

          {/* Private routes */}
          <Route path="/" element={<PrivateRoute><Outlet /></PrivateRoute>}>
            <Route path="/logout" element={<LogoutPage setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/container/:containerId/item" element={<AddItemPage />} />
            <Route path="/container/:containerId/item/update/:id" element={<EditItemPage />} />
            <Route path="/category/add" element={<CategoryPage />} />
            <Route path="/container/add" element={<ContainerPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
