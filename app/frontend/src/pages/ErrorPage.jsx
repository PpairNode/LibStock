import React from "react";

const ErrorPage = () => {
  return (
    <div style={{ padding: "2rem", textAlign: "center", color: "darkred" }}>
      <h1>500 — Backend Error</h1>
      <p>Sorry, something went wrong with the server.</p>
    </div>
  );
};

export default ErrorPage;
