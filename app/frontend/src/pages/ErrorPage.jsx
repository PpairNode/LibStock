import React from "react";
import { useLocation } from "react-router-dom";


const ErrorPage = () => {
  const location = useLocation();
  const message = location.state?.message || "Sorry, something went wrong with the server.";

  return (
    <div style={{ padding: "2rem", textAlign: "center", color: "darkred" }}>
      <h1>500 — Backend Error</h1>
      <p>{message}</p>
    </div>
  );
};

export default ErrorPage;
