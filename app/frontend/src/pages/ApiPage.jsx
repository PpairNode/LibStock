import React, { useEffect, useState } from "react";
import axios from "../api/axiosConfig";

const ApiPage = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApiData = async () => {
      try {
        const response = await axios.get("/api");

        // Check if the response is HTML instead of JSON
        const contentType = response.headers["content-type"];
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Backend returned HTML instead of JSON — likely offline");
        }

        setData(response.data);
      } catch (err) {
        console.error("API fetch failed:", err.message);
        setError("⚠️ Backend is unavailable. Please try again later.");
      }
    };

    fetchApiData();
  }, []);

  if (error) {
    return (
      <div style={{ color: "red", padding: "1rem" }}>
        <h2>{error}</h2>
      </div>
    );
  }

  if (!data) {
    return <p>Loading...</p>;
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h2>{data.message}</h2>
      <p>Status: {data.status}</p>
    </div>
  );
};

export default ApiPage;
